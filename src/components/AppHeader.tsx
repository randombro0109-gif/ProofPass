import { Compass, Home, Route, Settings } from 'lucide-react';
import type { View } from '@/App';
import { Badge } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppState } from '@/state/useAppState';

const ITEMS: { view: View; labelKey: 'nav.home' | 'nav.journey' | 'nav.settings'; icon: typeof Home }[] = [
  { view: 'home', labelKey: 'nav.home', icon: Home },
  { view: 'journey', labelKey: 'nav.journey', icon: Route },
  { view: 'settings', labelKey: 'nav.settings', icon: Settings },
];

export function AppHeader({ view, onNavigate }: { view: View; onNavigate: (view: View) => void }) {
  const { t } = useTranslation();
  const { syncStatus } = useAppState();
  const syncLabel = syncStatus === 'saved' ? 'settings.saved' : syncStatus === 'saving' ? 'common.save' : 'settings.sync_error';

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <button type="button" onClick={() => onNavigate('home')} className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal text-royal-fg">
            <Compass size={20} />
          </span>
          <span className="text-left">
            <span className="block text-base font-bold leading-tight">{t('common.app')}</span>
            <span className="hidden text-xs text-ink-muted sm:block">{t('common.tagline')}</span>
          </span>
          <span className="hidden sm:inline-flex">
            <Badge tone="gold">{t('demo.badge')}</Badge>
          </span>
        </button>

        <nav aria-label={t('nav.open_menu')} className="flex items-center gap-1 rounded-2xl bg-surface-muted p-1">
          {ITEMS.map(({ view: target, labelKey, icon: Icon }) => {
            const active = view === target;
            return (
              <button
                key={target}
                type="button"
                onClick={() => onNavigate(target)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold transition duration-200',
                  active ? 'bg-surface text-royal shadow-sm' : 'text-ink-muted hover:text-ink',
                )}
              >
                <Icon size={16} />
                <span className="hidden md:inline">{t(labelKey)}</span>
              </button>
            );
          })}
        </nav>

        <span
          className="hidden items-center gap-2 text-xs text-ink-muted lg:flex"
          title={t(syncLabel)}
        >
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              syncStatus === 'saved' ? 'bg-accent' : syncStatus === 'saving' ? 'bg-gold-fg' : 'bg-red-fg',
            )}
          />
          {t(syncLabel)}
        </span>
      </div>
    </header>
  );
}
