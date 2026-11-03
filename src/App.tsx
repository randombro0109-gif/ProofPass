import { useCallback, useEffect, useState } from 'react';
import { Compass, Loader2 } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { HomeScreen } from '@/components/home/HomeScreen';
import { JourneyScreen } from '@/components/journey/JourneyScreen';
import { SettingsScreen } from '@/components/settings/SettingsScreen';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppState } from '@/state/useAppState';

export type View = 'home' | 'journey' | 'settings';

export default function App() {
  const { state, ready } = useAppState();
  const { t, dir } = useTranslation();
  const [view, setView] = useState<View>('home');
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = state.language;
    root.dir = dir;
    root.dataset.theme = state.theme;
    root.dataset.textSize = state.textSize ?? 'standard';
  }, [state.language, state.theme, state.textSize, dir]);

  useEffect(() => {
    document.title = t('common.app');
  }, [t]);

  const openJourney = useCallback((journeyId: string) => {
    setSelectedJourneyId(journeyId);
    setView('journey');
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-ink-muted">
        <Loader2 className="animate-spin" size={20} />
        <Compass size={20} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader view={view} onNavigate={setView} />
      <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-8 sm:px-8">
        {view === 'home' && <HomeScreen onOpenJourney={openJourney} />}
        {view === 'journey' && (
          <JourneyScreen
            selectedId={selectedJourneyId}
            onSelect={setSelectedJourneyId}
            onStart={() => setView('home')}
          />
        )}
        {view === 'settings' && <SettingsScreen />}
      </main>
    </div>
  );
}
