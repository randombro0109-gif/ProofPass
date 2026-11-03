import { Check, Circle, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { PLACEHOLDER_KEYS } from '@/domain/journeyBuilder';
import { EXECUTION_KEY, TASK_STATUS_KEY } from '@/i18n/keys';
import { useAppState } from '@/state/useAppState';
import { createId } from '@/state/ids';
import { Badge, Button } from '@/components/ui/primitives';
import { ProvideForm } from '@/components/journey/ProvideForm';
import { ProofKeyModal } from '@/components/key/ProofKeyModal';
import { cn } from '@/lib/cn';
import type { Journey, JourneyTask } from '@/types';

export function TaskCard({ journey, task, defaultOpen = false }: { journey: Journey; task: JourneyTask; defaultOpen?: boolean }) {
  const { dispatch } = useAppState();
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);
  const [showKey, setShowKey] = useState(false);
  const done = task.status === 'completed';
  const complete = () =>
    dispatch({ type: 'task/complete', journeyId: journey.id, taskId: task.id, now: new Date().toISOString() });

  return (
    <article
      className={cn(
        'card p-5 transition duration-300 sm:p-6',
        task.status === 'needs_attention' && 'border-red-fg/30',
        task.status === 'waiting_external' && 'border-gold-fg/30',
      )}
    >
      <div className="flex items-start gap-4">
        <span
          className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            done ? 'bg-mint text-mint-fg' : 'bg-surface-muted text-ink-muted',
          )}
        >
          {done ? <Check size={16} /> : <Circle size={14} />}
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className={cn('text-base font-bold leading-snug', done && 'text-ink-muted line-through decoration-mint-fg/60')}>
              {t(task.titleKey)}
            </h3>
            <Badge tone={statusTone(task.status)}>{t(TASK_STATUS_KEY[task.status])}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
            <span className="rounded-full bg-surface-muted px-2.5 py-1 font-bold">{t(EXECUTION_KEY[task.execution])}</span>
            {task.fromInstruction && (
              <span className="rounded-full bg-active/15 px-2.5 py-1 font-bold text-royal">{t('task.from_instruction')}</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="inline-flex items-center gap-1 text-sm font-bold text-royal"
          >
            {open ? t('journey.hide_details') : t('journey.details')}
            <ChevronDown size={14} className={cn('transition-transform duration-200', open && 'rotate-180')} />
          </button>

          {open && (
            <div className="space-y-3 border-t border-line pt-3 text-sm leading-relaxed text-ink-muted animate-fade-in">
              <p>{t(task.descriptionKey)}</p>
              {task.detail && (
                <blockquote className="rounded-xl border-s-4 border-accent bg-surface-muted p-3 text-ink">{task.detail}</blockquote>
              )}
            </div>
          )}

          <TaskAction journey={journey} task={task} onComplete={complete} onRequestKey={() => setShowKey(true)} />
        </div>
      </div>

      {showKey && (
        <ProofKeyModal journeyId={journey.id} taskId={task.id} onClose={() => setShowKey(false)} />
      )}
    </article>
  );
}

function statusTone(status: JourneyTask['status']): 'neutral' | 'blue' | 'mint' | 'gold' | 'red' {
  if (status === 'completed') return 'mint';
  if (status === 'needs_attention') return 'red';
  if (status === 'waiting_external') return 'gold';
  if (status === 'waiting_for_user' || status === 'ready_for_review') return 'blue';
  return 'neutral';
}

function TaskAction({
  journey,
  task,
  onComplete,
  onRequestKey,
}: {
  journey: Journey;
  task: JourneyTask;
  onComplete: () => void;
  onRequestKey: () => void;
}) {
  const { t } = useTranslation();
  const open = task.status === 'waiting_for_user' || task.status === 'needs_attention';

  if (task.status === 'completed') {
    if (task.kind === 'reuse') return <p className="text-sm font-bold text-mint-fg">{t('task.reused_with_permission')}</p>;
    return null;
  }

  const needsKey = task.kind === 'reuse' ? open : task.kind === 'submit' && (open || task.status === 'ready_for_review');

  if (needsKey) {
    const isSubmit = task.kind === 'submit';
    return (
      <div className="space-y-3">
        <p className="text-sm text-ink-muted">
          {task.status === 'needs_attention'
            ? t('task.attention_cancelled')
            : t(isSubmit ? 'task.submit.permission_needed' : 'task.needs_permission')}
        </p>
        <Button onClick={onRequestKey}>{t(isSubmit ? 'task.submit.permission' : 'task.reuse.action')}</Button>
      </div>
    );
  }

  if (task.kind === 'provide' && task.status === 'waiting_for_user') {
    return (
      <ProvideForm
        journeyId={journey.id}
        taskId={task.id}
        recordType={task.recordTypes[0]}
        inputKind={task.inputKind ?? 'text'}
        placeholderKey={PLACEHOLDER_KEYS[task.recordTypes[0]]}
      />
    );
  }

  if (task.status === 'waiting_for_user' && (task.kind === 'confirm' || task.kind === 'review')) {
    return (
      <Button onClick={onComplete}>{t(task.kind === 'review' ? 'task.review.action' : 'task.confirm.action')}</Button>
    );
  }

  if (task.status === 'waiting_external') {
    const isDecision = task.kind === 'decision';
    return (
      <div className="space-y-3">
        <p className="rounded-xl bg-gold/60 p-3 text-sm leading-relaxed text-gold-fg">{t('journey.external_help')}</p>
        {isDecision && (
          <Button variant="secondary" onClick={onComplete}>
            {t(task.id === 'appointment' ? 'task.appointment.action' : 'task.decision.action')}
          </Button>
        )}
      </div>
    );
  }

  if (task.status === 'not_started') return <p className="text-sm text-ink-muted">{t('journey.blocked_note')}</p>;

  return null;
}
