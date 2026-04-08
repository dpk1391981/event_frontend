'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const GROUPED_SUGGESTIONS = [
  {
    group: 'Popular Events',
    icon: '🎊',
    items: [
      { text: 'Wedding venue in Noida, 200 guests, ₹5L', tags: ['venue', 'wedding'] },
      { text: 'Birthday party photographer near me', tags: ['photography', 'birthday'] },
      { text: 'Corporate event venue ₹1L', tags: ['venue', 'corporate'] },
    ],
  },
  {
    group: 'Top Services',
    icon: '✨',
    items: [
      { text: 'Caterer for wedding reception ₹50k', tags: ['catering'] },
      { text: 'DJ for wedding night', tags: ['dj', 'music'] },
      { text: 'Mehendi artist for 100 guests', tags: ['mehendi'] },
      { text: 'Bridal makeup artist Noida', tags: ['makeup'] },
    ],
  },
];

// Real-time intent parsing from query text
function parseIntent(query: string) {
  const hints: { label: string; color: string }[] = [];
  const q = query.toLowerCase();

  const eventTypes: Record<string, string> = {
    wedding: '💍 Wedding', birthday: '🎂 Birthday', corporate: '💼 Corporate',
    anniversary: '💑 Anniversary', reception: '🥂 Reception', 'baby shower': '👶 Baby Shower',
  };
  for (const [key, label] of Object.entries(eventTypes)) {
    if (q.includes(key)) hints.push({ label, color: 'bg-red-100 text-red-700' });
  }

  const budgetMatch = query.match(/₹\s*(\d+(?:\.\d+)?)\s*([lkLK])?/);
  if (budgetMatch) {
    const num = parseFloat(budgetMatch[1]);
    const unit = budgetMatch[2]?.toLowerCase();
    const amount = unit === 'l' ? num * 100000 : unit === 'k' ? num * 1000 : num;
    hints.push({ label: `💰 ₹${(amount / 1000).toFixed(0)}K budget`, color: 'bg-green-100 text-green-700' });
  }

  const guestMatch = query.match(/(\d+)\s*(?:guests?|people|persons?|pax)/i);
  if (guestMatch) {
    hints.push({ label: `👥 ${guestMatch[1]} guests`, color: 'bg-blue-100 text-blue-700' });
  }

  const cities = ['noida', 'delhi', 'gurgaon', 'ghaziabad', 'faridabad', 'greater noida', 'mumbai', 'bangalore'];
  for (const city of cities) {
    if (q.includes(city)) {
      hints.push({ label: `📍 ${city.charAt(0).toUpperCase() + city.slice(1)}`, color: 'bg-orange-100 text-orange-700' });
      break;
    }
  }

  return hints;
}

const RECENT_SEARCHES_KEY = 'eh_recent_searches';

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]').slice(0, 4);
  } catch { return []; }
}

function saveRecentSearch(q: string) {
  if (typeof window === 'undefined') return;
  try {
    const prev = getRecentSearches().filter((s) => s !== q);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([q, ...prev].slice(0, 8)));
  } catch { /* ignore */ }
}

interface Props {
  initialQuery?: string;
  large?: boolean;
  onSearch?: (q: string) => void;
}

