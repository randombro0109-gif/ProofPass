import type { TranslationKey } from '@/i18n/en';
import type {
  AppState,
  Category,
  Instruction,
  Journey,
  JourneyTask,
  Language,
  ProofReceipt,
  ReceiptStep,
  RecordType,
  TextSize,
  ThemeMode,
  TrailEvent,
} from '@/types';
import { buildJourney } from '@/domain/journeyBuilder';
import { advanceTasks, completeTask } from '@/domain/journeyRules';
import { categoryFromArea, getQuestion, nextQuestion } from '@/domain/questions';
import { PROOF_KEY_LIFETIME_MS, activeKeyForTask } from '@/domain/proofKey';
import { createInitialState, migrateDemoProfile } from '@/domain/seed';

const TRAIL_LIMIT = 200;
const DISPLAY_NAME_LIMIT = 60;

export type Action =
  | { type: 'app/load'; state: AppState }
  | { type: 'app/reset'; now: string }
  | { type: 'settings/language'; language: Language }
  | { type: 'settings/theme'; theme: ThemeMode }
  | { type: 'settings/textSize'; textSize: TextSize }
  | { type: 'settings/displayName'; displayName: string }
  | { type: 'settings/toggleRecord'; recordId: string; now: string }
  | { type: 'goal/start'; goalId: string; text: string; category: Category; now: string }
  | { type: 'goal/answer'; goalId: string; questionId: string; value: string; now: string }
  | { type: 'goal/revert'; goalId: string; questionId: string; now: string }
  | { type: 'goal/abandon'; goalId: string; now: string }
  | { type: 'instruction/add'; instruction: Instruction; now: string }
  | { type: 'instruction/skip'; goalId: string; now: string }
  | { type: 'research/finish'; goalId: string; journeyId: string; reference: string; now: string }
  | { type: 'task/provide'; journeyId: string; taskId: string; recordId: string; value: string; now: string }
  | { type: 'task/complete'; journeyId: string; taskId: string; now: string }
  | { type: 'proofKey/approve'; journeyId: string; taskId: string; keyId: string; reference: string; now: string }
  | { type: 'proofKey/cancel'; keyId: string; now: string }
  | { type: 'proofKey/use'; keyId: string; now: string }
  | { type: 'proofKey/revoke'; keyId: string; now: string };

function logTrail(state: AppState, event: Omit<TrailEvent, 'id' | 'at'>, now: string): AppState {
  const entry: TrailEvent = { id: `t-${now}-${state.trail.length}`, at: now, ...event };
  return { ...state, trail: [...state.trail, entry].slice(-TRAIL_LIMIT) };
}

function replaceJourney(state: AppState, journey: Journey): AppState {
  return { ...state, journeys: state.journeys.map((item) => (item.id === journey.id ? journey : item)) };
}

function findJourney(state: AppState, journeyId: string): Journey | undefined {
  return state.journeys.find((item) => item.id === journeyId);
}

function receiptStep(task: JourneyTask): ReceiptStep {
  return {
    titleKey: task.titleKey,
    execution: task.execution,
    authorityKey: task.execution === 'external' ? 'receipt.authority_confirm' : undefined,
  };
}

function buildReceipt(journey: Journey, state: AppState, now: string, isFinal: boolean): ProofReceipt {
  const completed = journey.tasks.filter((task) => task.status === 'completed');
  const recordTypes = [...new Set(completed.flatMap((task) => task.recordTypes))] as RecordType[];
  return {
    id: `receipt-${journey.id}`,
    journeyId: journey.id,
    reference: journey.reference,
    goalText: journey.originalText,
    category: journey.category,
    completedAt: now,
    isFinal,
    stageTitleKeys: journey.stages.map((stage) => stage.titleKey),
    recordTypes,
    permissions: state.proofKeys
      .filter((key) => key.journeyId === journey.id && key.status === 'used' && key.usedAt)
      .map((key) => ({ reference: key.reference, usedAt: key.usedAt as string })),
    completedSteps: completed.filter((task) => task.kind !== 'prepare').map(receiptStep),
    pendingSteps: journey.tasks
      .filter((task) => task.status !== 'completed' && task.execution !== 'external')
      .map(receiptStep),
    externalSteps: journey.tasks
      .filter((task) => task.status !== 'completed' && task.execution === 'external')
      .map(receiptStep),
  };
}

