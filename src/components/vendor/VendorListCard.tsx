'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Vendor } from '@/types';

function Stars({ r, count }: { r: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(r) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs font-bold text-gray-700">{Number(r).toFixed(1)}</span>
      <span className="text-xs text-gray-400">({count} reviews)</span>
    </div>
  );
}

interface Props {
  vendor: Vendor;
  rank?: number;
  onGetQuote?: (vendor: Vendor) => void;
}

export default function VendorListCard({ vendor, rank, onGetQuote }: Props) {
  const r = Number(vendor.rating) || 0;
  const minP = Number(vendor.minPrice) || 0;
  const maxP = Number(vendor.maxPrice) || 0;
  const priceRange = minP && maxP
    ? `₹${(minP / 1000).toFixed(0)}K – ₹${(maxP / 1000).toFixed(0)}K`
    : minP ? `From ₹${(minP / 1000).toFixed(0)}K` : null;

  const planConfig: Record<string, { label: string; color: string }> = {
    elite: { label: '🥇 Gold', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    pro: { label: '🥈 Silver', color: 'bg-gray-100 text-gray-700 border-gray-300' },
    basic: { label: '🥉 Bronze', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  };
  const planBadge = vendor.plan ? planConfig[vendor.plan] : null;

  return (
    /* ── Desktop: horizontal list card (99acres style) ── */
    <div className="bg-white rounded-2xl border border-gray-200 hover:border-red-200 hover:shadow-lg transition-all duration-200 overflow-hidden group">
      <div className="flex">
        {/* Image — fixed left column */}
        <Link href={`/vendor/${vendor.slug}`} className="relative shrink-0 w-52 sm:w-64 bg-gradient-to-br from-red-50 to-rose-100 overflow-hidden">
          {vendor.portfolioImages?.[0] ? (
            <Image
              src={vendor.portfolioImages[0]}
              alt={vendor.businessName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl text-red-200 font-bold select-none">{vendor.businessName[0]}</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {rank && rank <= 3 && (
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                rank === 2 ? 'bg-gray-300 text-gray-800' :
                'bg-orange-400 text-orange-900'
              }`}>
                #{rank} Ranked
              </span>
            )}
            {vendor.isFeatured && (
              <span className="text-[10px] font-extrabold bg-red-600 text-white px-2 py-0.5 rounded-full">
                ⭐ Featured
              </span>
            )}
          </div>
          {vendor.isVerified && (
            <span className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified
            </span>
          )}
        </Link>

        {/* Content — right side */}
        <div className="flex-1 p-5 min-w-0 flex flex-col">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Link href={`/vendor/${vendor.slug}`}>
                  <h3 className="font-extrabold text-gray-900 hover:text-red-700 transition text-base sm:text-lg leading-tight">
                    {vendor.businessName}
                  </h3>
                </Link>
                {planBadge && (
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${planBadge.color}`}>
                    {planBadge.label}
                  </span>
                )}
              </div>

              {/* Categories */}
              {vendor.categories && vendor.categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {vendor.categories.map((c) => (
                    <Link key={c.id} href={`/search?category=${c.slug}`}>
                      <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full hover:bg-red-100 transition">
                        {c.name}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Price — desktop right */}
            {priceRange && (
              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-lg font-extrabold text-gray-900">{priceRange}</p>
                {vendor.priceUnit && <p className="text-xs text-gray-400">{vendor.priceUnit}</p>}
              </div>
            )}
          </div>

          {/* Rating */}
          <Stars r={r} count={vendor.reviewCount} />

          {/* Meta row */}
          <div className="flex flex-wrap gap-3 mt-2 mb-3">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {vendor.locality?.name ? `${vendor.locality.name}, ` : ''}{vendor.city?.name || 'Delhi NCR'}
            </span>
            {vendor.yearsOfExperience && (
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {vendor.yearsOfExperience} years experience
              </span>
            )}
            {vendor.teamSize && (
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {vendor.teamSize} member team
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {vendor.profileViews.toLocaleString()} views
            </span>
          </div>

          {/* Description */}
          {vendor.description && (
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
              {vendor.description}
            </p>
          )}

          {/* Bottom row — CTA */}
          <div className="flex items-center justify-between gap-3 mt-auto pt-3 border-t border-gray-50">
            {/* Price mobile */}
            {priceRange && (
              <p className="text-sm font-extrabold text-gray-900 sm:hidden">{priceRange}</p>
            )}
            <div className="flex gap-2 sm:ml-auto">
              <Link
                href={`/vendor/${vendor.slug}`}
                className="text-sm font-semibold px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:border-red-300 hover:text-red-600 transition hidden sm:block"
              >
                View Profile
              </Link>
              <button
                onClick={() => onGetQuote?.(vendor)}
                className="text-sm font-bold px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl transition shadow-sm hover:shadow-md"
              >
                Get Free Quote
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio strip — extra images */}
      {vendor.portfolioImages && vendor.portfolioImages.length > 1 && (
        <div className="flex gap-1.5 px-5 pb-4 overflow-x-auto scrollbar-none">
          {vendor.portfolioImages.slice(1, 5).map((img, i) => (
            <div key={i} className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100">
              <Image src={img} alt={`${vendor.businessName} portfolio ${i + 2}`} fill className="object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
