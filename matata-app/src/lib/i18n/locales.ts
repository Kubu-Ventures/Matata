export const LOCALES = {
  en: { label: 'English', dir: 'ltr', flag: '🇬🇧' },
  fr: { label: 'Français', dir: 'ltr', flag: '🇫🇷' },
  ar: { label: 'العربية', dir: 'rtl', flag: '🇸🇦' },
  es: { label: 'Español', dir: 'ltr', flag: '🇪🇸' },
  sw: { label: 'Kiswahili', dir: 'ltr', flag: '🇰🇪' },
  ha: { label: 'Hausa', dir: 'ltr', flag: '🇳🇬' },
  am: { label: 'አማርኛ', dir: 'ltr', flag: '🇪🇹' },
  zh: { label: '中文', dir: 'ltr', flag: '🇨🇳' },
  ru: { label: 'Русский', dir: 'ltr', flag: '🇷🇺' },
  so: { label: 'Soomaali', dir: 'ltr', flag: '🇸🇴' },
} as const;

export type Locale = keyof typeof LOCALES;
export const DEFAULT_LOCALE: Locale = 'en';
