import { getAccessToken, getIdentityToken } from '@privy-io/react-auth';
import { authApi } from './api';
import { saveAuth } from './auth';
import type { Role } from './types';
import type { TranslationKey } from './i18n';

const ELEVATED: Role[] = ['analyst', 'responder', 'admin'];

export interface ExchangeResult {
  role: Role;
  isElevated: boolean;
}

/**
 * `getIdentityToken()` isn't a cache read — it calls into Privy's internal
 * client to mint/refresh the token over the network. Called immediately in
 * `onComplete` (the instant `useLoginWithEmail` resolves), that internal
 * client reference is sometimes not wired up yet, so the call silently
 * resolves to null/undefined instead of throwing. A couple of short retries
 * gives it time to catch up before we give up and fall back to a reporter
 * session (the same fallback as before, just far less likely to fire).
 */
async function getIdentityTokenWithRetry(
  attempts = 3,
  delayMs = 300
): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const token = await getIdentityToken();
      if (token) return token;
    } catch {
      // fall through to retry
    }
    if (i < attempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  return null;
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
  const identityToken = await getIdentityTokenWithRetry();

  const data = await authApi.verifyPrivy(privyToken, identityToken);
  const role = data.role as Role;
  saveAuth(data.token, role, data.refresh_token);
  return { role, isElevated: ELEVATED.includes(role) };
}

/**
 * Map a Privy `useLoginWithEmail` error to localised, user-facing copy.
 * `t` is `useLanguage().t`, threaded in by the caller since this file has no
 * component context of its own.
 */
export function privyErrorMessage(
  err: unknown,
  t: (key: TranslationKey) => string
): string {
  const msg = (err instanceof Error ? err.message : String(err ?? '')).toLowerCase();
  if (msg.includes('expired')) return t('errors.otp_expired');
  if (msg.includes('rate') || msg.includes('too many') || msg.includes('limit')) {
    return t('errors.rate_limit_exceeded');
  }
  if (msg.includes('invalid') || msg.includes('incorrect') || msg.includes('wrong')) {
    return t('errors.otp_invalid');
  }
  return t('errors.internal');
}