function checkpointIfReady(state: AppState, journeyId: string, now: string): AppState {
  const journey = findJourney(state, journeyId);
  if (!journey || journey.completedAt) return state;
  const internalDone = journey.tasks
    .filter((task) => task.execution !== 'external')
    .every((task) => task.status === 'completed');
  if (!internalDone) return state;

  const isFinal = journey.tasks.every((task) => task.status === 'completed');
  const isNew = !state.receipts.some((receipt) => receipt.journeyId === journeyId);
  const current: Journey = isFinal ? { ...journey, completedAt: now, updatedAt: now } : journey;
  const withJourney = replaceJourney(state, current);
  const receipt = buildReceipt(current, withJourney, now, isFinal);
  const withReceipt = {
    ...withJourney,
    receipts: [...withJourney.receipts.filter((item) => item.journeyId !== journeyId), receipt],
  };
  if (isFinal) return logTrail(withReceipt, { key: 'trail.completed', journeyId }, now);
  if (isNew) return logTrail(withReceipt, { key: 'trail.checkpoint', journeyId }, now);
  return withReceipt;
}

function refreshReceipt(state: AppState, journeyId: string, now: string): AppState {
  const withoutReceipt = { ...state, receipts: state.receipts.filter((receipt) => receipt.journeyId !== journeyId) };
  return checkpointIfReady(withoutReceipt, journeyId, now);
}

function reopenFrom(tasks: JourneyTask[], taskId: string): JourneyTask[] {
  const reopened = new Set<string>([taskId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const task of tasks) {
      if (!reopened.has(task.id) && task.dependsOn.some((id) => reopened.has(id))) {
        reopened.add(task.id);
        grew = true;
      }
    }
  }
  return tasks.map((task) => {
    if (!reopened.has(task.id)) return task;
    if (task.id === taskId) return { ...task, status: 'waiting_for_user' as const, completedAt: undefined };
    return { ...task, status: 'not_started' as const, completedAt: undefined };
  });
}

function completeInJourney(state: AppState, journeyId: string, taskId: string, now: string): AppState {
  const journey = findJourney(state, journeyId);
  if (!journey) return state;
  const { tasks, autoCompleted } = advanceTasks(completeTask(journey.tasks, taskId, now), now);
  let next = replaceJourney(state, { ...journey, tasks, updatedAt: now });
  if (autoCompleted.length > 0) next = logTrail(next, { key: 'trail.prepared', journeyId }, now);
  return next;
}

function updateGoal(state: AppState, goalId: string, change: (goal: AppState['goals'][number]) => AppState['goals'][number]): AppState {
  return { ...state, goals: state.goals.map((goal) => (goal.id === goalId ? change(goal) : goal)) };
}

function answerGoal(state: AppState, action: Extract<Action, { type: 'goal/answer' }>): AppState {
  const goal = state.goals.find((item) => item.id === action.goalId);
  const value = action.value.trim();
  if (!goal || !value) return state;
  if (goal.status !== 'intake' && goal.status !== 'instructions') return state;
  if (nextQuestion(goal.category, goal.answers)?.id !== action.questionId) return state;

  const answers = { ...goal.answers, [action.questionId]: value };
  const category = action.questionId === 'area' ? categoryFromArea(value) : goal.category;
  const status = action.questionId === 'instructions' ? (value === 'yes' ? 'instructions' : 'researching') : 'intake';
  let next = updateGoal(state, goal.id, (item) => ({ ...item, answers, category, status }));

  if (action.questionId === 'instructions' && value !== 'yes') {
    return logTrail(next, { key: 'trail.instructions_skipped' }, action.now);
  }
  if (action.questionId !== 'instructions') {
    const question = getQuestion(action.questionId);
    if (question) next = logTrail(next, { key: 'trail.answer', labelParams: { question: question.promptKey } }, action.now);
  }
  return next;
}

function revertGoal(state: AppState, action: Extract<Action, { type: 'goal/revert' }>): AppState {
  const goal = state.goals.find((item) => item.id === action.goalId);
  if (!goal) return state;
  const keys = Object.keys(goal.answers);
  const index = keys.indexOf(action.questionId);
  if (index === -1) return state;

  const removed = keys.slice(index);
  const answers = Object.fromEntries(keys.slice(0, index).map((key) => [key, goal.answers[key]]));
  const category = removed.includes('area') ? 'other' : goal.category;
  let next = updateGoal(state, goal.id, (item) => ({
    ...item,
    answers,
    category,
    status: 'intake',
  }));
  if (removed.includes('instructions')) {
    next = { ...next, instructions: next.instructions.filter((item) => item.goalId !== goal.id) };
  }
  return next;
}

function provideInTask(state: AppState, action: Extract<Action, { type: 'task/provide' }>): AppState {
  const journey = findJourney(state, action.journeyId);
  const task = journey?.tasks.find((item) => item.id === action.taskId);
  const value = action.value.trim();
  if (!journey || !task || !value) return state;
  if (task.kind !== 'provide' || task.status !== 'waiting_for_user') return state;

  const type = task.recordTypes[0];
  const record = {
    id: action.recordId,
    type,
    value,
    source: 'provided' as const,
    verification: 'self_declared' as const,
    reusable: true,
    updatedAt: action.now,
  };
  const withRecord = {
    ...state,
    records: [...state.records.filter((item) => item.type !== type), record],
  };
  const saved = logTrail(
    withRecord,
    { key: 'trail.record_saved', journeyId: journey.id, labelParams: { type: `record.${type}` as TranslationKey } },
    action.now,
  );
  return completeInJourney(saved, journey.id, task.id, action.now);
}

