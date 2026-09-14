'use client';

import { useEffect, useRef, useState } from 'react';
import { getPendingCount, getFailedReports } from '@/lib/offline';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';

const SUCCESS_DISPLAY_MS = 6000;

export default function OfflineBanner() {
  const { locale } = useLanguage();
  const [isOnline, setIsOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [failedError, setFailedError] = useState<string | null>(null);
  const [showSynced, setShowSynced] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const refresh = () => {
      setPending(getPendingCount());
      const failed = getFailedReports();
      setFailedError(failed.length > 0 ? failed[0].lastError ?? null : null);
    };

    setIsOnline(navigator.onLine);
    refresh();

    const handleOnline = () => { setIsOnline(true); refresh(); };
    const handleOffline = () => setIsOnline(false);
    // Sync happens silently in the background, so without this there was no
    // way to tell whether a queued report actually made it to the server or
    // is still stuck -- the "pending" banner just quietly disappeared, and a
    // report the server actively rejected (bad data, moderation, whatever)
    // would retry forever with zero indication of why. Surface both an
    // explicit success confirmation and the real failure reason.
    const handleSync = (e: Event) => {
      refresh();
      const remaining = getPendingCount();
      const syncedCount = (e as CustomEvent<{ syncedCount?: number }>).detail?.syncedCount ?? 0;
      if (syncedCount > 0 && remaining === 0) {
        setShowSynced(true);
        if (successTimerRef.current) clearTimeout(successTimerRef.current);
        successTimerRef.current = setTimeout(() => setShowSynced(false), SUCCESS_DISPLAY_MS);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('matata_sync', handleSync);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('matata_sync', handleSync);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  if (showSynced) {
    return (
      <div role="status" aria-live="polite" className="fixed top-0 inset-x-0 z-50 bg-green-600 text-white text-sm font-medium px-4 py-2 text-center">
        ✓ {t(locale, 'offline.synced')}
      </div>
    );
  }

  if (isOnline && pending === 0) return null;

  if (!isOnline) {
    return (
      <div role="alert" className="fixed top-0 inset-x-0 z-50 bg-[#FBC412] text-[#232E3D] text-sm font-medium px-4 py-2 text-center">
        {t(locale, 'offline.banner')}
      </div>
    );
  }

  if (failedError) {
    return (
      <div role="alert" className="fixed top-0 inset-x-0 z-50 bg-[#EE402D] text-white text-sm font-medium px-4 py-2 text-center">
        {t(locale, 'offline.sync_failed', { error: failedError })}
      </div>
    );
  }

  return (
    <div role="status" className="fixed top-0 inset-x-0 z-50 bg-[#006EB5] text-white text-sm font-medium px-4 py-2 text-center">
      {t(locale, 'offline.pending_count', { count: pending })}
    </div>
  );
}
