'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { searchApi, locationsApi, categoriesApi, packagesApi } from '@/lib/api';
import { Vendor, City, Category, SearchResult, VendorPackage } from '@/types';
import VendorListCard from '@/components/vendor/VendorListCard';
import VendorCard from '@/components/vendor/VendorCard';
import PackageCard from '@/components/packages/PackageCard';
import GlobalSearch from '@/components/search/GlobalSearch';
import LeadModal from '@/components/lead/LeadModal';

type ViewMode = 'list' | 'grid';

/* Loading skeleton — responsive: grid on mobile, list on desktop */
function ListSkeleton() {
  return (
    <>
      {/* Mobile: 2-col grid skeleton */}
      <div className="sm:hidden grid grid-cols-2 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="h-36 skeleton" />
            <div className="p-3 space-y-2">
              <div className="h-3.5 skeleton rounded w-3/4" />
              <div className="h-3 skeleton rounded w-1/2" />
              <div className="h-3 skeleton rounded w-2/3" />
              <div className="h-8 skeleton rounded-xl mt-2" />
            </div>
          </div>
        ))}
      </div>
      {/* Desktop: list skeleton */}
      <div className="hidden sm:block space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex h-44">
            <div className="w-52 shrink-0 skeleton" />
            <div className="flex-1 p-5 space-y-3">
              <div className="h-5 skeleton rounded w-2/3" />
              <div className="h-3.5 skeleton rounded w-1/3" />
              <div className="h-3.5 skeleton rounded w-1/2" />
              <div className="h-3 skeleton rounded w-3/4 mt-1" />
              <div className="flex gap-2 mt-auto pt-3">
                <div className="h-9 skeleton rounded-xl w-28" />
                <div className="h-9 skeleton rounded-xl w-36" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: '🌅 Morning', afternoon: '☀️ Afternoon', evening: '🌆 Evening', full: '📅 Full Day',
};

