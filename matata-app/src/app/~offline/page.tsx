'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';

export default function Offline() {
  const { locale } = useLanguage();

  useEffect(() => {
    // This static document is served directly by the service worker
    // whenever a navigation fails while offline (see `fallbacks.document`
    // in next.config.ts) -- it has no client-side router wiring of its
    // own, so without this it would sit here forever even once
    // connectivity returns. Reporters had to manually refresh or hit the
    // browser's back button to escape it.
    const tryReload = () => {
      if (navigator.onLine) window.location.reload();
    };
    window.addEventListener('online', tryReload);
    const interval = setInterval(tryReload, 5000);
    return () => {
      window.removeEventListener('online', tryReload);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 gap-4">
      <h1 className="text-xl font-semibold text-[#232E3D] mb-2">{t(locale, 'offline_fallback.title')}</h1>
      <p className="text-sm text-[#55606E] max-w-sm">
        {t(locale, 'offline_fallback.desc')}
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-2 px-6 py-2.5 bg-[#006EB5] text-white text-sm font-semibold rounded hover:bg-[#005a94] transition-colors"
      >
        {t(locale, 'offline_fallback.retry')}
      </button>
    </div>
  );
}
