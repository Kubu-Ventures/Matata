'use client';

import { PrivyProvider as PrivyAuthProvider } from '@privy-io/react-auth';

export default function PrivyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivyAuthProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ['email'],
      }}
    >
      {children}
    </PrivyAuthProvider>
  );
}