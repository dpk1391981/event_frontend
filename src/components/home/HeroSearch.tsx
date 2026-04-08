'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { locationsApi, categoriesApi } from '@/lib/api';
import { City, Locality, Category } from '@/types';

const PRICE_RANGES = [
  { label: 'Any Budget', value: '' },
  { label: 'Under ₹25K', value: '25000' },
  { label: 'Under ₹50K', value: '50000' },
  { label: 'Under ₹1L', value: '100000' },
  { label: 'Under ₹2L', value: '200000' },
  { label: 'Under ₹5L', value: '500000' },
];

export default function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  const [cities, setCities] = useState<City[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedLocality, setSelectedLocality] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    categoriesApi.getAll('service').then((d: unknown) => setCategories(d as Category[])).catch(() => {});
    locationsApi.getCities().then((d: unknown) => setCities(d as City[])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCity) { setLocalities([]); setSelectedLocality(''); return; }
    const city = cities.find((c) => c.slug === selectedCity);
    if (city) {
      locationsApi.getLocalities(city.id)
        .then((d: unknown) => setLocalities(d as Locality[]))
        .catch(() => setLocalities([]));
    }
    setSelectedLocality('');
  }, [selectedCity, cities]);

  // Dynamic placeholder suggestions: generated from fetched categories + selected city name
  const cityLabel = cities.find((c) => c.slug === selectedCity)?.name || cities[0]?.name || 'your city';
  const suggestions = categories.length > 0
    ? [
        `${categories[0]?.name} for wedding in ${cityLabel}`,
        `Caterer for 200 guests ₹3L budget`,
        `Birthday party venue in ${cityLabel}`,
        `DJ for sangeet night ₹50k`,
        `${categories[1]?.name || 'Makeup artist'} in ${cityLabel}`,
        `Decorator for reception hall`,
        `${categories[2]?.name || 'Pandit'} for ceremony in ${cityLabel}`,
      ]
    : [`Search vendors in ${cityLabel}…`];

  useEffect(() => {
    const interval = setInterval(() => setPlaceholderIdx((i) => (i + 1) % suggestions.length), 3500);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestions.length]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) { params.set('q', query.trim()); params.set('nlp', '1'); }
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedCity) {
      const city = cities.find((c) => c.slug === selectedCity);
      if (city) params.set('cityId', String(city.id));
    }
    if (selectedLocality) {
      const loc = localities.find((l) => l.slug === selectedLocality);
      if (loc) params.set('localityId', String(loc.id));
    }
    if (selectedPrice) params.set('maxBudget', selectedPrice);
    router.push(`/search?${params.toString()}`);
  };

  const activeFilters = [selectedCategory, selectedCity, selectedLocality, selectedPrice].filter(Boolean).length;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSearch}>
        {/* Main search bar */}
        <div className={`flex items-center bg-white rounded-t-2xl overflow-hidden transition-all duration-300 ${
          focused
            ? 'shadow-2xl shadow-red-500/20 ring-2 ring-red-400'
            : 'shadow-xl shadow-black/20'
        } h-16 sm:h-18`}>
          {/* Search icon */}
          <div className={`pl-5 pr-1 shrink-0 transition-colors ${focused ? 'text-red-500' : 'text-gray-400'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={suggestions[placeholderIdx] || suggestions[0]}
            className="flex-1 px-3 py-5 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-base sm:text-lg font-medium"
            autoComplete="off"
          />

          {/* Clear button */}
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="p-2 mr-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200 shrink-0 hidden sm:block" />

          {/* Search button */}
          <button
            type="submit"
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold px-7 h-full text-base transition-all shrink-0 flex items-center gap-2.5 rounded-r-2xl"
          >
            <span className="hidden sm:inline">Search</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        {/* Filter row */}
        <div className="bg-white rounded-b-2xl shadow-xl shadow-black/10 border-t border-gray-100 px-3 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            {
              label: 'Service',
              value: selectedCategory,
              onChange: setSelectedCategory,
              options: categories.map((c) => ({ label: c.name, value: c.slug })),
              placeholder: 'All Services',
              icon: '🎭',
            },
            {
              label: 'City',
              value: selectedCity,
              onChange: setSelectedCity,
              options: cities.map((c) => ({ label: c.name, value: c.slug })),
              placeholder: 'All Cities',
              icon: '🏙️',
            },
            {
              label: 'Locality',
              value: selectedLocality,
              onChange: setSelectedLocality,
              options: localities.map((l) => ({ label: l.name, value: l.slug })),
              placeholder: selectedCity ? 'All Localities' : 'Select city first',
              icon: '📍',
              disabled: !selectedCity,
            },
            {
              label: 'Budget',
              value: selectedPrice,
              onChange: setSelectedPrice,
              options: PRICE_RANGES.filter((p) => p.value).map((p) => ({ label: p.label, value: p.value })),
              placeholder: 'Any Budget',
              icon: '💰',
            },
          ].map((filter) => (
            <div key={filter.label} className="relative">
              <label className="absolute -top-2 left-3 text-[9px] font-extrabold text-red-500 uppercase tracking-widest bg-white px-1 z-10">
                {filter.label}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-sm pointer-events-none">{filter.icon}</span>
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  disabled={filter.disabled}
                  className={`w-full border rounded-xl pl-8 pr-8 py-2.5 text-sm outline-none transition-all bg-white appearance-none cursor-pointer font-medium
                    ${filter.value
                      ? 'border-red-300 text-red-700 bg-red-50 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-200 text-gray-600 focus:ring-2 focus:ring-red-100 focus:border-red-300'
                    }
                    ${filter.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'}
                  `}
                >
                  <option value="">{filter.placeholder}</option>
                  {filter.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <svg className="absolute right-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Active filter pills */}
        {activeFilters > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedCategory && (
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/30 font-medium">
                🎭 {categories.find((c) => c.slug === selectedCategory)?.name}
                <button type="button" onClick={() => setSelectedCategory('')} className="hover:text-red-200 font-bold ml-0.5">×</button>
              </span>
            )}
            {selectedCity && (
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/30 font-medium">
                🏙️ {cities.find((c) => c.slug === selectedCity)?.name}
                <button type="button" onClick={() => setSelectedCity('')} className="hover:text-red-200 font-bold ml-0.5">×</button>
              </span>
            )}
            {selectedLocality && (
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/30 font-medium">
                📍 {localities.find((l) => l.slug === selectedLocality)?.name}
                <button type="button" onClick={() => setSelectedLocality('')} className="hover:text-red-200 font-bold ml-0.5">×</button>
              </span>
            )}
            {selectedPrice && (
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/30 font-medium">
                💰 {PRICE_RANGES.find((p) => p.value === selectedPrice)?.label}
                <button type="button" onClick={() => setSelectedPrice('')} className="hover:text-red-200 font-bold ml-0.5">×</button>
              </span>
            )}
            <button
              type="button"
              onClick={() => { setSelectedCategory(''); setSelectedCity(''); setSelectedLocality(''); setSelectedPrice(''); }}
              className="inline-flex items-center gap-1 bg-white/10 text-white/70 text-xs px-3 py-1.5 rounded-full border border-white/20 hover:bg-white/20 transition"
            >
              Clear all ×
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
