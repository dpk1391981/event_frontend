'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
  X, MessageSquare, AlertCircle, Zap, Check, Building2, Globe,
  Search, MapPin, Star,
} from 'lucide-react';
import { feedbackApi, leadsApi, locationsApi, vendorsApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

const HIDDEN_PREFIXES = ['/admin', '/vendor/dashboard', '/partner', '/auth'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface VendorCtx {
  vendorId?: number;
  vendorName?: string;
  vendorSlug?: string;
  packageId?: number;
  packageTitle?: string;
  packagePrice?: number;
  serviceType?: string;
  categoryId?: number;
}

interface VendorSuggestion {
  id: number;
  businessName: string;
  slug: string;
  city?: { name: string };
  rating?: number;
  categories?: { name: string }[];
}

// ─── Page context detector ────────────────────────────────────────────────────
// Reads pathname + page-level data attributes injected by vendor/package pages

function usePageVendorCtx(): VendorCtx {
  const pathname = usePathname();
  const [ctx, setCtx] = useState<VendorCtx>({});

  useEffect(() => {
    // Try data attributes first (vendor/package pages inject these)
    const el = document.getElementById('__vendor_ctx__');
    if (el) {
      try {
        const parsed = JSON.parse(el.textContent || '{}');
        setCtx(parsed);
        return;
      } catch { /* ignore */ }
    }

    // Parse pathname heuristics
    // /vendor/[slug]  or  /vendors/[slug]
    const vendorMatch = pathname.match(/^\/vendors?\/([^/]+)/);
    if (vendorMatch) {
      const slug = vendorMatch[1];
      if (slug && slug !== 'dashboard') {
        vendorsApi.getBySlug(slug)
          .then((v: any) => {
            setCtx({
              vendorId:    v.id,
              vendorName:  v.businessName,
              vendorSlug:  v.slug,
              serviceType: v.categories?.[0]?.name,
              categoryId:  v.categories?.[0]?.id,
            });
          })
          .catch(() => setCtx({}));
        return;
      }
    }

    setCtx({});
  }, [pathname]);

  return ctx;
}

// ─── Constants ────────────────────────────────────────────────────────────────

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
  { label: '<₹50K',   value: 50000 },
  { label: '₹50K–1L', value: 100000 },
  { label: '₹1L–2L',  value: 200000 },
  { label: '₹2L–5L',  value: 500000 },
  { label: '₹5L–10L', value: 1000000 },
  { label: '>₹10L',   value: 2000000 },
];

const GUEST_OPTS = [
  { label: '<50',     value: 30 },
  { label: '50–100',  value: 75 },
  { label: '100–200', value: 150 },
  { label: '200–500', value: 350 },
  { label: '500+',    value: 600 },
];

const FEEDBACK_CATEGORIES = [
  { value: 'feature_request',  label: '✨ Feature Request' },
  { value: 'ui_ux',            label: '🎨 UI / UX' },
  { value: 'performance',      label: '⚡ Performance' },
  { value: 'general_feedback', label: '💬 General Feedback' },
  { value: 'appreciation',     label: '🙏 Appreciation' },
];

const COMPLAINT_CATEGORIES = [
  { value: 'vendor_behaviour', label: '😠 Vendor Behaviour' },
  { value: 'fake_vendor',      label: '🚫 Fake / Fraud Vendor' },
  { value: 'payment_issue',    label: '💳 Payment Issue' },
  { value: 'lead_quality',     label: '📉 Lead Quality' },
  { value: 'app_bug',          label: '🐛 App Bug' },
  { value: 'other_complaint',  label: '📝 Other' },
];

// ─── UI helpers ───────────────────────────────────────────────────────────────

const inp = 'w-full border-2 border-gray-100 focus:border-red-400 rounded-xl px-3.5 py-2.5 text-sm outline-none transition bg-white placeholder:text-gray-300 text-gray-800';

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function ChipBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button" onClick={onClick}
      className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all select-none
        ${active
          ? 'bg-red-600 border-red-600 text-white shadow-sm shadow-red-200'
          : 'bg-white border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-700'}`}
    >
      {children}
    </button>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          className={`text-2xl transition-transform hover:scale-110 ${(hover || value) >= n ? 'text-amber-400' : 'text-gray-200'}`}>★</button>
      ))}
    </div>
  );
}

// ─── Vendor Autosearch ────────────────────────────────────────────────────────

function VendorSearch({
  selected, onSelect, onClear,
}: {
  selected: VendorCtx | null;
  onSelect: (v: VendorCtx) => void;
  onClear: () => void;
}) {
  const { selectedCity } = useAppStore();
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState<VendorSuggestion[]>([]);
  const [loading, setLoading]     = useState(false);
  const [open, setOpen]           = useState(false);
  const debounceRef               = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapRef                   = useRef<HTMLDivElement>(null);

  const search = useCallback((q: string) => {
    if (q.trim().length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    vendorsApi.search(q, selectedCity?.id)
      .then((res: any) => {
        // search returns {vendors: [...]} or [{...}]
        const list: VendorSuggestion[] =
          Array.isArray(res) ? res :
          Array.isArray(res?.vendors) ? res.vendors :
          Array.isArray(res?.data) ? res.data : [];
        setResults(list.slice(0, 8));
        setOpen(list.length > 0);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [selectedCity?.id]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 280);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Already selected — show chip
  if (selected?.vendorId) {
    return (
      <div>
        <FieldLabel>Vendor</FieldLabel>
        <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3">
          <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-sm shrink-0">
            {selected.vendorName?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">{selected.vendorName}</p>
            {selected.serviceType && <p className="text-xs text-gray-500">{selected.serviceType}</p>}
          </div>
          <button type="button" onClick={onClear}
            className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-600 hover:border-red-300 transition shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {selected.packageTitle && (
          <div className="mt-2 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
            <span className="text-xs font-bold text-green-700">Package:</span>
            <span className="text-xs text-green-800 font-semibold truncate">{selected.packageTitle}</span>
            {selected.packagePrice && (
              <span className="ml-auto text-xs font-black text-green-700">₹{Number(selected.packagePrice).toLocaleString('en-IN')}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={wrapRef}>
      <FieldLabel>Send Quote Request To</FieldLabel>
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setOpen(true)}
            placeholder="Search vendor or business name…"
            className="w-full border-2 border-gray-100 focus:border-red-400 rounded-xl pl-10 pr-3.5 py-2.5 text-sm outline-none transition bg-white placeholder:text-gray-300"
          />
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
          )}
        </div>

        {open && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-10 overflow-hidden max-h-52 overflow-y-auto">
            {results.map(v => (
              <button
                key={v.id} type="button"
                onClick={() => {
                  onSelect({
                    vendorId:    v.id,
                    vendorName:  v.businessName,
                    vendorSlug:  v.slug,
                    serviceType: v.categories?.[0]?.name,
                  });
                  setQuery('');
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition text-left border-b border-gray-50 last:border-0"
              >
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-black text-xs shrink-0">
                  {v.businessName[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{v.businessName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {v.city && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><MapPin className="w-3 h-3" />{v.city.name}</span>}
                    {v.categories?.[0] && <span className="text-[10px] text-gray-400">{v.categories[0].name}</span>}
                  </div>
                </div>
                {v.rating && Number(v.rating) > 0 && (
                  <span className="text-xs text-amber-500 flex items-center gap-0.5 shrink-0 font-bold">
                    <Star className="w-3 h-3 fill-amber-400" />{Number(v.rating).toFixed(1)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Skip hint */}
      <p className="text-[11px] text-gray-400 mt-1">
        Leave empty to match with the best vendors in your city
      </p>
    </div>
  );
}

// ─── Tab 1: Get Quotes ────────────────────────────────────────────────────────

type LeadStep = 'event' | 'contact' | 'success';

function GetQuotesTab({ pageCtx, onClose }: { pageCtx: VendorCtx; onClose: () => void }) {
  const { user, selectedCity } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Vendor selection: start with page context if available
  const [vendorCtx, setVendorCtx] = useState<VendorCtx | null>(
    pageCtx.vendorId ? pageCtx : null
  );

  const [step, setStep]           = useState<LeadStep>('event');
  const [eventType, setEventType] = useState('');
  const [budget, setBudget]       = useState('');
  const [guestCount, setGuests]   = useState('');
  const [eventDate, setDate]      = useState('');
  const [requirement, setReq]     = useState('');
  const [name, setName]           = useState(user?.name || '');
  const [phone, setPhone]         = useState(user?.phone || '');
  const [email, setEmail]         = useState((user as any)?.email || '');
  const [cityId, setCityId]       = useState(selectedCity?.id?.toString() || '');
  const [cities, setCities]       = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [assigned, setAssigned]   = useState(0);

  // Sync page context when it loads asynchronously
  useEffect(() => {
    if (pageCtx.vendorId && !vendorCtx?.vendorId) {
      setVendorCtx(pageCtx);
    }
  }, [pageCtx.vendorId]);

  useEffect(() => {
    locationsApi.getCities().then((d: any) => setCities(d || [])).catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const canSubmit = name.trim().length >= 2 && phone.replace(/\D/g, '').length === 10;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true); setError('');
    try {
      const payload: Record<string, unknown> = {
        contactName:  name,
        contactPhone: phone.replace(/\D/g, ''),
        contactEmail: email || undefined,
        requirement:  requirement || undefined,
        cityId:       cityId ? Number(cityId) : selectedCity?.id,
        eventType:    eventType || undefined,
        budget:       budget ? Number(budget) : undefined,
        guestCount:   guestCount ? Number(guestCount) : undefined,
        eventDate:    eventDate || undefined,
        source:       'global_cta',
      };

      if (vendorCtx?.vendorId) {
        // Single vendor lead
        payload.vendorId  = vendorCtx.vendorId;
        if (vendorCtx.packageId)  payload.packageId  = vendorCtx.packageId;
        if (vendorCtx.categoryId) payload.categoryId = vendorCtx.categoryId;
        await leadsApi.create(payload);
        setAssigned(1);
      } else {
        // Multi-vendor broadcast
        const res: any = await leadsApi.route(payload);
        setAssigned(res?.assignedCount || 0);
      }
      setStep('success');
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success ──────────────────────────────────────────────────────────────────

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 gap-5 flex-1">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-200">
          <Check className="w-10 h-10 text-white" strokeWidth={3} />
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-900">
            {vendorCtx?.vendorId ? 'Quote Request Sent!' : 'Request Sent!'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {vendorCtx?.vendorId
              ? `${vendorCtx.vendorName} will contact you shortly`
              : `Matched with ${assigned > 0 ? `${assigned} top vendor${assigned !== 1 ? 's' : ''}` : 'best vendors'}`}
          </p>
        </div>
        <div className="w-full bg-gray-50 rounded-2xl p-4 space-y-3 text-left">
          {[
            { icon: '⏱️', text: 'Expect a call within 2 hours' },
            { icon: '🔒', text: 'Details shared only with matched vendors' },
            { icon: '🆓', text: '100% Free — No hidden charges, no spam' },
          ].map(i => (
            <div key={i.text} className="flex items-center gap-3 text-sm text-gray-600">
              <span>{i.icon}</span><span>{i.text}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose}
          className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl transition">
          Done
        </button>
      </div>
    );
  }

  const steps: LeadStep[] = ['event', 'contact'];
  const stepIdx = steps.indexOf(step);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Step progress */}
      <div className="px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-all
                ${i < stepIdx ? 'bg-red-600 text-white' : i === stepIdx ? 'bg-red-600 text-white ring-4 ring-red-100' : 'bg-gray-100 text-gray-400'}`}>
                {i < stepIdx ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : i + 1}
              </div>
              <span className={`text-xs font-bold transition-colors ${i === stepIdx ? 'text-red-600' : i < stepIdx ? 'text-gray-400' : 'text-gray-300'}`}>
                {s === 'event' ? 'Event Details' : 'Your Contact'}
              </span>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 rounded-full ${i < stepIdx ? 'bg-red-400' : 'bg-gray-100'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-5 min-h-0">

        {step === 'event' && (
          <>
            {/* Vendor selector */}
            <VendorSearch
              selected={vendorCtx}
              onSelect={ctx => setVendorCtx(ctx)}
              onClear={() => setVendorCtx(null)}
            />

            {!vendorCtx?.vendorId && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <Zap className="w-4 h-4 text-red-600 shrink-0 fill-red-200" />
                <p className="text-xs text-red-700 font-medium">
                  No vendor selected? We&apos;ll match you with top 3–5 verified vendors instantly · Free
                </p>
              </div>
            )}

            {/* Event Type */}
            <div>
              <FieldLabel>What&apos;s the occasion?</FieldLabel>
              <div className="grid grid-cols-4 gap-2">
                {EVENT_TYPES.map(et => (
                  <button key={et.value} type="button"
                    onClick={() => setEventType(eventType === et.value ? '' : et.value)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all
                      ${eventType === et.value
                        ? 'border-red-500 bg-red-50 shadow-sm'
                        : 'border-gray-100 bg-gray-50 hover:border-red-200 hover:bg-white'}`}>
                    <span className="text-xl">{et.icon}</span>
                    <span className={`text-[10px] font-bold leading-tight text-center ${eventType === et.value ? 'text-red-700' : 'text-gray-500'}`}>{et.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div>
              <FieldLabel>Approximate budget</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {BUDGET_OPTS.map(b => (
                  <ChipBtn key={b.value} active={budget === String(b.value)}
                    onClick={() => setBudget(budget === String(b.value) ? '' : String(b.value))}>
                    {b.label}
                  </ChipBtn>
                ))}
              </div>
            </div>

            {/* Guests */}
            <div>
              <FieldLabel>Expected guests</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {GUEST_OPTS.map(g => (
                  <ChipBtn key={g.value} active={guestCount === String(g.value)}
                    onClick={() => setGuests(guestCount === String(g.value) ? '' : String(g.value))}>
                    {g.label}
                  </ChipBtn>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <FieldLabel>Event date <span className="text-gray-300 font-normal normal-case">(optional)</span></FieldLabel>
              <input type="date" value={eventDate} onChange={e => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} className={inp} />
            </div>

            {/* Requirement */}
            <div>
              <FieldLabel>Describe your requirement <span className="text-gray-300 font-normal normal-case">(optional)</span></FieldLabel>
              <textarea rows={2} value={requirement} onChange={e => setReq(e.target.value)}
                placeholder="e.g. Need a wedding photographer for 200 guests…"
                className={`${inp} resize-none`} />
            </div>

            {/* City */}
            {!selectedCity && cities.length > 0 && (
              <div>
                <FieldLabel>Your City</FieldLabel>
                <select value={cityId} onChange={e => setCityId(e.target.value)} className={inp}>
                  <option value="">Select your city</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </>
        )}

        {step === 'contact' && (
          <>
            {/* Summary */}
            <div className="bg-red-50 rounded-2xl px-4 py-3 space-y-1.5 border border-red-100">
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide mb-2">Request Summary</p>
              {vendorCtx?.vendorId && (
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span>🏪</span><span>Sending to <strong>{vendorCtx.vendorName}</strong></span>
                </div>
              )}
              {!vendorCtx?.vendorId && (
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span>⚡</span><span>Matching with top vendors in your area</span>
                </div>
              )}
              {eventType && <div className="flex items-center gap-2 text-xs text-gray-700">
                <span>{EVENT_TYPES.find(e => e.value === eventType)?.icon}</span>
                <span className="font-semibold capitalize">{eventType.replace(/-/g, ' ')}</span>
              </div>}
              {budget && <div className="flex items-center gap-2 text-xs text-gray-700">
                <span>💰</span><span>Budget: <strong>₹{Number(budget).toLocaleString('en-IN')}</strong></span>
              </div>}
              {guestCount && <div className="flex items-center gap-2 text-xs text-gray-700">
                <span>👥</span><span>~<strong>{guestCount}</strong> guests</span>
              </div>}
            </div>

            <div>
              <FieldLabel required>Your Name</FieldLabel>
              <input type="text" placeholder="Rahul Sharma" value={name}
                onChange={e => setName(e.target.value)} className={inp} autoComplete="name" />
            </div>

            <div>
              <FieldLabel required>Mobile Number</FieldLabel>
              <div className="flex">
                <span className="flex items-center px-3.5 bg-gray-50 border-2 border-r-0 border-gray-100 rounded-l-xl text-gray-500 text-sm font-semibold shrink-0">+91</span>
                <input type="tel" placeholder="9876543210" maxLength={10} value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="flex-1 border-2 border-gray-100 focus:border-red-400 rounded-r-xl px-3 py-2.5 text-sm outline-none transition"
                  inputMode="numeric" autoComplete="tel" />
              </div>
              {phone && phone.length < 10 && <p className="text-[11px] text-amber-500 mt-1 font-medium">{10 - phone.length} more digits needed</p>}
              {phone.length === 10 && <p className="text-[11px] text-emerald-600 mt-1 font-bold">✓ Valid number</p>}
            </div>

            <div>
              <FieldLabel>Email <span className="text-gray-300 font-normal normal-case">(optional)</span></FieldLabel>
              <input type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} className={inp} autoComplete="email" />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">{error}</div>
            )}
          </>
        )}
      </div>

      {/* Sticky footer */}
      <div className="px-5 py-4 border-t border-gray-100 bg-white shrink-0">
        {step === 'event' ? (
          <button type="button" onClick={() => setStep('contact')}
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black py-4 rounded-2xl transition shadow-lg shadow-red-200 text-sm flex items-center justify-center gap-2">
            {(eventType || budget || guestCount) ? 'Continue →' : 'Skip & Continue →'}
          </button>
        ) : (
          <div className="space-y-3">
            <button type="button" onClick={handleSubmit} disabled={loading || !canSubmit}
              className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black py-4 rounded-2xl transition shadow-lg shadow-red-200 disabled:opacity-50 text-sm flex items-center justify-center gap-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                : vendorCtx?.vendorId
                  ? `Send Quote Request to ${vendorCtx.vendorName}`
                  : <><Zap className="w-4 h-4 fill-white" /> Get Free Quotes — Instant</>
              }
            </button>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => { setStep('event'); setError(''); }}
                className="text-xs text-gray-400 hover:text-gray-600 font-semibold transition">← Back</button>
              <p className="text-[11px] text-gray-400">🔒 Shared only with matched vendors</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab 2 & 3: Feedback / Complaint ─────────────────────────────────────────

function FeedbackComplaintTab({ type, onClose }: { type: 'feedback' | 'complaint'; onClose: () => void }) {
  const { user } = useAppStore();
  const isFeedback = type === 'feedback';
  const categories = isFeedback ? FEEDBACK_CATEGORIES : COMPLAINT_CATEGORIES;

  const [target, setTarget]         = useState<'platform' | 'vendor'>('platform');
  const [vendorCtx, setVendorCtx]   = useState<VendorCtx | null>(null);
  const [category, setCategory]     = useState(categories[0].value);
  const [message, setMessage]       = useState('');
  const [name, setName]             = useState(user?.name || '');
  const [email, setEmail]           = useState((user as any)?.email || '');
  const [rating, setRating]         = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) { setError('Please write a message.'); return; }
    if (target === 'vendor' && !vendorCtx?.vendorId) {
      // allow anyway — vendor search is optional on feedback
    }
    setError(''); setSubmitting(true);
    try {
      await feedbackApi.submit({
        type,
        category,
        message:  message.trim(),
        name:     name || undefined,
        email:    email || undefined,
        vendorId: vendorCtx?.vendorId || undefined,
        rating:   isFeedback && rating > 0 ? rating : undefined,
      });
      setDone(true);
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-4 px-6 py-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-xl shadow-green-200">
          <Check className="w-10 h-10 text-white" strokeWidth={3} />
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-900">{isFeedback ? 'Thank You!' : 'Complaint Registered!'}</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
            {isFeedback
              ? 'Your feedback helps us build a better PlanToday.'
              : 'Our team will review your complaint within 48 hours.'}
          </p>
        </div>
        <button onClick={onClose}
          className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl transition text-sm">Close</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">

        {/* Platform / Vendor toggle */}
        <div>
          <FieldLabel>This is about</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            {(['platform', 'vendor'] as const).map(t => (
              <button key={t} type="button" onClick={() => setTarget(t)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left
                  ${target === t ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                {t === 'platform'
                  ? <Globe className={`w-5 h-5 shrink-0 ${target === t ? 'text-red-600' : 'text-gray-400'}`} />
                  : <Building2 className={`w-5 h-5 shrink-0 ${target === t ? 'text-red-600' : 'text-gray-400'}`} />
                }
                <div>
                  <p className={`text-xs font-black leading-none ${target === t ? 'text-red-700' : 'text-gray-600'}`}>
                    {t === 'platform' ? 'PlanToday' : 'A Vendor'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{t === 'platform' ? 'App / Platform' : 'Business / Service'}</p>
                </div>
                {target === t && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Vendor search — shown when vendor target selected */}
        {target === 'vendor' && (
          <VendorSearch
            selected={vendorCtx}
            onSelect={ctx => setVendorCtx(ctx)}
            onClear={() => setVendorCtx(null)}
          />
        )}

        {/* Category pills */}
        <div>
          <FieldLabel>Category</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button key={c.value} type="button" onClick={() => setCategory(c.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all
                  ${category === c.value ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-red-300'}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <FieldLabel required>{isFeedback ? 'Your Feedback' : 'Describe the Issue'}</FieldLabel>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} maxLength={2000}
            placeholder={isFeedback
              ? 'Tell us what you think or suggest improvements…'
              : target === 'vendor'
                ? 'What happened? Include vendor name, date, and specific issue…'
                : 'What went wrong? Be specific about the issue…'}
            className={`${inp} resize-none`} />
          <p className="text-[11px] text-gray-400 mt-1 text-right">{message.length}/2000</p>
        </div>

        {/* Star rating (feedback only) */}
        {isFeedback && (
          <div>
            <FieldLabel>Overall Experience</FieldLabel>
            <StarRating value={rating} onChange={setRating} />
            <p className="text-xs text-gray-400 mt-1">
              {rating === 0 ? 'Tap a star to rate' : ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
            </p>
          </div>
        )}

        {/* Contact */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Your Name</FieldLabel>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className={inp} />
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="optional" type="email" className={inp} />
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-600 text-sm">{error}</div>}
      </div>

      {/* Sticky footer */}
      <div className="px-5 py-4 border-t border-gray-100 bg-white shrink-0">
        <button type="submit" disabled={submitting}
          className={`w-full py-4 font-black rounded-2xl text-sm transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-60
            ${isFeedback
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-200'
              : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-orange-200'}`}>
          {submitting
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
            : isFeedback
              ? <><MessageSquare className="w-4 h-4" /> Submit Feedback</>
              : <><AlertCircle className="w-4 h-4" /> Submit Complaint</>
          }
        </button>
      </div>
    </form>
  );
}

// ─── Support Modal ────────────────────────────────────────────────────────────

type Tab = 'quotes' | 'feedback' | 'complaint';

function SupportModal({ pageCtx, onClose }: { pageCtx: VendorCtx; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('quotes');

  const TABS: { id: Tab; label: string; icon: React.ReactNode; headerGrad: string; activeColor: string }[] = [
    { id: 'quotes',    label: 'Get Quotes', icon: <Zap className="w-4 h-4" />,           headerGrad: 'from-red-600 to-rose-600',       activeColor: 'text-red-600 border-red-600' },
    { id: 'feedback',  label: 'Feedback',   icon: <MessageSquare className="w-4 h-4" />, headerGrad: 'from-blue-600 to-indigo-600',    activeColor: 'text-blue-600 border-blue-600' },
    { id: 'complaint', label: 'Complaint',  icon: <AlertCircle className="w-4 h-4" />,   headerGrad: 'from-orange-500 to-red-600',     activeColor: 'text-orange-600 border-orange-600' },
  ];
  const active = TABS.find(t => t.id === tab)!;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onMouseDown={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{ height: 'min(92dvh, 700px)' }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="sm:hidden flex justify-center pt-3 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className={`bg-gradient-to-r ${active.headerGrad} text-white px-5 py-4 flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">{active.icon}</div>
            <div>
              <p className="font-black text-base leading-none">
                {tab === 'quotes' ? (pageCtx.vendorId ? `Quote from ${pageCtx.vendorName}` : 'Get Free Vendor Quotes') : tab === 'feedback' ? 'Share Feedback' : 'File a Complaint'}
              </p>
              <p className="text-white/70 text-[11px] mt-0.5">
                {tab === 'quotes' ? 'Instant match with verified vendors · Free' : tab === 'feedback' ? 'Help us improve PlanToday' : 'We take every complaint seriously'}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-100 bg-gray-50 shrink-0">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-bold transition border-b-2
                ${tab === t.id ? `${t.activeColor} bg-white` : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 flex flex-col">
          {tab === 'quotes'    && <GetQuotesTab          pageCtx={pageCtx} onClose={onClose} />}
          {tab === 'feedback'  && <FeedbackComplaintTab  type="feedback"   onClose={onClose} />}
          {tab === 'complaint' && <FeedbackComplaintTab  type="complaint"  onClose={onClose} />}
        </div>
      </div>
    </div>
  );
}

// ─── Main FAB ─────────────────────────────────────────────────────────────────

export default function GlobalLeadCTA() {
  const pathname  = usePathname();
  const pageCtx   = usePageVendorCtx();

  const [open, setOpen]           = useState(false);
  const [visible, setVisible]     = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [pulse, setPulse]         = useState(false);
  const [hovered, setHovered]     = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 3000);
    const t2 = setTimeout(() => setPulse(true),   8000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const isHidden = HIDDEN_PREFIXES.some(p => pathname?.startsWith(p));
  if (isHidden || dismissed) return null;

  return (
    <>
      {/* FAB */}
      <div className={[
        'fixed z-[120] flex flex-col items-end gap-2 transition-all duration-500',
        'bottom-20 right-4 sm:bottom-8 sm:right-8',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none',
      ].join(' ')}>

        {hovered && !open && (
          <button onClick={() => setDismissed(true)}
            className="w-6 h-6 bg-gray-200 hover:bg-gray-300 text-gray-500 rounded-full text-xs font-bold flex items-center justify-center transition self-center">×</button>
        )}

        {!open && hovered && (
          <div className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-2xl shadow-xl whitespace-nowrap">
            <span className="text-red-400 mr-1">💡</span>
            {pageCtx.vendorId ? `Quote from ${pageCtx.vendorName}` : 'Quotes, Feedback & Support'}
          </div>
        )}

        <button
          onClick={() => setOpen(o => !o)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-label="Help & Support"
          className="relative w-16 h-16 bg-gradient-to-br from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-full shadow-2xl shadow-red-300/60 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        >
          {pulse && !open && !hovered && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-500/40 animate-ping" />
              <span className="absolute inset-[-6px] rounded-full border-2 border-red-400/30 animate-ping" style={{ animationDelay: '0.3s' }} />
            </>
          )}
          {open
            ? <X className="w-7 h-7" />
            : <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
          }
          <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full" />
        </button>

        <p className="text-[10px] font-bold text-gray-400 text-center">
          {pageCtx.vendorId ? 'Get Quote' : 'Help & Support'}
        </p>
      </div>

      {open && <SupportModal pageCtx={pageCtx} onClose={() => setOpen(false)} />}
    </>
  );
}
