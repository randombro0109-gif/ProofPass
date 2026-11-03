import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppState } from '@/state/useAppState';
import { trailMessage } from '@/i18n/eventText';
import { formatDateTime } from '@/lib/format';

const PREVIEW_COUNT = 4;

export function ProofTrailPanel({ journeyId }: { journeyId?: string }) {
  const { state } = useAppState();
  const { t, language } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const events = state.trail.filter((event) => !journeyId || !event.journeyId || event.journeyId === journeyId).slice().reverse();
  const visible = expanded ? events : events.slice(0, PREVIEW_COUNT);

  return (
    <section className="card space-y-5 p-6" aria-labelledby="proof-trail-title">
      <h2 id="proof-trail-title" className="text-lg font-bold">
        {t('trail.title')}
      </h2>

      {events.length === 0 ? (
        <p className="text-sm leading-relaxed text-ink-muted">{t('trail.empty')}</p>
      ) : (
        <ol className="space-y-4">
          {visible.map((event) => (
            <li key={event.id} className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm leading-relaxed">{trailMessage(event, t)}</p>
                <p className="text-xs text-ink-muted">{formatDateTime(event.at, language)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {events.length > PREVIEW_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="text-sm font-bold text-royal transition hover:text-active"
        >
          {expanded ? t('trail.show_less') : t('trail.show_all')}
        </button>
      )}
    </section>
  );
}
