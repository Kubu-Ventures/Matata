'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getToken, getRole, clearAuth } from '@/lib/auth';
import { authApi } from '@/lib/api';

const NAV_ITEMS = [
  { href: '/analyst/dashboard', label: 'Reports', icon: '📋' },
  { href: '/analyst/export', label: 'Export', icon: '⬇️' },
  { href: '/analyst/admin', label: 'Accounts', icon: '👥', adminOnly: true },
];

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
    // Route-level admin guard — not just nav visibility.
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
    <div className="min-h-screen flex bg-[#F7F8FA]">
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
          {NAV_ITEMS.filter(n => !n.adminOnly || role === 'admin').map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors ${
                pathname.startsWith(item.href)
                  ? 'bg-[#006EB5] text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span>🚪</span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}