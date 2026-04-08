'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { categoriesApi, locationsApi } from '@/lib/api';
import { buildSeoUrlFromCategory } from '@/lib/seo-urls';
import { Category, City } from '@/types';

/** Cycling palette for category cards — index mod length */
const PALETTES = [
  { gradient: 'from-rose-500 to-pink-600',    lightBg: 'bg-rose-50',    lightText: 'text-rose-700',    border: 'border-rose-200 hover:border-rose-400' },
  { gradient: 'from-blue-500 to-indigo-600',  lightBg: 'bg-blue-50',    lightText: 'text-blue-700',    border: 'border-blue-200 hover:border-blue-400' },
  { gradient: 'from-orange-500 to-amber-500', lightBg: 'bg-orange-50',  lightText: 'text-orange-700',  border: 'border-orange-200 hover:border-orange-400' },
  { gradient: 'from-teal-500 to-cyan-600',    lightBg: 'bg-teal-50',    lightText: 'text-teal-700',    border: 'border-teal-200 hover:border-teal-400' },
  { gradient: 'from-emerald-500 to-green-600',lightBg: 'bg-emerald-50', lightText: 'text-emerald-700', border: 'border-emerald-200 hover:border-emerald-400' },
  { gradient: 'from-purple-500 to-violet-600',lightBg: 'bg-purple-50',  lightText: 'text-purple-700',  border: 'border-purple-200 hover:border-purple-400' },
  { gradient: 'from-pink-500 to-fuchsia-600', lightBg: 'bg-pink-50',    lightText: 'text-pink-700',    border: 'border-pink-200 hover:border-pink-400' },
  { gradient: 'from-sky-500 to-blue-600',     lightBg: 'bg-sky-50',     lightText: 'text-sky-700',     border: 'border-sky-200 hover:border-sky-400' },
];

function CategoryIcon({ icon, className = 'w-6 h-6 text-white' }: { icon?: string; className?: string }) {
  // If icon is an emoji or short string, render as text
  if (icon && icon.length <= 4) {
    return <span className="text-2xl leading-none">{icon}</span>;
  }
  // Default generic icon
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

export default function CategorySection() {
  const { selectedCity } = useAppStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  const citySlug = selectedCity?.slug || '';
  const cityName = selectedCity?.name || 'Your City';

  useEffect(() => {
    Promise.all([
      categoriesApi.getAll(),
      locationsApi.getCities(),
    ]).then(([cats, ctys]) => {
      setCategories(((cats as unknown) as Category[]).filter((c) => c.isActive !== false));
      setCities((ctys as unknown) as City[]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Cross-city links: pair first few cities with first few categories
  const crossCityLinks = (() => {
    const links: { city: City; cat: Category }[] = [];
    const otherCities = cities.filter((c) => c.id !== selectedCity?.id).slice(0, 6);
    otherCities.forEach((city, i) => {
      const cat = categories[i % categories.length];
      if (cat) links.push({ city, cat });
    });
    return links;
  })();

  if (loading) {
    return (
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-extrabold text-red-500 uppercase tracking-widest mb-2">Browse by Category</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
            Find the Right Vendor for
            <br /><span className="text-red-500">Every Occasion</span>
          </h2>
          <p className="text-gray-500 text-sm">
            Explore verified vendors across all event categories{selectedCity ? ` in ${cityName}` : ''}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, idx) => {
            const palette = PALETTES[idx % PALETTES.length];
            const href = citySlug
              ? buildSeoUrlFromCategory(cat, citySlug)
              : `/search?q=${encodeURIComponent(cat.name)}&nlp=1`;

            return (
              <Link
                key={cat.id}
                href={href}
                className={`group bg-white border-2 ${palette.border} rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg block`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${palette.gradient} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform shrink-0`}>
                    <CategoryIcon icon={cat.icon} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-900 group-hover:text-red-700 transition text-base">{cat.name}</h3>
                  </div>
                </div>
                {cat.description && (
                  <p className="text-xs text-gray-500 leading-relaxed mb-3 hidden sm:block line-clamp-2">{cat.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-auto flex items-center gap-1 group-hover:text-red-500 transition">
                  {cat.name}{citySlug ? ` in ${cityName}` : ''}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </p>
              </Link>
            );
          })}
        </div>

        {/* Cross-city SEO links — generated dynamically from DB cities + categories */}
        {crossCityLinks.length > 0 && (
          <div className="mt-10 pt-8 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 text-center">Popular in Other Cities</p>
            <div className="flex flex-wrap justify-center gap-3">
              {crossCityLinks.map(({ city, cat }) => (
                <Link
                  key={`${cat.slug}-${city.slug}`}
                  href={buildSeoUrlFromCategory(cat, city.slug)}
                  className="text-xs text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-full transition bg-white hover:bg-red-50"
                >
                  {cat.name} in {city.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
