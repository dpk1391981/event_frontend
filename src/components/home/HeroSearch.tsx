'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { locationsApi, categoriesApi } from '@/lib/api';
import { City, Locality, Category } from '@/types';
import { useAppStore } from '@/store/useAppStore';

// ── Hinglish NLP ─────────────────────────────────────────────────────────────

const EVENT_KEYWORDS: Record<string, string> = {
  shaadi: 'wedding', wedding: 'wedding', shadi: 'wedding', vivah: 'wedding',
  birthday: 'birthday', bday: 'birthday', janamdin: 'birthday',
  anniversary: 'anniversary',
  reception: 'reception',
  engagement: 'engagement', sagai: 'engagement',
  corporate: 'corporate', conference: 'corporate', seminar: 'corporate',
  'baby shower': 'baby-shower',
  puja: 'puja-ceremony', ceremony: 'puja-ceremony', pooja: 'puja-ceremony',
  sports: 'sports',
};

const CATEGORY_KEYWORDS: Record<string, string> = {
  photographer: 'photography', photography: 'photography', photo: 'photography',
  caterer: 'catering', catering: 'catering', food: 'catering', khana: 'catering',
  venue: 'venue', hall: 'venue', banquet: 'venue', farmhouse: 'venue',
  decorator: 'decoration', decoration: 'decoration', decor: 'decoration', sajawat: 'decoration',
  dj: 'dj-music', music: 'dj-music', band: 'dj-music',
  makeup: 'makeup', beauty: 'makeup',
  mehndi: 'mehendi', mehendi: 'mehendi', henna: 'mehendi',
  choreographer: 'choreography', choreography: 'choreography', dance: 'choreography',
  pandit: 'puja-ceremony', priest: 'puja-ceremony',
};

const BUDGET_PATTERNS: { re: RegExp; mult: number }[] = [
  { re: /under\s*₹?\s*(\d+)\s*l(?:akh)?/i, mult: 100000 },
  { re: /under\s*₹?\s*(\d+)\s*k/i, mult: 1000 },
  { re: /₹\s*(\d+)\s*l(?:akh)?/i, mult: 100000 },
  { re: /₹\s*(\d+)\s*k/i, mult: 1000 },
  { re: /(\d+)\s*l(?:akh)?\s*budget/i, mult: 100000 },
  { re: /(\d+)k\s*budget/i, mult: 1000 },
  { re: /budget\s*(?:of|:)?\s*₹?\s*(\d+)\s*k/i, mult: 1000 },
  { re: /budget\s*(?:of|:)?\s*₹?\s*(\d+)\s*l/i, mult: 100000 },
];

const GUEST_PATTERNS: RegExp[] = [
  /(\d+)\s*(?:guests?|log|logon|pax|people|persons?)/i,
  /(\d+)\s*logo?n?\s*ke\s*liye/i,
];

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
  apr: 3, april: 3, may: 4, jun: 5, june: 5,
  jul: 6, july: 6, aug: 7, august: 7, sep: 8, september: 8,
  oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

const TIME_KEYWORDS: Record<string, string> = {
  morning: 'morning', subah: 'morning',
  afternoon: 'afternoon', dopahar: 'afternoon',
  evening: 'evening', shaam: 'evening', sham: 'evening',
  night: 'evening', raat: 'evening',
  'full day': 'full', fullday: 'full',
};

export interface ParsedIntent {
  eventType?: string;
  categorySlug?: string;
  budget?: number;
  city?: string;
  guestCount?: number;
  eventDate?: string;
  eventTime?: string;
}

