import { useTranslation } from '@/hooks/useTranslation';
import { useNow } from '@/hooks/useNow';
import { useAppState } from '@/state/useAppState';
import { createId, createReference } from '@/state/ids';
import { proofKeyView, type ProofKeyView } from '@/domain/proofKey';
import { EXECUTION_KEY, RECORD_KEY } from '@/i18n/keys';
import { recordValueText } from '@/i18n/recordText';
import { formatCountdown, formatDateTime } from '@/lib/format';
import { Badge, Button, Modal } from '@/components/ui/primitives';
import type { TranslationKey } from '@/i18n/en';

const STATUS_KEY: Record<ProofKeyView, TranslationKey> = {
  active: 'key.status_active',
  used: 'key.status_used',
  cancelled: 'key.status_cancelled',
  expired: 'key.status_expired',
  revoked: 'key.status_revoked',
};

const STATUS_TONE: Record<ProofKeyView, 'blue' | 'mint' | 'red' | 'gold'> = {
  active: 'blue',
  used: 'mint',
  cancelled: 'red',
  expired: 'gold',
  revoked: 'red',
};

export function ProofKeyModal({ journeyId, taskId, onClose }: { journeyId: string; taskId: string; onClose: () => void }) {
  const { state, dispatch } = useAppState();
  const { t, language } = useTranslation();
  const nowMs = useNow(1000);

  const journey = state.journeys.find((item) => item.id === journeyId);
  const task = journey?.tasks.find((item) => item.id === taskId);
  if (!journey || !task) return null;

  const keys = state.proofKeys.filter((key) => key.journeyId === journeyId && key.taskId === taskId);
  const latest = keys[keys.length - 1];
  const view = latest ? proofKeyView(latest, nowMs) : undefined;
  const records = state.records.filter((record) => record.reusable && task.recordTypes.includes(record.type));

  const approve = () =>
    dispatch({
      type: 'proofKey/approve',
      journeyId,
      taskId,
      keyId: createId('key'),
      reference: createReference(),
      now: new Date().toISOString(),
    });

  return (
    <Modal title={t('key.title')} onClose={onClose}>
      <div className="space-y-6">
        {latest && view && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge tone={STATUS_TONE[view]}>{t(STATUS_KEY[view])}</Badge>
            <span className="text-sm text-ink-muted">
              {t('key.reference')}: <span className="font-mono font-bold text-ink">{latest.reference}</span>
            </span>
          </div>
        )}

        <p className="text-sm leading-relaxed text-ink-muted">{t('key.explain')}</p>

        {records.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold">{t('key.info')}</h3>
          <ul className="space-y-2">
            {records.map((record) => (
              <li key={record.id} className="rounded-xl bg-surface-muted px-4 py-3 text-sm">
                <span className="font-bold">{t(RECORD_KEY[record.type])}</span>
                <span className="block text-ink-muted">{recordValueText(record, t)}</span>
              </li>
            ))}
          </ul>
        </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <h3 className="text-sm font-bold">{t('key.purpose')}</h3>
            <p className="text-sm leading-relaxed text-ink-muted">{t('key.purpose_text', { task: t(task.titleKey) })}</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold">{t('key.process')}</h3>
            <p className="text-sm leading-relaxed text-ink-muted">{t(EXECUTION_KEY[task.execution])}</p>
          </div>
        </div>

        {view === 'active' && latest && (
          <p className="rounded-xl bg-active/10 p-4 text-sm font-bold text-royal">
            {t('key.expires_in', { time: formatCountdown(Date.parse(latest.expiresAt) - nowMs) })}
          </p>
        )}
        {view === 'used' && latest?.usedAt && (
          <p className="text-sm font-bold text-mint-fg">{t('key.used_at', { time: formatDateTime(latest.usedAt, language) })}</p>
        )}
        {view === 'cancelled' && <p className="text-sm leading-relaxed text-red-fg">{t('key.cancelled_text')}</p>}
        {view === 'expired' && <p className="text-sm leading-relaxed text-gold-fg">{t('key.expired_text')}</p>}
        {view === 'revoked' && <p className="text-sm leading-relaxed text-red-fg">{t('key.revoked_text')}</p>}

        <p className="text-xs leading-relaxed text-ink-muted">{t('key.simulated_notice')}</p>

        <div className="flex flex-wrap justify-end gap-3">
          {view === undefined && (
            <>
              <Button variant="secondary" onClick={onClose}>
                {t('key.decline')}
              </Button>
              <Button onClick={approve}>{t('common.approve')}</Button>
            </>
          )}
          {view === 'active' && latest && (
            <>
              <Button
                variant="secondary"
                onClick={() =>
                  dispatch({ type: 'proofKey/cancel', keyId: latest.id, now: new Date().toISOString() })
                }
              >
                {t('key.cancel_permission')}
              </Button>
              <Button
                onClick={() => dispatch({ type: 'proofKey/use', keyId: latest.id, now: new Date().toISOString() })}
              >
                {t('key.use')}
              </Button>
            </>
          )}
          {(view === 'cancelled' || view === 'expired' || view === 'revoked') && <Button onClick={approve}>{t('key.request_again')}</Button>}
          {view === 'used' && <Button onClick={onClose}>{t('common.close')}</Button>}
        </div>
      </div>
    </Modal>
  );
}