export default function SearchBar({ initialQuery = '', large = false, onSearch }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const intentHints = query.trim().length > 2 ? parseIntent(query) : [];

  const allSuggestions = GROUPED_SUGGESTIONS.flatMap((g) => g.items.map((i) => i.text));

  // Filter suggestions based on query
  const filteredGroups = query.trim()
    ? GROUPED_SUGGESTIONS
        .map((g) => ({
          ...g,
          items: g.items.filter((i) => i.text.toLowerCase().includes(query.toLowerCase())),
        }))
        .filter((g) => g.items.length > 0)
    : GROUPED_SUGGESTIONS;

  const flatFiltered = filteredGroups.flatMap((g) => g.items.map((i) => i.text));

  const showDropdown = focused && (query.length === 0 || filteredGroups.length > 0 || recentSearches.length > 0);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, [focused]);

  const submit = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    setFocused(false);
    setActiveIdx(-1);
    if (onSearch) {
      onSearch(trimmed);
    } else {
      router.push(`/search?q=${encodeURIComponent(trimmed)}&nlp=1`);
    }
  }, [onSearch, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(query);
  };

  const handleSuggestion = (s: string) => {
    setQuery(s);
    submit(s);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;
    const items = query.trim() ? flatFiltered : [...recentSearches, ...allSuggestions.slice(0, 5)];
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      handleSuggestion(items[activeIdx]);
    } else if (e.key === 'Escape') {
      setFocused(false);
      setActiveIdx(-1);
    }
  };

  const clearQuery = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className={`flex items-center bg-white rounded-2xl shadow-lg border-2 overflow-hidden transition-colors ${
          focused ? 'border-red-400' : 'border-gray-200 hover:border-gray-300'
        } ${large ? 'h-14 sm:h-16' : 'h-12'}`}>
          {/* Search icon */}
          <div className={`pl-4 transition-colors ${focused ? 'text-red-500' : 'text-gray-400'}`}>
            <svg className={`${large ? 'w-6 h-6' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(-1); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => { setFocused(false); setActiveIdx(-1); }, 180)}
            onKeyDown={handleKeyDown}
            placeholder="Search — try &quot;Wedding photographer Noida ₹50k&quot;"
            className={`flex-1 px-3 bg-transparent outline-none text-gray-800 placeholder-gray-400 ${large ? 'text-base sm:text-lg' : 'text-sm'}`}
            aria-label="Search for event vendors and services"
            autoComplete="off"
          />

          {/* Clear button */}
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="p-2 text-gray-400 hover:text-gray-600 transition"
              tabIndex={-1}
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <button
            type="submit"
            className={`bg-red-600 text-white font-semibold hover:bg-red-700 active:bg-red-800 transition px-5 h-full flex items-center gap-2 shrink-0 ${large ? 'text-base' : 'text-sm'}`}
            aria-label="Search"
          >
            <span className="hidden sm:inline">Search</span>
            <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        {/* Real-time intent hints */}
        {intentHints.length > 0 && focused && (
          <div className="absolute left-0 right-0 -bottom-8 flex gap-2 flex-wrap">
            {intentHints.map((h, i) => (
              <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-medium ${h.color}`}>
                {h.label}
              </span>
            ))}
          </div>
        )}
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Recent searches */}
          {!query.trim() && recentSearches.length > 0 && (
            <div className="border-b border-gray-50">
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Recent</p>
              {recentSearches.map((s, i) => (
                <button
                  key={i}
                  onMouseDown={() => handleSuggestion(s)}
                  className={`w-full text-left px-4 py-2.5 text-sm text-gray-700 flex items-center gap-3 transition ${
                    activeIdx === i ? 'bg-red-50 text-red-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="truncate">{s}</span>
                </button>
              ))}
            </div>
          )}

          {/* Grouped suggestions */}
          {filteredGroups.map((group, gi) => (
            <div key={gi} className={gi < filteredGroups.length - 1 ? 'border-b border-gray-50' : ''}>
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                {group.icon} {group.group}
              </p>
              {group.items.map((item, ii) => {
                const flatIdx = (recentSearches.length > 0 && !query.trim() ? recentSearches.length : 0) +
                  filteredGroups.slice(0, gi).reduce((acc, g) => acc + g.items.length, 0) + ii;
                return (
                  <button
                    key={ii}
                    onMouseDown={() => handleSuggestion(item.text)}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-start gap-3 transition ${
                      activeIdx === flatIdx ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>{item.text}</span>
                  </button>
                );
              })}
            </div>
          ))}

          {/* Keyboard hint */}
          <div className="px-4 py-2 bg-gray-50 flex items-center gap-4 text-[10px] text-gray-400">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>Esc close</span>
            <span className="ml-auto flex items-center gap-1">🤖 AI-powered search</span>
          </div>
        </div>
      )}
    </div>
  );
}
