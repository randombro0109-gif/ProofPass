import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useTranslation } from '@/hooks/useTranslation';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-action text-action-fg shadow-sm hover:brightness-110',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface-muted',
  ghost: 'text-ink hover:bg-surface-muted',
  danger: 'border border-red-fg/20 bg-red text-red-fg hover:brightness-95',
};

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-base font-bold transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}

type Tone = 'neutral' | 'blue' | 'mint' | 'gold' | 'red';

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-muted text-ink-muted',
  blue: 'bg-active/15 text-royal',
  mint: 'bg-mint text-mint-fg',
  gold: 'bg-gold text-gold-fg',
  red: 'bg-red text-red-fg',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold', TONES[tone])}>
      {children}
    </span>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-[2px] animate-fade-in sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-pop animate-scale-in sm:rounded-3xl sm:p-10',
          wide ? 'max-w-3xl' : 'max-w-lg',
        )}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold leading-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="shrink-0 rounded-full p-2 text-ink-muted transition hover:bg-surface-muted hover:text-ink"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
