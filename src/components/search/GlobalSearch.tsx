'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { categoriesApi } from '@/lib/api';
import { Category } from '@/types';

const RECENT_KEY = 'pt_recent_searches';

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
  catch { return []; }
}
function saveRecent(q: string) {
  try {
    const prev = getRecent().filter((s) => s !== q).slice(0, 4);
    localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev]));
  } catch { /* noop */ }
}

interface Props {
  compact?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function GlobalSearch({ compact = false, placeholder, autoFocus }: Props) {
  const router = useRouter();
  const { selectedCity } = useAppStore();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const ph = placeholder || (selectedCity
    ? `Search vendors in ${selectedCity.name}…`
    : 'Search photographers, caterers, venues…'
  );

  useEffect(() => {
    categoriesApi.getAll().then((cats) => {
      setCategories(((cats as unknown) as Category[]).filter((c) => c.isActive !== false).slice(0, 12));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (open || mobileSearchOpen) setRecent(getRecent());
  }, [open, mobileSearchOpen]);

  // Focus mobile input when overlay opens
  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileSearchOpen]);

  // Close desktop dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const submit = useCallback((q: string) => {
    if (!q.trim()) return;
    saveRecent(q.trim());
    setOpen(false);
    setMobileSearchOpen(false);
    setQuery('');
    const params = new URLSearchParams({ q: q.trim(), nlp: '1' });
    if (selectedCity) params.set('cityId', String(selectedCity.id));
    router.push(`/search?${params}`);
  }, [router, selectedCity]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submit(query);
    if (e.key === 'Escape') { setOpen(false); setMobileSearchOpen(false); inputRef.current?.blur(); }
  };

  const clearRecent = () => { localStorage.removeItem(RECENT_KEY); setRecent([]); };
  // Category-based suggestions that match the current query
  const filteredCats = query.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : [];

  /* ── Full hero search (non-compact) ────────────────────────────────────── */
  if (!compact) {
    return (
      <div ref={containerRef} className="relative w-full max-w-3xl mx-auto">
        <div className={`flex items-center bg-white rounded-2xl overflow-hidden transition-all duration-300 ${
          open ? 'shadow-2xl shadow-red-500/20 ring-2 ring-red-400 rounded-b-none' : 'shadow-xl shadow-black/20'
        } h-14 sm:h-16`}>
          <div className={`pl-5 shrink-0 transition-colors ${open ? 'text-red-500' : 'text-gray-400'}`}>
            <SearchSVG className="w-5 h-5" />
          </div>
          <input
            ref={inputRef}
            type="search"
            value={query}
            autoFocus={autoFocus}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKey}
            placeholder={ph}
            className="flex-1 px-3 py-4 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm sm:text-base font-medium"
            autoComplete="off"
          />
          {query && (
            <button onClick={() => { setQuery(''); inputRef.current?.focus(); }} className="p-2 text-gray-400 hover:text-gray-600">
              <CloseSVG className="w-4 h-4" />
            </button>
          )}
          <div className="w-px h-8 bg-gray-200 hidden sm:block" />
          <button
            onClick={() => submit(query)}
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold px-6 h-full transition shrink-0 flex items-center gap-2 text-sm"
          >
            <span className="hidden sm:inline">Search</span>
            <SearchSVG className="w-4 h-4" />
          </button>
        </div>
        {open && (
          <DesktopDropdown query={query} recent={recent} filteredCats={filteredCats} categories={categories} onSelect={submit} onClearRecent={clearRecent} />
        )}
      </div>
    );
  }

  /* ── Compact header mode ─────────────────────────────────────────────── */
  return (
    <>
      {/* Desktop compact search bar */}
      <div ref={containerRef} className="relative flex-1 max-w-xl hidden md:block">
        <div className={`flex items-center bg-gray-100 hover:bg-gray-50 border rounded-full transition-all ${
          open ? 'border-red-400 bg-white ring-2 ring-red-100 shadow-lg' : 'border-gray-200'
        } h-10`}>
          <div className="pl-3.5 text-gray-400 shrink-0">
            <SearchSVG className="w-4 h-4" />
          </div>
          <input
            ref={inputRef}
            type="search"
            value={query}
            autoFocus={autoFocus}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKey}
            placeholder={ph}
            className="flex-1 bg-transparent px-2.5 py-2 text-sm outline-none text-gray-800 placeholder-gray-400 min-w-0"
            autoComplete="off"
          />
          {query && (
            <button onClick={() => setQuery('')} className="pr-2 text-gray-400 hover:text-gray-600">
              <CloseSVG className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => submit(query)}
            className="bg-red-600 hover:bg-red-700 text-white px-3 h-full rounded-r-full text-xs font-bold transition shrink-0"
          >
            Search
          </button>
        </div>
        {open && (
          <DesktopDropdown query={query} recent={recent} filteredCats={filteredCats} categories={categories} onSelect={submit} onClearRecent={clearRecent} compact />
        )}
      </div>

      {/* Mobile search trigger pill */}
      <button
        onClick={() => setMobileSearchOpen(true)}
        className="md:hidden flex-1 flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full h-10 px-3.5 text-sm text-gray-400 text-left min-w-0"
      >
        <SearchSVG className="w-4 h-4 shrink-0" />
        <span className="truncate text-gray-400 text-sm">Search vendors…</span>
      </button>

      {/* Mobile full-screen search overlay */}
      {mobileSearchOpen && (
        <MobileSearchOverlay
          query={query}
          setQuery={setQuery}
          recent={recent}
          filteredCats={filteredCats}
          categories={categories}
          inputRef={mobileInputRef}
          onClose={() => { setMobileSearchOpen(false); setQuery(''); }}
          onSubmit={submit}
          onClearRecent={clearRecent}
          onKey={handleKey}
          selectedCityName={selectedCity?.name}
        />
      )}
    </>
  );
}

