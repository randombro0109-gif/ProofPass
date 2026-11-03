import type { TranslationKey } from '@/i18n/en';
import type {
  Goal,
  Instruction,
  Journey,
  JourneyStage,
  JourneyTask,
  ProofRecord,
  RecordType,
  ContextItem,
} from '@/types';
import { getQuestion, optionLabelKey, visaPath } from './questions';
import { MAX_UNMATCHED_TASKS, matchInstructionLine, splitInstructionLines } from './instructions';
import { advanceTasks } from './journeyRules';

type StageId = 'understand' | 'prepare' | 'apply' | 'submit' | 'confirm';

const STAGES: Record<StageId, { titleKey: TranslationKey; descriptionKey: TranslationKey }> = {
  understand: { titleKey: 'stage.understand.title', descriptionKey: 'stage.understand.desc' },
  prepare: { titleKey: 'stage.prepare.title', descriptionKey: 'stage.prepare.desc' },
  apply: { titleKey: 'stage.apply.title', descriptionKey: 'stage.apply.desc' },
  submit: { titleKey: 'stage.submit.title', descriptionKey: 'stage.submit.desc' },
  confirm: { titleKey: 'stage.confirm.title', descriptionKey: 'stage.confirm.desc' },
};

interface DetailDefinition {
  id: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  inputKind: 'text' | 'contact';
}

const DETAILS: Partial<Record<RecordType, DetailDefinition>> = {
  residential_address: {
    id: 'address',
    titleKey: 'task.address.title',
    descriptionKey: 'task.address.desc',
    inputKind: 'text',
  },
  contact_preference: {
    id: 'contact',
    titleKey: 'task.contact.title',
    descriptionKey: 'task.contact.desc',
    inputKind: 'contact',
  },
  sponsor_details: { id: 'sponsor', titleKey: 'task.sponsor.title', descriptionKey: 'task.sponsor.desc', inputKind: 'text' },
  business_name: { id: 'business', titleKey: 'task.business.title', descriptionKey: 'task.business.desc', inputKind: 'text' },
  academic_history: {
    id: 'academic',
    titleKey: 'task.academic.title',
    descriptionKey: 'task.academic.desc',
    inputKind: 'text',
  },
};

export const PLACEHOLDER_KEYS: Partial<Record<RecordType, TranslationKey>> = {
  residential_address: 'task.address.placeholder',
  sponsor_details: 'task.sponsor.placeholder',
  business_name: 'task.business.placeholder',
  academic_history: 'task.academic.placeholder',
};

type TaskInput = Pick<JourneyTask, 'id' | 'stageId' | 'titleKey' | 'descriptionKey' | 'kind' | 'execution'> &
  Partial<Pick<JourneyTask, 'dependsOn' | 'recordTypes' | 'inputKind'>>;

function task(input: TaskInput): JourneyTask {
  return { dependsOn: [], recordTypes: [], fromInstruction: false, status: 'not_started', ...input };
}

interface Plan {
  stages: StageId[];
  tasks: JourneyTask[];
}

function detailTasks(needed: RecordType[], records: ProofRecord[], stageId: StageId): JourneyTask[] {
  const reusable = needed.filter((type) => records.some((record) => record.type === type && record.reusable));
  const missing = needed.filter((type) => !reusable.includes(type));
  const tasks: JourneyTask[] = [];
  if (reusable.length > 0) {
    tasks.push(
      task({
        id: 'reuse',
        stageId,
        titleKey: 'task.reuse.title',
        descriptionKey: 'task.reuse.desc',
        kind: 'reuse',
        execution: 'digital',
        recordTypes: reusable,
      }),
    );
  }
  for (const type of missing) {
    const detail = DETAILS[type];
    if (!detail) continue;
    tasks.push(
      task({
        id: detail.id,
        stageId,
        titleKey: detail.titleKey,
        descriptionKey: detail.descriptionKey,
        kind: 'provide',
        execution: 'user',
        recordTypes: [type],
        inputKind: detail.inputKind,
      }),
    );
  }
  return tasks;
}

