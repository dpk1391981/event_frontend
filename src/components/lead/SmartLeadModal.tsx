'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { leadsApi, locationsApi } from '@/lib/api';

// ── Constants ─────────────────────────────────────────────────────────────────

const EVENT_TYPES = [
  { value: 'wedding',     label: 'Wedding',     icon: '💍' },
  { value: 'birthday',    label: 'Birthday',    icon: '🎂' },
  { value: 'corporate',   label: 'Corporate',   icon: '💼' },
  { value: 'anniversary', label: 'Anniversary', icon: '💑' },
  { value: 'engagement',  label: 'Engagement',  icon: '💫' },
  { value: 'reception',   label: 'Reception',   icon: '🎊' },
  { value: 'baby-shower', label: 'Baby Shower', icon: '🍼' },
  { value: 'other',       label: 'Other',       icon: '🎉' },
];

const BUDGET_OPTS = [
  { label: '<₹50K',  value: 50000 },
  { label: '₹50K–1L', value: 100000 },
  { label: '₹1L–2L',  value: 200000 },
  { label: '₹2L–5L',  value: 500000 },
  { label: '₹5L–10L', value: 1000000 },
  { label: '>₹10L',  value: 2000000 },
];

const GUEST_OPTS = [
  { label: '<50',    value: 30 },
  { label: '50–100', value: 75 },
  { label: '100–200',value: 150 },
  { label: '200–500',value: 350 },
  { label: '500+',   value: 600 },
];

// ── Types ─────────────────────────────────────────────────────────────────────

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

type Step = 'event' | 'contact' | 'success';

// ── Helpers ───────────────────────────────────────────────────────────────────

