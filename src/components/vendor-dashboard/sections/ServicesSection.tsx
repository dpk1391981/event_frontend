'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Edit, Trash2, Loader2, Wrench, CheckCircle, Clock,
  XCircle, AlertCircle, Send, Star, MapPin, Users, Calendar,
  ChevronDown, ChevronUp, Eye,
} from 'lucide-react';
import { vendorServicesApi, categoriesApi, locationsApi } from '@/lib/api';
import ServiceCreateForm, { type ServiceEditData } from '@/components/partner/ServiceCreateForm';

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG = {
  draft:    { label: 'Draft',    Icon: Edit,        cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  pending:  { label: 'Pending',  Icon: Clock,       cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  active:   { label: 'Active',   Icon: CheckCircle, cls: 'bg-green-50 text-green-700 border-green-200' },
  inactive: { label: 'Inactive', Icon: XCircle,     cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  rejected: { label: 'Rejected', Icon: AlertCircle, cls: 'bg-red-50 text-red-700 border-red-200' },
} as const;

const RANGE_TAG_CFG = {
  budget:    { label: 'Budget',    cls: 'bg-green-100 text-green-700' },
  mid_range: { label: 'Mid-Range', cls: 'bg-blue-100 text-blue-700'  },
  premium:   { label: 'Premium',   cls: 'bg-purple-100 text-purple-700' },
} as const;

const PRICE_SUFFIX: Record<string, string> = {
  per_plate: '/plate',
  per_event: '/event',
  per_hour:  '/hr',
  per_day:   '/day',
};

// ── Main component ───────────────────────────────────────────────────────────

export default function ServicesSection({ vendorId }: { vendorId?: number }) {
  const [services,   setServices]   = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [cities,     setCities]     = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editSvc,    setEditSvc]    = useState<ServiceEditData | null>(null);
  const [deleting,   setDeleting]   = useState<number | null>(null);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [error,      setError]      = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [svcs, cats, citiesRes]: [any, any, any] = await Promise.all([
        vendorServicesApi.getAll(),
        categoriesApi.getAll('service'),
        locationsApi.getCities(),
      ]);
      setServices(svcs ?? []);
      setCategories(cats ?? []);
      setCities(citiesRes ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── After create/edit ──────────────────────────────────────────────────────
  const handleCreated = useCallback(async () => {
    setShowForm(false);
    setEditSvc(null);
    await load();
  }, [load]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this service? This cannot be undone.')) return;
    setDeleting(id);
    setError('');
    try {
      await vendorServicesApi.remove(id);
      await load();
    } catch {
      setError('Failed to delete service');
    } finally {
      setDeleting(null);
    }
  };

  // ── Submit for review ─────────────────────────────────────────────────────
  const handleSubmit = async (id: number) => {
    setSubmitting(id);
    setError('');
    try {
      await vendorServicesApi.submit(id);
      await load();
    } catch (e: any) {
      setError(e?.message ?? e?.error ?? 'Failed to submit. Ensure you have 3+ photos, category, city & price set.');
    } finally {
      setSubmitting(null);
    }
  };

  // ── Open edit form ────────────────────────────────────────────────────────
  const openEdit = (svc: any) => {
    const ed: ServiceEditData = {
      id:                  svc.id,
      name:                svc.name ?? svc.title,
      categoryId:          svc.categoryId,
      eventTypes:          svc.eventTypes ?? [],
      shortDescription:    svc.shortDescription ?? '',
      detailedDescription: svc.detailedDescription ?? '',
      priceType:           svc.priceType ?? 'per_event',
      basePrice:           svc.basePrice != null ? Number(svc.basePrice) : undefined,
      minPrice:            svc.minPrice  != null ? Number(svc.minPrice)  : undefined,
      maxPrice:            svc.maxPrice  != null ? Number(svc.maxPrice)  : undefined,
      cityId:              svc.cityId,
      locality:            svc.locality  ?? '',
      serviceAreas:        svc.serviceAreas ?? [],
      minGuests:           svc.minGuests,
      maxGuests:           svc.maxGuests,
      availabilityType:    svc.availabilityType ?? 'always_available',
      availableDates:      svc.availableDates   ?? [],
      blockedDates:        svc.blockedDates      ?? [],
      images:              svc.images            ?? [],   // raw stored paths
      videos:              svc.videos            ?? [],
      tags:                svc.tags              ?? [],
      highlights:          svc.highlights        ?? [],
    };
    setEditSvc(ed);
    setShowForm(true);
  };

  const activeCount  = services.filter(s => s.status === 'active').length;
  const pendingCount = services.filter(s => s.status === 'pending').length;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">My Services</h2>
          <p className="text-sm text-gray-500">
            {services.length} total · {activeCount} live · {pendingCount} under review
          </p>
        </div>
        <button
          onClick={() => { setEditSvc(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all shadow-sm shadow-red-600/20"
        >
          <Plus className="w-4 h-4" /> New Service
        </button>
      </div>

      {/* ── How-it-works banner ── */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 flex gap-3">
        <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700 leading-relaxed">
          <span className="font-semibold">Workflow: </span>
          Save draft → Add ≥ 3 photos + all required fields → Submit for Review → Admin approves → Service goes live in search
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ── List ── */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-36 rounded-2xl bg-gray-100" />)}
        </div>
      ) : services.length === 0 ? (
        <EmptyState onAdd={() => setShowForm(true)} />
      ) : (
        <div className="space-y-3">
          {services.map((svc: any) => (
            <ServiceCard
              key={svc.id}
              svc={svc}
              submitting={submitting === svc.id}
              deleting={deleting === svc.id}
              onEdit={() => openEdit(svc)}
              onDelete={() => handleDelete(svc.id)}
              onSubmit={() => handleSubmit(svc.id)}
            />
          ))}
        </div>
      )}

      {/* ── Form overlay ── */}
      {showForm && (
        <ServiceCreateForm
          categories={categories}
          cities={cities}
          editData={editSvc ?? undefined}
          onCreated={handleCreated}
          onClose={() => { setShowForm(false); setEditSvc(null); }}
        />
      )}
    </div>
  );
}

// ── Service Card ─────────────────────────────────────────────────────────────

function ServiceCard({
  svc, submitting, deleting, onEdit, onDelete, onSubmit,
}: {
  svc: any;
  submitting: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSubmit: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const statusKey = svc.status as keyof typeof STATUS_CFG;
  const status    = STATUS_CFG[statusKey] ?? STATUS_CFG.draft;
  const StatusIcon = status.Icon;

  const rangeKey = svc.priceRangeTag as keyof typeof RANGE_TAG_CFG;
  const rangeTag = RANGE_TAG_CFG[rangeKey] ?? null;

  // First approved / resolved image
  const thumb = svc.resolvedImages?.[0] ?? null;

  const priceSuffix = PRICE_SUFFIX[svc.priceType] ?? '';
  const priceText = svc.minPrice
    ? `₹${Number(svc.minPrice).toLocaleString('en-IN')}${svc.maxPrice ? ` – ₹${Number(svc.maxPrice).toLocaleString('en-IN')}` : ''}${priceSuffix ? ` ${priceSuffix}` : ''}`
    : svc.basePrice
    ? `₹${Number(svc.basePrice).toLocaleString('en-IN')}${priceSuffix ? ` ${priceSuffix}` : ''}`
    : null;

  const canSubmit = svc.status === 'draft' || svc.status === 'rejected';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="flex">
        {/* ── Thumbnail ── */}
        {thumb ? (
          <div className="w-28 sm:w-36 flex-shrink-0 min-h-[130px] relative">
            <img
              src={thumb}
              alt={svc.name ?? svc.title ?? 'Service'}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-28 sm:w-36 flex-shrink-0 min-h-[130px] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            <Wrench className="w-8 h-8 text-gray-300" />
          </div>
        )}

        {/* ── Body ── */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-2">

            {/* Title + badges */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold text-gray-900 truncate max-w-xs">
                  {svc.name ?? svc.title}
                </h3>
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${status.cls}`}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </span>
                {rangeTag && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${rangeTag.cls}`}>
                    {rangeTag.label}
                  </span>
                )}
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-2 flex-wrap">
                {svc.category?.name && <span>{svc.category.name}</span>}
                {svc.city?.name && (
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-3 h-3" />{svc.city.name}
                  </span>
                )}
                {(svc.minGuests || svc.maxGuests) && (
                  <span className="flex items-center gap-0.5">
                    <Users className="w-3 h-3" />
                    {svc.minGuests ?? 0}–{svc.maxGuests ?? '∞'} guests
                  </span>
                )}
                {svc.views > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Eye className="w-3 h-3" /> {svc.views}
                  </span>
                )}
                {svc.rating > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {Number(svc.rating).toFixed(1)} · {svc.totalBookings} bookings
                  </span>
                )}
              </div>

              {/* Price */}
              {priceText && (
                <p className="text-sm font-bold text-gray-800 mb-2">{priceText}</p>
              )}

              {/* Event types */}
              {svc.eventTypes?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {svc.eventTypes.slice(0, 5).map((et: string) => (
                    <span key={et} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                      {et}
                    </span>
                  ))}
                </div>
              )}

              {/* Tags */}
              {svc.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {svc.tags.slice(0, 4).map((t: string) => (
                    <span key={t} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">
                      {t}
                    </span>
                  ))}
                  {svc.tags.length > 4 && (
                    <span className="text-xs text-gray-400">+{svc.tags.length - 4} more</span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className="flex items-center gap-1">
                <button
                  onClick={onEdit}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-all"
                  title="Edit service"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={onDelete}
                  disabled={deleting}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all disabled:opacity-50"
                  title="Delete service"
                >
                  {deleting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />}
                </button>
              </div>

              {canSubmit && (
                <button
                  onClick={onSubmit}
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-60 transition-all whitespace-nowrap"
                >
                  {submitting
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Send className="w-3 h-3" />}
                  {submitting ? 'Submitting…' : 'Submit for Review'}
                </button>
              )}
            </div>
          </div>

          {/* ── Status notices ── */}
          {svc.status === 'rejected' && svc.rejectionReason && (
            <div className="mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-700">
              <span className="font-semibold">Rejected: </span>{svc.rejectionReason}
              {svc.adminNote && <span className="block text-red-600 mt-0.5">Note: {svc.adminNote}</span>}
            </div>
          )}

          {svc.status === 'pending' && (
            <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">
              Under review by our team. You'll be notified once approved (usually within 24 hrs).
            </div>
          )}

          {svc.status === 'draft' && (
            <div className="mt-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-600">
              Draft — not visible in search.{' '}
              {(!svc.images?.length || svc.images.length < 3)
                ? 'Add 3+ photos, then submit for review.'
                : 'Click "Submit for Review" to go live.'}
            </div>
          )}

          {/* ── Expand: highlights ── */}
          {svc.highlights?.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? 'Hide highlights' : `${svc.highlights.length} highlight${svc.highlights.length !== 1 ? 's' : ''}`}
              </button>
              {expanded && (
                <ul className="mt-1.5 space-y-1">
                  {svc.highlights.map((h: string, i: number) => (
                    <li key={i} className="text-xs text-gray-500 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Image strip (when multiple) ── */}
      {svc.resolvedImages?.length > 1 && (
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto">
          {svc.resolvedImages.slice(1, 6).map((url: string, i: number) => (
            <img
              key={i}
              src={url}
              alt={`Photo ${i + 2}`}
              className="w-14 h-10 rounded-lg object-cover flex-shrink-0 opacity-80 hover:opacity-100 transition-opacity"
            />
          ))}
          {svc.resolvedImages.length > 6 && (
            <div className="w-14 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-gray-500 font-medium">+{svc.resolvedImages.length - 6}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
        <Wrench className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="font-semibold text-gray-800 mb-2 text-lg">No services yet</h3>
      <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
        Create your first service to showcase what you offer. Packages are built by combining services.
      </p>
      <button
        onClick={onAdd}
        className="px-6 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all shadow-sm shadow-red-600/20"
      >
        Create Your First Service
      </button>
    </div>
  );
}
