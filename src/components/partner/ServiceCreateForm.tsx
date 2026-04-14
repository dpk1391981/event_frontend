'use client';

/**
 * ServiceCreateForm
 *
 * 5-step multi-page form for creating OR editing a Vendor Service.
 *  Step 1 – Basic Info      (name, category, event types, descriptions)
 *  Step 2 – Pricing         (priceType, basePrice, min/max, auto price-range tag)
 *  Step 3 – Location        (city, locality, serviceAreas, guest capacity)
 *  Step 4 – Availability    (always_available / calendar_based, dates)
 *  Step 5 – Media & Tags    (real file upload to /upload/image, video URLs, tags)
 *
 * After successful creation/update → calls onCreated(service).
 */

import { useState, useCallback, useEffect } from 'react';
import {
  X, ChevronRight, ChevronLeft, Check, Upload, Plus, Trash2,
  Loader2, Info, AlertCircle, ImageIcon,
} from 'lucide-react';
import { vendorServicesApi, uploadApi } from '@/lib/api';
import { getImageUrl } from '@/lib/image-url';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventType = 'wedding' | 'birthday' | 'corporate' | 'anniversary' | 'spiritual' | 'social' | 'other';
export type PriceType = 'per_plate' | 'per_event' | 'per_hour' | 'per_day';
export type AvailType = 'always_available' | 'calendar_based';

interface Category { id: number; name: string }
interface City     { id: number; name: string }

/** Existing service data for edit mode */
export interface ServiceEditData {
  id: number;
  name?: string;
  title?: string;
  categoryId?: number;
  eventTypes?: EventType[];
  shortDescription?: string;
  detailedDescription?: string;
  priceType?: PriceType;
  basePrice?: number;
  minPrice?: number;
  maxPrice?: number;
  cityId?: number;
  locality?: string;
  serviceAreas?: string[];
  minGuests?: number;
  maxGuests?: number;
  availabilityType?: AvailType;
  availableDates?: string[];
  blockedDates?: string[];
  images?: string[];
  videos?: string[];
  tags?: string[];
  highlights?: string[];
}

