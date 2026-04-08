'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { leadsApi, locationsApi } from '@/lib/api';

const EVENT_TYPES = [
  { value: 'wedding',     label: '💍 Wedding' },
  { value: 'birthday',    label: '🎂 Birthday Party' },
  { value: 'corporate',   label: '💼 Corporate Event' },
  { value: 'anniversary', label: '💑 Anniversary' },
  { value: 'engagement',  label: '💍 Engagement' },
  { value: 'reception',   label: '🎊 Reception' },
  { value: 'baby-shower', label: '🍼 Baby Shower' },
  { value: 'other',       label: '🎉 Other Event' },
];

interface Props {
  mode?: 'single' | 'multi';
  vendorId?: number;
  vendorName?: string;
  categoryId?: number;
  serviceType?: string;
  packageId?: number;
  budget?: number;
  guestCount?: number;
  eventDate?: string;
  eventType?: string;
  searchQuery?: string;
  onClose: () => void;
}

export default function SmartLeadModal({
  mode = 'multi',
  vendorId,
  vendorName,
  categoryId,
  serviceType,
  packageId,
  budget: initBudget,
  guestCount: initGuests,
  eventDate: initDate,
  eventType: initEventType,
  searchQuery,
  onClose,
}: Props) {
  const { user, selectedCity } = useAppStore();

  const [form, setForm] = useState({
    contactName:  user?.name   || '',
    contactPhone: user?.phone  || '',
    requirement:  '',
    cityId:       selectedCity?.id?.toString() || '',
    eventType:    initEventType || '',
    budget:       initBudget?.toString()  || '',
    guestCount:   initGuests?.toString()  || '',
    eventDate:    initDate || '',
  });

  const [cities,        setCities]        = useState<{ id: number; name: string }[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [success,       setSuccess]       = useState(false);
  const [assignedCount, setAssignedCount] = useState(0);
  const [error,         setError]         = useState('');
  const [showDetails,   setShowDetails]   = useState(
    // Auto-expand detail fields if any are pre-filled
    !!(initBudget || initGuests || initDate || initEventType)
  );

  useEffect(() => {
    if (mode === 'multi') {
      locationsApi.getCities().then((data: any) => setCities(data || [])).catch(() => {});
    }
  }, [mode]);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        contactName:  f.contactName  || user.name  || '',
        contactPhone: f.contactPhone || user.phone || '',
      }));
    }
  }, [user]);

  // Keep city in sync with store
  useEffect(() => {
    if (selectedCity && !form.cityId) {
      setForm((f) => ({ ...f, cityId: selectedCity.id.toString() }));
    }
  }, [selectedCity]);

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const resolvedCityId = form.cityId ? Number(form.cityId) : selectedCity?.id;
      const budgetNum    = form.budget    ? Number(form.budget)    : undefined;
      const guestNum     = form.guestCount ? Number(form.guestCount) : undefined;

      if (mode === 'single' && vendorId) {
        await leadsApi.create({
          vendorId,
          contactName:  form.contactName,
          contactPhone: form.contactPhone,
          requirement:  form.requirement || undefined,
          cityId:       resolvedCityId,
          categoryId,
          packageId,
          budget:       budgetNum,
          guestCount:   guestNum,
          eventDate:    form.eventDate || undefined,
          source:       searchQuery ? 'search' : 'vendor_profile',
          searchQuery,
        });
        setSuccess(true);
      } else {
        const res: any = await leadsApi.route({
          contactName:  form.contactName,
          contactPhone: form.contactPhone,
          requirement:  form.requirement || undefined,
          cityId:       resolvedCityId,
          categoryId,
          eventType:    form.eventType  || undefined,
          budget:       budgetNum,
          guestCount:   guestNum,
          eventDate:    form.eventDate  || undefined,
          source:       'seo_page',
          searchQuery,
        });
        setAssignedCount(res?.assignedCount || 0);
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inp = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition bg-white';

  /* ── Success state ───────────────────────────────────────────────────────── */
  if (success) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.65)' }} onMouseDown={onClose}>
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8 text-center"
          onMouseDown={(e) => e.stopPropagation()}>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Request Sent! 🎉</h3>
          <p className="text-gray-500 text-sm mb-1 leading-relaxed">
            {mode === 'multi'
              ? `Matched to ${assignedCount > 0 ? `${assignedCount} top vendor${assignedCount !== 1 ? 's' : ''}` : 'best vendors'} in your city.`
              : `${vendorName || 'The vendor'} will contact you shortly.`}
          </p>
          <p className="text-gray-400 text-xs mb-6">Expect a call within 2 hours.</p>
          <button onClick={onClose}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition">
            Done
          </button>
        </div>
      </div>
    );
  }

  /* ── Form ────────────────────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }} onMouseDown={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto"
        onMouseDown={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-white px-5 pt-5 pb-4 border-b border-gray-100 rounded-t-2xl z-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-snug">
                {mode === 'single' && vendorName
                  ? `Get Free Quote from ${vendorName}`
                  : 'Get Best Vendor Quotes Instantly'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {mode === 'multi'
                  ? `Matched to top ${serviceType || 'vendors'} · Free · No spam`
                  : 'Free quote · No hidden charges'}
              </p>
            </div>
            <button type="button" onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition shrink-0">
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {mode === 'multi' && (
            <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <span className="text-base shrink-0">⚡</span>
              <p className="text-xs text-blue-700 font-medium leading-relaxed">
                Free · Match with top 3–5 verified vendors · No spam calls
              </p>
            </div>
          )}

          {/* ── Contact fields ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input required type="text" placeholder="Rahul Sharma"
                value={form.contactName} onChange={(e) => set('contactName', e.target.value)}
                className={inp} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Phone <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <span className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-gray-500 text-sm font-medium shrink-0">+91</span>
                <input required type="tel" placeholder="9876543210"
                  pattern="[6-9]\d{9}" maxLength={10}
                  value={form.contactPhone}
                  onChange={(e) => set('contactPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="flex-1 border border-gray-200 rounded-r-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition" />
              </div>
            </div>
          </div>

          {/* Event Type — always show */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Event Type</label>
            <select value={form.eventType} onChange={(e) => set('eventType', e.target.value)} className={inp}>
              <option value="">Select event type</option>
              {EVENT_TYPES.map((et) => (
                <option key={et.value} value={et.value}>{et.label}</option>
              ))}
            </select>
          </div>

          {/* City — multi mode without global city selected */}
          {mode === 'multi' && !selectedCity && cities.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your City</label>
              <select value={form.cityId} onChange={(e) => set('cityId', e.target.value)} className={inp}>
                <option value="">Select city</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {/* ── Event details toggle ── */}
          <button type="button" onClick={() => setShowDetails((v) => !v)}
            className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 hover:text-gray-700 py-1.5 border-t border-gray-100 transition">
            <span className="flex items-center gap-1.5">
              {showDetails ? '▾' : '▸'}
              {showDetails ? 'Hide event details' : 'Add event details'}{' '}
              <span className="font-normal text-gray-400">(budget, guests, date)</span>
            </span>
            {(form.budget || form.guestCount || form.eventDate) && (
              <span className="text-green-600 font-bold text-[10px]">✓ filled</span>
            )}
          </button>

          {showDetails && (
            <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Budget <span className="text-gray-400 font-normal">(₹)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
                    <input type="number" min={0} step={1000}
                      placeholder="e.g. 200000"
                      value={form.budget} onChange={(e) => set('budget', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition bg-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Guests <span className="text-gray-400 font-normal">(approx)</span>
                  </label>
                  <input type="number" min={1} max={10000}
                    placeholder="e.g. 150"
                    value={form.guestCount} onChange={(e) => set('guestCount', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Event Date</label>
                <input type="date"
                  value={form.eventDate} onChange={(e) => set('eventDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition bg-white" />
              </div>
            </div>
          )}

          {/* Requirement */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your Requirement</label>
            <textarea rows={2}
              placeholder={serviceType
                ? `Describe your ${serviceType} requirement...`
                : 'e.g. Wedding photographer for 200 guests on Dec 15...'}
              value={form.requirement} onChange={(e) => set('requirement', e.target.value)}
              className={`${inp} resize-none`} />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-60 text-base">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </span>
            ) : mode === 'multi' ? 'Get Free Quotes — Instant' : "Send Request — It's Free"}
          </button>

          <p className="text-center text-xs text-gray-400">🔒 Only shared with matched vendors</p>
        </form>
      </div>
    </div>
  );
}
