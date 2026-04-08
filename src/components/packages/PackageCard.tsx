'use client';

import { VendorPackage } from '@/types';

interface Props {
  pkg: VendorPackage;
  onBook?: (pkg: VendorPackage) => void;
  compact?: boolean;
}

const TAG_STYLE: Record<string, string> = {
  budget:   'bg-blue-100 text-blue-700 border-blue-200',
  standard: 'bg-gray-100 text-gray-600 border-gray-200',
  premium:  'bg-purple-100 text-purple-700 border-purple-200',
  luxury:   'bg-amber-100 text-amber-700 border-amber-200',
};

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  if (n >= 1000)   return `₹${Math.round(n / 1000)}K`;
  return `₹${n}`;
}

export default function PackageCard({ pkg, onBook, compact = false }: Props) {
  const savings = Math.round(Number(pkg.savingsPercent ?? 0));
  const tagStyle = pkg.tag ? TAG_STYLE[pkg.tag] : null;

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden ${compact ? '' : 'flex flex-col'}`}>
      {/* Top bar */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-50">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {pkg.category?.name && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-red-600">
                  {pkg.category.name}
                </span>
              )}
              {tagStyle && (
                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold capitalize ${tagStyle}`}>
                  {pkg.tag}
                </span>
              )}
              {pkg.isBoosted && (
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-bold text-amber-900">
                  ⚡ BOOSTED
                </span>
              )}
              {pkg.isFeatured && (
                <span className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-bold text-white">
                  ⭐ FEATURED
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-gray-900 text-sm leading-snug line-clamp-2">
              {pkg.title}
            </h3>
            {pkg.vendor?.businessName && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{pkg.vendor.businessName}</p>
            )}
          </div>

          {/* Price block */}
          <div className="shrink-0 text-right">
            {savings > 0 && pkg.originalPrice && (
              <p className="text-[10px] text-gray-400 line-through">{fmt(Number(pkg.originalPrice))}</p>
            )}
            <p className="text-base font-extrabold text-red-600">
              {fmt(Number(pkg.price))}{pkg.priceType === 'per_person' ? '/pp' : ''}
            </p>
            {savings > 0 && (
              <span className="inline-block mt-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                {savings}% off
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Includes / services */}
      <div className="px-4 py-3">
        {pkg.includes && pkg.includes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {pkg.includes.slice(0, compact ? 3 : 5).map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 rounded-full border border-gray-100 bg-gray-50 px-2.5 py-0.5 text-[10px] font-semibold text-gray-600"
              >
                <svg className="w-2.5 h-2.5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {item}
              </span>
            ))}
            {pkg.includes.length > (compact ? 3 : 5) && (
              <span className="text-[10px] font-semibold text-gray-400">
                +{pkg.includes.length - (compact ? 3 : 5)} more
              </span>
            )}
          </div>
        )}

        {/* Add-ons */}
        {!compact && pkg.addons && pkg.addons.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Add-ons available</p>
            <div className="flex flex-wrap gap-1.5">
              {pkg.addons.map((a, i) => (
                <span key={i} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
                  + {a.label} ({fmt(a.price)})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Location + guests meta */}
        <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-3">
          {pkg.city?.name && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {pkg.city.name}
            </span>
          )}
          {(pkg.minGuests || pkg.maxGuests) && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
              </svg>
              {pkg.minGuests && `${pkg.minGuests}`}{pkg.minGuests && pkg.maxGuests ? '–' : ''}{pkg.maxGuests && `${pkg.maxGuests}`} guests
            </span>
          )}
          {pkg.leadsCount > 0 && (
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              </svg>
              {pkg.leadsCount} booked
            </span>
          )}
        </div>

        {/* CTA */}
        {onBook && (
          <button
            onClick={() => onBook(pkg)}
            className="w-full bg-red-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-red-700 active:bg-red-800 transition shadow-sm hover:shadow-md"
          >
            Get Best Price
          </button>
        )}
      </div>
    </div>
  );
}
