import { useTranslation } from '@/hooks/useTranslation';
import { nextTask } from '@/domain/journeyRules';
import { TaskCard } from '@/components/journey/TaskCard';
import type { Journey } from '@/types';

export function NextAction({ journey }: { journey: Journey }) {
  const { t } = useTranslation();
  const next = nextTask(journey.tasks);
  const stage = next ? journey.stages.find((item) => item.id === next.stageId) : undefined;

  return (
    <section className="space-y-4" aria-labelledby="next-action">
      <div className="space-y-2">
        {stage && <p className="text-sm font-bold text-royal">{t(stage.titleKey)}</p>}
        <h2 id="next-action" className="text-2xl font-bold leading-snug sm:text-3xl">
          {t('journey.next_action')}
        </h2>
      </div>
      {next ? (
        <TaskCard key={next.id} journey={journey} task={next} defaultOpen />
      ) : (
        <div className="card p-6 text-sm text-ink-muted">{t('journey.next_none')}</div>
      )}
    </section>
  );
}
