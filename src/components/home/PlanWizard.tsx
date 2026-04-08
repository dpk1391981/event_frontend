'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { locationsApi } from '@/lib/api';
import { City } from '@/types';

const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding', icon: '💍' },
  { value: 'birthday', label: 'Birthday', icon: '🎂' },
  { value: 'corporate', label: 'Corporate', icon: '💼' },
  { value: 'anniversary', label: 'Anniversary', icon: '💑' },
  { value: 'reception', label: 'Reception', icon: '🥂' },
  { value: 'engagement', label: 'Engagement', icon: '💎' },
];

const BUDGET_PRESETS = [
  { label: '₹50K', value: '50000' },
  { label: '₹2L', value: '200000' },
  { label: '₹5L', value: '500000' },
  { label: '₹10L', value: '1000000' },
];

export default function PlanWizard() {
  const router = useRouter();
  const [cities, setCities] = useState<City[]>([]);
  const [form, setForm] = useState({
    eventType: 'wedding',
    cityId: '',
    budget: '',
    guestCount: '',
  });

  useEffect(() => {
    locationsApi.getCities().then((d: unknown) => setCities(d as City[])).catch(() => {});
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cityId || !form.budget) return;
    const params = new URLSearchParams({
      eventType: form.eventType,
      budget: form.budget,
      cityId: form.cityId,
      autosubmit: '1',
      ...(form.guestCount && { guestCount: form.guestCount }),
    });
    router.push(`/plan?${params.toString()}`);
  };

  const formatBudget = (v: string) => {
    const n = Number(v);
    if (!n) return '';
    return n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}K`;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 sm:p-6 shadow-2xl text-left"
    >
      {/* Event type pills */}
      <div className="mb-5">
        <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3">Event Type</p>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((et) => (
            <button
              key={et.value}
              type="button"
              onClick={() => setForm({ ...form, eventType: et.value })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                form.eventType === et.value
                  ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30'
                  : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
              }`}
            >
              <span>{et.icon}</span>
              <span>{et.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Row: City + Budget + Guests */}
      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        {/* City */}
        <div>
          <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">City *</label>
          <select
            required
            value={form.cityId}
            onChange={(e) => setForm({ ...form, cityId: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-red-400/50 focus:border-red-400/50 appearance-none"
          >
            <option value="" className="text-gray-900">Select city</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id} className="text-gray-900">{c.name}</option>
            ))}
          </select>
        </div>

        {/* Budget */}
        <div>
          <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">
            Total Budget *{form.budget && <span className="ml-1 text-red-300 normal-case">{formatBudget(form.budget)}</span>}
          </label>
          <input
            required
            type="number"
            placeholder="e.g. 500000"
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-red-400/50 focus:border-red-400/50"
          />
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {BUDGET_PRESETS.map((b) => (
              <button
                key={b.value}
                type="button"
                onClick={() => setForm({ ...form, budget: b.value })}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${
                  form.budget === b.value
                    ? 'bg-red-500 border-red-400 text-white'
                    : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Guests */}
        <div>
          <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Guests (optional)</label>
          <input
            type="number"
            placeholder="e.g. 200"
            value={form.guestCount}
            onChange={(e) => setForm({ ...form, guestCount: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-red-400/50 focus:border-red-400/50"
          />
        </div>
      </div>

      {/* CTA */}
      <button
        type="submit"
        disabled={!form.cityId || !form.budget}
        className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold py-3.5 rounded-xl transition shadow-lg shadow-red-600/30 hover:shadow-red-600/50 text-base tracking-wide"
      >
        Get My Plan →
      </button>
    </form>
  );
}
