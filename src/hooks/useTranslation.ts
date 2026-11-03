import { useCallback } from 'react';
import { translate, type Translate } from '@/i18n';
import { useAppState } from '@/state/useAppState';

export function useTranslation() {
  const { state } = useAppState();
  const language = state.language;
  const t: Translate = useCallback((key, params) => translate(language, key, params), [language]);
  return { t, language, dir: language === 'ar' ? ('rtl' as const) : ('ltr' as const) };
}
