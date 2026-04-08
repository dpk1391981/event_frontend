'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { vendorsApi } from '@/lib/api';
import { Vendor } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import LeadModal from '@/components/lead/LeadModal';

const TABS = [
  { label: 'All', slug: '' },
  { label: '💍 Wedding', slug: 'wedding' },
  { label: '📸 Photography', slug: 'photography' },
  { label: '🍽️ Catering', slug: 'catering' },
  { label: '💄 Makeup', slug: 'makeup' },
  { label: '🎵 DJ & Music', slug: 'dj-music' },
  { label: '🌸 Decoration', slug: 'decoration' },
];

function Stars({ r }: { r: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} className={`w-3 h-3 ${s <= Math.round(r) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export default function TopVendorCarousel() {
  const { selectedCity } = useAppStore();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    setLoading(true);
    vendorsApi.getFeatured(selectedCity?.id)
      .then((d: unknown) => setVendors(d as Vendor[]))
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  }, [selectedCity]);

  const filtered = activeTab
    ? vendors.filter((v) => v.categories?.some((c) => c.slug === activeTab))
    : vendors;

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-xs font-extrabold text-red-500 uppercase tracking-widest mb-1">Trusted by Thousands</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Top Vendors
              {selectedCity && <span className="text-red-500"> in {selectedCity.name}</span>}
            </h2>
            <p className="text-gray-500 text-sm mt-1">Verified, rated &amp; trusted by families across India</p>
          </div>
          <Link href="/search?sortBy=rating" className="hidden sm:flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-bold shrink-0">
            View all <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>

        {/* Tabs — scrollable */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.slug}
              onClick={() => setActiveTab(tab.slug)}
              className={`flex-none text-sm font-semibold px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                activeTab === tab.slug
                  ? 'bg-red-600 text-white shadow-md shadow-red-200'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-none w-72 bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="h-44 skeleton" />
                <div className="p-4 space-y-3">
                  <div className="h-4 skeleton rounded w-3/4" />
                  <div className="h-3 skeleton rounded w-1/2" />
                  <div className="h-3 skeleton rounded w-1/3" />
                  <div className="h-9 skeleton rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vendor cards — horizontal scroll carousel */}
        {!loading && filtered.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory -mx-4 px-4">
            {filtered.slice(0, 10).map((vendor, idx) => {
              const r = Number(vendor.rating) || 0;
              const minP = Number(vendor.minPrice) || 0;
              const maxP = Number(vendor.maxPrice) || 0;
              const price = minP && maxP
                ? `₹${(minP/1000).toFixed(0)}K–₹${(maxP/1000).toFixed(0)}K`
                : minP ? `From ₹${(minP/1000).toFixed(0)}K` : null;

              return (
                <div key={vendor.id} className="flex-none w-[272px] sm:w-72 snap-start group">
                  <div className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                    idx === 0 ? 'border-yellow-400 ring-2 ring-yellow-300/60 shadow-yellow-100 shadow-lg' :
                    idx === 1 ? 'border-gray-300 ring-2 ring-gray-200/60 shadow-gray-100 shadow-md' :
                    idx === 2 ? 'border-orange-400 ring-2 ring-orange-200/60 shadow-orange-100 shadow-md' :
                    'border-gray-100 shadow-sm'
                  }`}>
                    {/* Image */}
                    <Link href={`/vendor/${vendor.slug}`} className="block">
                      <div className="relative h-44 bg-gradient-to-br from-red-50 to-rose-100 overflow-hidden">
                        {vendor.portfolioImages?.[0] ? (
                          <Image src={vendor.portfolioImages[0]} alt={vendor.businessName} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-6xl text-red-200 font-bold">{vendor.businessName[0]}</span>
                          </div>
                        )}
                        {/* Rank badge */}
                        {idx < 3 && (
                          <div className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-extrabold shadow ${
                            idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                            idx === 1 ? 'bg-gray-300 text-gray-800' :
                            'bg-orange-400 text-orange-900'
                          }`}>
                            #{idx+1}
                          </div>
                        )}
                        {vendor.isFeatured && (
                          <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full">⭐ TOP</span>
                        )}
                        {vendor.isVerified && (
                          <span className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            Verified
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="p-4">
                      <Link href={`/vendor/${vendor.slug}`}>
                        <h3 className="font-bold text-gray-900 group-hover:text-red-700 transition text-sm leading-tight line-clamp-1">{vendor.businessName}</h3>
                      </Link>
                      {vendor.categories?.[0] && (
                        <p className="text-xs text-red-600 font-semibold mt-0.5 mb-2">{vendor.categories.map(c=>c.name).join(' · ')}</p>
                      )}
                      <div className="flex items-center gap-1.5 mb-1">
                        <Stars r={r} />
                        <span className="text-xs text-gray-600 font-semibold">{r.toFixed(1)}</span>
                        <span className="text-xs text-gray-400">({vendor.reviewCount})</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <svg className="w-3 h-3 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                        <span className="truncate">{vendor.locality?.name ? `${vendor.locality.name}, ` : ''}{vendor.city?.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        {price && <p className="text-sm font-extrabold text-gray-900">{price}</p>}
                        {vendor.yearsOfExperience && <span className="text-xs text-gray-400">{vendor.yearsOfExperience}yr exp</span>}
                      </div>
                      <button
                        onClick={() => setSelectedVendor(vendor)}
                        className={`mt-3 w-full text-sm font-bold py-2.5 rounded-xl transition shadow-sm hover:shadow-md ${
                          idx === 0
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-yellow-900'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        Get Free Quote
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* View all card */}
            <Link href="/search?sortBy=rating" className="flex-none w-48 snap-start">
              <div className="h-full min-h-[300px] bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-white group hover:from-red-700 hover:to-rose-800 transition shadow-lg shadow-red-200">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="font-extrabold text-sm">View All Vendors</p>
                <p className="text-white/70 text-xs mt-1">2000+ verified</p>
              </div>
            </Link>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold">No vendors found for this category yet</p>
            <Link href="/partner/onboard" className="mt-3 inline-block text-red-600 font-bold hover:underline">
              List your business →
            </Link>
          </div>
        )}
      </div>

      {selectedVendor && <LeadModal vendor={selectedVendor} onClose={() => setSelectedVendor(null)} />}
    </section>
  );
}
