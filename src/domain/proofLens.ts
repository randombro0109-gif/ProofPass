import type { Journey, JourneyTask, ProofRecord } from '@/types';
import { nextTask, progressOf } from '@/domain/journeyRules';

export interface LensSummary {
  percent: number;
  available: ProofRecord[];
  missing: JourneyTask[];
  permissionTasks: JourneyTask[];
  next?: JourneyTask;
}

export function buildLens(journey: Journey, records: ProofRecord[]): LensSummary {
  const neededTypes = new Set(journey.tasks.flatMap((task) => (task.status === 'completed' ? [] : task.recordTypes)));
  const available = records.filter((record) => record.reusable && neededTypes.has(record.type));
  const missing = journey.tasks.filter((task) => task.kind === 'provide' && task.status !== 'completed');
  const permissionTasks = journey.tasks.filter(
    (task) => task.kind === 'reuse' && (task.status === 'waiting_for_user' || task.status === 'needs_attention'),
  );
  return {
    percent: progressOf(journey.tasks).percent,
    available,
    missing,
    permissionTasks,
    next: nextTask(journey.tasks),
  };
}
