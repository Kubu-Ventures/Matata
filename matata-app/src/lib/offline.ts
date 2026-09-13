import { fetchWithAuthRetry } from './api';

const QUEUE_KEY = 'matata_offline_queue';

export interface OfflineReport {
  localId: string;
  submittedAt: string;
  synced: boolean;
  serverId?: string;
  fields: {
    crisis_type: string;
    infrastructure_type: string;
    damage_severity: string;
    landmark_description?: string;
    lat?: number;
    lng?: number;
    electricity_status?: string;
    health_services_status?: string;
    most_pressing_needs?: string;
    debris_clearing_needed?: boolean;
    offline_queued_at: string;
  };
  photoDataUrl?: string;
}

function loadQueue(): OfflineReport[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(queue: OfflineReport[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function addToQueue(report: Omit<OfflineReport, 'localId' | 'submittedAt' | 'synced'>): string {
  const queue = loadQueue();
  const localId = `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  queue.push({ ...report, localId, submittedAt: new Date().toISOString(), synced: false });
  saveQueue(queue);
  return localId;
}

export function getPendingCount(): number {
  return loadQueue().filter(r => !r.synced).length;
}

export function getPendingReports(): OfflineReport[] {
  return loadQueue().filter(r => !r.synced);
}

export function markSynced(localId: string, serverId: string) {
  const queue = loadQueue().map(r => r.localId === localId ? { ...r, synced: true, serverId } : r);
  saveQueue(queue);
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

let isSyncing = false;

export async function syncQueue(): Promise<void> {
  if (isSyncing) return;
  const pending = getPendingReports();
  if (pending.length === 0) return;

  isSyncing = true;
  try {
    await syncPendingReports(pending);
  } finally {
    isSyncing = false;
  }
}

async function syncPendingReports(pending: OfflineReport[]): Promise<void> {
  for (const report of pending) {
    try {
      const fd = new FormData();
      fd.append('metadata', JSON.stringify(report.fields));

      // fetchWithAuthRetry (shared with every online API call) mints a
      // fresh session on a 401 before retrying once. A raw fetch() here
      // would silently and permanently fail once the stored access token
      // expires (60 min) -- easily outlived by an offline stretch -- since
      // there'd be nothing to refresh it and every retry would 401 forever.
      const res = await fetchWithAuthRetry('/reports', { method: 'POST', body: fd });
      if (!res.ok) continue;

      const data = await res.json();
      const serverId: string = data.id;
      markSynced(report.localId, serverId);

      if (report.photoDataUrl && serverId) {
        try {
          const blob = dataUrlToBlob(report.photoDataUrl);
          const photoFd = new FormData();
          photoFd.append('photo', blob, 'photo.jpg');
          await fetchWithAuthRetry(`/reports/${serverId}/photo`, { method: 'PATCH', body: photoFd });
        } catch {
          // Photo upload failure is non-critical
        }
      }
    } catch {
      // Network failure — will retry next time
    }
  }
}
