'use client';

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { searchApi, locationsApi, categoriesApi } from '@/lib/api';
import { City, Category, EventPlan, Vendor } from '@/types';
import { CATEGORY_TO_SEO } from '@/lib/seo-urls';
import LeadModal from '@/components/lead/LeadModal';

// ─── UI-only constants (visual/text, not data) ────────────────────────────────

/** Budget quick-select presets — UI only, no business logic */
const BUDGET_PRESETS = ['50000', '200000', '500000', '1000000'];

/**
 * Visual palette for category sections.
 * Strings appear STATICALLY so Tailwind includes them in the CSS bundle.
 * Assigned deterministically per category slug (hash-based) so the same
 * category always gets the same colour across page re-renders.
 */
const CAT_PALETTE = [
  { color: 'text-blue-600',   bg: 'bg-blue-500',   bar: 'bg-blue-500',   light: 'bg-blue-50',   border: 'border-blue-200'   },
  { color: 'text-orange-600', bg: 'bg-orange-500', bar: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-200' },
  { color: 'text-purple-600', bg: 'bg-purple-500', bar: 'bg-purple-500', light: 'bg-purple-50', border: 'border-purple-200' },
  { color: 'text-pink-600',   bg: 'bg-pink-500',   bar: 'bg-pink-500',   light: 'bg-pink-50',   border: 'border-pink-200'   },
  { color: 'text-yellow-600', bg: 'bg-yellow-500', bar: 'bg-yellow-500', light: 'bg-yellow-50', border: 'border-yellow-200' },
  { color: 'text-rose-600',   bg: 'bg-rose-500',   bar: 'bg-rose-500',   light: 'bg-rose-50',   border: 'border-rose-200'   },
  { color: 'text-teal-600',   bg: 'bg-teal-500',   bar: 'bg-teal-500',   light: 'bg-teal-50',   border: 'border-teal-200'   },
  { color: 'text-indigo-600', bg: 'bg-indigo-500', bar: 'bg-indigo-500', light: 'bg-indigo-50', border: 'border-indigo-200' },
  // reserved for misc / unknown categories
  { color: 'text-gray-500',   bg: 'bg-gray-400',   bar: 'bg-gray-400',   light: 'bg-gray-50',   border: 'border-gray-200'   },
] as const;

const LOADING_STEPS = [
  'Analysing your budget...',
  'Finding top vendors in your city...',
  'Matching by budget fit...',
  'Ranking by reviews & ratings...',
  'Scoring profile quality...',
  'Finalising your plan...',
];

const TRUST_ITEMS = [
  { icon: '✓', label: '2,000+ vendors' },
  { icon: '✓', label: '4.8★ avg rating' },
  { icon: '✓', label: 'Trusted by 50K+ users' },
  { icon: '✓', label: 'Free quotes always' },
];

const RANK_BADGES = [
  { label: '#1 Pick', cls: 'bg-yellow-400 text-yellow-900' },
  { label: '#2 Pick', cls: 'bg-gray-200 text-gray-700' },
  { label: '#3 Pick', cls: 'bg-orange-200 text-orange-800' },
];

/** Per-event-type gradient + accent config — wedding gets rose/gold warmth */
const EVENT_THEMES: Record<string, {
  heroFrom: string; heroVia: string; heroTo: string;
  glowA: string; glowB: string;
  accentText: string; badgeLabel: string; dotsBg: string;
}> = {
  wedding:   { heroFrom: 'from-rose-950',   heroVia: 'via-pink-950',   heroTo: 'to-red-900',   glowA: 'rgba(244,63,94,0.45)',  glowB: 'rgba(251,113,133,0.25)', accentText: 'text-rose-300',   badgeLabel: '💍 Wedding Plan',   dotsBg: 'bg-rose-500/20' },
  birthday:  { heroFrom: 'from-purple-950', heroVia: 'via-violet-950', heroTo: 'to-indigo-900',glowA: 'rgba(139,92,246,0.4)',  glowB: 'rgba(167,139,250,0.2)', accentText: 'text-purple-300', badgeLabel: '🎂 Birthday Plan',  dotsBg: 'bg-purple-500/20' },
  corporate: { heroFrom: 'from-blue-950',   heroVia: 'via-slate-950',  heroTo: 'to-indigo-900',glowA: 'rgba(59,130,246,0.35)', glowB: 'rgba(99,102,241,0.2)',  accentText: 'text-blue-300',   badgeLabel: '💼 Corporate Plan', dotsBg: 'bg-blue-500/20' },
  default:   { heroFrom: 'from-gray-950',   heroVia: 'via-red-950',    heroTo: 'to-gray-900',  glowA: 'rgba(239,68,68,0.4)',   glowB: 'rgba(251,113,133,0.2)', accentText: 'text-red-300',    badgeLabel: '🎉 Event Plan',     dotsBg: 'bg-red-500/20' },
};

function getEventTheme(slug: string) {
  return EVENT_THEMES[slug] ?? EVENT_THEMES.default;
}

/** Budget tier meta — what does the budget tier *mean* for the user */
function getBudgetTier(budget: number, eventType: string) {
  const isWedding = eventType === 'wedding';
  if (budget < 50000)   return { tier: 'Essential',    icon: '🌱', desc: isWedding ? 'Small intimate ceremony' : 'Core services covered',               color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200' };
  if (budget < 150000)  return { tier: 'Comfortable',  icon: '🌟', desc: isWedding ? 'Covers most wedding essentials' : 'Solid multi-service coverage',    color: 'text-blue-700',   bg: 'bg-blue-50',     border: 'border-blue-200' };
  if (budget < 500000)  return { tier: 'Premium',      icon: '💎', desc: isWedding ? 'Full coverage — quality vendors for every service' : 'Premium multi-vendor plan', color: 'text-purple-700', bg: 'bg-purple-50',   border: 'border-purple-200' };
  return                       { tier: 'Grand',         icon: '👑', desc: isWedding ? 'Luxury wedding — best-in-class vendors' : 'All-inclusive top-tier event',color: 'text-yellow-700', bg: 'bg-yellow-50',   border: 'border-yellow-200' };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type CatStyle = (typeof CAT_PALETTE)[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n >= 100000
    ? `₹${n / 100000 % 1 === 0 ? (n / 100000).toFixed(0) : (n / 100000).toFixed(1)}L`
    : `₹${(n / 1000).toFixed(0)}K`;

const fmtFull = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const budgetFits = (v: Vendor, alloc: number) =>
  !Number(v.minPrice) || Number(v.minPrice) <= alloc;

/**
 * Composite match score: budgetFit 50% · rating 30% · profileScore 20%
 * Uses backend-pre-computed score when available to stay in sync with server logic.
 */
function matchScore(v: Vendor, alloc: number): number {
  if (typeof v.matchScore === 'number') return v.matchScore;
  const min = Number(v.minPrice) || 0;
  const max = Number(v.maxPrice) || 0;
  let bf = 50;
  if (min && max)  bf = min <= alloc && max >= alloc * 0.5 ? 100 : min <= alloc ? 80 : Math.max(0, 100 - ((min - alloc) / alloc) * 80);
  else if (min)    bf = min <= alloc ? 80 : Math.max(0, 100 - ((min - alloc) / alloc) * 80);
  return Math.min(100, Math.round(bf * 0.50 + (Number(v.rating) / 5 * 100) * 0.30 + (Number(v.profileScore) || 0) * 0.20));
}

/** Deterministic palette slot for a category slug (same slug → same colour always) */
function getCatStyle(slug: string): CatStyle {
  if (!slug || slug === 'misc') return CAT_PALETTE[CAT_PALETTE.length - 1];
  const hash = Array.from(slug).reduce((h, c) => (h * 31 + c.charCodeAt(0)) & 0xffff, 0);
  return CAT_PALETTE[hash % (CAT_PALETTE.length - 1)];
}

/**
 * Combines API category data (icon, display name) with deterministic palette.
 * Falls back gracefully when the category is not in the fetched list.
 */
function getCatMeta(slug: string, catMap: Map<string, Category>) {
  const cat = catMap.get(slug);
  const style = getCatStyle(slug);
  const icon  = cat?.icon || '✨';
  const name  = cat?.name  || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return { ...style, icon, name };
}

function buildPlanSlug(eventSlug: string, citySlug: string, budget: number): string {
  const b = budget >= 100000 ? `${Math.round(budget / 100000)}l` : `${Math.round(budget / 1000)}k`;
  return `${eventSlug}-plan-${citySlug}-under-${b}`;
}

// ─── 1. Loading Screen ────────────────────────────────────────────────────────

function PlanLoading({ eventType, eventCategories }: { eventType: string; eventCategories: Category[] }) {
  const [idx, setIdx] = useState(0);
  const label = eventCategories.find(e => e.slug === eventType) || { icon: '🎉', name: 'Event' };

  useEffect(() => {
    const t = setInterval(() => setIdx(i => Math.min(i + 1, LOADING_STEPS.length - 1)), 700);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] gap-6 px-4">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-4 border-red-100" />
        <div className="absolute inset-0 rounded-full border-4 border-t-red-600 border-r-red-400 border-b-transparent border-l-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-3xl">{label.icon}</div>
      </div>
      <div className="text-center">
        <p className="text-gray-900 font-extrabold text-xl mb-1">{LOADING_STEPS[idx]}</p>
        <p className="text-gray-400 text-sm">Building your personalised {label.name.toLowerCase()} plan</p>
      </div>
      <div className="flex gap-1.5">
        {LOADING_STEPS.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= idx ? 'bg-red-500 w-8' : 'bg-gray-200 w-1.5'}`} />
        ))}
      </div>
      <div className="w-full max-w-lg space-y-3 mt-2 opacity-40">
        <div className="h-16 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 2. Hero Summary (editable) ───────────────────────────────────────────────

function PlanHero({
  plan, cityName, form, catMap, onEdit,
}: {
  plan: EventPlan;
  cityName?: string;
  form: { eventType: string; budget: string; guestCount: string };
  catMap: Map<string, Category>;
  onEdit: () => void;
}) {
  const eventCat  = catMap.get(form.eventType);
  const eventIcon = eventCat?.icon || '🎉';
  const eventName = eventCat?.name || form.eventType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const cats = plan.plan.filter(p => p.category !== 'misc');
  const totalVendors = cats.reduce((s, c) => s + c.vendors.length, 0);
  const theme = getEventTheme(form.eventType);
  const budgetTier = getBudgetTier(Number(form.budget), form.eventType);

  return (
    <div className={`relative bg-gradient-to-br ${theme.heroFrom} ${theme.heroVia} ${theme.heroTo} rounded-2xl overflow-hidden`}>
      {/* Decorative confetti dots for wedding */}
      {form.eventType === 'wedding' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(18)].map((_, i) => (
            <div key={i} className={`absolute w-1.5 h-1.5 rounded-full ${theme.dotsBg}`}
              style={{ top: `${10 + (i * 17 + i * 3) % 80}%`, left: `${5 + (i * 23 + i * 7) % 90}%`, opacity: 0.6 }} />
          ))}
        </div>
      )}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `radial-gradient(circle at 15% 50%, ${theme.glowA} 0%, transparent 55%), radial-gradient(circle at 85% 20%, ${theme.glowB} 0%, transparent 50%)`,
      }} />
      {/* Budget tier ribbon */}
      <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl rounded-tr-2xl ${budgetTier.bg} border-b border-l ${budgetTier.border}`}>
        <span className={`text-[10px] font-extrabold uppercase tracking-widest ${budgetTier.color}`}>
          {budgetTier.icon} {budgetTier.tier} Budget
        </span>
      </div>

      <div className="relative px-5 pt-5 pb-4">
        {/* Top row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold bg-green-500 text-white rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />Plan Ready
              </span>
              <span className="text-xs font-bold bg-white/10 text-white/70 rounded-full px-3 py-1">
                {totalVendors} vendors matched
              </span>
              {plan.summary?.confidenceScore > 0 && (
                <span className={`text-xs font-bold rounded-full px-3 py-1 ${
                  plan.summary.confidenceScore >= 75
                    ? 'bg-green-500/20 text-green-300'
                    : plan.summary.confidenceScore >= 50
                    ? 'bg-yellow-500/20 text-yellow-300'
                    : 'bg-white/10 text-white/50'
                }`}>
                  {plan.summary.confidenceScore}% confidence
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
              {eventIcon} {eventName}
              {cityName && <span className="text-white/70"> in {cityName}</span>}
            </h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`text-sm font-bold ${theme.accentText}`}>{fmtFull(plan.totalBudget)}</span>
              {plan.guestCount && <span className="text-sm text-white/60">· {plan.guestCount} guests</span>}
              <span className="text-sm text-white/60">· {cats.length} categories</span>
            </div>
          </div>
          <button
            onClick={onEdit}
            className="shrink-0 flex items-center gap-1.5 text-xs font-bold border border-white/25 text-white/70 hover:text-white hover:border-white/50 rounded-xl px-3 py-2 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Plan
          </button>
        </div>

        {/* Stacked budget bar */}
        <div className="mb-3">
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1.5">Budget allocation</p>
          <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
            {cats.map(item => {
              const m = getCatStyle(item.category);
              return (
                <div
                  key={item.category}
                  className={m.bar}
                  style={{ width: `${item.budgetAllocation}%` }}
                  title={`${item.category}: ${fmt(item.allocatedBudget)}`}
                />
              );
            })}
          </div>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {cats.map(item => {
            const m = getCatStyle(item.category);
            const cat = catMap.get(item.category);
            return (
              <span key={item.category} className="flex items-center gap-1 text-[11px] text-white/50">
                <span className={`w-2 h-2 rounded-full ${m.bar}`} />
                <span className="capitalize">{cat?.name || item.category}</span>
                <span className="text-white/30">{fmt(item.allocatedBudget)}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── 3. Trust Bar ─────────────────────────────────────────────────────────────

function TrustBar() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
      {TRUST_ITEMS.map(t => (
        <span key={t.label} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
          <span className="w-4 h-4 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0">{t.icon}</span>
          {t.label}
        </span>
      ))}
    </div>
  );
}

// ─── 4. Smart Summary ─────────────────────────────────────────────────────────

function SmartSummary({ plan, cityName, catMap }: { plan: EventPlan; cityName?: string; catMap: Map<string, Category> }) {
  const cats = plan.plan.filter(p => p.category !== 'misc');
  const totalVendors = cats.reduce((s, c) => s + c.vendors.length, 0);

  const categoriesFound = cats.filter(c => c.vendors.length > 0).length;
  const coveredNames = cats
    .filter(c => c.vendors.length > 0)
    .slice(0, 3)
    .map(c => catMap.get(c.category)?.name || c.category)
    .join(', ');

  // Prefer server-computed confidence score; fall back to client average
  const confidenceScore = plan.summary?.confidenceScore
    ?? Math.round(cats.flatMap(c => c.vendors.map(v => matchScore(v, c.allocatedBudget))).reduce((s, x, _, a) => s + x / a.length, 0));

  // Prefer server-computed estimated total
  const estimatedTotal = plan.summary?.estimatedTotal ?? 0;
  const withinBudget = plan.summary?.withinBudget ?? true;

  const points = [
    {
      icon: '🎯',
      text: `${totalVendors} vendors matched`,
      sub: coveredNames || 'All within your price range',
    },
    {
      icon: '📍',
      text: `Optimised for ${cityName || 'your city'}`,
      sub: 'Hyperlocal results only',
    },
    {
      icon: estimatedTotal > 0 ? (withinBudget ? '✅' : '⚠️') : '⭐',
      text: estimatedTotal > 0
        ? `Est. total: ${fmtFull(estimatedTotal)}`
        : `${confidenceScore}% avg match`,
      sub: estimatedTotal > 0
        ? (withinBudget ? 'Within your budget' : 'Slightly over — negotiate for better rates')
        : `${categoriesFound} of ${cats.length} categories covered`,
    },
  ];

  return (
    <div className="grid sm:grid-cols-3 gap-3">
      {points.map(p => (
        <div key={p.text} className="bg-white border border-gray-100 rounded-xl px-4 py-3.5 flex items-start gap-3 shadow-sm">
          <span className="text-xl shrink-0">{p.icon}</span>
          <div>
            <p className="text-xs font-extrabold text-gray-900 leading-snug">{p.text}</p>
            <p className="text-[11px] text-gray-400 mt-0.5 capitalize">{p.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 4b. Budget Insight Card ──────────────────────────────────────────────────

function BudgetInsightCard({ budget, eventType, cityName }: { budget: number; eventType: string; cityName?: string }) {
  const tier = getBudgetTier(budget, eventType);
  const isWedding = eventType === 'wedding';
  const tips = isWedding
    ? ['Allocate 30-40% to venue & catering', 'Book photographers 3+ months in advance', 'Negotiate bundle deals across vendors']
    : ['Compare 2-3 vendors per category', 'Get quotes before finalizing budget', 'Ask about off-season discounts'];

  return (
    <div className={`rounded-2xl border ${tier.border} ${tier.bg} overflow-hidden`}>
      <div className="px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${tier.bg} border ${tier.border}`}>
            {tier.icon}
          </div>
          <div>
            <p className={`text-xs font-extrabold uppercase tracking-widest ${tier.color}`}>{tier.tier} Tier</p>
            <p className="text-sm font-bold text-gray-800">{tier.desc}</p>
          </div>
        </div>
        {cityName && (
          <span className={`hidden sm:block text-xs font-semibold ${tier.color} shrink-0`}>
            📍 {cityName}
          </span>
        )}
      </div>
      <div className={`px-5 pb-4 flex flex-wrap gap-x-4 gap-y-1`}>
        {tips.map(t => (
          <span key={t} className={`text-[11px] font-semibold ${tier.color} flex items-center gap-1`}>
            <span>→</span> {t}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── 5. Recommended Package ───────────────────────────────────────────────────

function RecommendedPackage({
  plan, catMap, onGetQuote, onGetAll, eventType,
}: {
  plan: EventPlan;
  catMap: Map<string, Category>;
  onGetQuote: (v: Vendor) => void;
  onGetAll: (vendors: Vendor[]) => void;
  eventType?: string;
}) {
  const picks = plan.plan
    .filter(i => i.vendors.length > 0 && i.category !== 'misc')
    .map(i => ({ ...i, top: i.vendors[0], score: matchScore(i.vendors[0], i.allocatedBudget) }));

  if (picks.length === 0) return null;

  const estimatedTotal = plan.summary?.estimatedTotal
    ?? picks.reduce((s, p) => s + (p.top.priceEstimate || Number(p.top.minPrice) || 0), 0);
  const allVendors   = picks.map(p => p.top);
  const withinBudget = plan.summary?.withinBudget ?? estimatedTotal <= plan.totalBudget;
  const savings      = withinBudget && estimatedTotal > 0 ? plan.totalBudget - estimatedTotal : 0;
  const isWedding    = eventType === 'wedding';
  const theme        = getEventTheme(eventType || 'default');

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-800 shadow-xl">
      {/* Header */}
      <div className={`bg-gradient-to-br ${theme.heroFrom} ${theme.heroVia} ${theme.heroTo} px-5 pt-5 pb-0`}>
        {/* Vendor avatar row */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex -space-x-2">
            {picks.slice(0, 5).map(({ top }, i) => (
              <div key={top.id} className="w-9 h-9 rounded-full border-2 border-white/20 overflow-hidden bg-white/10 flex items-center justify-center text-sm font-bold text-white relative"
                style={{ zIndex: 10 - i }}>
                {top.portfolioImages?.[0]
                  ? <Image src={top.portfolioImages[0]} alt={top.businessName} fill sizes="36px" className="object-cover" />
                  : top.businessName[0]}
              </div>
            ))}
            {picks.length > 5 && (
              <div className="w-9 h-9 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/70">
                +{picks.length - 5}
              </div>
            )}
          </div>
          <div className="ml-1">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-extrabold ${isWedding ? 'bg-rose-500' : 'bg-red-600'} text-white rounded-full px-2.5 py-0.5 uppercase tracking-wide`}>
                {isWedding ? '💍 Dream Package' : 'AI Curated'}
              </span>
              <span className="text-[10px] text-white/40 font-semibold">{picks.length} vendors · best combo for your budget</span>
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4 pb-4">
          <div>
            <h2 className="text-white font-extrabold text-lg leading-tight">
              {isWedding ? 'Your Dream Wedding Package' : 'Recommended Package'}
            </h2>
            <p className="text-white/40 text-xs mt-0.5">Top vendor from each category — ranked by budget fit + rating</p>
          </div>
          {estimatedTotal > 0 && (
            <div className="text-right shrink-0">
              <p className="text-white/40 text-[10px] mb-0.5">Estimated total</p>
              <p className="text-white font-extrabold text-xl">{fmt(estimatedTotal)}</p>
              <p className={`text-[10px] font-bold mt-0.5 ${withinBudget ? 'text-green-400' : 'text-amber-400'}`}>
                {withinBudget
                  ? savings > 0 ? `✓ Saves you ${fmt(savings)}` : '✓ Within your budget'
                  : '⚠ Slightly over budget'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Vendor list */}
      <div className="bg-white divide-y divide-gray-50">
        {picks.map(({ category, top, allocatedBudget, score }) => {
          const m = getCatMeta(category, catMap);
          return (
            <div key={category} className="px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50/80 transition group">
              <div className={`w-9 h-9 ${m.bg} rounded-xl flex items-center justify-center text-base shrink-0`}>
                {m.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] font-extrabold uppercase tracking-widest ${m.color} mb-0.5`}>{m.name}</p>
                <Link href={`/vendor/${top.slug}`} className="text-sm font-extrabold text-gray-900 hover:text-red-700 transition line-clamp-1">
                  {top.businessName}
                </Link>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                  {top.city?.name && <span>{top.city.name}</span>}
                  {Number(top.rating) > 0 && <span className="text-yellow-500 font-bold">★ {Number(top.rating).toFixed(1)}</span>}
                  <span className={`font-bold ${score >= 80 ? 'text-green-600' : score >= 60 ? 'text-blue-600' : 'text-gray-500'}`}>{score}% match</span>
                </p>
              </div>
              {(top.priceEstimate || top.minPrice) && (
                <p className="text-sm font-extrabold text-gray-800 shrink-0 hidden sm:block">
                  {fmt(top.priceEstimate || Number(top.minPrice))}
                </p>
              )}
              <button
                onClick={() => onGetQuote(top)}
                className="shrink-0 text-xs font-extrabold bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg transition border border-red-200 hover:border-red-600"
              >
                Quote
              </button>
            </div>
          );
        })}
      </div>

      {/* CTA footer */}
      <div className={`bg-gradient-to-r ${isWedding ? 'from-rose-600 to-pink-700' : 'from-red-600 to-rose-700'} px-5 py-3.5 flex items-center justify-between gap-4`}>
        <div>
          <p className="text-white/90 text-xs font-semibold">Get quotes from all {picks.length} vendors at once</p>
          {savings > 0 && <p className="text-white/60 text-[10px] mt-0.5">Potential savings: {fmt(savings)} vs. top-range pricing</p>}
        </div>
        <button
          onClick={() => onGetAll(allVendors)}
          className="shrink-0 bg-white text-red-700 font-extrabold text-sm px-5 py-2.5 rounded-xl hover:bg-red-50 transition shadow-md whitespace-nowrap"
        >
          {isWedding ? 'Book Dream Package →' : 'Get Full Plan Quote →'}
        </button>
      </div>
    </div>
  );
}

// ─── 6. Budget Breakdown ──────────────────────────────────────────────────────

function BudgetBreakdown({ plan, catMap }: { plan: EventPlan; catMap: Map<string, Category> }) {
  const cats = plan.plan.filter(p => p.category !== 'misc');
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3.5 border-b border-gray-50 flex items-center justify-between">
        <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-widest">Budget Split</h3>
        <span className="text-xs font-bold text-gray-400">{fmtFull(plan.totalBudget)}</span>
      </div>
      <div className="p-4 space-y-3.5">
        {cats.map(item => {
          const m = getCatMeta(item.category, catMap);
          return (
            <div key={item.category}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-2 text-xs font-bold text-gray-700">
                  <span>{m.icon}</span>
                  <span>{m.name}</span>
                </span>
                <span className="text-xs font-extrabold text-gray-900">{fmt(item.allocatedBudget)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${m.bar}`} style={{ width: `${item.budgetAllocation}%` }} />
                </div>
                <span className={`text-[10px] font-extrabold w-7 text-right ${m.color}`}>{item.budgetAllocation}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 7. Vendor Card ───────────────────────────────────────────────────────────

function VendorCard({
  vendor, rank, allocatedBudget, isShortlisted, onToggle, onGetQuote,
}: {
  vendor: Vendor; rank: number; allocatedBudget: number;
  isShortlisted: boolean;
  onToggle: (v: Vendor) => void;
  onGetQuote: (v: Vendor) => void;
}) {
  const fits  = budgetFits(vendor, allocatedBudget);
  const score = matchScore(vendor, allocatedBudget);
  const minP  = Number(vendor.minPrice) || 0;
  const maxP  = Number(vendor.maxPrice) || 0;
  const priceStr = vendor.priceEstimate
    ? `Est. ${fmt(vendor.priceEstimate)}`
    : minP && maxP
    ? `₹${(minP / 1000).toFixed(0)}K – ₹${(maxP / 1000).toFixed(0)}K`
    : minP ? `From ₹${(minP / 1000).toFixed(0)}K` : null;
  const rb        = RANK_BADGES[rank - 1];
  const scoreColor = score >= 85 ? 'text-green-400' : score >= 65 ? 'text-blue-300' : 'text-gray-300';
  const isTopPick  = rank === 1;

  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 flex-shrink-0 w-[85vw] sm:w-auto snap-start bg-white ${
      isShortlisted
        ? 'border-rose-400 shadow-lg shadow-rose-100/60 ring-2 ring-rose-200'
        : isTopPick
        ? 'border-yellow-300 shadow-md shadow-yellow-50'
        : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
    }`}>
      {/* Image area */}
      <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden group">
        {vendor.portfolioImages?.[0] ? (
          <Image
            src={vendor.portfolioImages[0]} alt={vendor.businessName} fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-50 to-red-100 flex items-center justify-center">
            <span className="text-5xl font-extrabold text-rose-200 select-none">{vendor.businessName[0]}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {rb && (
          <span className={`absolute top-2 left-2 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm ${rb.cls}`}>
            {rb.label}
          </span>
        )}

        <button
          onClick={() => onToggle(vendor)}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition shadow-md ${
            isShortlisted ? 'bg-rose-500 text-white scale-110' : 'bg-white/80 backdrop-blur-sm text-gray-400 hover:text-rose-500 hover:scale-110'
          }`}
        >
          <svg className="w-4 h-4" fill={isShortlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Score pill at bottom */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          {vendor.isVerified && (
            <span className="bg-green-500/90 backdrop-blur-sm text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full">✓ Verified</span>
          )}
          <div className={`ml-auto bg-black/70 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] font-extrabold ${scoreColor}`}>
            {score}% match
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link href={`/vendor/${vendor.slug}`}>
            <h4 className="text-sm font-extrabold text-gray-900 hover:text-red-700 transition line-clamp-1 leading-snug">{vendor.businessName}</h4>
          </Link>
          {priceStr && <span className="text-xs font-extrabold text-gray-800 shrink-0 ml-1">{priceStr}</span>}
        </div>

        <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
          <svg className="w-3 h-3 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          {vendor.locality?.name ? `${vendor.locality.name}, ` : ''}{vendor.city?.name}
        </p>

        {Number(vendor.rating) > 0 && (
          <div className="flex items-center gap-1 mb-2.5">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(s => (
                <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(Number(vendor.rating)) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs font-bold text-gray-700">{Number(vendor.rating).toFixed(1)}</span>
            <span className="text-xs text-gray-400">({vendor.reviewCount})</span>
          </div>
        )}

        {vendor.reason && (
          <p className="text-[10px] text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1.5 rounded-xl mb-2.5 leading-relaxed">
            💡 {vendor.reason}
          </p>
        )}

        <div className="flex flex-wrap gap-1 mb-3">
          {fits && (
            <span className="text-[10px] font-extrabold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              ✓ Fits {fmt(allocatedBudget)}
            </span>
          )}
          {vendor.isFeatured && (
            <span className="text-[10px] font-extrabold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">⭐ Featured</span>
          )}
          {Number(vendor.rating) >= 4.5 && (
            <span className="text-[10px] font-extrabold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">🏆 Top Rated</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link href={`/vendor/${vendor.slug}`} className="text-center text-xs font-bold border-2 border-gray-100 text-gray-600 py-2 rounded-xl hover:border-red-300 hover:text-red-600 transition">
            View Profile
          </Link>
          <button
            onClick={() => onGetQuote(vendor)}
            className={`text-xs font-extrabold py-2 rounded-xl transition shadow-sm ${
              isTopPick ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            Get Quote
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 8. Category Section ──────────────────────────────────────────────────────

function CategorySection({
  item, catMap, shortlist, onToggle, onGetQuote, citySlug,
}: {
  item: EventPlan['plan'][0];
  catMap: Map<string, Category>;
  shortlist: Vendor[];
  onToggle: (v: Vendor) => void;
  onGetQuote: (v: Vendor) => void;
  citySlug?: string;
}) {
  const m = getCatMeta(item.category, catMap);
  // Prefer SEO URL when city is known; fall back to NLP search
  const browseHref = citySlug
    ? `/${(CATEGORY_TO_SEO[item.category] ?? item.category)}-in-${citySlug}`
    : `/search?q=${encodeURIComponent(m.name)}&nlp=1`;
  const shortlistedCount = item.vendors.filter(v => shortlist.some(s => s.id === v.id)).length;

  return (
    <div className={`rounded-2xl border overflow-hidden ${m.border} bg-white shadow-sm`}>
      {/* Header */}
      <div className={`px-5 py-4 ${m.light} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${m.bg} rounded-xl flex items-center justify-center text-xl shadow-sm`}>{m.icon}</div>
          <div>
            <h3 className="font-extrabold text-gray-900 text-sm">{m.name}</h3>
            <p className="text-xs text-gray-500">
              {item.vendors.length} match{item.vendors.length !== 1 ? 'es' : ''} · {item.budgetAllocation}% of budget
              {shortlistedCount > 0 && <span className="ml-2 text-red-600 font-bold">· {shortlistedCount} shortlisted</span>}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-extrabold text-lg ${m.color}`}>{fmt(item.allocatedBudget)}</p>
          <p className="text-[10px] text-gray-400">{fmtFull(item.allocatedBudget)}</p>
        </div>
      </div>

      {item.vendors.length > 0 ? (
        <>
          {/* Mobile: swipeable row */}
          <div className="sm:hidden flex gap-3 p-4 overflow-x-auto scroll-smooth snap-x snap-mandatory [&::-webkit-scrollbar]:hidden pb-2">
            {item.vendors.map((v, i) => (
              <VendorCard key={v.id} vendor={v} rank={i + 1} allocatedBudget={item.allocatedBudget}
                isShortlisted={shortlist.some(s => s.id === v.id)}
                onToggle={onToggle} onGetQuote={onGetQuote} />
            ))}
          </div>
          {/* Desktop: grid */}
          <div className="hidden sm:grid sm:grid-cols-3 gap-4 p-4">
            {item.vendors.map((v, i) => (
              <VendorCard key={v.id} vendor={v} rank={i + 1} allocatedBudget={item.allocatedBudget}
                isShortlisted={shortlist.some(s => s.id === v.id)}
                onToggle={onToggle} onGetQuote={onGetQuote} />
            ))}
          </div>
        </>
      ) : item.data_missing ? (
        <div className="px-5 py-10 text-center">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-sm font-bold text-amber-700 mb-1">No {m.name} vendors in your city match this budget</p>
          <p className="text-xs text-gray-400 mb-4">
            Budget allocated: <strong>{fmt(item.allocatedBudget)}</strong> — try increasing your total budget or expanding to nearby cities
          </p>
          <Link
            href={browseHref}
            className="text-xs font-extrabold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-full transition"
          >
            Browse all {m.name} vendors →
          </Link>
        </div>
      ) : (
        <div className="px-5 py-10 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm font-bold text-gray-600 mb-1">No vendors found for {m.name}</p>
          <p className="text-xs text-gray-400 mb-3">Try adjusting your budget or city</p>
          <Link href={browseHref} className="text-xs font-extrabold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-full transition">
            Browse {m.name} vendors →
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── 9. Shortlist Panel ───────────────────────────────────────────────────────

function ShortlistPanel({
  shortlist, onRemove, onGetQuote, onGetAll,
}: {
  shortlist: Vendor[];
  onRemove: (id: number) => void;
  onGetQuote: (v: Vendor) => void;
  onGetAll: (vendors: Vendor[]) => void;
}) {
  if (shortlist.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-5 text-center">
        <div className="text-3xl mb-2">❤️</div>
        <p className="text-sm font-bold text-gray-500">No vendors shortlisted yet</p>
        <p className="text-xs text-gray-400 mt-1">Tap ❤ on any vendor card to save</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-red-200 overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
        <svg className="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <p className="text-sm font-extrabold text-red-700">Your Shortlist</p>
        <span className="ml-auto text-xs font-extrabold bg-red-200 text-red-800 rounded-full px-2 py-0.5">{shortlist.length}</span>
      </div>
      <div className="divide-y divide-gray-50">
        {shortlist.map(v => (
          <div key={v.id} className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center text-red-300 font-extrabold text-base shrink-0">
              {v.businessName[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-gray-900 line-clamp-1">{v.businessName}</p>
              <p className="text-[11px] text-gray-400">
                {v.city?.name}{v.minPrice ? ` · From ₹${(Number(v.minPrice) / 1000).toFixed(0)}K` : ''}
              </p>
            </div>
            <button onClick={() => onGetQuote(v)} className="shrink-0 text-[10px] font-extrabold bg-red-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-red-700 transition">
              Quote
            </button>
            <button onClick={() => onRemove(v.id)} className="shrink-0 text-gray-300 hover:text-red-400 transition p-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-red-100 bg-red-50/50">
        <button
          onClick={() => onGetAll(shortlist)}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition"
        >
          Get Quotes from All {shortlist.length} →
        </button>
      </div>
    </div>
  );
}

// ─── 10. Share Plan Banner ────────────────────────────────────────────────────

function SharePlanBanner({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? `${window.location.origin}/event-plan/${slug}` : `/event-plan/${slug}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* */ }
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center text-sm shrink-0">🔗</div>
        <div>
          <p className="text-sm font-extrabold text-gray-900">Save or share this plan</p>
          <p className="text-xs text-gray-400">Permanent link — bookmark it or send to a friend</p>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-500 font-mono truncate">/event-plan/{slug}</div>
        <button onClick={copy} className={`shrink-0 text-xs font-extrabold px-3 py-2 rounded-xl transition ${copied ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'}`}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
        <Link href={`/event-plan/${slug}`} className="shrink-0 text-xs font-extrabold px-3 py-2 rounded-xl border-2 border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600 transition">
          Open →
        </Link>
      </div>
    </div>
  );
}

// ─── 11. Sticky Action Bar ────────────────────────────────────────────────────

function StickyActionBar({
  shortlistCount, plan, shortlist, onGetAll, onSavePlan,
}: {
  shortlistCount: number;
  plan: EventPlan | null;
  shortlist: Vendor[];
  onGetAll: (vendors: Vendor[]) => void;
  onSavePlan: () => void;
}) {
  if (!plan) return null;
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950/95 backdrop-blur-md border-t border-gray-800 px-4 py-3"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-5xl mx-auto flex items-center gap-3">
        <button
          onClick={() => shortlistCount > 0 && onGetAll(shortlist)}
          className={`flex items-center gap-2 text-xs font-bold transition shrink-0 ${shortlistCount > 0 ? 'text-red-400 hover:text-red-300' : 'text-gray-600 cursor-default'}`}
        >
          <svg className="w-4 h-4" fill={shortlistCount > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {shortlistCount > 0 ? `${shortlistCount} saved` : 'Shortlist'}
        </button>
        <div className="flex-1 grid grid-cols-2 gap-2">
          <button
            onClick={onSavePlan}
            className="text-xs font-extrabold border border-gray-700 text-gray-300 hover:border-white hover:text-white py-2.5 rounded-xl transition"
          >
            Save Plan
          </button>
          <button
            onClick={() => onGetAll(plan.plan.flatMap(i => i.vendors.slice(0, 1)))}
            className="text-xs font-extrabold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white py-2.5 rounded-xl transition shadow-lg shadow-red-900/40"
          >
            Get Quotes →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 12. Edit Plan Form (inline) ──────────────────────────────────────────────

function EditPlanForm({
  cities, eventCategories, form, setForm, onSubmit, onCancel, loading,
}: {
  cities: City[];
  eventCategories: Category[];
  form: { eventType: string; cityId: string; budget: string; guestCount: string };
  setForm: (f: typeof form) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border-2 border-red-200 shadow-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="font-extrabold text-gray-900 text-sm">Edit Plan</p>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-700 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Event type chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {eventCategories.map(et => (
          <button key={et.slug} type="button" onClick={() => setForm({ ...form, eventType: et.slug })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition ${
              form.eventType === et.slug ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:border-red-300'
            }`}>
            <span>{et.icon || '🎪'}</span>
            <span>{et.name}</span>
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1 block">City</label>
          <select value={form.cityId} onChange={e => setForm({ ...form, cityId: e.target.value })}
            className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-red-400 bg-gray-50 focus:bg-white transition appearance-none">
            <option value="">Select city</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1 block">Budget</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₹</span>
            <input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })}
              className="w-full border-2 border-gray-100 rounded-xl pl-6 pr-3 py-2.5 text-sm text-gray-800 outline-none focus:border-red-400 bg-gray-50 focus:bg-white transition" />
          </div>
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {BUDGET_PRESETS.map(b => (
              <button key={b} type="button" onClick={() => setForm({ ...form, budget: b })}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${
                  form.budget === b ? 'bg-red-600 text-white border-red-600' : 'border-gray-200 text-gray-500 hover:border-red-300'
                }`}>
                {Number(b) >= 100000 ? `₹${Number(b) / 100000}L` : `₹${Number(b) / 1000}K`}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1 block">Guests</label>
          <input type="number" placeholder="e.g. 200" value={form.guestCount}
            onChange={e => setForm({ ...form, guestCount: e.target.value })}
            className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-red-400 bg-gray-50 focus:bg-white transition" />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:border-gray-300 transition">Cancel</button>
        <button onClick={onSubmit} disabled={loading || !form.cityId || !form.budget}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2">
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating...</>
            : 'Update Plan →'}
        </button>
      </div>
    </div>
  );
}

// ─── 13. Plan Input Form ──────────────────────────────────────────────────────

function PlanForm({
  cities, eventCategories, form, setForm, loading, onSubmit,
}: {
  cities: City[];
  eventCategories: Category[];
  form: { eventType: string; cityId: string; budget: string; guestCount: string };
  setForm: (f: typeof form) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-5 text-white">
        <h2 className="font-extrabold text-xl mb-0.5">Build Your Event Plan</h2>
        <p className="text-red-200 text-sm">Fill in the details — we&apos;ll handle the rest in 10 seconds.</p>
      </div>
      <form onSubmit={onSubmit} className="p-6 space-y-6">
        {/* Event type grid — from API */}
        <div>
          <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-3 block">Event Type</label>
          {eventCategories.length === 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {eventCategories.map(et => (
                <button key={et.slug} type="button" onClick={() => setForm({ ...form, eventType: et.slug })}
                  className={`p-3 rounded-xl border-2 text-center transition ${form.eventType === et.slug ? 'border-red-600 bg-red-50 shadow-sm' : 'border-gray-100 hover:border-red-200 bg-gray-50 hover:bg-red-50'}`}>
                  <div className="text-2xl mb-1">{et.icon || '🎪'}</div>
                  <div className="text-[11px] font-bold text-gray-700 leading-tight">{et.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* City, Budget, Guests */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2 block">City *</label>
            <select required value={form.cityId} onChange={e => setForm({ ...form, cityId: e.target.value })}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-red-400 bg-gray-50 focus:bg-white transition appearance-none">
              <option value="">Select city</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2 block">Total Budget *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
              <input required type="number" placeholder="e.g. 500000" value={form.budget}
                onChange={e => setForm({ ...form, budget: e.target.value })}
                className="w-full border-2 border-gray-100 rounded-xl pl-7 pr-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-red-400 bg-gray-50 focus:bg-white transition" />
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {BUDGET_PRESETS.map(b => (
                <button key={b} type="button" onClick={() => setForm({ ...form, budget: b })}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition ${
                    form.budget === b ? 'bg-red-600 text-white border-red-600' : 'border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600'
                  }`}>
                  {Number(b) >= 100000 ? `₹${Number(b) / 100000}L` : `₹${Number(b) / 1000}K`}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2 block">Guests (optional)</label>
            <input type="number" placeholder="e.g. 200" value={form.guestCount}
              onChange={e => setForm({ ...form, guestCount: e.target.value })}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-red-400 bg-gray-50 focus:bg-white transition" />
          </div>
        </div>

        <button type="submit" disabled={loading || !form.cityId || !form.budget}
          className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold py-4 rounded-xl transition shadow-lg shadow-red-200 text-base flex items-center justify-center gap-2">
          {loading
            ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Building Your Plan...</>
            : <>Get My Plan <span>→</span></>}
        </button>
      </form>
    </div>
  );
}

// ─── 14. Page Root ────────────────────────────────────────────────────────────

function PlanPageInner() {
  const searchParams = useSearchParams();

  // Remote data
  const [cities, setCities]                       = useState<City[]>([]);
  const [eventCategories, setEventCategories]     = useState<Category[]>([]);
  const [serviceCategories, setServiceCategories] = useState<Category[]>([]);
  const [plan, setPlan]       = useState<EventPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  // UI state
  const [step, setStep]             = useState(1);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [bulkVendors, setBulkVendors]       = useState<Vendor[] | null>(null);
  const [shortlist, setShortlist]           = useState<Vendor[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    eventType:  searchParams.get('eventType')  || '',
    cityId:     searchParams.get('cityId')     || '',
    budget:     searchParams.get('budget')     || '',
    guestCount: searchParams.get('guestCount') || '',
  });

  // Build a slug→Category map for icon/name lookups (covers both event & service cats)
  const catMap = useMemo<Map<string, Category>>(() => {
    const map = new Map<string, Category>();
    [...eventCategories, ...serviceCategories].forEach(c => map.set(c.slug, c));
    return map;
  }, [eventCategories, serviceCategories]);

  // Initialise remote data
  useEffect(() => {
    Promise.all([
      locationsApi.getCities() as Promise<unknown>,
      categoriesApi.getAll('event') as Promise<unknown>,
      categoriesApi.getAll('service') as Promise<unknown>,
    ]).then(([cityData, evCats, svcCats]) => {
      setCities(cityData as City[]);
      setEventCategories(evCats as Category[]);
      setServiceCategories(svcCats as Category[]);

      // Default event type to first returned category if none in URL
      setForm(prev => ({
        ...prev,
        eventType: prev.eventType || (evCats as Category[])[0]?.slug || '',
      }));
    }).catch(() => {});
  }, []);

  // Persist shortlist to localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('eh-shortlist');
      if (saved) setShortlist(JSON.parse(saved));
    } catch { /* */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem('eh-shortlist', JSON.stringify(shortlist)); } catch { /* */ }
  }, [shortlist]);

  const generatePlan = useCallback(async (f: typeof form) => {
    if (!f.cityId || !f.budget) return;
    setLoading(true);
    try {
      const data = await searchApi.eventPlan(
        f.eventType, Number(f.budget), Number(f.cityId),
        f.guestCount ? Number(f.guestCount) : undefined,
      ) as unknown as EventPlan;
      setPlan(data);
      setStep(2);
      setEditing(false);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch {
      alert('Failed to generate plan. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-submit when coming from homepage PlanWizard
  useEffect(() => {
    if (searchParams.get('autosubmit') === '1' && form.cityId && form.budget) {
      generatePlan(form);
    }
  }, []); // eslint-disable-line

  const handleFormSubmit = (e: React.FormEvent) => { e.preventDefault(); generatePlan(form); };

  const toggleShortlist = (v: Vendor) =>
    setShortlist(prev => prev.some(s => s.id === v.id) ? prev.filter(s => s.id !== v.id) : [...prev, v]);

  const handleBulkQuote = (vendors: Vendor[]) => {
    if (vendors.length === 1) { setSelectedVendor(vendors[0]); return; }
    setBulkVendors(vendors);
    setSelectedVendor(vendors[0]);
  };

  const handleSavePlan = () => {
    if (!plan) return;
    const city = cities.find(c => String(c.id) === form.cityId);
    if (city) window.open(`/event-plan/${buildPlanSlug(form.eventType, city.slug, Number(form.budget))}`, '_blank');
  };

  const currentCity = cities.find(c => String(c.id) === form.cityId);
  const cityName    = currentCity?.name;
  const planSlug    = currentCity && form.budget
    ? buildPlanSlug(form.eventType, currentCity.slug, Number(form.budget))
    : null;

  return (
    <div className="min-h-screen bg-gray-50/60 pb-24">

      {/* ── Step 1: Input form ── */}
      {step === 1 && (
        <div className="max-w-4xl mx-auto px-4 py-10">
          {loading ? <PlanLoading eventType={form.eventType} eventCategories={eventCategories} /> : (
            <>
              <div className="text-center mb-8">
                <p className="text-xs font-extrabold text-red-500 uppercase tracking-widest mb-2">AI Event Planner</p>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Get Your Event Plan</h1>
                <p className="text-gray-400 text-sm">Vendor recommendations + budget breakdown in 10 seconds.</p>
              </div>
              <PlanForm
                cities={cities}
                eventCategories={eventCategories}
                form={form}
                setForm={setForm}
                loading={loading}
                onSubmit={handleFormSubmit}
              />
            </>
          )}
        </div>
      )}

      {/* ── Step 2: Results ── */}
      {step === 2 && plan && (
        <div ref={resultsRef} className="max-w-5xl mx-auto px-4 py-6 space-y-5">

          {/* Inline overlay on re-generate */}
          {loading && (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <PlanLoading eventType={form.eventType} eventCategories={eventCategories} />
            </div>
          )}

          {/* Edit form (inline) */}
          {editing && (
            <EditPlanForm
              cities={cities}
              eventCategories={eventCategories}
              form={form}
              setForm={setForm}
              loading={loading}
              onSubmit={() => generatePlan(form)}
              onCancel={() => setEditing(false)}
            />
          )}

          {/* A. Hero */}
          <PlanHero
            plan={plan}
            cityName={cityName}
            form={form}
            catMap={catMap}
            onEdit={() => setEditing(e => !e)}
          />

          {/* B. Trust bar */}
          <TrustBar />

          {/* C. Smart summary */}
          <SmartSummary plan={plan} cityName={cityName} catMap={catMap} />

          {/* C2. Budget insight */}
          <BudgetInsightCard budget={Number(form.budget)} eventType={form.eventType} cityName={cityName} />

          {/* D. Recommended Package */}
          <RecommendedPackage
            plan={plan}
            catMap={catMap}
            onGetQuote={setSelectedVendor}
            onGetAll={handleBulkQuote}
            eventType={form.eventType}
          />

          {/* E. Two-column: sidebar + vendor sections */}
          <div className="grid lg:grid-cols-3 gap-5">

            {/* Left sidebar */}
            <div className="lg:col-span-1 space-y-5">
              <BudgetBreakdown plan={plan} catMap={catMap} />
              <ShortlistPanel
                shortlist={shortlist}
                onRemove={id => setShortlist(p => p.filter(v => v.id !== id))}
                onGetQuote={setSelectedVendor}
                onGetAll={handleBulkQuote}
              />
              {planSlug && <SharePlanBanner slug={planSlug} />}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-xs font-extrabold text-amber-700 mb-1">💡 Pro tip</p>
                <p className="text-xs text-amber-600 leading-relaxed">
                  Contact 2–3 vendors per category and mention PlanToday for priority response and better pricing.
                </p>
              </div>
            </div>

            {/* Right: category sections */}
            <div className="lg:col-span-2 space-y-5">
              {plan.plan
                .filter(item => item.category !== 'misc')
                .map(item => (
                  <CategorySection
                    key={item.category}
                    item={item}
                    catMap={catMap}
                    shortlist={shortlist}
                    onToggle={toggleShortlist}
                    onGetQuote={setSelectedVendor}
                    citySlug={currentCity?.slug}
                  />
                ))}

              <button
                onClick={() => { setStep(1); setPlan(null); setEditing(false); }}
                className="w-full border-2 border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 py-3.5 rounded-2xl text-sm font-semibold transition"
              >
                ← Start over with new inputs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky bar */}
      <StickyActionBar
        shortlistCount={shortlist.length}
        plan={plan}
        shortlist={shortlist}
        onGetAll={handleBulkQuote}
        onSavePlan={handleSavePlan}
      />

      {/* Lead modal */}
      {selectedVendor && (
        <LeadModal
          vendor={selectedVendor}
          onClose={() => { setSelectedVendor(null); setBulkVendors(null); }}
          budget={Number(form.budget)}
        />
      )}
    </div>
  );
}

// ─── Page export ───────────────────────────────────────────────────────────────

export default function PlanPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-gray-400">
        <div className="w-10 h-10 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
        <span className="text-sm">Loading planner...</span>
      </div>
    }>
      <PlanPageInner />
    </Suspense>
  );
}
