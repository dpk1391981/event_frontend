'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Edit, Trash2, Loader2, Package2, CheckCircle, Clock,
  XCircle, AlertCircle, Send, Zap, Star, MapPin, Users,
  ChevronDown, ChevronUp, TrendingUp, Percent,
} from 'lucide-react';
import { packagesApi, vendorServicesApi, categoriesApi, locationsApi } from '@/lib/api';
import PackageCreateForm, {
  type PackageEditData,
  type ActiveService,
} from '@/components/partner/PackageCreateForm';
import type { DashboardSection } from '../VendorDashboardShell';

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG = {
  draft:    { label: 'Draft',    Icon: Edit,        cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  pending:  { label: 'Pending',  Icon: Clock,       cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  active:   { label: 'Active',   Icon: CheckCircle, cls: 'bg-green-50 text-green-700 border-green-200' },
  inactive: { label: 'Inactive', Icon: XCircle,     cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  rejected: { label: 'Rejected', Icon: AlertCircle, cls: 'bg-red-50 text-red-700 border-red-200' },
} as const;

const TAG_COLORS: Record<string, string> = {
  budget:   'bg-green-100 text-green-700',
  standard: 'bg-blue-100 text-blue-700',
  premium:  'bg-purple-100 text-purple-700',
  luxury:   'bg-amber-100 text-amber-700',
};

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  vendorId?: number;
  onNavigate?: (section: DashboardSection) => void;
}

// ── Main component ───────────────────────────────────────────────────────────

export default function PackagesSection({ vendorId, onNavigate }: Props) {
  const [packages,       setPackages]       = useState<any[]>([]);
  const [categories,     setCategories]     = useState<any[]>([]);
  const [cities,         setCities]         = useState<any[]>([]);
  const [activeServices, setActiveServices] = useState<ActiveService[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [showForm,       setShowForm]       = useState(false);
  const [editPkg,        setEditPkg]        = useState<PackageEditData | null>(null);
  const [deleting,       setDeleting]       = useState<number | null>(null);
  const [submitting,     setSubmitting]     = useState<number | null>(null);
  const [error,          setError]          = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pkgs, cats, citiesRes, svcs]: [any, any, any, any] = await Promise.all([
        packagesApi.getMyPackages(),
        categoriesApi.getAll('service'),
        locationsApi.getCities(),
        vendorServicesApi.getActive(),
      ]);
      setPackages(pkgs ?? []);
      setCategories(cats ?? []);
      setCities(citiesRes ?? []);
      setActiveServices(svcs ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── After create/edit ──────────────────────────────────────────────────────
  const handleCreated = useCallback(async () => {
    setShowForm(false);
    setEditPkg(null);
    await load();
  }, [load]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this package? This cannot be undone.')) return;
    setDeleting(id);
    setError('');
    try {
      await packagesApi.remove(id);
      await load();
    } catch {
      setError('Failed to delete package');
    } finally {
      setDeleting(null);
    }
  };

  // ── Submit for review ─────────────────────────────────────────────────────
  const handleSubmit = async (id: number) => {
    setSubmitting(id);
    setError('');
    try {
      await packagesApi.submit(id);
      await load();
    } catch (e: any) {
      setError(e?.message ?? e?.error ?? 'Failed to submit. Ensure you have 3+ photos, a service, city & price set.');
    } finally {
      setSubmitting(null);
    }
  };

  // ── Open edit form ────────────────────────────────────────────────────────
  const openEdit = (pkg: any) => {
    const ed: PackageEditData = {
      id:               pkg.id,
      title:            pkg.title,
      categoryId:       pkg.categoryId,
      eventTypes:       pkg.eventTypes  ?? [],
      description:      pkg.description ?? '',
      serviceIds:       pkg.serviceIds  ?? [],
      priceMode:        pkg.priceMode   ?? 'fixed_price',
      price:            pkg.price       != null ? Number(pkg.price)     : undefined,
      finalPrice:       pkg.finalPrice  != null ? Number(pkg.finalPrice): undefined,
      discountAmount:   pkg.discountAmount != null ? Number(pkg.discountAmount) : undefined,
      addons:           pkg.addons      ?? [],
      includes:         pkg.includes    ?? [],
      bulletPoints:     pkg.bulletPoints ?? [],
      exclusions:       pkg.exclusions  ?? [],
      tags:             pkg.tags        ?? [],
      cityId:           pkg.cityId,
      serviceAreas:     pkg.serviceAreas ?? [],
      minGuests:        pkg.minGuests,
      maxGuests:        pkg.maxGuests,
      availabilityType: pkg.availabilityType ?? 'derived_from_services',
      availableDates:   pkg.availableDates   ?? [],
      blockedDates:     pkg.blockedDates     ?? [],
      images:           pkg.images           ?? [],   // raw stored paths
      videos:           pkg.videos           ?? [],
    };
    setEditPkg(ed);
    setShowForm(true);
  };

  const activeCount  = packages.filter(p => p.status === 'active').length;
  const pendingCount = packages.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">My Packages</h2>
          <p className="text-sm text-gray-500">
            {packages.length} total · {activeCount} live · {pendingCount} under review
          </p>
        </div>
        <button
          onClick={() => { setEditPkg(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all shadow-sm shadow-red-600/20"
        >
          <Plus className="w-4 h-4" /> New Package
        </button>
      </div>

      {/* ── Bundling tip ── */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 flex gap-3">
        <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700 leading-relaxed">
          <span className="font-semibold">Packages = Bundled Services. </span>
          Create at least 1 active service first. Packages auto-calculate pricing, tags, and availability from your services.
          {activeServices.length === 0 && (
            <button
              onClick={() => onNavigate?.('services')}
              className="ml-1.5 underline font-semibold hover:text-blue-900 transition-colors"
            >
              Create a Service →
            </button>
          )}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-52 rounded-2xl bg-gray-100" />)}
        </div>
      ) : packages.length === 0 ? (
        <EmptyState
          onAdd={() => setShowForm(true)}
          hasServices={activeServices.length > 0}
          onGoToServices={() => onNavigate?.('services')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {packages.map((pkg: any) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              submitting={submitting === pkg.id}
              deleting={deleting === pkg.id}
              onEdit={() => openEdit(pkg)}
              onDelete={() => handleDelete(pkg.id)}
              onSubmit={() => handleSubmit(pkg.id)}
            />
          ))}
        </div>
      )}

      {/* ── Form overlay ── */}
      {showForm && (
        <PackageCreateForm
          categories={categories}
          cities={cities}
          activeServices={activeServices}
          editData={editPkg ?? undefined}
          onCreated={handleCreated}
          onClose={() => { setShowForm(false); setEditPkg(null); }}
          onNeedService={() => {
            setShowForm(false);
            onNavigate?.('services');
          }}
        />
      )}
    </div>
  );
}

// ── Package Card ─────────────────────────────────────────────────────────────

function PackageCard({
  pkg, submitting, deleting, onEdit, onDelete, onSubmit,
}: {
  pkg: any;
  submitting: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSubmit: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const statusKey  = pkg.status as keyof typeof STATUS_CFG;
  const status     = STATUS_CFG[statusKey] ?? STATUS_CFG.draft;
  const StatusIcon = status.Icon;

  const tagKey   = (pkg.tag ?? '').toLowerCase() as string;
  const tagColor = TAG_COLORS[tagKey] ?? 'bg-gray-100 text-gray-600';

  const thumb    = pkg.resolvedImages?.[0] ?? null;
  const canSubmit = pkg.status === 'draft' || pkg.status === 'rejected';

  const finalPrice    = pkg.finalPrice ?? pkg.price ?? 0;
  const savingsPercent = pkg.savingsPercent ?? 0;
  const serviceCount  = pkg.services?.length ?? pkg.serviceIds?.length ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">

      {/* ── Thumbnail ── */}
      {thumb ? (
        <div className="relative h-36 overflow-hidden">
          <img
            src={thumb}
            alt={pkg.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {/* Floating badges on image */}
          <div className="absolute bottom-2 left-2 flex gap-1.5">
            {pkg.tag && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold backdrop-blur-sm ${tagColor}`}>
                {(pkg.tag as string).toUpperCase()}
              </span>
            )}
            {savingsPercent > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-600 text-white flex items-center gap-0.5">
                <Percent className="w-2.5 h-2.5" />{Math.round(savingsPercent)}% off
              </span>
            )}
          </div>
          {/* Status badge */}
          <div className="absolute top-2 right-2">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium backdrop-blur-sm ${status.cls}`}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
          </div>
          {/* Actions on hover */}
          <div className="absolute top-2 left-2 flex gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg bg-white/90 text-gray-600 hover:text-red-600 hover:bg-white transition-all shadow-sm"
              title="Edit"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="p-1.5 rounded-lg bg-white/90 text-gray-400 hover:text-red-600 hover:bg-white transition-all shadow-sm disabled:opacity-50"
              title="Delete"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      ) : (
        /* No image: compact header */
        <div className="p-4 pb-0 flex items-start justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {pkg.tag && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${tagColor}`}>
                {(pkg.tag as string).toUpperCase()}
              </span>
            )}
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${status.cls}`}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-all">
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete} disabled={deleting} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all disabled:opacity-50">
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{pkg.title}</h3>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-wrap">
          {pkg.category?.name && <span>{pkg.category.name}</span>}
          {pkg.city?.name && (
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />{pkg.city.name}
            </span>
          )}
          {serviceCount > 0 && (
            <span className="flex items-center gap-0.5">
              <Package2 className="w-3 h-3" />{serviceCount} service{serviceCount !== 1 ? 's' : ''}
            </span>
          )}
          {(pkg.minGuests || pkg.maxGuests) && (
            <span className="flex items-center gap-0.5">
              <Users className="w-3 h-3" />
              {pkg.minGuests ?? 0}–{pkg.maxGuests ?? '∞'}
            </span>
          )}
          {pkg.leadsCount > 0 && (
            <span className="flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3 text-green-500" />{pkg.leadsCount} leads
            </span>
          )}
        </div>

        {/* Price block */}
        <div className="flex items-end gap-2 mb-3">
          <span className="text-2xl font-bold text-gray-900">
            ₹{Number(finalPrice).toLocaleString('en-IN')}
          </span>
          {pkg.originalPrice && Number(pkg.originalPrice) > Number(finalPrice) && (
            <span className="text-sm text-gray-400 line-through">
              ₹{Number(pkg.originalPrice).toLocaleString('en-IN')}
            </span>
          )}
          {pkg.priceType === 'per_person' && (
            <span className="text-xs text-gray-400">/ person</span>
          )}
        </div>

        {/* Event types */}
        {pkg.eventTypes?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {pkg.eventTypes.slice(0, 4).map((et: string) => (
              <span key={et} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                {et}
              </span>
            ))}
          </div>
        )}

        {/* Services included chips */}
        {pkg.services?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {pkg.services.slice(0, 3).map((svc: any) => (
              <span key={svc.id} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">
                {svc.name ?? svc.title}
              </span>
            ))}
            {pkg.services.length > 3 && (
              <span className="text-xs text-gray-400">+{pkg.services.length - 3} more</span>
            )}
          </div>
        )}

        {/* Expandable includes */}
        {pkg.includes?.length > 0 && (
          <div>
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors mt-1"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Hide inclusions' : `${pkg.includes.length} included item${pkg.includes.length !== 1 ? 's' : ''}`}
            </button>
            {expanded && (
              <ul className="mt-1.5 space-y-1">
                {pkg.includes.slice(0, 6).map((inc: string, i: number) => (
                  <li key={i} className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    {inc}
                  </li>
                ))}
                {pkg.includes.length > 6 && (
                  <li className="text-xs text-red-500">+{pkg.includes.length - 6} more</li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* ── Footer actions ── */}
      <div className="px-4 pb-4 flex items-center justify-between gap-2">
        {canSubmit ? (
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-60 transition-all"
          >
            {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            {submitting ? 'Submitting…' : 'Submit for Review'}
          </button>
        ) : (
          <div className="flex-1" />
        )}
        {!thumb && pkg.status === 'active' && (
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <Zap className="w-3 h-3" /> Live in search
          </span>
        )}
      </div>

      {/* ── Status notices ── */}
      {(pkg.status === 'rejected' || pkg.status === 'pending' || pkg.status === 'draft') && (
        <div className="px-4 pb-4">
          {pkg.status === 'rejected' && pkg.rejectionReason && (
            <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-700">
              <span className="font-semibold">Rejected: </span>{pkg.rejectionReason}
              {pkg.adminNote && <span className="block text-red-600 mt-0.5">Note: {pkg.adminNote}</span>}
            </div>
          )}
          {pkg.status === 'pending' && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">
              Under review by our team. You'll be notified once approved.
            </div>
          )}
          {pkg.status === 'draft' && (
            <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-600">
              Draft — not visible in search.{' '}
              {(!pkg.images?.length || pkg.images.length < 3)
                ? 'Add 3+ photos, then submit for review.'
                : 'Click "Submit for Review" to go live.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({
  onAdd, hasServices, onGoToServices,
}: {
  onAdd: () => void;
  hasServices: boolean;
  onGoToServices: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
        <Package2 className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="font-semibold text-gray-800 mb-2 text-lg">No packages yet</h3>
      {hasServices ? (
        <>
          <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
            Bundle your services into attractive packages to win more clients and increase revenue.
          </p>
          <button
            onClick={onAdd}
            className="px-6 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all"
          >
            Create Your First Package
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
            You need at least one <strong>active service</strong> before creating a package.
          </p>
          <button
            onClick={onGoToServices}
            className="px-6 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all"
          >
            Go Create a Service First
          </button>
        </>
      )}
    </div>
  );
}
