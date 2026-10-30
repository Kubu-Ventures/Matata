'use client';

import { useEffect } from 'react';
import { prefetchBuildingsAround, refreshFacilities, syncOfflineAreas } from '@/lib/offlineData';

// Don't run the area downloads more than every 6 hours.
const AREA_CHECK_KEY = 'matata_offline_area_checked_at';
const AREA_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

/**
 * Quietly saves what the report form needs offline: the health facility
 * list, and the building outlines around the phone's location. Runs when
 * the app opens online and whenever the connection comes back. It never
 * asks for location permission; it only uses the location if the reporter
 * already allowed it (the report form asks, so field reporters will have).
 */
export default function OfflineDataPrefetcher() {
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (cancelled || !navigator.onLine) return;
      refreshFacilities().catch(() => {});

      try {
        const last = Number(localStorage.getItem(AREA_CHECK_KEY) || 0);
        if (Date.now() - last < AREA_CHECK_INTERVAL_MS) return;
      } catch {
        /* storage unavailable: carry on */
      }
      try {
        localStorage.setItem(AREA_CHECK_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }

      // Location, only if the reporter already allowed it; never prompt.
      let granted = false;
      try {
        granted =
          !!navigator.geolocation &&
          !!navigator.permissions &&
          (await navigator.permissions.query({ name: 'geolocation' as PermissionName })).state === 'granted';
      } catch {
        granted = false;
      }
      if (cancelled) return;
      if (!granted) {
        // Home areas don't need a location.
        syncOfflineAreas(null, null).catch(() => {});
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => {
          if (cancelled) return;
          const { latitude, longitude } = pos.coords;
          prefetchBuildingsAround(latitude, longitude)
            .then(() => syncOfflineAreas(latitude, longitude))
            .catch(() => {});
        },
        () => {
          syncOfflineAreas(null, null).catch(() => {});
        },
        { enableHighAccuracy: false, maximumAge: 30 * 60 * 1000, timeout: 20000 },
      );
    }

    // Let the page finish loading before using the network for this.
    const timer = window.setTimeout(run, 4000);
    const onOnline = () => run();
    window.addEventListener('online', onOnline);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  return null;
}
