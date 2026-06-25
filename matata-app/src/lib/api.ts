import type { NearbyReport, Report, AnalystReportDetail, PaginatedReports } from './types';

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
  submit: (formData: FormData) =>
    request<{ id: string; status: string; building_id: string | null }>('/reports', { method: 'POST', body: formData }),
  get: (id: string) => request<Report>(`/reports/${id}`),
  uploadPhoto: (id: string, formData: FormData) =>
    request<{ id: string; photo_url: string; status: string }>(`/reports/${id}/photo`, { method: 'PATCH', body: formData }),
};

export const analystApi = {
  listReports: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<PaginatedReports>(`/analyst/reports${qs ? '?' + qs : ''}`);
  },
  getReport: (id: string) => request<AnalystReportDetail>(`/analyst/reports/${id}`),
  updateStatus: (id: string, status: string, reason?: string) =>
    request<Report>(`/analyst/reports/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason }) }),
  addNote: (id: string, content: string) =>
    request<{ id: string; content: string; created_by: string; created_at: string }>(`/analyst/reports/${id}/notes`, { method: 'POST', body: JSON.stringify({ content }) }),
  overrideSeverity: (id: string, severity: string) =>
    request<Report>(`/analyst/reports/${id}/severity`, { method: 'PATCH', body: JSON.stringify({ severity }) }),
  mergeReports: (primary_id: string, duplicate_id: string) =>
    request<Report>(`/analyst/reports/merge`, { method: 'POST', body: JSON.stringify({ primary_id, duplicate_id }) }),
};

export const exportApi = {
  geojson: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<unknown>(`/export/geojson${qs ? '?' + qs : ''}`);
  },
  csv: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return `${BASE_URL}/export/csv${qs ? '?' + qs : ''}`;
  },
};

export const adminApi = {
  provisionUser: (phone: string, role: string) =>
    request<{ message: string; user_id: string }>('/admin/users', { method: 'POST', body: JSON.stringify({ phone, role }) }),
};