function providerCheck(stageId: StageId): JourneyTask {
  return task({
    id: 'provider',
    stageId,
    titleKey: 'task.provider.title',
    descriptionKey: 'task.provider.desc',
    kind: 'confirm',
    execution: 'user',
  });
}

function closingTasks(prepareDependencies: string[], reviewStage: StageId, submitStage: StageId): JourneyTask[] {
  return [
    task({
      id: 'prepare',
      stageId: 'prepare',
      titleKey: 'task.prepare.title',
      descriptionKey: 'task.prepare.desc',
      kind: 'prepare',
      execution: 'digital',
      dependsOn: prepareDependencies,
    }),
    task({
      id: 'review',
      stageId: reviewStage,
      titleKey: 'task.review.title',
      descriptionKey: 'task.review.desc',
      kind: 'review',
      execution: 'user',
      dependsOn: ['prepare'],
    }),
    task({
      id: 'submit',
      stageId: submitStage,
      titleKey: 'task.submit.title',
      descriptionKey: 'task.submit.desc',
      kind: 'submit',
      execution: 'digital',
      dependsOn: ['review'],
    }),
  ];
}

function decisionTask(id: string, dependsOn: string, stageId: StageId = 'confirm'): JourneyTask {
  return task({
    id,
    stageId,
    titleKey: id === 'appointment' ? 'task.appointment.title' : 'task.decision.title',
    descriptionKey: id === 'appointment' ? 'task.appointment.desc' : 'task.decision.desc',
    kind: 'decision',
    execution: 'external',
    dependsOn: [dependsOn],
  });
}

function prepareDependenciesOf(tasks: JourneyTask[]): string[] {
  return tasks.filter((item) => item.stageId === 'prepare').map((item) => item.id);
}

function visaPlan(goal: Goal, records: ProofRecord[]): Plan {
  const path = visaPath(goal.answers);
  const purpose = path ? goal.answers[`purpose_${path}`] : undefined;
  const sponsor = purpose === 'sponsor' || goal.answers.sponsored === 'yes';
  const needed: RecordType[] = ['residential_address', 'contact_preference'];
  if (sponsor) needed.push('sponsor_details');

  const info = detailTasks(needed, records, 'prepare');
  const confirmations = [
    task({
      id: 'passport',
      stageId: 'prepare',
      titleKey: 'task.passport.title',
      descriptionKey: 'task.passport.desc',
      kind: 'confirm',
      execution: 'user',
    }),
    task({
      id: 'photo',
      stageId: 'prepare',
      titleKey: 'task.photo.title',
      descriptionKey: 'task.photo.desc',
      kind: 'confirm',
      execution: 'user',
    }),
  ];
  const preparing = [...info, ...confirmations];
  const closing = closingTasks(prepareDependenciesOf(preparing), 'apply', 'apply');
  const needsAppointment = path === 'resident' && (purpose === 'new' || purpose === 'renew' || purpose === 'change');
  const tail = needsAppointment
    ? [decisionTask('appointment', 'submit', 'confirm'), decisionTask('decision', 'appointment', 'confirm')]
    : [decisionTask('decision', 'submit', 'confirm')];

  return {
    stages: ['understand', 'prepare', 'apply', 'confirm'],
    tasks: [...preparing, ...closing, ...tail],
  };
}

function housingPlan(_goal: Goal, records: ProofRecord[]): Plan {
  const info = detailTasks(['residential_address', 'contact_preference'], records, 'prepare');
  const closing = closingTasks(prepareDependenciesOf(info), 'submit', 'submit');
  return { stages: ['understand', 'prepare', 'submit'], tasks: [...info, ...closing] };
}

function businessPlan(_goal: Goal, records: ProofRecord[]): Plan {
  const info = [...detailTasks(['business_name', 'contact_preference'], records, 'prepare'), providerCheck('prepare')];
  const closing = closingTasks(prepareDependenciesOf(info), 'apply', 'apply');
  return {
    stages: ['understand', 'prepare', 'apply', 'confirm'],
    tasks: [...info, ...closing, decisionTask('decision', 'submit')],
  };
}

