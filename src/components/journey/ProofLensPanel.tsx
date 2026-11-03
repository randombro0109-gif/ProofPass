import { useTranslation } from '@/hooks/useTranslation';
import { useAppState } from '@/state/useAppState';
import { buildLens } from '@/domain/proofLens';
import { RECORD_KEY } from '@/i18n/keys';
import { recordValueText } from '@/i18n/recordText';
import type { Journey } from '@/types';

export function ProofLensPanel({ journey }: { journey: Journey }) {
  const { state } = useAppState();
  const { t } = useTranslation();
  const lens = buildLens(journey, state.records);
  const completed = journey.tasks.filter((task) => task.status === 'completed');

  return (
    <section className="card space-y-5 p-6" aria-labelledby="proof-lens-title">
      <div className="space-y-1">
        <h2 id="proof-lens-title" className="text-lg font-bold">
          {t('lens.title')}
        </h2>
        <p className="text-sm leading-relaxed text-ink-muted">{t('lens.subtitle')}</p>
      </div>

      <div className="space-y-2">
        <div
          className="h-2 overflow-hidden rounded-full bg-surface-muted"
          role="progressbar"
          aria-valuenow={lens.percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-action transition-all duration-700" style={{ width: `${lens.percent}%` }} />
        </div>
        <p className="text-xs font-bold text-ink-muted">{t('lens.percent', { percent: lens.percent })}</p>
      </div>

      <LensGroup title={t('lens.ready')} empty={t('lens.ready_none')} items={completed.map((task) => t(task.titleKey))} />
      <LensGroup
        title={t('lens.available')}
        empty={t('lens.available_none')}
        items={lens.available.map((record) => `${t(RECORD_KEY[record.type])}: ${recordValueText(record, t)}`)}
      />
      <LensGroup title={t('lens.missing')} empty={t('lens.missing_none')} items={lens.missing.map((task) => t(task.titleKey))} />
      {lens.permissionTasks.length > 0 && (
        <LensGroup title={t('lens.permission')} items={lens.permissionTasks.map((task) => t(task.titleKey))} />
      )}

      <div className="space-y-1 border-t border-line pt-4">
        <p className="text-sm font-bold">{t('lens.next')}</p>
        <p className="text-sm leading-relaxed text-ink-muted">
          {lens.next ? t(lens.next.titleKey) : t('journey.next_none')}
        </p>
      </div>

      <p className="text-xs leading-relaxed text-ink-muted">{t('lens.dont_repeat')}</p>
    </section>
  );
}

function LensGroup({ title, empty, items }: { title: string; empty?: string; items: string[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold">{title}</h3>
      {items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="flex gap-2 text-sm leading-relaxed text-ink-muted">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        empty && <p className="text-sm text-ink-muted">{empty}</p>
      )}
    </div>
  );
}
