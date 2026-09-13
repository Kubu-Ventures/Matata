import { getAccessToken } from '@privy-io/react-auth';
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
 * Take the Privy session created by `useLoginWithEmail` and exchange it at our
 * backend for a Matata session (`matata_token` + refresh token in
 * localStorage). Everything downstream — `recoverSession`, the `request()`
 * wrapper, refresh rotation — is unchanged; only the proof of identity handed
 * to the backend is different.
 *
 * `identityToken` must come from the caller's own `useIdentityToken()` hook
 * value, not the standalone `getIdentityToken()` function — that function
 * calls into Privy's internal client over the network and, called right as
 * login completes, that internal reference is often not wired up yet, so it
 * silently resolves to null instead of throwing (confirmed via backend
 * logging showing the identity token never arriving even for a correctly
 * provisioned account). `useIdentityToken()` reads from Privy's own React
 * context instead, which `PrivyProvider` keeps genuinely up to date.
 */
export async function exchangePrivySession(
  identityToken: string | null
): Promise<ExchangeResult> {
  const privyToken = await getAccessToken();
  if (!privyToken) {
    throw new Error('Privy did not return an access token. Please try signing in again.');
  }
  // Identity token carries the verified email so a provisioned analyst resolves
  // to their role. It may be absent if the Privy app has identity tokens
  // disabled — the backend still issues a reporter session in that case.
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
