import type { Journey, JourneyTask, TaskStatus } from '@/types';

const ACTIONABLE: TaskStatus[] = ['waiting_for_user', 'needs_attention', 'ready_for_review', 'waiting_external'];

export function dependenciesDone(task: JourneyTask, tasks: JourneyTask[]): boolean {
  return task.dependsOn.every((id) => tasks.find((candidate) => candidate.id === id)?.status === 'completed');
}

export function isActionable(task: JourneyTask): boolean {
  return ACTIONABLE.includes(task.status);
}

export function nextTask(tasks: JourneyTask[]): JourneyTask | undefined {
  return tasks.find((task) => task.status !== 'completed' && isActionable(task));
}

export function advanceTasks(
  tasks: JourneyTask[],
  now: string,
): { tasks: JourneyTask[]; autoCompleted: JourneyTask[] } {
  let current = tasks;
  const autoCompleted: JourneyTask[] = [];
  let changed = true;

  while (changed) {
    changed = false;
    const snapshot = current;
    current = snapshot.map((task) => {
      if (task.status !== 'not_started' || !dependenciesDone(task, snapshot)) return task;
      changed = true;
      if (task.kind === 'prepare') {
        const completed = { ...task, status: 'completed' as const, completedAt: now };
        autoCompleted.push(completed);
        return completed;
      }
      if (task.execution === 'external') return { ...task, status: 'waiting_external' as const };
      if (task.kind === 'submit') return { ...task, status: 'ready_for_review' as const };
      return { ...task, status: 'waiting_for_user' as const };
    });
  }

  return { tasks: current, autoCompleted };
}

export function completeTask(tasks: JourneyTask[], taskId: string, now: string): JourneyTask[] {
  return tasks.map((task) =>
    task.id === taskId ? { ...task, status: 'completed' as const, completedAt: now } : task,
  );
}

export function journeyStatus(journey: Journey): 'completed' | 'awaiting_external' | 'in_progress' {
  if (journey.completedAt) return 'completed';
  if (journey.tasks.some((task) => task.status === 'waiting_external')) return 'awaiting_external';
  return 'in_progress';
}

export function progressOf(tasks: JourneyTask[]): { done: number; total: number; percent: number } {
  const done = tasks.filter((task) => task.status === 'completed').length;
  const total = tasks.length;
  return { done, total, percent: total === 0 ? 100 : Math.round((done / total) * 100) };
}

export function stageIsDone(stageId: string, tasks: JourneyTask[]): boolean {
  const stageTasks = tasks.filter((task) => task.stageId === stageId);
  return stageTasks.every((task) => task.status === 'completed');
}
