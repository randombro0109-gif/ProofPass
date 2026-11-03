import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { CONTACT_OPTIONS } from '@/i18n/keys';
import { createId } from '@/state/ids';
import { useAppState } from '@/state/useAppState';
import { Button } from '@/components/ui/primitives';
import type { RecordType } from '@/types';
import type { TranslationKey } from '@/i18n/en';

const FIELD_CLASS =
  'min-h-12 w-full rounded-xl border border-line bg-canvas px-4 text-base focus:border-active focus:outline-none focus:ring-2 focus:ring-active/30';

export function ProvideForm({
  journeyId,
  taskId,
  recordType,
  inputKind,
  placeholderKey,
}: {
  journeyId: string;
  taskId: string;
  recordType: RecordType;
  inputKind: 'text' | 'contact';
  placeholderKey?: TranslationKey;
}) {
  const { dispatch } = useAppState();
  const { t } = useTranslation();
  const [value, setValue] = useState(inputKind === 'contact' ? CONTACT_OPTIONS[0].value : '');
  const [error, setError] = useState(false);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError(true);
      return;
    }
    dispatch({
      type: 'task/provide',
      journeyId,
      taskId,
      recordId: createId('rec'),
      value: trimmed,
      now: new Date().toISOString(),
    });
  };

  const fieldId = `provide-${taskId}`;

  return (
    <form
      className="space-y-3"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <label htmlFor={fieldId} className="sr-only">
        {t(`record.${recordType}` as TranslationKey)}
      </label>
      {inputKind === 'contact' ? (
        <select id={fieldId} value={value} onChange={(event) => setValue(event.target.value)} className={FIELD_CLASS}>
          {CONTACT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={fieldId}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(false);
          }}
          placeholder={placeholderKey ? t(placeholderKey) : undefined}
          aria-invalid={error || undefined}
          className={FIELD_CLASS}
        />
      )}
      {error && (
        <p role="alert" className="text-sm font-bold text-red-fg">
          {t('task.provide.error')}
        </p>
      )}
      <Button type="submit">{t('task.provide.action')}</Button>
    </form>
  );
}
