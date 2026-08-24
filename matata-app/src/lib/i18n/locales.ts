export const LOCALES = {
  en: { label: 'English', short: 'EN', dir: 'ltr' },
  fr: { label: 'Français', short: 'FR', dir: 'ltr' },
  ar: { label: 'العربية', short: 'AR', dir: 'rtl' },
  es: { label: 'Español', short: 'ES', dir: 'ltr' },
  sw: { label: 'Kiswahili', short: 'SW', dir: 'ltr' },
  ha: { label: 'Hausa', short: 'HA', dir: 'ltr' },
  am: { label: 'አማርኛ', short: 'AM', dir: 'ltr' },
  zh: { label: '中文', short: 'ZH', dir: 'ltr' },
  ru: { label: 'Русский', short: 'RU', dir: 'ltr' },
  so: { label: 'Soomaali', short: 'SO', dir: 'ltr' },
} as const;

export type Locale = keyof typeof LOCALES;
export const DEFAULT_LOCALE: Locale = 'en';
