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
import { locationsApi, availabilityApi } from '@/lib/api';

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
  const addPackage = async (payload: {
    title: string; categoryId?: number; price: number; priceType: 'fixed' | 'per_person';
    description?: string; serviceIds?: number[]; tag?: string; minGuests?: number; maxGuests?: number;
    cityId?: number; localityIds?: number[];
  }) => {
    const created = await apiCreatePackage({ ...payload, status: 'active' } as any) as unknown as PackageItem;
    setPackages((cur) => [...cur, { ...created, serviceIds: created.serviceIds ?? payload.serviceIds ?? [] }]);
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
  const addService = async (svcData: Omit<VendorServiceItem, 'id' | 'vendorId' | 'createdAt' | 'sortOrder'>) => {
    try {
      const created = await apiCreateService(svcData) as unknown as VendorServiceItem;
      setServices((cur) => [...cur, created]);
    } catch { /* silent */ }
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
                onAdd={addService}
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
              <ProfileSection checklist={data.profileChecklist} profileScore={data.profileScore} />
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

function ServicesSection({
  services, categories, onAdd, onToggleStatus, onRemove,
}: {
  services: VendorServiceItem[];
  categories: Array<{ id: number; name: string }> | string[];
  onAdd: (d: Omit<VendorServiceItem, 'id' | 'vendorId' | 'createdAt' | 'sortOrder'>) => Promise<void>;
  onToggleStatus: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  // Normalise to string[] for the DarkSelect inside
  const categoryNames: string[] = categories.map((c) => typeof c === 'string' ? c : c.name);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', categoryName: '',
    priceUnit: 'per event', minPrice: '', maxPrice: '',
    duration: '', highlightsText: '', status: 'active' as 'active' | 'inactive',
  });

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await onAdd({
      title: form.title, description: form.description,
      categoryName: form.categoryName || undefined,
      priceUnit: form.priceUnit || undefined,
      minPrice: form.minPrice ? Number(form.minPrice) : undefined,
      maxPrice: form.maxPrice ? Number(form.maxPrice) : undefined,
      duration: form.duration || undefined,
      highlights: form.highlightsText.split('\n').map((h) => h.trim()).filter(Boolean),
      status: form.status,
    });
    setSaving(false);
    setForm({ title: '', description: '', categoryName: '', priceUnit: 'per event', minPrice: '', maxPrice: '', duration: '', highlightsText: '', status: 'active' });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader eyebrow="Services" title="Your Service Offerings" />
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          {showForm ? 'Cancel' : 'Add Service'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
          <p className="text-base font-bold text-white mb-4">New Service</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <DarkField label="Title *" placeholder="e.g. Wedding Photography Full Day" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} />
            <DarkSelect label="Category" value={form.categoryName} onChange={(v) => setForm((f) => ({ ...f, categoryName: v }))} options={categoryNames} placeholder="Select category" />
            <DarkField label="Min Price (₹)" placeholder="50000" value={form.minPrice} onChange={(v) => setForm((f) => ({ ...f, minPrice: v }))} />
            <DarkField label="Max Price (₹)" placeholder="200000" value={form.maxPrice} onChange={(v) => setForm((f) => ({ ...f, maxPrice: v }))} />
            <DarkField label="Price Unit" placeholder="per event / per hour" value={form.priceUnit} onChange={(v) => setForm((f) => ({ ...f, priceUnit: v }))} />
            <DarkField label="Duration" placeholder="Full Day / 6 hours" value={form.duration} onChange={(v) => setForm((f) => ({ ...f, duration: v }))} />
            <div className="sm:col-span-2">
              <DarkField label="Description" placeholder="What makes this service unique..." value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} multiline />
            </div>
            <div className="sm:col-span-2">
              <DarkField label="Highlights (one per line)" placeholder={"2 photographers\nDrone coverage\nSame-week delivery"} value={form.highlightsText} onChange={(v) => setForm((f) => ({ ...f, highlightsText: v }))} multiline />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
            className="mt-4 flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-50 transition-all"
          >
            {saving ? 'Saving…' : 'Save Service'}
          </button>
        </div>
      )}

      {services.length === 0 && !showForm ? (
        <EmptyState title="No services yet" body="Add your first service to appear in AI-generated event plans and search results." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((svc) => (
            <div
              key={svc.id}
              className={`rounded-xl border p-5 transition-all ${
                svc.status === 'active' ? 'border-gray-700 bg-gray-900' : 'border-gray-800 bg-gray-900/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  {svc.categoryName && <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">{svc.categoryName}</p>}
                  <h3 className="text-sm font-bold text-white leading-tight">{svc.title}</h3>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${svc.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-500'}`}>
                  {svc.status}
                </span>
              </div>

              {(svc.minPrice || svc.maxPrice) && (
                <p className="text-sm font-bold text-red-400">
                  {svc.minPrice && svc.maxPrice ? `${fmtPrice(svc.minPrice)} – ${fmtPrice(svc.maxPrice)}` :
                   svc.minPrice ? `from ${fmtPrice(svc.minPrice)}` : fmtPrice(svc.maxPrice!)}
                  {svc.priceUnit && <span className="ml-1 text-xs font-normal text-gray-500">{svc.priceUnit}</span>}
                </p>
              )}
              {svc.duration && <p className="mt-0.5 text-xs text-gray-600">{svc.duration}</p>}
              {svc.description && <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">{svc.description}</p>}

              {svc.highlights.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {svc.highlights.slice(0, 3).map((h) => (
                    <span key={h} className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-gray-800 px-2 py-0.5 text-[10px] text-gray-400">
                      <Check className="h-2.5 w-2.5 text-emerald-500" />{h}
                    </span>
                  ))}
                  {svc.highlights.length > 3 && (
                    <span className="rounded-full border border-gray-700 bg-gray-800 px-2 py-0.5 text-[10px] text-gray-600">+{svc.highlights.length - 3}</span>
                  )}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => onToggleStatus(svc.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-gray-700 py-2 text-[11px] font-semibold text-gray-400 hover:border-gray-500 hover:text-white transition-all">
                  {svc.status === 'active' ? <><ToggleRight className="h-3.5 w-3.5 text-emerald-400" /> Active</> : <><ToggleLeft className="h-3.5 w-3.5" /> Inactive</>}
                </button>
                <button type="button" onClick={() => onRemove(svc.id)}
                  className="flex items-center justify-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-400 hover:bg-red-500/20 transition-all">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Packages ─────────────────────────────────────────────────────────────────

// TAG config
const TAG_CONFIG = {
  budget:   { label: 'Budget',   color: 'text-blue-400   border-blue-500/30   bg-blue-500/10'   },
  standard: { label: 'Standard', color: 'text-gray-300   border-gray-600      bg-gray-800'      },
  premium:  { label: 'Premium',  color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  luxury:   { label: 'Luxury',   color: 'text-amber-400  border-amber-500/30  bg-amber-500/10'  },
} as const;

function PackagesSection({
  packages, services, cities: initialCities, serviceCategories, onSave,
  onToggleStatus, onToggleBoost, onToggleFeatured, onViewLeads,
}: {
  packages: PackageItem[];
  services: VendorServiceItem[];
  cities: Array<{ id: number; name: string }>;
  serviceCategories: Array<{ id: number; name: string }>;
  onSave: (data: {
    title: string; categoryId?: number; price: number; priceType: 'fixed' | 'per_person';
    description?: string; serviceIds?: number[]; tag?: string; minGuests?: number; maxGuests?: number;
    cityId?: number; localityIds?: number[];
  }) => Promise<void>;
  onToggleStatus: (id: number) => void;
  onToggleBoost: (id: number) => void;
  onToggleFeatured: (id: number) => void;
  onViewLeads: (id: number) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', categoryId: '', price: '', description: '',
    minGuests: '', maxGuests: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [priceType, setPriceType] = useState<'fixed' | 'per_person'>('fixed');
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [cities, setCities] = useState(initialCities);
  const [cityId, setCityId] = useState(initialCities[0]?.id ?? 0);
  const [localities, setLocalities] = useState<Array<{ id: number; name: string }>>([]);
  const [localityId, setLocalityId] = useState(0);
  const [addedLocalities, setAddedLocalities] = useState<Array<{ id: number; label: string }>>([]);
  const [loadingLocalities, setLoadingLocalities] = useState(false);

  // Computed savings from selected services
  const activeServices = services.filter((s) => s.status === 'active');
  const selectedServices = activeServices.filter((s) => selectedServiceIds.includes(s.id));
  const totalIndividualPrice = selectedServices.reduce((sum, s) => sum + Number(s.minPrice ?? 0), 0);
  const bundlePrice = Number(form.price) || 0;
  const savings = totalIndividualPrice > 0 && bundlePrice > 0 && bundlePrice < totalIndividualPrice
    ? Math.round(((totalIndividualPrice - bundlePrice) / totalIndividualPrice) * 100)
    : 0;

  useEffect(() => {
    if (cities.length === 0) {
      locationsApi.getCities()
        .then((d: unknown) => { const list = d as Array<{ id: number; name: string }>; setCities(list); setCityId(list[0]?.id ?? 0); })
        .catch(() => {});
    }
  }, [cities.length]);

  useEffect(() => {
    if (!cityId) return;
    setLoadingLocalities(true);
    setLocalities([]);
    setLocalityId(0);
    locationsApi.getLocalities(cityId)
      .then((d: unknown) => { const list = d as Array<{ id: number; name: string }>; setLocalities(list); setLocalityId(list[0]?.id ?? 0); })
      .catch(() => {})
      .finally(() => setLoadingLocalities(false));
  }, [cityId]);

  const toggleService = (id: number) => {
    setSelectedServiceIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  };

  const addLoc = () => {
    if (!cityId) return;
    const cityName = cities.find((c) => c.id === cityId)?.name ?? '';
    const locality = localities.find((l) => l.id === localityId);
    const label = locality ? `${locality.name}, ${cityName}` : cityName;
    const alreadyAdded = addedLocalities.some((l) => l.id === localityId && localityId !== 0);
    if (!alreadyAdded) setAddedLocalities((prev) => [...prev, { id: localityId, label }]);
  };

  const resetForm = () => {
    setForm({ name: '', categoryId: '', price: '', description: '', minGuests: '', maxGuests: '' });
    setSelectedServiceIds([]);
    setAddedLocalities([]);
    setErrors({});
    setPriceType('fixed');
  };

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Package name is required';
    if (!form.price.trim() || isNaN(Number(form.price)) || Number(form.price) <= 0) errs.price = 'Enter a valid price';
    if (selectedServiceIds.length < 1) errs.services = 'Select at least 1 service to bundle';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const localityIds = addedLocalities.filter((l) => l.id > 0).map((l) => l.id);

    setSaving(true);
    try {
      await onSave({
        title: form.name.trim(),
        categoryId: form.categoryId ? Number(form.categoryId) : undefined,
        price: Number(form.price),
        priceType,
        description: form.description.trim() || undefined,
        serviceIds: selectedServiceIds,
        minGuests: form.minGuests ? Number(form.minGuests) : undefined,
        maxGuests: form.maxGuests ? Number(form.maxGuests) : undefined,
        cityId: cityId || undefined,
        localityIds: localityIds.length > 0 ? localityIds : undefined,
      });
      setSaved(true);
      resetForm();
      setTimeout(() => { setSaved(false); setShowForm(false); }, 2500);
    } catch {
      setErrors((e) => ({ ...e, _: 'Failed to save. Please try again.' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader eyebrow="Packages" title="Service Bundles" />
        <button
          type="button"
          onClick={() => { setShowForm((v) => !v); resetForm(); }}
          className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          {showForm ? 'Cancel' : 'New Bundle'}
        </button>
      </div>

      {/* Insight chips */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: <Zap className="h-4 w-4 text-red-400" />,     text: 'Bundles get 3× more leads than standalone services', bg: 'border-red-500/30 bg-red-500/10' },
          { icon: <TrendingUp className="h-4 w-4 text-amber-400" />, text: 'Bundle discount boosts ranking in AI search', bg: 'border-amber-500/30 bg-amber-500/10' },
          { icon: <Star className="h-4 w-4 text-purple-400" />,  text: 'Premium & luxury bundles convert 2× better', bg: 'border-purple-500/30 bg-purple-500/10' },
        ].map((c, i) => (
          <div key={i} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${c.bg}`}>
            {c.icon}
            <p className="text-xs font-semibold text-gray-300">{c.text}</p>
          </div>
        ))}
      </div>

      {/* Create bundle form */}
      {showForm && (
        <div className="rounded-xl border border-red-600/30 bg-gray-900 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">New Bundle</p>
          <p className="text-lg font-bold text-white mb-4">Select services + set bundle price</p>

          {/* Step 1 — pick services */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Step 1 — Select Services to Bundle *
              </p>
              {selectedServiceIds.length > 0 && (
                <span className="text-[10px] font-bold text-emerald-400">
                  {selectedServiceIds.length} selected · Individual total: {fmtPrice(totalIndividualPrice)}
                </span>
              )}
            </div>
            {errors.services && <p className="text-[11px] text-red-400 mb-2">{errors.services}</p>}
            {activeServices.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-700 px-4 py-5 text-center">
                <p className="text-xs text-gray-500">No active services found.</p>
                <p className="text-[11px] text-gray-600 mt-1">Go to Services tab to add your offerings first.</p>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {activeServices.map((svc) => {
                  const checked = selectedServiceIds.includes(svc.id);
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => toggleService(svc.id)}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                        checked
                          ? 'border-red-600/50 bg-red-600/10'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        checked ? 'border-red-500 bg-red-500' : 'border-gray-600'
                      }`}>
                        {checked && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white leading-tight">{svc.title}</p>
                        {svc.categoryName && <p className="text-[10px] text-red-400 mt-0.5">{svc.categoryName}</p>}
                        {(svc.minPrice || svc.maxPrice) && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {svc.minPrice ? fmtPrice(svc.minPrice) : ''}
                            {svc.minPrice && svc.maxPrice ? ' – ' : ''}
                            {svc.maxPrice ? fmtPrice(svc.maxPrice) : ''}
                            {svc.priceUnit ? ` / ${svc.priceUnit}` : ''}
                          </p>
                        )}
                        {svc.duration && <p className="text-[10px] text-gray-500">{svc.duration}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2 — bundle details */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Step 2 — Bundle Details</p>
            <DarkField
              label="Bundle Name *"
              placeholder="e.g. Complete Wedding Photography Package"
              value={form.name}
              onChange={(v) => { setForm((f) => ({ ...f, name: v })); setErrors((e) => ({ ...e, name: '' })); }}
              error={errors.name}
            />
            <DarkSelect
              label="Category"
              value={form.categoryId}
              onChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
              options={serviceCategories.map((c) => ({ value: String(c.id), label: c.name }))}
              placeholder="Select category (optional)"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <DarkField
                  label="Bundle Price (₹) *"
                  placeholder="150000"
                  value={form.price}
                  onChange={(v) => { setForm((f) => ({ ...f, price: v })); setErrors((e) => ({ ...e, price: '' })); }}
                  error={errors.price}
                />
                {savings > 0 && (
                  <p className="text-[10px] text-emerald-400 mt-1 font-semibold">
                    ✓ {savings}% savings vs individual ({fmtPrice(totalIndividualPrice)})
                  </p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Price Type</p>
                <div className="flex gap-2">
                  {(['fixed', 'per_person'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setPriceType(t)}
                      className={`flex-1 rounded-lg border py-2.5 text-xs font-semibold transition-all ${
                        priceType === t ? 'border-red-600 bg-red-600 text-white' : 'border-gray-700 bg-gray-800 text-gray-400'
                      }`}>
                      {t === 'fixed' ? 'Fixed' : 'Per Person'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DarkField label="Min Guests" placeholder="50" value={form.minGuests} onChange={(v) => setForm((f) => ({ ...f, minGuests: v }))} />
              <DarkField label="Max Guests" placeholder="500" value={form.maxGuests} onChange={(v) => setForm((f) => ({ ...f, maxGuests: v }))} />
            </div>
            <DarkField
              label="Description"
              placeholder="Why this bundle is the best value…"
              value={form.description}
              onChange={(v) => setForm((f) => ({ ...f, description: v }))}
              multiline
            />

            {/* Location */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Service Location</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <p className="text-[9px] font-semibold text-gray-600 mb-1">City</p>
                  <select value={cityId} onChange={(e) => setCityId(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none focus:border-red-600/50">
                    {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-[9px] font-semibold text-gray-600 mb-1">Locality</p>
                  {loadingLocalities ? (
                    <div className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-600">Loading…</div>
                  ) : localities.length > 0 ? (
                    <select value={localityId} onChange={(e) => setLocalityId(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none focus:border-red-600/50">
                      {localities.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  ) : (
                    <div className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-600">No localities</div>
                  )}
                </div>
              </div>
              <button type="button" onClick={addLoc}
                className="flex items-center gap-1.5 rounded-lg border border-red-600/40 bg-red-600/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-600/20 transition-all">
                <Plus className="h-3.5 w-3.5" /> Add Location
              </button>
              {addedLocalities.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {addedLocalities.map((l) => (
                    <span key={l.id} className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-gray-800 px-2.5 py-1 text-xs text-gray-400">
                      <MapPin className="h-3 w-3" />{l.label}
                      <button type="button" onClick={() => setAddedLocalities((ls) => ls.filter((x) => x.id !== l.id))}>
                        <X className="h-3 w-3 ml-0.5 hover:text-red-400" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {errors._ && (
            <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">{errors._}</p>
          )}
          {saved && (
            <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400 flex items-center gap-2">
              <Check className="h-3.5 w-3.5" /> Bundle saved! Customers can now discover it.
            </p>
          )}
          <button type="button" onClick={handleSave} disabled={saving}
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-60 transition-all">
            {saving
              ? <><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving…</>
              : <><Package className="h-4 w-4" /> Publish Bundle</>
            }
          </button>
        </div>
      )}

      {/* Bundle list */}
      {packages.length === 0 ? (
        <EmptyState
          title="No bundles yet"
          body="Bundle 2+ services together with a discount. Customers prefer bundles — they convert 3× better than individual listings."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {packages.map((pkg) => {
            const tagCfg = pkg.tag ? TAG_CONFIG[pkg.tag] : null;
            const bundledServices = services.filter((s) => (pkg.serviceIds ?? []).includes(s.id));
            return (
              <div key={pkg.id} className={`rounded-xl border p-5 ${
                pkg.boosted ? 'border-amber-500/40 bg-amber-500/5' :
                pkg.status === 'active' ? 'border-gray-700 bg-gray-900' :
                'border-gray-800 bg-gray-900/50 opacity-60'
              }`}>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      {pkg.category && <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">{pkg.category}</p>}
                      {tagCfg && (
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${tagCfg.color}`}>
                          {tagCfg.label}
                        </span>
                      )}
                      {pkg.boosted && <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-gray-900"><Zap className="h-2.5 w-2.5" />BOOSTED</span>}
                      {pkg.featured && <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-bold text-white"><Star className="h-2.5 w-2.5" />FEATURED</span>}
                    </div>
                    <h3 className="text-sm font-bold text-white leading-tight">{pkg.title}</h3>
                    {(pkg.minGuests || pkg.maxGuests) && (
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {pkg.minGuests && `${pkg.minGuests}`}{pkg.minGuests && pkg.maxGuests ? '–' : ''}{pkg.maxGuests && `${pkg.maxGuests}`} guests
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="block rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white whitespace-nowrap">
                      {fmtPrice(pkg.price)}{pkg.priceType === 'per_person' ? '/pp' : ''}
                    </span>
                    {Number(pkg.savingsPercent) > 0 && (
                      <span className="text-[10px] font-bold text-emerald-400 mt-1 block">
                        {Math.round(Number(pkg.savingsPercent))}% savings
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 my-3">
                  <div className="rounded-lg bg-gray-800 px-2 py-2 text-center">
                    <p className="text-sm font-bold text-white">{pkg.leadsGenerated}</p>
                    <p className="text-[9px] text-gray-500">Leads</p>
                  </div>
                  <div className="rounded-lg bg-gray-800 px-2 py-2 text-center">
                    <p className="text-sm font-bold text-white">{bundledServices.length || pkg.serviceIds?.length || 0}</p>
                    <p className="text-[9px] text-gray-500">Services</p>
                  </div>
                  <div className={`rounded-lg px-2 py-2 text-center ${pkg.status === 'active' ? 'bg-emerald-500/10' : 'bg-gray-800'}`}>
                    <p className={`text-[10px] font-bold capitalize ${pkg.status === 'active' ? 'text-emerald-400' : 'text-gray-500'}`}>{pkg.status}</p>
                    <p className="text-[9px] text-gray-500">Status</p>
                  </div>
                </div>

                {/* Bundled service chips */}
                {bundledServices.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {bundledServices.map((s) => (
                      <span key={s.id} className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-gray-800 px-2 py-0.5 text-[10px] text-gray-400">
                        <Check className="h-2.5 w-2.5 text-emerald-400" />{s.title}
                      </span>
                    ))}
                  </div>
                )}

                {pkg.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">{pkg.description}</p>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => onToggleStatus(pkg.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-[11px] font-semibold text-gray-400 hover:border-gray-500 hover:text-white transition-all">
                    {pkg.status === 'active'
                      ? <><ToggleRight className="h-3.5 w-3.5 text-emerald-400" />Pause</>
                      : <><ToggleLeft className="h-3.5 w-3.5" />Activate</>}
                  </button>
                  <button type="button" onClick={() => onToggleFeatured(pkg.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
                      pkg.featured
                        ? 'border border-red-500/40 bg-red-500/10 text-red-400'
                        : 'border border-gray-700 bg-gray-800 text-gray-400 hover:text-white'
                    }`}>
                    <Star className="h-3.5 w-3.5" />
                    {pkg.featured ? 'Featured ✓' : 'Mark Featured'}
                  </button>
                  <button type="button" onClick={() => onToggleBoost(pkg.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
                      pkg.boosted
                        ? 'border border-amber-500/40 bg-amber-500/10 text-amber-400'
                        : 'border border-gray-700 bg-gray-800 text-gray-400 hover:text-white'
                    }`}>
                    <Zap className="h-3.5 w-3.5" />
                    {pkg.boosted ? 'Boosted ✓' : 'Boost (10)'}
                  </button>
                  <button type="button" onClick={() => onViewLeads(pkg.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-[11px] font-semibold text-gray-400 hover:border-gray-500 hover:text-white transition-all">
                    <MessageSquare className="h-3.5 w-3.5" />{pkg.leadsGenerated} leads
                  </button>
                </div>
              </div>
            );
          })}
        </div>
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

function ProfileSection({ checklist, profileScore }: { checklist: ProfileChecklistItem[]; profileScore: number }) {
  const done = checklist.filter((i) => i.done).length;
  return (
    <div className="space-y-4">
      <SectionHeader eyebrow="Profile" title="Profile Completeness" />
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* Score */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Score</p>
          <p className="mt-2 text-5xl font-bold text-white">{profileScore}<span className="text-xl text-gray-500">%</span></p>
          <div className="mt-3 h-2 rounded-full bg-gray-800 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400" style={{ width: `${profileScore}%` }} />
          </div>
          <p className="mt-3 text-xs text-gray-500">{done} of {checklist.length} actions complete</p>
          <p className="mt-2 text-xs text-gray-600 leading-relaxed">Higher score = better ranking + more lead volume.</p>
        </div>

        {/* Checklist */}
        <div className="grid gap-3 sm:grid-cols-2 content-start">
          {checklist.map((item) => (
            <div key={item.id} className={`rounded-xl border p-4 ${item.done ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-gray-800 bg-gray-900'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed">{item.hint}</p>
                </div>
                <span className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                  item.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-500'
                }`}>
                  {item.done ? <Check className="h-4 w-4" /> : `+${item.weight}`}
                </span>
              </div>
            </div>
          ))}
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
