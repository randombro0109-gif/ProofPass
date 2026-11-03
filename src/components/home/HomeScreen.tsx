import { ArrowRight, Sparkles } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { classifyGoal } from '@/domain/classify';
import { useTranslation } from '@/hooks/useTranslation';
import { createId } from '@/state/ids';
import { useAppState } from '@/state/useAppState';
import { Button } from '@/components/ui/primitives';
import { IntakeFlow } from '@/components/intake/IntakeFlow';
import { JourneyCards } from '@/components/home/JourneyCards';
import { ProofTrailPanel } from '@/components/journey/ProofTrailPanel';
import type { TranslationKey } from '@/i18n/en';

const EXAMPLES: TranslationKey[] = ['home.example.move', 'home.example.visa', 'home.example.business', 'home.example.university'];

const ACTIVE_GOAL_STATUSES = ['intake', 'instructions', 'researching'];

export function HomeScreen({ onOpenJourney }: { onOpenJourney: (journeyId: string) => void }) {
  const { state, dispatch } = useAppState();
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [error, setError] = useState<TranslationKey | null>(null);

  const pendingGoal = [...state.goals].reverse().find((goal) => ACTIVE_GOAL_STATUSES.includes(goal.status));
  if (pendingGoal) return <IntakeFlow goal={pendingGoal} onOpenJourney={onOpenJourney} />;

  const submit = (goalText: string) => {
    const trimmed = goalText.trim();
    if (!trimmed) {
      setError('home.empty_input');
      return;
    }
    dispatch({
      type: 'goal/start',
      goalId: createId('goal'),
      text: trimmed,
      category: classifyGoal(trimmed),
      now: new Date().toISOString(),
    });
    setText('');
    setError(null);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit(text);
  };

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl bg-royal px-6 py-12 text-royal-fg animate-fade-up sm:px-12 sm:py-16">
        <div className="pointer-events-none absolute -end-24 -top-24 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
            <Sparkles size={14} />
            {t('common.tagline')}
          </p>
          <p className="mb-2 text-base font-bold text-royal-fg/85">
            {t('home.greeting', { name: state.displayName.split(' ')[0] })}
          </p>
          <h1 className="text-3xl font-bold sm:text-5xl">{t('home.title')}</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-royal-fg/85 sm:text-lg">{t('home.subtitle')}</p>

          <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row" noValidate>
            <label className="sr-only" htmlFor="goal-input">
              {t('home.placeholder')}
            </label>
            <input
              id="goal-input"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={t('home.placeholder')}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'goal-error' : undefined}
              className="min-h-14 flex-1 rounded-2xl border-0 bg-surface px-5 text-base text-ink shadow-pop placeholder:text-ink-muted/70 focus:outline-none focus:ring-4 focus:ring-accent/40"
            />
            <Button type="submit" variant="secondary" className="min-h-14 border-0 px-7 text-royal">
              {t('home.cta')}
              <ArrowRight size={18} className="rtl-flip" />
            </Button>
          </form>
          {error && (
            <p id="goal-error" role="alert" className="mt-3 text-sm font-bold text-white">
              {t(error)}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="sr-only">{t('home.examples')}</span>
            {EXAMPLES.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setText(t(key));
                  setError(null);
                }}
                className="rounded-full border border-white/25 px-4 py-2 text-sm transition duration-200 hover:bg-white/15"
              >
                {t(key)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <JourneyCards onOpenJourney={onOpenJourney} />
      {state.trail.length > 0 && <ProofTrailPanel />}
    </div>
  );
}
