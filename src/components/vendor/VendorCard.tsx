import Link from 'next/link';
import Image from 'next/image';
import { Vendor } from '@/types';

function StarRating({ rating, count }: { rating: number | string; count: number }) {
  const r = Number(rating) || 0;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <svg
            key={s}
            className={`w-3.5 h-3.5 ${s <= Math.round(r) ? 'text-yellow-400' : 'text-gray-200'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs text-gray-500">{r.toFixed(1)} <span className="text-gray-400">({count})</span></span>
    </div>
  );
}

interface Props {
  vendor: Vendor;
  showLeadButton?: boolean;
  onGetQuote?: (vendor: Vendor) => void;
  /** Allocated budget for this category — shows "Best for ₹X" badge when vendor fits */
  budgetFit?: number;
  /** Event type context — shows "Matches your event" badge */
  eventType?: string;
}

export default function VendorCard({ vendor, showLeadButton = true, onGetQuote, budgetFit, eventType }: Props) {
  const priceRange =
    vendor.minPrice && vendor.maxPrice
      ? `₹${(vendor.minPrice / 1000).toFixed(0)}K – ₹${(vendor.maxPrice / 1000).toFixed(0)}K`
      : vendor.minPrice
      ? `From ₹${(vendor.minPrice / 1000).toFixed(0)}K`
      : null;

  const isBudgetFit = budgetFit != null && (
    !vendor.minPrice || Number(vendor.minPrice) <= budgetFit
  );
  const budgetLabel = budgetFit
    ? budgetFit >= 100000
      ? `₹${(budgetFit / 100000).toFixed(1)}L`
      : `₹${(budgetFit / 1000).toFixed(0)}K`
    : null;
  const matchesEvent = !!eventType && vendor.categories?.some(
    (c) => c.slug === eventType || c.name.toLowerCase().includes(eventType.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
      {/* Image / Logo */}
      <Link href={`/vendor/${vendor.slug}`} className="block">
        <div className="relative h-44 bg-gradient-to-br from-red-50 to-rose-100 overflow-hidden">
          {vendor.portfolioImages?.[0] ? (
            <Image
              src={vendor.portfolioImages[0]}
              alt={vendor.businessName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl text-red-200 font-bold">{vendor.businessName[0]}</span>
            </div>
          )}
          {/* Overlay gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Smart match badges */}
          {(isBudgetFit || matchesEvent) && (
            <div className="absolute bottom-2 left-2 flex flex-col gap-1">
              {isBudgetFit && budgetLabel && (
                <span className="bg-green-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-sm leading-tight">
                  ✓ Best for {budgetLabel}
                </span>
              )}
              {matchesEvent && (
                <span className="bg-blue-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-sm leading-tight">
                  Matches your event
                </span>
              )}
            </div>
          )}

          {vendor.isFeatured && (
            <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              ⭐ FEATURED
            </span>
          )}
          {vendor.isVerified && (
            <span className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={`/vendor/${vendor.slug}`}>
          <h3 className="font-semibold text-gray-900 hover:text-red-700 line-clamp-1 text-sm sm:text-base transition mb-1">
            {vendor.businessName}
          </h3>
        </Link>

        {vendor.categories && vendor.categories.length > 0 && (
          <p className="text-xs text-red-600 font-medium mb-2">
            {vendor.categories.map((c) => c.name).join(' · ')}
          </p>
        )}

        <StarRating rating={vendor.rating} count={vendor.reviewCount} />

        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
          <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span className="truncate">{vendor.locality?.name ? `${vendor.locality.name}, ` : ''}{vendor.city?.name}</span>
        </div>

        {priceRange && (
          <p className="text-sm font-bold text-gray-800 mt-2">{priceRange}</p>
        )}

        {showLeadButton && (
          <button
            onClick={() => onGetQuote?.(vendor)}
            className="mt-3 w-full bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-red-700 active:bg-red-800 transition shadow-sm hover:shadow-md"
          >
            Get Free Quote
          </button>
        )}
      </div>
    </div>
  );
}
