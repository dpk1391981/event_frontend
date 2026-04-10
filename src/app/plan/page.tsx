'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { searchApi, locationsApi } from '@/lib/api';
import { City, EventPlanV2, EventPackage, PackageService, Vendor } from '@/types';
import LeadModal from '@/components/lead/LeadModal';

// ─── Constants ────────────────────────────────────────────────────────────────

const LOADING_STEPS = [
  'Analysing your budget allocation...',
  'Scoring vendors by fit & rating...',
  'Building your personalised packages...',
  'Calculating savings & value...',
  'Finalising your event plan...',
];

// Static Tailwind classes — must be literal strings so Tailwind includes them in bundle
const TAG_META = {
  Recommended: {
    icon: '🎯', label: 'Best Fit',
    badge:  'bg-green-100 text-green-800',
    border: 'border-green-200',
    ring:   'ring-2 ring-green-500',
    light:  'bg-green-50',
    accent: 'bg-green-600',
    btnCls: 'bg-green-600 hover:bg-green-700',
  },
  Budget: {
    icon: '💰', label: 'Budget Saver',
    badge:  'bg-blue-100 text-blue-800',
    border: 'border-blue-200',
    ring:   'ring-2 ring-blue-400',
    light:  'bg-blue-50',
    accent: 'bg-blue-600',
    btnCls: 'bg-blue-600 hover:bg-blue-700',
  },
  Premium: {
    icon: '💎', label: 'Premium',
    badge:  'bg-purple-100 text-purple-800',
    border: 'border-purple-200',
    ring:   'ring-2 ring-purple-500',
    light:  'bg-purple-50',
    accent: 'bg-purple-600',
    btnCls: 'bg-purple-600 hover:bg-purple-700',
  },
} as const;

const EVENT_THEMES: Record<string, { from: string; via: string; to: string; accent: string; icon: string }> = {
  wedding:     { from: 'from-rose-950',   via: 'via-pink-950',    to: 'to-red-900',     accent: 'text-rose-300',   icon: '💍' },
  birthday:    { from: 'from-purple-950', via: 'via-violet-950',  to: 'to-indigo-900',  accent: 'text-purple-300', icon: '🎂' },
  corporate:   { from: 'from-blue-950',   via: 'via-slate-950',   to: 'to-indigo-900',  accent: 'text-blue-300',   icon: '💼' },
  anniversary: { from: 'from-amber-950',  via: 'via-orange-950',  to: 'to-red-900',     accent: 'text-amber-300',  icon: '💑' },
  engagement:  { from: 'from-pink-950',   via: 'via-rose-950',    to: 'to-fuchsia-900', accent: 'text-pink-300',   icon: '💎' },
  reception:   { from: 'from-teal-950',   via: 'via-emerald-950', to: 'to-cyan-900',    accent: 'text-teal-300',   icon: '🥂' },
  default:     { from: 'from-gray-950',   via: 'via-red-950',     to: 'to-gray-900',    accent: 'text-red-300',    icon: '🎉' },
};

const CAT_ICONS: Record<string, string> = {
  catering: '🍽️', venue: '🏛️', photography: '📸', decoration: '🌸',
  music: '🎵', makeup: '💄', mehendi: '🪷', misc: '✨',
  videography: '🎬', lighting: '💡', tent_house: '🏕️',
};

const EVENT_TYPES = [
  { value: 'wedding', icon: '💍', label: 'Wedding' },
  { value: 'birthday', icon: '🎂', label: 'Birthday' },
  { value: 'corporate', icon: '💼', label: 'Corporate' },
  { value: 'anniversary', icon: '💑', label: 'Anniversary' },
  { value: 'reception', icon: '🥂', label: 'Reception' },
  { value: 'engagement', icon: '💎', label: 'Engagement' },
];

