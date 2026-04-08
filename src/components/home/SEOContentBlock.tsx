'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { buildSeoUrlFromCategory, buildCityEventsUrl } from '@/lib/seo-urls';
import { categoriesApi, locationsApi } from '@/lib/api';
import { Category, City } from '@/types';
import { ChevronRightIcon, CheckCircleIcon, StarIcon, LocationIcon, ClipboardIcon, SearchIcon } from '@/components/ui/Icon';

function ZapIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
}

const TRUST = [
  { Icon: CheckCircleIcon, title: '2000+ Vendors',  desc: 'Verified across India' },
  { Icon: StarIcon,        title: '4.8/5 Rating',   desc: 'From 50,000+ reviews' },
  { Icon: ZapIcon,         title: '2hr Response',   desc: 'Average quote turnaround' },
  { Icon: CheckCircleIcon, title: '100% Free',      desc: 'No fees, no commissions' },
];

/** Event categories commonly used for plan links */
const EVENT_TYPES = ['wedding', 'birthday', 'corporate', 'anniversary', 'engagement'];

export default function SEOContentBlock() {
  const { selectedCity } = useAppStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    Promise.all([
      categoriesApi.getAll(),
      locationsApi.getCities(),
    ]).then(([cats, ctys]) => {
      setCategories(((cats as unknown) as Category[]).filter((c) => c.isActive !== false));
      setCities((ctys as unknown) as City[]);
    }).catch(() => {});
  }, []);

  const citySlug = selectedCity?.slug || '';
  const cityName = selectedCity?.name || '';

  // Heading and subtext
  const heading = cityName
    ? `Top Event Vendors in ${cityName}`
    : 'Top Event Vendors Across India';
  const subtext = cityName
    ? `PlanToday connects you with 2000+ verified vendors in ${cityName}. Find the perfect photographer, caterer, venue, and more for any occasion.`
    : 'PlanToday connects you with 2000+ verified vendors across India. Find the perfect photographer, caterer, venue, and more for any occasion.';

  // Highlights: categories × selected city (or pair each cat with a city if no city selected)
  const highlights = (() => {
    if (!categories.length) return [];
    if (citySlug) {
      // Show all service categories for selected city
      return categories.slice(0, 6).map((cat) => ({
        cat,
        citySlug,
        cityName: cityName,
        title: `${cat.name} in ${cityName}`,
        desc: cat.description || `${cat.name} services in ${cityName}`,
      }));
    }
    // No city: pair each category with a different city
    return categories.slice(0, 6).map((cat, i) => {
      const city = cities[i % cities.length];
      return {
        cat,
        citySlug: city?.slug || '',
        cityName: city?.name || '',
        title: city ? `${cat.name} in ${city.name}` : cat.name,
        desc: cat.description || `${cat.name} services`,
      };
    });
  })();

  // Popular plan links — event categories × top cities
  const popularPlans = (() => {
    const plans: { label: string; href: string }[] = [];
    const eventCats = categories.filter((c) => EVENT_TYPES.includes(c.slug)).slice(0, 4);
    const topCities = cities.slice(0, 2);
    for (const cat of eventCats) {
      for (const city of topCities) {
        plans.push({
          label: `${cat.name} in ${city.name}`,
          href: `/plan?eventType=${cat.slug}&cityId=${city.id}`,
        });
      }
    }
    return plans.slice(0, 8);
  })();

  // Popular searches — categories × cities
  const popularSearches = (() => {
    const searches: { label: string; href: string }[] = [];
    const topCities = cities.slice(0, 3);
    const topCats = categories.slice(0, 4);
    for (const cat of topCats) {
      for (const city of topCities) {
        searches.push({
          label: `${cat.name} in ${city.name}`,
          href: buildSeoUrlFromCategory(cat, city.slug),
        });
      }
    }
    return searches.slice(0, 10);
  })();

  return (
    <section className="py-14 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="max-w-3xl mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">{heading}</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{subtext}</p>
        </div>

        {/* Highlights grid */}
        {highlights.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
            {highlights.map((item) => (
              <Link
                key={`${item.cat.id}-${item.citySlug}`}
                href={item.citySlug ? buildSeoUrlFromCategory(item.cat, item.citySlug) : `/search?q=${encodeURIComponent(item.cat.name)}&nlp=1`}
                className="flex items-center gap-4 bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-red-200 rounded-2xl p-4 transition group"
              >
                <div className="w-10 h-10 bg-red-100 group-hover:bg-red-200 rounded-xl flex items-center justify-center transition shrink-0 text-xl">
                  {item.cat.icon && item.cat.icon.length <= 4
                    ? item.cat.icon
                    : <span className="text-red-600 text-xs font-bold">{item.cat.name[0]}</span>}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 group-hover:text-red-700 transition">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.desc}</p>
                </div>
                <ChevronRightIcon className="w-4 h-4 text-gray-300 group-hover:text-red-400 ml-auto shrink-0 transition" />
              </Link>
            ))}
          </div>
        )}

        {/* Browse Events by City — show when no city selected */}
        {!citySlug && cities.length > 0 && (
          <div className="mb-10">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Browse Events by City</p>
            <div className="flex flex-wrap gap-2">
              {cities.map((c) => (
                <Link
                  key={c.id}
                  href={buildCityEventsUrl(c.slug)}
                  className="text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-full hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition bg-white shadow-sm font-medium flex items-center gap-1.5"
                >
                  <LocationIcon className="w-3 h-3 text-red-400" />
                  Events in {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Popular Event Plans */}
        {popularPlans.length > 0 && (
          <div className="mb-10">
            <h3 className="text-sm font-extrabold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
                <ClipboardIcon className="w-3.5 h-3.5 text-red-500" />
              </span>
              Popular Event Plans
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {popularPlans.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:border-red-200 hover:from-red-50 rounded-xl px-4 py-3 transition group"
                >
                  <ClipboardIcon className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-red-700 transition leading-tight">{p.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Popular searches */}
        {popularSearches.length > 0 && (
          <div>
            <h3 className="text-sm font-extrabold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
                <SearchIcon className="w-3.5 h-3.5 text-red-500" />
              </span>
              Popular Searches
            </h3>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="text-xs border border-gray-200 text-gray-600 px-3.5 py-2 rounded-full hover:border-red-400 hover:text-red-700 hover:bg-red-50 transition bg-white shadow-sm"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Trust signals */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-gray-100">
          {TRUST.map((t) => (
            <div key={t.title} className="text-center">
              <div className="flex justify-center mb-2 text-red-500">
                <t.Icon className="w-7 h-7" />
              </div>
              <p className="font-extrabold text-gray-900 text-sm">{t.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
