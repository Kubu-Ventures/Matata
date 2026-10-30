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

    // Area downloads are only marked done once they succeed, so a failed
    // attempt (no signal, server down) is retried the next time.
    function areaCheckDue(): boolean {
      try {
        return Date.now() - Number(localStorage.getItem(AREA_CHECK_KEY) || 0) >= AREA_CHECK_INTERVAL_MS;
      } catch {
        return true;
      }
    }
    function syncAreas(lat: number | null, lng: number | null) {
      if (!areaCheckDue()) return;
      syncOfflineAreas(lat, lng)
        .then(() => {
          try {
            localStorage.setItem(AREA_CHECK_KEY, String(Date.now()));
          } catch {
            /* ignore */
          }
        })
        .catch(() => {});
    }

    async function run() {
      if (cancelled || !navigator.onLine) return;
      refreshFacilities().catch(() => {});

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
        syncAreas(null, null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => {
          if (cancelled) return;
          const { latitude, longitude } = pos.coords;
          // Every time: tiles saved in the last 30 days are skipped, so this
          // costs nothing when the reporter hasn't moved.
          prefetchBuildingsAround(latitude, longitude)
            .catch(() => {})
            .then(() => syncAreas(latitude, longitude));
        },
        () => syncAreas(null, null),
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
