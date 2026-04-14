'use client';

import { startTransition, useEffect, useDeferredValue, useState } from 'react';
import {
  ArrowDownRight, ArrowUpRight, Bell, BriefcaseBusiness,
  Check, ChevronRight, CircleDollarSign, Clock3, Coins,
  CreditCard, Gem, LayoutDashboard, MapPin, Menu,
  MessageSquare, Package, Package2, Phone, Plus, Search, Settings,
  ShieldCheck, Sparkles, Star, TrendingUp, Wallet, X,
  Zap, ToggleLeft, ToggleRight, Trophy, LogOut, CalendarDays,
} from 'lucide-react';
import { Space_Grotesk } from 'next/font/google';
import {
  updateLeadStatus as apiUpdateLeadStatus,
  unlockLead as apiUnlockLead,
  createPackage as apiCreatePackage,
  updatePackage as apiUpdatePackage,
  boostPackage as apiBoostPackage,
  setPackageFeatured as apiSetPackageFeatured,
  createService as apiCreateService,
  updateService as apiUpdateService,
  deleteService as apiDeleteService,
  type LeadStatus,
  type PackageItem,
  type PackagePerformance,
  type PanelSection,
  type VendorLeadItem,
  type VendorPanelData,
  type VendorServiceItem,
  type WalletEntry,
  type ProfileChecklistItem,
  type DashboardMetric,
} from '@/lib/vendor-panel';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'next/navigation';
import { locationsApi, availabilityApi, vendorPanelApi, vendorServicesApi, packagesApi } from '@/lib/api';
import ServiceCreateForm, { type ServiceEditData } from '@/components/partner/ServiceCreateForm';
import PackageCreateForm, { type PackageEditData } from '@/components/partner/PackageCreateForm';

const displayFont = Space_Grotesk({ subsets: ['latin'] });

// ─── Nav config ───────────────────────────────────────────────────────────────

const PANEL_NAV: Array<{ id: PanelSection; label: string; shortLabel: string; Icon: typeof LayoutDashboard }> = [
  { id: 'dashboard',    label: 'Dashboard',    shortLabel: 'Home',     Icon: LayoutDashboard },
  { id: 'leads',        label: 'Leads',        shortLabel: 'Leads',    Icon: MessageSquare },
  { id: 'services',     label: 'Services',     shortLabel: 'Services', Icon: BriefcaseBusiness },
  { id: 'packages',     label: 'Packages',     shortLabel: 'Packages', Icon: Package2 },
  { id: 'availability', label: 'Availability', shortLabel: 'Avail.',   Icon: CalendarDays },
  { id: 'wallet',       label: 'Wallet',       shortLabel: 'Wallet',   Icon: Wallet },
  { id: 'profile',      label: 'Profile',      shortLabel: 'Profile',  Icon: ShieldCheck },
  { id: 'settings',     label: 'Settings',     shortLabel: 'Settings', Icon: Settings },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  if (n >= 1000)   return `₹${Math.round(n / 1000)}K`;
  return `₹${n}`;
}

function statusChip(status: LeadStatus) {
  if (status === 'new')       return 'bg-red-500/20 text-red-400 border border-red-500/30';
  if (status === 'contacted') return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
  if (status === 'converted') return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
  return 'bg-gray-700 text-gray-400';
}

