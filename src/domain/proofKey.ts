import type { ProofKey, ProofKeyStatus } from '@/types';

export const PROOF_KEY_LIFETIME_MS = 5 * 60 * 1000;

export type ProofKeyView = ProofKeyStatus | 'expired';

export function proofKeyView(key: ProofKey, nowMs: number): ProofKeyView {
  if (key.status === 'active' && Date.parse(key.expiresAt) <= nowMs) return 'expired';
  return key.status;
}

export function activeKeyForTask(keys: ProofKey[], journeyId: string, taskId: string, nowMs: number): ProofKey | undefined {
  return keys.find(
    (key) => key.journeyId === journeyId && key.taskId === taskId && proofKeyView(key, nowMs) === 'active',
  );
}