function approveKey(state: AppState, action: Extract<Action, { type: 'proofKey/approve' }>): AppState {
  const journey = findJourney(state, action.journeyId);
  const task = journey?.tasks.find((item) => item.id === action.taskId);
  const nowMs = Date.parse(action.now);
  if (!journey || !task || (task.kind !== 'reuse' && task.kind !== 'submit')) return state;
  if (!['waiting_for_user', 'needs_attention', 'ready_for_review'].includes(task.status)) return state;
  if (activeKeyForTask(state.proofKeys, journey.id, task.id, nowMs)) return state;

  const key = {
    id: action.keyId,
    reference: action.reference,
    journeyId: journey.id,
    taskId: task.id,
    recordTypes: task.recordTypes,
    status: 'active' as const,
    createdAt: action.now,
    expiresAt: new Date(nowMs + PROOF_KEY_LIFETIME_MS).toISOString(),
  };
  const withKey = { ...state, proofKeys: [...state.proofKeys, key] };
  const tasks = journey.tasks.map((item) =>
    item.id === task.id ? { ...item, status: 'waiting_for_user' as const } : item,
  );
  const updated = replaceJourney(withKey, { ...journey, tasks, updatedAt: action.now });
  return logTrail(updated, { key: 'trail.key_approved', journeyId: journey.id }, action.now);
}

function cancelKey(state: AppState, action: Extract<Action, { type: 'proofKey/cancel' }>): AppState {
  const key = state.proofKeys.find((item) => item.id === action.keyId);
  if (!key || key.status !== 'active') return state;

  const proofKeys = state.proofKeys.map((item) =>
    item.id === key.id ? { ...item, status: 'cancelled' as const, cancelledAt: action.now } : item,
  );
  const journey = findJourney(state, key.journeyId);
  let next: AppState = { ...state, proofKeys };
  if (journey) {
    const tasks = journey.tasks.map((item) =>
      item.id === key.taskId && item.status === 'waiting_for_user'
        ? { ...item, status: 'needs_attention' as const }
        : item,
    );
    next = replaceJourney(next, { ...journey, tasks, updatedAt: action.now });
  }
  return logTrail(next, { key: 'trail.key_cancelled', journeyId: key.journeyId }, action.now);
}

function useKey(state: AppState, action: Extract<Action, { type: 'proofKey/use' }>): AppState {
  const key = state.proofKeys.find((item) => item.id === action.keyId);
  if (!key || key.status !== 'active' || Date.parse(key.expiresAt) <= Date.parse(action.now)) return state;
  const journey = findJourney(state, key.journeyId);
  const task = journey?.tasks.find((item) => item.id === key.taskId);
  if (!journey || !task || (task.status !== 'waiting_for_user' && task.status !== 'needs_attention')) return state;
  if (key.recordTypes.some((type) => state.records.some((record) => record.type === type && !record.reusable))) return state;

  const proofKeys = state.proofKeys.map((item) =>
    item.id === key.id ? { ...item, status: 'used' as const, usedAt: action.now } : item,
  );
  let next = logTrail({ ...state, proofKeys }, { key: 'trail.key_used', journeyId: journey.id }, action.now);
  next = logTrail(next, { key: 'trail.reused', journeyId: journey.id }, action.now);
  next =
    task.kind === 'reuse'
      ? completeInJourney(next, journey.id, task.id, action.now)
      : completeTaskAction(next, { type: 'task/complete', journeyId: journey.id, taskId: task.id, now: action.now });
  return checkpointIfReady(next, journey.id, action.now);
}

function revokeKey(state: AppState, action: Extract<Action, { type: 'proofKey/revoke' }>): AppState {
  const key = state.proofKeys.find((item) => item.id === action.keyId);
  if (!key || key.status !== 'used') return state;
  const journey = findJourney(state, key.journeyId);
  if (!journey || journey.submittedAt) return state;

  const proofKeys = state.proofKeys.map((item) =>
    item.id === key.id ? { ...item, status: 'revoked' as const, revokedAt: action.now } : item,
  );
  const tasks = reopenFrom(journey.tasks, key.taskId);
  const updated = replaceJourney(
    { ...state, proofKeys },
    { ...journey, tasks, completedAt: undefined, updatedAt: action.now },
  );
  const logged = logTrail(updated, { key: 'trail.key_revoked', journeyId: journey.id }, action.now);
  return refreshReceipt(logged, journey.id, action.now);
}