function parseHinglishIntent(text: string, knownCities: City[]): ParsedIntent {
  const lower = text.toLowerCase().trim();
  const intent: ParsedIntent = {};

  for (const [kw, val] of Object.entries(EVENT_KEYWORDS)) {
    if (lower.includes(kw)) { intent.eventType = val; break; }
  }

  for (const [kw, val] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(kw)) { intent.categorySlug = val; break; }
  }

  for (const { re, mult } of BUDGET_PATTERNS) {
    const m = lower.match(re);
    if (m) { intent.budget = parseFloat(m[1]) * mult; break; }
  }

  for (const re of GUEST_PATTERNS) {
    const m = lower.match(re);
    if (m) { intent.guestCount = parseInt(m[1], 10); break; }
  }

  for (const [kw, val] of Object.entries(TIME_KEYWORDS)) {
    if (lower.includes(kw)) { intent.eventTime = val; break; }
  }

  // Date: "12 december" or "december 12"
  const dayMonthRe = /(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)/i;
  const monthDayRe = /(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})/i;
  let dateMatch = lower.match(dayMonthRe);
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const monthKey = dateMatch[2].substring(0, 3).toLowerCase();
    const monthNum = MONTHS[monthKey];
    if (monthNum !== undefined && day >= 1 && day <= 31) {
      const year = new Date().getFullYear();
      const d = new Date(year, monthNum, day);
      if (d < new Date()) d.setFullYear(year + 1);
      intent.eventDate = d.toISOString().substring(0, 10);
    }
  } else {
    dateMatch = lower.match(monthDayRe);
    if (dateMatch) {
      const monthKey = dateMatch[1].substring(0, 3).toLowerCase();
      const day = parseInt(dateMatch[2]);
      const monthNum = MONTHS[monthKey];
      if (monthNum !== undefined && day >= 1 && day <= 31) {
        const year = new Date().getFullYear();
        const d = new Date(year, monthNum, day);
        if (d < new Date()) d.setFullYear(year + 1);
        intent.eventDate = d.toISOString().substring(0, 10);
      }
    }
  }

  for (const city of knownCities) {
    if (lower.includes(city.name.toLowerCase()) || lower.includes(city.slug.toLowerCase())) {
      intent.city = city.slug;
      break;
    }
  }

  return intent;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PRICE_RANGES = [
  { label: 'Any Budget', value: '' },
  { label: 'Under ₹25K', value: '25000' },
  { label: 'Under ₹50K', value: '50000' },
  { label: 'Under ₹1L', value: '100000' },
  { label: 'Under ₹2L', value: '200000' },
  { label: 'Under ₹5L', value: '500000' },
];

const TIME_SLOTS = [
  { value: '', label: 'Any Time', icon: '🕐' },
  { value: 'morning', label: 'Morning', icon: '🌅' },
  { value: 'afternoon', label: 'Afternoon', icon: '☀️' },
  { value: 'evening', label: 'Evening', icon: '🌆' },
  { value: 'full', label: 'Full Day', icon: '📅' },
];

const NLP_EXAMPLES = [
  'shaadi photographer noida under 50k',
  'birthday caterer gurgaon 200 guests',
  'wedding venue delhi 12 december',
  'DJ for sangeet night ₹30k',
  'makeup artist faridabad evening',
];

// ── Subcomponents ─────────────────────────────────────────────────────────────

