import { getAccessToken, getIdentityToken } from '@privy-io/react-auth';
import { authApi } from './api';
import { saveAuth } from './auth';
import type { Role } from './types';

const ELEVATED: Role[] = ['analyst', 'responder', 'admin'];

export interface ExchangeResult {
  role: Role;
  isElevated: boolean;
}

/**
 * Take the Privy session created by `useLoginWithEmail` and exchange it at our
 * backend for a Matata session (`matata_token` + refresh token in
 * localStorage). Everything downstream — `recoverSession`, the `request()`
 * wrapper, refresh rotation — is unchanged; only the proof of identity handed
 * to the backend is different.
 */
export async function exchangePrivySession(): Promise<ExchangeResult> {
  const privyToken = await getAccessToken();
  if (!privyToken) {
    throw new Error('Privy did not return an access token. Please try signing in again.');
  }
  // Identity token carries the verified email so a provisioned analyst resolves
  // to their role. It may be absent if the Privy app has identity tokens
  // disabled — the backend still issues a reporter session in that case.
  let identityToken: string | null = null;
  try {
    identityToken = await getIdentityToken();
  } catch {
    identityToken = null;
  }

  const data = await authApi.verifyPrivy(privyToken, identityToken);
  const role = data.role as Role;
  saveAuth(data.token, role, data.refresh_token);
  return { role, isElevated: ELEVATED.includes(role) };
}

/** Map a Privy `useLoginWithEmail` error to user-facing copy in our tone. */
export function privyErrorMessage(err: unknown): string {
  const msg = (err instanceof Error ? err.message : String(err ?? '')).toLowerCase();
  if (msg.includes('expired')) return 'That code has expired. Request a new one.';
  if (msg.includes('rate') || msg.includes('too many') || msg.includes('limit')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (msg.includes('invalid') || msg.includes('incorrect') || msg.includes('wrong')) {
    return 'That code is not correct. Check it and try again.';
  }
  return 'Something went wrong. Please try again.';
}
