'use client';

import { useEffect } from 'react';
import { syncQueue } from '@/lib/offline';

const POLL_MS = 30000;

export default function SyncManager() {
  useEffect(() => {
    const handleOnline = async () => {
      if (!navigator.onLine) return;
      const syncedCount = await syncQueue();
      window.dispatchEvent(new CustomEvent('matata_sync', { detail: { syncedCount } }));
    };

    window.addEventListener('online', handleOnline);

    // Mobile browsers/OSes don't reliably fire 'online' for a backgrounded
    // or already-open PWA (a long-documented gap, not specific to this
    // app), so a pending queue could otherwise sit forever waiting for an
    // event that never comes. Back the event up with a visibility check and
    // a periodic poll -- syncQueue() is a cheap no-op once nothing's queued.
    const handleVisible = () => {
      if (document.visibilityState === 'visible') handleOnline();
    };
    document.addEventListener('visibilitychange', handleVisible);
    const interval = setInterval(handleOnline, POLL_MS);

    // Attempt sync on mount if already online
    handleOnline();

    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisible);
      clearInterval(interval);
    };
  }, []);

  return null;
}
