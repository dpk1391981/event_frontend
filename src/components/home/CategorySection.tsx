'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { categoriesApi } from '@/lib/api';
import { buildSeoUrlFromCategory } from '@/lib/seo-urls';
import { Category } from '@/types';

const PALETTE = [
  { grad: 'from-rose-500 to-pink-600',     bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200'   },
  { grad: 'from-blue-500 to-indigo-600',   bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200'   },
  { grad: 'from-orange-500 to-amber-500',  bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
  { grad: 'from-teal-500 to-cyan-600',     bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200'   },
  { grad: 'from-purple-500 to-violet-600', bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200' },
  { grad: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200'},
  { grad: 'from-red-500 to-rose-600',      bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200'    },
  { grad: 'from-sky-500 to-blue-600',      bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200'    },
  { grad: 'from-amber-500 to-yellow-500',  bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'  },
  { grad: 'from-fuchsia-500 to-pink-600',  bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200'},
];

export default function CategorySection() {
  const { selectedCity } = useAppStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);

  const scrollRef            = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft]   = useState(false);
  const [canRight, setCanRight] = useState(true);

  const citySlug = selectedCity?.slug || '';
  const cityName = selectedCity?.name || '';

  useEffect(() => {
    categoriesApi.getAll()
      .then((res: unknown) => {
        const list: Category[] = Array.isArray(res)
          ? res
          : Array.isArray((res as any)?.data)
          ? (res as any).data
          : [];
        // Show service categories first (they have packages), then event types
        const services = list.filter(c => c.isActive !== false && c.type === 'service');
        const events   = list.filter(c => c.isActive !== false && c.type === 'event');
        setCategories([...services, ...events]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScroll();
    el.addEventListener('scroll', updateScroll, { passive: true });
    return () => el.removeEventListener('scroll', updateScroll);
  }, [categories, updateScroll]);

  const scroll = (dir: 'l' | 'r') =>
    scrollRef.current?.scrollBy({ left: dir === 'r' ? 480 : -480, behavior: 'smooth' });

  if (loading) {
    return (
      <section className="py-10 sm:py-14 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-6 w-48 bg-gray-200 rounded-full animate-pulse mb-6" />
          <div className="flex gap-3 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex-none w-[140px] h-[110px] bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="py-10 sm:py-14 bg-gray-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-5 sm:mb-6">
          <div>
            <p className="text-[11px] font-extrabold text-red-600 uppercase tracking-[0.2em] mb-1.5">
              Browse Categories
            </p>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 leading-tight">
              {cityName ? `Top Services in ${cityName}` : 'All Event Services'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {cityName
                ? `Find the best vendors for your event in ${cityName}`
                : 'Photography, catering, venues, decoration & more across all cities'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => scroll('l')} disabled={!canLeft}
              aria-label="Scroll left"
              className="hidden sm:flex w-9 h-9 rounded-full border border-gray-200 bg-white items-center justify-center text-gray-500 hover:border-red-300 hover:text-red-600 disabled:opacity-30 transition shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll('r')} disabled={!canRight}
              aria-label="Scroll right"
              className="hidden sm:flex w-9 h-9 rounded-full border border-gray-200 bg-white items-center justify-center text-gray-500 hover:border-red-300 hover:text-red-600 disabled:opacity-30 transition shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <Link
              href="/search"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-gray-700 border border-gray-200 bg-white px-4 py-2 rounded-xl hover:border-red-300 hover:text-red-600 transition whitespace-nowrap"
            >
              View all →
            </Link>
          </div>
        </div>

        {/* Scrollable track */}
        <div className="relative">
          {/* Left fade */}
          {canLeft && (
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-gray-50 to-transparent z-10" />
          )}
          {/* Right fade */}
          {canRight && (
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-50 to-transparent z-10" />
          )}

          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 pb-2"
          >
            {categories.map((cat, idx) => {
              const pal  = PALETTE[idx % PALETTE.length];
              const href = citySlug
                ? buildSeoUrlFromCategory(cat, citySlug)
                : `/search?q=${encodeURIComponent(cat.name)}&nlp=1`;

              return (
                <Link
                  key={cat.id}
                  href={href}
                  className={`group flex-none w-[130px] sm:w-[150px] snap-start rounded-2xl border-2 ${pal.border} bg-white hover:shadow-md hover:border-opacity-80 active:scale-[0.97] transition-all duration-150 overflow-hidden`}
                >
                  <div className="p-4 flex flex-col items-center text-center gap-2.5">
                    {/* Icon circle */}
                    <div className={`w-12 h-12 bg-gradient-to-br ${pal.grad} rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0`}>
                      {cat.icon && cat.icon.length <= 4 ? (
                        <span className="text-2xl leading-none">{cat.icon}</span>
                      ) : (
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      )}
                    </div>

                    {/* Name */}
                    <div>
                      <p className="font-extrabold text-gray-900 text-xs sm:text-sm leading-tight line-clamp-2 group-hover:text-red-700 transition-colors">
                        {cat.name}
                      </p>
                      {cat.type === 'service' && cat.budgetAllocationPercent && (
                        <p className={`text-[10px] font-bold mt-1 ${pal.text}`}>
                          ~{cat.budgetAllocationPercent}% budget
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom accent */}
                  <div className={`h-0.5 w-full bg-gradient-to-r ${pal.grad} opacity-60`} />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile "view all" */}
        <div className="mt-5 text-center sm:hidden">
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700"
          >
            View all services →
          </Link>
        </div>
      </div>
    </section>
  );
}
