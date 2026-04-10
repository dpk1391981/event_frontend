'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { categoriesApi } from '@/lib/api';
import { buildSeoUrlFromCategory } from '@/lib/seo-urls';
import { Category } from '@/types';

// Trending score: budgetAllocationPercent (how often used in plans) + inverse sortOrder
function trendingScore(cat: Category, idx: number): number {
  const budgetWeight = Number(cat.budgetAllocationPercent || 0);
  const order = cat.sortOrder !== undefined ? cat.sortOrder : idx;
  const orderScore = Math.max(0, 100 - order * 8);
  return budgetWeight * 0.65 + orderScore * 0.35;
}

const PALETTES = [
  { gradient: 'from-rose-500 to-pink-600',     light: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    ring: 'ring-rose-400'    },
  { gradient: 'from-blue-500 to-indigo-600',   light: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    ring: 'ring-blue-400'    },
  { gradient: 'from-orange-500 to-amber-500',  light: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  ring: 'ring-orange-400'  },
  { gradient: 'from-teal-500 to-cyan-600',     light: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200',    ring: 'ring-teal-400'    },
  { gradient: 'from-purple-500 to-violet-600', light: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200',  ring: 'ring-purple-400'  },
];

const TRENDING_LABELS = ['🔥 #1 Trending', '⭐ Popular', '📈 Rising', '✨ In Demand', '💡 Top Pick'];

export default function CategorySection() {
  const { selectedCity } = useAppStore();
  const [all, setAll] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const citySlug = selectedCity?.slug || '';
  const cityName = selectedCity?.name || 'Your City';

  useEffect(() => {
    categoriesApi.getAll()
      .then((res: unknown) => {
        // API may return [] directly or { data: [] } — handle both
        const list: Category[] = Array.isArray(res)
          ? res
          : Array.isArray((res as { data?: unknown })?.data)
          ? (res as { data: Category[] }).data
          : [];
        // Include all active categories; filter by type only when field is present
        const cats = list.filter(c =>
          c.isActive !== false && (!c.type || c.type === 'service'),
        );
        setAll(cats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Score and take top 5 trending categories
  const trending = [...all]
    .map((cat, idx) => ({ cat, score: trendingScore(cat, idx) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ cat }) => cat);

  if (loading) {
    return (
      <section className="py-10 bg-white">
        <div className="max-w-xl mx-auto px-4">
          <div className="h-6 w-40 bg-gray-100 rounded-full animate-pulse mb-4 mx-auto" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`h-24 bg-gray-100 rounded-2xl animate-pulse ${i === 4 ? 'col-span-2' : ''}`} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (trending.length === 0) return null;

  return (
    <section className="py-10 bg-white">
      <div className="max-w-xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest mb-0.5">Categories</p>
            <h2 className="text-xl font-extrabold text-gray-900 leading-tight">
              Trending Services
              {selectedCity && <span className="text-gray-400 font-semibold"> in {cityName}</span>}
            </h2>
          </div>
          <Link
            href="/search"
            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-0.5 shrink-0"
          >
            View all
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Top 5 grid — 2 cols, last item spans full width if odd */}
        <div className="grid grid-cols-2 gap-3">
          {trending.map((cat, idx) => {
            const palette = PALETTES[idx % PALETTES.length];
            const isLast = idx === trending.length - 1 && trending.length % 2 !== 0;
            const href = citySlug
              ? buildSeoUrlFromCategory(cat, citySlug)
              : `/search?q=${encodeURIComponent(cat.name)}&nlp=1`;

            return (
              <Link
                key={cat.id}
                href={href}
                className={`group relative bg-white border-2 ${palette.border} rounded-2xl p-4 flex flex-col gap-3 active:scale-[0.97] transition-all duration-150 overflow-hidden ${isLast ? 'col-span-2 flex-row items-center' : ''}`}
              >
                {/* Trending label badge */}
                <span className={`absolute top-3 right-3 text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full ${palette.light} ${palette.text}`}>
                  {TRENDING_LABELS[idx]}
                </span>

                {/* Icon */}
                <div className={`w-12 h-12 bg-gradient-to-br ${palette.gradient} rounded-xl flex items-center justify-center shadow-md group-active:scale-95 transition-transform shrink-0`}>
                  {cat.icon && cat.icon.length <= 4 ? (
                    <span className="text-2xl leading-none">{cat.icon}</span>
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  )}
                </div>

                {/* Name & arrow */}
                <div className={`min-w-0 ${isLast ? 'flex-1' : ''}`}>
                  <h3 className="font-extrabold text-gray-900 text-sm leading-tight mb-0.5 line-clamp-1 group-active:text-red-700 transition-colors pr-6">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-xs text-gray-400 line-clamp-1 hidden sm:block">{cat.description}</p>
                  )}
                  <span className="text-xs text-gray-400 flex items-center gap-0.5 mt-1">
                    Explore
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* SEO cross-city links — visually subtle */}
        {citySlug && all.length > 5 && (
          <div className="mt-5 flex flex-wrap gap-2 justify-center">
            {all.slice(5, 8).map(cat => (
              <Link
                key={cat.id}
                href={citySlug ? buildSeoUrlFromCategory(cat, citySlug) : `/search?q=${encodeURIComponent(cat.name)}&nlp=1`}
                className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-full transition bg-white"
              >
                {cat.name}
              </Link>
            ))}
            {all.length > 8 && (
              <Link href="/search" className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 px-3 py-1.5 rounded-full transition bg-white">
                +{all.length - 8} more
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
