/**
 * Vendor Panel — fully dynamic data layer.
 * All data comes from real APIs. No mock/static data.
 */
import {
  api,
  vendorPanelApi,
  packagesApi,
  vendorServicesApi,
  categoriesApi,
  locationsApi,
} from '@/lib/api';
import type {
  VendorDashboard,
  VendorPackage,
  Lead,
  TokenWallet,
  TokenTransaction,
  Category,
  City,
} from '@/types';

// ─── Panel Section Type ────────────────────────────────────────────────────────

export type PanelSection =
  | 'dashboard'
  | 'leads'
  | 'services'
  | 'packages'
  | 'wallet'
  | 'availability'
  | 'profile'
  | 'settings';

export type LeadStatus = 'new' | 'viewed' | 'contacted' | 'converted' | 'ignored';

// ─── Vendor Service (individual service offering) ─────────────────────────────
export interface VendorServiceItem {
  id: number;
  vendorId: number;
  title: string;
  description: string;
  categoryId?: number;
  categoryName?: string;
  priceUnit?: string;
  minPrice?: number;
  maxPrice?: number;
  duration?: string;
  highlights: string[];
  status: 'active' | 'inactive';
  sortOrder: number;
  createdAt: string;
}
export type LeadFilter = 'all' | 'new' | 'contacted' | 'converted' | 'high-quality' | 'by-package';

// ─── Panel Data Interfaces ────────────────────────────────────────────────────

export interface VendorLeadItem {
  id: number;
  customerName: string;
  phone: string;
  eventType: string;
  budget: string;
  location: string;
  message: string;
  qualityScore: number;
  status: LeadStatus;
  responseSla: string;
  createdAt: string;
  unlockCost: number;
  unlocked: boolean;
  whatsappLink: string;
  packageSource?: string;
  packageId?: number;
}

export interface PackageItem {
  id: number;
  vendorId: number;
  title: string;
  price: number;
  priceType: 'fixed' | 'per_person';
  category: string;
  categoryId?: number;
  includes: string[];
  description: string;
  locations: string[];
  preferredLocationIds: number[];
  localityIds: number[];
  cityId?: number;
  cityName?: string;
  leadsGenerated: number;
  status: 'active' | 'inactive';
  boosted: boolean;
  featured: boolean;
  boostExpiry?: string;
  boostScore: number;
}

export interface PackagePerformance {
  totalPackages: number;
  leadsFromPackages: number;
  topPackageName: string;
  topPackageLeads: number;
  boostActive: boolean;
}

export interface ProfileChecklistItem {
  id: string;
  label: string;
  done: boolean;
  weight: number;
  hint: string;
}

export interface WalletEntry {
  id: number;
  label: string;
  type: 'credit' | 'debit';
  amount: number;
  date: string;
  note: string;
}

export interface GrowthInsight {
  id: string;
  title: string;
  body: string;
  tone: 'accent' | 'success' | 'warning';
}

export interface DashboardMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  hint: string;
}

