import { ArrowLeft, Check, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { getQuestion, nextQuestion, optionLabelKey, type QuestionDef } from '@/domain/questions';
import { useAppState } from '@/state/useAppState';
import { Button } from '@/components/ui/primitives';
import { CATEGORY_KEY } from '@/i18n/keys';
import { InstructionIntake } from '@/components/intake/InstructionIntake';
import { ResearchProgress } from '@/components/intake/ResearchProgress';
import type { Goal } from '@/types';
import type { TranslationKey } from '@/i18n/en';

export function IntakeFlow({ goal, onOpenJourney }: { goal: Goal; onOpenJourney: (journeyId: string) => void }) {
  if (goal.status === 'instructions') return <InstructionIntake goal={goal} />;
  if (goal.status === 'researching') return <ResearchProgress goal={goal} onOpenJourney={onOpenJourney} />;
  return <QuestionStep goal={goal} />;
}

function answerLabel(questionId: string, value: string, t: (key: TranslationKey) => string): string {
  const labelKey = optionLabelKey(questionId, value);
  return labelKey ? t(labelKey) : value;
}

function QuestionStep({ goal }: { goal: Goal }) {
  const { dispatch } = useAppState();
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [confirmingReset, setConfirmingReset] = useState(false);

  const question = nextQuestion(goal.category, goal.answers);
  const answeredIds = Object.keys(goal.answers).filter((id) => id !== 'instructions');
  const lastAnsweredId = Object.keys(goal.answers).slice(-1)[0];
  const now = () => new Date().toISOString();

  const answer = (questionId: string, value: string) => {
    dispatch({ type: 'goal/answer', goalId: goal.id, questionId, value, now: now() });
    setText('');
  };

  const revert = (questionId: string) => {
    dispatch({ type: 'goal/revert', goalId: goal.id, questionId, now: now() });
  };

  const abandon = () => {
    dispatch({ type: 'goal/abandon', goalId: goal.id, now: now() });
    setConfirmingReset(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-fade-up">
      <header className="space-y-3">
        <p className="text-sm font-bold text-royal">{t(CATEGORY_KEY[goal.category])}</p>
        <p className="text-sm text-ink-muted">
          {t('intent.goal_label')}: <span className="font-bold text-ink">{goal.originalText}</span>
        </p>
      </header>

      {question ? (
        <QuestionCard question={question} onAnswer={answer} text={text} setText={setText} />
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {lastAnsweredId && (
          <Button variant="ghost" onClick={() => revert(lastAnsweredId)} aria-label={t('intent.undo')}>
            <ArrowLeft size={16} className="rtl-flip" />
            {t('common.back')}
          </Button>
        )}
        {confirmingReset ? (
          <span className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-ink-muted">{t('home.start_over_confirm')}</span>
            <Button variant="danger" onClick={abandon} className="min-h-9 px-3 text-xs">
              {t('common.yes')}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmingReset(false)} className="min-h-9 px-3 text-xs">
              {t('common.no')}
            </Button>
          </span>
        ) : (
          <Button variant="ghost" onClick={() => setConfirmingReset(true)} className="text-ink-muted">
            {t('home.start_over')}
          </Button>
        )}
      </div>

      {answeredIds.length > 0 && (
        <section aria-labelledby="so-far" className="card space-y-4 p-6">
          <h2 id="so-far" className="text-sm font-bold uppercase tracking-wide text-ink-muted">
            {t('intent.so_far')}
          </h2>
          <ul className="divide-y divide-line">
            {answeredIds.map((id) => {
              const question = getQuestion(id);
              if (!question) return null;
              return (
                <li key={id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-ink-muted">{t(question.promptKey)}</p>
                    <p className="font-bold">{answerLabel(id, goal.answers[id], t)}</p>
                  </div>
                  <Button variant="ghost" onClick={() => revert(id)} className="min-h-9 shrink-0 px-3 text-xs">
                    <Pencil size={14} />
                    {t('intent.change')}
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function QuestionCard({
  question,
  onAnswer,
  text,
  setText,
}: {
  question: QuestionDef;
  onAnswer: (questionId: string, value: string) => void;
  text: string;
  setText: (value: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <section className="card p-6 sm:p-8" aria-labelledby="question-prompt">
      <h1 id="question-prompt" className="text-2xl font-bold leading-snug sm:text-3xl">
        {t(question.promptKey)}
      </h1>
      {question.helpKey && <p className="mt-3 text-sm leading-relaxed text-ink-muted">{t(question.helpKey)}</p>}

      {question.options && (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {question.options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onAnswer(question.id, option.value)}
              className="group flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-5 text-start font-bold transition duration-200 hover:border-active hover:bg-surface-muted active:scale-[0.99]"
            >
              <span>{t(option.labelKey)}</span>
              <Check size={18} className="text-active opacity-0 transition group-hover:opacity-100" />
            </button>
          ))}
        </div>
      )}

      {question.allowText && (
        <form
          className="mt-8 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            if (text.trim()) onAnswer(question.id, text.trim());
          }}
        >
          <label className="sr-only" htmlFor="intake-text">
            {t(question.promptKey)}
          </label>
          <input
            id="intake-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t('intent.text_placeholder')}
            className="min-h-12 flex-1 rounded-xl border border-line bg-surface px-4 text-base focus:border-active focus:outline-none focus:ring-2 focus:ring-active/30"
          />
          <Button type="submit" disabled={!text.trim()}>
            {t('intent.text_submit')}
          </Button>
          <Button variant="secondary" onClick={() => onAnswer(question.id, 'not_sure')}>
            {t('common.not_sure')}
          </Button>
        </form>
      )}
    </section>
  );
}
