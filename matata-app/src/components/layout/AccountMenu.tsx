'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { getRole, clearAuth } from '@/lib/auth';
import type { Role } from '@/lib/types';

/**
 * Small header widget for the public-facing (non-analyst) app that reflects
 * whether the current visitor is anonymous or a phone-verified reporter.
 *
 * Until now there was no visible difference between the two states and no
 * way for a signed-in reporter to see their history or log out — this
 * closes that gap without getting in the way of anonymous reporting, which
 * remains fully optional.
 */
export function AccountMenu() {
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    setRole(getRole());
    setMounted(true);
  }, []);

  // Avoid a server/client render mismatch — render nothing until the
  // client-only localStorage check has run.
  if (!mounted) return null;

  const isVerifiedReporter = role === 'reporter';

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      // Token may already be expired/revoked — clear local state regardless.
    }
    clearAuth();
    window.location.href = '/';
  }

  if (!isVerifiedReporter) {
    return (
      <Link
        href="/login"
        className="text-xs font-medium text-[#006EB5] hover:underline whitespace-nowrap"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 whitespace-nowrap">
      <Link href="/my-reports" className="text-xs font-medium text-[#006EB5] hover:underline">
        My reports
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="text-xs font-medium text-[#55606E] hover:text-[#232E3D] transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
