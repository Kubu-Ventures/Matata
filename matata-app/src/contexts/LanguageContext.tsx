'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { LOCALES, DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales';
import { t as translate, type TranslationKey } from '@/lib/i18n';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => key as string,
  dir: 'ltr',
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const saved = localStorage.getItem('matata_lang') as Locale | null;
    if (saved && saved in LOCALES) setLocaleState(saved);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('matata_lang', l);
    document.documentElement.lang = l;
    document.documentElement.dir = LOCALES[l].dir;
  };

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = LOCALES[locale].dir;
  }, [locale]);

  const dir = (LOCALES[locale]?.dir ?? 'ltr') as 'ltr' | 'rtl';

  return (
    <LanguageContext.Provider value={{
      locale,
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
      dir,
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
