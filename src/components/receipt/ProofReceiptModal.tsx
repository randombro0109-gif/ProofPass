import { Download, Printer } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppState } from '@/state/useAppState';
import { EXECUTION_KEY, RECORD_KEY } from '@/i18n/keys';
import { formatDateTime } from '@/lib/format';
import { Badge, Button } from '@/components/ui/primitives';
import { downloadReceiptFile, receiptToText } from '@/components/receipt/receiptText';
import type { ProofReceipt, ReceiptStep } from '@/types';

export function ProofReceiptModal({ receipt, onClose }: { receipt: ProofReceipt; onClose: () => void }) {
  const { t, language } = useTranslation();
  const { state } = useAppState();
  const { completedSteps = [], pendingSteps = [], externalSteps = [] } = receipt;

  return (
    <div className="space-y-8">
      <div id="receipt-print" className="space-y-8">
        <p className="rounded-xl border border-gold-fg/30 bg-gold/60 p-4 text-sm font-bold leading-relaxed text-gold-fg">
          {t('receipt.notice')}
        </p>

        <div className="space-y-2">
          <Badge tone={receipt.isFinal ? 'mint' : 'gold'}>
            {t(receipt.isFinal ? 'receipt.status_final' : 'receipt.status_checkpoint')}
          </Badge>
          <p className="text-sm leading-relaxed text-ink-muted">{t('receipt.external_notice')}</p>
        </div>

        <dl className="grid gap-5 sm:grid-cols-2">
          <ReceiptField label={t('receipt.name')} value={state.displayName} />
          <ReceiptField label={t('receipt.goal')} value={receipt.goalText} />
          <ReceiptField label={t('receipt.reference')} value={receipt.reference} mono />
          <ReceiptField label={t('receipt.completed')} value={formatDateTime(receipt.completedAt, language)} />
          <ReceiptField label={t('receipt.outcome')} value={t('receipt.outcome_value')} />
        </dl>

        <StepSection
          title={t('receipt.actions')}
          badge={t('receipt.simulated_label')}
          steps={completedSteps}
          empty={t('receipt.none')}
        />
        <StepSection title={t('receipt.pending_steps')} steps={pendingSteps} empty={t('receipt.none')} />
        <StepSection title={t('receipt.external')} steps={externalSteps} empty={t('receipt.external_none')} />
        <ReceiptSection
          title={t('receipt.permissions')}
          items={receipt.permissions.map((permission) =>
            t('receipt.permission_line', {
              reference: permission.reference,
              time: formatDateTime(permission.usedAt, language),
            }),
          )}
          empty={t('receipt.none')}
        />
        <ReceiptSection
          title={t('receipt.info')}
          items={receipt.recordTypes.map((type) => t(RECORD_KEY[type]))}
          empty={t('receipt.none')}
        />
        <ReceiptSection
          title={t('receipt.stages')}
          items={receipt.stageTitleKeys.map((key) => t(key))}
          empty={t('receipt.none')}
        />
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer size={16} />
          {t('receipt.print')}
        </Button>
        <Button variant="secondary" onClick={() => downloadReceiptFile(receipt, receiptToText(receipt, t, language))}>
          <Download size={16} />
          {t('receipt.download')}
        </Button>
        <Button onClick={onClose}>{t('receipt.close')}</Button>
      </div>
    </div>
  );
}

function ReceiptField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-bold uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className={mono ? 'font-mono text-sm font-bold' : 'text-sm font-bold leading-relaxed'}>{value}</dd>
    </div>
  );
}

function StepSection({ title, badge, steps, empty }: { title: string; badge?: string; steps: ReceiptStep[]; empty: string }) {
  const { t } = useTranslation();
  return (
    <section className="space-y-3 border-t border-line pt-6">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="font-bold">{title}</h3>
        {badge && <Badge>{badge}</Badge>}
      </div>
      {steps.length > 0 ? (
        <ul className="space-y-3">
          {steps.map((step, index) => (
            <li key={`${step.titleKey}-${index}`} className="space-y-1 rounded-xl border border-line bg-canvas p-4">
              <p className="text-sm font-bold leading-relaxed">{t(step.titleKey)}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                <span>{t(EXECUTION_KEY[step.execution])}</span>
                {step.execution === 'user' && !badge && <Badge tone="gold">{t('receipt.user_action')}</Badge>}
                {step.authorityKey && <span>· {t(step.authorityKey)}</span>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">{empty}</p>
      )}
    </section>
  );
}

function ReceiptSection({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <section className="space-y-3 border-t border-line pt-6">
      <h3 className="font-bold">{title}</h3>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="flex gap-2 text-sm leading-relaxed text-ink-muted">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mint-fg" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">{empty}</p>
      )}
    </section>
  );
}
