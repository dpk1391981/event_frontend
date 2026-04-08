'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { vendorsApi, packagesApi } from '@/lib/api';
import type { Vendor, VendorPackage } from '@/types';
import SmartLeadModal from '@/components/lead/SmartLeadModal';
import { useLeadTrigger } from '@/hooks/useLeadTrigger';
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

// ── Suggested Packages Section ────────────────────────────────────────────────
interface SuggestedPackagesProps {
  vendorId: number;
  onSelect: (pkg: VendorPackage) => void;
  eventType?: string;   // e.g. 'wedding'
  budget?: number;      // user's total budget from plan
  categoryId?: number;  // primary category of the vendor
}

function SuggestedPackages({ vendorId, onSelect, eventType, budget, categoryId }: SuggestedPackagesProps) {
  const [packages, setPackages] = useState<VendorPackage[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const params: Record<string, unknown> = { vendorId, limit: 10, status: 'active' };
    if (categoryId) params.categoryId = categoryId;
    packagesApi.search(params)
      .then((r: unknown) => {
        const raw = (r as { data?: VendorPackage[] })?.data ?? (r as VendorPackage[]);
        const list: VendorPackage[] = Array.isArray(raw) ? raw : [];

        // Sort: boosted/featured first, then within-budget, then price asc
        list.sort((a, b) => {
          const aBoost = a.isBoosted || a.isFeatured ? 1 : 0;
          const bBoost = b.isBoosted || b.isFeatured ? 1 : 0;
          if (aBoost !== bBoost) return bBoost - aBoost;
          if (budget) {
            const aFit = a.price <= budget ? 1 : 0;
            const bFit = b.price <= budget ? 1 : 0;
            if (aFit !== bFit) return bFit - aFit;
          }
          return a.price - b.price;
        });

        setPackages(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [vendorId, categoryId]);

  if (loading) {
    return (
      <div>
        <h2 className="font-bold text-gray-900 mb-3">Packages</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (packages.length === 0) return null;

  const eventLabel = eventType
    ? eventType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : null;

  // Split into within-budget and others
  const withinBudget = budget ? packages.filter(p => p.price <= budget) : packages;
  const overBudget   = budget ? packages.filter(p => p.price > budget)  : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-bold text-gray-900">Packages & Pricing</h2>
          {eventLabel && (
            <p className="text-xs text-purple-600 font-semibold mt-0.5">
              ✨ Showing packages relevant to your {eventLabel} plan
            </p>
          )}
        </div>
        <span className="text-xs text-gray-400">{packages.length} available</span>
      </div>

      {/* Within-budget packages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {withinBudget.map((pkg, idx) => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            idx={idx}
            isFeatured={idx === 0 && (pkg.isBoosted || pkg.isFeatured)}
            withinBudget={!!budget}
            onSelect={onSelect}
          />
        ))}
      </div>

      {/* Over-budget packages */}
      {overBudget.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Other Packages</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {overBudget.slice(0, 2).map((pkg, idx) => (
              <PackageCard key={pkg.id} pkg={pkg} idx={idx + withinBudget.length} isFeatured={false} withinBudget={false} onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Package Card ──────────────────────────────────────────────────────────────
function PackageCard({
  pkg, idx, isFeatured, withinBudget, onSelect,
}: {
  pkg: VendorPackage;
  idx: number;
  isFeatured: boolean;
  withinBudget: boolean;
  onSelect: (pkg: VendorPackage) => void;
}) {
  const tiers = [
    { border: 'border-purple-300', headerBg: 'bg-gradient-to-r from-purple-50 to-violet-50', btn: 'bg-purple-700 hover:bg-purple-800', badgeText: '⭐ Best Match' },
    { border: 'border-gray-200',   headerBg: 'bg-gray-50',                                   btn: 'bg-gray-800 hover:bg-gray-900',   badgeText: '' },
    { border: 'border-yellow-200', headerBg: 'bg-gradient-to-r from-yellow-50 to-amber-50',  btn: 'bg-amber-600 hover:bg-amber-700', badgeText: '👑 Premium' },
  ];
  const t = tiers[idx % tiers.length];
  const showBestBadge = isFeatured || (withinBudget && idx === 0);

  return (
    <div className={`rounded-2xl border-2 ${t.border} bg-white overflow-hidden hover:shadow-lg transition-all duration-200 group flex flex-col`}>
      {/* Header */}
      <div className={`${t.headerBg} px-4 py-3 flex items-start justify-between gap-2`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            {showBestBadge && (
              <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                {t.badgeText || '⭐ Best Match'}
              </span>
            )}
            {pkg.isBoosted && (
              <span className="text-[10px] font-extrabold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">🚀 Boosted</span>
            )}
            {withinBudget && (
              <span className="text-[10px] font-extrabold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">✓ Within budget</span>
            )}
          </div>
          <p className="text-sm font-extrabold text-gray-900 leading-tight line-clamp-2">{pkg.title}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-extrabold text-gray-900">
            ₹{pkg.price.toLocaleString('en-IN')}
          </p>
          {pkg.priceType === 'per_person' && (
            <p className="text-[10px] text-gray-400 whitespace-nowrap">per person</p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 flex-1">
        {pkg.description && (
          <p className="text-xs text-gray-500 mb-2 leading-relaxed line-clamp-2">{pkg.description}</p>
        )}
        {pkg.includes && pkg.includes.length > 0 && (
          <ul className="space-y-1">
            {pkg.includes.slice(0, 4).map((item, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                <span className="text-green-500 font-bold shrink-0 mt-0.5">✓</span>
                <span className="line-clamp-1">{item}</span>
              </li>
            ))}
            {pkg.includes.length > 4 && (
              <li className="text-xs text-gray-400 mt-0.5">+{pkg.includes.length - 4} more included</li>
            )}
          </ul>
        )}
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <button
          onClick={() => onSelect(pkg)}
          className={`w-full text-xs font-extrabold ${t.btn} text-white py-2.5 rounded-xl transition shadow-sm group-hover:shadow-md`}
        >
          Get Quote for This Package →
        </button>
      </div>
    </div>
  );
}

// ── From-Plan Context Banner ──────────────────────────────────────────────────
function FromPlanBanner({ eventType, budget, cityId }: { eventType: string; budget: string; cityId: string }) {
  if (!eventType) return null;
  const label = eventType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const planUrl = `/plan?eventType=${eventType}&budget=${budget}&cityId=${cityId}&autosubmit=1`;
  return (
    <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-2.5">
        <span className="text-xl">💍</span>
        <div>
          <p className="text-xs font-extrabold text-rose-800">Viewing from your {label} plan</p>
          <p className="text-[11px] text-rose-600">This vendor was matched to your budget</p>
        </div>
      </div>
      <Link href={planUrl}
        className="shrink-0 text-xs font-extrabold text-rose-700 border border-rose-300 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition whitespace-nowrap">
        ← Back to Plan
      </Link>
    </div>
  );
}

export default function VendorProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const [vendor, setVendor]       = useState<Vendor | null>(null);
  const [loading, setLoading]     = useState(true);
  const [showLead, setShowLead]   = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<VendorPackage | null>(null);
  const [galleryIdx, setGalleryIdx]   = useState(0);

  // Context from plan page
  const fromEventType = searchParams.get('from') || '';
  const fromBudget    = searchParams.get('budget') || '';
  const fromCityId    = searchParams.get('cityId') || '';

  const openLead = useCallback(() => setShowLead(true), []);
  useLeadTrigger(openLead, { enabled: !!vendor && !loading });

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

  const allImages = vendor.portfolioImages ?? [];
  const safeIdx   = Math.min(galleryIdx, Math.max(0, allImages.length - 1));

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8 pb-24 md:pb-8">
      {/* Context banner — shown when arriving from plan page */}
      {fromEventType && (
        <FromPlanBanner eventType={fromEventType} budget={fromBudget} cityId={fromCityId} />
      )}

      {/* Portfolio Hero with gallery navigation */}
      <div className="relative h-64 sm:h-80 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl overflow-hidden mb-2 group">
        {allImages[safeIdx] ? (
          <Image key={safeIdx} src={allImages[safeIdx]} alt={vendor.businessName} fill className="object-cover transition-opacity duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl text-purple-200 font-bold">
            {vendor.businessName[0]}
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Gallery nav arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={() => setGalleryIdx(i => (i - 1 + allImages.length) % allImages.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition hover:bg-black/70 active:bg-black/80"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setGalleryIdx(i => (i + 1) % allImages.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition hover:bg-black/70 active:bg-black/80"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {vendor.isFeatured && (
            <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm">⭐ Featured</span>
          )}
          {vendor.isVerified && (
            <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">✓ Verified</span>
          )}
        </div>

        {/* Image counter */}
        {allImages.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            {safeIdx + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Gallery dot nav */}
      {allImages.length > 1 && (
        <div className="flex justify-center gap-1.5 mb-5 mt-2">
          {allImages.map((_, i) => (
            <button key={i} onClick={() => setGalleryIdx(i)}
              className={`rounded-full transition-all duration-200 ${i === safeIdx ? 'w-5 h-2 bg-purple-600' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'}`} />
          ))}
        </div>
      )}

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

          {/* Suggested packages — context-aware when arriving from plan page */}
          <SuggestedPackages
            vendorId={vendor.id}
            onSelect={(pkg) => { setSelectedPkg(pkg); setShowLead(true); }}
            eventType={fromEventType || undefined}
            budget={fromBudget ? Number(fromBudget) : undefined}
            categoryId={vendor.categories?.[0]?.id}
          />

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

          {/* Portfolio thumbnails */}
          {allImages.length > 1 && (
            <div>
              <h2 className="font-bold text-gray-900 mb-3">Portfolio</h2>
              <div className="grid grid-cols-4 gap-2">
                {allImages.slice(0, 8).map((img, i) => (
                  <button key={i} onClick={() => setGalleryIdx(i)}
                    className={`aspect-square relative rounded-xl overflow-hidden bg-gray-100 border-2 transition ${i === safeIdx ? 'border-purple-500 shadow-sm' : 'border-transparent hover:border-gray-300'}`}>
                    <Image src={img} alt={`Portfolio ${i + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky CTA Card */}
        <div className="md:col-span-1">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-md p-5 md:sticky md:top-20 overflow-hidden">
            {/* Accent top bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-t-2xl" />

            {/* Price */}
            {vendor.minPrice && (
              <div className="mb-4 mt-1">
                <p className="text-xs text-gray-400 mb-0.5 font-semibold uppercase tracking-wide">Starting From</p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-extrabold text-gray-900">
                    ₹{Number(vendor.minPrice).toLocaleString('en-IN')}
                  </p>
                  {vendor.maxPrice && (
                    <p className="text-sm text-gray-400 mb-1 font-semibold">
                      – ₹{Number(vendor.maxPrice).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
                {vendor.priceUnit && <p className="text-xs text-gray-400 mt-0.5">{vendor.priceUnit}</p>}
              </div>
            )}

            {/* Social proof */}
            {vendor.reviewCount > 0 && (
              <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2 mb-4">
                <span className="text-yellow-500 font-extrabold text-sm">★ {Number(vendor.rating).toFixed(1)}</span>
                <span className="text-xs text-gray-500">{vendor.reviewCount} verified reviews</span>
                {vendor.isFeatured && <span className="ml-auto text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">Featured</span>}
              </div>
            )}

            <button
              onClick={() => { setSelectedPkg(null); setShowLead(true); }}
              className="w-full bg-gradient-to-r from-purple-700 to-violet-700 hover:from-purple-800 hover:to-violet-800 text-white font-bold py-3.5 rounded-xl transition mb-3 text-base shadow-lg shadow-purple-200"
            >
              Get Free Quote
            </button>

            {vendor.phone && (
              <a
                href={`tel:+91${vendor.phone}`}
                className="w-full flex items-center justify-center gap-2 border-2 border-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:border-purple-300 hover:text-purple-700 transition text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Now
              </a>
            )}

            <div className="mt-4 pt-4 border-t border-gray-50 space-y-2.5 text-xs text-gray-500">
              <p className="flex items-center gap-2 font-medium"><span>🛡️</span> Verified Business</p>
              <p className="flex items-center gap-2 font-medium"><span>💬</span> Free Quote — No Hidden Charges</p>
              <p className="flex items-center gap-2 font-medium"><span>⚡</span> Usually responds within 2 hours</p>
              {vendor.yearsOfExperience && (
                <p className="flex items-center gap-2 font-medium"><span>🏆</span> {vendor.yearsOfExperience}+ years of experience</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA bar */}
      <div className="md:hidden mobile-cta-bar flex items-center gap-3">
        <button
          onClick={() => { setSelectedPkg(null); setShowLead(true); }}
          className="flex-1 bg-gradient-to-r from-purple-700 to-violet-700 text-white font-extrabold py-3 rounded-2xl text-sm shadow-lg shadow-purple-200 active:scale-[0.98] transition"
        >
          Get Free Quote
        </button>
        {vendor.phone && (
          <a
            href={`tel:+91${vendor.phone}`}
            className="shrink-0 w-12 h-12 border-2 border-gray-100 rounded-2xl flex items-center justify-center text-gray-700 active:bg-gray-50 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </a>
        )}
      </div>

      {showLead && (
        <SmartLeadModal
          mode="single"
          vendorId={vendor.id}
          vendorName={vendor.businessName}
          categoryId={selectedPkg?.categoryId ?? vendor.categories?.[0]?.id}
          serviceType={vendor.categories?.[0]?.name}
          packageId={selectedPkg?.id}
          onClose={() => { setShowLead(false); setSelectedPkg(null); }}
        />
      )}
    </div>
  );
}

/* ── Premium Vendor Not Found ──────────────────────────────────────────── */
function VendorNotFound({ slug }: { slug: string }) {
  const SUGGESTIONS = [
    { label: 'Wedding Photographers', href: '/photographers-in-delhi', icon: '📸' },
    { label: 'Event Caterers', href: '/caterers-in-delhi', icon: '🍽️' },
    { label: 'Party Venues', href: '/event-venues-in-delhi', icon: '🏛️' },
    { label: 'DJ & Music', href: '/dj-services-in-delhi', icon: '🎵' },
    { label: 'Bridal Makeup', href: '/makeup-artists-in-delhi', icon: '💄' },
    { label: 'Event Decorators', href: '/decorators-in-delhi', icon: '🌸' },
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