const BUDGET_PRESETS = [
  { label: '₹50K', value: '50000' },
  { label: '₹2L',  value: '200000' },
  { label: '₹5L',  value: '500000' },
  { label: '₹10L', value: '1000000' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n >= 100000
    ? `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`
    : `₹${Math.round(n / 1000)}K`;

const fmtFull = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const catIcon = (s: string) => CAT_ICONS[s] || '✨';
const catLabel = (s: string) => s.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// ─── Bottom Sheet (mobile-native slide-up) ────────────────────────────────────

function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  // Lock body scroll when sheet is open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '92vh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        {/* Title bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="font-extrabold text-gray-900 text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-base active:bg-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>
        {/* Scrollable content */}
        <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: 'calc(92vh - 80px)' }}>
          {children}
        </div>
      </div>
    </>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────

function PlanLoading({ eventType }: { eventType: string }) {
  const [idx, setIdx] = useState(0);
  const theme = EVENT_THEMES[eventType] ?? EVENT_THEMES.default;

  useEffect(() => {
    const t = setInterval(() => setIdx(i => Math.min(i + 1, LOADING_STEPS.length - 1)), 750);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-4">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-red-100" />
        <div className="absolute inset-0 rounded-full border-4 border-t-red-600 border-r-red-400 border-b-transparent border-l-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-3xl">{theme.icon}</div>
      </div>
      <div className="text-center max-w-xs">
        <p className="text-gray-900 font-extrabold text-lg mb-1">{LOADING_STEPS[idx]}</p>
        <p className="text-gray-400 text-sm">AI planning your {eventType} in seconds</p>
      </div>
      <div className="flex gap-1.5">
        {LOADING_STEPS.map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i <= idx ? 'bg-red-500 w-7' : 'bg-gray-200 w-1.5'}`} />
        ))}
      </div>
      {/* Skeleton */}
      <div className="w-full max-w-md space-y-3 opacity-40">
        <div className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-28 bg-gray-200 rounded-xl animate-pulse" style={{ animationDelay: '0.1s' }} />
          <div className="h-28 bg-gray-200 rounded-xl animate-pulse" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Confidence Badge ──────────────────────────────────────────────────────────

function ConfidenceBadge({ score }: { score: number }) {
  const cls = score >= 80
    ? 'text-green-700 bg-green-100 border-green-200'
    : score >= 60
    ? 'text-yellow-700 bg-yellow-100 border-yellow-200'
    : 'text-orange-700 bg-orange-100 border-orange-200';
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {score}% match
    </span>
  );
}

// ─── Service Row (full / compact) ────────────────────────────────────────────

function ServiceRow({ svc, compact = false }: { svc: PackageService; compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
        <span className="text-xl shrink-0 w-8 text-center">{catIcon(svc.category)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{svc.vendorName}</p>
          <p className="text-xs text-gray-400">{catLabel(svc.category)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-gray-900">{fmt(svc.price)}</p>
          <p className="text-[10px] text-yellow-600 font-semibold">{svc.rating.toFixed(1)}★</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center text-xl shrink-0">
        {catIcon(svc.category)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{svc.vendorName}</p>
        <p className="text-[11px] text-gray-400 capitalize mb-0.5">{catLabel(svc.category)}</p>
        <p className="text-[11px] text-gray-500 line-clamp-1">{svc.reason}</p>
      </div>
      <div className="text-right shrink-0 min-w-[52px]">
        <p className="text-sm font-extrabold text-gray-900">{fmt(svc.price)}</p>
        <p className="text-[10px] text-yellow-600 font-semibold">{svc.rating.toFixed(1)}★</p>
        {/* Fit score bar */}
        <div className="w-10 h-0.5 bg-gray-100 rounded-full mt-1 ml-auto">
          <div className="h-full bg-green-500 rounded-full" style={{ width: `${svc.fitScore}%` }} />
        </div>
      </div>
    </div>
  );
}

// ─── Primary Package Card ──────────────────────────────────────────────────────

function PrimaryPackageCard({
  pkg,
  guestCount,
  onBook,
  onCustomize,
  onCompare,
}: {
  pkg: EventPackage;
  guestCount?: number;
  onBook: () => void;
  onCustomize: () => void;
  onCompare: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = TAG_META[pkg.tag];
  const shown = expanded ? pkg.services : pkg.services.slice(0, 4);

  return (
    <div className={`bg-white rounded-2xl border-2 ${meta.border} ${meta.ring} shadow-md overflow-hidden`}>

      {/* ── Package header ── */}
      <div className={`${meta.light} px-4 pt-4 pb-3 border-b ${meta.border}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <span className="text-xl">{meta.icon}</span>
              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.badge}`}>
                {meta.label}
              </span>
              <ConfidenceBadge score={pkg.confidenceScore} />
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 leading-tight">{pkg.name}</h2>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-gray-900 leading-none">{fmt(pkg.estimatedCost)}</p>
            {guestCount && guestCount > 0 && (
              <p className="text-[11px] text-gray-500 mt-0.5">{fmt(pkg.pricePerGuest)}/guest</p>
            )}
            {pkg.savings > 0 && (
              <p className="text-xs font-extrabold text-green-600 mt-0.5">Save {fmt(pkg.savings)}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Services list ── */}
      <div className="px-4 pt-1 pb-2">
        {shown.map(svc => (
          <ServiceRow key={`${svc.vendorId}-${svc.category}`} svc={svc} />
        ))}
        {pkg.services.length > 4 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full py-2.5 text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-1"
          >
            {expanded ? '↑ Show less' : `↓ ${pkg.services.length - 4} more services`}
          </button>
        )}
      </div>

      {/* ── Summary row ── */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-500">{pkg.services.length} services · Platform fee {fmt(pkg.platformMargin)}</span>
        <span className="text-sm font-extrabold text-gray-900">{fmtFull(pkg.estimatedCost)}</span>
      </div>

      {/* ── CTAs — hidden on mobile (sticky bar handles it), shown on desktop ── */}
      <div className="hidden sm:flex px-4 py-3 gap-2">
        <button
          onClick={onBook}
          className={`flex-1 py-3.5 rounded-xl font-extrabold text-white text-sm shadow-md transition-all active:scale-[0.98] ${meta.btnCls}`}
        >
          Book This Plan
        </button>
        <button
          onClick={onCustomize}
          className="flex-1 py-3.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 text-sm transition-all active:scale-[0.98]"
        >
          Customize Plan
        </button>
        <button
          onClick={onCompare}
          className="px-4 py-3.5 rounded-xl font-bold text-gray-500 text-sm transition-all border border-gray-200 hover:border-gray-300 hover:text-gray-700"
        >
          Compare
        </button>
      </div>
    </div>
  );
}

// ─── Alternative Package Card ─────────────────────────────────────────────────

function AltCard({
  pkg,
  guestCount,
  isActive,
  onSelect,
}: {
  pkg: EventPackage;
  guestCount?: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  const meta = TAG_META[pkg.tag];

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm active:scale-[0.98] transition-all cursor-pointer ${isActive ? `${meta.border} ${meta.ring}` : 'border-gray-200'}`}
    >
      <div className={`${isActive ? meta.light : 'bg-gray-50'} px-4 py-3 border-b border-gray-100`}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-base">{meta.icon}</span>
            <span className={`text-[10px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${meta.badge}`}>
              {meta.label}
            </span>
          </div>
          <ConfidenceBadge score={pkg.confidenceScore} />
        </div>
        <div className="flex items-end justify-between">
          <p className="text-xl font-black text-gray-900">{fmt(pkg.estimatedCost)}</p>
          {pkg.savings > 0 && (
            <p className="text-xs font-bold text-green-600">Save {fmt(pkg.savings)}</p>
          )}
        </div>
        {guestCount && guestCount > 0 && (
          <p className="text-[11px] text-gray-400 mt-0.5">{fmt(pkg.pricePerGuest)}/guest</p>
        )}
      </div>
      <div className="px-4 py-2">
        {pkg.services.slice(0, 3).map(svc => (
          <ServiceRow key={`${svc.vendorId}-${svc.category}`} svc={svc} compact />
        ))}
        {pkg.services.length > 3 && (
          <p className="text-[11px] text-gray-400 pt-1">+{pkg.services.length - 3} more services</p>
        )}
      </div>
      <div className="px-4 pb-3">
        <button className={`w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all ${meta.btnCls}`}>
          {isActive ? 'Selected ✓' : 'Select This Plan'}
        </button>
      </div>
    </div>
  );
}