function IntentChip({ icon, label, onRemove }: { icon: string; label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
      {icon} {label}
      <button type="button" onClick={onRemove} className="ml-0.5 hover:text-red-900 font-black">×</button>
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function HeroSearch({ initialCitySlug }: { initialCitySlug?: string } = {}) {
  const router = useRouter();
  const storeCity = useAppStore((s) => s.selectedCity);

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [intent, setIntent] = useState<ParsedIntent>({});

  const [cities, setCities] = useState<City[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedLocality, setSelectedLocality] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [guestCount, setGuestCount] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    categoriesApi.getAll('service').then((d: unknown) => setCategories(d as Category[])).catch(() => {});
    locationsApi.getCities().then((d: unknown) => setCities(d as City[])).catch(() => {});
  }, []);

  // Pre-fill city from prop or Zustand store
  useEffect(() => {
    if (initialCitySlug && !selectedCity) {
      setSelectedCity(initialCitySlug);
    } else if (storeCity?.slug && !selectedCity && !initialCitySlug) {
      setSelectedCity(storeCity.slug);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeCity?.slug, initialCitySlug]);

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

  // Live NLP parsing on every keystroke
  useEffect(() => {
    if (!query.trim() || cities.length === 0) { setIntent({}); return; }
    const parsed = parseHinglishIntent(query, cities);
    setIntent(parsed);
    // Auto-fill structured filters from detected intent
    if (parsed.city && !selectedCity) setSelectedCity(parsed.city);
    if (parsed.eventDate && !eventDate) setEventDate(parsed.eventDate);
    if (parsed.eventTime && !eventTime) setEventTime(parsed.eventTime);
    if (parsed.budget && !selectedPrice) {
      const match = PRICE_RANGES.find((p) => p.value && parseInt(p.value) >= (parsed.budget ?? 0));
      if (match) setSelectedPrice(match.value);
    }
    if (parsed.guestCount && !guestCount) setGuestCount(String(parsed.guestCount));
    if (parsed.categorySlug && !selectedCategory) setSelectedCategory(parsed.categorySlug);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, cities.length]);

  // Dynamic placeholder
  const cityLabel = cities.find((c) => c.slug === selectedCity)?.name || storeCity?.name || cities[0]?.name || 'your city';
  const suggestions = categories.length > 0
    ? [
        `${categories[0]?.name} for wedding in ${cityLabel}`,
        `Caterer for 200 guests ₹3L budget`,
        `Birthday party venue in ${cityLabel}`,
        `DJ for sangeet night ₹50k`,
        `${categories[1]?.name || 'Makeup artist'} in ${cityLabel}`,
        `Decorator for reception hall`,
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
    if (eventDate) params.set('eventDate', eventDate);
    if (eventTime) params.set('eventTime', eventTime);
    if (guestCount) params.set('guests', guestCount);
    router.push(`/search?${params.toString()}`);
  };

  const clearAll = () => {
    setQuery(''); setSelectedCategory(''); setSelectedCity('');
    setSelectedLocality(''); setSelectedPrice(''); setEventDate('');
    setEventTime(''); setGuestCount(''); setIntent({});
  };

  const activeFilters = [selectedCategory, selectedCity, selectedLocality, selectedPrice, eventDate].filter(Boolean).length;

  // Build intent chips for display
  const intentChips: { icon: string; label: string; key: keyof ParsedIntent }[] = [
    ...(intent.eventType ? [{ icon: '🎉', label: intent.eventType.replace(/-/g, ' '), key: 'eventType' as const }] : []),
    ...(intent.categorySlug ? [{ icon: '🎭', label: intent.categorySlug.replace(/-/g, ' '), key: 'categorySlug' as const }] : []),
    ...(intent.budget ? [{ icon: '💰', label: `Under ₹${intent.budget >= 100000 ? `${intent.budget / 100000}L` : `${intent.budget / 1000}K`}`, key: 'budget' as const }] : []),
    ...(intent.guestCount ? [{ icon: '👥', label: `${intent.guestCount} guests`, key: 'guestCount' as const }] : []),
    ...(intent.eventDate ? [{ icon: '📅', label: new Date(intent.eventDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), key: 'eventDate' as const }] : []),
    ...(intent.eventTime ? [{ icon: '⏰', label: intent.eventTime, key: 'eventTime' as const }] : []),
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSearch}>
        {/* Main search bar */}
        <div className={`flex items-center bg-white rounded-t-2xl overflow-hidden transition-all duration-300 ${
          focused
            ? 'shadow-2xl shadow-red-500/20 ring-2 ring-red-400'
            : 'shadow-xl shadow-black/20'
        } h-16 sm:h-18`}>
          <div className={`pl-5 pr-1 shrink-0 transition-colors ${focused ? 'text-red-500' : 'text-gray-400'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

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

          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setIntent({}); inputRef.current?.focus(); }}
              className="p-2 mr-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <div className="w-px h-8 bg-gray-200 shrink-0 hidden sm:block" />

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

        {/* Live NLP intent chips */}
        {intentChips.length > 0 && (
          <div className="bg-white border-t border-gray-100 px-4 py-2.5 flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mr-1">Detected:</span>
            {intentChips.map((chip) => (
              <IntentChip
                key={chip.key}
                icon={chip.icon}
                label={chip.label}
                onRemove={() => setIntent((prev) => ({ ...prev, [chip.key]: undefined }))}
              />
            ))}
          </div>
        )}

        {/* Structured filter row */}
        <div className="bg-white shadow-xl shadow-black/10 border-t border-gray-100 px-3 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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

        {/* Advanced toggle */}
        <div className="bg-white border-t border-gray-100 px-4 py-2.5 flex items-center justify-between rounded-b-2xl shadow-xl shadow-black/10">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-[11px] font-bold text-gray-500 hover:text-red-600 flex items-center gap-1.5 transition-colors"
          >
            <svg className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showAdvanced ? 'Hide advanced filters' : 'Advanced filters — date, time, guests'}
          </button>
          {activeFilters > 0 && (
            <button type="button" onClick={clearAll} className="text-[11px] font-bold text-red-500 hover:text-red-700">
              Clear all ×
            </button>
          )}
        </div>

        {/* Advanced panel: date, time, guest count */}
        {showAdvanced && (
          <div className="bg-white rounded-b-xl border-t border-gray-100 px-4 py-3 flex flex-wrap gap-4 items-start">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest">📅 Event Date</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={eventDate}
                  min={new Date().toISOString().substring(0, 10)}
                  onChange={(e) => setEventDate(e.target.value)}
                  className={`border rounded-xl px-3 py-2 text-sm outline-none transition-all font-medium ${
                    eventDate ? 'border-red-300 text-red-700 bg-red-50' : 'border-gray-200 text-gray-600'
                  } focus:ring-2 focus:ring-red-100 focus:border-red-300`}
                />
                {eventDate && (
                  <button type="button" onClick={() => setEventDate('')} className="text-gray-400 hover:text-red-500 text-sm font-bold">×</button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest">👥 Guests</label>
              <input
                type="number"
                value={guestCount}
                min="1"
                max="10000"
                placeholder="e.g. 200"
                onChange={(e) => setGuestCount(e.target.value)}
                className={`border rounded-xl px-3 py-2 text-sm outline-none transition-all font-medium w-28 ${
                  guestCount ? 'border-red-300 text-red-700 bg-red-50' : 'border-gray-200 text-gray-600'
                } focus:ring-2 focus:ring-red-100 focus:border-red-300`}
              />
            </div>

            {eventDate && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest">⏰ Time Slot</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => setEventTime(slot.value === eventTime ? '' : slot.value)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border transition-all ${
                        eventTime === slot.value
                          ? 'bg-red-600 text-white border-red-600'
                          : 'border-gray-200 text-gray-600 hover:border-red-300'
                      }`}
                    >
                      {slot.icon} {slot.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="w-full pt-2 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 font-medium">
                🧠 Results ranked by:{' '}
                <span className="font-bold text-gray-500">Relevance + Availability + Package Match + Rating + Price Fit</span>
              </p>
            </div>
          </div>
        )}

        {/* Example query chips — shown when search bar is empty */}
        {!query && (
          <div className="mt-3 flex flex-wrap gap-2">
            {NLP_EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => { setQuery(ex); inputRef.current?.focus(); }}
                className="text-[11px] font-semibold text-white/80 bg-white/15 hover:bg-white/25 border border-white/25 px-3 py-1.5 rounded-full transition-all backdrop-blur-sm"
              >
                {ex}
              </button>
            ))}
          </div>
        )}

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
          </div>
        )}
      </form>
    </div>
  );
}
