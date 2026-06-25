'use client';

import { useEffect, useRef, useState } from 'react';
import { LOCALES, type Locale } from '@/lib/i18n/locales';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguagePicker() {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Select language"
        className="flex items-center gap-1.5 px-2 py-1.5 rounded text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
      >
        <span>{LOCALES[locale].flag}</span>
        <span className="hidden sm:inline">{LOCALES[locale].label}</span>
        <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 16 16">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute end-0 mt-1 w-44 rounded-lg border border-white/10 bg-[#232E3D] shadow-xl z-50 py-1 overflow-hidden">
          {(Object.entries(LOCALES) as [Locale, typeof LOCALES[Locale]][]).map(([code, info]) => (
            <button
              key={code}
              onClick={() => { setLocale(code); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-white/10 transition-colors text-start ${locale === code ? 'text-[#0093D9] font-medium' : 'text-white/80'}`}
            >
              <span>{info.flag}</span>
              <span>{info.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
