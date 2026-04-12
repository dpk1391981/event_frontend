'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Star, MapPin, Zap, TrendingUp, Heart, ChevronRight,
  Sparkles, DollarSign, Users, AlertCircle, X,
} from 'lucide-react';
import { recommendationsApi, activityApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { useActivityTracker } from '@/hooks/useActivityTracker';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScoredVendor {
  vendor: {
    id: number; businessName: string; slug: string;
    city?: { name: string }; rating?: number; leadCount?: number;
    minPrice?: number; maxPrice?: number; isFeatured?: boolean;
    categories?: { name: string }[];
  };
  score: number;
  reasons: string[];
}

interface ScoredPackage {
  package: {
    id: number; title: string; price: string;
    tag?: string; description?: string;
    vendor?: { businessName: string };
    city?: { name: string };
  };
  score: number;
  reasons: string[];
}

// ─── Vendor Card ─────────────────────────────────────────────────────────────

function VendorCard({ sv, onTrack }: { sv: ScoredVendor; onTrack: (id: number) => void }) {
  const router = useRouter();
  const v = sv.vendor;

  const TAG_MAP: Record<string, { label: string; color: string }> = {
    in_your_city:    { label: '📍 Near You',     color: 'bg-blue-100 text-blue-700' },
    matches_budget:  { label: '💰 Your Budget',  color: 'bg-green-100 text-green-700' },
    matches_services:{ label: '✓ Matches You',   color: 'bg-purple-100 text-purple-700' },
    top_rated:       { label: '⭐ Top Rated',     color: 'bg-amber-100 text-amber-700' },
    featured:        { label: '🔥 Featured',     color: 'bg-red-100 text-red-700' },
  };

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group"
      onClick={() => { onTrack(v.id); router.push(`/vendors/${v.slug ?? v.id}`); }}
    >
      {/* Gradient header */}
      <div className="h-20 bg-gradient-to-br from-red-50 to-rose-100 relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
          <span className="text-xl font-bold text-red-600">{v.businessName?.[0]?.toUpperCase()}</span>
        </div>
        {v.isFeatured && (
          <span className="absolute top-2 right-2 px-2 py-0.5 bg-red-600 text-white text-xs font-semibold rounded-full">
            Featured
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-sm truncate group-hover:text-red-600 transition-colors">
          {v.businessName}
        </h3>
        <div className="flex items-center gap-1 mt-1">
          {v.city && (
            <span className="text-xs text-gray-500 flex items-center gap-0.5">
              <MapPin className="w-3 h-3" /> {v.city.name}
            </span>
          )}
          {v.rating && Number(v.rating) > 0 && (
            <span className="text-xs text-amber-600 flex items-center gap-0.5 ml-auto">
              <Star className="w-3 h-3 fill-amber-400" /> {Number(v.rating).toFixed(1)}
            </span>
          )}
        </div>
        {v.minPrice && (
          <p className="text-xs text-gray-500 mt-1">
            From ₹{Number(v.minPrice).toLocaleString('en-IN')}
          </p>
        )}
        {/* Reason tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {sv.reasons.slice(0, 2).map(r => {
            const tag = TAG_MAP[r];
            return tag ? (
              <span key={r} className={`text-xs px-2 py-0.5 rounded-full font-medium ${tag.color}`}>
                {tag.label}
              </span>
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Package Card ─────────────────────────────────────────────────────────────

function PackageCard({ sp }: { sp: ScoredPackage }) {
  const TAG_COLORS: Record<string, string> = {
    budget:   'bg-green-100 text-green-700',
    standard: 'bg-blue-100 text-blue-700',
    premium:  'bg-purple-100 text-purple-700',
    luxury:   'bg-amber-100 text-amber-700',
  };
  const pkg = sp.package;
  const tag = pkg.tag ?? 'standard';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-4">
      <div className="flex items-start justify-between mb-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${TAG_COLORS[tag] ?? TAG_COLORS.standard}`}>
          {tag}
        </span>
        <p className="text-sm font-bold text-red-600">₹{Number(pkg.price).toLocaleString('en-IN')}</p>
      </div>
      <h3 className="font-bold text-gray-900 text-sm leading-tight">{pkg.title}</h3>
      {pkg.vendor && (
        <p className="text-xs text-gray-500 mt-1">{pkg.vendor.businessName}</p>
      )}
      {pkg.city && (
        <p className="text-xs text-gray-400 flex items-center gap-0.5 mt-1">
          <MapPin className="w-3 h-3" /> {pkg.city.name}
        </p>
      )}
    </div>
  );
}

// ─── Best Deal CTA Banner ─────────────────────────────────────────────────────

function BestDealBanner({ onDismiss }: { onDismiss: () => void }) {
  const router = useRouter();
  const { trackNow } = useActivityTracker();

  return (
    <div className="relative bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl p-5 text-white overflow-hidden">
      <div className="absolute inset-0 bg-black/10 rounded-2xl" />
      <button onClick={onDismiss} className="absolute top-3 right-3 text-white/70 hover:text-white">
        <X className="w-4 h-4" />
      </button>
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 fill-yellow-300 text-yellow-300" />
          <span className="text-sm font-bold">High-Intent Match Detected!</span>
        </div>
        <p className="text-sm text-red-100 mb-4">
          You've been browsing vendors. Want us to connect you with the best match instantly?
        </p>
        <button
          onClick={() => {
            trackNow('get_best_deal', { metadata: { source: 'banner' } });
            router.push('/plan');
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-red-600 font-bold text-sm rounded-xl hover:bg-red-50 transition-all"
        >
          Get Best Deal <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, subtitle, color }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string; subtitle?: string; color: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <h2 className="font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function RecommendedSection() {
  const { user, preferences } = useAppStore();
  const { track, trackVendorView } = useActivityTracker();

  const [data, setData]         = useState<any>(null);
  const [packages, setPackages] = useState<ScoredPackage[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showCta, setShowCta]   = useState(false);

  useEffect(() => {
    if (!user || !user.onboardingComplete) { setLoading(false); return; }

    Promise.all([
      recommendationsApi.getVendors(6).catch(() => null),
      recommendationsApi.getPackages(6).catch(() => null),
      activityApi.getBestDealCta().catch(() => ({ show: false })),
    ]).then(([vendors, pkgs, cta]) => {
      setData(vendors);
      setPackages((pkgs as any) ?? []);
      setShowCta((cta as any)?.show ?? false);
    }).finally(() => setLoading(false));
  }, [user]);

  if (!user || !user.onboardingComplete || loading) return null;
  if (!data) return null;

  const { forYou = [], byBudget = [], popular = [] } = data;

  if (!forYou.length && !byBudget.length && !popular.length) return null;

  const handleVendorTrack = (vendorId: number) => {
    trackVendorView(vendorId);
  };

  return (
    <div className="space-y-10 py-8">
      {/* Best Deal CTA */}
      {showCta && (
        <div className="container mx-auto px-4">
          <BestDealBanner onDismiss={() => setShowCta(false)} />
        </div>
      )}

      {/* Personalization intro */}
      {preferences?.eventType && (
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl p-4 flex items-center gap-3 border border-red-100">
            <Sparkles className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-gray-700">
              Showing results personalized for your{' '}
              <strong className="text-red-600 capitalize">{preferences.eventType}</strong>
              {preferences.budgetMax && (
                <> with budget up to <strong className="text-red-600">₹{Number(preferences.budgetMax).toLocaleString('en-IN')}</strong></>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Recommended For You */}
      {forYou.length > 0 && (
        <section className="container mx-auto px-4">
          <SectionHeader
            icon={Sparkles} color="bg-red-600"
            title="Recommended For You"
            subtitle="Based on your preferences and activity"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {forYou.slice(0, 6).map((sv: ScoredVendor) => (
              <VendorCard key={sv.vendor.id} sv={sv} onTrack={handleVendorTrack} />
            ))}
          </div>
        </section>
      )}

      {/* Packages */}
      {packages.length > 0 && (
        <section className="container mx-auto px-4">
          <SectionHeader
            icon={DollarSign} color="bg-green-600"
            title="Packages Within Your Budget"
            subtitle={preferences?.budgetMax
              ? `Under ₹${Number(preferences.budgetMax).toLocaleString('en-IN')}`
              : 'Best value packages'
            }
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {packages.slice(0, 6).map((sp: ScoredPackage) => (
              <PackageCard key={sp.package.id} sp={sp} />
            ))}
          </div>
        </section>
      )}

      {/* Popular */}
      {popular.length > 0 && (
        <section className="container mx-auto px-4">
          <SectionHeader
            icon={TrendingUp} color="bg-blue-600"
            title="Popular in Your Area"
            subtitle={preferences?.cityId ? 'Top vendors near you' : 'Trending across India'}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {popular.slice(0, 6).map((sv: ScoredVendor) => (
              <VendorCard key={sv.vendor.id} sv={sv} onTrack={handleVendorTrack} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
