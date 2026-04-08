'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  locationsApi, categoriesApi, vendorsApi, tokensApi,
  vendorEventsApi, uploadApi,
} from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import type { City, Locality, Category, Vendor, TokenWallet } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1
  categorySlug: string;
  title: string;
  // Step 2
  images: string[];           // base64 data URLs
  coverIndex: number;
  // Step 3
  citySlug: string;
  localitySlug: string;
  address: string;
  // Step 4
  eventDate: string;
  eventEndDate: string;
  isMultiDay: boolean;
  // Step 5
  expectedGuests: string;
  budgetRange: string;
  servicesNeeded: string[];   // category slugs
  // Step 6
  isFree: boolean;
  price: string;
  ticketUrl: string;
  // Step 7
  organizerName: string;
  organizerPhone: string;
  organizerEmail: string;
  // Step 8
  metaTitle: string;
  metaDescription: string;
}

const INITIAL_FORM: FormData = {
  categorySlug: '', title: '',
  images: [], coverIndex: 0,
  citySlug: '', localitySlug: '', address: '',
  eventDate: '', eventEndDate: '', isMultiDay: false,
  expectedGuests: '', budgetRange: '', servicesNeeded: [],
  isFree: true, price: '', ticketUrl: '',
  organizerName: '', organizerPhone: '', organizerEmail: '',
  metaTitle: '', metaDescription: '',
};

const DRAFT_KEY = 'eh-event-draft';

const BUDGET_PRESETS = [
  { label: '₹50K', value: '50k' },
  { label: '₹2L',  value: '2l'  },
  { label: '₹5L',  value: '5l'  },
  { label: '₹10L', value: '10l' },
  { label: '₹20L+', value: '20l+' },
];

const STEP_LABELS = [
  { id: 1, icon: '🎪', label: 'Event Type'  },
  { id: 2, icon: '📸', label: 'Media'       },
  { id: 3, icon: '📍', label: 'Location'    },
  { id: 4, icon: '📅', label: 'Date & Time' },
  { id: 5, icon: '📋', label: 'Details'     },
  { id: 6, icon: '💰', label: 'Pricing'     },
  { id: 7, icon: '👤', label: 'Organizer'   },
  { id: 8, icon: '🔍', label: 'SEO'         },
  { id: 9, icon: '✅', label: 'Review'      },
];

const TOTAL_STEPS = STEP_LABELS.length;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function autoTitle(categoryName: string, cityName: string, year = new Date().getFullYear()) {
  if (!categoryName) return '';
  return `${categoryName} ${cityName ? `in ${cityName} ` : ''}${year}`;
}

