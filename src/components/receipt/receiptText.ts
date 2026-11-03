import type { Translate } from '@/i18n';
import { EXECUTION_KEY, RECORD_KEY } from '@/i18n/keys';
import { formatDateTime } from '@/lib/format';
import type { Language, ProofReceipt, ReceiptStep } from '@/types';

function stepLine(step: ReceiptStep, t: Translate): string {
  const authority = step.authorityKey ? ` (${t(step.authorityKey)})` : '';
  return `- ${t(step.titleKey)} [${t(EXECUTION_KEY[step.execution])}]${authority}`;
}

function section(title: string, lines: string[], none: string): string[] {
  return [title, ...(lines.length > 0 ? lines : [`- ${none}`]), ''];
}

export function receiptToText(receipt: ProofReceipt, t: Translate, language: Language): string {
  const none = t('receipt.none');
  const permissions = receipt.permissions.map((permission) =>
    t('receipt.permission_line', { reference: permission.reference, time: formatDateTime(permission.usedAt, language) }),
  );
  return [
    t('receipt.title'),
    t('receipt.notice'),
    '',
    `${t('receipt.goal')}: ${receipt.goalText}`,
    `${t('receipt.reference')}: ${receipt.reference}`,
    `${t('receipt.completed')}: ${formatDateTime(receipt.completedAt, language)}`,
    `${t(receipt.isFinal ? 'receipt.status_final' : 'receipt.status_checkpoint')}`,
    `${t('receipt.outcome')}: ${t('receipt.outcome_value')}`,
    '',
    ...section(t('receipt.actions'), (receipt.completedSteps ?? []).map((step) => stepLine(step, t)), none),
    ...section(t('receipt.pending_steps'), (receipt.pendingSteps ?? []).map((step) => stepLine(step, t)), none),
    ...section(t('receipt.external'), (receipt.externalSteps ?? []).map((step) => stepLine(step, t)), t('receipt.external_none')),
    ...section(t('receipt.permissions'), permissions, none),
    ...section(t('receipt.info'), receipt.recordTypes.map((type) => t(RECORD_KEY[type])), none),
    t('receipt.external_notice'),
  ].join('\n');
}

export function downloadReceiptFile(receipt: ProofReceipt, text: string): void {
  const blob = new Blob(['\uFEFF', text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `proofpass-receipt-${receipt.reference}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
