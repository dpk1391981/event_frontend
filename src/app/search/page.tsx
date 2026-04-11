'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { searchApi, locationsApi, categoriesApi, packagesApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { Vendor, City, Category, Locality, SearchResult, VendorPackage } from '@/types';
import VendorListCard from '@/components/vendor/VendorListCard';
import VendorCard from '@/components/vendor/VendorCard';
import PackageCard from '@/components/packages/PackageCard';
import GlobalSearch from '@/components/search/GlobalSearch';
import LeadModal from '@/components/lead/LeadModal';

type ViewMode = 'list' | 'grid';

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: '🌅 Morning', afternoon: '☀️ Afternoon', evening: '🌆 Evening', full: '📅 Full Day',
};

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

function formatPrice(price: number) {
  if (price >= 100000) return `₹${(price / 100000).toFixed(price % 100000 === 0 ? 0 : 1)}L`;
  if (price >= 1000)   return `₹${Math.round(price / 1000)}K`;
  return `₹${price}`;
}

/** True when query is a generic meta-search not about specific vendor/service content */
function isGenericPackageQuery(q: string) {
  const lower = q.toLowerCase().trim();
  return (
    lower === '' ||
    lower.includes('packages near') ||
    lower === 'packages' ||
    lower === 'all packages' ||
    lower.startsWith('packages in') ||
    lower.startsWith('best packages')
  );
}

/* ─── Featured packages auto-scroll carousel ────────────────────────────────── */

function PackageCarousel({
  title, badge, packages, onBook,
}: {
  title: string;
  badge?: string;
  packages: VendorPackage[];
  onBook: (pkg: VendorPackage) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft]   = useState(false);
  const [canRight, setCanRight] = useState(false);
  const pausedRef = useRef(false);

  const update = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    return () => el.removeEventListener('scroll', update);
  }, [packages]);

  // Auto-scroll: advance one card every 3 s, loop back to start
  useEffect(() => {
    if (packages.length <= 1) return;
    const CARD_W = 266; // 250px card + 16px gap
    const interval = setInterval(() => {
      if (pausedRef.current) return;
      const el = scrollRef.current;
      if (!el) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 8) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: CARD_W, behavior: 'smooth' });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [packages.length]);

  const scroll = (dir: 'l' | 'r') => {
    pausedRef.current = true;
    setTimeout(() => { pausedRef.current = false; }, 8000); // resume after 8 s
    scrollRef.current?.scrollBy({ left: dir === 'r' ? 540 : -540, behavior: 'smooth' });
  };

  if (!packages.length) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {badge && (
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
          <h3 className="font-extrabold text-gray-900 text-base">{title}</h3>
          <span className="text-xs text-gray-400 font-medium">{packages.length}</span>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => scroll('l')} disabled={!canLeft}
            className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-red-300 hover:text-red-600 disabled:opacity-30 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll('r')} disabled={!canRight}
            className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-red-300 hover:text-red-600 disabled:opacity-30 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative"
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
      >
        {canLeft  && <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-gray-50 to-transparent z-10" />}
        {canRight && <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-50 to-transparent z-10" />}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1"
        >
          {packages.map((pkg) => (
            <div key={pkg.id} className="flex-none w-[250px] snap-start">
              <PackageCard pkg={pkg} onBook={onBook} compact />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Loading skeletons ─────────────────────────────────────────────────────── */

function PackageGridSkeleton() {
  return (
    <>
      {/* Mobile skeleton: 2-col grid */}
      <div className="grid grid-cols-2 gap-3 lg:hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-1/3" />
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
            <div className="h-9 bg-gray-100 rounded-xl mt-2" />
          </div>
        ))}
      </div>
      {/* Desktop skeleton: list */}
      <div className="hidden lg:flex flex-col gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 h-16 animate-pulse flex items-center px-5 gap-4">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="flex-1 h-3 bg-gray-100 rounded" />
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-8 bg-gray-100 rounded-lg w-28" />
          </div>
        ))}
      </div>
    </>
  );
}

function VendorListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex h-44 animate-pulse">
          <div className="w-52 shrink-0 bg-gray-200" />
          <div className="flex-1 p-5 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-2/3" />
            <div className="h-3 bg-gray-100 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
            <div className="flex gap-2 mt-auto pt-3">
              <div className="h-9 bg-gray-200 rounded-xl w-28" />
              <div className="h-9 bg-gray-200 rounded-xl w-36" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Filter panel ──────────────────────────────────────────────────────────── */

type Filters = {
  cityId: number;
  categoryId: number;
  localityId: number;
  maxBudget: string;
  minBudget: string;
  tag: string;
  minRating: string;
  sortBy: string;
  page: number;
  eventDate: string;
  eventTime: string;
};

function FilterPanel({
  filters, cities, categories, localities, activeFilterCount, updateFilter, resetFilters,
}: {
  filters: Filters;
  cities: City[];
  categories: Category[];
  localities: Locality[];
  activeFilterCount: number;
  updateFilter: (k: string, v: unknown) => void;
  resetFilters: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-gray-900 text-sm">Filters</h3>
        {activeFilterCount > 0 && (
          <button onClick={resetFilters} className="text-xs text-red-600 hover:text-red-700 font-bold">
            Clear all ({activeFilterCount})
          </button>
        )}
      </div>

      {/* City */}
      <div>
        <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">City</label>
        <select
          value={filters.cityId}
          onChange={(e) => updateFilter('cityId', Number(e.target.value))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 bg-white"
        >
          <option value={0}>All Cities</option>
          {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Locality — only shown when city selected */}
      {filters.cityId > 0 && localities.length > 0 && (
        <div>
          <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">Locality</label>
          <select
            value={filters.localityId}
            onChange={(e) => updateFilter('localityId', Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 bg-white"
          >
            <option value={0}>All Areas</option>
            {localities.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      )}

      {/* Category */}
      <div>
        <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">Category</label>
        <select
          value={filters.categoryId}
          onChange={(e) => updateFilter('categoryId', Number(e.target.value))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 bg-white"
        >
          <option value={0}>All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Package tier */}
      <div>
        <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">Package Tier</label>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { val: '', label: 'All' },
            { val: 'budget',   label: '💚 Budget'   },
            { val: 'standard', label: '💙 Standard' },
            { val: 'premium',  label: '💜 Premium'  },
            { val: 'luxury',   label: '🏅 Luxury'   },
          ].map((t) => (
            <button
              key={t.val}
              onClick={() => updateFilter('tag', t.val)}
              className={`text-[11px] font-semibold px-2 py-1.5 rounded-lg border transition ${
                filters.tag === t.val
                  ? 'bg-red-600 text-white border-red-600'
                  : 'border-gray-200 text-gray-600 hover:border-red-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Budget range */}
      <div>
        <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">Max Budget (₹)</label>
        <input
          type="number" placeholder="e.g. 50000"
          value={filters.maxBudget}
          onChange={(e) => updateFilter('maxBudget', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {['25000', '50000', '100000', '200000', '500000'].map((v) => (
            <button
              key={v}
              onClick={() => updateFilter('maxBudget', filters.maxBudget === v ? '' : v)}
              className={`text-[10px] font-semibold px-2 py-1 rounded-full border transition ${
                filters.maxBudget === v ? 'bg-red-100 text-red-700 border-red-300' : 'border-gray-200 text-gray-500 hover:border-red-200'
              }`}
            >
              ₹{Number(v) >= 100000 ? `${Number(v) / 100000}L` : `${Number(v) / 1000}K`}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">Sort By</label>
        <select
          value={filters.sortBy}
          onChange={(e) => updateFilter('sortBy', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 bg-white"
        >
          <option value="relevance">Most Relevant</option>
          <option value="popular">Most Popular</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="savings">Best Savings %</option>
        </select>
      </div>

      {/* Event date */}
      <div>
        <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">Event Date</label>
        <input
          type="date"
          value={filters.eventDate}
          min={new Date().toISOString().substring(0, 10)}
          onChange={(e) => updateFilter('eventDate', e.target.value)}
          className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition ${
            filters.eventDate ? 'border-red-300 text-red-700 bg-red-50' : 'border-gray-200 text-gray-600'
          } focus:ring-2 focus:ring-red-100`}
        />
        {filters.eventDate && (
          <div className="mt-2">
            <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5 block">Time Slot</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { value: '', label: 'Any' },
                { value: 'morning', label: '🌅 Morning' },
                { value: 'afternoon', label: '☀️ Afternoon' },
                { value: 'evening', label: '🌆 Evening' },
                { value: 'full', label: '📅 Full Day' },
              ].map((slot) => (
                <button
                  key={slot.value}
                  onClick={() => updateFilter('eventTime', slot.value)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition ${
                    filters.eventTime === slot.value
                      ? 'bg-red-600 text-white border-red-600'
                      : 'border-gray-200 text-gray-600 hover:border-red-300'
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Search Page ──────────────────────────────────────────────────────── */

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query   = searchParams.get('q') || '';
  const isNlp   = searchParams.get('nlp') === '1';
  const isPackagesMode = !query || isGenericPackageQuery(query);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeTab, setActiveTab] = useState<'packages' | 'vendors'>(isPackagesMode ? 'packages' : 'vendors');

  const [result, setResult]           = useState<SearchResult | null>(null);
  const [loading, setLoading]         = useState(true);
  const [cities, setCities]           = useState<City[]>([]);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [localities, setLocalities]   = useState<Locality[]>([]);

  const [selectedVendor, setSelectedVendor]   = useState<Vendor | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<VendorPackage | null>(null);
  const [filtersOpen, setFiltersOpen]         = useState(false);

  // Package state
  const [allPackages, setAllPackages]         = useState<VendorPackage[]>([]);
  const [featuredPkgs, setFeaturedPkgs]       = useState<VendorPackage[]>([]);
  const [popularPkgs, setPopularPkgs]         = useState<VendorPackage[]>([]);
  const [pkgLoading, setPkgLoading]           = useState(true);
  const [pkgPage, setPkgPage]                 = useState(1);
  const [pkgTotal, setPkgTotal]               = useState(0);
  const PKG_LIMIT = 12;

  const storeCity     = useAppStore((s) => s.selectedCity);
  const storeLocality = useAppStore((s) => s.selectedLocality);

  const [filters, setFilters] = useState<Filters>({
    cityId:     searchParams.get('cityId') ? Number(searchParams.get('cityId')) : (storeCity?.id ?? 0),
    categoryId: 0,
    localityId: storeLocality?.id ?? 0,
    maxBudget:  searchParams.get('maxBudget') || '',
    minBudget:  '',
    tag:        '',
    minRating:  '',
    sortBy:     'relevance',
    page:       1,
    eventDate:  searchParams.get('eventDate') || '',
    eventTime:  searchParams.get('eventTime') || '',
  });

  // Fetch support lists
  useEffect(() => {
    locationsApi.getCities().then((d: unknown) => setCities(d as City[])).catch(() => {});
    categoriesApi.getAll('service').then((d: unknown) => {
      const list = Array.isArray(d) ? d : (d as any)?.data ?? [];
      setCategories(list as Category[]);
    }).catch(() => {});
  }, []);

  // Fetch localities when city changes
  useEffect(() => {
    if (filters.cityId > 0) {
      locationsApi.getLocalities(filters.cityId)
        .then((d: unknown) => setLocalities(Array.isArray(d) ? d as Locality[] : []))
        .catch(() => setLocalities([]));
    } else {
      setLocalities([]);
      setFilters((f) => ({ ...f, localityId: 0 }));
    }
  }, [filters.cityId]);

  // Vendor search (NLP or normal)
  const doVendorSearch = useCallback(async () => {
    setLoading(true);
    try {
      let data: SearchResult;
      if (isNlp && query) {
        data = await searchApi.nlpSearch(query, filters.cityId || undefined, filters.eventDate || undefined, filters.eventTime || undefined) as unknown as SearchResult;
      } else {
        data = await searchApi.search({
          q: (!isPackagesMode && query) ? query : undefined,
          cityId: filters.cityId || undefined,
          categoryId: filters.categoryId || undefined,
          maxBudget: filters.maxBudget || undefined,
          rating: filters.minRating || undefined,
          sortBy: filters.sortBy,
          page: filters.page,
          eventDate: filters.eventDate || undefined,
          eventTime: filters.eventTime || undefined,
        }) as unknown as SearchResult;
      }
      setResult(data);
    } catch { setResult(null); } finally { setLoading(false); }
  }, [query, isNlp, isPackagesMode, filters]);

  // Package search — never pass generic queries, only real content filters
  const doPackageSearch = useCallback(async () => {
    setPkgLoading(true);
    try {
      const contentQuery = isNlp || isPackagesMode ? undefined : (query || undefined);

      // Sort mapping
      const sortToParams: Record<string, Record<string, unknown>> = {
        popular:    { sortBy: 'leads' },
        price_low:  { minBudget: filters.minBudget || undefined, maxBudget: filters.maxBudget || undefined },
        price_high: { maxBudget: filters.maxBudget || undefined },
        savings:    { sortBy: 'savings' },
      };

      const res = await packagesApi.search({
        q: contentQuery,
        cityId:     filters.cityId     || undefined,
        localityId: filters.localityId || undefined,
        categoryId: filters.categoryId || undefined,
        maxBudget:  filters.maxBudget  || undefined,
        minBudget:  filters.minBudget  || undefined,
        tag:        filters.tag        || undefined,
        eventDate:  filters.eventDate  || undefined,
        page:       pkgPage,
        limit:      PKG_LIMIT,
        ...(sortToParams[filters.sortBy] ?? {}),
      }) as unknown as { data: VendorPackage[]; meta: { total: number; page: number; limit: number } };

      const packages = res.data ?? [];
      setAllPackages(packages);
      setPkgTotal(res.meta?.total ?? 0);
    } catch { setAllPackages([]); setPkgTotal(0); }
    finally { setPkgLoading(false); }
  }, [query, isNlp, isPackagesMode, filters, pkgPage]);

  // Featured + popular showcase (city-aware)
  const doShowcaseSearch = useCallback(async () => {
    const cityId = filters.cityId || undefined;
    try {
      const [feat, trend] = await Promise.all([
        packagesApi.getFeatured(cityId, 10) as unknown as VendorPackage[],
        packagesApi.getTrending(cityId, 10) as unknown as VendorPackage[],
      ]);
      setFeaturedPkgs(Array.isArray(feat) ? feat : (feat as any)?.data ?? []);
      setPopularPkgs(Array.isArray(trend) ? trend : (trend as any)?.data ?? []);
    } catch { /* silent */ }
  }, [filters.cityId]);

  useEffect(() => { doVendorSearch(); }, [doVendorSearch]);
  useEffect(() => { doPackageSearch(); }, [doPackageSearch]);
  useEffect(() => { doShowcaseSearch(); }, [doShowcaseSearch]);

  const updateFilter = (key: string, value: unknown) =>
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  const resetFilters = () => setFilters((f) => ({
    ...f, categoryId: 0, localityId: 0, maxBudget: '', minBudget: '',
    tag: '', minRating: '', sortBy: 'relevance', page: 1, eventDate: '', eventTime: '',
  }));

  const activeFilterCount = [
    filters.categoryId !== 0,
    filters.localityId !== 0,
    filters.maxBudget !== '',
    filters.tag !== '',
    filters.minRating !== '',
    filters.sortBy !== 'relevance',
    filters.eventDate !== '',
  ].filter(Boolean).length;

  const cityLabel     = cities.find((c) => c.id === filters.cityId)?.name;
  const localityLabel = localities.find((l) => l.id === filters.localityId)?.name;

  const contextLabel = localityLabel
    ? `${localityLabel}, ${cityLabel}`
    : cityLabel ?? 'All Cities';

  const handleBook = (pkg: VendorPackage) => {
    setSelectedPackage(pkg);
    setSelectedVendor(pkg.vendor as any);
  };

  // Deduplicate main grid — exclude packages already shown in carousels
  const showcaseIds = new Set([
    ...featuredPkgs.map((p) => p.id),
    ...popularPkgs.map((p) => p.id),
  ]);
  const gridPackages = allPackages.filter((p) => !showcaseIds.has(p.id));

  /* Quick-sort chips for packages tab */
  const SORT_CHIPS = [
    { val: 'relevance', label: 'Top Picks'      },
    { val: 'popular',   label: 'Most Popular'   },
    { val: 'price_low', label: 'Price ↑'        },
    { val: 'price_high',label: 'Price ↓'        },
    { val: 'savings',   label: 'Best Savings'   },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky search bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm py-3 px-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto">
          <GlobalSearch compact />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5">

        {/* AI intent banner */}
        {result?.parsedIntent && query && !isPackagesMode && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4 mb-5">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-red-700 font-bold text-sm">🤖 AI understood:</span>
              {result.parsedIntent.eventType && <Tag c="red"    label={`💍 ${result.parsedIntent.eventType}`} />}
              {result.parsedIntent.budget     && <Tag c="green"  label={`💰 ₹${(result.parsedIntent.budget / 1000).toFixed(0)}K budget`} />}
              {result.parsedIntent.guestCount && <Tag c="blue"   label={`👥 ${result.parsedIntent.guestCount} guests`} />}
              {result.resolvedLocation?.city  && <Tag c="orange" label={`📍 ${result.resolvedLocation.city.name}`} />}
              {result.resolvedCategory        && <Tag c="purple" label={`🏷️ ${result.resolvedCategory.name}`} />}
            </div>
          </div>
        )}

        {/* Date availability banner */}
        {filters.eventDate && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-3 mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap text-sm">
              <span className="text-green-700 font-bold">📅 Available on</span>
              <span className="bg-green-100 text-green-800 font-bold px-3 py-0.5 rounded-full">
                {new Date(filters.eventDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              {filters.eventTime && (
                <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {TIME_SLOT_LABELS[filters.eventTime]}
                </span>
              )}
            </div>
            <button onClick={() => setFilters((f) => ({ ...f, eventDate: '', eventTime: '' }))} className="text-green-500 hover:text-green-700 text-xs font-bold shrink-0">Clear ×</button>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-5 w-full sm:w-fit overflow-x-auto scrollbar-hide">
          {([
            { key: 'packages', label: 'Packages', icon: '📦', count: pkgTotal },
            { key: 'vendors',  label: 'Vendors',  icon: '✦',  count: result?.meta?.total },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.key ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-6">
          {/* ── Sidebar ── */}
          <aside className="hidden lg:block w-60 xl:w-64 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20">
              <FilterPanel
                filters={filters} cities={cities} categories={categories} localities={localities}
                activeFilterCount={activeFilterCount}
                updateFilter={updateFilter} resetFilters={resetFilters}
              />
            </div>
          </aside>

          {/* ── Main column ── */}
          <div className="flex-1 min-w-0">
            {/* Results bar */}
            <div className="flex items-center justify-between mb-4 gap-2">
              <div className="min-w-0">
                <p className="text-sm text-gray-500 truncate">
                  {activeTab === 'packages' ? (
                    pkgLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin inline-block" />
                        Finding packages…
                      </span>
                    ) : (
                      <>
                        <strong className="text-gray-900 text-base">{pkgTotal}</strong>
                        <span> packages in </span>
                        <strong className="text-gray-800">{contextLabel}</strong>
                      </>
                    )
                  ) : loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin inline-block" />
                      Searching vendors…
                    </span>
                  ) : (
                    <>
                      <strong className="text-gray-900 text-base">{result?.meta?.total ?? 0}</strong>
                      <span> vendors found</span>
                      {query && !isPackagesMode && <span> for "<span className="text-gray-700 font-medium">{query}</span>"</span>}
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activeTab === 'vendors' && (
                  <div className="hidden sm:flex items-center bg-white border border-gray-200 rounded-xl p-1 gap-1">
                    <button onClick={() => setViewMode('list')} title="List"
                      className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <button onClick={() => setViewMode('grid')} title="Grid"
                      className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    </button>
                  </div>
                )}
                <button onClick={() => setFiltersOpen((o) => !o)}
                  className="lg:hidden flex items-center gap-1.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl px-3 py-2 hover:border-red-300 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
                  Filters {activeFilterCount > 0 && <span className="bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{activeFilterCount}</span>}
                </button>
              </div>
            </div>

            {/* Mobile filters */}
            {filtersOpen && (
              <div className="lg:hidden bg-white rounded-2xl border border-gray-100 p-5 mb-4 shadow-sm">
                <FilterPanel
                  filters={filters} cities={cities} categories={categories} localities={localities}
                  activeFilterCount={activeFilterCount}
                  updateFilter={updateFilter} resetFilters={resetFilters}
                />
              </div>
            )}

            {/* ═══ PACKAGES TAB ═══ */}
            {activeTab === 'packages' && (
              <div>
                {/* Sort chips */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-5">
                  {SORT_CHIPS.map((chip) => (
                    <button
                      key={chip.val}
                      onClick={() => updateFilter('sortBy', chip.val)}
                      className={`flex-none text-xs font-bold px-4 py-2 rounded-full border transition ${
                        filters.sortBy === chip.val
                          ? 'bg-red-600 text-white border-red-600 shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Featured packages carousel */}
                {featuredPkgs.length > 0 && (
                  <PackageCarousel
                    title={`Top Packages${cityLabel ? ` in ${cityLabel}` : ' — All Cities'}`}
                    badge="⭐ Featured"
                    packages={featuredPkgs}
                    onBook={handleBook}
                  />
                )}

                {/* Popular / trending carousel */}
                {popularPkgs.length > 0 && (
                  <PackageCarousel
                    title="Popular Packages"
                    badge="🔥 Trending"
                    packages={popularPkgs}
                    onBook={handleBook}
                  />
                )}

                {/* Divider */}
                {(featuredPkgs.length > 0 || popularPkgs.length > 0) && (
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 border-t border-gray-200" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">All Packages</span>
                    <div className="flex-1 border-t border-gray-200" />
                  </div>
                )}

                {/* Main listing — list on desktop, 2-col grid on mobile */}
                {pkgLoading ? (
                  <PackageGridSkeleton />
                ) : gridPackages.length > 0 ? (
                  <>
                    {/* Mobile: 2-column grid */}
                    <div className="grid grid-cols-2 gap-3 lg:hidden">
                      {gridPackages.map((pkg) => (
                        <PackageCard key={pkg.id} pkg={pkg} onBook={handleBook} />
                      ))}
                    </div>
                    {/* Desktop: list view */}
                    <div className="hidden lg:flex flex-col gap-3">
                      {gridPackages.map((pkg) => (
                        <PackageCard key={pkg.id} pkg={pkg} onBook={handleBook} listView />
                      ))}
                    </div>

                    {/* Pagination */}
                    {pkgTotal > PKG_LIMIT && (
                      <div className="mt-8 flex justify-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                        <button
                          onClick={() => { setPkgPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          disabled={pkgPage === 1}
                          className="w-10 h-10 rounded-full border border-gray-200 text-gray-600 hover:border-red-400 disabled:opacity-40 transition flex items-center justify-center font-bold"
                        >‹</button>
                        {[...Array(Math.min(Math.ceil(pkgTotal / PKG_LIMIT), 10))].map((_, i) => (
                          <button key={i} onClick={() => { setPkgPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className={`w-10 h-10 rounded-full text-sm font-bold transition ${pkgPage === i + 1 ? 'bg-red-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600'}`}>
                            {i + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => { setPkgPage((p) => Math.min(Math.ceil(pkgTotal / PKG_LIMIT), p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          disabled={pkgPage >= Math.ceil(pkgTotal / PKG_LIMIT)}
                          className="w-10 h-10 rounded-full border border-gray-200 text-gray-600 hover:border-red-400 disabled:opacity-40 transition flex items-center justify-center font-bold"
                        >›</button>
                      </div>
                    )}
                  </>
                ) : (
                  !pkgLoading && gridPackages.length === 0 && featuredPkgs.length === 0 && popularPkgs.length === 0 && (
                    <div className="text-center py-20">
                      <div className="text-6xl mb-4">📦</div>
                      <h3 className="text-lg font-extrabold text-gray-800 mb-2">No packages found</h3>
                      <p className="text-gray-500 text-sm mb-5 max-w-sm mx-auto">
                        Try removing some filters, or browse all cities.
                      </p>
                      <div className="flex gap-3 justify-center">
                        <button onClick={resetFilters}
                          className="bg-red-600 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-red-700 transition">
                          Clear Filters
                        </button>
                        <button onClick={() => setActiveTab('vendors')}
                          className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-full text-sm font-semibold hover:border-red-300 transition">
                          Browse Vendors
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* ═══ VENDORS TAB ═══ */}
            {activeTab === 'vendors' && (
              <>
                {loading ? (
                  <VendorListSkeleton />
                ) : result?.data?.length ? (
                  <>
                    <div className="sm:hidden grid grid-cols-2 gap-3">
                      {result.data.map((v) => <VendorCard key={v.id} vendor={v} onGetQuote={setSelectedVendor} />)}
                    </div>
                    {viewMode === 'list' ? (
                      <div className="hidden sm:flex flex-col gap-3">
                        {result.data.map((v, idx) => (
                          <VendorListCard key={v.id} vendor={v} rank={idx + 1 + (filters.page - 1) * 12} onGetQuote={setSelectedVendor} />
                        ))}
                      </div>
                    ) : (
                      <div className="hidden sm:grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {result.data.map((v) => <VendorCard key={v.id} vendor={v} onGetQuote={setSelectedVendor} />)}
                      </div>
                    )}
                    {result.meta.pages > 1 && (
                      <div className="mt-8 flex justify-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                        <button onClick={() => { updateFilter('page', Math.max(1, filters.page - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={filters.page === 1}
                          className="w-10 h-10 rounded-full border border-gray-200 text-gray-600 hover:border-red-400 disabled:opacity-40 transition flex items-center justify-center">‹</button>
                        {[...Array(Math.min(result.meta.pages, 10))].map((_, i) => (
                          <button key={i} onClick={() => { updateFilter('page', i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className={`w-10 h-10 rounded-full text-sm font-bold transition ${filters.page === i + 1 ? 'bg-red-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600'}`}>
                            {i + 1}
                          </button>
                        ))}
                        <button onClick={() => { updateFilter('page', Math.min(result.meta.pages, filters.page + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={filters.page === result.meta.pages}
                          className="w-10 h-10 rounded-full border border-gray-200 text-gray-600 hover:border-red-400 disabled:opacity-40 transition flex items-center justify-center">›</button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-24">
                    <div className="text-7xl mb-5">🔍</div>
                    <h3 className="text-xl font-extrabold text-gray-800 mb-2">No vendors found</h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto text-sm">Try removing filters or different keywords</p>
                    <button onClick={resetFilters}
                      className="bg-red-600 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-red-700 transition">
                      Clear Filters
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {selectedVendor && (
        <LeadModal
          vendor={selectedVendor}
          onClose={() => { setSelectedVendor(null); setSelectedPackage(null); }}
          searchQuery={query}
          budget={result?.parsedIntent?.budget}
          guestCount={result?.parsedIntent?.guestCount}
          eventDate={filters.eventDate || undefined}
          selectedPackage={selectedPackage ?? undefined}
        />
      )}
    </div>
  );
}

function Tag({ c, label }: { c: string; label: string }) {
  const colors: Record<string, string> = {
    red: 'bg-red-100 text-red-800', green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800', orange: 'bg-orange-100 text-orange-800',
    purple: 'bg-purple-100 text-purple-800',
  };
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[c]}`}>{label}</span>;
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64 gap-3 text-gray-500">
        <span className="w-5 h-5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  );
}
