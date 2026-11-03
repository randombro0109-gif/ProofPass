import { Check, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { createId, createReference } from '@/state/ids';
import { useAppState } from '@/state/useAppState';
import { cn } from '@/lib/cn';
import type { Goal } from '@/types';
import type { TranslationKey } from '@/i18n/en';

const STEPS: TranslationKey[] = [
  'research.step_understand',
  'research.step_requirements',
  'research.step_services',
  'research.step_sequence',
  'research.step_digital',
];

const STEP_MS = 900;
const FINISH_MS = 500;

export function ResearchProgress({ goal, onOpenJourney }: { goal: Goal; onOpenJourney: (journeyId: string) => void }) {
  const { dispatch } = useAppState();
  const { t } = useTranslation();
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    if (completed < STEPS.length) {
      const timer = window.setTimeout(() => setCompleted((count) => count + 1), STEP_MS);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      const journeyId = createId('journey');
      dispatch({
        type: 'research/finish',
        goalId: goal.id,
        journeyId,
        reference: createReference(),
        now: new Date().toISOString(),
      });
      onOpenJourney(journeyId);
    }, FINISH_MS);
    return () => window.clearTimeout(timer);
  }, [completed, dispatch, goal.id, onOpenJourney]);

  const percent = Math.round((completed / STEPS.length) * 100);

  return (
    <div className="mx-auto max-w-xl space-y-8 animate-fade-up">
      <header className="space-y-3 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">{t('research.title')}</h1>
        <p className="text-sm leading-relaxed text-ink-muted">{t('research.disclaimer')}</p>
      </header>

      <div className="h-2 overflow-hidden rounded-full bg-surface-muted" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-action transition-all duration-700" style={{ width: `${percent}%` }} />
      </div>

      <ol className="card divide-y divide-line p-2">
        {STEPS.map((key, index) => {
          const done = index < completed;
          const active = index === completed;
          return (
            <li key={key} className="flex items-center gap-4 px-4 py-4">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300',
                  done ? 'bg-mint text-mint-fg' : active ? 'bg-active/15 text-action' : 'bg-surface-muted text-ink-muted',
                )}
              >
                {done ? <Check size={16} /> : active ? <Loader2 size={16} className="animate-spin" /> : index + 1}
              </span>
              <span className={cn('text-sm font-bold', done || active ? 'text-ink' : 'text-ink-muted')}>{t(key)}</span>
              {done && <span className="ms-auto text-xs font-bold text-mint-fg">{t('research.done')}</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