// ─── Budget Breakdown ──────────────────────────────────────────────────────────

function BudgetBreakdown({ breakdown, totalBudget }: { breakdown: Record<string, number> | undefined; totalBudget: number }) {
  const safe = breakdown && typeof breakdown === 'object' && !Array.isArray(breakdown) ? breakdown : {};
  const entries = Object.entries(safe).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;
  // Static colour list — Tailwind must see these literally
  const colors = [
    { bar: 'bg-red-500',    dot: 'bg-red-500'    },
    { bar: 'bg-blue-500',   dot: 'bg-blue-500'   },
    { bar: 'bg-purple-500', dot: 'bg-purple-500' },
    { bar: 'bg-orange-500', dot: 'bg-orange-500' },
    { bar: 'bg-teal-500',   dot: 'bg-teal-500'   },
    { bar: 'bg-yellow-500', dot: 'bg-yellow-500' },
    { bar: 'bg-pink-500',   dot: 'bg-pink-500'   },
    { bar: 'bg-indigo-500', dot: 'bg-indigo-500' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <h3 className="font-extrabold text-gray-900 text-sm mb-3">Budget Breakdown</h3>
      {/* Stacked bar */}
      <div className="flex h-2.5 rounded-full overflow-hidden gap-px mb-3">
        {entries.map(([slug, amt], i) => (
          <div
            key={slug}
            className={colors[i % colors.length].bar}
            style={{ width: `${(amt / totalBudget) * 100}%` }}
            title={`${catLabel(slug)}: ${fmtFull(amt)}`}
          />
        ))}
      </div>
      <div className="space-y-2">
        {entries.map(([slug, amt], i) => (
          <div key={slug} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${colors[i % colors.length].dot} shrink-0`} />
              <span className="text-sm text-gray-600">{catIcon(slug)} {catLabel(slug)}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-900">{fmt(amt)}</span>
              <span className="text-xs text-gray-400 ml-1">{Math.round((amt / totalBudget) * 100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Compare Table (shown inside bottom sheet on mobile) ──────────────────────

function CompareTable({ data }: { data: EventPlanV2['comparePackages'] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[340px]">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-3 font-semibold text-gray-400 text-xs w-28">Details</th>
            {data.comparison.map(c => (
              <th key={c.packageName} className="text-center px-3 py-3 font-bold text-gray-900">
                <span className="block text-[10px] font-normal text-gray-400 mb-0.5">
                  {TAG_META[c.tag as keyof typeof TAG_META]?.icon || '📦'} {c.tag}
                </span>
                {fmt(c.totalCost)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-50">
            <td className="px-4 py-3 text-gray-400 text-xs">Per Guest</td>
            {data.comparison.map(c => (
              <td key={c.packageName} className="text-center px-3 py-3 font-semibold text-gray-700 text-sm">
                {c.pricePerGuest > 0 ? fmt(c.pricePerGuest) : '—'}
              </td>
            ))}
          </tr>
          <tr className="border-b border-gray-50">
            <td className="px-4 py-3 text-gray-400 text-xs">Avg Rating</td>
            {data.comparison.map(c => (
              <td key={c.packageName} className="text-center px-3 py-3">
                <span className="font-bold text-yellow-600 text-sm">{c.ratingScore.toFixed(1)}★</span>
              </td>
            ))}
          </tr>
          <tr>
            <td className="px-4 py-3 text-gray-400 text-xs align-top">Why</td>
            {data.comparison.map(c => (
              <td key={c.packageName} className="text-center px-3 py-3">
                <ul className="space-y-1.5">
                  {c.keyDifferences.map(d => (
                    <li key={d} className="text-[11px] text-gray-600 flex items-start gap-1 justify-center">
                      <span className="text-green-500 shrink-0">✓</span>
                      <span className="text-left">{d}</span>
                    </li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Customize Form ───────────────────────────────────────────────────────────

function CustomizeForm({
  cities,
  defaults,
  onSubmit,
}: {
  cities: City[];
  defaults: { eventType: string; budget: string; cityId: string; guestCount: string };
  onSubmit: (v: typeof defaults) => void;
}) {
  const [form, setForm] = useState(defaults);
  const set = (k: keyof typeof defaults, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="px-4 py-4 space-y-5 pb-8">
      {/* Event type */}
      <div>
        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Event Type</p>
        <div className="flex gap-2 flex-wrap">
          {EVENT_TYPES.map(et => (
            <button
              key={et.value}
              type="button"
              onClick={() => set('eventType', et.value)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full text-sm font-semibold border transition-all min-h-[44px] ${
                form.eventType === et.value
                  ? 'bg-red-600 border-red-500 text-white shadow-md'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              {et.icon} {et.label}
            </button>
          ))}
        </div>
      </div>

      {/* City */}
      <div>
        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">City</p>
        <select
          value={form.cityId}
          onChange={e => set('cityId', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-red-400/40 min-h-[48px] bg-white"
        >
          {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Budget */}
      <div>
        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">
          Budget {form.budget && <span className="normal-case text-red-500">{fmt(Number(form.budget))}</span>}
        </p>
        <input
          type="number"
          inputMode="numeric"
          value={form.budget}
          onChange={e => set('budget', e.target.value)}
          placeholder="e.g. 200000"
          className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-red-400/40 min-h-[48px]"
        />
        <div className="flex gap-2 mt-2 flex-wrap">
          {BUDGET_PRESETS.map(b => (
            <button
              key={b.value}
              type="button"
              onClick={() => set('budget', b.value)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                form.budget === b.value
                  ? 'bg-red-500 border-red-400 text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Guests */}
      <div>
        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">
          Guests <span className="normal-case font-normal text-gray-400">(optional)</span>
        </p>
        <input
          type="number"
          inputMode="numeric"
          value={form.guestCount}
          onChange={e => set('guestCount', e.target.value)}
          placeholder="e.g. 200"
          className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-red-400/40 min-h-[48px]"
        />
      </div>

      {/* Submit */}
      <button
        onClick={() => onSubmit(form)}
        className="w-full py-4 rounded-xl font-extrabold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg shadow-red-600/20 transition-all text-base active:scale-[0.98] min-h-[56px]"
      >
        Regenerate Plan →
      </button>
    </div>
  );
}

// ─── Trending Package Card ────────────────────────────────────────────────────

function TrendingCard({ pkg }: { pkg: EventPlanV2['trendingPackages'][number] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-2 min-w-[240px] sm:min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 uppercase tracking-wide">
          🔥 Trending
        </span>
        <span className="text-[10px] text-gray-400 font-semibold">{pkg.popularityScore}% popular</span>
      </div>
      <h4 className="font-extrabold text-gray-900 text-sm leading-snug">{pkg.name}</h4>
      <div className="flex flex-wrap gap-1">
        {pkg.servicesSummary.map(s => (
          <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
        ))}
      </div>
      <div className="flex items-end justify-between mt-auto pt-1">
        <p className="text-base font-black text-gray-900">{fmt(pkg.estimatedCost)}</p>
        {pkg.pricePerGuest > 0 && (
          <p className="text-[10px] text-gray-400">{fmt(pkg.pricePerGuest)}/guest</p>
        )}
      </div>
    </div>
  );
}

// ─── Top Package Card (Homepage-style, from topPackages) ─────────────────────

function TopPackCard({ pkg }: { pkg: EventPlanV2['topPackages'][number] }) {
  const meta = TAG_META[pkg.tag];
  return (
    <div className={`bg-white rounded-xl border-2 ${meta.border} p-4 flex flex-col gap-2 min-w-[200px] sm:min-w-0`}>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${meta.badge} uppercase tracking-wide`}>
          {meta.icon} {meta.label}
        </span>
      </div>
      <p className="font-extrabold text-gray-900 text-sm leading-snug">{pkg.name}</p>
      <p className="text-[10px] text-gray-400">{pkg.highlight}</p>
      <div className="flex items-end justify-between mt-auto">
        <p className="text-base font-black text-gray-900">{fmt(pkg.estimatedCost)}</p>
        {pkg.pricePerGuest > 0 && (
          <p className="text-[10px] text-gray-400">{fmt(pkg.pricePerGuest)}/guest</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Plan Content ────────────────────────────────────────────────────────

function PlanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [plan, setPlan] = useState<EventPlanV2 | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [activePkg, setActivePkg] = useState<EventPackage | null>(null);
  const [sheetCompare, setSheetCompare] = useState(false);
  const [sheetCustomize, setSheetCustomize] = useState(false);
  const [leadVendor, setLeadVendor] = useState<Vendor | null>(null);

  const params = {
    eventType: searchParams.get('eventType') || 'wedding',
    budget:    searchParams.get('budget')    || '200000',
    cityId:    searchParams.get('cityId')    || '1',
    guestCount:searchParams.get('guestCount')|| '',
  };

  const fetchPlan = useCallback(async (p: typeof params) => {
    if (!p.cityId || !p.budget) return;
    setLoading(true);
    setError('');
    setPlan(null);
    setActivePkg(null);
    setSheetCompare(false);
    setSheetCustomize(false);
    try {
      const raw = await searchApi.eventPlan(
        p.eventType, Number(p.budget), Number(p.cityId),
        p.guestCount ? Number(p.guestCount) : undefined,
      ) as unknown as EventPlanV2;
      // Guard: reject old-format responses (pre-upgrade backend)
      if (!raw || !raw.recommended) {
        setError('Plan engine returned an unexpected format. Please restart the backend and try again.');
        return;
      }
      // Normalise: ensure every array field exists so renders never crash
      const data: EventPlanV2 = {
        ...raw,
        alternatives:    Array.isArray(raw.alternatives)    ? raw.alternatives    : [],
        breakdown:       raw.breakdown                      ?? {},
        topPackages:     Array.isArray(raw.topPackages)     ? raw.topPackages     : [],
        trendingPackages:Array.isArray(raw.trendingPackages)? raw.trendingPackages: [],
        comparePackages: raw.comparePackages ?? { categories: [], comparison: [] },
        meta:            raw.meta ?? { confidenceScore: 0, generatedAt: new Date().toISOString(), cityId: Number(p.cityId), eventType: p.eventType, totalBudget: Number(p.budget) },
      };
      setPlan(data);
      setActivePkg(data.recommended);
    } catch {
      setError('Could not generate your plan. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    locationsApi.getCities().then((d: unknown) => setCities(d as City[])).catch(() => {});
  }, []);

  useEffect(() => {
    if (searchParams.get('autosubmit') === '1') fetchPlan(params);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const handleCustomizeSubmit = (vals: typeof params) => {
    setSheetCustomize(false);
    const sp = new URLSearchParams({
      eventType: vals.eventType, budget: vals.budget, cityId: vals.cityId, autosubmit: '1',
      ...(vals.guestCount && { guestCount: vals.guestCount }),
    });
    router.push(`/plan?${sp.toString()}`);
  };

  const handleBook = () => {
    if (!activePkg?.services[0]) return;
    const svc = activePkg.services[0];
    setLeadVendor({
      id: svc.vendorId, businessName: svc.vendorName, slug: svc.vendorSlug,
      logo: svc.logo, rating: svc.rating, reviewCount: 0, profileViews: 0,
      profileScore: 0, isFeatured: false, isVerified: false, cityId: Number(params.cityId),
      status: 'active', minPrice: svc.price,
    });
  };

  const theme = EVENT_THEMES[params.eventType] ?? EVENT_THEMES.default;
  const cityName = cities.find(c => String(c.id) === params.cityId)?.name || '';
  const guestCount = params.guestCount ? Number(params.guestCount) : undefined;
  const alternatives = plan?.alternatives ?? [];
  const allPackages = plan?.recommended
    ? [plan.recommended, ...alternatives].filter(Boolean) as EventPackage[]
    : [];

  // ── Entry / no-param state ───────────────────────────────────────────────────
  if (!loading && !plan && searchParams.get('autosubmit') !== '1') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-10 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-gray-900">Plan Your Event</h1>
            <p className="text-gray-400 text-sm mt-1">Get 3 ready-to-book packages instantly</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <CustomizeForm cities={cities} defaults={params} onSubmit={handleCustomizeSubmit} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className={`bg-gradient-to-br ${theme.from} ${theme.via} ${theme.to} text-white`}>
        <div className="max-w-xl mx-auto px-4 pt-8 pb-5">
          {/* Event info row */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-2xl">{theme.icon}</span>
                <span className={`text-xs font-bold ${theme.accent}`}>
                  {params.eventType.replace(/\b\w/g, c => c.toUpperCase())} Plan
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-white leading-snug">
                Your Event is Ready
              </h1>
              <p className="text-white/50 text-xs mt-0.5">
                {fmt(Number(params.budget))} · {cityName}
                {guestCount ? ` · ${guestCount} guests` : ''}
              </p>
            </div>
            {plan?.meta && (
              <div className="text-right shrink-0">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">AI Match</p>
                <p className="text-2xl font-black text-white leading-none">{plan.meta.confidenceScore ?? 0}%</p>
              </div>
            )}
          </div>

          {/* Package tabs — horizontal scroll on mobile */}
          {plan && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1 snap-x">
              {allPackages.map(pkg => {
                const m = TAG_META[pkg.tag];
                const isActive = activePkg?.tag === pkg.tag;
                return (
                  <button
                    key={pkg.tag}
                    onClick={() => setActivePkg(pkg)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-all shrink-0 snap-start min-h-[36px] active:scale-[0.97] ${
                      isActive
                        ? 'bg-white text-gray-900 border-white shadow-md'
                        : 'bg-white/10 text-white/80 border-white/20'
                    }`}
                  >
                    {m.icon} {m.label}
                    <span className={`text-[10px] ${isActive ? 'text-gray-500' : 'text-white/50'}`}>
                      {fmt(pkg.estimatedCost)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Scrollable body ──────────────────────────────────────────────────── */}
      <div className="max-w-xl mx-auto px-4 py-4 space-y-4 pb-28 sm:pb-8">

        {/* Loading */}
        {loading && <PlanLoading eventType={params.eventType} />}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-700 font-semibold mb-4">{error}</p>
            <button
              onClick={() => fetchPlan(params)}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {plan && activePkg && !loading && (
          <>
            {/* ── 1. Primary package (selected) ── */}
            <PrimaryPackageCard
              pkg={activePkg}
              guestCount={guestCount}
              onBook={handleBook}
              onCustomize={() => setSheetCustomize(true)}
              onCompare={() => setSheetCompare(true)}
            />

            {/* ── 2. More Options — alt packages ── */}
            {alternatives.length > 0 && (
              <div>
                <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-2">More Options</p>
                <div className="grid grid-cols-2 gap-3">
                  {alternatives.map(alt => (
                    <AltCard
                      key={alt.tag}
                      pkg={alt}
                      guestCount={guestCount}
                      isActive={activePkg.tag === alt.tag}
                      onSelect={() => { setActivePkg(alt); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── 3. Budget Breakdown ── */}
            <BudgetBreakdown breakdown={plan.breakdown ?? {}} totalBudget={plan.meta?.totalBudget ?? Number(params.budget)} />

            {/* ── 4. Top Packages (spec Step 6) ── */}
            {(plan.topPackages?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-2">Quick Picks</p>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x -mx-1 px-1 pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible sm:mx-0 sm:px-0">
                  {plan.topPackages.map((tp, i) => (
                    <div key={i} className="snap-start shrink-0 w-52 sm:w-auto">
                      <TopPackCard pkg={tp} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 5. Trending Packages (spec Step 5) ── */}
            {(plan.trendingPackages?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-2">Trending Now</p>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x -mx-1 px-1 pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible sm:mx-0 sm:px-0">
                  {plan.trendingPackages.map((tp, i) => (
                    <div key={i} className="snap-start shrink-0 sm:w-auto">
                      <TrendingCard pkg={tp} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 6. Trust strip ── */}
            <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  '✓ 2,000+ verified vendors',
                  '✓ 4.8★ avg rating',
                  '✓ 50K+ happy families',
                  '✓ Free quotes, always',
                ].map(t => (
                  <div key={t} className="flex items-center gap-1.5">
                    <span className="text-green-600 font-black text-xs shrink-0">{t.slice(0, 1)}</span>
                    <span className="text-xs text-gray-500">{t.slice(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Meta */}
            {plan.meta?.generatedAt && (
              <p className="text-center text-[10px] text-gray-300">
                Plan generated {new Date(plan.meta.generatedAt).toLocaleTimeString()} · Powered by Plantoday AI
              </p>
            )}
          </>
        )}
      </div>

      {/* ── Sticky bottom CTA bar — mobile only ────────────────────────────── */}
      {plan && activePkg && !loading && (
        <div className="fixed bottom-0 inset-x-0 z-30 sm:hidden bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3 safe-bottom">
          <div className="flex gap-2">
            <button
              onClick={handleBook}
              className={`flex-1 py-4 rounded-xl font-extrabold text-white text-sm shadow-lg transition-all active:scale-[0.98] ${TAG_META[activePkg.tag].btnCls}`}
            >
              Book This Plan
            </button>
            <button
              onClick={() => setSheetCustomize(true)}
              className="px-4 py-4 rounded-xl font-bold text-gray-600 bg-gray-100 text-sm transition-all active:scale-[0.97]"
              aria-label="Customize"
            >
              ✏️
            </button>
            <button
              onClick={() => setSheetCompare(true)}
              className="px-4 py-4 rounded-xl font-bold text-gray-600 bg-gray-100 text-sm transition-all active:scale-[0.97]"
              aria-label="Compare"
            >
              ⚖️
            </button>
          </div>
        </div>
      )}

      {/* ── Bottom sheet: Compare Packages ──────────────────────────────────── */}
      <BottomSheet open={sheetCompare} onClose={() => setSheetCompare(false)} title="Compare Packages">
        {plan?.comparePackages && <CompareTable data={plan.comparePackages} />}
        {(plan?.comparePackages?.comparison?.length ?? 0) > 0 && plan && (
          <div className="px-4 py-4 flex flex-col gap-2 border-t border-gray-100">
            {plan.comparePackages.comparison.map(c => {
              const m = TAG_META[c.tag as keyof typeof TAG_META];
              const pkg = allPackages.find(p => p.tag === c.tag);
              return (
                <button
                  key={c.tag}
                  onClick={() => { setActivePkg(pkg || plan!.recommended); setSheetCompare(false); }}
                  className={`w-full py-3 rounded-xl font-bold text-white text-sm ${m?.btnCls || 'bg-gray-600'} transition-all active:scale-[0.98]`}
                >
                  {m?.icon} Select {c.tag} — {fmt(c.totalCost)}
                </button>
              );
            })}
          </div>
        )}
      </BottomSheet>

      {/* ── Bottom sheet: Customize Plan ────────────────────────────────────── */}
      <BottomSheet open={sheetCustomize} onClose={() => setSheetCustomize(false)} title="Customize Plan">
        <CustomizeForm cities={cities} defaults={params} onSubmit={handleCustomizeSubmit} />
      </BottomSheet>

      {/* ── Lead modal ─────────────────────────────────────────────────────── */}
      {leadVendor && (
        <LeadModal
          vendor={leadVendor}
          budget={Number(params.budget)}
          guestCount={guestCount}
          onClose={() => setLeadVendor(null)}
        />
      )}
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function PlanPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full" />
      </div>
    }>
      <PlanContent />
    </Suspense>
  );
}
