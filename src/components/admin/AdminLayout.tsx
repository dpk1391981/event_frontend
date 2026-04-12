'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { LogoMark, CalendarIcon, LeadsIcon, TokenIcon, SettingsIcon, LogoutIcon, UsersIcon } from '@/components/ui/Icon';

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
function WrenchIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function SeoIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 8h4" />
    </svg>
  );
}

function CategoryIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h7" /></svg>;
}
function CityIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
}

function FeedbackIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
  );
}

const NAV = [
  { href: '/admin',               label: 'Dashboard',    Icon: OverviewIcon },
  { href: '/admin/vendors',       label: 'Vendors',      Icon: UsersIcon },
  { href: '/admin/categories',    label: 'Categories',   Icon: CategoryIcon },
  { href: '/admin/cities',        label: 'Cities',       Icon: CityIcon },
  { href: '/admin/tokens',        label: 'Tokens',       Icon: TokenIcon },
  { href: '/admin/leads',         label: 'Leads',        Icon: LeadsIcon },
  { href: '/admin/feedback',      label: 'Feedback',     Icon: FeedbackIcon },
  { href: '/admin/seo',           label: 'SEO Manager',  Icon: SeoIcon },
  { href: '/admin/settings',      label: 'Settings',     Icon: SettingsIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAppStore();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-950 text-white flex-shrink-0 hidden lg:flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <Link href="/" className="flex items-center gap-2.5 mb-3">
            <LogoMark className="w-8 h-8 shrink-0" />
            <div className="flex flex-col leading-none">
              <span className="font-black text-lg tracking-tight">Plan<span className="text-red-400">Today</span></span>
              <span className="text-[9px] text-gray-500 uppercase tracking-widest">plantoday.in</span>
            </div>
          </Link>
          <div className="text-[10px] text-red-400 font-extrabold uppercase tracking-widest bg-red-900/30 border border-red-800/50 rounded-lg px-2 py-1 inline-block">
            {user?.role === 'super_admin' ? 'Super Admin' : 'Admin Panel'}
          </div>
          <p className="text-xs text-gray-400 mt-2 truncate">{user?.name || 'Administrator'}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  active ? 'bg-red-600 text-white shadow' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}>
                <item.Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-1">
          <Link href="/" className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 px-2 py-1 transition mb-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Site
          </Link>
          <button onClick={logout} className="flex items-center gap-2 w-full text-left text-xs text-gray-500 hover:text-gray-300 px-2 py-1 transition">
            <LogoutIcon className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gray-950 text-white px-4 py-3 flex items-center justify-between">
        <span className="font-extrabold">Admin Panel</span>
        <div className="flex overflow-x-auto gap-1">
          {NAV.slice(0, 5).map(item => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${active ? 'bg-red-600 text-white' : 'text-gray-400'}`}>
                <item.Icon className="w-4 h-4" />
              </Link>
            );
          })}
        </div>
      </div>

      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