export interface VendorPanelData {
  vendorId: number;
  vendorName: string;
  vendorPhone?: string;
  vendorEmail?: string;
  vendorStatus?: string;
  vendorCity?: string;
  completionLabel: string;
  metrics: DashboardMetric[];
  profileScore: number;
  tokenBalance: number;
  responseTip: string;
  insights: GrowthInsight[];
  leads: VendorLeadItem[];
  packages: PackageItem[];
  packagePerformance: PackagePerformance;
  profileChecklist: ProfileChecklistItem[];
  walletHistory: WalletEntry[];
  services: VendorServiceItem[];
  serviceCategories: string[];
  cities: Array<Pick<City, 'id' | 'name'>>;
  packageStats: VendorDashboard['packageStats'];
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function formatBudget(budget?: number): string {
  if (!budget) return 'Budget not shared';
  if (budget >= 100000) return `₹${(budget / 100000).toFixed(budget % 100000 === 0 ? 0 : 1)}L`;
  return `₹${Math.round(budget / 1000)}K`;
}

function mapLeadToPanel(lead: Lead): VendorLeadItem {
  const statusMap: Record<string, LeadStatus> = {
    new: 'new',
    viewed: 'contacted',
    contacted: 'contacted',
    converted: 'converted',
    rejected: 'ignored',
  };

  return {
    id: lead.id,
    customerName: lead.contactName,
    phone: lead.contactPhone,
    eventType: lead.category?.name ?? 'Event Inquiry',
    budget: formatBudget(lead.budget),
    location: [lead.locality?.name, lead.city?.name].filter(Boolean).join(', ') || 'Location pending',
    message: lead.requirement ?? 'No requirement shared yet.',
    qualityScore: lead.qualityScore ?? 50,
    status: statusMap[lead.status] ?? 'new',
    responseSla:
      lead.status === 'new'
        ? 'Respond within 5 min = 3× conversion'
        : `Status: ${lead.status}`,
    createdAt: new Date(lead.createdAt).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }),
    unlockCost: 2,
    unlocked: (lead as any).isUnlocked === true || lead.status === 'viewed' || lead.status === 'contacted' || lead.status === 'converted',
    whatsappLink: `https://wa.me/91${lead.contactPhone}`,
    packageSource: lead.package
      ? `${lead.package.title} ₹${formatBudget(lead.package.price)}`
      : undefined,
    packageId: lead.packageId,
  };
}

