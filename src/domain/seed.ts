import type { AppState } from '@/types';

export const LEGACY_DEMO_NAME = 'Layla Hassan';
export const DEMO_NAME = 'Ahmed Khalid';

export function migrateDemoProfile(state: AppState): AppState {
  return state.displayName === LEGACY_DEMO_NAME ? { ...state, displayName: DEMO_NAME } : state;
}

export function createInitialState(now: string): AppState {
  return {
    version: 1,
    language: 'en',
    theme: 'light',
    displayName: DEMO_NAME,
    goals: [],
    instructions: [],
    journeys: [],
    proofKeys: [],
    trail: [],
    receipts: [],
    records: [
      {
        id: 'demo-residential-address',
        type: 'residential_address',
        value: 'Flat 402, Al Nahda, Sharjah',
        source: 'profile',
        verification: 'self_declared',
        reusable: true,
        updatedAt: now,
      },
      {
        id: 'demo-contact-preference',
        type: 'contact_preference',
        value: 'email',
        source: 'profile',
        verification: 'self_declared',
        reusable: true,
        updatedAt: now,
      },
    ],
  };
}
