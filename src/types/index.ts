export interface City {
  id: number;
  name: string;
  slug: string;
  state?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export interface Locality {
  id: number;
  name: string;
  slug: string;
  cityId: number;
  city?: City;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  /** SEO-friendly plural set by admin, e.g. 'photographers'. Used for /photographers-in-noida URLs. */
  seoPlural?: string;
  type: 'service' | 'event';
  children?: Category[];
  budgetAllocationPercent?: number;
  sortOrder?: number;
  isActive?: boolean;
}

export interface Vendor {
  id: number;
  businessName: string;
  slug: string;
  description?: string;
  logo?: string;
  portfolioImages?: string[];
  phone?: string;
  email?: string;
  city?: City;
  locality?: Locality;
  cityId: number;
  localityId?: number;
  minPrice?: number;
  maxPrice?: number;
  priceUnit?: string;
  rating: number;
  reviewCount: number;
  profileViews: number;
  profileScore: number;
  isFeatured: boolean;
  isVerified: boolean;
  categories?: Category[];
  yearsOfExperience?: number;
  teamSize?: number;
  availability?: Record<string, boolean>;
  plan?: 'free' | 'basic' | 'pro' | 'elite';
  status: 'pending' | 'active' | 'suspended';
  // Enriched fields added by the event plan generator
  matchScore?: number;
  priceEstimate?: number;
  reason?: string;
}

export type LeadStatus = 'new' | 'viewed' | 'contacted' | 'converted' | 'rejected';

export interface Lead {
  id: number;
  vendorId: number;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  requirement?: string;
  eventDate?: string;
  guestCount?: number;
  budget?: number;
  status: LeadStatus;
  qualityScore?: number;
  source?: string;
  packageId?: number;
  package?: VendorPackage;
  city?: City;
  locality?: Locality;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export interface VendorPackage {
  id: number;
  vendorId: number;
  vendor?: Pick<Vendor, 'id' | 'businessName' | 'slug' | 'rating'>;
  categoryId?: number;
  category?: Category;
  title: string;
  price: number;
  priceType: 'fixed' | 'per_person';
  description?: string;
  includes?: string[];
  cityId?: number;
  city?: City;
  localityIds?: number[];
  preferredLocationIds?: number[];
  boostScore: number;
  isFeatured: boolean;
  isBoosted: boolean;
  boostExpiresAt?: string;
  status: 'active' | 'inactive';
  leadsCount: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface PackageSearchResult {
  data: VendorPackage[];
  meta: { total: number; page: number; limit: number };
}

export interface VendorDashboard {
  vendorId: number;
  vendorName: string;
  vendorStatus: string;
  vendorCity?: string;
  profileScore: number;
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  tokenBalance: number;
  packageStats: {
    total: number;
    active: number;
    totalLeadsFromPackages: number;
    boostActive: boolean;
    topPackage: { id: number; name: string; leadsCount: number } | null;
  };
  metrics: Array<{
    label: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
    hint: string;
  }>;
}

export interface TokenTransaction {
  id: number;
  vendorId: number;
  type: 'credit' | 'debit';
  reason: string;
  amount: number;
  balanceAfter: number;
  note?: string;
  createdAt: string;
}

export interface SearchResult {
  data: Vendor[];
  meta: { total: number; page: number; limit: number; pages: number };
  parsedIntent?: {
    eventType?: string;
    serviceType?: string;
    budget?: number;
    guestCount?: number;
    keywords: string[];
  };
  resolvedLocation?: { city?: City; locality?: Locality };
  resolvedCategory?: Category;
}

export interface Event {
  id: number;
  title: string;
  slug: string;
  description?: string;
  image?: string;
  date: string;
  endDate?: string;
  venue?: string;
  city?: City;
  locality?: Locality;
  category?: Category;
  price?: number;
  isFree: boolean;
  isTrending: boolean;
  isFeatured: boolean;
  organizer?: string;
  attendeeCount?: number;
  tags?: string[];
}

export interface TrendingSearch {
  query: string;
  count: number;
  category?: string;
}

export type EventPostStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'expired';

export interface EventPost {
  id: number;
  vendorId: number;
  title: string;
  slug: string;
  description?: string;
  categorySlug?: string;
  citySlug?: string;
  localitySlug?: string;
  eventDate?: string;
  eventEndDate?: string;
  price?: number;
  priceUnit?: string;
  images: string[];
  fieldData?: Record<string, unknown>;
  metaTitle?: string;
  metaDescription?: string;
  status: EventPostStatus;
  rejectionReason?: string;
  isBoosted: boolean;
  boostedAt?: string;
  boostExpiresAt?: string;
  views: number;
  inquiries: number;
  tokenCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface TokenWallet {
  id: number;
  vendorId: number;
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface EventPlan {
  summary: {
    estimatedTotal: number;
    withinBudget: boolean;
    confidenceScore: number;
  };
  eventType: string;
  totalBudget: number;
  guestCount?: number;
  cityId: number;
  plan: Array<{
    category: string;
    budgetAllocation: number;
    allocatedBudget: number;
    vendors: Vendor[];
    data_missing?: boolean;
  }>;
}

// ─── AI Event Planning Engine types ──────────────────────────────────────────

export interface PackageService {
  category: string;
  vendorId: number;
  vendorName: string;
  vendorSlug: string;
  price: number;
  rating: number;
  fitScore: number;
  reason: string;
  logo?: string;
}

export interface CustomizationOption {
  category: string;
  alternativeVendors: Array<{
    vendorId: number;
    vendorName: string;
    price: number;
    rating: number;
    fitScore: number;
  }>;
}

export interface EventPackage {
  name: string;
  tag: 'Recommended' | 'Budget' | 'Premium';
  totalBudget: number;
  estimatedCost: number;
  pricePerGuest: number;
  savings: number;
  platformMargin: number;
  confidenceScore: number;
  services: PackageService[];
  customizationOptions: CustomizationOption[];
}

export interface TrendingPackage {
  name: string;
  tag: 'Trending';
  eventType: string;
  estimatedCost: number;
  pricePerGuest: number;
  popularityScore: number;
  servicesSummary: string[];
}

export interface TopPackage {
  name: string;
  tag: 'Recommended' | 'Budget' | 'Premium';
  eventType: string;
  cityId: number;
  estimatedCost: number;
  pricePerGuest: number;
  highlight: string;
}

export interface ComparePackages {
  categories: string[];
  comparison: Array<{
    packageName: string;
    tag: string;
    totalCost: number;
    pricePerGuest: number;
    ratingScore: number;
    keyDifferences: string[];
  }>;
}

export interface EventPlanV2 {
  recommended: EventPackage;
  alternatives: EventPackage[];
  breakdown: Record<string, number>;
  topPackages: TopPackage[];
  trendingPackages: TrendingPackage[];
  comparePackages: ComparePackages;
  meta: {
    confidenceScore: number;
    generatedAt: string;
    cityId: number;
    eventType: string;
    totalBudget: number;
    guestCount?: number;
  };
}
