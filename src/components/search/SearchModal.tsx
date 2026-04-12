'use client';

import {
  useState, useEffect, useRef, useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { X, Search, Clock, TrendingUp, MapPin, Star, Package, Zap, SlidersHorizontal, ChevronRight } from 'lucide-react';
import { searchApi, categoriesApi, locationsApi, packagesApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import type { Category } from '@/types';

const RECENT_KEY = 'pt_recent_searches';
function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function saveRecent(q: string) {
  try {
    const prev = getRecent().filter(s => s !== q).slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev]));
  } catch { /* noop */ }
}

interface VendorResult {
  id: number; businessName: string; slug: string;
  city?: { name: string }; rating?: number;
  categories?: { name: string }[];
}
interface PackageResult {
  id: number; title: string; price: number | string;
  vendor?: { businessName: string; slug: string };
}
interface LiveResults {
  vendors: VendorResult[];
  packages: PackageResult[];
  categories: Category[];
}

const EVENT_ICONS: Record<string, string> = {
  wedding: '💍', birthday: '🎂', corporate: '💼', anniversary: '💑',
  engagement: '💫', reception: '🎊', 'baby-shower': '🍼', other: '🎉',
};
const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding', icon: '💍' },
  { value: 'birthday', label: 'Birthday', icon: '🎂' },
  { value: 'corporate', label: 'Corporate', icon: '💼' },
  { value: 'anniversary', label: 'Anniversary', icon: '💑' },
  { value: 'engagement', label: 'Engagement', icon: '💫' },
  { value: 'reception', label: 'Reception', icon: '🎊' },
  { value: 'baby-shower', label: 'Baby Shower', icon: '🍼' },
  { value: 'other', label: 'Other', icon: '🎉' },
];
const BUDGET_OPTS = [
  { label: 'Under ₹50K', value: '50000' },
  { label: 'Under ₹1L', value: '100000' },
  { label: 'Under ₹2L', value: '200000' },
  { label: 'Under ₹5L', value: '500000' },
  { label: 'Under ₹10L', value: '1000000' },
  { label: 'Above ₹10L', value: '2000000' },
];

interface Props {
  onClose: () => void;
  initialQuery?: string;
}