interface FormData {
  name:               string;
  categoryId:         number | '';
  eventTypes:         EventType[];
  shortDescription:   string;
  detailedDescription:string;
  priceType:          PriceType;
  basePrice:          string;
  minPrice:           string;
  maxPrice:           string;
  cityId:             number | '';
  locality:           string;
  serviceAreas:       string;
  minGuests:          string;
  maxGuests:          string;
  availabilityType:   AvailType;
  availableDates:     string[];
  blockedDates:       string[];
  images:             string[];  // stored relative paths (/uploads/...)
  videos:             string[];
  tags:               string[];
  highlights:         string[];
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

const PRICE_TYPES: { value: PriceType; label: string; hint: string; icon: string }[] = [
  { value: 'per_event', label: 'Per Event',  hint: 'Fixed price for entire event', icon: '🎪' },
  { value: 'per_plate', label: 'Per Plate',  hint: 'Price per head / per plate',   icon: '🍽️' },
  { value: 'per_hour',  label: 'Per Hour',   hint: 'Hourly billing rate',          icon: '⏱️' },
  { value: 'per_day',   label: 'Per Day',    hint: 'Full day rate',                icon: '📅' },
];

const STEPS = [
  { id: 1, label: 'Basic Info',   icon: '📋' },
  { id: 2, label: 'Pricing',      icon: '💰' },
  { id: 3, label: 'Location',     icon: '📍' },
  { id: 4, label: 'Availability', icon: '📅' },
  { id: 5, label: 'Media & Tags', icon: '📸' },
];

function getPriceRangeTag(price: number): { label: string; color: string; desc: string } {
  if (price < 10000)  return { label: 'Budget',    color: 'bg-green-500/20 text-green-400 border-green-500/30',   desc: 'Below ₹10,000' };
  if (price < 75000)  return { label: 'Mid-Range', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',     desc: '₹10,000 – ₹75,000' };
  return                     { label: 'Premium',   color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', desc: 'Above ₹75,000' };
}

const INITIAL: FormData = {
  name: '', categoryId: '', eventTypes: [], shortDescription: '', detailedDescription: '',
  priceType: 'per_event', basePrice: '', minPrice: '', maxPrice: '',
  cityId: '', locality: '', serviceAreas: '', minGuests: '', maxGuests: '',
  availabilityType: 'always_available', availableDates: [], blockedDates: [],
  images: [], videos: [], tags: [], highlights: [],
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  categories:  Category[];
  cities:      City[];
  onCreated:   (service: unknown) => void;
  onClose:     () => void;
  editData?:   ServiceEditData;   // when provided → edit mode
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ServiceCreateForm({ categories, cities, onCreated, onClose, editData }: Props) {
  const isEdit = !!editData;

  const [step, setStep]                   = useState(1);
  const [form, setForm]                   = useState<FormData>(INITIAL);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [dateInput, setDateInput]         = useState({ available: '', blocked: '' });
  const [newHighlight, setNewHighlight]   = useState('');
  const [newVideo, setNewVideo]           = useState('');
  const [uploading, setUploading]         = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ── Seed form in edit mode ────────────────────────────────────────────────
  useEffect(() => {
    if (!editData) return;
    setForm({
      name:                editData.name ?? editData.title ?? '',
      categoryId:          editData.categoryId ?? '',
      eventTypes:          editData.eventTypes ?? [],
      shortDescription:    editData.shortDescription ?? '',
      detailedDescription: editData.detailedDescription ?? '',
      priceType:           editData.priceType ?? 'per_event',
      basePrice:           editData.basePrice != null ? String(editData.basePrice) : '',
      minPrice:            editData.minPrice  != null ? String(editData.minPrice)  : '',
      maxPrice:            editData.maxPrice  != null ? String(editData.maxPrice)  : '',
      cityId:              editData.cityId    ?? '',
      locality:            editData.locality  ?? '',
      serviceAreas:        Array.isArray(editData.serviceAreas) ? editData.serviceAreas.join(', ') : '',
      minGuests:           editData.minGuests != null ? String(editData.minGuests) : '',
      maxGuests:           editData.maxGuests != null ? String(editData.maxGuests) : '',
      availabilityType:    editData.availabilityType ?? 'always_available',
      availableDates:      editData.availableDates ?? [],
      blockedDates:        editData.blockedDates    ?? [],
      images:              [],   // new uploads only; existing shown read-only below
      videos:              editData.videos    ?? [],
      tags:                editData.tags      ?? [],
      highlights:          editData.highlights ?? [],
    });
  }, [editData]);

  const set = useCallback(<K extends keyof FormData>(key: K, val: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setError('');
  }, []);

  // ── Tag suggestion ────────────────────────────────────────────────────────
  const loadTagSuggestions = async () => {
    try {
      const res = await vendorServicesApi.suggestTags(
        form.categoryId || undefined,
        form.eventTypes.join(',') || undefined,
      ) as unknown as { tags: string[] };
      setSuggestedTags(res.tags ?? []);
    } catch { /* silent */ }
  };

  // ── Image upload (real file upload to backend) ────────────────────────────
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
        const url = await uploadApi.uploadImage(files[i], 'services');
        urls.push(url);
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }
      set('images', [...form.images, ...urls]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Image upload failed';
      setError(msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // ── Step validation ───────────────────────────────────────────────────────
  const validateStep = (): string => {
    if (step === 1) {
      if (!form.name.trim()) return 'Service name is required';
      if (!form.categoryId)  return 'Please select a category';
    }
    if (step === 2) {
      if (!form.basePrice)              return 'Base price is required';
      if (form.minPrice && form.maxPrice && parseFloat(form.minPrice) > parseFloat(form.maxPrice))
        return 'Min price cannot exceed max price';
    }
    if (step === 3) {
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
    if (step === 4) loadTagSuggestions();
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
        name:                form.name.trim(),
        categoryId:          form.categoryId || undefined,
        eventTypes:          form.eventTypes,
        shortDescription:    form.shortDescription.trim(),
        detailedDescription: form.detailedDescription.trim(),
        priceType:           form.priceType,
        basePrice:           form.basePrice  ? parseFloat(form.basePrice)  : undefined,
        minPrice:            form.minPrice   ? parseFloat(form.minPrice)   : undefined,
        maxPrice:            form.maxPrice   ? parseFloat(form.maxPrice)   : undefined,
        cityId:              form.cityId     || undefined,
        locality:            form.locality.trim(),
        serviceAreas:        form.serviceAreas
          ? form.serviceAreas.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        minGuests:           form.minGuests ? parseInt(form.minGuests) : undefined,
        maxGuests:           form.maxGuests ? parseInt(form.maxGuests) : undefined,
        availabilityType:    form.availabilityType,
        availableDates:      form.availableDates,
        blockedDates:        form.blockedDates,
        // In edit mode: send only newly uploaded paths so the backend appends
        // them without duplicating existing images.
        images:    isEdit ? (form.images.length > 0 ? form.images : undefined) : form.images,
        videos:    form.videos,
        tags:      form.tags,
        highlights: form.highlights,
      };

      let result: unknown;
      if (isEdit && editData?.id) {
        result = await vendorServicesApi.update(editData.id, payload);
      } else {
        result = await vendorServicesApi.create(payload);
      }
      onCreated(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : (e as { error?: string })?.error ?? 'Failed to save service';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl shadow-black/60 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/80">
          <div>
            <h2 className="text-lg font-bold text-white">
              {isEdit ? 'Edit Service' : 'Create New Service'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Step {step} of {STEPS.length} — <span className="text-red-400">{STEPS[step - 1].label}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Step progress bar ── */}
        <div className="px-6 pt-3 pb-0 flex gap-1.5">
          {STEPS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => { if (s.id < step) setStep(s.id); }}
              className="flex-1 group"
            >
              <div className={`h-1.5 rounded-full transition-all ${
                s.id < step  ? 'bg-red-500 cursor-pointer' :
                s.id === step ? 'bg-red-400' :
                'bg-gray-700'
              }`} />
              <p className={`text-center text-[9px] font-bold mt-1 transition-colors hidden sm:block ${
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
              <Field label="Service Name *">
                <input
                  className={input}
                  placeholder="e.g. Wedding Photography Full Day Package"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  autoFocus
                />
              </Field>

              <Field label="Category *">
                <select
                  className={input}
                  value={form.categoryId}
                  onChange={(e) => set('categoryId', e.target.value ? +e.target.value : '')}
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
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
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all select-none ${
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

              <Field label="Short Description" hint="shown on listing cards, max 300 chars">
                <input
                  className={input}
                  maxLength={300}
                  placeholder="e.g. Premium candid photography for your perfect wedding day"
                  value={form.shortDescription}
                  onChange={(e) => set('shortDescription', e.target.value)}
                />
                <p className="text-right text-[10px] text-gray-600 mt-1">{form.shortDescription.length}/300</p>
              </Field>

              <Field label="Detailed Description">
                <textarea
                  className={`${input} h-28 resize-none`}
                  placeholder="Describe what is included, your experience, equipment, style..."
                  value={form.detailedDescription}
                  onChange={(e) => set('detailedDescription', e.target.value)}
                />
              </Field>
            </>
          )}

          {/* ── STEP 2: Pricing ── */}
          {step === 2 && (
            <>
              <Field label="Price Type *">
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {PRICE_TYPES.map((pt) => (
                    <button
                      key={pt.value}
                      type="button"
                      onClick={() => set('priceType', pt.value)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        form.priceType === pt.value
                          ? 'border-red-500 bg-red-600/10 text-white ring-1 ring-red-500/20'
                          : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      <p className="text-base mb-0.5">{pt.icon}</p>
                      <p className="font-semibold text-sm">{pt.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{pt.hint}</p>
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Base Price (₹) *">
                  <PriceInput value={form.basePrice} onChange={(v) => set('basePrice', v)} placeholder="25,000" />
                </Field>
                <Field label="Min Price (₹)">
                  <PriceInput value={form.minPrice} onChange={(v) => set('minPrice', v)} placeholder="20,000" />
                </Field>
                <Field label="Max Price (₹)">
                  <PriceInput value={form.maxPrice} onChange={(v) => set('maxPrice', v)} placeholder="50,000" />
                </Field>
              </div>

              {form.basePrice && parseFloat(form.basePrice) > 0 && (() => {
                const tag = getPriceRangeTag(parseFloat(form.basePrice));
                return (
                  <div className="rounded-xl bg-gray-800 border border-gray-700 p-4 flex items-center gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Auto-classified as:</p>
                      <span className={`px-3 py-1.5 rounded-full text-sm font-bold border ${tag.color}`}>
                        {tag.label}
                      </span>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs text-gray-500">Range</p>
                      <p className="text-xs text-gray-400 mt-0.5">{tag.desc}</p>
                    </div>
                  </div>
                );
              })()}

              <div className="rounded-xl bg-blue-500/10 border border-blue-500/25 p-4">
                <div className="flex gap-3">
                  <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-300">Delhi NCR Market Benchmarks</p>
                    <ul className="text-xs text-blue-300/70 mt-1.5 space-y-0.5">
                      <li>• Budget: ₹5K – ₹10K &nbsp;|&nbsp; Mid-range: ₹10K – ₹75K &nbsp;|&nbsp; Premium: ₹75K+</li>
                      <li>• Set Base Price = your most common package price</li>
                      <li>• Min/Max helps AI match budget queries more accurately</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── STEP 3: Location & Capacity ── */}
          {step === 3 && (
            <>
              <Field label="City *">
                <select
                  className={input}
                  value={form.cityId}
                  onChange={(e) => set('cityId', e.target.value ? +e.target.value : '')}
                >
                  <option value="">Select your city</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Locality / Area">
                <input
                  className={input}
                  placeholder="e.g. Connaught Place, Sector 18 Noida"
                  value={form.locality}
                  onChange={(e) => set('locality', e.target.value)}
                />
              </Field>

              <Field label="Service Areas" hint="comma-separated areas you cover">
                <input
                  className={input}
                  placeholder="e.g. South Delhi, Gurgaon, Faridabad, Greater Noida"
                  value={form.serviceAreas}
                  onChange={(e) => set('serviceAreas', e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Min Guests">
                  <input className={input} type="number" min="1" placeholder="50"
                    value={form.minGuests} onChange={(e) => set('minGuests', e.target.value)} />
                </Field>
                <Field label="Max Guests">
                  <input className={input} type="number" min="1" placeholder="500"
                    value={form.maxGuests} onChange={(e) => set('maxGuests', e.target.value)} />
                </Field>
              </div>

              <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-4">
                <p className="text-xs text-amber-300 font-semibold mb-1">Why this matters</p>
                <p className="text-xs text-amber-300/70">City and guest count are key filters in AI-powered matching. Accurate data = more relevant leads.</p>
              </div>
            </>
          )}

          {/* ── STEP 4: Availability ── */}
          {step === 4 && (
            <>
              <Field label="Availability Type">
                <div className="grid grid-cols-2 gap-3 mt-1">
                  {[
                    { value: 'always_available', label: 'Always Available', desc: 'Available every day — block specific dates as needed', icon: '✅' },
                    { value: 'calendar_based',   label: 'Calendar-Based',   desc: 'Manually mark specific open dates on calendar',      icon: '📆' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set('availabilityType', opt.value as AvailType)}
                      className={`p-4 rounded-xl border text-left transition-all ${
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

              {form.availabilityType === 'calendar_based' && (
                <DateListField
                  label="Available Dates"
                  hint="dates when you accept bookings"
                  dates={form.availableDates}
                  chipClass="bg-green-500/20 text-green-400 border-green-500/30"
                  btnLabel="Add"
                  btnClass="bg-red-600 hover:bg-red-500 text-white"
                  onAdd={(d) => { if (!form.availableDates.includes(d)) set('availableDates', [...form.availableDates, d]); }}
                  onRemove={(d) => set('availableDates', form.availableDates.filter((x) => x !== d))}
                />
              )}

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

          {/* ── STEP 5: Media & Tags ── */}
          {step === 5 && (
            <>
              {/* Image upload */}
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
                        {/* Overlay with delete */}
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
                        <span className="absolute bottom-1 right-1 text-[9px] bg-black/60 text-gray-400 px-1 rounded">
                          {i + 1}
                        </span>
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
                  <p className="text-xs text-gray-500">All photos require admin approval before going live</p>
                </div>
              </Field>

              {/* Video URLs */}
              <Field label="Video Links" hint="YouTube or Google Drive links">
                <div className="flex gap-2">
                  <input
                    className={`${input} flex-1`}
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
                    className="px-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-all"
                  >
                    Add
                  </button>
                </div>
                {form.videos.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 mt-2 bg-gray-800 rounded-xl px-3 py-2">
                    <span className="flex-1 text-xs text-gray-300 truncate">{v}</span>
                    <button type="button" onClick={() => set('videos', form.videos.filter((_, j) => j !== i))}>
                      <X className="h-4 w-4 text-gray-500 hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </Field>

              {/* Tags */}
              <Field label="Tags">
                {suggestedTags.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
                      <span className="text-yellow-400">✨</span> AI-suggested — click to add:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedTags.filter((t) => !form.tags.includes(t)).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => set('tags', [...form.tags, t])}
                          className="px-2.5 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-300 text-xs hover:border-red-500/50 hover:text-white transition-all"
                        >
                          + {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                    placeholder="Type tag and press Enter..."
                    onAdd={(t) => { if (!form.tags.includes(t)) set('tags', [...form.tags, t]); }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">Tags help AI and search match your service to the right customers</p>
              </Field>

              {/* Highlights */}
              <Field label="Key Highlights" hint="what makes this service stand out">
                <div className="flex gap-2">
                  <input
                    className={`${input} flex-1`}
                    placeholder="e.g. 100+ edited photos delivered in 7 days"
                    value={newHighlight}
                    onChange={(e) => setNewHighlight(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newHighlight.trim()) {
                        e.preventDefault();
                        set('highlights', [...form.highlights, newHighlight.trim()]);
                        setNewHighlight('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newHighlight.trim()) {
                        set('highlights', [...form.highlights, newHighlight.trim()]);
                        setNewHighlight('');
                      }
                    }}
                    className="px-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-all"
                  >
                    Add
                  </button>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {form.highlights.map((h, i) => (
                    <li key={i} className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2 border border-gray-700">
                      <Check className="h-3.5 w-3.5 text-green-400 shrink-0" />
                      <span className="flex-1 text-sm text-gray-300">{h}</span>
                      <button type="button" onClick={() => set('highlights', form.highlights.filter((_, j) => j !== i))}>
                        <X className="h-4 w-4 text-gray-500 hover:text-red-400" />
                      </button>
                    </li>
                  ))}
                </ul>
              </Field>
            </>
          )}

          {/* ── Error ── */}
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
              {saving ? 'Saving...' : isEdit ? 'Update Service' : 'Create Service'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const input = 'w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/10 transition-colors';

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

function PriceInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
      <input
        className={`${input} pl-6`}
        type="number"
        min="0"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
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
          className={`${input} flex-1`}
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
