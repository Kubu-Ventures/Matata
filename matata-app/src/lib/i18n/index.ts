import { en, TranslationKey } from './translations/en';
import { fr } from './translations/fr';
import { ar } from './translations/ar';
import { es } from './translations/es';
import { sw } from './translations/sw';
import { ha } from './translations/ha';
import { am } from './translations/am';
import { zh } from './translations/zh';
import { ru } from './translations/ru';
import { so } from './translations/so';
import type { Locale } from './locales';

const translations: Record<Locale, Record<TranslationKey, string>> = {
  en, fr, ar, es, sw, ha, am, zh, ru, so,
};

export function t(locale: Locale, key: TranslationKey, vars?: Record<string, string | number>): string {
  const dict = translations[locale] ?? translations.en;
  let str = dict[key] ?? translations.en[key] ?? key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replaceAll(`{${k}}`, String(v));
    });
  }
  return str;
}

export type { TranslationKey, Locale };
