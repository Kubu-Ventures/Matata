import type { Role } from './types';

const TOKEN_KEY = 'matata_token';
const REFRESH_KEY = 'matata_refresh';
const ROLE_KEY = 'matata_role';

export function saveAuth(token: string, role: Role, refresh?: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole(): Role | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ROLE_KEY) as Role | null;
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function isAnalyst(): boolean {
  const role = getRole();
  return role === 'analyst' || role === 'responder' || role === 'admin';
}

export function isAdmin(): boolean {
  return getRole() === 'admin';
}