function autoMeta(form: FormData, categoryName: string, cityName: string) {
  const title = form.title || autoTitle(categoryName, cityName);
  const metaTitle = title.length > 60 ? title.slice(0, 57) + '...' : title;
  const desc = form.address
    ? `${title} at ${form.address}, ${cityName}. Book your spot now.`
    : `${title}${cityName ? ` in ${cityName}` : ''}. Don't miss this event — register today!`;
  return { metaTitle, metaDescription: desc.slice(0, 160) };
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  const pct = Math.round(((current - 1) / (total - 1)) * 100);
  return (
    <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-500">
            Step {current} of {total} · {STEP_LABELS[current - 1]?.label}
          </span>
          <span className="text-xs text-gray-400">~{Math.max(1, Math.ceil((total - current) * 0.2))} min left</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-rose-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {/* Mobile step dots */}
        <div className="flex gap-1 mt-2 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-0.5">
          {STEP_LABELS.map((s) => (
            <div
              key={s.id}
              className={`shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                s.id === current
                  ? 'bg-red-100 text-red-700'
                  : s.id < current
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-300'
              }`}
            >
              {s.id < current ? '✓' : s.icon} {s.id === current && s.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Save Indicator ───────────────────────────────────────────────────────────

function SaveIndicator({ savedAt }: { savedAt: Date | null }) {
  if (!savedAt) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-green-600 font-semibold">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      Saved
    </span>
  );
}

// ─── Step 1: Event Type & Title ───────────────────────────────────────────────

function Step1({
  form, eventCategories, loading,
  onChange,
}: {
  form: FormData;
  eventCategories: Category[];
  loading: boolean;
  onChange: (patch: Partial<FormData>) => void;
}) {
  const selected = eventCategories.find(c => c.slug === form.categorySlug);

  const handleCategorySelect = (cat: Category) => {
    const suggested = autoTitle(cat.name, '');
    onChange({ categorySlug: cat.slug, title: form.title || suggested });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900 mb-1">What type of event is this?</h2>
        <p className="text-sm text-gray-500">Pick a category — we&apos;ll tailor the rest to match</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {eventCategories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => handleCategorySelect(cat)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition text-center ${
                form.categorySlug === cat.slug
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-red-300 hover:bg-red-50'
              }`}
            >
              <span className="text-2xl">{cat.icon || '🎪'}</span>
              <span className="text-sm font-bold leading-tight">{cat.name}</span>
            </button>
          ))}
        </div>
      )}

      {form.categorySlug && (
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">
            Event Title
            <span className="ml-1 text-xs font-normal text-gray-400">— be specific, it helps SEO</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder={selected ? `e.g. Grand ${selected.name} Expo 2026` : 'Enter event title'}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
          {selected && !form.title && (
            <div className="flex flex-wrap gap-1.5">
              {[
                `Grand ${selected.name} Expo 2026`,
                `${selected.name} Showcase — Delhi NCR`,
                `Premium ${selected.name} Experience`,
              ].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChange({ title: s })}
                  className="text-xs border border-dashed border-red-300 text-red-600 px-3 py-1.5 rounded-full hover:bg-red-50 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400">{form.title.length}/80 characters</p>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Media ────────────────────────────────────────────────────────────

function Step2({
  form, onChange,
}: {
  form: FormData;
  onChange: (patch: Partial<FormData>) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const dropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    const newImages: string[] = [...form.images];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      try {
        const b64 = await uploadApi.compressToBase64(file);
        newImages.push(b64);
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      } catch { /* skip failed */ }
    }
    onChange({ images: newImages });
    setUploading(false);
    setUploadProgress(0);
  };

  const removeImage = (idx: number) => {
    const imgs = form.images.filter((_, i) => i !== idx);
    onChange({ images: imgs, coverIndex: Math.min(form.coverIndex, Math.max(0, imgs.length - 1)) });
  };

  const setCover = (idx: number) => onChange({ coverIndex: idx });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dropRef.current?.classList.remove('border-red-400', 'bg-red-50');
    processFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900 mb-1">Add photos of your event</h2>
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <span>📈</span>
          <span className="font-semibold">Events with photos get 3× more leads</span>
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={dropRef}
        onDragOver={(e) => { e.preventDefault(); dropRef.current?.classList.add('border-red-400', 'bg-red-50'); }}
        onDragLeave={() => dropRef.current?.classList.remove('border-red-400', 'bg-red-50')}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-red-400 hover:bg-red-50 transition"
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
        />
        {uploading ? (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full border-4 border-red-100 border-t-red-500 animate-spin mx-auto" />
            <p className="text-sm font-bold text-red-600">Uploading {uploadProgress}%</p>
            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">📸</div>
            <p className="font-bold text-gray-700">Drag & drop or <span className="text-red-600">browse photos</span></p>
            <p className="text-xs text-gray-400">JPG, PNG, WebP · Up to 10 photos · Auto-compressed</p>
          </div>
        )}
      </div>

      {/* Image grid */}
      {form.images.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            {form.images.length} photo{form.images.length !== 1 ? 's' : ''} · Tap to set cover
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {form.images.map((src, idx) => (
              <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border-2 transition cursor-pointer"
                style={{ borderColor: idx === form.coverIndex ? '#ef4444' : 'transparent' }}
                onClick={() => setCover(idx)}
              >
                <Image src={src} alt={`Event photo ${idx + 1}`} fill className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCover(idx); }}
                    className="text-[10px] font-bold text-white bg-red-500 rounded-lg px-2 py-1"
                  >
                    Cover
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                    className="text-[10px] font-bold text-white bg-gray-900/80 rounded-lg px-2 py-1"
                  >
                    Remove
                  </button>
                </div>
                {idx === form.coverIndex && (
                  <span className="absolute top-1.5 left-1.5 text-[9px] font-extrabold bg-red-500 text-white px-1.5 py-0.5 rounded-md">
                    COVER
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {form.images.length === 0 && (
        <p className="text-xs text-center text-red-500 font-semibold">At least 1 photo is required to publish</p>
      )}
    </div>
  );
}

// ─── Step 3: Location ─────────────────────────────────────────────────────────

function Step3({
  form, cities, localities, loadingLocalities,
  onChange, onCityChange,
}: {
  form: FormData;
  cities: City[];
  localities: Locality[];
  loadingLocalities: boolean;
  onChange: (patch: Partial<FormData>) => void;
  onCityChange: (citySlug: string) => void;
}) {
  const [citySearch, setCitySearch] = useState('');
  const selectedCity = cities.find(c => c.slug === form.citySlug);
  const filteredCities = cities.filter(c =>
    !citySearch || c.name.toLowerCase().includes(citySearch.toLowerCase())
  );
  const seoPreview = form.citySlug
    ? `your-event-in-${form.citySlug}${form.localitySlug ? `-${form.localitySlug}` : ''}`
    : 'your-event-in-[city]';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900 mb-1">Where is your event?</h2>
        <p className="text-sm text-gray-500">Location helps us match attendees and improves SEO</p>
      </div>

      {/* City */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-700">City <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={citySearch || selectedCity?.name || ''}
          onChange={(e) => setCitySearch(e.target.value)}
          onFocus={() => setCitySearch('')}
          placeholder="Search city..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
        />
        {citySearch && (
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-lg max-h-48 overflow-y-auto">
            {filteredCities.map(c => (
              <button
                key={c.slug}
                type="button"
                onClick={() => { onCityChange(c.slug); setCitySearch(''); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-red-50 transition"
              >
                <span className="text-red-400">📍</span>
                <span className="font-medium">{c.name}</span>
                {c.state && <span className="text-xs text-gray-400 ml-auto">{c.state}</span>}
              </button>
            ))}
            {filteredCities.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-400">No cities found</p>
            )}
          </div>
        )}
      </div>

      {/* Locality */}
      {form.citySlug && (
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">Locality / Area</label>
          {loadingLocalities ? (
            <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <select
              value={form.localitySlug}
              onChange={(e) => onChange({ localitySlug: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 bg-white"
            >
              <option value="">Select locality (optional)</option>
              {localities.map(l => (
                <option key={l.slug} value={l.slug}>{l.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Address */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-700">Venue / Address</label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder="e.g. The Grand Hall, Sector 18, Noida"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
        />
      </div>

      {/* SEO preview */}
      {form.citySlug && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">SEO URL Preview</p>
          <p className="text-sm font-mono text-blue-600 break-all">plantoday.in/{seoPreview}</p>
        </div>
      )}
    </div>
  );
}

// ─── Step 4: Date & Time ──────────────────────────────────────────────────────

function Step4({ form, onChange }: { form: FormData; onChange: (patch: Partial<FormData>) => void }) {
  const today = new Date().toISOString().split('T')[0];

  const dateLabel = form.eventDate
    ? new Date(form.eventDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900 mb-1">When is your event?</h2>
        <p className="text-sm text-gray-500">Single day or multi-day — we handle both</p>
      </div>

      {/* Multi-day toggle */}
      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
        <button
          type="button"
          onClick={() => onChange({ isMultiDay: false, eventEndDate: '' })}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${!form.isMultiDay ? 'bg-white shadow text-gray-900' : 'text-gray-400'}`}
        >
          Single Day
        </button>
        <button
          type="button"
          onClick={() => onChange({ isMultiDay: true })}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${form.isMultiDay ? 'bg-white shadow text-gray-900' : 'text-gray-400'}`}
        >
          Multi-Day
        </button>
      </div>

      {/* Start date */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-700">
          {form.isMultiDay ? 'Start Date' : 'Event Date'} <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={form.eventDate}
          min={today}
          onChange={(e) => onChange({ eventDate: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
        />
      </div>

      {/* End date (multi-day) */}
      {form.isMultiDay && (
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">End Date</label>
          <input
            type="date"
            value={form.eventEndDate}
            min={form.eventDate || today}
            onChange={(e) => onChange({ eventEndDate: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
        </div>
      )}

      {/* Preview */}
      {dateLabel && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <span className="text-2xl">📅</span>
          <div>
            <p className="text-sm font-extrabold text-gray-900">{dateLabel}</p>
            {form.isMultiDay && form.eventEndDate && (
              <p className="text-xs text-gray-500 mt-0.5">
                to {new Date(form.eventEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
            <p className="text-xs text-green-600 font-semibold mt-0.5">Upcoming Event</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 5: Event Details ────────────────────────────────────────────────────

function Step5({
  form, serviceCategories, loading,
  onChange,
}: {
  form: FormData;
  serviceCategories: Category[];
  loading: boolean;
  onChange: (patch: Partial<FormData>) => void;
}) {
  const toggleService = (slug: string) => {
    const list = form.servicesNeeded.includes(slug)
      ? form.servicesNeeded.filter(s => s !== slug)
      : [...form.servicesNeeded, slug];
    onChange({ servicesNeeded: list });
  };

  const GUEST_PRESETS = ['Under 50', '50–100', '100–300', '300–500', '500+'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900 mb-1">Event Details</h2>
        <p className="text-sm text-gray-500">This feeds our AI to find the best vendors for you</p>
      </div>

      {/* Expected guests */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-700">Expected Guests</label>
        <div className="flex flex-wrap gap-2">
          {GUEST_PRESETS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => onChange({ expectedGuests: p })}
              className={`px-4 py-2 rounded-xl border text-sm font-semibold transition ${
                form.expectedGuests === p
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-red-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={form.expectedGuests}
          onChange={(e) => onChange({ expectedGuests: e.target.value })}
          placeholder="Or type exact number..."
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 mt-1"
        />
      </div>

      {/* Budget range */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-700">Event Budget</label>
        <div className="flex flex-wrap gap-2">
          {BUDGET_PRESETS.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange({ budgetRange: p.value })}
              className={`px-4 py-2 rounded-xl border text-sm font-semibold transition ${
                form.budgetRange === p.value
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-red-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Services needed */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-700">
          Services Needed
          <span className="ml-1 text-xs font-normal text-gray-400">— helps us match vendors</span>
        </label>
        {loading ? (
          <div className="flex flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-9 w-28 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {serviceCategories.map(cat => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => toggleService(cat.slug)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition ${
                  form.servicesNeeded.includes(cat.slug)
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-red-300'
                }`}
              >
                <span>{cat.icon || '⚡'}</span>
                {cat.name}
                {form.servicesNeeded.includes(cat.slug) && (
                  <span className="text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 6: Pricing ──────────────────────────────────────────────────────────

function Step6({ form, onChange }: { form: FormData; onChange: (patch: Partial<FormData>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900 mb-1">Ticket Pricing</h2>
        <p className="text-sm text-gray-500">Free or paid? We support both</p>
      </div>

      {/* Toggle */}
      <div className="flex gap-3 bg-gray-50 border border-gray-200 rounded-xl p-2">
        <button
          type="button"
          onClick={() => onChange({ isFree: true, price: '', ticketUrl: '' })}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${form.isFree ? 'bg-white shadow text-gray-900' : 'text-gray-400'}`}
        >
          🆓 Free Event
        </button>
        <button
          type="button"
          onClick={() => onChange({ isFree: false })}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${!form.isFree ? 'bg-white shadow text-gray-900' : 'text-gray-400'}`}
        >
          🎫 Paid Event
        </button>
      </div>

      {!form.isFree && (
        <div className="space-y-4 bg-gray-50 rounded-2xl p-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 font-medium">
            💡 ₹499–₹999 works best for similar events in your category
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">Ticket Price (₹)</label>
            <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden">
              <span className="px-3 py-3 text-sm font-bold text-gray-500 bg-gray-50 border-r border-gray-200">₹</span>
              <input
                type="number"
                value={form.price}
                onChange={(e) => onChange({ price: e.target.value })}
                placeholder="e.g. 499"
                min="0"
                className="flex-1 px-4 py-3 text-sm outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">Ticket / Registration URL (optional)</label>
            <input
              type="url"
              value={form.ticketUrl}
              onChange={(e) => onChange({ ticketUrl: e.target.value })}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 bg-white"
            />
          </div>
        </div>
      )}

      {form.isFree && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="text-sm font-bold text-green-800">Great choice!</p>
            <p className="text-xs text-green-600">Free events get significantly more registrations</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 7: Organizer ────────────────────────────────────────────────────────

function Step7({ form, onChange }: { form: FormData; onChange: (patch: Partial<FormData>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900 mb-1">Organizer Details</h2>
        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
          <span>✓</span>
          <span className="font-semibold">Auto-filled from your profile</span>
          <span className="text-blue-400 text-xs ml-auto">Editable</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">Organizer Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.organizerName}
            onChange={(e) => onChange({ organizerName: e.target.value })}
            placeholder="Your business / name"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">Phone</label>
          <input
            type="tel"
            value={form.organizerPhone}
            onChange={(e) => onChange({ organizerPhone: e.target.value })}
            placeholder="+91 98765 43210"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">Email</label>
          <input
            type="email"
            value={form.organizerEmail}
            onChange={(e) => onChange({ organizerEmail: e.target.value })}
            placeholder="hello@yourevent.com"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
        </div>
      </div>

      {form.organizerName && (
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center font-extrabold text-lg">
            {form.organizerName[0]?.toUpperCase()}
          </span>
          <div>
            <p className="text-sm font-bold text-gray-900">{form.organizerName}</p>
            <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Verified Organizer
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 8: SEO ──────────────────────────────────────────────────────────────

function Step8({ form, onChange }: { form: FormData; onChange: (patch: Partial<FormData>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900 mb-1">SEO & Discovery</h2>
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          <span>🔍</span>
          <span className="font-semibold">Auto-generated · helps your event rank on Google</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">
            SEO Title
            <span className="ml-1 text-xs font-normal text-gray-400">{form.metaTitle.length}/60</span>
          </label>
          <input
            type="text"
            value={form.metaTitle}
            onChange={(e) => onChange({ metaTitle: e.target.value })}
            placeholder="Event title for search engines..."
            maxLength={60}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">
            SEO Description
            <span className="ml-1 text-xs font-normal text-gray-400">{form.metaDescription.length}/160</span>
          </label>
          <textarea
            value={form.metaDescription}
            onChange={(e) => onChange({ metaDescription: e.target.value })}
            rows={3}
            maxLength={160}
            placeholder="Brief description for Google search results..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none"
          />
        </div>
      </div>

      {/* Google preview */}
      {form.metaTitle && (
        <div className="border border-gray-200 rounded-xl p-4 bg-white">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Google Preview</p>
          <div className="space-y-0.5">
            <p className="text-xs text-green-700">plantoday.in › events</p>
            <p className="text-base font-semibold text-blue-700 hover:underline cursor-pointer leading-tight">
              {form.metaTitle}
            </p>
            <p className="text-xs text-gray-600 leading-snug">
              {form.metaDescription || 'No description yet — add one above for better click-through rates.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 9: Review + Preview ─────────────────────────────────────────────────

function Step9({
  form, eventCategories, cities, wallet, tokenCost,
  onSaveDraft, onSubmit, submitting, submitError,
}: {
  form: FormData;
  eventCategories: Category[];
  cities: City[];
  wallet: TokenWallet | null;
  tokenCost: number;
  onSaveDraft: () => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string;
}) {
  const category = eventCategories.find(c => c.slug === form.categorySlug);
  const city = cities.find(c => c.slug === form.citySlug);
  const hasEnoughTokens = wallet ? wallet.balance >= tokenCost : true;

  const checks = [
    { label: 'Event type selected',      done: !!form.categorySlug },
    { label: 'Title added',              done: !!form.title        },
    { label: 'At least 1 photo',         done: form.images.length > 0 },
    { label: 'Location set',             done: !!form.citySlug     },
    { label: 'Date set',                 done: !!form.eventDate    },
    { label: 'Organizer name',           done: !!form.organizerName },
  ];
  const quality = Math.round((checks.filter(c => c.done).length / checks.length) * 100);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900 mb-1">Review Your Event</h2>
        <p className="text-sm text-gray-500">Check everything before submitting for approval</p>
      </div>

      {/* Preview card */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {form.images[form.coverIndex] ? (
          <div className="relative h-48 sm:h-56">
            <Image
              src={form.images[form.coverIndex]}
              alt="Event cover"
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-md">
                {category?.name || 'Event'}
              </span>
              <h3 className="text-white font-extrabold text-lg leading-tight mt-1">{form.title}</h3>
            </div>
          </div>
        ) : (
          <div className="h-28 bg-gradient-to-br from-red-100 to-rose-50 flex items-center justify-center">
            <span className="text-4xl">{category?.icon || '🎪'}</span>
          </div>
        )}

        <div className="p-4 space-y-2">
          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
            {form.eventDate && (
              <span className="flex items-center gap-1">
                📅 {new Date(form.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
            {city && (
              <span className="flex items-center gap-1">📍 {city.name}</span>
            )}
            <span className="flex items-center gap-1">
              {form.isFree ? '🆓 Free' : form.price ? `🎫 ₹${Number(form.price).toLocaleString('en-IN')}` : '🎫 Paid'}
            </span>
          </div>
          {form.organizerName && (
            <p className="text-xs text-gray-500">By <span className="font-semibold text-gray-700">{form.organizerName}</span></p>
          )}
        </div>
      </div>

      {/* Quality checklist */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-700">Listing Quality</p>
          <span className={`text-sm font-extrabold ${quality === 100 ? 'text-green-600' : quality >= 70 ? 'text-amber-600' : 'text-red-500'}`}>
            {quality}%
          </span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${quality === 100 ? 'bg-green-500' : quality >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${quality}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {checks.map(c => (
            <div key={c.label} className={`flex items-center gap-1.5 text-xs font-medium ${c.done ? 'text-green-700' : 'text-gray-400'}`}>
              <span>{c.done ? '✓' : '○'}</span>
              {c.label}
            </div>
          ))}
        </div>
      </div>

      {/* Token section */}
      {wallet !== null && (
        <div className={`rounded-2xl border p-4 space-y-3 ${hasEnoughTokens ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">Publishing Cost</p>
              <p className="text-xs text-gray-500">Your current balance</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold text-gray-900">{tokenCost} tokens</p>
              <p className={`text-xs font-semibold ${hasEnoughTokens ? 'text-green-600' : 'text-red-500'}`}>
                Balance: {wallet.balance} tokens
              </p>
            </div>
          </div>
          {!hasEnoughTokens && (
            <div className="flex items-center gap-2 text-xs text-red-700 font-semibold">
              ⚠ Insufficient tokens.
              <Link href="/partner/dashboard" className="underline">Request more →</Link>
            </div>
          )}
          {hasEnoughTokens && (
            <div className="text-xs text-gray-500">
              After publishing: <span className="font-semibold text-gray-700">{wallet.balance - tokenCost} tokens remaining</span>
            </div>
          )}
        </div>
      )}

      {/* Boost upsell */}
      <div className="border border-dashed border-purple-300 bg-purple-50 rounded-2xl p-4 flex items-center gap-3">
        <span className="text-2xl">🚀</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-purple-900">Boost this event</p>
          <p className="text-xs text-purple-600">3× more visibility · Available after approval</p>
        </div>
        <span className="text-xs font-bold text-purple-700 shrink-0">10 tokens</span>
      </div>

      {/* Admin note */}
      <div className="flex items-start gap-2 text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
        <span>ℹ️</span>
        <span>Your event will be reviewed within 24 hours. High-quality listings get approved faster.</span>
      </div>

      {/* Error */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {submitError}
        </div>
      )}

      {/* CTAs */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onSaveDraft}
          className="flex-1 border border-gray-300 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-50 text-sm transition"
        >
          Save Draft
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || !hasEnoughTokens}
          className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold py-3.5 rounded-xl hover:from-red-700 hover:to-rose-700 disabled:opacity-50 text-sm transition shadow-md shadow-red-200"
        >
          {submitting ? 'Submitting...' : 'Submit for Approval →'}
        </button>
      </div>
    </div>
  );
}

// ─── Submitted State ──────────────────────────────────────────────────────────

function SubmittedScreen({ onCreateAnother }: { onCreateAnother: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-5">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl">
        🎉
      </div>
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Event Submitted!</h2>
        <p className="text-gray-500 text-sm max-w-xs mx-auto">
          Your event is under review. You&apos;ll be notified within 24 hours once it&apos;s live.
        </p>
      </div>
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <span>⏳</span>
        <span className="text-sm text-amber-700 font-semibold">Status: Under Review</span>
      </div>
      <div className="flex gap-3 w-full max-w-xs">
        <Link
          href="/partner/dashboard"
          className="flex-1 border border-gray-300 text-gray-700 font-bold py-3 rounded-xl text-sm text-center hover:bg-gray-50"
        >
          View Dashboard
        </Link>
        <button
          onClick={onCreateAnother}
          className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl text-sm hover:bg-red-700"
        >
          Post Another
        </button>
      </div>
    </div>
  );
}

// ─── Main Event Creator ────────────────────────────────────────────────────────

function EventCreator() {
  const router = useRouter();
  const { user } = useAppStore();

  // ── Remote data ──
  const [eventCategories, setEventCategories]     = useState<Category[]>([]);
  const [serviceCategories, setServiceCategories] = useState<Category[]>([]);
  const [cities, setCities]                       = useState<City[]>([]);
  const [localities, setLocalities]               = useState<Locality[]>([]);
  const [loadingLocalities, setLoadingLocalities] = useState(false);
  const [vendor, setVendor]                       = useState<Vendor | null>(null);
  const [wallet, setWallet]                       = useState<TokenWallet | null>(null);
  const [tokenCost, setTokenCost]                 = useState(100); // default; overridden by error msg

  // ── UI state ──
  const [step, setStep]       = useState(1);
  const [form, setForm]       = useState<FormData>(INITIAL_FORM);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted]     = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Auth + data load ──
  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'vendor' && user.role !== 'admin' && user.role !== 'super_admin') {
      router.push('/partner/onboard');
      return;
    }

    const load = async () => {
      try {
        const [evCats, svcCats, cityList] = await Promise.all([
          categoriesApi.getAll('event') as Promise<unknown>,
          categoriesApi.getAll('service') as Promise<unknown>,
          locationsApi.getCities() as Promise<unknown>,
        ]);
        setEventCategories(evCats as Category[]);
        setServiceCategories(svcCats as Category[]);
        setCities(cityList as City[]);

        // Vendor profile + wallet
        if (user.vendorId || user.role === 'vendor') {
          try {
            const v = await vendorsApi.getMyProfile() as unknown as Vendor;
            setVendor(v);
            // Pre-fill organizer from profile
            setForm(prev => ({
              ...prev,
              organizerName:  v.businessName || '',
              organizerPhone: v.phone || '',
              organizerEmail: v.email || '',
            }));
            // Token wallet
            const vid = v.id;
            const w = await tokensApi.getWallet(vid) as unknown as TokenWallet;
            setWallet(w);
          } catch { /* vendor profile not required to view form */ }
        }
      } catch { /* silently fail */ } finally {
        setDataLoading(false);
      }
    };

    load();

    // Restore draft
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft) as FormData;
        setForm(parsed);
      }
    } catch { /* ignore */ }
  }, [user, router]);

  // ── Auto-save (debounced 800ms) ──
  const autosave = useCallback((data: FormData) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        setSavedAt(new Date());
      } catch { /* ignore */ }
    }, 800);
  }, []);

  const updateForm = useCallback((patch: Partial<FormData>) => {
    setForm(prev => {
      const next = { ...prev, ...patch };
      autosave(next);
      return next;
    });
  }, [autosave]);

  // ── Auto-generate SEO when arriving at step 8 ──
  useEffect(() => {
    if (step === 8) {
      const catName = eventCategories.find(c => c.slug === form.categorySlug)?.name || '';
      const cityName = cities.find(c => c.slug === form.citySlug)?.name || '';
      if (!form.metaTitle || !form.metaDescription) {
        const meta = autoMeta(form, catName, cityName);
        updateForm({
          metaTitle:       form.metaTitle       || meta.metaTitle,
          metaDescription: form.metaDescription || meta.metaDescription,
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ── City change (fetch localities) ──
  const handleCityChange = useCallback(async (citySlug: string) => {
    updateForm({ citySlug, localitySlug: '' });
    setLocalities([]);
    if (!citySlug) return;
    const city = cities.find(c => c.slug === citySlug);
    if (!city) return;
    setLoadingLocalities(true);
    try {
      const locs = await locationsApi.getLocalities(city.id) as unknown as Locality[];
      setLocalities(locs);
    } catch { /* ignore */ } finally {
      setLoadingLocalities(false);
    }
  }, [cities, updateForm]);

  // ── Step validation ──
  const canAdvance = useCallback((): boolean => {
    switch (step) {
      case 1: return !!form.categorySlug && form.title.trim().length >= 3;
      case 2: return form.images.length >= 1;
      case 3: return !!form.citySlug;
      case 4: return !!form.eventDate;
      case 5: return true; // optional
      case 6: return true; // optional
      case 7: return !!form.organizerName.trim();
      case 8: return true;
      default: return true;
    }
  }, [step, form]);

  const errorHint = useCallback((): string => {
    switch (step) {
      case 1: return !form.categorySlug ? 'Select an event type' : 'Add a title (min 3 characters)';
      case 2: return 'Add at least 1 photo';
      case 3: return 'Select a city';
      case 4: return 'Set an event date';
      case 7: return 'Enter organizer name';
      default: return '';
    }
  }, [step, form]);

  const next = () => {
    if (!canAdvance()) return;
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const back = () => {
    setStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Save draft ──
  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      setSavedAt(new Date());
      alert('Draft saved! You can continue anytime.');
    } catch { /* ignore */ }
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!vendor) {
      setSubmitError('Vendor profile required. Please complete your profile first.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');

    const payload = {
      title:           form.title,
      categorySlug:    form.categorySlug,
      citySlug:        form.citySlug,
      localitySlug:    form.localitySlug || undefined,
      address:         form.address || undefined,
      eventDate:       form.eventDate || undefined,
      eventEndDate:    form.isMultiDay && form.eventEndDate ? form.eventEndDate : undefined,
      price:           !form.isFree && form.price ? Number(form.price) : undefined,
      priceUnit:       !form.isFree ? 'per person' : undefined,
      images:          form.images,
      metaTitle:       form.metaTitle || undefined,
      metaDescription: form.metaDescription || undefined,
      fieldData: {
        expectedGuests:  form.expectedGuests  || undefined,
        budgetRange:     form.budgetRange     || undefined,
        servicesNeeded:  form.servicesNeeded.length ? form.servicesNeeded : undefined,
        organizerName:   form.organizerName   || undefined,
        organizerPhone:  form.organizerPhone  || undefined,
        organizerEmail:  form.organizerEmail  || undefined,
        ticketUrl:       form.ticketUrl       || undefined,
        isMultiDay:      form.isMultiDay,
      },
    };

    try {
      await vendorEventsApi.create(vendor.id, payload);
      localStorage.removeItem(DRAFT_KEY);
      setSubmitted(true);
    } catch (err: unknown) {
      const e = err as { message?: string };
      const msg = e.message || 'Failed to submit. Please try again.';
      setSubmitError(msg);
      // Extract token cost from error message if possible
      const match = msg.match(/costs (\d+) tokens/);
      if (match) setTokenCost(Number(match[1]));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Auth loading ──
  if (!user) return null;

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-4 border-red-100 border-t-red-500 animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <SubmittedScreen onCreateAnother={() => { setSubmitted(false); setStep(1); setForm(INITIAL_FORM); }} />
      </div>
    );
  }

  const catName  = eventCategories.find(c => c.slug === form.categorySlug)?.name || '';
  const cityName = cities.find(c => c.slug === form.citySlug)?.name || '';

  return (
    <div className="min-h-screen bg-gray-50">
      <StepIndicator current={step} total={TOTAL_STEPS} />

      <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-base font-extrabold text-gray-900">Post Your Event</h1>
            <p className="text-xs text-gray-400">Takes less than 2 minutes · Auto-saved</p>
          </div>
          <SaveIndicator savedAt={savedAt} />
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          {step === 1 && (
            <Step1
              form={form}
              eventCategories={eventCategories}
              loading={dataLoading}
              onChange={updateForm}
            />
          )}
          {step === 2 && <Step2 form={form} onChange={updateForm} />}
          {step === 3 && (
            <Step3
              form={form}
              cities={cities}
              localities={localities}
              loadingLocalities={loadingLocalities}
              onChange={updateForm}
              onCityChange={handleCityChange}
            />
          )}
          {step === 4 && <Step4 form={form} onChange={updateForm} />}
          {step === 5 && (
            <Step5
              form={form}
              serviceCategories={serviceCategories}
              loading={dataLoading}
              onChange={updateForm}
            />
          )}
          {step === 6 && <Step6 form={form} onChange={updateForm} />}
          {step === 7 && <Step7 form={form} onChange={updateForm} />}
          {step === 8 && <Step8 form={form} onChange={updateForm} />}
          {step === 9 && (
            <Step9
              form={form}
              eventCategories={eventCategories}
              cities={cities}
              wallet={wallet}
              tokenCost={tokenCost}
              onSaveDraft={saveDraft}
              onSubmit={handleSubmit}
              submitting={submitting}
              submitError={submitError}
            />
          )}
        </div>

        {/* Context: vendor not found */}
        {!vendor && step === 9 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-bold mb-1">Vendor profile required</p>
            <p className="text-xs mb-2">You need a vendor profile to post events.</p>
            <Link href="/partner/onboard" className="text-xs font-bold underline">
              Create vendor profile →
            </Link>
          </div>
        )}
      </div>

      {/* Sticky bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-xl">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          {step > 1 && (
            <button
              onClick={back}
              className="flex items-center gap-1.5 text-sm font-bold text-gray-600 hover:text-gray-900 px-4 py-3 rounded-xl hover:bg-gray-100 transition"
            >
              ← Back
            </button>
          )}

          <div className="flex-1" />

          {step < TOTAL_STEPS ? (
            <button
              onClick={next}
              disabled={!canAdvance()}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold px-6 py-3 rounded-xl hover:from-red-700 hover:to-rose-700 disabled:opacity-40 transition shadow-md shadow-red-200 text-sm"
              title={!canAdvance() ? errorHint() : ''}
            >
              Continue →
              {!canAdvance() && (
                <span className="text-xs font-normal text-red-200 hidden sm:inline">({errorHint()})</span>
              )}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Page export ───────────────────────────────────────────────────────────────

export default function PostEventPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-4 border-red-100 border-t-red-500 animate-spin" />
      </div>
    }>
      <EventCreator />
    </Suspense>
  );
}
