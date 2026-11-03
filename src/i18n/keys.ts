import type { TranslationKey } from '@/i18n/en';
import type { Category, Execution, RecordType, TaskStatus } from '@/types';

export const CATEGORY_KEY: Record<Category, TranslationKey> = {
  visa: 'category.visa',
  housing: 'category.housing',
  business: 'category.business',
  university: 'category.university',
  other: 'category.other',
};

export const TASK_STATUS_KEY: Record<TaskStatus, TranslationKey> = {
  not_started: 'status.not_started',
  ready_for_review: 'status.ready_for_review',
  waiting_for_user: 'status.waiting_for_user',
  waiting_external: 'status.waiting_external',
  needs_attention: 'status.needs_attention',
  completed: 'status.completed',
};

export const EXECUTION_KEY: Record<Execution, TranslationKey> = {
  digital: 'exec.digital',
  user: 'exec.user',
  external: 'exec.external',
};

export const RECORD_KEY: Record<RecordType, TranslationKey> = {
  residential_address: 'record.residential_address',
  contact_preference: 'record.contact_preference',
  business_name: 'record.business_name',
  sponsor_details: 'record.sponsor_details',
  academic_history: 'record.academic_history',
};

export const CONTACT_OPTIONS: { value: string; labelKey: TranslationKey }[] = [
  { value: 'email', labelKey: 'contact.email' },
  { value: 'sms', labelKey: 'contact.sms' },
  { value: 'phone', labelKey: 'contact.phone' },
];
