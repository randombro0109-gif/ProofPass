import { createContext, useEffect, useMemo, useReducer, useRef, useState, type Dispatch, type ReactNode } from 'react';
import { createInitialState } from '@/domain/seed';
import { supabase } from '@/lib/supabase';
import { getClientId, loadState, saveState } from '@/state/persistence';
import { appReducer, type Action } from '@/state/reducer';
import type { AppState } from '@/types';

const SAVE_DELAY_MS = 300;

export type SyncStatus = 'loading' | 'saving' | 'saved' | 'local' | 'error';

export interface AppStateContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
  syncStatus: SyncStatus;
  ready: boolean;
}

export const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, () => createInitialState(new Date().toISOString()));
  const [loaded, setLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const clientIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const clientId = getClientId();
    clientIdRef.current = clientId;

    loadState(clientId).then((result) => {
      if (cancelled) return;
      if (result.state) dispatch({ type: 'app/load', state: result.state });
      setSyncStatus(result.remoteFailed ? 'error' : supabase ? 'saved' : 'local');
      setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded || !clientIdRef.current) return;
    const clientId = clientIdRef.current;
    setSyncStatus('saving');
    const timer = window.setTimeout(() => {
      saveState(clientId, state).then((ok) => {
        if (!supabase) setSyncStatus('local');
        else setSyncStatus(ok ? 'saved' : 'error');
      });
    }, SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [state, loaded]);

  const value = useMemo(() => ({ state, dispatch, syncStatus, ready: loaded }), [state, syncStatus, loaded]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
