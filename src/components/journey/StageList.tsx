import { Check, ChevronDown, Circle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { nextTask, stageIsDone } from '@/domain/journeyRules';
import { TASK_STATUS_KEY } from '@/i18n/keys';
import { Badge } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import type { Journey } from '@/types';

export function StageList({ journey }: { journey: Journey }) {
  const { t } = useTranslation();
  const currentTaskStageId = nextTask(journey.tasks)?.stageId;
  const activeStageId =
    journey.stages.find((stage) => !stageIsDone(stage.id, journey.tasks))?.id ?? journey.stages[0]?.id ?? null;
  const [openStageId, setOpenStageId] = useState<string | null>(null);
  const shownStageId = openStageId ?? currentTaskStageId ?? activeStageId;

  return (
    <section className="space-y-4" aria-labelledby="journey-stages">
      <h2 id="journey-stages" className="text-xl font-bold">
        {t('journey.stages')}
      </h2>
      <ol className="space-y-3">
        {journey.stages.map((stage, index) => {
          const done = stageIsDone(stage.id, journey.tasks);
          const isCurrent = !done && stage.id === activeStageId;
          const tasks = journey.tasks.filter((task) => task.stageId === stage.id);
          const open = stage.id === shownStageId;
          const panelId = `stage-panel-${stage.id}`;
          return (
            <li
              key={stage.id}
              className={cn('card overflow-hidden transition-shadow duration-200', isCurrent && 'ring-2 ring-active/40', !done && !isCurrent && 'opacity-80')}
            >
              <button
                type="button"
                onClick={() => setOpenStageId(stage.id)}
                aria-expanded={open}
                aria-controls={panelId}
                className="flex w-full items-center justify-between gap-4 p-5 text-start transition hover:bg-surface-muted/60"
              >
                <span className="flex min-w-0 items-center gap-4">
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                      done && 'bg-mint text-mint-fg',
                      isCurrent && 'bg-action text-action-fg',
                      !done && !isCurrent && 'bg-surface-muted text-ink-muted',
                    )}
                  >
                    {done ? <Check size={18} /> : index + 1}
                  </span>
                  <span className="min-w-0 font-bold leading-snug">{t(stage.titleKey)}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <Badge tone={done ? 'mint' : isCurrent ? 'blue' : 'gold'}>
                    {t(done ? 'journey.stage_done' : isCurrent ? 'journey.stage_current' : 'journey.stage_open')}
                  </Badge>
                  <ChevronDown size={18} className={cn('text-ink-muted transition-transform duration-200', open && 'rotate-180')} />
                </span>
              </button>
              {open && (
                <div id={panelId} className="space-y-4 border-t border-line px-5 pb-5 pt-4 animate-fade-in">
                  <p className="text-ink-muted">{t(stage.descriptionKey)}</p>
                  <ul className="space-y-3">
                    {tasks.map((task) => {
                      const taskDone = task.status === 'completed';
                      return (
                        <li key={task.id} className="flex items-start gap-3">
                          <span className={cn('mt-0.5 shrink-0', taskDone ? 'text-mint-fg' : 'text-ink-muted')}>
                            {taskDone ? <Check size={18} /> : <Circle size={16} />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={cn('block font-bold leading-snug', taskDone && 'text-ink-muted line-through')}>
                              {t(task.titleKey)}
                            </span>
                            <span className="text-sm text-ink-muted">{t(TASK_STATUS_KEY[task.status])}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