/* ── Mobile full-screen overlay ──────────────────────────────────────────── */
function MobileSearchOverlay({
  query, setQuery, recent, filteredCats, categories, inputRef, onClose, onSubmit, onClearRecent, onKey, selectedCityName,
}: {
  query: string;
  setQuery: (v: string) => void;
  recent: string[];
  filteredCats: Category[];
  categories: Category[];
  inputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onSubmit: (q: string) => void;
  onClearRecent: () => void;
  onKey: (e: React.KeyboardEvent) => void;
  selectedCityName?: string;
}) {
  const ph = selectedCityName ? `Search vendors in ${selectedCityName}…` : 'Search photographers, caterers…';

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col">
      {/* Search input row */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-gray-100 bg-white">
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition shrink-0"
        >
          <BackSVG className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-center bg-gray-100 rounded-2xl border border-gray-200 focus-within:border-red-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-red-100 transition h-11 px-3 gap-2">
          <SearchSVG className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder={ph}
            className="flex-1 bg-transparent outline-none text-gray-800 text-base placeholder-gray-400"
            autoComplete="off"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600 shrink-0">
              <CloseSVG className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => onSubmit(query)}
          disabled={!query.trim()}
          className="bg-red-600 disabled:opacity-40 text-white text-sm font-bold px-4 h-11 rounded-2xl transition shrink-0"
        >
          Go
        </button>
      </div>

      {/* Scrollable results */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* Typing suggestions */}
        {query.trim() && (
          <div className="p-3">
            {filteredCats.length > 0 ? (
              <div className="space-y-1">
                {filteredCats.map((c) => (
                  <button key={c.id} onClick={() => onSubmit(c.name + ' vendors')}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-50 active:bg-red-100 text-left transition">
                    <SearchSVG className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700 flex-1">{c.name} vendors</span>
                    <ArrowTopLeftSVG className="w-4 h-4 text-gray-300 shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <button onClick={() => onSubmit(query)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-50 active:bg-red-100 text-left transition">
                <SearchSVG className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-sm text-gray-800">Search <strong>&ldquo;{query}&rdquo;</strong></span>
              </button>
            )}
          </div>
        )}

        {/* Recent searches */}
        {!query.trim() && recent.length > 0 && (
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recent</span>
              <button onClick={onClearRecent} className="text-xs text-red-500 font-medium">Clear</button>
            </div>
            <div className="space-y-0.5">
              {recent.map((s) => (
                <button key={s} onClick={() => onSubmit(s)}
                  className="w-full flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 text-left transition">
                  <ClockSVG className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-700 flex-1">{s}</span>
                  <ArrowTopLeftSVG className="w-4 h-4 text-gray-300 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick categories */}
        {!query.trim() && categories.length > 0 && (
          <div className="px-4 pt-4 pb-8">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3">Browse by Category</span>
            <div className="grid grid-cols-3 gap-2">
              {categories.slice(0, 9).map((c) => (
                <button key={c.id} onClick={() => onSubmit(c.name + ' vendors')}
                  className="flex flex-col items-center justify-center gap-1 bg-gray-50 border border-gray-200 rounded-2xl py-4 px-2 hover:bg-red-50 hover:border-red-200 active:bg-red-100 transition text-xs font-semibold text-gray-600 text-center">
                  {c.icon && c.icon.length <= 4
                    ? <span className="text-xl">{c.icon}</span>
                    : <CategoryDotSVG />}
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Desktop dropdown (shared) ───────────────────────────────────────────── */
function DesktopDropdown({
  query, recent, filteredCats, categories, onSelect, onClearRecent, compact = false,
}: {
  query: string; recent: string[]; filteredCats: Category[]; categories: Category[];
  onSelect: (q: string) => void; onClearRecent: () => void; compact?: boolean;
}) {
  return (
    <div className={`absolute left-0 right-0 bg-white border border-gray-200 shadow-2xl z-50 overflow-hidden rounded-2xl ${
      compact ? 'top-11 border-t' : 'border-t-0 rounded-t-none'
    }`}>
      {query && (
        <div className="p-3 border-b border-gray-50">
          {filteredCats.length > 0 ? (
            <div className="space-y-1">
              {filteredCats.map((c) => (
                <button key={c.id} onClick={() => onSelect(c.name + ' vendors')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-50 text-left transition group">
                  <SearchSVG className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                  <span className="text-sm text-gray-700 group-hover:text-red-700 flex-1">{c.name} vendors</span>
                  <ChevronRightSVG className="w-3.5 h-3.5 text-gray-300 group-hover:text-red-400" />
                </button>
              ))}
            </div>
          ) : (
            <button onClick={() => onSelect(query)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-50 text-left transition group">
              <SearchSVG className="w-4 h-4 text-red-500" />
              <span className="text-sm text-gray-800">Search <strong>&ldquo;{query}&rdquo;</strong></span>
            </button>
          )}
        </div>
      )}

      {!query && recent.length > 0 && (
        <div className="p-3 border-b border-gray-50">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recent</span>
            <button onClick={onClearRecent} className="text-[10px] text-gray-400 hover:text-red-500 transition">Clear</button>
          </div>
          <div className="space-y-1">
            {recent.map((s) => (
              <button key={s} onClick={() => onSelect(s)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 text-left transition group">
                <ClockSVG className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                <span className="text-sm text-gray-600 flex-1">{s}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!query && categories.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Quick Search</p>
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 8).map((c) => (
              <button key={c.id} onClick={() => onSelect(c.name + ' vendors')}
                className="bg-white border border-gray-200 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition">
                {c.icon && c.icon.length <= 4 ? `${c.icon} ` : ''}{c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Inline SVG helpers ──────────────────────────────────────────────────── */
function SearchSVG({ className = 'w-4 h-4' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>;
}
function CloseSVG({ className = 'w-4 h-4' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>;
}
function BackSVG({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>;
}
function ChevronRightSVG({ className = 'w-4 h-4' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>;
}
function ArrowTopLeftSVG({ className = 'w-4 h-4' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10"/></svg>;
}
function ClockSVG({ className = 'w-4 h-4' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9"/><path strokeLinecap="round" d="M12 7v5l3 3"/></svg>;
}
function TrendSVG({ className = 'w-4 h-4' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>;
}
function CategoryDotSVG() {
  return <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="4"/></svg>;
}
