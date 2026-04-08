'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { vendorsApi } from '@/lib/api';
import { Vendor } from '@/types';
import LeadModal from '@/components/lead/LeadModal';

type BadgeTier = 'gold' | 'silver' | 'bronze' | null;

function getPlanBadge(plan?: string, rank?: number): BadgeTier {
  // First 3 featured vendors get rank-based badges (Gold, Silver, Bronze)
  if (rank === 0) return 'gold';
  if (rank === 1) return 'silver';
  if (rank === 2) return 'bronze';
  // Fallback to plan
  if (plan === 'elite') return 'gold';
  if (plan === 'pro') return 'silver';
  if (plan === 'basic') return 'bronze';
  return null;
}

const BADGE_CONFIG = {
  gold: {
    label: '🥇 Gold Partner',
    bg: 'bg-gradient-to-r from-yellow-400 to-amber-500',
    text: 'text-yellow-900',
    border: 'border-yellow-400',
    ring: 'ring-2 ring-yellow-400/60',
    glow: 'shadow-yellow-200',
  },
  silver: {
    label: '🥈 Silver Partner',
    bg: 'bg-gradient-to-r from-gray-300 to-slate-400',
    text: 'text-gray-800',
    border: 'border-gray-400',
    ring: 'ring-2 ring-gray-300/60',
    glow: 'shadow-gray-200',
  },
  bronze: {
    label: '🥉 Bronze Partner',
    bg: 'bg-gradient-to-r from-orange-400 to-amber-600',
    text: 'text-orange-900',
    border: 'border-orange-400',
    ring: 'ring-2 ring-orange-300/60',
    glow: 'shadow-orange-100',
  },
};

function VendorBadge({ tier }: { tier: BadgeTier }) {
  if (!tier) return null;
  const cfg = BADGE_CONFIG[tier];
  return (
    <span className={`absolute top-2 left-2 ${cfg.bg} ${cfg.text} text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md`}>
      {cfg.label}
    </span>
  );
}

function StarRating({ rating, count }: { rating: number | string; count: number }) {
  const r = Number(rating) || 0;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(r) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs text-gray-500">{r.toFixed(1)} ({count})</span>
    </div>
  );
}

export default function TopVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    vendorsApi.getFeatured(undefined)
      .then((d: unknown) => setVendors((d as Vendor[]).slice(0, 9)))
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="h-8 skeleton rounded w-56 mb-8 mx-auto" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
              <div className="h-48 skeleton" />
              <div className="p-4 space-y-3">
                <div className="h-4 skeleton rounded w-3/4" />
                <div className="h-3 skeleton rounded w-1/2" />
                <div className="h-10 skeleton rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!vendors.length) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Top Verified Vendors</h2>
          <p className="text-sm text-gray-500 mt-1">Handpicked, rated &amp; trusted by thousands of families</p>
        </div>
        <Link href="/search?sortBy=rating" className="text-sm text-red-600 hover:text-red-700 font-semibold shrink-0">
          View all →
        </Link>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {(['gold', 'silver', 'bronze'] as const).map((tier) => (
          <span key={tier} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${BADGE_CONFIG[tier].bg} ${BADGE_CONFIG[tier].text}`}>
            {BADGE_CONFIG[tier].label}
          </span>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {vendors.map((vendor, index) => {
          const tier = getPlanBadge(vendor.plan, index);
          const cfg = tier ? BADGE_CONFIG[tier] : null;
          const minP = Number(vendor.minPrice) || 0;
          const maxP = Number(vendor.maxPrice) || 0;
          const priceRange =
            minP && maxP
              ? `₹${(minP / 1000).toFixed(0)}K – ₹${(maxP / 1000).toFixed(0)}K`
              : minP
              ? `From ₹${(minP / 1000).toFixed(0)}K`
              : null;

          return (
            <div
              key={vendor.id}
              className={`bg-white rounded-2xl border overflow-hidden group transition-all duration-200 hover:-translate-y-1 ${
                cfg ? `${cfg.border} ${cfg.ring} shadow-lg ${cfg.glow}` : 'border-gray-100 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Image */}
              <Link href={`/vendor/${vendor.slug}`} className="block">
                <div className="relative h-48 bg-gradient-to-br from-red-50 to-rose-100 overflow-hidden">
                  {vendor.portfolioImages?.[0] ? (
                    <Image
                      src={vendor.portfolioImages[0]}
                      alt={vendor.businessName}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <span className="text-6xl text-red-200 font-bold">{vendor.businessName[0]}</span>
                    </div>
                  )}

                  <VendorBadge tier={tier} />

                  {vendor.isVerified && (
                    <span className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  )}

                  {/* Rank badge for top 3 */}
                  {index < 3 && (
                    <div className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-base font-bold shadow-md ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-800' :
                      'bg-orange-400 text-orange-900'
                    }`}>
                      #{index + 1}
                    </div>
                  )}
                </div>
              </Link>

              {/* Content */}
              <div className={`p-4 ${tier === 'gold' ? 'bg-gradient-to-b from-yellow-50/50 to-white' : ''}`}>
                <Link href={`/vendor/${vendor.slug}`}>
                  <h3 className="font-bold text-gray-900 hover:text-red-700 transition line-clamp-1 text-sm sm:text-base">
                    {vendor.businessName}
                  </h3>
                </Link>

                {vendor.categories && vendor.categories.length > 0 && (
                  <p className="text-xs text-red-600 font-medium mt-0.5 mb-2">
                    {vendor.categories.map((c) => c.name).join(' · ')}
                  </p>
                )}

                <StarRating rating={vendor.rating} count={vendor.reviewCount} />

                <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                  <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="truncate">{vendor.locality?.name ? `${vendor.locality.name}, ` : ''}{vendor.city?.name}</span>
                </div>

                <div className="flex items-center justify-between mt-3">
                  {priceRange && (
                    <p className="text-sm font-bold text-gray-800">{priceRange}</p>
                  )}
                  {vendor.yearsOfExperience && (
                    <span className="text-xs text-gray-400">{vendor.yearsOfExperience}yr exp</span>
                  )}
                </div>

                <button
                  onClick={() => setSelectedVendor(vendor)}
                  className={`mt-3 w-full text-white text-sm font-bold py-2.5 rounded-xl transition shadow-sm hover:shadow-md ${
                    tier === 'gold'
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-yellow-900'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Get Free Quote
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedVendor && (
        <LeadModal
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
        />
      )}
    </section>
  );
}
