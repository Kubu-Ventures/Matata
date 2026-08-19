import { LanguageProvider } from '@/contexts/LanguageContext'
import { useLanguage as useContextLanguage } from '@/contexts/LanguageContext'
import type { TranslationKey } from '@/lib/i18n'

export { LanguageProvider }

export function useLanguage() {
  const { locale, setLocale, t } = useContextLanguage()
  return {
    locale,
    setLocale,
    translate: (key: string) => t(key as TranslationKey),
  }
}
