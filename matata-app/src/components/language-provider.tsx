'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_LOCALE, LOCALES, Locale } from '@/lib/i18n/locales'

const LanguageContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void; translate: (key: string) => string } | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)
  const translate = (currentLocale: Locale, key: string) => {
    const currentStrings = 'strings' in LOCALES[currentLocale] ? (LOCALES[currentLocale].strings as Record<string, string>) : undefined
    const defaultStrings = 'strings' in LOCALES[DEFAULT_LOCALE] ? (LOCALES[DEFAULT_LOCALE].strings as Record<string, string>) : undefined
    return currentStrings?.[key] ?? defaultStrings?.[key] ?? key
  }
  useEffect(() => {
    const saved = window.localStorage.getItem('matata_lang') as Locale | null
    if (saved && saved in LOCALES) setLocaleState(saved)
  }, [])
  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = LOCALES[locale].dir
    window.localStorage.setItem('matata_lang', locale)
  }, [locale])
  const value = useMemo(() => ({ locale, setLocale: setLocaleState, translate: (key: string) => translate(locale, key) }), [locale])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
