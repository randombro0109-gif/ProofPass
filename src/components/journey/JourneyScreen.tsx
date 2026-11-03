import { ArrowRight, ChevronDown, Receipt } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { journeyStatus, progressOf } from '@/domain/journeyRules';
import { CATEGORY_KEY } from '@/i18n/keys';
import { formatDateTime } from '@/lib/format';
import { useAppState } from '@/state/useAppState';
import { Button, Badge, Modal } from '@/components/ui/primitives';
import { StageList } from '@/components/journey/StageList';
import { NextAction } from '@/components/journey/NextAction';
import { ProofLensPanel } from '@/components/journey/ProofLensPanel';
import { PermissionsPanel } from '@/components/journey/PermissionsPanel';
import { ProofTrailPanel } from '@/components/journey/ProofTrailPanel';
import { ProofReceiptModal } from '@/components/receipt/ProofReceiptModal';
import { cn } from '@/lib/cn';
import type { Journey } from '@/types';
import type { TranslationKey } from '@/i18n/en';

export function JourneyScreen({
  selectedId,
  onSelect,
  onStart,
}: {
  selectedId: string | null;
  onSelect: (journeyId: string) => void;
  onStart: () => void;
}) {
  const { state } = useAppState();
  const { t, language } = useTranslation();
  const [showReceipt, setShowReceipt] = useState(false);

  const journeys = useMemo(() => [...state.journeys].reverse(), [state.journeys]);
  const journey = journeys.find((item) => item.id === selectedId) ?? journeys[0];

  if (!journey) {
    return (
      <div className="card mx-auto max-w-lg space-y-4 p-10 text-center animate-fade-up">
        <h1 className="text-2xl font-bold">{t('journey.empty_title')}</h1>
        <p className="text-sm leading-relaxed text-ink-muted">{t('journey.empty_body')}</p>
        <Button onClick={onStart}>
          {t('journey.empty_cta')}
          <ArrowRight size={16} className="rtl-flip" />
        </Button>
      </div>
    );
  }

  const receipt = state.receipts.find((item) => item.journeyId === journey.id);
  const progress = progressOf(journey.tasks);
  const status = journeyStatus(journey);
  const statusKey: TranslationKey =
    status === 'completed'
      ? 'journey.status_completed'
      : status === 'awaiting_external'
        ? 'journey.status_awaiting_external'
        : 'journey.status_in_progress';

  return (
    <div className="space-y-8 animate-fade-up">
      {journeys.length > 1 && (
        <nav aria-label={t('journey.switch')} className="flex gap-2 overflow-x-auto pb-1">
          {journeys.map((item) => (
            <JourneyChip key={item.id} journey={item} active={item.id === journey.id} onSelect={onSelect} />
          ))}
        </nav>
      )}

      <header className="card flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-bold text-royal">{t(CATEGORY_KEY[journey.category])}</p>
          <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{journey.originalText}</h1>
          <p className="text-sm text-ink-muted">
            {t('journey.reference')}: <span className="font-mono font-bold text-ink">{journey.reference}</span>
            {' · '}
            {t('journey.started', { time: formatDateTime(journey.createdAt, language) })}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Badge tone={status === 'completed' ? 'mint' : status === 'awaiting_external' ? 'gold' : 'blue'}>
              {t(statusKey)}
            </Badge>
            <span className="text-sm text-ink-muted">{t('journey.progress', { done: progress.done, total: progress.total })}</span>
          </div>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-64">
          <div className="h-2 overflow-hidden rounded-full bg-surface-muted" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100}>
            <div
              className={cn('h-full rounded-full transition-all duration-700', status === 'completed' ? 'bg-mint-fg' : 'bg-action')}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          {receipt && (
            <Button variant="secondary" onClick={() => setShowReceipt(true)}>
              <Receipt size={16} />
              {t('journey.view_receipt')}
            </Button>
          )}
        </div>
      </header>

      <NextAction journey={journey} />

      <details className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-bold transition hover:bg-surface-muted/60 [&::-webkit-details-marker]:hidden">
          {t('journey.full_view')}
          <ChevronDown size={18} className="shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="space-y-8 border-t border-line bg-canvas p-5 sm:p-6">
          <StageList journey={journey} />
          <ProofLensPanel journey={journey} />
          <PermissionsPanel journey={journey} />
          <ProofTrailPanel journeyId={journey.id} />
          <p className="text-xs leading-relaxed text-ink-muted">{t('journey.note')}</p>
        </div>
      </details>

      {showReceipt && receipt && (
        <Modal title={t('receipt.title')} onClose={() => setShowReceipt(false)} wide>
          <ProofReceiptModal receipt={receipt} onClose={() => setShowReceipt(false)} />
        </Modal>
      )}
    </div>
  );
}

function JourneyChip({ journey, active, onSelect }: { journey: Journey; active: boolean; onSelect: (id: string) => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={() => onSelect(journey.id)}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition duration-200',
        active ? 'border-royal bg-royal text-royal-fg' : 'border-line bg-surface text-ink-muted hover:text-ink',
      )}
    >
      {t(CATEGORY_KEY[journey.category])} · {journey.reference}
    </button>
  );
}
