'use client';

import { useEffect } from 'react';
import { syncQueue } from '@/lib/offline';
import { getToken } from '@/lib/auth';

export default function SyncManager() {
  useEffect(() => {
    const handleOnline = async () => {
      const token = getToken();
      await syncQueue(token ?? undefined);
      window.dispatchEvent(new Event('matata_sync'));
    };

    window.addEventListener('online', handleOnline);

    // Attempt sync on mount if already online
    if (navigator.onLine) handleOnline();

    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return null;
}