function universityPlan(goal: Goal, records: ProofRecord[]): Plan {
  const info = detailTasks(['academic_history', 'contact_preference'], records, 'prepare');
  const preparing = [
    ...info,
    task({
      id: 'statement',
      stageId: 'prepare',
      titleKey: 'task.statement.title',
      descriptionKey: 'task.statement.desc',
      kind: 'confirm',
      execution: 'user',
    }),
  ];
  if (goal.answers.institution !== 'yes') preparing.push(providerCheck('prepare'));
  const closing = closingTasks(prepareDependenciesOf(preparing), 'apply', 'apply');
  return {
    stages: ['understand', 'prepare', 'apply', 'confirm'],
    tasks: [...preparing, ...closing, decisionTask('decision', 'submit')],
  };
}

function otherPlan(_goal: Goal, records: ProofRecord[]): Plan {
  const info = [...detailTasks(['contact_preference'], records, 'prepare'), providerCheck('prepare')];
  const closing = closingTasks(prepareDependenciesOf(info), 'apply', 'apply');
  return {
    stages: ['understand', 'prepare', 'apply', 'confirm'],
    tasks: [...info, ...closing, decisionTask('decision', 'submit')],
  };
}

const PLANNERS: Record<Goal['category'], (goal: Goal, records: ProofRecord[]) => Plan> = {
  visa: visaPlan,
  housing: housingPlan,
  business: businessPlan,
  university: universityPlan,
  other: otherPlan,
};

function applyInstructions(tasks: JourneyTask[], instructions: Instruction[]): JourneyTask[] {
  const lines = instructions.flatMap((instruction) => splitInstructionLines(instruction.extractedText));
  const working = [...tasks];
  const extra: JourneyTask[] = [];

  lines.forEach((line, index) => {
    const matched = matchInstructionLine(line, working);
    if (matched) {
      matched.fromInstruction = true;
      return;
    }
    if (extra.length >= MAX_UNMATCHED_TASKS) return;
    extra.push({
      ...task({
        id: `instruction-${index}`,
        stageId: 'prepare',
        titleKey: 'task.instruction.verify.title',
        descriptionKey: 'task.instruction.verify.desc',
        kind: 'confirm',
        execution: 'user',
      }),
      detail: line,
      fromInstruction: true,
    });
  });

  const prepare = working.find((item) => item.kind === 'prepare');
  if (prepare) prepare.dependsOn = [...prepare.dependsOn, ...extra.map((item) => item.id)];
  return [...working, ...extra];
}

function buildContext(goal: Goal): ContextItem[] {
  return Object.entries(goal.answers).flatMap(([questionId, value]): ContextItem[] => {
    if (questionId === 'instructions') return [];
    const question = getQuestion(questionId);
    if (!question) return [];
    if (value === 'not_sure') return [{ promptKey: question.promptKey, valueKey: 'common.not_sure' }];
    const labelKey = optionLabelKey(questionId, value);
    if (labelKey) return [{ promptKey: question.promptKey, valueKey: labelKey }];
    return [{ promptKey: question.promptKey, text: value }];
  });
}

export interface BuildJourneyInput {
  goal: Goal;
  records: ProofRecord[];
  instructions: Instruction[];
  journeyId: string;
  reference: string;
  now: string;
}

export interface BuiltJourney {
  journey: Journey;
  autoCompletedIds: string[];
}

export function buildJourney({ goal, records, instructions, journeyId, reference, now }: BuildJourneyInput): BuiltJourney {
  const plan = PLANNERS[goal.category](goal, records);
  const withInstructions = applyInstructions(plan.tasks, instructions);
  const { tasks, autoCompleted } = advanceTasks(withInstructions, now);
  const stages: JourneyStage[] = plan.stages.map((id) => ({ id, ...STAGES[id] }));

  const journey: Journey = {
    id: journeyId,
    goalId: goal.id,
    category: goal.category,
    reference,
    originalText: goal.originalText,
    context: buildContext(goal),
    stages,
    tasks,
    createdAt: now,
    updatedAt: now,
  };

  return { journey, autoCompletedIds: autoCompleted.map((item) => item.id) };
}
