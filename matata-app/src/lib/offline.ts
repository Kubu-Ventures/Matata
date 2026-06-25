const QUEUE_KEY = 'matata_offline_queue';

export interface OfflineReport {
  localId: string;
  submittedAt: string;
  synced: boolean;
  serverId?: string;
  fields: {
    crisis_type: string;
    infrastructure_type: string;
    severity: string;
    landmark_description?: string;
    latitude?: number;
    longitude?: number;
    electricity_status?: string;
    health_services_status?: string;
    immediate_needs?: string;
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

export async function syncQueue(token?: string): Promise<void> {
  const pending = getPendingReports();
  if (pending.length === 0) return;

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://157.173.121.74:8000/api/v1';
  const locale = typeof window !== 'undefined' ? (localStorage.getItem('matata_lang') || 'en') : 'en';
  const headers: Record<string, string> = { 'Accept-Language': locale };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  for (const report of pending) {
    try {
      const fd = new FormData();
      Object.entries(report.fields).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, String(v));
      });

      const res = await fetch(`${BASE_URL}/reports`, { method: 'POST', headers, body: fd });
      if (!res.ok) continue;

      const data = await res.json();
      const serverId: string = data.id;
      markSynced(report.localId, serverId);

      if (report.photoDataUrl && serverId) {
        try {
          const blob = dataUrlToBlob(report.photoDataUrl);
          const photoFd = new FormData();
          photoFd.append('photo', blob, 'photo.jpg');
          await fetch(`${BASE_URL}/reports/${serverId}/photo`, { method: 'PATCH', headers, body: photoFd });
        } catch {
          // Photo upload failure is non-critical
        }
      }
    } catch {
      // Network failure — will retry next time
    }
  }
}