function trendIcon(trend: 'up' | 'down' | 'neutral') {
  if (trend === 'up')   return { Icon: ArrowUpRight,   cls: 'text-emerald-400 bg-emerald-500/10' };
  if (trend === 'down') return { Icon: ArrowDownRight, cls: 'text-red-400 bg-red-500/10' };
  return { Icon: ChevronRight, cls: 'text-gray-500 bg-gray-800' };
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export default function MyPanelShell({ data }: { data: VendorPanelData }) {
  const { logout } = useAppStore();
  const router = useRouter();

  const [activeSection, setActiveSection] = useState<PanelSection>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [leadFilter, setLeadFilter] = useState<'all' | 'new' | 'contacted' | 'converted' | 'high-quality'>('all');
  const [leadSearch, setLeadSearch] = useState('');
  const [leads, setLeads] = useState(data.leads);
  const [packages, setPackages] = useState(data.packages);
  const [services, setServices] = useState<VendorServiceItem[]>(data.services);
  const deferredLeadSearch = useDeferredValue(leadSearch);

  const filteredLeads = leads.filter((l) => {
    const matchFilter =
      leadFilter === 'all'          ? true :
      leadFilter === 'high-quality' ? l.qualityScore >= 85 :
      l.status === leadFilter;
    const q = deferredLeadSearch.trim().toLowerCase();
    const matchSearch = !q || [l.customerName, l.eventType, l.location, l.message].some((v) => v.toLowerCase().includes(q));
    return matchFilter && matchSearch;
  });

  const setSection = (s: PanelSection) => startTransition(() => { setActiveSection(s); setMobileOpen(false); });

  // ── Lead actions ──
  const updateLeadStatus = (leadId: number, status: LeadStatus) => {
    setLeads((cur) => cur.map((l) => l.id === leadId ? { ...l, status, unlocked: l.unlocked || status !== 'ignored' } : l));
    apiUpdateLeadStatus(leadId, status).catch(() => {});
  };
  const unlockLead = (leadId: number) => {
    setLeads((cur) => cur.map((l) => l.id === leadId ? { ...l, unlocked: true } : l));
    apiUnlockLead(leadId).catch(() => {});
  };

  // ── Package actions ──
  const addPackage = async (payload: unknown) => {
    const created = payload as PackageItem;
    setPackages((cur) => [...cur, { ...created, serviceIds: (created as any).serviceIds ?? [] }]);
  };
  const updatePackageInList = (updated: unknown) => {
    const pkg = updated as PackageItem;
    setPackages((cur) => cur.map((p) => p.id === pkg.id ? { ...p, ...pkg } : p));
  };

  const togglePackageStatus = (id: number) => {
    const pkg = packages.find((p) => p.id === id);
    if (!pkg) return;
    const next = pkg.status === 'active' ? 'inactive' : 'active';
    setPackages((cur) => cur.map((p) => p.id === id ? { ...p, status: next } : p));
    apiUpdatePackage(id, { status: next }).catch(() => {});
  };
  const togglePackageBoost = (id: number) => {
    const pkg = packages.find((p) => p.id === id);
    if (!pkg) return;
    const next = !pkg.boosted;
    setPackages((cur) => cur.map((p) => p.id === id ? { ...p, boosted: next } : p));
    if (next) apiBoostPackage(id).catch(() => setPackages((cur) => cur.map((p) => p.id === id ? { ...p, boosted: false } : p)));
  };
  const togglePackageFeatured = (id: number) => {
    const pkg = packages.find((p) => p.id === id);
    if (!pkg) return;
    const next = !pkg.featured;
    setPackages((cur) => cur.map((p) => p.id === id ? { ...p, featured: next } : p));
    apiSetPackageFeatured(id, next).catch(() => setPackages((cur) => cur.map((p) => p.id === id ? { ...p, featured: !next } : p)));
  };

  // ── Service actions ──
  const addService = (svcData: unknown) => {
    setServices((cur) => [...cur, svcData as VendorServiceItem]);
  };
  const updateServiceInList = (updated: unknown) => {
    const svc = updated as VendorServiceItem;
    setServices((cur) => cur.map((s) => s.id === svc.id ? { ...s, ...svc } : s));
  };
  const toggleServiceStatus = (id: number) => {
    const svc = services.find((s) => s.id === id);
    if (!svc) return;
    const next = svc.status === 'active' ? 'inactive' : 'active';
    setServices((cur) => cur.map((s) => s.id === id ? { ...s, status: next } : s));
    apiUpdateService(id, { status: next }).catch(() => setServices((cur) => cur.map((s) => s.id === id ? { ...s, status: svc.status } : s)));
  };
  const removeService = (id: number) => {
    setServices((cur) => cur.filter((s) => s.id !== id));
    apiDeleteService(id).catch(() => {});
  };

  const handleLogout = () => { logout(); router.push('/'); };

  return (
    <div className={`${displayFont.className} min-h-screen bg-gray-950 text-white`}>
      <div className="flex min-h-screen">

        {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
        <aside className="hidden xl:flex w-[260px] shrink-0 flex-col border-r border-gray-800 bg-gray-900 sticky top-16 h-[calc(100vh-64px)]">
          {/* Vendor identity */}
          <div className="px-6 py-4 border-b border-gray-800">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-500">Vendor Panel</p>
            <p className="mt-1 text-sm font-bold text-white truncate">{data.vendorName}</p>
          </div>

          {/* Score widget */}
          <div className="mx-4 mt-4 rounded-xl bg-gray-800/60 border border-gray-700/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Profile Score</span>
              <span className="text-xs font-bold text-red-400">{data.profileScore}/100</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-700 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all" style={{ width: `${data.profileScore}%` }} />
            </div>
            <div className="mt-3 flex gap-2">
              <div className="flex-1 rounded-lg bg-gray-900 p-2 text-center">
                <p className="text-[10px] text-gray-500">Tokens</p>
                <p className="text-base font-bold text-white">{data.tokenBalance}</p>
              </div>
              <div className="flex-1 rounded-lg bg-gray-900 p-2 text-center">
                <p className="text-[10px] text-gray-500">Leads</p>
                <p className="text-base font-bold text-white">{leads.length}</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
            {PANEL_NAV.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  activeSection === id
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </span>
                {id === 'leads' && leads.filter((l) => l.status === 'new').length > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {leads.filter((l) => l.status === 'new').length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="px-3 pb-4 border-t border-gray-800 pt-3">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-all"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main Content ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Mobile menu toggle — sits below common header */}
          <div className="xl:hidden sticky top-16 z-40 border-b border-gray-800 bg-gray-900/95 backdrop-blur-md px-4 py-2.5 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{data.vendorName}</p>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="p-2 rounded-xl bg-gray-800 text-gray-300"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile nav drawer */}
          {mobileOpen && (
            <div className="xl:hidden fixed inset-0 z-30 pt-[108px]">
              <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
              <div className="relative bg-gray-900 w-72 h-full flex flex-col p-4 overflow-y-auto shadow-2xl">
                <nav className="space-y-0.5">
                  {PANEL_NAV.map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSection(id)}
                      className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                        activeSection === id ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </button>
                  ))}
                </nav>
                <div className="mt-auto pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Page content */}
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 xl:pb-8 space-y-6">

            {/* Hero banner — always visible */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-red-950/40 to-gray-900 border border-red-900/30 p-5 sm:p-7">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.15),transparent_60%)]" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-red-400 mb-3">
                    <Sparkles className="h-3 w-3" />
                    Vendor Growth Panel
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Welcome back, <span className="text-red-400">{data.vendorName.split(' ')[0]}</span>
                  </h1>
                  <p className="mt-1.5 text-sm text-gray-400 max-w-lg">{data.completionLabel}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSection('leads')}
                    className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-500 transition-all shadow-lg shadow-red-600/25"
                  >
                    <MessageSquare className="h-4 w-4" />
                    View Leads
                  </button>
                  <button
                    type="button"
                    onClick={() => setSection('wallet')}
                    className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-white hover:border-gray-600 transition-all"
                  >
                    <Coins className="h-4 w-4 text-red-400" />
                    {data.tokenBalance} tokens
                  </button>
                </div>
              </div>
            </div>

            {/* Metric cards — always visible */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-5">
              {data.metrics.map((m) => {
                const { Icon, cls } = trendIcon(m.trend);
                return (
                  <div key={m.label} className="rounded-xl bg-gray-900 border border-gray-800 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{m.label}</p>
                      <span className={`inline-flex rounded-lg p-1.5 ${cls}`}>
                        <Icon className="h-3 w-3" />
                      </span>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-white">{m.value}</p>
                    <p className="mt-1 text-[11px] text-gray-500">{m.change}</p>
                  </div>
                );
              })}
            </div>

            {/* Section content */}
            {activeSection === 'dashboard' && (
              <DashboardSection
                leads={filteredLeads}
                packages={packages}
                packagePerformance={data.packagePerformance}
                profileScore={data.profileScore}
                tokenBalance={data.tokenBalance}
                insights={data.insights}
                setSection={setSection}
              />
            )}
            {activeSection === 'leads' && (
              <LeadsSection
                leads={filteredLeads}
                allPackages={packages}
                leadFilter={leadFilter}
                leadSearch={leadSearch}
                onLeadSearch={setLeadSearch}
                onLeadFilter={setLeadFilter}
                onUnlock={unlockLead}
                onStatusChange={updateLeadStatus}
              />
            )}
            {activeSection === 'services' && (
              <ServicesSection
                services={services}
                categories={data.serviceCategories}
                cities={data.cities}
                onAdd={addService}
                onUpdate={updateServiceInList}
                onToggleStatus={toggleServiceStatus}
                onRemove={removeService}
              />
            )}
            {activeSection === 'packages' && (
              <PackagesSection
                packages={packages}
                services={services}
                cities={data.cities}
                serviceCategories={data.serviceCategories}
                onSave={addPackage}
                onUpdate={updatePackageInList}
                onToggleStatus={togglePackageStatus}
                onToggleBoost={togglePackageBoost}
                onToggleFeatured={togglePackageFeatured}
                onViewLeads={(_pkgId) => { setSection('leads'); }}
              />
            )}
            {activeSection === 'wallet' && (
              <WalletSection balance={data.tokenBalance} walletHistory={data.walletHistory} />
            )}
            {activeSection === 'profile' && (
              <ProfileSection checklist={data.profileChecklist} profileScore={data.profileScore} data={data} />
            )}
            {activeSection === 'availability' && <AvailabilitySection />}
            {activeSection === 'settings' && <SettingsSection />}
          </main>

          {/* Mobile bottom nav */}
          <nav className="xl:hidden fixed inset-x-0 bottom-0 z-40 border-t border-gray-800 bg-gray-900/95 backdrop-blur-md px-2 py-2">
            <div className="flex gap-1">
              {PANEL_NAV.map(({ id, Icon, shortLabel }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSection(id)}
                  className={`flex-1 flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition-all ${
                    activeSection === id ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{shortLabel}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Overview ──────────────────────────────────────────────────────

function DashboardSection({
  leads, packages, packagePerformance, profileScore, tokenBalance, insights, setSection,
}: {
  leads: VendorLeadItem[];
  packages: PackageItem[];
  packagePerformance: PackagePerformance;
  profileScore: number;
  tokenBalance: number;
  insights: VendorPanelData['insights'];
  setSection: (s: PanelSection) => void;
}) {
  const highIntent = leads.filter((l) => l.qualityScore >= 85).length;
  const newLeads   = leads.filter((l) => l.status === 'new').length;
  const activePackages = packages.filter((p) => p.status === 'active').length;

  return (
    <div className="space-y-4">
      {/* Quick stats row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickStat label="New Leads" value={newLeads} icon="🔥" accent onClick={() => setSection('leads')} />
        <QuickStat label="High Quality" value={highIntent} icon="⭐" onClick={() => setSection('leads')} />
        <QuickStat label="Active Packages" value={activePackages} icon="📦" onClick={() => setSection('packages')} />
        <QuickStat label="Token Balance" value={tokenBalance} icon="🪙" onClick={() => setSection('wallet')} />
      </div>

      {/* Smart insights */}
      {insights.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-4 w-4 text-red-400" />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Smart Insights</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {insights.map((ins) => (
              <div key={ins.id} className={`rounded-xl border p-4 ${
                ins.tone === 'success' ? 'border-emerald-500/30 bg-emerald-500/10' :
                ins.tone === 'warning' ? 'border-amber-500/30 bg-amber-500/10' :
                'border-red-500/30 bg-red-500/10'
              }`}>
                <p className="font-semibold text-white text-sm">{ins.title}</p>
                <p className="mt-1 text-xs leading-5 text-gray-400">{ins.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom split — Profile score + Token runway */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Profile Score</p>
          <p className="text-4xl font-bold text-white">{profileScore}<span className="text-lg text-gray-500">/100</span></p>
          <div className="mt-3 h-2 rounded-full bg-gray-800 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400" style={{ width: `${profileScore}%` }} />
          </div>
          <p className="mt-3 text-xs text-gray-500">Complete profile → better lead fit and ranking.</p>
          <button
            type="button"
            onClick={() => setSection('profile')}
            className="mt-4 flex items-center gap-2 rounded-xl border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white hover:border-gray-500 transition-all"
          >
            Improve Profile
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Token Runway</p>
          <p className="text-4xl font-bold text-white">{tokenBalance}</p>
          <div className="mt-4 space-y-2">
            {[
              { label: 'Unlock 1 lead', cost: '2 tokens' },
              { label: 'Boost package', cost: '10 tokens' },
              { label: `${Math.floor(tokenBalance / 2)} lead unlocks`, cost: 'remaining' },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between rounded-lg bg-gray-800 px-3 py-2 text-sm">
                <span className="text-gray-400">{r.label}</span>
                <span className="font-semibold text-white">{r.cost}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSection('wallet')}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-500 transition-all"
          >
            <Coins className="h-4 w-4" />
            Manage Wallet
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickStat({ label, value, icon, accent, onClick }: { label: string; value: number; icon: string; accent?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-all hover:border-red-600/50 ${
        accent ? 'border-red-600/40 bg-red-600/10' : 'border-gray-800 bg-gray-900'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </button>
  );
}

// ─── Leads ────────────────────────────────────────────────────────────────────

function LeadsSection({
  leads, allPackages, leadFilter, leadSearch,
  onLeadSearch, onLeadFilter, onUnlock, onStatusChange,
}: {
  leads: VendorLeadItem[];
  allPackages: PackageItem[];
  leadFilter: 'all' | 'new' | 'contacted' | 'converted' | 'high-quality';
  leadSearch: string;
  onLeadSearch: (v: string) => void;
  onLeadFilter: (v: 'all' | 'new' | 'contacted' | 'converted' | 'high-quality') => void;
  onUnlock: (id: number) => void;
  onStatusChange: (id: number, status: LeadStatus) => void;
}) {
  return (
    <div className="space-y-4">
      <SectionHeader eyebrow="Leads" title="Your Incoming Leads" />

      {/* Filters + search */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['all', 'new', 'contacted', 'converted', 'high-quality'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onLeadFilter(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                  leadFilter === f ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {f === 'high-quality' ? '⭐ High Quality' : f}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm min-w-[220px]">
            <Search className="h-4 w-4 text-gray-500 shrink-0" />
            <input
              value={leadSearch}
              onChange={(e) => onLeadSearch(e.target.value)}
              placeholder="Search leads…"
              className="bg-transparent text-gray-300 outline-none placeholder:text-gray-600 w-full"
            />
          </label>
        </div>
      </div>

      {/* Response tip */}
      <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
        <Zap className="h-4 w-4 shrink-0 text-amber-400" />
        <p className="text-sm font-semibold text-amber-300">Respond within 5 minutes = 3× conversion rate</p>
      </div>

      {/* Lead cards */}
      {leads.length === 0 ? (
        <EmptyState title="No leads yet" body="Leads will appear here when users contact you through search or your packages." />
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className={`rounded-xl border p-5 ${
                lead.qualityScore >= 85
                  ? 'border-red-500/40 bg-gradient-to-br from-red-950/30 to-gray-900'
                  : 'border-gray-800 bg-gray-900'
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                {/* Lead info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-base font-bold text-white">{lead.customerName}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusChip(lead.status)}`}>
                      {lead.status}
                    </span>
                    {lead.qualityScore >= 85 && (
                      <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-bold text-white">HIGH QUALITY</span>
                    )}
                    {lead.packageSource && (
                      <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400">
                        📦 {lead.packageSource}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-4">
                    <LeadMeta label="Event" value={lead.eventType} />
                    <LeadMeta label="Budget" value={lead.budget} />
                    <LeadMeta label="Location" value={lead.location} />
                    <LeadMeta label="Score" value={`${lead.qualityScore}/100`} />
                  </div>
                  {lead.message && (
                    <p className="mt-3 text-sm text-gray-400 leading-relaxed line-clamp-2">{lead.message}</p>
                  )}
                  <p className="mt-2 text-[10px] text-gray-600 uppercase tracking-wider">{lead.createdAt}</p>
                </div>

                {/* Action box */}
                <div className="lg:w-[280px] shrink-0">
                  <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Lead Access</p>
                    {lead.unlocked ? (
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-white">{lead.phone}</p>
                        <div className="flex gap-2">
                          <a href={`tel:${lead.phone}`}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-500 transition-all">
                            <Phone className="h-3.5 w-3.5" /> Call
                          </a>
                          <a href={lead.whatsappLink} target="_blank" rel="noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-gray-600 bg-gray-700 py-2 text-xs font-semibold text-white hover:border-gray-500 transition-all">
                            <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                          </a>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onUnlock(lead.id)}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 py-2.5 text-sm font-bold text-gray-900 hover:bg-amber-400 transition-all"
                      >
                        <Coins className="h-4 w-4" />
                        Unlock ({lead.unlockCost} tokens)
                      </button>
                    )}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => onStatusChange(lead.id, 'contacted')}
                      className="flex-1 rounded-lg border border-gray-700 bg-gray-800 py-2 text-[11px] font-semibold text-gray-400 hover:text-white hover:border-gray-600 transition-all">
                      Contacted
                    </button>
                    <button type="button" onClick={() => onStatusChange(lead.id, 'converted')}
                      className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all">
                      Converted
                    </button>
                    <button type="button" onClick={() => onStatusChange(lead.id, 'ignored')}
                      className="flex-1 rounded-lg border border-gray-700 bg-gray-800 py-2 text-[11px] font-semibold text-gray-600 hover:text-gray-400 transition-all">
                      Ignore
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LeadMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-gray-300">{value}</p>
    </div>
  );
}

// ─── Services ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; dot: string; label: string }> = {
    active:   { cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400', label: 'Active' },
    pending:  { cls: 'bg-amber-500/15   text-amber-400   border-amber-500/30',   dot: 'bg-amber-400',   label: 'Pending' },
    draft:    { cls: 'bg-gray-800       text-gray-400    border-gray-700',        dot: 'bg-gray-500',    label: 'Draft' },
    inactive: { cls: 'bg-gray-800       text-gray-500    border-gray-700',        dot: 'bg-gray-600',    label: 'Inactive' },
    rejected: { cls: 'bg-red-500/15     text-red-400     border-red-500/30',      dot: 'bg-red-400',     label: 'Rejected' },
  };
  const c = cfg[status] ?? cfg.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold border ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />
      {c.label}
    </span>
  );
}

function PriceTag({ tag }: { tag?: string }) {
  const cfg: Record<string, string> = {
    budget:    'text-sky-400    border-sky-500/30    bg-sky-500/10',
    standard:  'text-gray-300   border-gray-600      bg-gray-800',
    premium:   'text-purple-400 border-purple-500/30 bg-purple-500/10',
    luxury:    'text-amber-400  border-amber-500/30  bg-amber-500/10',
    mid_range: 'text-blue-400   border-blue-500/30   bg-blue-500/10',
  };
  if (!tag) return null;
  const label = tag.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${cfg[tag] ?? cfg.standard}`}>
      <Gem className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

function ServicesSection({
  services, categories, cities, onAdd, onUpdate, onToggleStatus, onRemove,
}: {
  services: VendorServiceItem[];
  categories: Array<{ id: number; name: string }> | string[];
  cities: Array<{ id: number; name: string }>;
  onAdd: (d: unknown) => void;
  onUpdate: (d: unknown) => void;
  onToggleStatus: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editService, setEditService] = useState<ServiceEditData | undefined>(undefined);
  const normCategories = categories.map((c) => typeof c === 'string' ? { id: 0, name: c } : c);

  const handleCreated = (svc: unknown) => { onAdd(svc); setShowForm(false); setEditService(undefined); };
  const handleUpdated = (svc: unknown) => { onUpdate(svc); setShowForm(false); setEditService(undefined); };

  const handleEdit = (svc: VendorServiceItem) => {
    setEditService({
      id:                  svc.id,
      name:                (svc as any).name ?? svc.title,
      title:               svc.title,
      categoryId:          svc.categoryId,
      eventTypes:          (svc as any).eventTypes,
      shortDescription:    (svc as any).shortDescription,
      detailedDescription: (svc as any).detailedDescription,
      priceType:           (svc as any).priceType,
      basePrice:           (svc as any).basePrice ?? svc.minPrice,
      minPrice:            svc.minPrice,
      maxPrice:            svc.maxPrice,
      cityId:              (svc as any).cityId,
      locality:            (svc as any).locality,
      serviceAreas:        (svc as any).serviceAreas,
      minGuests:           (svc as any).minGuests,
      maxGuests:           (svc as any).maxGuests,
      availabilityType:    (svc as any).availabilityType,
      availableDates:      (svc as any).availableDates,
      blockedDates:        (svc as any).blockedDates,
      images:              (svc as any).images ?? (svc as any).resolvedImages,
      videos:              (svc as any).videos,
      tags:                (svc as any).tags,
      highlights:          (svc as any).highlights,
    });
    setShowForm(true);
  };

  const handleSubmitForReview = async (id: number) => {
    try { await vendorServicesApi.submit(id); } catch { /* noop */ }
  };

  const active = services.filter((s) => (s as any).status === 'active').length;
  const pending = services.filter((s) => (s as any).status === 'pending').length;

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500 mb-0.5">Services</p>
          <h2 className="text-xl font-bold text-white">Your Service Offerings</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {services.length === 0 ? 'No services yet' : `${active} active · ${pending} pending · ${services.length} total`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditService(undefined); setShowForm(true); }}
          className="shrink-0 flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-500 active:scale-95 transition-all shadow-lg shadow-red-600/20"
        >
          <Plus className="h-4 w-4" />
          Add Service
        </button>
      </div>

      {/* Status legend strip */}
      <div className="flex flex-wrap gap-3 text-[11px] text-gray-500">
        {[
          { dot: 'bg-emerald-400', label: 'Active — visible in search' },
          { dot: 'bg-amber-400',   label: 'Pending — under review' },
          { dot: 'bg-gray-500',    label: 'Draft — submit when ready' },
          { dot: 'bg-red-400',     label: 'Rejected — see reason' },
        ].map(({ dot, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {label}
          </span>
        ))}
      </div>

      {services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-900/40 py-16 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
            <BriefcaseBusiness className="h-6 w-6 text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">No services yet</p>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">Create your first service to appear in search results and AI event plans.</p>
          </div>
          <button
            type="button"
            onClick={() => { setEditService(undefined); setShowForm(true); }}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            Create First Service
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((svc) => {
            const status = (svc as any).status ?? 'draft';
            const basePrice = (svc as any).basePrice ?? svc.minPrice;
            const maxPrice = svc.maxPrice;
            const priceType = (svc as any).priceType;
            const priceRangeTag = (svc as any).priceRangeTag;
            const images: string[] = (svc as any).resolvedImages ?? (svc as any).images ?? [];
            const rejectionReason: string = (svc as any).rejectionReason ?? '';
            const title = (svc as any).name ?? svc.title ?? 'Untitled Service';
            const city = (svc as any).city?.name ?? (svc as any).cityName ?? '';
            const eventTypes: string[] = (svc as any).eventTypes ?? [];
            const rating = (svc as any).rating ?? 0;
            const totalBookings = (svc as any).totalBookings ?? 0;
            const tags: string[] = (svc as any).tags ?? [];

            return (
              <div
                key={svc.id}
                className={`group rounded-2xl border overflow-hidden flex flex-col transition-all hover:shadow-xl hover:-translate-y-0.5 ${
                  status === 'active'   ? 'border-gray-700/80 bg-gray-900 hover:border-gray-600 hover:shadow-black/40' :
                  status === 'pending'  ? 'border-amber-500/25 bg-gray-900 hover:border-amber-500/40' :
                  status === 'rejected' ? 'border-red-500/25 bg-gray-900 hover:border-red-500/40' :
                  'border-gray-800 bg-gray-900/60'
                }`}
              >
                {/* Cover image / placeholder */}
                <div className="relative h-44 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-850 shrink-0">
                  {images.length > 0 ? (
                    <img src={images[0]} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BriefcaseBusiness className="h-10 w-10 text-gray-700" />
                    </div>
                  )}
                  {/* Image count badge */}
                  {images.length > 1 && (
                    <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      +{images.length - 1} photos
                    </span>
                  )}
                  {/* Status badge — top-right overlay */}
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={status} />
                  </div>
                  {/* Price tag overlay bottom-left */}
                  {basePrice > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6">
                      <p className="text-base font-bold text-white leading-tight">
                        {fmtPrice(Number(basePrice))}
                        {maxPrice && maxPrice > basePrice && (
                          <span className="text-gray-300 font-normal text-xs"> – {fmtPrice(Number(maxPrice))}</span>
                        )}
                        {priceType && (
                          <span className="ml-1 text-[11px] font-normal text-gray-400">/{priceType.replace(/_/g, ' ')}</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4 flex-1 flex flex-col gap-3">
                  {/* Title + tags row */}
                  <div>
                    <h3 className="text-sm font-bold text-white leading-snug line-clamp-1">{title}</h3>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {priceRangeTag && <PriceTag tag={priceRangeTag} />}
                      {eventTypes.slice(0, 2).map((et) => (
                        <span key={et} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700 capitalize">
                          {et.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Performance row */}
                  {(rating > 0 || totalBookings > 0 || city) && (
                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      {rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                          <span className="text-amber-400 font-semibold">{rating.toFixed(1)}</span>
                        </span>
                      )}
                      {totalBookings > 0 && (
                        <span className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-emerald-400" />
                          {totalBookings} bookings
                        </span>
                      )}
                      {city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {city}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.slice(0, 3).map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700/60">{t}</span>
                      ))}
                      {tags.length > 3 && <span className="text-[10px] text-gray-600">+{tags.length - 3}</span>}
                    </div>
                  )}

                  {/* Description */}
                  {svc.description && (
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{svc.description}</p>
                  )}

                  {/* Rejection reason */}
                  {rejectionReason && (
                    <div className="rounded-xl bg-red-500/8 border border-red-500/20 px-3 py-2.5">
                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-wide mb-0.5">Rejected</p>
                      <p className="text-xs text-red-300/80 leading-relaxed">{rejectionReason}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="mt-auto pt-3 border-t border-gray-800 flex flex-wrap gap-2">
                    {status === 'draft' && (
                      <button
                        type="button"
                        onClick={() => handleSubmitForReview(svc.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 py-2 text-[11px] font-bold text-amber-400 hover:bg-amber-500/25 active:scale-95 transition-all"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Submit for Review
                      </button>
                    )}
                    {(status === 'active' || status === 'inactive') && (
                      <button
                        type="button"
                        onClick={() => onToggleStatus(svc.id)}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold transition-all active:scale-95 ${
                          status === 'active'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        {status === 'active' ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                        {status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEdit(svc)}
                      className="flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-[11px] font-bold text-blue-400 hover:bg-blue-500/20 active:scale-95 transition-all"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(svc.id)}
                      className="flex items-center justify-center rounded-xl border border-red-500/20 bg-red-500/8 px-2.5 py-2 text-[11px] text-red-500 hover:bg-red-500/15 active:scale-95 transition-all"
                      title="Delete service"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <ServiceCreateForm
          categories={normCategories}
          cities={cities}
          onCreated={editService ? handleUpdated : handleCreated}
          onClose={() => { setShowForm(false); setEditService(undefined); }}
          editData={editService}
        />
      )}
    </div>
  );
}

// ─── Packages ─────────────────────────────────────────────────────────────────

const PKG_TAG_CONFIG: Record<string, { label: string; cls: string; icon: string }> = {
  budget:   { label: 'Budget',   cls: 'text-sky-400    border-sky-500/30    bg-sky-500/10',    icon: '💡' },
  standard: { label: 'Standard', cls: 'text-gray-300   border-gray-600      bg-gray-800',      icon: '⭐' },
  premium:  { label: 'Premium',  cls: 'text-purple-400 border-purple-500/30 bg-purple-500/10', icon: '💎' },
  luxury:   { label: 'Luxury',   cls: 'text-amber-400  border-amber-500/30  bg-amber-500/10',  icon: '👑' },
};

function PackagesSection({
  packages, services, cities: initialCities, serviceCategories, onSave, onUpdate,
  onToggleStatus, onToggleBoost, onToggleFeatured, onViewLeads,
}: {
  packages: PackageItem[];
  services: VendorServiceItem[];
  cities: Array<{ id: number; name: string }>;
  serviceCategories: Array<{ id: number; name: string }>;
  onSave: (data: unknown) => Promise<void>;
  onUpdate: (data: unknown) => void;
  onToggleStatus: (id: number) => void;
  onToggleBoost: (id: number) => void;
  onToggleFeatured: (id: number) => void;
  onViewLeads: (id: number) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editPkg, setEditPkg] = useState<PackageEditData | undefined>(undefined);
  const [cities, setCities] = useState(initialCities);

  const activeServices = services.filter((s) => (s as any).status === 'active' || s.status === 'active');

  useEffect(() => {
    if (cities.length === 0) {
      locationsApi.getCities()
        .then((d: unknown) => setCities(d as Array<{ id: number; name: string }>))
        .catch(() => {});
    }
  }, [cities.length]);

  const handleEditPackage = (pkg: PackageItem) => {
    setEditPkg({
      id:               pkg.id,
      title:            pkg.title,
      categoryId:       (pkg as any).categoryId,
      eventTypes:       (pkg as any).eventTypes,
      description:      pkg.description,
      serviceIds:       pkg.serviceIds ?? [],
      priceMode:        (pkg as any).priceMode ?? 'fixed_price',
      price:            pkg.price,
      finalPrice:       (pkg as any).finalPrice,
      discountAmount:   (pkg as any).discountAmount,
      addons:           (pkg as any).addons ?? (pkg as any).addOns,
      includes:         (pkg as any).includes,
      bulletPoints:     (pkg as any).bulletPoints,
      exclusions:       (pkg as any).exclusions,
      tags:             (pkg as any).tags,
      cityId:           (pkg as any).cityId,
      serviceAreas:     (pkg as any).serviceAreas,
      minGuests:        (pkg as any).minGuests,
      maxGuests:        (pkg as any).maxGuests,
      availabilityType: (pkg as any).availabilityType ?? 'derived_from_services',
      availableDates:   (pkg as any).availableDates,
      blockedDates:     (pkg as any).blockedDates,
      images:           (pkg as any).images ?? (pkg as any).resolvedImages,
      videos:           (pkg as any).videos,
    });
    setShowForm(true);
  };

  const handleCreatePackage = () => {
    setEditPkg(undefined);
    setShowForm(true);
  };

  const handleCreated = (pkg: unknown) => { onSave(pkg as any).catch(() => {}); setShowForm(false); setEditPkg(undefined); };
  const handleUpdated = (pkg: unknown) => { onUpdate(pkg); setShowForm(false); setEditPkg(undefined); };

  const activeCount = packages.filter((p) => (p as any).status === 'active').length;

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500 mb-0.5">Packages</p>
          <h2 className="text-xl font-bold text-white">Service Bundles</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {packages.length === 0 ? 'No packages yet' : `${activeCount} active · ${packages.length} total`}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreatePackage}
          className="shrink-0 flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-500 active:scale-95 transition-all shadow-lg shadow-red-600/20"
        >
          <Plus className="h-4 w-4" />
          New Bundle
        </button>
      </div>

      {/* Insight strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: <Zap className="h-3.5 w-3.5 text-red-400" />,       text: 'Bundles get 3× more leads',             cls: 'border-red-500/20 bg-red-500/8' },
          { icon: <TrendingUp className="h-3.5 w-3.5 text-amber-400" />, text: 'Discounts boost AI search rank',       cls: 'border-amber-500/20 bg-amber-500/8' },
          { icon: <Trophy className="h-3.5 w-3.5 text-purple-400" />,  text: 'Premium bundles convert 2× better',    cls: 'border-purple-500/20 bg-purple-500/8' },
        ].map((c, i) => (
          <div key={i} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${c.cls}`}>
            {c.icon}
            <p className="text-[11px] font-semibold text-gray-400">{c.text}</p>
          </div>
        ))}
      </div>

      {/* No-service gate notice */}
      {activeServices.length === 0 && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 px-5 py-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
            <BriefcaseBusiness className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-400">Create an active service first</p>
            <p className="text-xs text-gray-500 mt-0.5">Packages bundle your services. Add and get at least one service approved before creating a package.</p>
          </div>
        </div>
      )}

      {packages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-900/40 py-16 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
            <Package2 className="h-6 w-6 text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">No packages yet</p>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">Bundle your services to generate 3× more leads with great pricing packages.</p>
          </div>
          <button
            type="button"
            onClick={handleCreatePackage}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            Create First Package
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {packages.map((pkg) => {
            const status = (pkg as any).status ?? 'draft';
            const rejectionReason: string = (pkg as any).rejectionReason ?? '';
            const images: string[] = (pkg as any).resolvedImages ?? (pkg as any).images ?? [];
            const finalPrice = Number((pkg as any).finalPrice ?? pkg.price ?? 0);
            const originalPrice = Number(pkg.originalPrice ?? 0);
            const savingsPct = Number(pkg.savingsPercent ?? 0);
            const tagKey = (pkg.tag ?? '') as string;
            const tagInfo = PKG_TAG_CONFIG[tagKey];
            const serviceCount = pkg.serviceIds?.length ?? 0;
            const eventTypes: string[] = (pkg as any).eventTypes ?? [];
            const includes: string[] = (pkg as any).includes ?? [];
            const city = (pkg as any).city?.name ?? (pkg as any).cityName ?? '';
            const minGuests = (pkg as any).minGuests;
            const maxGuests = (pkg as any).maxGuests;

            return (
              <div
                key={pkg.id}
                className={`group rounded-2xl border overflow-hidden flex flex-col transition-all hover:shadow-xl hover:-translate-y-0.5 ${
                  status === 'active'   ? 'border-gray-700/80 bg-gray-900 hover:border-gray-600 hover:shadow-black/40' :
                  status === 'pending'  ? 'border-amber-500/25 bg-gray-900 hover:border-amber-500/40' :
                  status === 'rejected' ? 'border-red-500/25 bg-gray-900 hover:border-red-500/40' :
                  'border-gray-800 bg-gray-900/60'
                }`}
              >
                {/* Cover image */}
                <div className="relative h-44 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-850 shrink-0">
                  {images.length > 0 ? (
                    <img src={images[0]} alt={pkg.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package2 className="h-10 w-10 text-gray-700" />
                    </div>
                  )}
                  {images.length > 1 && (
                    <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      +{images.length - 1} photos
                    </span>
                  )}
                  {/* Featured / Boosted badges — top-left */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {pkg.featured && (
                      <span className="flex items-center gap-1 bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <Star className="h-2.5 w-2.5 fill-white" /> Featured
                      </span>
                    )}
                    {pkg.boosted && (
                      <span className="flex items-center gap-1 bg-amber-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <Zap className="h-2.5 w-2.5 fill-white" /> Boosted
                      </span>
                    )}
                  </div>
                  {/* Status badge — top-right */}
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={status} />
                  </div>
                  {/* Price overlay — bottom */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2 pt-8">
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <p className="text-xl font-bold text-white leading-tight">{fmtPrice(finalPrice)}</p>
                        {originalPrice > 0 && finalPrice < originalPrice && (
                          <p className="text-[11px] text-gray-400 line-through">{fmtPrice(originalPrice)}</p>
                        )}
                      </div>
                      {savingsPct > 0 && (
                        <span className="text-[10px] font-bold text-green-400 bg-green-500/20 border border-green-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {savingsPct}% off
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4 flex-1 flex flex-col gap-3">
                  {/* Title row */}
                  <div>
                    <h3 className="text-sm font-bold text-white leading-snug line-clamp-1">{pkg.title}</h3>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {tagInfo && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${tagInfo.cls}`}>
                          {tagInfo.icon} {tagInfo.label}
                        </span>
                      )}
                      {eventTypes.slice(0, 2).map((et) => (
                        <span key={et} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700 capitalize">
                          {et.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
                    {serviceCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3 text-gray-600" />
                        {serviceCount} service{serviceCount !== 1 ? 's' : ''} bundled
                      </span>
                    )}
                    {city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-600" />
                        {city}
                      </span>
                    )}
                    {(minGuests || maxGuests) && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-gray-600" />
                        {minGuests && maxGuests ? `${minGuests}–${maxGuests} guests` : minGuests ? `${minGuests}+ guests` : `Up to ${maxGuests} guests`}
                      </span>
                    )}
                    {pkg.leadsGenerated > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 text-gray-600" />
                        {pkg.leadsGenerated} leads
                      </span>
                    )}
                  </div>

                  {/* Includes preview */}
                  {includes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {includes.slice(0, 3).map((inc) => (
                        <span key={inc} className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/8 border border-emerald-500/15 text-emerald-500/80">
                          <Check className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate max-w-[100px]">{inc}</span>
                        </span>
                      ))}
                      {includes.length > 3 && <span className="text-[10px] text-gray-600">+{includes.length - 3}</span>}
                    </div>
                  )}

                  {/* Description */}
                  {pkg.description && (
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{pkg.description}</p>
                  )}

                  {/* Rejection reason */}
                  {rejectionReason && (
                    <div className="rounded-xl bg-red-500/8 border border-red-500/20 px-3 py-2.5">
                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-wide mb-0.5">Rejected</p>
                      <p className="text-xs text-red-300/80 leading-relaxed">{rejectionReason}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-auto pt-3 border-t border-gray-800 space-y-2">
                    {/* Primary action row */}
                    <div className="flex gap-2">
                      {status === 'draft' && (
                        <button
                          type="button"
                          onClick={async () => { try { await packagesApi.submit(pkg.id); } catch { /* noop */ } }}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 py-2 text-[11px] font-bold text-amber-400 hover:bg-amber-500/25 active:scale-95 transition-all"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Submit for Review
                        </button>
                      )}
                      {(status === 'active' || status === 'inactive') && (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(pkg.id)}
                          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold transition-all active:scale-95 ${
                            status === 'active'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-white'
                          }`}
                        >
                          {status === 'active' ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                          {status === 'active' ? 'Active' : 'Inactive'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEditPackage(pkg)}
                        className="flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-[11px] font-bold text-blue-400 hover:bg-blue-500/20 active:scale-95 transition-all"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onViewLeads(pkg.id)}
                        className="flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-[11px] font-semibold text-gray-400 hover:text-white hover:border-gray-600 active:scale-95 transition-all"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Leads
                      </button>
                    </div>
                    {/* Secondary action row */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleFeatured(pkg.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-all active:scale-95 ${
                          pkg.featured
                            ? 'border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            : 'border-gray-700 bg-gray-800 text-gray-500 hover:text-white hover:border-gray-600'
                        }`}
                      >
                        <Star className={`h-3 w-3 ${pkg.featured ? 'fill-red-400' : ''}`} />
                        {pkg.featured ? 'Featured ✓' : 'Feature'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleBoost(pkg.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-all active:scale-95 ${
                          pkg.boosted
                            ? 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                            : 'border-gray-700 bg-gray-800 text-gray-500 hover:text-white hover:border-gray-600'
                        }`}
                      >
                        <Zap className={`h-3 w-3 ${pkg.boosted ? 'fill-amber-400' : ''}`} />
                        {pkg.boosted ? 'Boosted ✓' : 'Boost (10)'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <PackageCreateForm
          categories={serviceCategories}
          cities={cities}
          activeServices={activeServices.map((s) => ({
            id: s.id,
            name: (s as any).name ?? s.title,
            title: s.title,
            basePrice: (s as any).basePrice ?? s.minPrice,
            minPrice: s.minPrice,
            priceType: (s as any).priceType ?? s.priceUnit,
            eventTypes: (s as any).eventTypes,
            tags: (s as any).tags,
            categoryId: s.categoryId,
          }))}
          onCreated={editPkg ? handleUpdated : handleCreated}
          onClose={() => { setShowForm(false); setEditPkg(undefined); }}
          onNeedService={() => { setShowForm(false); setEditPkg(undefined); }}
          editData={editPkg}
        />
      )}
    </div>
  );
}
// ─── Wallet ───────────────────────────────────────────────────────────────────

function WalletSection({ balance, walletHistory }: { balance: number; walletHistory: WalletEntry[] }) {
  return (
    <div className="space-y-4">
      <SectionHeader eyebrow="Wallet" title="Token Balance & History" />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Balance card */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Balance</p>
          <p className="mt-2 text-5xl font-bold text-white">{balance}</p>
          <p className="mt-1 text-sm text-gray-500">tokens available</p>
          <div className="mt-4 space-y-2">
            {[{ l: 'Unlock 1 lead', v: '2 tokens' }, { l: 'Boost package', v: '10 tokens' }].map((r) => (
              <div key={r.l} className="flex justify-between rounded-lg bg-gray-800 px-3 py-2 text-xs">
                <span className="text-gray-500">{r.l}</span>
                <span className="font-semibold text-white">{r.v}</span>
              </div>
            ))}
          </div>
          <button type="button" className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-500 transition-all">
            <CreditCard className="h-4 w-4" /> Request Tokens
          </button>
        </div>

        {/* Transactions */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Transaction History</p>
          {walletHistory.length === 0 ? (
            <EmptyState title="No transactions yet" body="Token credits and debits will appear here." />
          ) : (
            <div className="space-y-2">
              {walletHistory.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-800/50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      tx.type === 'credit' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {tx.type === 'credit' ? <CircleDollarSign className="h-4 w-4" /> : <Coins className="h-4 w-4" />}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white capitalize">{tx.label.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-500">{tx.note}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                    </p>
                    <p className="text-xs text-gray-600">{tx.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────

function ProfileSection({
  checklist, profileScore, data,
}: {
  checklist: ProfileChecklistItem[];
  profileScore: number;
  data: VendorPanelData;
}) {
  const done = checklist.filter((i) => i.done).length;

  const [form, setForm] = useState({
    businessName: data.vendorName ?? '',
    phone:        data.vendorPhone ?? '',
    description:  '',
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [err,    setErr]    = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErr(''); setSaved(false);
    try {
      await vendorPanelApi.updateProfile({
        businessName: form.businessName,
        phone:        form.phone,
        description:  form.description || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setErr('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Profile" title="Business Profile" />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Edit form */}
        <form onSubmit={handleSave} className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Edit Details</p>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Business Name</label>
            <input
              type="text"
              value={form.businessName}
              onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
              placeholder="e.g. Royal Events Photography"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Business Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
              placeholder="9876543210"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition resize-none"
              placeholder="Describe your services, specialties, experience..."
            />
          </div>

          {err && <p className="text-xs text-red-400">{err}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2"
          >
            {saving ? (
              <><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving…</>
            ) : saved ? (
              <><Check className="h-4 w-4" />Saved!</>
            ) : 'Save Changes'}
          </button>
        </form>

        {/* Score + checklist */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Profile Score</p>
            <p className="mt-2 text-5xl font-bold text-white">{profileScore}<span className="text-xl text-gray-500">/100</span></p>
            <div className="mt-3 h-2 rounded-full bg-gray-800 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400" style={{ width: `${profileScore}%` }} />
            </div>
            <p className="mt-3 text-xs text-gray-500">{done} of {checklist.length} steps done</p>
            <p className="mt-1 text-xs text-gray-600">Higher score = better ranking + more leads</p>
          </div>

          <div className="space-y-2">
            {checklist.map((item) => (
              <div key={item.id} className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${item.done ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-gray-800 bg-gray-900'}`}>
                <span className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold mt-0.5 ${
                  item.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-500'
                }`}>
                  {item.done ? <Check className="h-3.5 w-3.5" /> : `+${item.weight}`}
                </span>
                <div>
                  <p className="text-xs font-semibold text-white">{item.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{item.hint}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Availability ─────────────────────────────────────────────────────────────

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const TIME_SLOTS_AVAIL = ['morning', 'afternoon', 'evening', 'full'] as const;
type TimeSlot = typeof TIME_SLOTS_AVAIL[number];

interface AvailabilityData {
  availabilityType: 'always' | 'manual';
  weeklySlots: Record<string, TimeSlot[]>;
  blockedDates: string[];
  calendar: Array<{ date: string; status: 'available' | 'limited' | 'blocked' | 'hold'; slots: TimeSlot[] }>;
}

function AvailabilitySection() {
  const [avail, setAvail] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blockInput, setBlockInput] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    availabilityApi.get()
      .then((d: unknown) => setAvail(d as AvailabilityData))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleType = async () => {
    if (!avail) return;
    const next = avail.availabilityType === 'always' ? 'manual' : 'always';
    setSaving(true);
    try {
      const updated = await availabilityApi.update({ availabilityType: next }) as unknown as AvailabilityData;
      setAvail((prev) => prev ? { ...prev, ...updated, availabilityType: next } : null);
      setMsg('Saved!');
    } catch { setMsg('Error saving'); }
    finally { setSaving(false); setTimeout(() => setMsg(''), 2000); }
  };

  const toggleSlot = async (day: string, slot: TimeSlot) => {
    if (!avail) return;
    const cur = avail.weeklySlots[day] || [];
    const next = cur.includes(slot) ? cur.filter((s) => s !== slot) : [...cur, slot];
    const updatedSlots = { ...avail.weeklySlots, [day]: next };
    setAvail((prev) => prev ? { ...prev, weeklySlots: updatedSlots } : null);
    try {
      await availabilityApi.update({ weeklySlots: updatedSlots });
    } catch { /* revert silently */ }
  };

  const blockDate = async () => {
    if (!blockInput || !avail) return;
    setSaving(true);
    try {
      await availabilityApi.blockDate(blockInput);
      setAvail((prev) => prev ? { ...prev, blockedDates: [...new Set([...prev.blockedDates, blockInput])] } : null);
      setBlockInput('');
      setMsg('Date blocked');
    } catch { setMsg('Error'); }
    finally { setSaving(false); setTimeout(() => setMsg(''), 2000); }
  };

  const unblockDate = async (date: string) => {
    if (!avail) return;
    try {
      await availabilityApi.unblockDate(date);
      setAvail((prev) => prev ? { ...prev, blockedDates: prev.blockedDates.filter((d) => d !== date) } : null);
    } catch { /* silent */ }
  };

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-gray-800 rounded-xl" />
      <div className="h-64 bg-gray-800 rounded-xl" />
    </div>
  );

  if (!avail) return (
    <div className="text-center py-16 text-gray-500">Unable to load availability. Please refresh.</div>
  );

  const today = new Date().toISOString().substring(0, 10);
  const calendarWeeks: AvailabilityData['calendar'][] = [];
  let week: AvailabilityData['calendar'] = [];
  avail.calendar.slice(0, 42).forEach((day, i) => {
    week.push(day);
    if (week.length === 7 || i === avail.calendar.length - 1) { calendarWeeks.push(week); week = []; }
  });

  return (
    <div className="space-y-5">
      <SectionHeader eyebrow="Availability" title="Manage Your Schedule" />

      {/* Availability mode toggle */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-white text-sm">Availability Mode</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {avail.availabilityType === 'always'
                ? 'You appear available to all buyers on all dates.'
                : "Set your schedule manually \u2014 buyers only see dates you're free."}
            </p>
          </div>
          <button
            onClick={toggleType}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              avail.availabilityType === 'always'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
            }`}
          >
            {avail.availabilityType === 'always' ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
            {avail.availabilityType === 'always' ? 'Always Available' : 'Manual Schedule'}
          </button>
        </div>
        {msg && <p className="mt-2 text-xs text-emerald-400 font-semibold">{msg}</p>}
      </div>

      {/* Weekly schedule — only shown in manual mode */}
      {avail.availabilityType === 'manual' && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <p className="font-bold text-white text-sm mb-4">Weekly Schedule</p>
          <div className="space-y-3">
            {DAY_ORDER.map((day) => {
              const slots = avail.weeklySlots[day] || [];
              return (
                <div key={day} className="flex items-center gap-3 flex-wrap">
                  <span className="w-24 text-xs font-semibold text-gray-400 capitalize">{day.slice(0, 3)}</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {TIME_SLOTS_AVAIL.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => toggleSlot(day, slot)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all capitalize ${
                          slots.includes(slot)
                            ? 'bg-red-600 text-white border-red-600'
                            : 'border-gray-700 text-gray-500 hover:border-gray-500'
                        }`}
                      >
                        {slot === 'full' ? '📅 Full' : slot === 'morning' ? '🌅 Morn' : slot === 'afternoon' ? '☀️ Aft' : '🌆 Eve'}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 90-day mini calendar */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-white text-sm">Next 90 Days</p>
          <div className="flex gap-3 text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Available</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Limited</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-600 inline-block" /> Blocked</span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
            <div key={d} className="text-[9px] font-bold text-gray-600 uppercase">{d}</div>
          ))}
        </div>
        <div className="space-y-1">
          {calendarWeeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((day) => {
                const isToday = day.date === today;
                const isPast = day.date < today;
                const bg = isPast ? 'bg-gray-800/30 text-gray-700'
                  : day.status === 'available' ? 'bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60 cursor-pointer'
                  : day.status === 'limited' ? 'bg-amber-900/40 text-amber-400 hover:bg-amber-900/60 cursor-pointer'
                  : day.status === 'hold' ? 'bg-blue-900/40 text-blue-400'
                  : 'bg-red-900/40 text-red-400 hover:bg-red-900/60 cursor-pointer';
                const dayNum = new Date(day.date + 'T12:00:00').getDate();
                return (
                  <button
                    key={day.date}
                    disabled={isPast || saving}
                    title={`${day.date} — ${day.status}`}
                    onClick={() => {
                      if (isPast) return;
                      if (day.status === 'blocked') unblockDate(day.date);
                      else {
                        availabilityApi.blockDate(day.date).then(() => {
                          setAvail((prev) => prev ? { ...prev, blockedDates: [...new Set([...prev.blockedDates, day.date])] } : null);
                        });
                      }
                    }}
                    className={`w-full aspect-square rounded-lg text-[10px] font-bold transition-all flex items-center justify-center ${bg} ${isToday ? 'ring-2 ring-red-500' : ''}`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-600 mt-2">Click a date to block/unblock it.</p>
      </div>

      {/* Block a specific date */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <p className="font-bold text-white text-sm mb-3">Block a Specific Date</p>
        <div className="flex gap-2">
          <input
            type="date"
            value={blockInput}
            min={today}
            onChange={(e) => setBlockInput(e.target.value)}
            className="border border-gray-700 bg-gray-800 text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            onClick={blockDate}
            disabled={!blockInput || saving}
            className="bg-red-600 hover:bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition disabled:opacity-40"
          >
            Block Date
          </button>
        </div>

        {avail.blockedDates.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-400 mb-2">Currently blocked:</p>
            <div className="flex flex-wrap gap-2">
              {[...new Set(avail.blockedDates)].sort().map((date) => (
                <span key={date} className="flex items-center gap-1.5 bg-red-900/30 border border-red-700/40 text-red-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {new Date(date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  <button onClick={() => unblockDate(date)} className="text-red-400 hover:text-red-200 font-bold">×</button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function SettingsSection() {
  return (
    <div className="space-y-4">
      <SectionHeader eyebrow="Settings" title="Account & Notifications" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <p className="text-base font-bold text-white mb-4">Notifications</p>
          <div className="space-y-3">
            <ToggleRow label="Instant lead alerts" desc="New lead notifications to phone and browser." on />
            <ToggleRow label="Daily summary" desc="Performance digest delivered every morning." on />
            <ToggleRow label="Marketing tips" desc="Ranking and package tips inside the panel." on />
          </div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <p className="text-base font-bold text-white mb-4">API Endpoints</p>
          <div className="space-y-2 text-xs text-gray-500">
            {[
              ['Dashboard', 'GET /vendor/dashboard'],
              ['Leads', 'GET /vendor/leads'],
              ['Unlock Lead', 'POST /vendor/leads/:id/unlock'],
              ['Services', 'GET /vendor/services'],
              ['Wallet', 'GET /vendor/wallet'],
            ].map(([label, endpoint]) => (
              <div key={label} className="flex items-center justify-between rounded-lg bg-gray-800 px-3 py-2">
                <span className="text-gray-500">{label}</span>
                <code className="text-gray-400 font-mono">{endpoint}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, on }: { label: string; desc: string; on?: boolean }) {
  const [enabled, setEnabled] = useState(on ?? false);
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-800 p-4">
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="mt-0.5 text-xs text-gray-500">{desc}</p>
      </div>
      <button type="button" onClick={() => setEnabled((v) => !v)}
        className={`shrink-0 h-6 w-11 rounded-full p-1 transition-all ${enabled ? 'bg-red-600' : 'bg-gray-700'}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">{title}</h2>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-800 p-10 text-center">
      <p className="text-base font-bold text-gray-500">{title}</p>
      <p className="mt-2 text-sm text-gray-600">{body}</p>
    </div>
  );
}

function DarkField({
  label, placeholder, value, onChange, multiline, error,
}: { label: string; placeholder: string; value: string; onChange: (v: string) => void; multiline?: boolean; error?: string }) {
  const borderCls = error ? 'border-red-500/60 focus:border-red-500' : 'border-gray-700 focus:border-red-600/50';
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
      {multiline ? (
        <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className={`w-full rounded-xl border bg-gray-800 px-3 py-2.5 text-sm text-gray-300 outline-none placeholder:text-gray-600 ${borderCls}`} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className={`w-full rounded-xl border bg-gray-800 px-3 py-2.5 text-sm text-gray-300 outline-none placeholder:text-gray-600 ${borderCls}`} />
      )}
      {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
    </label>
  );
}

function DarkSelect({
  label, value, onChange, options, placeholder, error,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[] | Array<{ value: string; label: string }>;
  placeholder?: string; error?: string;
}) {
  const borderCls = error ? 'border-red-500/60' : 'border-gray-700 focus:border-red-600/50';
  const normalised: Array<{ value: string; label: string }> = options.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o,
  );
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border bg-gray-800 px-3 py-2.5 text-sm text-gray-300 outline-none ${borderCls}`}>
        {placeholder && <option value="">{placeholder}</option>}
        {normalised.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
    </label>
  );
}
