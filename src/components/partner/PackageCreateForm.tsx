'use client';

/**
 * PackageCreateForm
 *
 * 5-step multi-page form for creating OR editing a Vendor Package.
 *
 * 🚨 GATE: If vendor has no active services → show a modal redirect.
 *
 * Step 1 – Basic Info      (title, category, event types, description)
 * Step 2 – Services        (select ≥1 active services, auto-fill pricing + tags)
 * Step 3 – Pricing         (priceMode, final price, add-ons, exclusions, highlights)
 * Step 4 – Location & Availability
 * Step 5 – Media           (real file upload to /upload/images)
 */

import { useState, useCallback, useEffect } from 'react';
import {
  X, ChevronRight, ChevronLeft, Check, Upload, Plus, Trash2,
  Loader2, Info, AlertCircle, Package2, Zap, ImageIcon,
} from 'lucide-react';
import { packagesApi, uploadApi } from '@/lib/api';
import { getImageUrl } from '@/lib/image-url';

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType  = 'wedding' | 'birthday' | 'corporate' | 'anniversary' | 'spiritual' | 'social' | 'other';
type PriceMode  = 'fixed_price' | 'calculated_from_services';
type AvailType  = 'derived_from_services' | 'custom';

interface Category { id: number; name: string }
interface City     { id: number; name: string }

export interface ActiveService {
  id:         number;
  name?:      string;
  title?:     string;
  basePrice?: number;
  minPrice?:  number;
  priceType?: string;
  eventTypes?: string[];
  tags?:      string[];
  categoryId?: number;
}

/** Existing package data for edit mode */
export interface PackageEditData {
  id: number;
  title?: string;
  categoryId?: number;
  eventTypes?: EventType[];
  description?: string;
  serviceIds?: number[];
  priceMode?: PriceMode;
  price?: number;
  finalPrice?: number;
  discountAmount?: number;
  addons?: Array<{ label: string; price: number }>;
  includes?: string[];
  bulletPoints?: string[];
  exclusions?: string[];
  tags?: string[];
  cityId?: number;
  serviceAreas?: string[];
  minGuests?: number;
  maxGuests?: number;
  availabilityType?: AvailType;
  availableDates?: string[];
  blockedDates?: string[];
  images?: string[];
  videos?: string[];
}

interface FormData {
  title:            string;
  categoryId:       number | '';
  eventTypes:       EventType[];
  description:      string;
  serviceIds:       number[];
  priceMode:        PriceMode;
  price:            string;
  discountAmount:   string;
  addOns:           Array<{ label: string; price: string }>;
  includes:         string[];
  bulletPoints:     string[];
  exclusions:       string[];
  tags:             string[];
  cityId:           number | '';
  serviceAreas:     string;
  minGuests:        string;
  maxGuests:        string;
  availabilityType: AvailType;
  availableDates:   string[];
  blockedDates:     string[];
  images:           string[];
  videos:           string[];
}

const EVENT_TYPES: { value: EventType; label: string; emoji: string }[] = [
  { value: 'wedding',     label: 'Wedding',     emoji: '💍' },
  { value: 'birthday',    label: 'Birthday',    emoji: '🎂' },
  { value: 'corporate',   label: 'Corporate',   emoji: '💼' },
  { value: 'anniversary', label: 'Anniversary', emoji: '❤️' },
  { value: 'spiritual',   label: 'Spiritual',   emoji: '🙏' },
  { value: 'social',      label: 'Social',      emoji: '🎉' },
  { value: 'other',       label: 'Other',       emoji: '📋' },
];

const STEPS = [
  { id: 1, label: 'Basic Info',  icon: '📋' },
  { id: 2, label: 'Services',    icon: '🧩' },
  { id: 3, label: 'Pricing',     icon: '💰' },
  { id: 4, label: 'Location',    icon: '📍' },
  { id: 5, label: 'Media',       icon: '📸' },
];

const INITIAL: FormData = {
  title: '', categoryId: '', eventTypes: [], description: '',
  serviceIds: [],
  priceMode: 'fixed_price', price: '', discountAmount: '',
  addOns: [], includes: [], bulletPoints: [], exclusions: [], tags: [],
  cityId: '', serviceAreas: '', minGuests: '', maxGuests: '',
  availabilityType: 'derived_from_services', availableDates: [], blockedDates: [],
  images: [], videos: [],
};

