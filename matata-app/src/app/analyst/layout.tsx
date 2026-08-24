'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getToken, getRole, clearAuth } from '@/lib/auth';
import { authApi, statsApi } from '@/lib/api';
import { AnalystStreamProvider, useAnalystStreamContext } from '@/contexts/AnalystStreamContext';

const NAV_ITEMS = [
  { href: '/analyst/overview', label: 'Overview', icon: '🏠' },
  { href: '/analyst/dashboard', label: 'Reports', icon: '📋' },
  { href: '/analyst/heatmap', label: 'Heatmap', icon: '🔥' },
  { href: '/analyst/merge-review', label: 'Merge Review', icon: '🔀', badgeKey: 'pending_duplicate_count' as const },
  { href: '/analyst/ai-accuracy', label: 'AI Accuracy', icon: '🤖' },
  { href: '/analyst/export', label: 'Export', icon: '⬇️' },
  { href: '/analyst/admin', label: 'Accounts', icon: '👥', adminOnly: true },
];

const STREAM_STATUS_META: Record<string, { label: string; dot: string }> = {
  live: { label: 'Live', dot: 'bg-green-400' },
  connecting: { label: 'Connecting…', dot: 'bg-yellow-400 animate-pulse' },
  reconnecting: { label: 'Reconnecting…', dot: 'bg-yellow-400 animate-pulse' },
  offline: { label: 'Offline', dot: 'bg-white/30' },
};

function Sidebar({ role, pathname, onLogout }: { role: string | null; pathname: string; onLogout: () => void }) {
  const { status } = useAnalystStreamContext();
  const [pendingMerges, setPendingMerges] = useState<number | null>(null);
  const streamMeta = STREAM_STATUS_META[status];

  useEffect(() => {
    let cancelled = false;
    statsApi
      .summary()
      .then(s => {
        if (!cancelled) setPendingMerges(s.pending_duplicate_count);
      })
      .catch(() => {});
    const interval = setInterval(() => {
      statsApi
        .summary()
        .then(s => {
          if (!cancelled) setPendingMerges(s.pending_duplicate_count);
        })
        .catch(() => {});
    }, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <aside className="w-56 bg-[#232E3D] flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#006EB5] rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="font-semibold text-white text-sm">Matata</span>
        </Link>
        <p className="text-xs text-white/40 mt-1 capitalize">{role} portal</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.filter(n => !n.adminOnly || role === 'admin').map(item => {
          const badgeCount = item.badgeKey === 'pending_duplicate_count' ? pendingMerges : null;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between gap-2.5 px-3 py-2 rounded text-sm transition-colors ${
                pathname.startsWith(item.href)
                  ? 'bg-[#006EB5] text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </span>
              {!!badgeCount && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#FBC412] text-[#232E3D] text-[10px] font-bold">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-2 border-t border-white/10">
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/50">
          <span className={`w-1.5 h-1.5 rounded-full ${streamMeta.dot}`} />
          <span>{streamMeta.label} feed</span>
        </div>
      </div>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <span>🚪</span>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

export default function AnalystLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  const isLoginPage = pathname === '/analyst/login';

  useEffect(() => {
    if (isLoginPage) {
      setChecked(true);
      return;
    }
    const token = getToken();
    const role = getRole();
    if (!token || !['analyst', 'responder', 'admin'].includes(role || '')) {
      router.replace('/analyst/login');
      return;
    }
    if (pathname.startsWith('/analyst/admin') && role !== 'admin') {
      router.replace('/analyst/dashboard');
      return;
    }
    setChecked(true);
  }, [router, pathname, isLoginPage]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-[#006EB5] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  const role = getRole();

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {}
    clearAuth();
    router.push('/');
  }

  return (
    <AnalystStreamProvider>
      <div className="min-h-screen flex bg-[#F7F8FA]">
        <Sidebar role={role} pathname={pathname} onLogout={handleLogout} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </AnalystStreamProvider>
  );
}
