import type { Translate } from '@/i18n';
import type { ProofRecord } from '@/types';
import { CONTACT_OPTIONS } from '@/i18n/keys';

export function recordValueText(record: ProofRecord, t: Translate): string {
  if (record.type !== 'contact_preference') return record.value;
  const option = CONTACT_OPTIONS.find((item) => item.value === record.value);
  return option ? t(option.labelKey) : record.value;
}
