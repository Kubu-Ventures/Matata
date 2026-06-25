'use client';

import { useEffect, useState } from 'react';
import { getPendingCount } from '@/lib/offline';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';

export default function OfflineBanner() {
  const { locale } = useLanguage();
  const [isOnline, setIsOnline] = useState(true);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    setPending(getPendingCount());

    const handleOnline = () => { setIsOnline(true); setPending(getPendingCount()); };
    const handleOffline = () => setIsOnline(false);
    const handleSync = () => setPending(getPendingCount());

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('matata_sync', handleSync);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('matata_sync', handleSync);
    };
  }, []);

  if (isOnline && pending === 0) return null;

  if (!isOnline) {
    return (
      <div role="alert" className="fixed top-0 inset-x-0 z-50 bg-[#FBC412] text-[#232E3D] text-sm font-medium px-4 py-2 text-center">
        {t(locale, 'offline.banner')}
      </div>
    );
  }

  return (
    <div role="status" className="fixed top-0 inset-x-0 z-50 bg-[#006EB5] text-white text-sm font-medium px-4 py-2 text-center">
      {t(locale, 'offline.pending_count', { count: pending })}
    </div>
  );
}
