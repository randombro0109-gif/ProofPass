import { ArrowLeft, FileText, Loader2, Upload } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { MAX_INSTRUCTION_BYTES, isPlainTextFile, splitInstructionLines } from '@/domain/instructions';
import { createId } from '@/state/ids';
import { useAppState } from '@/state/useAppState';
import { Button } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import type { Goal } from '@/types';
import type { TranslationKey } from '@/i18n/en';

const UNSUPPORTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.heic', '.webp'];
const PREVIEW_LINES = 6;

type Tab = 'paste' | 'file';

interface Source {
  sourceType: 'paste' | 'file';
  filename?: string;
  text: string;
}

export function InstructionIntake({ goal }: { goal: Goal }) {
  const { dispatch } = useAppState();
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('paste');
  const [draft, setDraft] = useState('');
  const [review, setReview] = useState<Source | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [reading, setReading] = useState<string | null>(null);
  const [error, setError] = useState<{ key: TranslationKey; name?: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const now = () => new Date().toISOString();

  const openReview = (source: Source) => {
    setReview(source);
    setReviewText(source.text);
    setError(null);
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    if (UNSUPPORTED_EXTENSIONS.some((extension) => lowerName.endsWith(extension))) {
      setError({ key: 'instr.error_ocr', name: file.name });
      return;
    }
    if (!isPlainTextFile(file)) {
      setError({ key: 'instr.error_type' });
      return;
    }
    if (file.size > MAX_INSTRUCTION_BYTES) {
      setError({ key: 'instr.error_size' });
      return;
    }
    setReading(file.name);
    setError(null);
    try {
      const text = (await file.text()).trim();
      if (!text) {
        setError({ key: 'instr.error_empty' });
        return;
      }
      openReview({ sourceType: 'file', filename: file.name, text });
    } catch {
      setError({ key: 'common.error' });
    } finally {
      setReading(null);
    }
  };

  const useInstructions = () => {
    if (!review) return;
    const text = reviewText.trim();
    if (!text) {
      setError({ key: 'instr.none' });
      return;
    }
    dispatch({
      type: 'instruction/add',
      instruction: {
        id: createId('instr'),
        goalId: goal.id,
        sourceType: review.sourceType,
        filename: review.filename,
        extractedText: text,
        createdAt: now(),
      },
      now: now(),
    });
  };

  const skip = () => dispatch({ type: 'instruction/skip', goalId: goal.id, now: now() });

  const backToQuestion = () => dispatch({ type: 'goal/revert', goalId: goal.id, questionId: 'instructions', now: now() });

  if (review) {
    const lines = splitInstructionLines(reviewText);
    return (
      <div className="mx-auto max-w-2xl space-y-6 animate-fade-up">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold sm:text-3xl">{t('instr.review_title')}</h1>
          <p className="text-sm text-ink-muted">{t('instr.review_help')}</p>
          {review.filename && (
            <p className="inline-flex items-center gap-2 rounded-full bg-surface-muted px-3 py-1 text-xs font-bold text-ink-muted">
              <FileText size={14} />
              {t('instr.selected', { name: review.filename })}
            </p>
          )}
        </header>

        <section className="card space-y-4 p-6">
          <label className="sr-only" htmlFor="instruction-review">
            {t('instr.review_title')}
          </label>
          <textarea
            id="instruction-review"
            value={reviewText}
            onChange={(event) => setReviewText(event.target.value)}
            rows={8}
            className="w-full rounded-xl border border-line bg-canvas p-4 text-sm leading-relaxed focus:border-active focus:outline-none focus:ring-2 focus:ring-active/30"
          />
          {error && <ErrorNote message={t(error.key, error.name ? { name: error.name } : undefined)} onRetry={() => setError(null)} />}
          <div>
            <p className="text-sm font-bold">{t('instr.found_title')}</p>
            <ul className="mt-2 space-y-1 text-sm text-ink-muted">
              {lines.slice(0, PREVIEW_LINES).map((line, index) => (
                <li key={`${index}-${line}`} className="truncate">
                  • {line}
                </li>
              ))}
            </ul>
            {lines.length > PREVIEW_LINES && (
              <p className="mt-2 text-xs text-ink-muted">+{lines.length - PREVIEW_LINES}</p>
            )}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button onClick={useInstructions} disabled={!reviewText.trim()}>
            {t('instr.use')}
          </Button>
          <Button variant="ghost" onClick={() => setReview(null)}>
            <ArrowLeft size={16} className="rtl-flip" />
            {t('instr.back_to_question')}
          </Button>
          <Button variant="ghost" onClick={skip} className="text-ink-muted">
            {t('instr.skip')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-up">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl">{t('instr.title')}</h1>
        <p className="text-sm leading-relaxed text-ink-muted">{t('instr.subtitle')}</p>
      </header>

      <div role="tablist" className="inline-flex rounded-2xl bg-surface-muted p-1">
        {(['paste', 'file'] as Tab[]).map((item) => (
          <button
            key={item}
            role="tab"
            type="button"
            aria-selected={tab === item}
            onClick={() => {
              setTab(item);
              setError(null);
            }}
            className={cn(
              'min-h-10 rounded-xl px-4 text-sm font-bold transition duration-200',
              tab === item ? 'bg-surface text-royal shadow-sm' : 'text-ink-muted hover:text-ink',
            )}
          >
            {item === 'paste' ? t('instr.tab_paste') : t('instr.tab_file')}
          </button>
        ))}
      </div>

      <section className="card space-y-4 p-6">
        {tab === 'paste' ? (
          <>
            <label className="sr-only" htmlFor="instruction-paste">
              {t('instr.tab_paste')}
            </label>
            <textarea
              id="instruction-paste"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t('instr.paste_placeholder')}
              rows={7}
              className="w-full rounded-xl border border-line bg-canvas p-4 text-sm leading-relaxed placeholder:text-ink-muted/70 focus:border-active focus:outline-none focus:ring-2 focus:ring-active/30"
            />
            <Button
              onClick={() => openReview({ sourceType: 'paste', text: draft.trim() })}
              disabled={!draft.trim()}
            >
              {t('common.continue')}
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-start gap-4">
            <p className="text-sm leading-relaxed text-ink-muted">{t('instr.file_help')}</p>
            <input
              ref={fileInput}
              type="file"
              accept=".txt,text/plain"
              onChange={handleFile}
              className="sr-only"
              id="instruction-file"
            />
            <Button onClick={() => fileInput.current?.click()} disabled={reading !== null}>
              {reading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              {reading ? t('instr.reading', { name: reading }) : t('instr.choose_file')}
            </Button>
          </div>
        )}
        {error && (
          <ErrorNote
            message={t(error.key, error.name ? { name: error.name } : undefined)}
            onRetry={() => {
              setError(null);
              if (tab === 'file') fileInput.current?.click();
            }}
          />
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button variant="ghost" onClick={backToQuestion}>
          <ArrowLeft size={16} className="rtl-flip" />
          {t('instr.back_to_question')}
        </Button>
        <Button variant="ghost" onClick={skip} className="text-ink-muted">
          {t('instr.skip')}
        </Button>
      </div>
    </div>
  );
}

function ErrorNote({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-xl bg-red p-4 text-sm text-red-fg sm:flex-row sm:items-center sm:justify-between">
      <span>{message}</span>
      <Button variant="secondary" onClick={onRetry} className="min-h-9 shrink-0 px-3 text-xs">
        {t('common.retry')}
      </Button>
    </div>
  );
}
