'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, MessageSquare, Package2, Wrench,
  CreditCard, User, Bell, LogOut, Menu, X, ChevronRight,
  TrendingUp, Wallet, Settings, Star,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { vendorPanelApi } from '@/lib/api';
import OverviewSection from './sections/OverviewSection';
import LeadsSection from './sections/LeadsSection';
import PackagesSection from './sections/PackagesSection';
import ServicesSection from './sections/ServicesSection';
import SubscriptionSection from './sections/SubscriptionSection';
import ProfileSection from './sections/ProfileSection';
import NotificationsSection from './sections/NotificationsSection';
import WalletSection from './sections/WalletSection';

export type DashboardSection =
  | 'dashboard' | 'leads' | 'packages' | 'services'
  | 'subscription' | 'profile' | 'notifications' | 'wallet';

const NAV_ITEMS: Array<{
  id: DashboardSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}> = [
  { id: 'dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'leads',         label: 'Leads',         icon: MessageSquare },
  { id: 'packages',      label: 'Packages',      icon: Package2 },
  { id: 'services',      label: 'Services',      icon: Wrench },
  { id: 'subscription',  label: 'Subscription',  icon: CreditCard },
  { id: 'wallet',        label: 'Tokens & Wallet', icon: Wallet },
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

interface Props {
  initialSection?: DashboardSection;
}

export default function VendorDashboardShell({ initialSection = 'dashboard' }: Props) {
  const { user, logout } = useAppStore();
  const router = useRouter();
  const [active, setActive] = useState<DashboardSection>(initialSection);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashData, setDashData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await vendorPanelApi.getDashboard() as any;
      setDashData(data);
      setUnreadCount(data.unreadNotifications ?? 0);
    } catch {
      // handle error silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const navigate = (section: DashboardSection) => {
    setActive(section);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  const navItems = NAV_ITEMS.map(item => ({
    ...item,
    badge: item.id === 'notifications' && unreadCount > 0 ? String(unreadCount) : undefined,
  }));

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
              <Star className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">PlanToday</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vendor info */}
        <div className="px-4 py-3 mx-3 mt-3 rounded-xl bg-red-50 border border-red-100">
          <p className="text-xs text-red-400 font-medium uppercase tracking-wide">Vendor Panel</p>
          <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">
            {dashData?.vendorName ?? user?.name ?? 'Loading...'}
          </p>
          {dashData?.subscription?.isPaid ? (
            <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium mt-1">
              <CreditCard className="w-3 h-3" /> Pro Plan
            </span>
          ) : (
            <span className="text-xs text-gray-500 mt-1 block">Free Plan</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active === id
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </div>
              {badge && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  active === id ? 'bg-white text-red-600' : 'bg-red-600 text-white'
                }`}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 capitalize">
                {navItems.find(n => n.id === active)?.label ?? 'Dashboard'}
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                {dashData?.vendorCity ? `📍 ${dashData.vendorCity}` : 'Manage your business'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Token balance pill */}
            {dashData && (
              <div className="hidden sm:flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-full px-3 py-1.5">
                <Wallet className="w-3.5 h-3.5 text-red-600" />
                <span className="text-sm font-semibold text-red-700">
                  {dashData.tokenBalance?.toLocaleString() ?? 0} tokens
                </span>
              </div>
            )}
            {/* Notifications bell */}
            <button
              onClick={() => navigate('notifications')}
              className="relative p-2 rounded-xl hover:bg-red-50 text-gray-600 hover:text-red-600 transition-all"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {loading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {active === 'dashboard'     && <OverviewSection data={dashData} onNavigate={navigate} />}
              {active === 'leads'         && <LeadsSection vendorId={dashData?.vendorId} />}
              {active === 'packages'      && <PackagesSection vendorId={dashData?.vendorId} onNavigate={navigate} />}
              {active === 'services'      && <ServicesSection vendorId={dashData?.vendorId} />}
              {active === 'subscription'  && <SubscriptionSection vendorId={dashData?.vendorId} isPaid={dashData?.subscription?.isPaid} onUpgraded={loadDashboard} />}
              {active === 'wallet'        && <WalletSection vendorId={dashData?.vendorId} />}
              {active === 'profile'       && <ProfileSection onSaved={loadDashboard} />}
              {active === 'notifications' && <NotificationsSection vendorId={dashData?.vendorId} onRead={() => setUnreadCount(0)} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-28 rounded-2xl bg-gray-200" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-gray-200" />
    </div>
  );
}
