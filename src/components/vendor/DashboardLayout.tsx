'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import TokenBadge from './TokenBadge';
import { LogoMark, LeadsIcon, TokenIcon, LogoutIcon } from '@/components/ui/Icon';

// Inline SVGs for nav icons (no external dep)
function OverviewIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
const NAV = [
  { href: '/vendor/dashboard',          label: 'Overview',  icon: OverviewIcon },
  { href: '/vendor/dashboard/leads',    label: 'Leads',     icon: LeadsIcon },
  { href: '/vendor/dashboard/tokens',   label: 'Tokens',    icon: TokenIcon },
];

interface Props {
  children: React.ReactNode;
  tokenBalance?: number;
}

export default function DashboardLayout({ children, tokenBalance = 0 }: Props) {
  const pathname = usePathname();
  const { user, logout } = useAppStore();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex-shrink-0 hidden lg:flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <Link href="/" className="flex items-center gap-2.5 mb-4">
            <LogoMark className="w-8 h-8 shrink-0" />
            <div className="flex flex-col leading-none">
              <span className="font-black text-lg tracking-tight">Plan<span className="text-red-400">Today</span></span>
              <span className="text-[9px] text-gray-500 uppercase tracking-widest">plantoday.in</span>
            </div>
          </Link>
          <div className="text-xs text-gray-400 mb-1">Vendor Dashboard</div>
          <div className="font-semibold text-white truncate">{user?.name || 'Vendor'}</div>
          <div className="mt-2">
            <TokenBadge balance={tokenBalance} size="sm" />
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== '/vendor/dashboard' && pathname.startsWith(item.href));
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  active
                    ? 'bg-red-600 text-white shadow'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <IconComponent className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-2">
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full text-left text-xs text-gray-500 hover:text-gray-300 px-2 py-1 transition">
            <LogoutIcon className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark className="w-6 h-6" />
          <span className="font-black text-sm">Plan<span className="text-red-400">Today</span></span>
        </Link>
        <div className="flex items-center gap-3">
          <TokenBadge balance={tokenBalance} size="sm" />
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== '/vendor/dashboard' && pathname.startsWith(item.href));
          const IconComponent = item.icon;
          return (
            <Link key={item.href} href={item.href}
              className={`flex-1 flex flex-col items-center py-2 text-[10px] font-semibold transition ${active ? 'text-red-600' : 'text-gray-400'}`}>
              <IconComponent className="w-5 h-5 mb-0.5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Main */}
      <main className="flex-1 overflow-auto lg:pt-0 pt-14 pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}