function ChipBtn({
  active, onClick, children, className = '',
}: {
  active: boolean; onClick: () => void; children: React.ReactNode; className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all select-none
        ${active
          ? 'bg-violet-600 border-violet-600 text-white shadow-sm shadow-violet-200'
          : 'bg-white border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-700'}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

const inp = 'w-full border-2 border-gray-100 focus:border-violet-400 rounded-xl px-3.5 py-2.5 text-sm outline-none transition bg-white placeholder:text-gray-300 text-gray-800';

// ── Main Component ────────────────────────────────────────────────────────────

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

  // ── Event step state
  const [eventType,  setEventType]  = useState(initEventType || '');
  const [eventDate,  setEventDate]  = useState(initDate || '');
  const [budget,     setBudget]     = useState(initBudget ? String(initBudget) : '');
  const [guestCount, setGuestCount] = useState(initGuests ? String(initGuests) : '');
  const [requirement, setRequirement] = useState('');

  // ── Contact step state
  const [name,  setName]  = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cityId, setCityId] = useState(selectedCity?.id?.toString() || '');

  // ── UI state
  const [step,          setStep]          = useState<Step>('event');
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [assignedCount, setAssignedCount] = useState(0);
  const [cities,        setCities]        = useState<{ id: number; name: string }[]>([]);

  const contentRef = useRef<HTMLDivElement>(null);

  // Hydrate contact from user
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setEmail((user as any).email || '');
    }
  }, [user]);

  // Load cities for multi mode
  useEffect(() => {
    if (mode === 'multi') {
      locationsApi.getCities().then((d: any) => setCities(d || [])).catch(() => {});
    }
  }, [mode]);

  // Keep cityId in sync with store
  useEffect(() => {
    if (selectedCity && !cityId) setCityId(selectedCity.id.toString());
  }, [selectedCity]);

  // Scroll to top on step change
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // ── Validation ─────────────────────────────────────────────────────────────

  const canProceedToContact = true; // event step is optional enrichment

  const canSubmit = name.trim().length >= 2 && phone.replace(/\D/g,'').length === 10;

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');

    const resolvedCityId = cityId ? Number(cityId) : selectedCity?.id;
    const budgetNum      = budget    ? Number(budget)    : undefined;
    const guestNum       = guestCount ? Number(guestCount) : undefined;
    const cleanPhone     = phone.replace(/\D/g, '');

    try {
      if (mode === 'single' && vendorId) {
        await leadsApi.create({
          vendorId,
          contactName:  name,
          contactPhone: cleanPhone,
          contactEmail: email || undefined,
          requirement:  requirement || undefined,
          cityId:       resolvedCityId,
          categoryId,
          packageId,
          eventType:    eventType || undefined,
          budget:       budgetNum,
          guestCount:   guestNum,
          eventDate:    eventDate || undefined,
          source:       searchQuery ? 'search' : 'vendor_profile',
          searchQuery,
        });
        setStep('success');
      } else {
        const res: any = await leadsApi.route({
          contactName:  name,
          contactPhone: cleanPhone,
          contactEmail: email || undefined,
          requirement:  requirement || undefined,
          cityId:       resolvedCityId,
          categoryId,
          eventType:    eventType || undefined,
          budget:       budgetNum,
          guestCount:   guestNum,
          eventDate:    eventDate || undefined,
          source:       'seo_page',
          searchQuery,
        });
        setAssignedCount(res?.assignedCount || 0);
        setStep('success');
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ─────────────────────────────────────────────────────────

  if (step === 'success') {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        onMouseDown={onClose}
      >
        <div
          className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl overflow-hidden"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Celebration header */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-6 pt-8 pb-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              {['🎉','✨','🌟','💫','🎊'].map((e, i) => (
                <span key={i} className="absolute text-2xl" style={{
                  top: `${20 + (i * 15) % 60}%`,
                  left: `${5 + (i * 23) % 90}%`,
                  transform: `rotate(${i * 45}deg)`,
                }}>{e}</span>
              ))}
            </div>
            <div className="relative">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-white mb-1">Request Sent!</h3>
              <p className="text-emerald-100 text-sm">
                {mode === 'multi'
                  ? `Matched with ${assignedCount > 0 ? `${assignedCount} top vendor${assignedCount !== 1 ? 's' : ''}` : 'best vendors'}`
                  : `${vendorName || 'The vendor'} will contact you shortly`}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="px-6 py-5 space-y-3">
            {[
              { icon: '⏱️', text: 'Expect a call within 2 hours' },
              { icon: '🔒', text: 'Your details are only shared with matched vendors' },
              { icon: '🆓', text: '100% Free · No hidden charges · No spam' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-lg shrink-0">{item.icon}</span>
                <p className="text-sm text-gray-600">{item.text}</p>
              </div>
            ))}

            <button
              onClick={onClose}
              className="w-full mt-2 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-2xl transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step progress ──────────────────────────────────────────────────────────

  const steps: Step[] = ['event', 'contact'];
  const stepIdx = steps.indexOf(step);

  // ── Header config ──────────────────────────────────────────────────────────

  const headerTitle = mode === 'single' && vendorName
    ? `Quote from ${vendorName}`
    : 'Get Best Vendor Quotes';

  const headerSub = mode === 'single'
    ? (packageId ? 'Package enquiry · Free · No hidden charges' : `${serviceType || 'Vendor'} enquiry · Free · Instant`)
    : `Matched with top ${serviceType || 'vendors'} · Free · No spam`;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl flex flex-col max-h-[95dvh] overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ paddingBottom: step === 'contact' ? 'env(safe-area-inset-bottom, 0px)' : undefined }}
      >
        {/* ── Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* ── Header */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start gap-3">
            {/* Vendor avatar bubble */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 text-white flex items-center justify-center font-extrabold text-base shrink-0 shadow-sm">
              {vendorName ? vendorName[0].toUpperCase() : '🎯'}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900 leading-snug">{headerTitle}</h2>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">{headerSub}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 transition shrink-0 text-sm"
          >
            ✕
          </button>
        </div>

        {/* ── Step progress bar */}
        <div className="px-5 pt-3 pb-0 shrink-0">
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 transition-all
                  ${i < stepIdx ? 'bg-violet-600 text-white' : i === stepIdx ? 'bg-violet-600 text-white ring-4 ring-violet-100' : 'bg-gray-100 text-gray-400'}
                `}>
                  {i < stepIdx ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : i + 1}
                </div>
                <span className={`text-[11px] font-bold transition-colors ${i === stepIdx ? 'text-violet-700' : i < stepIdx ? 'text-gray-400' : 'text-gray-300'}`}>
                  {s === 'event' ? 'Event Details' : 'Your Contact'}
                </span>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full transition-all ${i < stepIdx ? 'bg-violet-400' : 'bg-gray-100'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Content (scrollable) */}
        <div ref={contentRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* ════════════ STEP 1: Event Details ════════════ */}
          {step === 'event' && (
            <div className="space-y-5">
              {/* Multi-vendor info strip */}
              {mode === 'multi' && (
                <div className="flex items-start gap-2.5 bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3">
                  <span className="text-base shrink-0 mt-0.5">⚡</span>
                  <p className="text-xs text-violet-700 font-medium leading-relaxed">
                    Instantly matched with the top 3–5 verified vendors in your city · Free · No spam
                  </p>
                </div>
              )}

              {/* Event Type */}
              <div>
                <FieldLabel>What's the occasion?</FieldLabel>
                <div className="grid grid-cols-4 gap-2">
                  {EVENT_TYPES.map((et) => (
                    <button
                      key={et.value}
                      type="button"
                      onClick={() => setEventType(eventType === et.value ? '' : et.value)}
                      className={`
                        flex flex-col items-center gap-1 py-2.5 rounded-2xl border-2 transition-all text-center
                        ${eventType === et.value
                          ? 'border-violet-500 bg-violet-50 shadow-sm'
                          : 'border-gray-100 hover:border-violet-200 bg-gray-50 hover:bg-white'}
                      `}
                    >
                      <span className="text-xl">{et.icon}</span>
                      <span className={`text-[10px] font-bold leading-tight ${eventType === et.value ? 'text-violet-700' : 'text-gray-500'}`}>
                        {et.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <FieldLabel>Approximate budget</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {BUDGET_OPTS.map((b) => (
                    <ChipBtn
                      key={b.value}
                      active={budget === String(b.value)}
                      onClick={() => setBudget(budget === String(b.value) ? '' : String(b.value))}
                    >
                      {b.label}
                    </ChipBtn>
                  ))}
                </div>
              </div>

              {/* Guests */}
              <div>
                <FieldLabel>Expected guests</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {GUEST_OPTS.map((g) => (
                    <ChipBtn
                      key={g.value}
                      active={guestCount === String(g.value)}
                      onClick={() => setGuestCount(guestCount === String(g.value) ? '' : String(g.value))}
                    >
                      {g.label}
                    </ChipBtn>
                  ))}
                </div>
              </div>

              {/* Event Date */}
              <div>
                <FieldLabel>Event date <span className="text-gray-300 font-normal normal-case">(optional)</span></FieldLabel>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={inp}
                />
              </div>

              {/* Requirement */}
              <div>
                <FieldLabel>Describe your requirement <span className="text-gray-300 font-normal normal-case">(optional)</span></FieldLabel>
                <textarea
                  rows={2}
                  placeholder={serviceType
                    ? `e.g. ${serviceType} for my ${eventType || 'event'}…`
                    : 'e.g. Need a wedding photographer for 200 guests on Dec 25th…'}
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  className={`${inp} resize-none`}
                />
              </div>

              {/* City (multi mode only, when no city selected) */}
              {mode === 'multi' && !selectedCity && cities.length > 0 && (
                <div>
                  <FieldLabel required>Your City</FieldLabel>
                  <select
                    value={cityId}
                    onChange={(e) => setCityId(e.target.value)}
                    className={inp}
                  >
                    <option value="">Select your city</option>
                    {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* ════════════ STEP 2: Contact Details ════════════ */}
          {step === 'contact' && (
            <div className="space-y-4">
              {/* Logged-in user context */}
              {user && (
                <div className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center font-extrabold text-sm shrink-0">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 leading-none">{user.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{(user as any).email || user.phone}</p>
                  </div>
                  <span className="text-[10px] bg-violet-100 text-violet-700 font-bold px-2 py-1 rounded-full shrink-0">Logged in</span>
                </div>
              )}

              {/* Review summary */}
              {(eventType || budget || guestCount || eventDate) && (
                <div className="bg-gray-50 rounded-2xl px-4 py-3 space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Your Request Summary</p>
                  {eventType && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>{EVENT_TYPES.find(e => e.value === eventType)?.icon}</span>
                      <span className="font-semibold capitalize">{eventType.replace(/-/g,' ')}</span>
                    </div>
                  )}
                  {budget && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>💰</span>
                      <span>Budget: <span className="font-semibold">₹{Number(budget).toLocaleString('en-IN')}</span></span>
                    </div>
                  )}
                  {guestCount && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>👥</span>
                      <span>~<span className="font-semibold">{guestCount}</span> guests</span>
                    </div>
                  )}
                  {eventDate && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>📅</span>
                      <span className="font-semibold">{new Date(eventDate + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                  )}
                  {vendorName && mode === 'single' && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>🏪</span>
                      <span>Sending to <span className="font-semibold">{vendorName}</span></span>
                    </div>
                  )}
                </div>
              )}

              {/* Name */}
              <div>
                <FieldLabel required>Your Name</FieldLabel>
                <input
                  type="text"
                  placeholder="Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inp}
                  autoComplete="name"
                />
              </div>

              {/* Phone */}
              <div>
                <FieldLabel required>Mobile Number</FieldLabel>
                <div className="flex">
                  <span className="flex items-center px-3.5 bg-gray-50 border-2 border-r-0 border-gray-100 rounded-l-xl text-gray-500 text-sm font-semibold shrink-0">
                    +91
                  </span>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    pattern="[6-9]\d{9}"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="flex-1 border-2 border-gray-100 focus:border-violet-400 rounded-r-xl px-3 py-2.5 text-sm outline-none transition"
                    autoComplete="tel"
                    inputMode="numeric"
                  />
                </div>
                {phone && phone.length < 10 && (
                  <p className="text-[11px] text-amber-500 mt-1 font-medium">{10 - phone.length} more digits needed</p>
                )}
                {phone.length === 10 && (
                  <p className="text-[11px] text-emerald-600 mt-1 font-bold">✓ Valid number</p>
                )}
              </div>

              {/* Email (optional) */}
              <div>
                <FieldLabel>Email <span className="text-gray-300 font-normal normal-case">(optional · for quote details)</span></FieldLabel>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inp}
                  autoComplete="email"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border-2 border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer CTA (sticky) */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white shrink-0">
          {step === 'event' ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('contact')}
                disabled={!canProceedToContact}
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-extrabold py-3.5 rounded-2xl transition shadow-lg shadow-violet-200 disabled:opacity-50 text-sm"
              >
                {(eventType || budget || guestCount) ? 'Continue →' : 'Skip & Continue →'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !canSubmit}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 active:scale-[0.98] text-white font-extrabold py-3.5 rounded-2xl transition shadow-lg shadow-violet-200 disabled:opacity-50 text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending Request…
                  </span>
                ) : mode === 'multi' ? (
                  '⚡ Get Free Quotes — Instant'
                ) : (
                  `Send to ${vendorName || 'Vendor'} — It's Free`
                )}
              </button>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setStep('event'); setError(''); }}
                  className="text-xs text-gray-400 hover:text-gray-600 font-semibold transition flex items-center gap-1"
                >
                  ← Back
                </button>
                <p className="text-[11px] text-gray-400">🔒 Shared only with matched vendors</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