function completeTaskAction(state: AppState, action: Extract<Action, { type: 'task/complete' }>): AppState {
  const journey = findJourney(state, action.journeyId);
  const task = journey?.tasks.find((item) => item.id === action.taskId);
  if (!journey || !task) return state;
  if (task.kind === 'reuse' || task.kind === 'provide' || task.kind === 'prepare') return state;
  const actionable = ['waiting_for_user', 'ready_for_review', 'waiting_external'].includes(task.status);
  if (!actionable) return state;

  let next = completeInJourney(state, journey.id, task.id, action.now);
  if (task.kind === 'submit') {
    next = replaceJourney(next, { ...findJourney(next, journey.id)!, submittedAt: action.now });
    next = logTrail(next, { key: 'trail.submitted', journeyId: journey.id }, action.now);
  } else if (task.kind === 'decision') {
    next = logTrail(next, { key: 'trail.decision', journeyId: journey.id }, action.now);
  } else {
    next = logTrail(next, { key: 'trail.task_done', journeyId: journey.id, labelParams: { task: task.titleKey } }, action.now);
  }
  return checkpointIfReady(next, journey.id, action.now);
}

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'app/load':
      return migrateDemoProfile(action.state);

    case 'app/reset': {
      const fresh = createInitialState(action.now);
      return { ...fresh, language: state.language, theme: state.theme, textSize: state.textSize };
    }

    case 'settings/language':
      return { ...state, language: action.language };

    case 'settings/theme':
      return { ...state, theme: action.theme };

    case 'settings/textSize':
      return { ...state, textSize: action.textSize };

    case 'settings/displayName':
      return { ...state, displayName: action.displayName.trim().slice(0, DISPLAY_NAME_LIMIT) };

    case 'settings/toggleRecord':
      return {
        ...state,
        records: state.records.map((record) =>
          record.id === action.recordId ? { ...record, reusable: !record.reusable, updatedAt: action.now } : record,
        ),
      };

    case 'goal/start': {
      const text = action.text.trim();
      if (!text) return state;
      const goal = {
        id: action.goalId,
        originalText: text,
        category: action.category,
        answers: {},
        status: 'intake' as const,
        createdAt: action.now,
      };
      return logTrail({ ...state, goals: [...state.goals, goal] }, { key: 'trail.goal_created', params: { goal: text } }, action.now);
    }

    case 'goal/answer':
      return answerGoal(state, action);

    case 'goal/revert':
      return revertGoal(state, action);

    case 'goal/abandon': {
      const goal = state.goals.find((item) => item.id === action.goalId);
      if (!goal || goal.status === 'journeyed' || goal.status === 'abandoned') return state;
      const updated = updateGoal(state, goal.id, (item) => ({ ...item, status: 'abandoned' }));
      return logTrail(updated, { key: 'trail.goal_abandoned' }, action.now);
    }

    case 'instruction/add': {
      const goal = state.goals.find((item) => item.id === action.instruction.goalId);
      if (!goal || goal.status !== 'instructions') return state;
      const sourceKey: TranslationKey = action.instruction.sourceType === 'file' ? 'trail.source_upload' : 'trail.source_paste';
      const withInstruction = updateGoal(
        { ...state, instructions: [...state.instructions, action.instruction] },
        goal.id,
        (item) => ({ ...item, status: 'researching' }),
      );
      return logTrail(withInstruction, { key: 'trail.instructions_added', labelParams: { source: sourceKey } }, action.now);
    }

    case 'instruction/skip': {
      const goal = state.goals.find((item) => item.id === action.goalId);
      if (!goal || goal.status !== 'instructions') return state;
      const updated = updateGoal(state, goal.id, (item) => ({ ...item, status: 'researching' }));
      return logTrail(updated, { key: 'trail.instructions_skipped' }, action.now);
    }

    case 'research/finish': {
      const goal = state.goals.find((item) => item.id === action.goalId);
      if (!goal || goal.status !== 'researching') return state;
      const { journey } = buildJourney({
        goal,
        records: state.records,
        instructions: state.instructions.filter((item) => item.goalId === goal.id),
        journeyId: action.journeyId,
        reference: action.reference,
        now: action.now,
      });
      const withJourney = { ...state, journeys: [...state.journeys, journey] };
      const journeyed = updateGoal(withJourney, goal.id, (item) => ({ ...item, status: 'journeyed' }));
      return logTrail(journeyed, { key: 'trail.journey_created', journeyId: journey.id, params: { reference: journey.reference } }, action.now);
    }

    case 'task/provide':
      return provideInTask(state, action);

    case 'task/complete':
      return completeTaskAction(state, action);

    case 'proofKey/approve':
      return approveKey(state, action);

    case 'proofKey/cancel':
      return cancelKey(state, action);

    case 'proofKey/use':
      return useKey(state, action);

    case 'proofKey/revoke':
      return revokeKey(state, action);
  }
}
