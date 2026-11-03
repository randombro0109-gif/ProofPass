import { en, type TranslationKey } from './en';
import { ar } from './ar';
import type { Language } from '@/types';

const dictionaries: Record<Language, Record<TranslationKey, string>> = { en, ar };

export type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string;

export function translate(language: Language, key: TranslationKey, params?: Record<string, string | number>): string {
  const template = dictionaries[language][key] ?? en[key];
  if (!params) return template;
  return Object.entries(params).reduce(
    (text, [name, value]) => text.split(`{${name}}`).join(String(value)),
    template,
  );
}
