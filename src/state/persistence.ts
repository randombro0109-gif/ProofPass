import { supabase } from '@/lib/supabase';
import type { AppState } from '@/types';
import { createId } from '@/state/ids';

const CLIENT_ID_KEY = 'proofpass.client_id';
const CACHE_KEY = 'proofpass.state.v1';
const TABLE = 'proofpass_state';

export type LoadSource = 'remote' | 'local' | 'none';

export interface LoadResult {
  state: AppState | null;
  source: LoadSource;
  remoteFailed: boolean;
}

export function getClientId(): string {
  const existing = localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;
  const created = createId('client');
  localStorage.setItem(CLIENT_ID_KEY, created);
  return created;
}

function isAppState(value: unknown): value is AppState {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<AppState>;
  return (
    candidate.version === 1 &&
    Array.isArray(candidate.goals) &&
    Array.isArray(candidate.instructions) &&
    Array.isArray(candidate.records) &&
    Array.isArray(candidate.journeys) &&
    Array.isArray(candidate.proofKeys) &&
    Array.isArray(candidate.trail) &&
    Array.isArray(candidate.receipts)
  );
}

function readCache(): AppState | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isAppState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(state: AppState): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota or private mode; the remote copy remains the source of truth.
  }
}

export async function loadState(clientId: string): Promise<LoadResult> {
  const cached = readCache();
  const fallback: LoadResult = { state: cached, source: cached ? 'local' : 'none', remoteFailed: true };
  if (!supabase) return fallback;

  try {
    const { data, error } = await supabase.from(TABLE).select('state').eq('client_id', clientId).maybeSingle();
    if (error) return fallback;
    if (data && isAppState(data.state)) {
      writeCache(data.state);
      return { state: data.state, source: 'remote', remoteFailed: false };
    }
    return { state: cached, source: cached ? 'local' : 'none', remoteFailed: false };
  } catch {
    return fallback;
  }
}

export async function saveState(clientId: string, state: AppState): Promise<boolean> {
  writeCache(state);
  if (!supabase) return false;

  try {
    const { error } = await supabase.from(TABLE).upsert(
      { client_id: clientId, state, updated_at: new Date().toISOString() },
      { onConflict: 'client_id' },
    );
    return !error;
  } catch {
    return false;
  }
}
