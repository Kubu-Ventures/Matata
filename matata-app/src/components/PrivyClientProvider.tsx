'use client';

import { useEffect, useState } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';

const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

/**
 * Wraps the app in Privy's context so the login screens can run the hosted
 * email OTP flow (`useLoginWithEmail`). Authentication only — no wallets, no
 * social logins.
 *
 * `PrivyProvider` initialises against the network and validates its app ID, so
 * it must never run during static prerendering. We therefore mount it only
 * after client hydration; on the server (and the first client paint) the app
 * renders normally without it. The login screens themselves are `ssr: false`
 * dynamic imports, so by the time they call Privy hooks the provider is up.
 *
 * `NEXT_PUBLIC_PRIVY_APP_ID` must match the backend `PRIVY_APP_ID`, and the
 * Privy app must have "Return user data in an identity token" enabled so
 * provisioned analysts resolve to their role. If it is unset the provider is
 * skipped and the login screens show a "not configured" message.
 */
export function PrivyClientProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !APP_ID) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={APP_ID}
      config={{
        loginMethods: ['email'],
        embeddedWallets: {
          ethereum: { createOnLogin: 'off' },
          solana: { createOnLogin: 'off' },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}

/** Is Privy email OTP login configured for this build? */
export const isPrivyConfigured = Boolean(APP_ID);

/**
 * Best-effort teardown of a Privy browser session without needing the
 * `usePrivy()` hook (which requires the provider and cannot be called from
 * server-rendered shared components). Clears our own session separately.
 */
export function clearPrivySession() {
  if (typeof window === 'undefined') return;
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith('privy:')) window.localStorage.removeItem(key);
    }
  } catch {
    /* localStorage unavailable — nothing to clear */
  }
}