function FilterPanel({
  filters,
  cities,
  categories,
  activeFilterCount,
  updateFilter,
  setFilters,
}: {
  filters: { cityId: number; categoryId: number; maxBudget: string; minRating: string; sortBy: string; page: number; eventDate: string; eventTime: string };
  cities: City[];
  categories: Category[];
  activeFilterCount: number;
  updateFilter: (k: string, v: unknown) => void;
  setFilters: (f: { cityId: number; categoryId: number; maxBudget: string; minRating: string; sortBy: string; page: number; eventDate: string; eventTime: string }) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-gray-900 text-sm">Filters</h3>
        {activeFilterCount > 0 && (
          <button
            onClick={() => setFilters({ cityId: 0, categoryId: 0, maxBudget: '', minRating: '', sortBy: 'relevance', page: 1, eventDate: '', eventTime: '' })}
            className="text-xs text-red-600 hover:text-red-700 font-bold"
          >
            Clear all ({activeFilterCount})
          </button>
        )}
      </div>

      {[
        { label: 'City', key: 'cityId', type: 'select', options: [{ id: 0, name: 'All Cities' }, ...cities.map(c => ({ id: c.id, name: c.name }))] },
        { label: 'Category', key: 'categoryId', type: 'select', options: [{ id: 0, name: 'All Categories' }, ...categories.map(c => ({ id: c.id, name: c.name }))] },
        { label: 'Sort By', key: 'sortBy', type: 'select', options: [
          { id: 'relevance', name: 'Most Relevant' },
          { id: 'rating', name: 'Top Rated' },
          { id: 'price_low', name: 'Price: Low to High' },
          { id: 'price_high', name: 'Price: High to Low' },
        ]},
      ].map((f) => (
        <div key={f.key}>
          <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">{f.label}</label>
          <select
            value={f.key === 'sortBy' ? filters.sortBy : f.key === 'cityId' ? filters.cityId : filters.categoryId}
            onChange={(e) => updateFilter(f.key, f.key === 'sortBy' ? e.target.value : Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 bg-white appearance-none"
          >
            {f.options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
      ))}

      <div>
        <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">Max Budget (₹)</label>
        <input
          type="number"
          placeholder="e.g. 50000"
          value={filters.maxBudget}
          onChange={(e) => updateFilter('maxBudget', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {['25000', '50000', '100000', '200000'].map((v) => (
            <button
              key={v}
              onClick={() => updateFilter('maxBudget', filters.maxBudget === v ? '' : v)}
              className={`text-[10px] font-semibold px-2 py-1 rounded-full border transition ${
                filters.maxBudget === v ? 'bg-red-100 text-red-700 border-red-300' : 'border-gray-200 text-gray-500 hover:border-red-200'
              }`}
            >
              ₹{Number(v) >= 100000 ? `${Number(v)/100000}L` : `${Number(v)/1000}K`}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">Min Rating</label>
        <div className="space-y-2">
          {[{ val: '', label: 'Any Rating' }, { val: '4', label: '4★ & above' }, { val: '4.5', label: '4.5★ & above' }].map((opt) => (
            <label key={opt.val} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="minRating" value={opt.val}
                checked={filters.minRating === opt.val}
                onChange={() => updateFilter('minRating', opt.val)}
                className="accent-red-600" />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability filter */}
      <div>
        <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">📅 Event Date</label>
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
            <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5 block">⏰ Time Slot</label>
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

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = searchParams.get('q') || '';
  const isNlp = searchParams.get('nlp') === '1';
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<VendorPackage | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Package results
  const [packages, setPackages] = useState<VendorPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packagesMeta, setPackagesMeta] = useState({ total: 0, page: 1, limit: 12 });

  const [activeTab, setActiveTab] = useState<'packages' | 'recommended' | 'rated' | 'price'>('packages');

  const [filters, setFilters] = useState({
    cityId: searchParams.get('cityId') ? Number(searchParams.get('cityId')) : 0,
    categoryId: 0,
    maxBudget: searchParams.get('maxBudget') || '',
    minRating: '',
    sortBy: 'relevance',
    page: 1,
    eventDate: searchParams.get('eventDate') || '',
    eventTime: searchParams.get('eventTime') || '',
  });

  useEffect(() => {
    locationsApi.getCities().then((d: unknown) => setCities(d as City[])).catch(() => {});
    categoriesApi.getAll().then((d: unknown) => setCategories(d as Category[])).catch(() => {});
  }, []);

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      let data: SearchResult;
      if (query && isNlp) {
        data = await searchApi.nlpSearch(
          query,
          filters.cityId || undefined,
          filters.eventDate || undefined,
          filters.eventTime || undefined,
        ) as unknown as SearchResult;
      } else {
        data = await searchApi.search({
          q: query,
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
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [query, isNlp, filters]);

  const doPackageSearch = useCallback(async () => {
    setPackagesLoading(true);
    try {
      const res = await packagesApi.search({
        q: query || undefined,
        cityId: filters.cityId || undefined,
        categoryId: filters.categoryId || undefined,
        maxBudget: filters.maxBudget || undefined,
        eventDate: filters.eventDate || undefined,
        page: packagesMeta.page,
        limit: 12,
      }) as unknown as { data: VendorPackage[]; meta: { total: number; page: number; limit: number } };
      setPackages(res.data ?? []);
      setPackagesMeta(res.meta ?? { total: 0, page: 1, limit: 12 });
    } catch {
      setPackages([]);
    } finally {
      setPackagesLoading(false);
    }
  }, [query, filters.cityId, filters.categoryId, filters.maxBudget, filters.eventDate, packagesMeta.page]);

  useEffect(() => { doSearch(); }, [doSearch]);
  useEffect(() => { doPackageSearch(); }, [doPackageSearch]);

  const updateFilter = (key: string, value: unknown) =>
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  const activeFilterCount = [
    filters.cityId !== 0,
    filters.categoryId !== 0,
    filters.maxBudget !== '',
    filters.minRating !== '',
    filters.sortBy !== 'relevance',
    filters.eventDate !== '',
  ].filter(Boolean).length;

  const handleSearch = (q: string) => router.push(`/search?q=${encodeURIComponent(q)}&nlp=1`);

  const handleTabChange = (tab: 'packages' | 'recommended' | 'rated' | 'price') => {
    setActiveTab(tab);
    if (tab !== 'packages') {
      const sortMap = { recommended: 'relevance', rated: 'rating', price: 'price_low' } as const;
      setFilters((prev) => ({ ...prev, sortBy: sortMap[tab as keyof typeof sortMap], page: 1 }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky search bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm py-3 px-4">
        <div className="max-w-7xl mx-auto">
          <GlobalSearch compact />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Plan nudge — shown when no specific plan context */}
        {!result?.parsedIntent?.budget && !query && (
          <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-2xl p-4 mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-extrabold text-sm">Not sure where to start?</p>
              <p className="text-red-200 text-xs mt-0.5">Get a complete vendor plan with budget breakdown in 2 minutes.</p>
            </div>
            <a
              href="/plan"
              className="shrink-0 bg-white text-red-700 font-extrabold text-xs px-4 py-2.5 rounded-xl hover:bg-red-50 transition whitespace-nowrap"
            >
              Get My Plan →
            </a>
          </div>
        )}

        {/* AI Intent banner */}
        {result?.parsedIntent && query && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4 mb-5">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-red-700 font-bold text-sm flex items-center gap-1.5">🤖 AI understood:</span>
              {result.parsedIntent.eventType && <Tag c="red" label={`💍 ${result.parsedIntent.eventType}`} />}
              {result.parsedIntent.budget && <Tag c="green" label={`💰 ₹${(result.parsedIntent.budget/1000).toFixed(0)}K budget`} />}
              {result.parsedIntent.guestCount && <Tag c="blue" label={`👥 ${result.parsedIntent.guestCount} guests`} />}
              {result.resolvedLocation?.city && <Tag c="orange" label={`📍 ${result.resolvedLocation.city.name}`} />}
              {result.resolvedCategory && <Tag c="purple" label={`🏷️ ${result.resolvedCategory.name}`} />}
            </div>
          </div>
        )}

        {/* Availability filter banner */}
        {filters.eventDate && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-3 mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-green-700 font-bold text-sm">📅 Showing vendors available on</span>
              <span className="bg-green-100 text-green-800 font-bold text-sm px-3 py-0.5 rounded-full">
                {new Date(filters.eventDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              {filters.eventTime && (
                <span className="bg-green-100 text-green-800 font-semibold text-xs px-2.5 py-0.5 rounded-full">
                  {TIME_SLOT_LABELS[filters.eventTime] || filters.eventTime}
                </span>
              )}
            </div>
            <button
              onClick={() => setFilters((f) => ({ ...f, eventDate: '', eventTime: '' }))}
              className="text-green-500 hover:text-green-700 text-xs font-bold shrink-0"
            >
              Clear ×
            </button>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-5 overflow-x-auto scrollbar-hide w-full sm:w-fit">
          {([
            { key: 'packages',     label: 'Packages',     icon: '📦' },
            { key: 'recommended',  label: 'Vendors',      icon: '✦' },
            { key: 'rated',        label: 'Top Rated',    icon: '⭐' },
            { key: 'price',        label: 'Best Price',   icon: '₹' },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.key === 'packages' && packages.length > 0 && activeTab !== 'packages' && (
                <span className="ml-1 bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {packages.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-6">
          {/* ── Sidebar filters ── */}
          <aside className="hidden lg:block w-60 xl:w-64 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20">
              <FilterPanel
                filters={filters} cities={cities} categories={categories}
                activeFilterCount={activeFilterCount}
                updateFilter={updateFilter} setFilters={setFilters}
              />
            </div>
          </aside>

          {/* ── Results column ── */}
          <div className="flex-1 min-w-0">
            {/* Results bar */}
            <div className="flex items-center justify-between mb-4 gap-2">
              <p className="text-sm text-gray-500 min-w-0 truncate">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin inline-block" />
                    Searching...
                  </span>
                ) : activeTab === 'packages' ? (
                  <span>
                    <strong className="text-gray-900 text-base">{packagesMeta.total}</strong>
                    <span className="text-gray-500"> packages found</span>
                    {query && <span> for &ldquo;<span className="text-gray-700 font-medium">{query}</span>&rdquo;</span>}
                  </span>
                ) : result ? (
                  <span>
                    <strong className="text-gray-900 text-base">{result.meta.total}</strong>
                    <span className="text-gray-500"> vendors found</span>
                    {query && <span> for &ldquo;<span className="text-gray-700 font-medium">{query}</span>&rdquo;</span>}
                  </span>
                ) : 'No results'}
              </p>

              <div className="flex items-center gap-2 shrink-0">
                {/* View toggle — desktop */}
                <div className="hidden sm:flex items-center bg-white border border-gray-200 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setViewMode('list')}
                    title="List view"
                    className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    title="Grid view"
                    className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                </div>

                {/* Mobile filters */}
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="lg:hidden flex items-center gap-1.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl px-3 py-2 hover:border-red-300 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                  </svg>
                  Filters {activeFilterCount > 0 && <span className="bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{activeFilterCount}</span>}
                </button>
              </div>
            </div>

            {/* Mobile filter panel */}
            {filtersOpen && (
              <div className="lg:hidden bg-white rounded-2xl border border-gray-100 p-5 mb-4 shadow-sm">
                <FilterPanel
                  filters={filters} cities={cities} categories={categories}
                  activeFilterCount={activeFilterCount}
                  updateFilter={updateFilter} setFilters={setFilters}
                />
              </div>
            )}

            {/* ── Package Results ── */}
            {activeTab === 'packages' && (
              <>
                {packagesLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="p-4 space-y-3">
                          <div className="h-3 skeleton rounded w-1/3" />
                          <div className="h-5 skeleton rounded w-3/4" />
                          <div className="h-3 skeleton rounded w-1/2" />
                          <div className="flex gap-1.5 mt-2">
                            {[...Array(3)].map((_, j) => <div key={j} className="h-5 skeleton rounded-full w-20" />)}
                          </div>
                          <div className="h-9 skeleton rounded-xl mt-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : packages.length > 0 ? (
                  <>
                    {filters.eventDate && (
                      <p className="text-xs text-emerald-700 font-semibold mb-3">
                        ✓ Showing {packages.length} packages available on your selected date
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {packages.map((pkg) => (
                        <PackageCard
                          key={pkg.id}
                          pkg={pkg}
                          onBook={(p) => {
                            setSelectedPackage(p);
                            setSelectedVendor(p.vendor as any);
                          }}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-lg font-extrabold text-gray-800 mb-2">No packages found</h3>
                    <p className="text-gray-500 text-sm mb-5 max-w-sm mx-auto">
                      Vendors in this area haven&apos;t published packages yet. Browse individual vendors below.
                    </p>
                    <button
                      onClick={() => handleTabChange('recommended')}
                      className="bg-red-600 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-red-700 transition"
                    >
                      Browse Vendors
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── Vendor Loading ── */}
            {activeTab !== 'packages' && loading && <ListSkeleton />}

            {/* ── Vendor Results ── */}
            {activeTab !== 'packages' && !loading && result?.data.length ? (
              <>
                {/* Mobile: always 2-col grid */}
                <div className="sm:hidden grid grid-cols-2 gap-3">
                  {result.data.map((vendor) => (
                    <VendorCard key={vendor.id} vendor={vendor} onGetQuote={setSelectedVendor} />
                  ))}
                </div>

                {/* Desktop: list or grid based on viewMode */}
                {viewMode === 'list' ? (
                  <div className="hidden sm:flex flex-col gap-3">
                    {result.data.map((vendor, idx) => (
                      <VendorListCard
                        key={vendor.id}
                        vendor={vendor}
                        rank={idx + 1 + (filters.page - 1) * 12}
                        onGetQuote={setSelectedVendor}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="hidden sm:grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {result.data.map((vendor) => (
                      <VendorCard key={vendor.id} vendor={vendor} onGetQuote={setSelectedVendor} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {result.meta.pages > 1 && (
                  <div className="mt-8 overflow-x-auto scrollbar-hide">
                    <div className="flex justify-start sm:justify-center gap-2 min-w-max px-1 pb-1">
                      <button
                        onClick={() => updateFilter('page', Math.max(1, filters.page - 1))}
                        disabled={filters.page === 1}
                        className="w-10 h-10 rounded-full text-sm font-medium border border-gray-200 text-gray-600 hover:border-red-400 disabled:opacity-40 transition shrink-0"
                      >‹</button>
                      {[...Array(Math.min(result.meta.pages, 10))].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => updateFilter('page', i + 1)}
                          className={`w-10 h-10 rounded-full text-sm font-bold transition shrink-0 ${
                            filters.page === i + 1
                              ? 'bg-red-600 text-white shadow-md'
                              : 'bg-white border border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600'
                          }`}
                        >{i + 1}</button>
                      ))}
                      <button
                        onClick={() => updateFilter('page', Math.min(result.meta.pages, filters.page + 1))}
                        disabled={filters.page === result.meta.pages}
                        className="w-10 h-10 rounded-full text-sm font-medium border border-gray-200 text-gray-600 hover:border-red-400 disabled:opacity-40 transition shrink-0"
                      >›</button>
                    </div>
                  </div>
                )}
              </>
            ) : activeTab !== 'packages' && !loading && (
              <div className="text-center py-24">
                <div className="text-7xl mb-5">🔍</div>
                <h3 className="text-xl font-extrabold text-gray-800 mb-2">No vendors found</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto text-sm">
                  Try broadening your search — remove filters or use different keywords
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setFilters({ cityId: 0, categoryId: 0, maxBudget: '', minRating: '', sortBy: 'relevance', page: 1, eventDate: '', eventTime: '' })}
                    className="bg-red-600 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-red-700 transition"
                  >
                    Clear Filters
                  </button>
                  <button onClick={() => handleSearch('')} className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-full text-sm font-semibold hover:border-red-300 transition">
                    Browse All
                  </button>
                </div>
              </div>
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
    red: 'bg-red-100 text-red-800',
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    orange: 'bg-orange-100 text-orange-800',
    purple: 'bg-purple-100 text-purple-800',
  };
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[c]}`}>{label}</span>;
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64 gap-3 text-gray-500">
        <span className="w-5 h-5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
        <span className="text-sm">Loading search…</span>
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  );
}
