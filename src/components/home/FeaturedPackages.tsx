'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { packagesApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import type { VendorPackage } from '@/types';

const TAG_COLORS: Record<string, string> = {
  budget:   'bg-emerald-100 text-emerald-700',
  standard: 'bg-blue-100 text-blue-700',
  premium:  'bg-purple-100 text-purple-700',
  luxury:   'bg-amber-100 text-amber-800',
};

function formatPrice(price: number) {
  if (price >= 100000) return `₹${(price / 100000).toFixed(price % 100000 === 0 ? 0 : 1)}L`;
  if (price >= 1000)   return `₹${Math.round(price / 1000)}K`;
  return `₹${price}`;
}

function PackageCard({ pkg }: { pkg: VendorPackage }) {
  return (
    <Link
      href={pkg.vendor?.slug ? `/vendor/${pkg.vendor.slug}` : '/search?q=packages+near+me&nlp=1'}
      className="group flex-none w-[260px] snap-start rounded-2xl border border-gray-200 bg-white hover:border-red-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
    >
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-red-500 to-rose-400" />

      <div className="p-5">
        {/* Badges row */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {pkg.category?.name && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {pkg.category.name}
            </span>
          )}
          {pkg.isBoosted && (
            <span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-extrabold text-amber-900 uppercase">
              ⚡ Boosted
            </span>
          )}
          {!pkg.isBoosted && pkg.isFeatured && (
            <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-extrabold text-white uppercase">
              ⭐ Featured
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-extrabold text-gray-900 leading-snug mb-1 group-hover:text-red-700 transition-colors line-clamp-2 text-[15px]">
          {pkg.title}
        </h3>

        {/* Vendor name */}
        {pkg.vendor?.businessName && (
          <p className="text-xs text-slate-500 mb-3 truncate">{pkg.vendor.businessName}</p>
        )}

        {/* Includes chips */}
        {pkg.includes && pkg.includes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {pkg.includes.slice(0, 3).map((item) => (
              <span
                key={item}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
              >
                {item}
              </span>
            ))}
            {pkg.includes.length > 3 && (
              <span className="text-[10px] font-medium text-slate-400 self-center">
                +{pkg.includes.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Price + city */}
        <div className="flex items-end justify-between pt-3 border-t border-gray-100">
          <div>
            {Number(pkg.originalPrice) > Number(pkg.price) && Number(pkg.savingsPercent) > 0 && (
              <p className="text-[10px] text-slate-400 line-through leading-none mb-0.5">
                {formatPrice(Number(pkg.originalPrice))}
              </p>
            )}
            <span className="text-base font-extrabold text-red-600 leading-none">
              {formatPrice(Number(pkg.price))}
              {pkg.priceType === 'per_person' && (
                <span className="text-xs font-semibold text-slate-500">/person</span>
              )}
            </span>
            {Number(pkg.savingsPercent) > 0 && (
              <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700">
                {Math.round(Number(pkg.savingsPercent))}% off
              </span>
            )}
          </div>

          <div className="text-right">
            {pkg.city?.name && (
              <p className="text-[11px] font-semibold text-slate-500">{pkg.city.name}</p>
            )}
            {pkg.tag && (
              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${TAG_COLORS[pkg.tag] ?? 'bg-gray-100 text-gray-600'}`}>
                {pkg.tag}
              </span>
            )}
            {pkg.leadsCount > 0 && (
              <p className="text-[10px] text-slate-400 mt-0.5">{pkg.leadsCount} enquiries</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="flex-none w-[260px] snap-start rounded-2xl border border-gray-200 bg-white overflow-hidden animate-pulse">
      <div className="h-1 w-full bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-5 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="flex gap-1">
          <div className="h-5 bg-gray-100 rounded-full w-16" />
          <div className="h-5 bg-gray-100 rounded-full w-20" />
          <div className="h-5 bg-gray-100 rounded-full w-12" />
        </div>
        <div className="flex justify-between items-end pt-3 border-t border-gray-100">
          <div className="h-6 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-100 rounded w-12" />
        </div>
      </div>
    </div>
  );
}

export default function FeaturedPackages() {
  const [packages, setPackages] = useState<VendorPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft]   = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedCity     = useAppStore((s) => s.selectedCity);
  const selectedLocality = useAppStore((s) => s.selectedLocality);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? 580 : -580, behavior: 'smooth' });
  };

  useEffect(() => {
    setLoading(true);
    packagesApi
      .getFeatured(selectedCity?.id, 16)
      .then((res) => {
        const raw = Array.isArray(res) ? res : (res as any)?.data ?? [];
        setPackages(raw as VendorPackage[]);
      })
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, [selectedCity?.id]);

  // Scroll state after render
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [packages, updateScrollState]);

  // Section title + subtitle based on city/locality
  const titleCity = selectedLocality
    ? `${selectedLocality.name}, ${selectedCity?.name}`
    : selectedCity?.name ?? null;

  const heading = titleCity
    ? `Top Packages in ${titleCity}`
    : 'Top Packages Across All Cities';

  const subheading = titleCity
    ? `Best-rated packages available in ${titleCity} — clear pricing, no negotiation.`
    : 'Browse curated packages across Noida, Delhi, Gurgaon & more — clear pricing, no calls needed.';

  const viewAllHref = selectedCity
    ? `/search?cityId=${selectedCity.id}&q=packages`
    : '/search?q=packages+near+me&nlp=1';

  if (!loading && packages.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header row */}
        <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <p className="text-[11px] font-extrabold text-red-600 uppercase tracking-[0.2em] mb-1.5">
              Featured Packages
            </p>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 leading-tight">
              {heading}
            </h2>
            <p className="text-slate-500 text-sm mt-1 max-w-lg">{subheading}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Scroll arrows — visible on sm+ */}
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 bg-white shadow-sm text-gray-600 hover:border-red-300 hover:text-red-600 disabled:opacity-30 disabled:cursor-default transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight && !loading}
              aria-label="Scroll right"
              className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 bg-white shadow-sm text-gray-600 hover:border-red-300 hover:text-red-600 disabled:opacity-30 disabled:cursor-default transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <Link
              href={viewAllHref}
              className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-red-300 hover:text-red-600 transition-colors whitespace-nowrap"
            >
              View all →
            </Link>
          </div>
        </div>

        {/* Scroll track */}
        <div className="relative">
          {/* Left fade */}
          {canScrollLeft && (
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10" />
          )}
          {/* Right fade */}
          {canScrollRight && (
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10" />
          )}

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 pb-3"
          >
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : packages.map((pkg) => <PackageCard key={pkg.id} pkg={pkg} />)
            }
          </div>
        </div>

        {/* Mobile view-all */}
        <div className="mt-5 text-center sm:hidden">
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700"
          >
            View all packages →
          </Link>
        </div>
      </div>
    </section>
  );
}
