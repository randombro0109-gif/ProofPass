import { useState } from 'react';
import { ShieldOff } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppState } from '@/state/useAppState';
import { formatDateTime } from '@/lib/format';
import { Badge, Button } from '@/components/ui/primitives';
import type { TranslationKey } from '@/i18n/en';
import type { Journey, ProofKey, ProofKeyStatus } from '@/types';

const STATUS_KEY: Record<ProofKeyStatus, TranslationKey> = {
  active: 'key.status_active',
  used: 'key.status_used',
  cancelled: 'key.status_cancelled',
  revoked: 'key.status_revoked',
};

export function PermissionsPanel({ journey }: { journey: Journey }) {
  const { state, dispatch } = useAppState();
  const { t, language } = useTranslation();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const keys = state.proofKeys.filter((key) => key.journeyId === journey.id);
  const locked = Boolean(journey.submittedAt);

  const revoke = (key: ProofKey) => {
    dispatch({ type: 'proofKey/revoke', keyId: key.id, now: new Date().toISOString() });
    setConfirmingId(null);
    setFeedback(t('perm.revoked_feedback'));
  };

  return (
    <section className="card space-y-4 p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-bold">{t('perm.title')}</h2>
        <p className="text-sm leading-relaxed text-ink-muted">{t('perm.help')}</p>
      </div>

      {keys.length === 0 ? (
        <p className="text-sm text-ink-muted">{t('perm.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {keys.map((key) => (
            <li key={key.id} className="space-y-3 rounded-xl border border-line bg-canvas p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-ink-muted">{key.reference}</span>
                <Badge tone={key.status === 'used' ? 'mint' : key.status === 'active' ? 'blue' : undefined}>
                  {t(STATUS_KEY[key.status])}
                </Badge>
              </div>
              {key.status === 'used' && key.usedAt && (
                <p className="text-xs text-ink-muted">{t('key.used_at', { time: formatDateTime(key.usedAt, language) })}</p>
              )}
              {key.status === 'used' && !locked && (
                confirmingId === key.id ? (
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-red-fg">{t('perm.revoke_confirm')}</p>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="danger" onClick={() => revoke(key)}>
                        <ShieldOff size={16} />
                        {t('perm.revoke')}
                      </Button>
                      <Button variant="secondary" onClick={() => setConfirmingId(null)}>
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="secondary" onClick={() => setConfirmingId(key.id)}>
                    <ShieldOff size={16} />
                    {t('perm.revoke')}
                  </Button>
                )
              )}
              {key.status === 'used' && locked && <p className="text-xs text-ink-muted">{t('perm.locked_submitted')}</p>}
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm font-bold text-mint-fg" aria-live="polite">
        {feedback}
      </p>
    </section>
  );
}
