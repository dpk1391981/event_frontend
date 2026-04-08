'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { packagesApi } from '@/lib/api';
import type { VendorPackage } from '@/types';

function PriceLabel({ pkg }: { pkg: VendorPackage }) {
  const formatted =
    pkg.price >= 100000
      ? `₹${(pkg.price / 100000).toFixed(pkg.price % 100000 === 0 ? 0 : 1)}L`
      : `₹${Math.round(pkg.price / 1000)}K`;
  return (
    <span className="text-sm font-bold text-red-600">
      {formatted}{pkg.priceType === 'per_person' ? '/person' : ''}
    </span>
  );
}

export default function FeaturedPackages() {
  const [packages, setPackages] = useState<VendorPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    packagesApi
      .getFeatured(undefined, 8)
      .then((res) => {
        const data = Array.isArray(res) ? res : (res as any)?.data ?? [];
        setPackages(data.slice(0, 8));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-14 bg-[#fffaf3] border-b border-[#e8dbc9]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8 text-center">
            <p className="text-xs font-extrabold text-red-600 uppercase tracking-widest mb-2">⭐ Featured Packages</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827]">Ready-made packages — just pick one</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:mx-0 sm:px-0 sm:pb-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-none w-[240px] sm:w-auto rounded-[20px] bg-white border border-[#e8dbc9] p-5 animate-pulse space-y-3">
                <div className="h-3 bg-[#e8dbc9] rounded w-2/3" />
                <div className="h-5 bg-[#e8dbc9] rounded w-full" />
                <div className="h-3 bg-[#e8dbc9] rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (packages.length === 0) return null;

  return (
    <section className="py-14 bg-[#fffaf3] border-b border-[#e8dbc9]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold text-red-600 uppercase tracking-widest mb-2">⭐ Featured Packages</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827]">
              Ready-made packages — just pick one
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Clear pricing, inclusions &amp; locations. No negotiation needed.
            </p>
          </div>
          <Link
            href="/search?q=packages+near+me&nlp=1"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-2xl border border-[#e8dbc9] bg-white px-4 py-2.5 text-sm font-semibold text-[#111827] hover:bg-[#f7f2eb] whitespace-nowrap"
          >
            View all packages →
          </Link>
        </div>

        {/* Mobile: horizontal scroll; sm+: 2-col grid; lg+: 4-col grid */}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:mx-0 sm:px-0 sm:pb-0">
          {packages.map((pkg) => (
            <Link
              key={pkg.id}
              href={pkg.vendor?.slug ? `/vendor/${pkg.vendor.slug}` : '/search?q=packages+near+me&nlp=1'}
              className="group flex-none w-[240px] sm:w-auto snap-start rounded-[20px] border border-[#e8dbc9] bg-white p-5 shadow-sm hover:shadow-md hover:border-red-200 transition-all overflow-hidden"
            >
              {/* Category + boost badge */}
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a97142]">
                  {pkg.category?.name ?? 'Package'}
                </p>
                {pkg.isBoosted && (
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-bold text-amber-900">
                    BOOSTED
                  </span>
                )}
                {pkg.isFeatured && !pkg.isBoosted && (
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-bold text-white">
                    FEATURED
                  </span>
                )}
              </div>

              <h3 className="font-extrabold text-[#111827] leading-snug mb-1 group-hover:text-red-700 transition-colors line-clamp-2">
                {pkg.title}
              </h3>

              {pkg.vendor && (
                <p className="text-xs text-slate-500 mb-2 truncate">{pkg.vendor.businessName}</p>
              )}

              {/* Price */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f0e8dc]">
                <div>
                  {Number(pkg.originalPrice) > 0 && Number(pkg.savingsPercent) > 0 && (
                    <p className="text-[10px] text-slate-400 line-through">
                      {Number(pkg.originalPrice) >= 100000
                        ? `₹${(Number(pkg.originalPrice) / 100000).toFixed(1)}L`
                        : `₹${Math.round(Number(pkg.originalPrice) / 1000)}K`}
                    </p>
                  )}
                  <PriceLabel pkg={pkg} />
                  {Number(pkg.savingsPercent) > 0 && (
                    <span className="inline-block mt-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                      {Math.round(Number(pkg.savingsPercent))}% off
                    </span>
                  )}
                </div>
                {pkg.city && (
                  <span className="text-[11px] font-semibold text-slate-500">{pkg.city.name}</span>
                )}
              </div>

              {/* Includes preview */}
              {pkg.includes && pkg.includes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {pkg.includes.slice(0, 3).map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[#e8dbc9] px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                    >
                      {item}
                    </span>
                  ))}
                  {pkg.includes.length > 3 && (
                    <span className="text-[10px] font-semibold text-slate-400">+{pkg.includes.length - 3} more</span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/search?q=packages+near+me&nlp=1"
            className="inline-flex items-center gap-1.5 rounded-2xl border border-[#e8dbc9] bg-white px-5 py-3 text-sm font-semibold text-[#111827]"
          >
            View all packages →
          </Link>
        </div>
      </div>
    </section>
  );
}
