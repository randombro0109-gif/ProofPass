import { ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { progressOf, journeyStatus } from '@/domain/journeyRules';
import { CATEGORY_KEY } from '@/i18n/keys';
import { useAppState } from '@/state/useAppState';
import { Badge } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import type { Journey } from '@/types';
import type { TranslationKey } from '@/i18n/en';

export function JourneyCards({ onOpenJourney }: { onOpenJourney: (journeyId: string) => void }) {
  const { state } = useAppState();
  const { t } = useTranslation();
  if (state.journeys.length === 0) return null;

  const journeys = [...state.journeys].reverse().slice(0, 1);

  return (
    <section aria-labelledby="journeys-heading" className="space-y-4">
      <h2 id="journeys-heading" className="text-xl font-bold">
        {t('home.continue_title')}
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {journeys.map((journey) => (
          <JourneyCard
            key={journey.id}
            journey={journey}
            onOpen={() => onOpenJourney(journey.id)}
            label={t(CATEGORY_KEY[journey.category])}
            percent={progressOf(journey.tasks).percent}
            statusKey={statusKeyFor(journey)}
          />
        ))}
      </div>
    </section>
  );
}

function statusKeyFor(journey: Journey): TranslationKey {
  const status = journeyStatus(journey);
  if (status === 'completed') return 'journey.status_completed';
  if (status === 'awaiting_external') return 'journey.status_awaiting_external';
  return 'journey.status_in_progress';
}

function JourneyCard({
  journey,
  onOpen,
  label,
  percent,
  statusKey,
}: {
  journey: Journey;
  onOpen: () => void;
  label: string;
  percent: number;
  statusKey: TranslationKey;
}) {
  const { t } = useTranslation();
  const completed = Boolean(journey.completedAt);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="card group flex flex-col gap-5 p-6 text-start transition duration-300 hover:-translate-y-0.5 hover:border-active/60"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted">{label}</p>
          <p className="mt-1 font-bold">{journey.originalText}</p>
        </div>
        <Badge tone={completed ? 'mint' : 'gold'}>
          {completed ? <CheckCircle2 size={14} /> : <Clock size={14} />}
          {t(statusKey)}
        </Badge>
      </div>
      <div>
        <div className="mb-2 flex justify-between text-sm text-ink-muted">
          <span>{t('home.continue_status', { percent })}</span>
          <span className="font-mono text-xs">{journey.reference}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-muted" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div
            className={cn('h-full rounded-full transition-all duration-700', completed ? 'bg-mint-fg' : 'bg-action')}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <span className="inline-flex items-center gap-2 text-sm font-bold text-royal">
        {t('home.continue_open')}
        <ArrowRight size={16} className="rtl-flip transition group-hover:translate-x-1" />
      </span>
    </button>
  );
}
