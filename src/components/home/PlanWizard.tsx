'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { locationsApi } from '@/lib/api';
import { City } from '@/types';

const EVENT_TYPES = [
  { value: 'wedding',     icon: '💍', label: 'Wedding' },
  { value: 'birthday',    icon: '🎂', label: 'Birthday' },
  { value: 'corporate',   icon: '💼', label: 'Corporate' },
  { value: 'anniversary', icon: '💑', label: 'Anniversary' },
  { value: 'reception',   icon: '🥂', label: 'Reception' },
  { value: 'engagement',  icon: '💎', label: 'Engagement' },
];

const BUDGET_PRESETS = [
  { label: '₹50K',  value: '50000' },
  { label: '₹2L',   value: '200000' },
  { label: '₹5L',   value: '500000' },
  { label: '₹10L+', value: '1000000' },
];

function fmt(v: string) {
  const n = Number(v);
  if (!n) return '';
  return n >= 100000 ? `₹${(n / 100000).toFixed(1).replace(/\.0$/, '')}L` : `₹${(n / 1000).toFixed(0)}K`;
}

export default function PlanWizard() {
  const router = useRouter();
  const { selectedCity } = useAppStore();
  const [cities, setCities] = useState<City[]>([]);
  const [form, setForm] = useState({
    eventType: 'wedding',
    cityId:    '',
    budget:    '',
    guestCount:'',
  });

  useEffect(() => {
    locationsApi.getCities().then((d: unknown) => setCities(d as City[])).catch(() => {});
  }, []);

  // Pre-fill city from global store
  useEffect(() => {
    if (selectedCity && !form.cityId) {
      setForm((f) => ({ ...f, cityId: String(selectedCity.id) }));
    }
  }, [selectedCity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cityId || !form.budget) return;
    const p = new URLSearchParams({
      eventType:   form.eventType,
      budget:      form.budget,
      cityId:      form.cityId,
      autosubmit:  '1',
      ...(form.guestCount && { guestCount: form.guestCount }),
    });
    router.push(`/plan?${p.toString()}`);
  };

  const ready = form.cityId && form.budget;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl text-left"
    >
      {/* ── Event type — horizontal scroll on mobile ─────────────── */}
      <div className="mb-4 sm:mb-5">
        <p className="text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-widest mb-2.5">Event Type</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
          {EVENT_TYPES.map((et) => (
            <button
              key={et.value}
              type="button"
              onClick={() => setForm({ ...form, eventType: et.value })}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold border transition-all shrink-0 snap-start active:scale-95 ${
                form.eventType === et.value
                  ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30'
                  : 'bg-white/10 border-white/20 text-white/80'
              }`}
            >
              <span className="text-base leading-none">{et.icon}</span>
              <span>{et.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── City + Budget — stacked on mobile, side-by-side on sm+ ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 sm:mb-5">

        {/* City */}
        <div>
          <label className="text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5 block">City *</label>
          <select
            required
            value={form.cityId}
            onChange={(e) => setForm({ ...form, cityId: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-red-400/50 appearance-none min-h-[44px]"
          >
            <option value="" className="text-gray-900 bg-white">Select city</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id} className="text-gray-900 bg-white">{c.name}</option>
            ))}
          </select>
        </div>

        {/* Budget */}
        <div>
          <label className="text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5 block">
            Budget *{form.budget && <span className="ml-1 text-red-300 normal-case font-bold">{fmt(form.budget)}</span>}
          </label>
          <input
            required
            type="number" inputMode="numeric"
            placeholder="e.g. 200000"
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-3 text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-red-400/50 min-h-[44px]"
          />
          {/* Budget presets */}
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {BUDGET_PRESETS.map((b) => (
              <button
                key={b.value}
                type="button"
                onClick={() => setForm({ ...form, budget: b.value })}
                className={`text-[10px] font-bold px-2 py-1 rounded-full border transition active:scale-90 ${
                  form.budget === b.value
                    ? 'bg-red-500 border-red-400 text-white'
                    : 'bg-white/10 border-white/20 text-white/70'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Guests — full width on mobile, normal on sm+ */}
        <div className="col-span-2 sm:col-span-1">
          <label className="text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5 block">Guests <span className="normal-case font-normal text-white/30">(optional)</span></label>
          <input
            type="number" inputMode="numeric"
            placeholder="e.g. 200"
            value={form.guestCount}
            onChange={(e) => setForm({ ...form, guestCount: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-3 text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-red-400/50 min-h-[44px]"
          />
        </div>
      </div>

      {/* CTA button */}
      <button
        type="submit"
        disabled={!ready}
        className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold py-4 rounded-xl transition-all shadow-lg shadow-red-600/30 text-base tracking-wide active:scale-[0.98] min-h-[52px]"
      >
        {ready ? 'Get My Vendor Plan →' : 'Select city & budget to continue'}
      </button>
    </form>
  );
}