function mapPackageToPanel(pkg: VendorPackage): PackageItem {
  return {
    id: pkg.id,
    vendorId: pkg.vendorId,
    title: pkg.title,
    price: pkg.price,
    priceType: pkg.priceType,
    category: pkg.category?.name ?? '',
    categoryId: pkg.categoryId,
    includes: pkg.includes ?? [],
    description: pkg.description ?? '',
    locations: pkg.city ? [pkg.city.name] : [],
    preferredLocationIds: pkg.preferredLocationIds ?? [],
    localityIds: pkg.localityIds ?? [],
    cityId: pkg.cityId,
    cityName: pkg.city?.name,
    leadsGenerated: pkg.leadsCount ?? 0,
    status: pkg.status,
    boosted: pkg.isBoosted,
    featured: pkg.isFeatured,
    boostExpiry: pkg.boostExpiresAt
      ? new Date(pkg.boostExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : undefined,
    boostScore: pkg.boostScore,
  };
}

function mapWalletEntry(tx: TokenTransaction): WalletEntry {
  return {
    id: tx.id,
    label: tx.reason?.replace(/_/g, ' ') ?? 'Token activity',
    type: tx.type,
    amount: tx.amount,
    date: new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    note: tx.note ?? 'Token wallet update',
  };
}

function buildInsights(
  profileScore: number,
  packageCount: number,
  newLeads: number,
): GrowthInsight[] {
  const insights: GrowthInsight[] = [];

  if (packageCount === 0) {
    insights.push({
      id: 'packages',
      title: 'Create your first package',
      body: 'Packages get 3× more leads than basic listings. Add price, includes, and location.',
      tone: 'accent',
    });
  }

  if (newLeads > 0) {
    insights.push({
      id: 'speed',
      title: `${newLeads} fresh lead${newLeads > 1 ? 's' : ''} waiting`,
      body: 'Same-hour responses usually increase your conversion rate significantly.',
      tone: 'success',
    });
  }

  if (profileScore < 80) {
    insights.push({
      id: 'profile',
      title: 'Profile score is below 80',
      body: 'Complete your profile with images, pricing, and locations to rank higher in search.',
      tone: 'warning',
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'healthy',
      title: 'Profile is in great shape',
      body: `Score: ${profileScore}/100. Keep packages fresh and respond fast to hold ranking.`,
      tone: 'success',
    });
  }

  return insights.slice(0, 3);
}

// ─── Main Data Loader ─────────────────────────────────────────────────────────

export async function getVendorPanelData(): Promise<VendorPanelData> {
  const [dashboardRes, packagesRes, leadsRes, walletRes, txRes, categoriesRes, citiesRes, servicesRes] =
    await Promise.allSettled([
      vendorPanelApi.getDashboard() as unknown as Promise<VendorDashboard>,
      packagesApi.getMyPackages() as unknown as Promise<VendorPackage[]>,
      vendorPanelApi.getLeads({ page: 1 }) as unknown as Promise<{ data: Lead[] }>,
      vendorPanelApi.getWallet() as unknown as Promise<TokenWallet>,
      vendorPanelApi.getTransactions(1) as unknown as Promise<{ data: TokenTransaction[] }>,
      categoriesApi.getAll('service') as unknown as Promise<Category[]>,
      locationsApi.getCities() as unknown as Promise<City[]>,
      vendorServicesApi.getAll() as unknown as Promise<VendorServiceItem[]>,
    ]);

  // ── Dashboard ──
  const dashboard =
    dashboardRes.status === 'fulfilled' ? dashboardRes.value : null;

  // ── Packages ──
  const rawPackages =
    packagesRes.status === 'fulfilled' && Array.isArray(packagesRes.value)
      ? packagesRes.value
      : [];

  // ── Leads ──
  const rawLeads =
    leadsRes.status === 'fulfilled' && Array.isArray(leadsRes.value?.data)
      ? leadsRes.value.data
      : [];

  // ── Wallet ──
  const wallet =
    walletRes.status === 'fulfilled' ? walletRes.value : null;

  // ── Transactions ──
  const rawTx =
    txRes.status === 'fulfilled' && Array.isArray(txRes.value?.data)
      ? txRes.value.data
      : [];

  // ── Categories ──
  const categories =
    categoriesRes.status === 'fulfilled' && Array.isArray(categoriesRes.value)
      ? categoriesRes.value
      : [];

  // ── Cities ──
  const cities =
    citiesRes.status === 'fulfilled' && Array.isArray(citiesRes.value)
      ? citiesRes.value.map((c) => ({ id: c.id, name: c.name }))
      : [];

  // ── Services ──
  const services: VendorServiceItem[] =
    servicesRes.status === 'fulfilled' && Array.isArray(servicesRes.value)
      ? (servicesRes.value as unknown as Array<{
          id: number; vendorId: number; title: string; description: string;
          category?: { name: string }; categoryId?: number; priceUnit?: string;
          minPrice?: number; maxPrice?: number; duration?: string;
          highlights?: string[]; status: string; sortOrder: number; createdAt: string;
        }>).map((s) => ({
          id: s.id,
          vendorId: s.vendorId,
          title: s.title,
          description: s.description ?? '',
          categoryId: s.categoryId,
          categoryName: s.category?.name,
          priceUnit: s.priceUnit,
          minPrice: s.minPrice,
          maxPrice: s.maxPrice,
          duration: s.duration,
          highlights: s.highlights ?? [],
          status: (s.status as 'active' | 'inactive') ?? 'active',
          sortOrder: s.sortOrder ?? 0,
          createdAt: s.createdAt,
        }))
      : [];

  // ── Map Data ──
  const packages = rawPackages.map(mapPackageToPanel);
  const leads = rawLeads.map(mapLeadToPanel);
  const walletHistory = rawTx.map(mapWalletEntry);
  const tokenBalance = wallet?.balance ?? dashboard?.tokenBalance ?? 0;
  const profileScore = dashboard?.profileScore ?? 0;

  // ── Package Performance ──
  const packagePerformance: PackagePerformance = dashboard?.packageStats
    ? {
        totalPackages: dashboard.packageStats.total,
        leadsFromPackages: dashboard.packageStats.totalLeadsFromPackages,
        topPackageName: dashboard.packageStats.topPackage?.name ?? '',
        topPackageLeads: dashboard.packageStats.topPackage?.leadsCount ?? 0,
        boostActive: dashboard.packageStats.boostActive,
      }
    : {
        totalPackages: packages.length,
        leadsFromPackages: packages.reduce((s, p) => s + p.leadsGenerated, 0),
        topPackageName: [...packages].sort((a, b) => b.leadsGenerated - a.leadsGenerated)[0]?.title ?? '',
        topPackageLeads: [...packages].sort((a, b) => b.leadsGenerated - a.leadsGenerated)[0]?.leadsGenerated ?? 0,
        boostActive: packages.some((p) => p.boosted),
      };

  // ── Profile Checklist from dashboard ──
  const profileChecklist: ProfileChecklistItem[] = (dashboard as any)?.checklist ?? [];

  // ── Metrics ──
  const metrics: DashboardMetric[] = dashboard?.metrics ?? [
    { label: 'Total Leads', value: '0', change: '0 new', trend: 'neutral', hint: 'No data yet' },
  ];

  const newLeads = dashboard?.newLeads ?? leads.filter((l) => l.status === 'new').length;

  const completionLabel =
    profileScore >= 80
      ? 'Your profile is in good shape. Keep response speed high to convert more leads.'
      : 'The fastest path to more business is improving profile completeness and response speed.';

  return {
    vendorId: dashboard?.vendorId ?? 0,
    vendorName: dashboard?.vendorName ?? 'My Business',
    vendorPhone: (dashboard as any)?.vendorPhone,
    vendorEmail: (dashboard as any)?.vendorEmail,
    vendorStatus: dashboard?.vendorStatus,
    vendorCity: dashboard?.vendorCity,
    completionLabel,
    metrics,
    profileScore,
    tokenBalance,
    responseTip: 'High-quality leads convert best when contacted in under 5 minutes.',
    insights: buildInsights(profileScore, packages.length, newLeads),
    leads,
    packages,
    packagePerformance,
    profileChecklist,
    walletHistory,
    services,
    serviceCategories: categories.map((c) => c.name),
    cities,
    packageStats: dashboard?.packageStats ?? {
      total: packages.length,
      active: packages.filter((p) => p.status === 'active').length,
      totalLeadsFromPackages: packagePerformance.leadsFromPackages,
      boostActive: packagePerformance.boostActive,
      topPackage: null,
    },
  };
}

// ─── Action Helpers (called from MyPanelShell) ────────────────────────────────

export async function getLocalitiesForCity(cityId: number) {
  try {
    const localities = (await locationsApi.getLocalities(cityId)) as unknown as Array<{
      id: number;
      name: string;
    }>;
    return Array.isArray(localities)
      ? localities.map((l) => ({ id: l.id, name: l.name, preferred: false }))
      : [];
  } catch {
    return [];
  }
}

export async function updateLeadStatus(leadId: number, status: string) {
  return vendorPanelApi.updateLeadStatus(leadId, status);
}

export async function unlockLead(leadId: number) {
  return vendorPanelApi.unlockLead(leadId);
}

export async function createPackage(data: Partial<PackageItem> & { price: number; title: string }) {
  return packagesApi.create(data);
}

export async function updatePackage(id: number, data: Partial<PackageItem>) {
  return packagesApi.update(id, data);
}

export async function deletePackage(id: number) {
  return packagesApi.remove(id);
}

export async function boostPackage(id: number) {
  return packagesApi.boost(id);
}

export async function createService(data: Omit<VendorServiceItem, 'id' | 'vendorId' | 'createdAt' | 'sortOrder'>) {
  return vendorServicesApi.create(data as any);
}

export async function updateService(id: number, data: Partial<VendorServiceItem>) {
  return vendorServicesApi.update(id, data as any);
}

export async function deleteService(id: number) {
  return vendorServicesApi.remove(id);
}