function fmtPrice(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${Math.round(n / 1000)}K`;
  return `₹${n}`;
}

function getPkgTag(price: number): { label: string; color: string } {
  if (price < 20000)  return { label: 'Budget',   color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
  if (price < 75000)  return { label: 'Standard', color: 'bg-gray-700 text-gray-300 border-gray-600' };
  if (price < 200000) return { label: 'Premium',  color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
  return                     { label: 'Luxury',   color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
}

// ─── No-Service Gate ──────────────────────────────────────────────────────────

function NoServiceGate({ onCreateService, onClose }: {
  onCreateService: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-amber-500/40 rounded-2xl w-full max-w-md p-8 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-5">
          <Package2 className="h-8 w-8 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Create a Service First</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          Packages bundle multiple services together. You need at least one{' '}
          <span className="text-amber-400 font-semibold">active service</span> before creating a package.
        </p>
        <div className="rounded-xl bg-gray-800 border border-gray-700 p-4 mb-6 text-left">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Why services first?</p>
          <ul className="space-y-2 text-xs text-gray-400">
            {[
              'Packages auto-calculate pricing from your services',
              'Availability is derived from service calendars',
              'Tags and categories are inherited automatically',
            ].map((t, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-green-400 shrink-0 mt-0.5" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <button
            onClick={onCreateService}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
          >
            <Plus className="h-4 w-4" />
            Create My First Service
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 text-sm transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main export (gate + inner form) ─────────────────────────────────────────

interface Props {
  categories:     Category[];
  cities:         City[];
  activeServices: ActiveService[];
  onCreated:      (pkg: unknown) => void;
  onClose:        () => void;
  onNeedService:  () => void;
  editData?:      PackageEditData;
}

export default function PackageCreateForm({
  categories, cities, activeServices, onCreated, onClose, onNeedService, editData,
}: Props) {
  const isEdit = !!editData;

  // Gate — skip for edit mode (editing existing package always has services)
  if (!isEdit && activeServices.length === 0) {
    return <NoServiceGate onCreateService={onNeedService} onClose={onClose} />;
  }

  return (
    <PackageFormInner
      categories={categories}
      cities={cities}
      activeServices={activeServices}
      onCreated={onCreated}
      onClose={onClose}
      editData={editData}
    />
  );
}

// ─── Inner Form ───────────────────────────────────────────────────────────────

function PackageFormInner({
  categories, cities, activeServices, onCreated, onClose, editData,
}: Omit<Props, 'onNeedService'>) {
  const isEdit = !!editData;

  const [step, setStep]     = useState(1);
  const [form, setForm]     = useState<FormData>(INITIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [uploading, setUploading]           = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newAddOn, setNewAddOn]             = useState({ label: '', price: '' });
  const [newBullet, setNewBullet]           = useState('');
  const [newExclusion, setNewExclusion]     = useState('');
  const [newInclude, setNewInclude]         = useState('');
  const [newVideo, setNewVideo]             = useState('');

  // ── Seed form in edit mode ────────────────────────────────────────────────
  useEffect(() => {
    if (!editData) return;
    setForm({
      title:            editData.title ?? '',
      categoryId:       editData.categoryId ?? '',
      eventTypes:       editData.eventTypes ?? [],
      description:      editData.description ?? '',
      serviceIds:       editData.serviceIds ?? [],
      priceMode:        editData.priceMode ?? 'fixed_price',
      price:            editData.price != null ? String(editData.price) :
                        editData.finalPrice != null ? String(editData.finalPrice) : '',
      discountAmount:   editData.discountAmount != null ? String(editData.discountAmount) : '',
      addOns:           (editData.addons ?? []).map((a) => ({ label: a.label, price: String(a.price) })),
      includes:         editData.includes ?? [],
      bulletPoints:     editData.bulletPoints ?? [],
      exclusions:       editData.exclusions ?? [],
      tags:             editData.tags ?? [],
      cityId:           editData.cityId ?? '',
      serviceAreas:     Array.isArray(editData.serviceAreas) ? editData.serviceAreas.join(', ') : '',
      minGuests:        editData.minGuests != null ? String(editData.minGuests) : '',
      maxGuests:        editData.maxGuests != null ? String(editData.maxGuests) : '',
      availabilityType: editData.availabilityType ?? 'derived_from_services',
      availableDates:   editData.availableDates ?? [],
      blockedDates:     editData.blockedDates ?? [],
      images:           [],  // new uploads only; existing shown read-only below
      videos:           editData.videos ?? [],
    });
  }, [editData]);

  const set = useCallback(<K extends keyof FormData>(key: K, val: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setError('');
  }, []);

  // ── Derived pricing ───────────────────────────────────────────────────────
  const selectedServices = activeServices.filter((s) => form.serviceIds.includes(s.id));

  const serviceCostTotal = selectedServices.reduce(
    (sum, s) => sum + Number(s.basePrice ?? s.minPrice ?? 0), 0,
  );

  const finalPrice = form.priceMode === 'calculated_from_services'
    ? serviceCostTotal
    : parseFloat(form.price || '0') || 0;

  const discountAmt = form.discountAmount
    ? parseFloat(form.discountAmount)
    : Math.max(0, serviceCostTotal - finalPrice);

  const addOnTotal = form.addOns.reduce((s, a) => s + (parseFloat(a.price) || 0), 0);

  const savingsPct = serviceCostTotal > 0
    ? Math.round((discountAmt / serviceCostTotal) * 100)
    : 0;

  const pkgTag = getPkgTag(finalPrice);

  // ── Auto-derive tags from selected services ────────────────────────────────
  useEffect(() => {
    if (form.serviceIds.length > 0 && form.tags.length === 0) {
      const merged = [...new Set(selectedServices.flatMap((s) => s.tags ?? []))].slice(0, 8);
      if (merged.length) set('tags', merged);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.serviceIds]);

  // ── Image upload ──────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = '';

    setUploading(true);
    setUploadProgress(0);
    setError('');
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadApi.uploadImage(files[i], 'packages');
        urls.push(url);
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }
      set('images', [...form.images, ...urls]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // ── Step validation ───────────────────────────────────────────────────────
  const validateStep = (): string => {
    if (step === 1) {
      if (!form.title.trim()) return 'Package title is required';
      if (!form.categoryId)   return 'Please select a category';
    }
    if (step === 2) {
      if (!form.serviceIds.length) return 'Select at least one service to include';
    }
    if (step === 3) {
      if (form.priceMode === 'fixed_price' && (!form.price || parseFloat(form.price) <= 0))
        return 'Package price is required for fixed pricing';
    }
    if (step === 4) {
      if (!form.cityId) return 'Please select a city';
    }
    if (step === 5) {
      const existingCount = editData?.images?.length ?? 0;
      const totalImages   = existingCount + form.images.length;
      if (totalImages < 3) return `Please upload at least ${Math.max(0, 3 - existingCount)} more photo${3 - existingCount !== 1 ? 's' : ''} (${totalImages}/3 required)`;
    }
    return '';
  };

  const next = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setStep((s) => Math.min(s + 1, 5));
    setError('');
  };
  const back = () => { setStep((s) => Math.max(s - 1, 1)); setError(''); };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }

    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        title:        form.title.trim(),
        categoryId:   form.categoryId || undefined,
        eventTypes:   form.eventTypes,
        description:  form.description.trim(),
        serviceIds:   form.serviceIds,
        priceMode:    form.priceMode,
        price:        finalPrice,
        discountAmount: discountAmt,
        addOns:       form.addOns.map((a) => ({ label: a.label, price: parseFloat(a.price) || 0 })),
        includes:     form.includes,
        bulletPoints: form.bulletPoints,
        exclusions:   form.exclusions,
        tags:         form.tags,
        cityId:       form.cityId || undefined,
        serviceAreas: form.serviceAreas
          ? form.serviceAreas.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        minGuests:           form.minGuests   ? parseInt(form.minGuests)   : undefined,
        maxGuests:           form.maxGuests   ? parseInt(form.maxGuests)   : undefined,
        availabilityType:    form.availabilityType,
        availableDates:      form.availableDates,
        blockedDates:        form.blockedDates,
        // Edit mode: only send newly uploaded paths so backend appends without duplication
        images: isEdit ? (form.images.length > 0 ? form.images : undefined) : form.images,
        videos: form.videos,
      };

      let result: unknown;
      if (isEdit && editData?.id) {
        result = await packagesApi.update(editData.id, payload);
      } else {
        result = await packagesApi.create(payload);
      }
      onCreated(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : (e as { error?: string })?.error ?? 'Failed to save package';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-gray-900 border border-gray-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl shadow-black/60 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/80">
          <div>
            <h2 className="text-lg font-bold text-white">
              {isEdit ? 'Edit Package' : 'Create New Package'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Step {step} of {STEPS.length} — <span className="text-red-400">{STEPS[step - 1].label}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Step progress ── */}
        <div className="px-6 pt-3 pb-0 flex gap-1.5">
          {STEPS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => { if (s.id < step) setStep(s.id); }}
              className="flex-1"
            >
              <div className={`h-1.5 rounded-full transition-all ${
                s.id < step  ? 'bg-red-500' :
                s.id === step ? 'bg-red-400' :
                'bg-gray-700'
              }`} />
              <p className={`text-center text-[9px] font-bold mt-1 hidden sm:block transition-colors ${
                s.id === step ? 'text-red-400' :
                s.id < step  ? 'text-gray-500' :
                'text-gray-700'
              }`}>{s.icon} {s.label}</p>
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── STEP 1: Basic Info ── */}
          {step === 1 && (
            <>
              <Field label="Package Title *">
                <input
                  className={inputCls}
                  placeholder="e.g. Complete Wedding Photography + Decor Bundle"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  autoFocus
                />
              </Field>

              <Field label="Category *">
                <select
                  className={inputCls}
                  value={form.categoryId}
                  onChange={(e) => set('categoryId', e.target.value ? +e.target.value : '')}
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>

              <Field label="Suitable Event Types">
                <div className="flex flex-wrap gap-2 mt-1">
                  {EVENT_TYPES.map((et) => (
                    <button
                      key={et.value}
                      type="button"
                      onClick={() => {
                        const cur = form.eventTypes;
                        set('eventTypes', cur.includes(et.value)
                          ? cur.filter((x) => x !== et.value)
                          : [...cur, et.value]);
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        form.eventTypes.includes(et.value)
                          ? 'bg-red-600/80 border-red-500 text-white shadow-sm shadow-red-600/30'
                          : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {et.emoji} {et.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Package Description">
                <textarea
                  className={`${inputCls} h-28 resize-none`}
                  placeholder="Describe what customers get in this bundle, the experience, what makes it special..."
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </Field>
            </>
          )}

          {/* ── STEP 2: Services ── */}
          {step === 2 && (
            <>
              <div className="rounded-xl bg-blue-500/10 border border-blue-500/25 p-4 flex gap-3">
                <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-300">Build your bundle</p>
                  <p className="text-xs text-blue-300/70 mt-0.5">Select 1 or more services. Tags and pricing will be auto-populated from your selections.</p>
                </div>
              </div>

              <Field label={`Services Included * (${form.serviceIds.length} selected)`}>
                <div className="space-y-2 mt-1 max-h-72 overflow-y-auto pr-1">
                  {activeServices.map((svc) => {
                    const selected = form.serviceIds.includes(svc.id);
                    const price = svc.basePrice ?? svc.minPrice ?? 0;
                    const label = svc.name ?? svc.title ?? `Service #${svc.id}`;
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => {
                          set('serviceIds', selected
                            ? form.serviceIds.filter((x) => x !== svc.id)
                            : [...form.serviceIds, svc.id]);
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          selected
                            ? 'border-red-500/60 bg-red-600/10 ring-1 ring-red-500/20'
                            : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                          selected ? 'bg-red-600 border-red-500' : 'border-gray-600'
                        }`}>
                          {selected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{label}</p>
                          {svc.eventTypes && svc.eventTypes.length > 0 && (
                            <p className="text-xs text-gray-500 mt-0.5">{svc.eventTypes.join(', ')}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          {price > 0 && (
                            <p className="text-sm font-bold text-red-400">{fmtPrice(Number(price))}</p>
                          )}
                          {svc.priceType && (
                            <p className="text-[10px] text-gray-600 capitalize">{svc.priceType.replace('_', ' ')}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Field>

              {/* Auto-summary of selected services */}
              {selectedServices.length > 0 && (
                <div className="rounded-xl bg-gray-800 border border-gray-700 p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Selection Summary</p>
                  <div className="space-y-1.5">
                    {selectedServices.map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">{s.name ?? s.title}</span>
                        <span className="text-gray-400 font-medium">{fmtPrice(Number(s.basePrice ?? s.minPrice ?? 0))}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-700 pt-2 flex items-center justify-between text-sm font-bold">
                      <span className="text-white">Combined value</span>
                      <span className="text-red-400">{fmtPrice(serviceCostTotal)}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── STEP 3: Pricing ── */}
          {step === 3 && (
            <>
              <Field label="Price Mode *">
                <div className="grid grid-cols-2 gap-3 mt-1">
                  {[
                    {
                      value: 'fixed_price',
                      label: 'Fixed Price',
                      desc: 'You set the total package price',
                      icon: '🏷️',
                    },
                    {
                      value: 'calculated_from_services',
                      label: 'Auto-Calculate',
                      desc: `Sum of selected services (${fmtPrice(serviceCostTotal)})`,
                      icon: '🤖',
                    },
                  ].map((pm) => (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => set('priceMode', pm.value as PriceMode)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        form.priceMode === pm.value
                          ? 'border-red-500 bg-red-600/10 text-white ring-1 ring-red-500/20'
                          : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      <p className="text-lg mb-1">{pm.icon}</p>
                      <p className="font-semibold text-sm">{pm.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{pm.desc}</p>
                    </button>
                  ))}
                </div>
              </Field>

              {form.priceMode === 'fixed_price' && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Package Price (₹) *">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                      <input
                        className={`${inputCls} pl-6`}
                        type="number"
                        min="0"
                        placeholder="75,000"
                        value={form.price}
                        onChange={(e) => set('price', e.target.value)}
                      />
                    </div>
                  </Field>
                  <Field label="Discount (₹)" hint="optional">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                      <input
                        className={`${inputCls} pl-6`}
                        type="number"
                        min="0"
                        placeholder="5,000"
                        value={form.discountAmount}
                        onChange={(e) => set('discountAmount', e.target.value)}
                      />
                    </div>
                  </Field>
                </div>
              )}

              {/* Price breakdown */}
              {(finalPrice > 0 || serviceCostTotal > 0) && (
                <div className="rounded-xl bg-gray-800 border border-gray-700 p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-400" /> Price Breakdown
                  </p>
                  <div className="space-y-2">
                    {serviceCostTotal > 0 && (
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>Services value</span>
                        <span>{fmtPrice(serviceCostTotal)}</span>
                      </div>
                    )}
                    {addOnTotal > 0 && (
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>Add-ons</span>
                        <span>+{fmtPrice(addOnTotal)}</span>
                      </div>
                    )}
                    {discountAmt > 0 && (
                      <div className="flex justify-between text-sm text-green-400">
                        <span>Discount</span>
                        <span>−{fmtPrice(discountAmt)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-700 pt-2 flex justify-between items-center">
                      <span className="font-bold text-white">Final Price</span>
                      <div className="text-right">
                        <span className="text-lg font-bold text-red-400">{fmtPrice(finalPrice)}</span>
                        {savingsPct > 0 && (
                          <span className="ml-2 text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                            {savingsPct}% off
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {pkgTag && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${pkgTag.color}`}>
                        {pkgTag.label} Package
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Add-ons */}
              <Field label="Add-Ons" hint="optional extras customers can choose">
                <div className="flex gap-2">
                  <input
                    className={`${inputCls} flex-1`}
                    placeholder="Add-on name (e.g. Extra hour)"
                    value={newAddOn.label}
                    onChange={(e) => setNewAddOn((a) => ({ ...a, label: e.target.value }))}
                  />
                  <div className="relative w-28">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input
                      className={`${inputCls} pl-6`}
                      type="number"
                      min="0"
                      placeholder="2000"
                      value={newAddOn.price}
                      onChange={(e) => setNewAddOn((a) => ({ ...a, price: e.target.value }))}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (newAddOn.label.trim()) {
                        set('addOns', [...form.addOns, { label: newAddOn.label.trim(), price: newAddOn.price }]);
                        setNewAddOn({ label: '', price: '' });
                      }
                    }}
                    className="px-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {form.addOns.map((a, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-800 rounded-xl px-3 py-2 mt-2 border border-gray-700">
                    <span className="text-sm text-gray-300">{a.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-red-400">+{fmtPrice(parseFloat(a.price) || 0)}</span>
                      <button type="button" onClick={() => set('addOns', form.addOns.filter((_, j) => j !== i))}>
                        <X className="h-4 w-4 text-gray-500 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </Field>

              {/* What's included */}
              <BulletListField
                label="What's Included"
                hint="auto-filled from services, add custom items"
                placeholder="e.g. Full day coverage (8 hours)"
                items={form.includes}
                newVal={newInclude}
                setNewVal={setNewInclude}
                onAdd={() => {
                  if (newInclude.trim()) { set('includes', [...form.includes, newInclude.trim()]); setNewInclude(''); }
                }}
                onRemove={(i) => set('includes', form.includes.filter((_, j) => j !== i))}
                bulletIcon={<Check className="h-3.5 w-3.5 text-green-400 shrink-0" />}
              />

              {/* Highlights */}
              <BulletListField
                label="Package Highlights"
                hint="key selling points"
                placeholder="e.g. Save 20% vs booking separately"
                items={form.bulletPoints}
                newVal={newBullet}
                setNewVal={setNewBullet}
                onAdd={() => {
                  if (newBullet.trim()) { set('bulletPoints', [...form.bulletPoints, newBullet.trim()]); setNewBullet(''); }
                }}
                onRemove={(i) => set('bulletPoints', form.bulletPoints.filter((_, j) => j !== i))}
                bulletIcon={<span className="text-yellow-400 text-xs shrink-0">⭐</span>}
              />

              {/* Exclusions */}
              <BulletListField
                label="What's Not Included"
                hint="exclusions / what they need to arrange separately"
                placeholder="e.g. Travel outside Delhi NCR"
                items={form.exclusions}
                newVal={newExclusion}
                setNewVal={setNewExclusion}
                onAdd={() => {
                  if (newExclusion.trim()) { set('exclusions', [...form.exclusions, newExclusion.trim()]); setNewExclusion(''); }
                }}
                onRemove={(i) => set('exclusions', form.exclusions.filter((_, j) => j !== i))}
                bulletIcon={<X className="h-3.5 w-3.5 text-red-400 shrink-0" />}
              />

              {/* Tags */}
              <Field label="Tags">
                <div className="flex flex-wrap gap-2 min-h-[40px] bg-gray-800 rounded-xl p-2.5 border border-gray-700 focus-within:border-red-500/50 transition-colors">
                  {form.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-600/20 text-red-300 text-xs font-medium border border-red-500/20">
                      {t}
                      <button type="button" onClick={() => set('tags', form.tags.filter((x) => x !== t))}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <TagInput
                    placeholder="Type tag + Enter..."
                    onAdd={(t) => { if (!form.tags.includes(t)) set('tags', [...form.tags, t]); }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">Tags are auto-populated from your selected services</p>
              </Field>
            </>
          )}

          {/* ── STEP 4: Location & Availability ── */}
          {step === 4 && (
            <>
              <Field label="City *">
                <select
                  className={inputCls}
                  value={form.cityId}
                  onChange={(e) => set('cityId', e.target.value ? +e.target.value : '')}
                >
                  <option value="">Select your city</option>
                  {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>

              <Field label="Service Areas" hint="comma-separated">
                <input
                  className={inputCls}
                  placeholder="e.g. South Delhi, Gurgaon, Noida, Greater Noida"
                  value={form.serviceAreas}
                  onChange={(e) => set('serviceAreas', e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Min Guests">
                  <input className={inputCls} type="number" min="1" placeholder="50"
                    value={form.minGuests} onChange={(e) => set('minGuests', e.target.value)} />
                </Field>
                <Field label="Max Guests">
                  <input className={inputCls} type="number" min="1" placeholder="500"
                    value={form.maxGuests} onChange={(e) => set('maxGuests', e.target.value)} />
                </Field>
              </div>

              <Field label="Availability Type">
                <div className="grid grid-cols-2 gap-3 mt-1">
                  {[
                    { value: 'derived_from_services', label: 'Derived from Services', desc: 'Automatically uses intersection of selected service calendars', icon: '🔗' },
                    { value: 'custom',                label: 'Custom Calendar',        desc: 'Set your own available and blocked dates',                     icon: '📆' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set('availabilityType', opt.value as AvailType)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        form.availabilityType === opt.value
                          ? 'border-red-500 bg-red-600/10 text-white'
                          : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      <p className="text-xl mb-1.5">{opt.icon}</p>
                      <p className="font-semibold text-sm">{opt.label}</p>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </Field>

              {form.availabilityType === 'custom' && (
                <>
                  <DateListField
                    label="Available Dates"
                    hint="dates customers can book this package"
                    dates={form.availableDates}
                    chipClass="bg-green-500/20 text-green-400 border-green-500/30"
                    btnLabel="Add"
                    btnClass="bg-red-600 hover:bg-red-500 text-white"
                    onAdd={(d) => { if (!form.availableDates.includes(d)) set('availableDates', [...form.availableDates, d]); }}
                    onRemove={(d) => set('availableDates', form.availableDates.filter((x) => x !== d))}
                  />
                  <DateListField
                    label="Blocked Dates"
                    hint="dates you are NOT available"
                    dates={form.blockedDates}
                    chipClass="bg-red-500/20 text-red-400 border-red-500/30"
                    btnLabel="Block"
                    btnClass="bg-gray-700 hover:bg-gray-600 text-white"
                    onAdd={(d) => { if (!form.blockedDates.includes(d)) set('blockedDates', [...form.blockedDates, d]); }}
                    onRemove={(d) => set('blockedDates', form.blockedDates.filter((x) => x !== d))}
                  />
                </>
              )}
            </>
          )}

          {/* ── STEP 5: Media ── */}
          {step === 5 && (
            <>
              <Field label={`Photos * (${(editData?.images?.length ?? 0) + form.images.length} total — min 3 required)`}>
                <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  uploading
                    ? 'border-red-500/50 bg-red-500/5'
                    : 'border-gray-700 bg-gray-800/50 hover:border-red-500/50 hover:bg-red-500/5'
                }`}>
                  {uploading ? (
                    <div className="text-center">
                      <Loader2 className="h-6 w-6 text-red-400 animate-spin mx-auto mb-1" />
                      <p className="text-sm text-red-400 font-medium">Uploading... {uploadProgress}%</p>
                      <div className="w-40 h-1 bg-gray-700 rounded-full mt-2 mx-auto overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-gray-500 mb-1.5" />
                      <span className="text-sm font-medium text-gray-400">Click to upload photos</span>
                      <span className="text-xs text-gray-600 mt-0.5">JPG, PNG, WebP — max 8 MB each</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    className="hidden"
                    disabled={uploading}
                    onChange={handleImageUpload}
                  />
                </label>

                {form.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {form.images.map((img, i) => (
                      <div key={img + i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-800 group ring-1 ring-gray-700">
                        <img
                          src={img.startsWith('data:') ? img : (getImageUrl(img) ?? img)}
                          alt={`Photo ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => set('images', form.images.filter((_, j) => j !== i))}
                            className="p-1.5 rounded-full bg-red-600 text-white shadow"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {i === 0 && (
                          <span className="absolute top-1 left-1 text-[9px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded">
                            COVER
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Existing images (edit mode) — shown read-only */}
                {isEdit && editData?.images && editData.images.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 font-medium mb-1.5">Existing photos ({editData.images.length})</p>
                    <div className="grid grid-cols-4 gap-2">
                      {editData.images.map((img, i) => (
                        <div key={img + i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-800 ring-1 ring-gray-700">
                          <img src={getImageUrl(img) ?? img} alt={`Existing ${i + 1}`} className="w-full h-full object-cover opacity-80" />
                          <span className="absolute top-1 left-1 text-[9px] font-bold bg-gray-600/80 text-white px-1.5 py-0.5 rounded">saved</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-2 flex items-center gap-2">
                  <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
                  <p className="text-xs text-gray-500">All photos require admin approval before appearing in search</p>
                </div>
              </Field>

              {/* Video links */}
              <Field label="Video Links" hint="YouTube or Google Drive">
                <div className="flex gap-2">
                  <input
                    className={`${inputCls} flex-1`}
                    placeholder="https://youtube.com/..."
                    value={newVideo}
                    onChange={(e) => setNewVideo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newVideo.trim()) {
                        e.preventDefault();
                        set('videos', [...form.videos, newVideo.trim()]);
                        setNewVideo('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => { if (newVideo.trim()) { set('videos', [...form.videos, newVideo.trim()]); setNewVideo(''); } }}
                    className="px-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium"
                  >
                    Add
                  </button>
                </div>
                {form.videos.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 mt-2 bg-gray-800 rounded-xl px-3 py-2 border border-gray-700">
                    <span className="flex-1 text-xs text-gray-300 truncate">{v}</span>
                    <button type="button" onClick={() => set('videos', form.videos.filter((_, j) => j !== i))}>
                      <X className="h-4 w-4 text-gray-500 hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </Field>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between bg-gray-900/80">
          {step > 1 ? (
            <button
              type="button"
              onClick={back}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 text-sm font-medium transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all shadow-lg shadow-red-600/20"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || uploading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-lg shadow-red-600/20"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? 'Saving...' : isEdit ? 'Update Package' : 'Create Package'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/10 transition-colors';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-200 mb-1.5">
        {label}
        {hint && <span className="text-xs font-normal text-gray-500 ml-1.5">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

function BulletListField({
  label, hint, placeholder, items, newVal, setNewVal, onAdd, onRemove, bulletIcon,
}: {
  label: string;
  hint?: string;
  placeholder: string;
  items: string[];
  newVal: string;
  setNewVal: (v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  bulletIcon: React.ReactNode;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex gap-2">
        <input
          className={`${inputCls} flex-1`}
          placeholder={placeholder}
          value={newVal}
          onChange={(e) => setNewVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }}
        />
        <button
          type="button"
          onClick={onAdd}
          className="px-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {items.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2 border border-gray-700">
              {bulletIcon}
              <span className="flex-1 text-sm text-gray-300">{item}</span>
              <button type="button" onClick={() => onRemove(i)}>
                <X className="h-4 w-4 text-gray-500 hover:text-red-400" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Field>
  );
}

function DateListField({
  label, hint, dates, chipClass, btnLabel, btnClass, onAdd, onRemove,
}: {
  label: string; hint?: string; dates: string[];
  chipClass: string; btnLabel: string; btnClass: string;
  onAdd: (d: string) => void; onRemove: (d: string) => void;
}) {
  const [val, setVal] = useState('');
  return (
    <Field label={label} hint={hint}>
      <div className="flex gap-2">
        <input
          type="date"
          className={`${inputCls} flex-1`}
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <button
          type="button"
          onClick={() => { if (val) { onAdd(val); setVal(''); } }}
          className={`px-4 rounded-xl text-sm font-medium transition-all ${btnClass}`}
        >
          {btnLabel}
        </button>
      </div>
      {dates.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {dates.map((d) => (
            <span key={d} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${chipClass}`}>
              {d}
              <button type="button" onClick={() => onRemove(d)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </Field>
  );
}

function TagInput({ placeholder, onAdd }: { placeholder: string; onAdd: (tag: string) => void }) {
  const [val, setVal] = useState('');
  return (
    <input
      className="flex-1 min-w-[120px] bg-transparent text-xs text-white placeholder-gray-600 outline-none"
      placeholder={placeholder}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ',') && val.trim()) {
          e.preventDefault();
          onAdd(val.trim().replace(/,$/, ''));
          setVal('');
        }
      }}
    />
  );
}
