import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppState } from '@/state/useAppState';
import { RECORD_KEY } from '@/i18n/keys';
import { recordValueText } from '@/i18n/recordText';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/primitives';
import type { TranslationKey } from '@/i18n/en';
import type { Language, ProofRecord, TextSize, ThemeMode } from '@/types';

const SOURCE_KEY: Record<ProofRecord['source'], TranslationKey> = {
  profile: 'record.source_profile',
  provided: 'record.source_provided',
  instruction: 'record.source_instruction',
};

const VERIFICATION_KEY: Record<ProofRecord['verification'], TranslationKey> = {
  self_declared: 'record.verification_self_declared',
  not_verified: 'record.verification_not_verified',
};

export function SettingsScreen() {
  const { state, dispatch, syncStatus } = useAppState();
  const { t } = useTranslation();
  const [name, setName] = useState(state.displayName);
  const [confirmingReset, setConfirmingReset] = useState(false);

  useEffect(() => {
    setName(state.displayName);
  }, [state.displayName]);

  const saveName = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch({ type: 'settings/displayName', displayName: name });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-up">
      <h1 className="text-3xl font-bold leading-tight">{t('settings.title')}</h1>

      <Section title={t('settings.language')}>
        <Segmented<Language>
          value={state.language}
          onChange={(language) => dispatch({ type: 'settings/language', language })}
          options={[
            { value: 'en', label: t('settings.language_en') },
            { value: 'ar', label: t('settings.language_ar') },
          ]}
        />
      </Section>

      <Section title={t('settings.theme')}>
        <Segmented<ThemeMode>
          value={state.theme}
          onChange={(theme) => dispatch({ type: 'settings/theme', theme })}
          options={[
            { value: 'light', label: t('settings.theme_light') },
            { value: 'dark', label: t('settings.theme_dark') },
          ]}
        />
      </Section>

      <Section title={t('settings.text_size')} help={t('settings.text_help')}>
        <Segmented<TextSize>
          value={state.textSize ?? 'standard'}
          onChange={(textSize) => dispatch({ type: 'settings/textSize', textSize })}
          options={[
            { value: 'standard', label: t('settings.text_standard') },
            { value: 'large', label: t('settings.text_large') },
            { value: 'xlarge', label: t('settings.text_xlarge') },
          ]}
        />
      </Section>

      <Section title={t('demo.profile_title')} help={t('demo.profile_body')}>
        <p className="text-sm font-bold">{state.displayName}</p>
      </Section>

      <Section title={t('settings.profile')}>
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={saveName}>
          <label className="flex-1 space-y-2">
            <span className="text-sm font-bold">{t('settings.display_name')}</span>
            <input
              value={name}
              maxLength={60}
              onChange={(event) => setName(event.target.value)}
              className="min-h-12 w-full rounded-xl border border-line bg-canvas px-4 text-base focus:border-active focus:outline-none focus:ring-2 focus:ring-active/30"
            />
          </label>
          <Button type="submit">{t('common.save')}</Button>
        </form>
        <p className="text-xs font-bold text-ink-muted" aria-live="polite">
          {syncStatus === 'saved' && t('settings.saved')}
          {(syncStatus === 'local' || syncStatus === 'error') && (
            <span className="text-gold-fg">{t('settings.sync_error')}</span>
          )}
        </p>
      </Section>

      <Section title={t('settings.records')} help={t('settings.records_help')}>
        {state.records.length === 0 ? (
          <p className="text-sm text-ink-muted">{t('settings.records_empty')}</p>
        ) : (
          <ul className="space-y-3">
            {state.records.map((record) => (
              <li
                key={record.id}
                className="flex flex-col gap-3 rounded-xl border border-line bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-bold">{t(RECORD_KEY[record.type])}</p>
                  <p className="text-sm text-ink-muted">{recordValueText(record, t)}</p>
                  <p className="text-xs text-ink-muted">
                    {t(SOURCE_KEY[record.source])} · {t(VERIFICATION_KEY[record.verification])}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs font-bold text-ink-muted">
                    {t(record.reusable ? 'settings.reuse_on' : 'settings.reuse_off')}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={record.reusable}
                    aria-label={t('settings.reusable')}
                    onClick={() =>
                      dispatch({ type: 'settings/toggleRecord', recordId: record.id, now: new Date().toISOString() })
                    }
                    className={cn(
                      'relative h-7 w-12 shrink-0 rounded-full transition duration-200',
                      record.reusable ? 'bg-action' : 'bg-surface-muted',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200',
                        record.reusable ? 'start-6' : 'start-1',
                      )}
                    />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={t('settings.reset')} help={t('settings.reset_help')}>
        {confirmingReset ? (
          <div className="space-y-4">
            <p className="text-sm font-bold text-red-fg">{t('settings.reset_confirm')}</p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="danger"
                onClick={() => {
                  dispatch({ type: 'app/reset', now: new Date().toISOString() });
                  setConfirmingReset(false);
                }}
              >
                {t('settings.reset_button')}
              </Button>
              <Button variant="secondary" onClick={() => setConfirmingReset(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setConfirmingReset(true)}>
            {t('settings.reset_button')}
          </Button>
        )}
      </Section>

      <Section title={t('privacy.title')}>
        <ul className="space-y-3 text-sm leading-relaxed text-ink-muted">
          <li>{t('privacy.prototype')}</li>
          <li>{t('privacy.local')}</li>
          <li>{t('privacy.no_integration')}</li>
          <li>{t('privacy.no_documents')}</li>
        </ul>
      </Section>

      <Section title={t('settings.about')}>
        <p className="text-sm leading-relaxed text-ink-muted">{t('settings.about_body')}</p>
        <p className="text-xs leading-relaxed text-ink-muted">{t('common.demo_notice')}</p>
      </Section>
    </div>
  );
}

function Section({ title, help, children }: { title: string; help?: string; children: ReactNode }) {
  return (
    <section className="card space-y-4 p-6 sm:p-8">
      <div className="space-y-1">
        <h2 className="text-lg font-bold">{title}</h2>
        {help && <p className="text-sm leading-relaxed text-ink-muted">{help}</p>}
      </div>
      {children}
    </section>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex max-w-full flex-wrap rounded-xl bg-surface-muted p-1" role="group">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'min-h-10 rounded-lg px-5 text-sm font-bold transition duration-200',
              active ? 'bg-royal text-royal-fg shadow-sm' : 'text-ink-muted hover:text-ink',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
