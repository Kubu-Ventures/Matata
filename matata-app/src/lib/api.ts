import type {
  NearbyReport,
  Report,
  AnalystReportDetail,
  PaginatedReports,
  ReportSubmitMetadata,
  ReportListParams,
  ConfirmMergeResponse,
  RejectMergeResponse,
  MergeResponse,
  AIAccuracyResponse,
  StatsSummaryResponse,
  HeatmapFeatureCollection,
  ExportFormat,
  ExportJobResponse,
  ExportJobStatusResponse,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://157.173.121.74:8000/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('matata_token');
}

function getLocale(): string {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('matata_lang') || 'en';
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    'Accept-Language': getLocale(),
    ...(options.headers as Record<string, string> || {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw { status: res.status, message: err.error || res.statusText };
  }
  return res.json();
}

export const authApi = {
  anonymous: () => request<{ session_token: string }>('/auth/anonymous', { method: 'POST' }),
  sendOtp: (phone: string) => request<{ message: string }>('/auth/otp/send', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOtp: (phone: string, otp: string) => request<{ token: string; refresh_token: string; role: string }>('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ phone, otp }) }),
  refresh: (refresh_token: string) => request<{ token: string; refresh_token: string }>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refresh_token }) }),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'DELETE' }),
};

export const reportsApi = {
  nearby: (lat: number, lng: number, radius_m = 30) =>
    request<NearbyReport[]>(`/reports/nearby?lat=${lat}&lng=${lng}&radius_m=${radius_m}`),
  submit: (metadata: ReportSubmitMetadata, photo?: File | Blob | null) => {
    const fd = new FormData();
    fd.append('metadata', JSON.stringify(metadata));
    if (photo) fd.append('photo', photo, photo instanceof File ? photo.name : 'photo.jpg');
    return request<{ id: string; status: string; building_id: string | null }>('/reports', { method: 'POST', body: fd });
  },
  get: (id: string) => request<Report>(`/reports/${id}`),
  uploadPhoto: (id: string, formData: FormData) =>
    request<{ id: string; photo_url: string; status: string }>(`/reports/${id}/photo`, { method: 'PATCH', body: formData }),
};

/** Serialise query parameters into a query string, dropping empty values. */
function toQueryString<T extends object>(
  params: { [Key in keyof T]: string | number | boolean | null | undefined },
): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '' || value === null) return;
    qs.set(key, String(value));
  });
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export const analystApi = {
  listReports: (params: ReportListParams = {}) =>
    request<PaginatedReports>(`/analyst/reports${toQueryString(params)}`),
  getReport: (id: string) => request<AnalystReportDetail>(`/analyst/reports/${id}`),
  updateStatus: (id: string, status: string, reason?: string, notes?: string) =>
    request<Report>(`/analyst/reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason_code: reason, notes }),
    }),
  addNote: (id: string, content: string) =>
    request<{ id: string; body: string; created_at: string }>(`/analyst/reports/${id}/notes`, { method: 'POST', body: JSON.stringify({ body: content }) }),
  overrideSeverity: (id: string, severity: string) =>
    request<Report>(`/analyst/reports/${id}/severity-override`, { method: 'POST', body: JSON.stringify({ analyst_severity_override: severity }) }),
  mergeReports: (primary_id: string, duplicate_id: string) =>
    request<MergeResponse>(`/analyst/reports/merge`, { method: 'POST', body: JSON.stringify({ primary_id, duplicate_ids: [duplicate_id] }) }),

  // ── Feature 2 — pending duplicate-merge review ──────────────────────────
  confirmMerge: (id: string) =>
    request<ConfirmMergeResponse>(`/analyst/reports/${id}/confirm-merge`, { method: 'POST' }),
  rejectMerge: (id: string) =>
    request<RejectMergeResponse>(`/analyst/reports/${id}/reject-merge`, { method: 'POST' }),

  // ── Feature 3 — AI accuracy / active-learning calibration ──────────────
  getAIAccuracy: () => request<AIAccuracyResponse>('/analyst/ai-accuracy'),
};

export const statsApi = {
  summary: () => request<StatsSummaryResponse>('/stats/summary'),
  heatmap: () => request<HeatmapFeatureCollection>('/stats/heatmap'),
};

export const exportApi = {
  geojson: (params: Record<string, string> = {}) =>
    request<unknown | ExportJobResponse>(`/export/geojson${toQueryString(params)}`),
  csv: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return `${BASE_URL}/export/csv${qs ? '?' + qs : ''}`;
  },
  jobStatus: (jobId: string) =>
    request<ExportJobStatusResponse>(`/export/jobs/${jobId}`),

  /**
   * Trigger an export for the given format + filters and resolve to a Blob
   * once ready — transparently follows the async job path (poll every 2s,
   * up to ~2 minutes) when the dataset exceeds the server's sync threshold.
   */
  async download(
    format: ExportFormat,
    params: Record<string, string> = {},
    onStatus?: (status: 'requesting' | 'processing' | 'downloading') => void,
  ): Promise<Blob> {
    const token = getToken();
    onStatus?.('requesting');
    const res = await fetch(`${BASE_URL}/export/${format}${toQueryString(params)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw { status: res.status, message: err.error || res.statusText };
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      // Async path — { job_id, status: "processing" }
      const { job_id } = (await res.json()) as ExportJobResponse;
      onStatus?.('processing');
      const startedAt = Date.now();
      const TIMEOUT_MS = 2 * 60 * 1000;
      const POLL_MS = 2000;

      while (Date.now() - startedAt < TIMEOUT_MS) {
        await new Promise(r => setTimeout(r, POLL_MS));
        const job = await exportApi.jobStatus(job_id);
        if (job.status === 'complete' && job.download_url) {
          onStatus?.('downloading');
          const fileRes = await fetch(job.download_url);
          if (!fileRes.ok) throw { status: fileRes.status, message: 'Download link expired or unavailable.' };
          return fileRes.blob();
        }
        if (job.status === 'failed') {
          throw { status: 500, message: 'Export job failed. Please try again with a narrower filter.' };
        }
      }
      throw { status: 408, message: 'Export is taking longer than expected — check back shortly.' };
    }

    // Synchronous path — file bytes returned directly.
    onStatus?.('downloading');
    return res.blob();
  },
};

export const adminApi = {
  provisionUser: (phone: string, role: string) =>
    request<{ message: string; account: { id: string; role: string } }>('/auth/analyst/register', { method: 'POST', body: JSON.stringify({ phone, role }) }),
};