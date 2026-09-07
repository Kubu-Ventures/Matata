'use client';

import { PrivyProvider } from '@privy-io/react-auth';

/**
 * Wraps the app in Privy's context so the login pages can run the hosted
 * email OTP flow (`useLoginWithEmail`). We use Privy for authentication only —
 * no wallets, no social logins.
 *
 * `NEXT_PUBLIC_PRIVY_APP_ID` must point at the same Privy app the backend
 * verifies tokens against (`PRIVY_APP_ID`), and that app must have
 * "Return user data in an identity token" enabled so provisioned analysts
 * resolve to their elevated role.
 *
 * If the env var is missing (e.g. a preview build without secrets) we skip the
 * provider rather than crash — the login pages then surface a clear error.
 */
export function PrivyClientProvider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    if (typeof window !== 'undefined') {
      console.warn(
        '[Privy] NEXT_PUBLIC_PRIVY_APP_ID is not set — email OTP login is disabled.'
      );
    }
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        // Authentication only — email OTP, no wallets, no social logins.
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