export default function SearchModal({ onClose, initialQuery = '' }: Props) {
  const router = useRouter();
  const { user, preferences, selectedCity } = useAppStore();

  const [query, setQuery]             = useState(initialQuery);
  const [live, setLive]               = useState<LiveResults>({ vendors: [], packages: [], categories: [] });
  const [searching, setSearching]     = useState(false);
  const [recent, setRecent]           = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Pre-fill from preferences
  const [filterEventType, setFilterEventType] = useState(preferences?.eventType || '');
  const [filterBudget, setFilterBudget]       = useState(preferences?.budgetMax ? String(preferences.budgetMax) : '');
  const [filterCityId, setFilterCityId]       = useState(
    preferences?.cityId ? String(preferences.cityId) : selectedCity ? String(selectedCity.id) : ''
  );
  const [filterGuests, setFilterGuests] = useState('');
  const [filterDate, setFilterDate]     = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities]         = useState<{ id: number; name: string; slug: string }[]>([]);

  const inputRef    = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    categoriesApi.getAll('service')
      .then((d: unknown) => setCategories((d as Category[]).filter(c => c.isActive !== false).slice(0, 16)))
      .catch(() => {});
    locationsApi.getCities()
      .then((d: unknown) => setCities((d as any) || []))
      .catch(() => {});
    setRecent(getRecent());
    setTimeout(() => inputRef.current?.focus(), 60);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ── Live search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setLive({ vendors: [], packages: [], categories: [] }); return; }
    setSearching(true);
    try {
      const params: Record<string, unknown> = { q: q.trim(), limit: 5, nlp: 1 };
      if (filterCityId) params.cityId = Number(filterCityId);
      if (filterBudget) params.maxBudget = Number(filterBudget);
      if (filterEventType) params.eventType = filterEventType;

      const [searchRes, pkgRes] = await Promise.allSettled([
        searchApi.search(params),
        packagesApi.search({
          q: q.trim(), limit: 4, status: 'active',
          ...(filterBudget ? { maxPrice: filterBudget } : {}),
          ...(filterCityId ? { cityId: filterCityId } : {}),
        }),
      ]);

      const vendors: VendorResult[] = (() => {
        if (searchRes.status !== 'fulfilled') return [];
        const d = searchRes.value as any;
        return Array.isArray(d) ? d : (d?.data ?? d?.vendors ?? []);
      })();
      const pkgs: PackageResult[] = (() => {
        if (pkgRes.status !== 'fulfilled') return [];
        const d = pkgRes.value as any;
        return Array.isArray(d) ? d : (d?.data ?? []);
      })();
      const matchedCats = categories.filter(c => c.name.toLowerCase().includes(q.toLowerCase())).slice(0, 3);

      setLive({ vendors: vendors.slice(0, 5), packages: pkgs.slice(0, 4), categories: matchedCats });
    } catch { /* ignore */ } finally { setSearching(false); }
  }, [filterCityId, filterBudget, filterEventType, categories]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  // ── Navigate to search page with all params
  const submit = useCallback((term?: string) => {
    const q = (term ?? query).trim();
    const params = new URLSearchParams();
    if (q) { params.set('q', q); params.set('nlp', '1'); saveRecent(q); }
    if (filterCityId) params.set('cityId', filterCityId);
    if (filterBudget) params.set('maxBudget', filterBudget);
    if (filterGuests) params.set('guests', filterGuests);
    if (filterDate)   params.set('eventDate', filterDate);
    if (filterEventType) params.set('eventType', filterEventType);
    onClose();
    router.push(`/search?${params.toString()}`);
  }, [query, filterCityId, filterBudget, filterGuests, filterDate, filterEventType, router, onClose]);

  const goToCategory = (cat: Category) => {
    const params = new URLSearchParams({ category: cat.slug });
    if (filterCityId) params.set('cityId', filterCityId);
    if (filterBudget) params.set('maxBudget', filterBudget);
    if (filterEventType) params.set('eventType', filterEventType);
    saveRecent(cat.name);
    onClose();
    router.push(`/search?${params.toString()}`);
  };

  const goToVendor = (v: VendorResult) => { onClose(); router.push(`/vendor/${v.slug}`); };
  const clearAll = () => { setFilterEventType(''); setFilterBudget(''); setFilterCityId(''); setFilterGuests(''); setFilterDate(''); };

  const hasLive    = live.vendors.length > 0 || live.packages.length > 0 || live.categories.length > 0;
  const hasFilters = !!(filterEventType || filterBudget || filterCityId || filterGuests || filterDate);
  const cityName   = cities.find(c => String(c.id) === filterCityId)?.name || selectedCity?.name;
  // ── Label for search button (always shown)
  const searchBtnLabel = (() => {
    if (query.trim() && hasFilters) return `Find "${query}" · ${[filterEventType, cityName, filterBudget ? `₹${Number(filterBudget) >= 100000 ? `${Number(filterBudget) / 100000}L` : `${Number(filterBudget) / 1000}K`}` : ''].filter(Boolean).join(' · ')}`;
    if (query.trim()) return `Find vendors for "${query}"`;
    if (filterEventType) return `Find ${filterEventType.replace(/-/g, ' ')} vendors${cityName ? ` in ${cityName}` : ''}`;
    if (cityName) return `Browse all vendors in ${cityName}`;
    return 'Browse all vendors';
  })();

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-start justify-center pt-0 sm:pt-12 sm:px-4"
      style={{ background: 'rgba(15,15,15,0.6)', backdropFilter: 'blur(6px)' }}
      onMouseDown={onClose}
    >
      {/* ── Modal panel */}
      <div
        className="bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ height: '100dvh', maxHeight: 'min(100dvh, 820px)' }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* ── Header: search input row */}
        <div className="flex items-center gap-2.5 px-3 py-3 border-b border-gray-100 shrink-0 bg-white">
          {/* Input */}
          <div className="flex-1 flex items-center gap-2.5 bg-gray-50 border-2 border-transparent focus-within:border-red-400 focus-within:bg-white rounded-2xl px-3.5 py-2.5 transition-all min-w-0">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') submit();
                if (e.key === 'Escape') onClose();
              }}
              placeholder={
                preferences?.eventType
                  ? `Search ${preferences.eventType} vendors${cityName ? ` in ${cityName}` : ''}…`
                  : cityName ? `Search vendors in ${cityName}…`
                  : 'Search photographers, caterers, venues…'
              }
              className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 font-medium min-w-0"
              autoComplete="off"
            />
            {searching && <span className="w-4 h-4 border-2 border-red-200 border-t-red-500 rounded-full animate-spin shrink-0" />}
            {query && !searching && (
              <span
                onClick={() => setQuery('')}
                className="text-gray-400 hover:text-gray-600 shrink-0 cursor-pointer p-0.5"
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setQuery('')}
              >
                <X className="w-4 h-4" />
              </span>
            )}
          </div>

          {/* Filter toggle */}
          <span
            onClick={() => setShowFilters(v => !v)}
            className={`relative p-2.5 rounded-xl border-2 transition-all shrink-0 cursor-pointer select-none
              ${showFilters || hasFilters ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && setShowFilters(v => !v)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {hasFilters && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {[filterEventType, filterBudget, filterCityId, filterGuests, filterDate].filter(Boolean).length}
              </span>
            )}
          </span>

          {/* Close */}
          <span
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition shrink-0 cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onClose()}
          >
            <X className="w-5 h-5" />
          </span>
        </div>

        {/* ── Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 border-b border-gray-100 bg-red-50/40 shrink-0">
            {filterEventType && (
              <span className="inline-flex items-center gap-1 bg-white border border-red-200 text-red-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                {EVENT_ICONS[filterEventType] || '🎉'} {filterEventType.replace(/-/g, ' ')}
                <span onClick={() => setFilterEventType('')} className="cursor-pointer hover:text-red-900 font-black ml-0.5" role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && setFilterEventType('')}>×</span>
              </span>
            )}
            {filterBudget && (
              <span className="inline-flex items-center gap-1 bg-white border border-red-200 text-red-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                💰 Under ₹{Number(filterBudget) >= 100000 ? `${Number(filterBudget) / 100000}L` : `${Number(filterBudget) / 1000}K`}
                <span onClick={() => setFilterBudget('')} className="cursor-pointer hover:text-red-900 font-black ml-0.5" role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && setFilterBudget('')}>×</span>
              </span>
            )}
            {filterCityId && cityName && (
              <span className="inline-flex items-center gap-1 bg-white border border-red-200 text-red-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                📍 {cityName}
                <span onClick={() => setFilterCityId('')} className="cursor-pointer hover:text-red-900 font-black ml-0.5" role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && setFilterCityId('')}>×</span>
              </span>
            )}
            {filterGuests && (
              <span className="inline-flex items-center gap-1 bg-white border border-red-200 text-red-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                👥 {filterGuests} guests
                <span onClick={() => setFilterGuests('')} className="cursor-pointer hover:text-red-900 font-black ml-0.5" role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && setFilterGuests('')}>×</span>
              </span>
            )}
            {filterDate && (
              <span className="inline-flex items-center gap-1 bg-white border border-red-200 text-red-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                📅 {new Date(filterDate + 'T12:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                <span onClick={() => setFilterDate('')} className="cursor-pointer hover:text-red-900 font-black ml-0.5" role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && setFilterDate('')}>×</span>
              </span>
            )}
            <span onClick={clearAll} className="text-[11px] text-gray-400 hover:text-red-600 font-semibold ml-auto cursor-pointer transition" role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && clearAll()}>
              Clear all ×
            </span>
          </div>
        )}

        {/* ── Filter panel */}
        {showFilters && (
          <div className="border-b border-gray-100 bg-white px-4 py-4 space-y-4 shrink-0 max-h-72 overflow-y-auto">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Event Type</p>
              <div className="flex flex-wrap gap-1.5">
                {EVENT_TYPES.map(et => (
                  <span
                    key={et.value}
                    onClick={() => setFilterEventType(filterEventType === et.value ? '' : et.value)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold border-2 transition-all cursor-pointer select-none
                      ${filterEventType === et.value ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:border-red-200'}`}
                    role="checkbox"
                    aria-checked={filterEventType === et.value}
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setFilterEventType(filterEventType === et.value ? '' : et.value)}
                  >
                    {et.icon} {et.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Max Budget</p>
                <select value={filterBudget} onChange={e => setFilterBudget(e.target.value)}
                  className="w-full text-sm border-2 border-gray-200 focus:border-red-400 rounded-xl px-3 py-2 outline-none bg-white">
                  <option value="">Any Budget</option>
                  {BUDGET_OPTS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">City</p>
                <select value={filterCityId} onChange={e => setFilterCityId(e.target.value)}
                  className="w-full text-sm border-2 border-gray-200 focus:border-red-400 rounded-xl px-3 py-2 outline-none bg-white">
                  <option value="">All Cities</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Guests</p>
                <input type="number" value={filterGuests} onChange={e => setFilterGuests(e.target.value)}
                  placeholder="e.g. 200" min="1"
                  className="w-full text-sm border-2 border-gray-200 focus:border-red-400 rounded-xl px-3 py-2 outline-none" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Event Date</p>
                <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full text-sm border-2 border-gray-200 focus:border-red-400 rounded-xl px-3 py-2 outline-none" />
              </div>
            </div>
          </div>
        )}

        {/* ── Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain">

          {/* Personalization banner */}
          {!query && preferences?.eventType && user && (
            <div className="mx-4 mt-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-100 rounded-2xl p-3.5 flex items-center gap-3">
              <span className="text-2xl shrink-0">{EVENT_ICONS[preferences.eventType] || '🎉'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-gray-900">
                  Planning a <span className="text-red-600 capitalize">{preferences.eventType.replace(/-/g, ' ')}</span>?
                </p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  Filters pre-set{preferences.budgetMax ? ` · ₹${(preferences.budgetMax / 100000).toFixed(1)}L budget` : ''}{cityName ? ` · ${cityName}` : ''}
                </p>
              </div>
              <span
                onClick={() => submit(preferences.eventType + ' vendors')}
                className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition shrink-0 cursor-pointer select-none"
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && submit(preferences.eventType + ' vendors')}
              >
                Find <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          )}

          {/* Live results */}
          {query && (
            <div className="py-2">
              {searching && !hasLive && (
                <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
                  <span className="w-5 h-5 border-2 border-gray-200 border-t-red-500 rounded-full animate-spin" />
                  <span className="text-sm">Searching…</span>
                </div>
              )}

              {/* Category matches */}
              {live.categories.length > 0 && (
                <div className="px-4 py-1">
                  {live.categories.map(cat => (
                    <div key={cat.id}
                      onClick={() => goToCategory(cat)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition group cursor-pointer"
                      role="option" aria-selected={false} tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && goToCategory(cat)}
                    >
                      <span className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-base shrink-0">
                        {cat.icon && cat.icon.length <= 4 ? cat.icon : '🎭'}
                      </span>
                      <span className="text-sm text-gray-700 font-semibold group-hover:text-red-700 flex-1">{cat.name} vendors</span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-400" />
                    </div>
                  ))}
                </div>
              )}

              {/* Direct search row */}
              <div
                onClick={() => submit()}
                className="flex items-center gap-3 px-7 py-3 hover:bg-gray-50 transition cursor-pointer border-b border-gray-50"
                role="option" aria-selected={false} tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && submit()}
              >
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-800 font-semibold">
                    Search &ldquo;<span className="text-red-600">{query}</span>&rdquo;
                  </span>
                  {hasFilters && <span className="text-xs text-gray-400 ml-2">with your filters</span>}
                </div>
                <span className="text-xs text-gray-400 shrink-0 font-mono">↵</span>
              </div>

              {/* Vendor results */}
              {live.vendors.length > 0 && (
                <div className="px-4 py-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3" /> Vendors
                  </p>
                  <div className="space-y-1">
                    {live.vendors.map(v => (
                      <div key={v.id}
                        onClick={() => goToVendor(v)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition group cursor-pointer"
                        role="option" aria-selected={false} tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && goToVendor(v)}
                      >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center font-black text-red-600 text-sm shrink-0">
                          {v.businessName[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate group-hover:text-red-700">{v.businessName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {v.city && <span className="text-[11px] text-gray-400 flex items-center gap-0.5"><MapPin className="w-3 h-3" />{v.city.name}</span>}
                            {v.categories?.[0] && <span className="text-[11px] text-gray-400">{v.categories[0].name}</span>}
                          </div>
                        </div>
                        {v.rating && Number(v.rating) > 0 && (
                          <span className="flex items-center gap-0.5 text-xs font-bold text-amber-500 shrink-0">
                            <Star className="w-3 h-3 fill-amber-400" />{Number(v.rating).toFixed(1)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Package results */}
              {live.packages.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-50">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2 flex items-center gap-1.5">
                    <Package className="w-3 h-3" /> Packages
                  </p>
                  <div className="space-y-1">
                    {live.packages.map(pkg => (
                      <div key={pkg.id}
                        onClick={() => { onClose(); router.push(`/vendor/${pkg.vendor?.slug || ''}?pkg=${pkg.id}`); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 transition group cursor-pointer"
                        role="option" aria-selected={false} tabIndex={0}
                        onKeyDown={e => { if (e.key === 'Enter') { onClose(); router.push(`/vendor/${pkg.vendor?.slug || ''}?pkg=${pkg.id}`); } }}
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-700">{pkg.title}</p>
                          <p className="text-[11px] text-gray-400">{pkg.vendor?.businessName}</p>
                        </div>
                        <span className="text-sm font-black text-red-600 shrink-0">
                          ₹{Number(pkg.price).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {!searching && !hasLive && (
                <div className="flex flex-col items-center py-10 gap-2 px-4 text-center">
                  <span className="text-4xl">🔍</span>
                  <p className="text-sm font-bold text-gray-700">No matches found</p>
                  <p className="text-xs text-gray-400">Press Enter or tap the button below to search all vendors</p>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!query && (
            <div className="pb-6">
              {/* Recent searches */}
              {recent.length > 0 && (
                <div className="px-4 pt-4 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Recent searches
                    </p>
                    <span
                      onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]); }}
                      className="text-[10px] text-gray-400 hover:text-red-500 font-semibold transition cursor-pointer"
                      role="button" tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && (localStorage.removeItem(RECENT_KEY), setRecent([]))}
                    >
                      Clear
                    </span>
                  </div>
                  <ul className="space-y-0.5 list-none p-0 m-0">
                    {recent.slice(0, 5).map(s => (
                      <li key={s}
                        onClick={() => submit(s)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer select-none group"
                        role="option" aria-selected={false} tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && submit(s)}
                      >
                        <Clock className="w-4 h-4 text-gray-300 shrink-0" />
                        <span className="text-sm text-gray-700 flex-1">{s}</span>
                        <span className="text-[11px] text-gray-300 group-hover:text-red-400 transition font-bold">↗</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Category grid */}
              {categories.length > 0 && (
                <div className="px-4 pt-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Zap className="w-3 h-3" /> Browse by Service
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {categories.slice(0, 12).map(cat => (
                      <div key={cat.id}
                        onClick={() => goToCategory(cat)}
                        className="flex flex-col items-center gap-1.5 py-3.5 px-2 bg-gray-50 hover:bg-red-50 hover:border-red-200 border border-gray-100 rounded-2xl transition cursor-pointer text-center group select-none"
                        role="option" aria-selected={false} tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && goToCategory(cat)}
                      >
                        <span className="text-xl">{cat.icon && cat.icon.length <= 4 ? cat.icon : '🎭'}</span>
                        <span className="text-[10px] font-bold text-gray-600 group-hover:text-red-700 leading-tight">{cat.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending */}
              <div className="px-4 pt-5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" /> Trending
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Wedding photographer', 'Birthday caterer', 'Wedding venue', 'DJ for sangeet',
                    'Makeup artist', 'Event decorator', 'Wedding planner', 'Baby shower'].map(t => (
                    <span
                      key={t}
                      onClick={() => setQuery(t)}
                      className="text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-red-100 hover:text-red-700 px-3 py-1.5 rounded-full transition cursor-pointer select-none"
                      role="option" aria-selected={false} tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && setQuery(t)}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Sticky search button — always visible */}
        <div className="px-4 py-3 border-t border-gray-100 bg-white shrink-0">
          <button
            type="button"
            onClick={() => submit()}
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:scale-[0.98] text-white font-black py-3.5 rounded-2xl transition-all shadow-lg shadow-red-200/60 text-sm flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span className="truncate">{searchBtnLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
