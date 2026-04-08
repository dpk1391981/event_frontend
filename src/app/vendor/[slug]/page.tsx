'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { vendorsApi } from '@/lib/api';
import type { Vendor } from '@/types';
import LeadModal from '@/components/lead/LeadModal';
import Image from 'next/image';

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <svg key={s} className={`w-5 h-5 ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-sm text-gray-600 font-medium">{Number(rating).toFixed(1)}</span>
      <span className="text-sm text-gray-400">({count} reviews)</span>
    </div>
  );
}

export default function VendorProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLead, setShowLead] = useState(false);

  useEffect(() => {
    vendorsApi.getBySlug(slug)
      .then((v: unknown) => setVendor(v as Vendor))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-72 bg-gray-100 rounded-2xl mb-6" />
        <div className="h-8 bg-gray-100 rounded w-1/2 mb-3" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
      </div>
    );
  }

  if (!vendor) {
    return <VendorNotFound slug={slug} />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Portfolio Hero */}
      <div className="relative h-64 sm:h-80 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl overflow-hidden mb-6">
        {vendor.portfolioImages?.[0] ? (
          <Image src={vendor.portfolioImages[0]} alt={vendor.businessName} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl text-purple-200 font-bold">
            {vendor.businessName[0]}
          </div>
        )}
        {vendor.isFeatured && (
          <span className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">FEATURED</span>
        )}
        {vendor.isVerified && (
          <span className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">✓ Verified</span>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-5">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl font-extrabold text-gray-900">{vendor.businessName}</h1>
            </div>
            {vendor.categories && vendor.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {vendor.categories.map((cat) => (
                  <span key={cat.id} className="bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1 rounded-full">
                    {cat.name}
                  </span>
                ))}
              </div>
            )}
            <StarRating rating={vendor.rating} count={vendor.reviewCount} />
          </div>

          {vendor.description && (
            <div>
              <h2 className="font-bold text-gray-900 mb-2">About</h2>
              <p className="text-gray-600 leading-relaxed text-sm">{vendor.description}</p>
            </div>
          )}

          {/* Details */}
          <div>
            <h2 className="font-bold text-gray-900 mb-3">Details</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Location', value: `${vendor.locality?.name ? vendor.locality.name + ', ' : ''}${vendor.city?.name}`, icon: '📍' },
                { label: 'Experience', value: vendor.yearsOfExperience ? `${vendor.yearsOfExperience} years` : 'N/A', icon: '⏱️' },
                { label: 'Team Size', value: vendor.teamSize ? `${vendor.teamSize} members` : 'N/A', icon: '👥' },
                { label: 'Profile Views', value: vendor.profileViews.toLocaleString(), icon: '👁️' },
              ].map((d) => (
                <div key={d.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">{d.icon} {d.label}</p>
                  <p className="font-semibold text-gray-800 text-sm">{d.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Portfolio */}
          {vendor.portfolioImages && vendor.portfolioImages.length > 1 && (
            <div>
              <h2 className="font-bold text-gray-900 mb-3">Portfolio</h2>
              <div className="grid grid-cols-3 gap-2">
                {vendor.portfolioImages.slice(1, 7).map((img, i) => (
                  <div key={i} className="aspect-square relative rounded-xl overflow-hidden bg-gray-100">
                    <Image src={img} alt={`Portfolio ${i + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky CTA Card */}
        <div className="md:col-span-1">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 md:sticky md:top-20">
            {vendor.minPrice && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-0.5">Starting From</p>
                <p className="text-2xl font-extrabold text-gray-900">
                  ₹{vendor.minPrice.toLocaleString()}
                </p>
                {vendor.priceUnit && <p className="text-xs text-gray-400">{vendor.priceUnit}</p>}
                {vendor.maxPrice && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Up to ₹{vendor.maxPrice.toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => setShowLead(true)}
              className="w-full bg-purple-700 text-white font-bold py-3.5 rounded-xl hover:bg-purple-800 transition mb-3 text-base"
            >
              Get Free Quote
            </button>

            {vendor.phone && (
              <a
                href={`tel:+91${vendor.phone}`}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Now
              </a>
            )}

            <div className="mt-4 pt-4 border-t border-gray-50 space-y-2 text-xs text-gray-500">
              <p className="flex items-center gap-2"><span>🛡️</span> Verified Business</p>
              <p className="flex items-center gap-2"><span>💬</span> Free Quote, No Charges</p>
              <p className="flex items-center gap-2"><span>⚡</span> Usually responds within 2 hours</p>
            </div>
          </div>
        </div>
      </div>

      {showLead && <LeadModal vendor={vendor} onClose={() => setShowLead(false)} />}
    </div>
  );
}

/* ── Premium Vendor Not Found ──────────────────────────────────────────── */
function VendorNotFound({ slug }: { slug: string }) {
  const SUGGESTIONS = [
    { label: 'Wedding Photographers', href: '/search?category=photography', icon: '📸' },
    { label: 'Event Caterers', href: '/search?category=catering', icon: '🍽️' },
    { label: 'Party Venues', href: '/search?category=venue', icon: '🏛️' },
    { label: 'DJ & Music', href: '/search?category=dj-music', icon: '🎵' },
    { label: 'Bridal Makeup', href: '/search?category=makeup', icon: '💄' },
    { label: 'Event Decorators', href: '/search?category=decoration', icon: '🌸' },
  ];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-b from-gray-50 to-white">
      {/* Illustration area */}
      <div className="relative mb-10">
        {/* Spinning ring */}
        <div className="absolute inset-0 w-48 h-48 rounded-full border-4 border-dashed border-red-100 animate-spin-slow" />
        {/* Inner circle */}
        <div className="relative w-48 h-48 bg-gradient-to-br from-red-50 to-rose-100 rounded-full flex items-center justify-center shadow-xl shadow-red-100">
          <div className="text-center">
            <div className="text-6xl mb-1 animate-bounce-gentle">🔍</div>
            <div className="text-xs font-bold text-red-400 uppercase tracking-wider">Not Found</div>
          </div>
        </div>
        {/* Floating icons */}
        <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-xl animate-float-slow">📸</div>
        <div className="absolute -bottom-2 -left-2 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-xl animate-float-medium">🎉</div>
        <div className="absolute top-1/2 -right-6 w-9 h-9 bg-white rounded-xl shadow-lg flex items-center justify-center text-lg" style={{ animationDelay: '1s' }}>🏛️</div>
      </div>

      {/* Text */}
      <div className="text-center max-w-lg mb-10">
        <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 rounded-full px-4 py-1.5 text-sm text-red-600 font-semibold mb-4">
          <span>⚠️</span> Vendor Page Not Found
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3 leading-tight">
          Oops! This vendor profile
          <br />
          <span className="text-red-500">doesn&apos;t exist</span>
        </h1>
        <p className="text-gray-500 text-base leading-relaxed">
          The vendor <code className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-lg text-sm font-mono">{slug}</code> may have been removed,
          renamed, or the link might be incorrect.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-14">
        <Link
          href="/search"
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold px-8 py-4 rounded-2xl hover:from-red-700 hover:to-rose-700 transition shadow-lg shadow-red-200 text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search All Vendors
        </Link>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 font-bold px-8 py-4 rounded-2xl hover:border-red-300 hover:text-red-600 transition text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Back to Home
        </Link>
      </div>

      {/* Suggestions */}
      <div className="w-full max-w-2xl">
        <p className="text-center text-sm font-bold text-gray-500 uppercase tracking-wider mb-5">
          Explore Popular Categories
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SUGGESTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4 hover:border-red-200 hover:bg-red-50 hover:shadow-md transition group shadow-sm"
            >
              <div className="w-10 h-10 bg-red-50 group-hover:bg-red-100 rounded-xl flex items-center justify-center text-xl transition shrink-0">
                {s.icon}
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-red-700 leading-tight">{s.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom help */}
      <div className="mt-14 text-center">
        <p className="text-sm text-gray-400">
          Are you the vendor? {' '}
          <Link href="/partner/onboard" className="text-red-600 hover:text-red-700 font-bold underline-offset-2 hover:underline">
            Claim your profile →
          </Link>
        </p>
      </div>
    </div>
  );
}
