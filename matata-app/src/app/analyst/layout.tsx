'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardList,
  Download,
  Gauge,
  GitMerge,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Menu,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { getToken, getRole, clearAuth } from '@/lib/auth';
import { authApi, statsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { clearPrivySession } from '@/components/PrivyClientProvider';
import { AnalystStreamProvider, useAnalystStreamContext } from '@/contexts/AnalystStreamContext';
import { MatataIcon } from '@/components/layout/MatataIcon';

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: 'pending_duplicate_count';
  adminOnly?: boolean;
}[] = [
  { href: '/analyst/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/analyst/dashboard', label: 'Reports', icon: ClipboardList },
  { href: '/analyst/heatmap', label: 'Heatmap', icon: MapIcon },
  { href: '/analyst/merge-review', label: 'Merge Review', icon: GitMerge, badgeKey: 'pending_duplicate_count' },
  { href: '/analyst/ai-accuracy', label: 'AI Accuracy', icon: Gauge },
  { href: '/analyst/export', label: 'Export', icon: Download },
  { href: '/analyst/admin', label: 'Accounts', icon: Users, adminOnly: true },
];

const STREAM_STATUS_META: Record<string, { label: string; dot: string }> = {
  live: { label: 'Live', dot: 'bg-green-400' },
  connecting: { label: 'Connecting…', dot: 'bg-yellow-400 animate-pulse' },
  reconnecting: { label: 'Reconnecting…', dot: 'bg-yellow-400 animate-pulse' },
  offline: { label: 'Offline', dot: 'bg-white/30' },
};

/** Pending-merge count for the nav badge, refreshed every minute. */
function usePendingMerges() {
  const [pendingMerges, setPendingMerges] = useState<number | null>(null);

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

  return pendingMerges;
}

function NavBadge({ count }: { count: number | null }) {
  if (!count) return null;
  return (
    <span className="inline-flex h-[18px] min-w-[18px] flex-shrink-0 items-center justify-center rounded-full bg-[#FBC412] px-1 text-[10px] font-bold text-[#232E3D]">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function StreamStatus({ className }: { className?: string }) {
  const { status } = useAnalystStreamContext();
  const streamMeta = STREAM_STATUS_META[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80',
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 flex-shrink-0 rounded-full', streamMeta.dot)} />
      <span className="truncate">{streamMeta.label} feed</span>
    </span>
  );
}

function Shell({
  role,
  pathname,
  onLogout,
  mobileOpen,
  onOpen,
  onClose,
  children,
}: {
  role: string | null;
  pathname: string;
  onLogout: () => void;
  mobileOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const pendingMerges = usePendingMerges();
  const items = NAV_ITEMS.filter(n => !n.adminOnly || role === 'admin');

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8FA]">
      <header className="sticky top-0 z-30">
        {/* Brand bar */}
        <div className="bg-[#232E3D]">
          <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={onOpen}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls="analyst-sidebar"
              className="-ml-1.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded text-white/80 hover:bg-white/10 hover:text-white lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <Link href="/" className="flex min-w-0 items-center gap-2.5">
              <MatataIcon className="h-8 w-auto flex-shrink-0" />
              <span className="truncate text-base font-semibold text-white">Matata</span>
            </Link>
            <span className="hidden border-l border-white/20 pl-3 text-xs font-medium capitalize text-white/60 sm:inline">
              {role} portal
            </span>

            <div className="ml-auto flex flex-shrink-0 items-center gap-2">
              <StreamStatus />
              <button
                type="button"
                onClick={onLogout}
                className="hidden items-center gap-2 rounded px-2.5 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white lg:inline-flex"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section tabs — desktop */}
        <nav aria-label="Analyst sections" className="hidden border-b border-[#EDEFF0] bg-white lg:block">
          <div className="mx-auto flex w-full max-w-[1400px] items-stretch gap-1 px-4 sm:px-6 lg:px-8">
            {items.map(item => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    '-mb-px flex h-11 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors',
                    active
                      ? 'border-[#006EB5] text-[#006EB5]'
                      : 'border-transparent text-[#55606E] hover:border-[#EDEFF0] hover:text-[#232E3D]'
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.badgeKey === 'pending_duplicate_count' && <NavBadge count={pendingMerges} />}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Backdrop — mobile only, closes the drawer on click */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      {/* Drawer — phones and tablets */}
      <aside
        id="analyst-sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] transform flex-col bg-white shadow-xl transition-transform duration-200 ease-in-out lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-14 flex-shrink-0 items-center justify-between gap-2 bg-[#232E3D] px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <MatataIcon className="h-8 w-auto flex-shrink-0" />
            <span className="truncate text-base font-semibold text-white">Matata</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <p className="px-4 pt-3 text-xs font-medium uppercase tracking-wide text-[#55606E]">
          {role} portal
        </p>

        <nav aria-label="Analyst sections" className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map(item => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center justify-between gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  active ? 'bg-[#006EB5] text-white' : 'text-[#232E3D] hover:bg-[#F7F8FA]'
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badgeKey === 'pending_duplicate_count' && <NavBadge count={pendingMerges} />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#EDEFF0] p-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-[#232E3D] transition-colors hover:bg-[#F7F8FA]"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>

      <footer className="border-t border-[#EDEFF0] bg-white">
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3 text-xs text-[#55606E] sm:px-6 lg:px-8">
          <span>Reports come from affected residents. Reporter identities are never stored.</span>
          <span>
            Map data ©{' '}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#006EB5] hover:underline"
            >
              OpenStreetMap
            </a>{' '}
            contributors, ODbL
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function AnalystLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Close the mobile drawer on every route change.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Escape closes the drawer; lock page scroll behind it while open.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileMenuOpen]);

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
    clearPrivySession();
    clearAuth();
    router.push('/');
  }

  return (
    <AnalystStreamProvider>
      <Shell
        role={role}
        pathname={pathname}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        onOpen={() => setMobileMenuOpen(true)}
        onClose={() => setMobileMenuOpen(false)}
      >
        {children}
      </Shell>
    </AnalystStreamProvider>
  );
}
