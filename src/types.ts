import type { TranslationKey } from '@/i18n/en';

export type Language = 'en' | 'ar';
export type ThemeMode = 'light' | 'dark';
export type Category = 'visa' | 'housing' | 'business' | 'university' | 'other';
export type Answers = Record<string, string>;

export type GoalStatus = 'intake' | 'instructions' | 'researching' | 'journeyed' | 'abandoned';

export interface Goal {
  id: string;
  originalText: string;
  category: Category;
  answers: Answers;
  status: GoalStatus;
  createdAt: string;
}

export type RecordType =
  | 'residential_address'
  | 'contact_preference'
  | 'business_name'
  | 'sponsor_details'
  | 'academic_history';

export interface ProofRecord {
  id: string;
  type: RecordType;
  value: string;
  source: 'profile' | 'provided' | 'instruction';
  verification: 'self_declared' | 'not_verified';
  reusable: boolean;
  updatedAt: string;
}

export interface Instruction {
  id: string;
  goalId: string;
  sourceType: 'paste' | 'file';
  filename?: string;
  extractedText: string;
  createdAt: string;
}

export type Execution = 'digital' | 'user' | 'external';
export type TaskKind = 'reuse' | 'provide' | 'prepare' | 'review' | 'confirm' | 'submit' | 'decision';
export type TaskStatus =
  | 'not_started'
  | 'ready_for_review'
  | 'waiting_for_user'
  | 'waiting_external'
  | 'needs_attention'
  | 'completed';
export type ProvideInput = 'text' | 'contact';

export interface JourneyTask {
  id: string;
  stageId: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  detail?: string;
  kind: TaskKind;
  execution: Execution;
  dependsOn: string[];
  status: TaskStatus;
  recordTypes: RecordType[];
  inputKind?: ProvideInput;
  fromInstruction: boolean;
  completedAt?: string;
}

export interface JourneyStage {
  id: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
}

export interface ContextItem {
  promptKey: TranslationKey;
  valueKey?: TranslationKey;
  text?: string;
}

export interface Journey {
  id: string;
  goalId: string;
  category: Category;
  reference: string;
  originalText: string;
  context: ContextItem[];
  stages: JourneyStage[];
  tasks: JourneyTask[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  completedAt?: string;
}

export type ProofKeyStatus = 'active' | 'used' | 'cancelled' | 'revoked';

export interface ProofKey {
  id: string;
  reference: string;
  journeyId: string;
  taskId: string;
  recordTypes: RecordType[];
  status: ProofKeyStatus;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  cancelledAt?: string;
  revokedAt?: string;
}

export interface TrailEvent {
  id: string;
  at: string;
  journeyId?: string;
  key: TranslationKey;
  params?: Record<string, string>;
  labelParams?: Record<string, TranslationKey>;
}

export interface ReceiptStep {
  titleKey: TranslationKey;
  execution: Execution;
  authorityKey?: TranslationKey;
}

export interface ProofReceipt {
  id: string;
  journeyId: string;
  reference: string;
  goalText: string;
  category: Category;
  completedAt: string;
  isFinal?: boolean;
  stageTitleKeys: TranslationKey[];
  recordTypes: RecordType[];
  permissions: { reference: string; usedAt: string }[];
  completedSteps?: ReceiptStep[];
  pendingSteps?: ReceiptStep[];
  externalSteps?: ReceiptStep[];
}

export type TextSize = 'standard' | 'large' | 'xlarge';

export interface AppState {
  version: 1;
  language: Language;
  theme: ThemeMode;
  displayName: string;
  textSize?: TextSize;
  goals: Goal[];
  instructions: Instruction[];
  records: ProofRecord[];
  journeys: Journey[];
  proofKeys: ProofKey[];
  trail: TrailEvent[];
  receipts: ProofReceipt[];
}
