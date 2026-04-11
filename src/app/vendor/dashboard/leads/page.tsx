'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/vendor/DashboardLayout';
import { tokensApi, vendorsApi, dealsApi, leadsApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  new:        { label: 'New',        bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  viewed:     { label: 'Viewed',     bg: 'bg-gray-50',   text: 'text-gray-600',   dot: 'bg-gray-400' },
  contacted:  { label: 'Contacted',  bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  negotiated: { label: 'Negotiated', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  booked:     { label: 'Booked',     bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  converted:  { label: 'Converted',  bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
  closed:     { label: 'Closed',     bg: 'bg-teal-50',   text: 'text-teal-700',   dot: 'bg-teal-500' },
  rejected:   { label: 'Rejected',   bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-400' },
};

const QUALITY_LABEL = (q: number) =>
  q >= 80 ? { label: 'Hot', color: 'text-red-600', bg: 'bg-red-50', bar: 'bg-red-500' } :
  q >= 60 ? { label: 'Warm', color: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-400' } :
             { label: 'Cold', color: 'text-gray-500', bg: 'bg-gray-100', bar: 'bg-gray-300' };

const EVENT_ICONS: Record<string, string> = {
  wedding: '💍', birthday: '🎂', corporate: '💼', anniversary: '💑',
  engagement: '💫', reception: '🎊', 'baby-shower': '🍼', other: '🎉',
};

// ── Lead Card ─────────────────────────────────────────────────────────────────

function LeadCard({
  lead,
  onStatusChange,
  onConvertDeal,
  converting,
}: {
  lead: any;
  onStatusChange: (id: number, status: string) => void;
  onConvertDeal: (lead: any) => void;
  converting: number | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[lead.status] ?? STATUS_CFG.new;
  const quality = QUALITY_LABEL(lead.qualityScore ?? 50);
  const phone = lead.contactPhone?.replace(/\D/g, '');
  const isNew = lead.status === 'new';

  return (
    <div className={`bg-white border rounded-2xl transition-all duration-200 hover:shadow-md ${isNew ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-100'}`}>
      {/* Top accent strip for new leads */}
      {isNew && <div className="h-0.5 bg-gradient-to-r from-blue-400 to-violet-400 rounded-t-2xl" />}

      <div className="p-4">
        {/* Row 1: Name + badges + actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-xl ${quality.bg} flex items-center justify-center font-extrabold text-base shrink-0`}>
              {lead.contactName?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-gray-900 text-sm leading-none">{lead.contactName}</h3>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
                {isNew && (
                  <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full animate-pulse">
                    New
                  </span>
                )}
              </div>
              {/* Meta row */}
              <div className="flex items-center gap-2 flex-wrap mt-1">
                {lead.eventType && (
                  <span className="text-[11px] text-gray-500 font-medium">
                    {EVENT_ICONS[lead.eventType] || '🎉'} {lead.eventType.replace(/-/g, ' ')}
                  </span>
                )}
                {lead.city?.name && (
                  <span className="text-[11px] text-gray-400">📍 {lead.city.name}</span>
                )}
                {lead.category?.name && (
                  <span className="text-[11px] text-violet-600 font-semibold">{lead.category.name}</span>
                )}
                <span className="text-[11px] text-gray-300">
                  {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Quality badge */}
          <div className="shrink-0 text-right">
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl ${quality.bg}`}>
              <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full ${quality.bar} rounded-full`} style={{ width: `${lead.qualityScore ?? 50}%` }} />
              </div>
              <span className={`text-[10px] font-extrabold ${quality.color}`}>{quality.label}</span>
            </div>
          </div>
        </div>

        {/* Row 2: Key details */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-gray-50 rounded-xl p-2.5">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Phone</p>
            <p className="text-xs font-bold text-gray-800 mt-0.5 truncate">{lead.contactPhone}</p>
          </div>
          {lead.budget ? (
            <div className="bg-green-50 rounded-xl p-2.5">
              <p className="text-[9px] font-bold text-green-400 uppercase tracking-wide">Budget</p>
              <p className="text-xs font-bold text-green-700 mt-0.5">₹{Number(lead.budget).toLocaleString('en-IN')}</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-2.5">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Budget</p>
              <p className="text-xs text-gray-300 mt-0.5">Not specified</p>
            </div>
          )}
          {lead.eventDate ? (
            <div className="bg-purple-50 rounded-xl p-2.5">
              <p className="text-[9px] font-bold text-purple-400 uppercase tracking-wide">Event Date</p>
              <p className="text-xs font-bold text-purple-700 mt-0.5">
                {new Date(lead.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          ) : lead.guestCount ? (
            <div className="bg-blue-50 rounded-xl p-2.5">
              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wide">Guests</p>
              <p className="text-xs font-bold text-blue-700 mt-0.5">~{lead.guestCount}</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-2.5">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Source</p>
              <p className="text-xs text-gray-500 mt-0.5 capitalize">{(lead.source || 'direct').replace(/_/g, ' ')}</p>
            </div>
          )}
        </div>

        {/* Requirement snippet */}
        {lead.requirement && (
          <p className={`text-xs text-gray-500 mt-2.5 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
            {lead.requirement}
          </p>
        )}
        {lead.requirement && lead.requirement.length > 100 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] text-violet-600 font-semibold mt-0.5 hover:underline"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}

        {/* Package info */}
        {lead.package && (
          <div className="mt-2.5 flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2">
            <span className="text-xs text-violet-600">📦</span>
            <p className="text-xs text-violet-700 font-semibold">{lead.package.title}</p>
            <span className="text-xs text-violet-500 ml-auto font-bold">₹{Number(lead.package.price).toLocaleString('en-IN')}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50 flex-wrap">
          {/* Call */}
          <a
            href={`tel:+91${phone}`}
            className="flex items-center gap-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-xl transition shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call
          </a>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/91${phone}?text=${encodeURIComponent(`Hi ${lead.contactName}, I received your enquiry${lead.eventType ? ` for ${lead.eventType}` : ''} on PlanToday. I'd love to discuss your requirements!`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-xl transition shrink-0"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
            WhatsApp
          </a>

          {/* Email */}
          {lead.contactEmail && (
            <a
              href={`mailto:${lead.contactEmail}`}
              className="flex items-center gap-1.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-xl transition shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </a>
          )}

          {/* Status updater */}
          <select
            value={lead.status}
            onChange={(e) => onStatusChange(lead.id, e.target.value)}
            className="ml-auto text-xs border-2 border-gray-100 focus:border-violet-400 rounded-xl px-2.5 py-2 outline-none bg-white font-semibold text-gray-700 transition"
          >
            {Object.entries(STATUS_CFG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          {/* Convert to Deal */}
          {!['converted', 'closed', 'rejected'].includes(lead.status) && (
            <button
              onClick={() => onConvertDeal(lead)}
              disabled={converting === lead.id}
              className="text-xs font-bold bg-violet-50 hover:bg-violet-100 text-violet-700 px-3 py-2 rounded-xl transition disabled:opacity-50 shrink-0"
            >
              {converting === lead.id ? '…' : '→ Deal'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const { user } = useAppStore();
  const [vendorId,      setVendorId]      = useState<number | null>(null);
  const [tokenBalance,  setTokenBalance]  = useState(0);
  const [leads,         setLeads]         = useState<any[]>([]);
  const [stats,         setStats]         = useState<any>({});
  const [loading,       setLoading]       = useState(true);
  const [converting,    setConverting]    = useState<number | null>(null);
  const [toast,         setToast]         = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [page,          setPage]          = useState(1);
  const [meta,          setMeta]          = useState<any>({});

  const showToast = (msg: string, ok = true) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchLeads = useCallback(async (vid: number) => {
    try {
      const res: any = await leadsApi.getVendorLeads(
        vid,
        page,
        20,
      );
      // Backend returns { data, meta }
      const data = res?.data ?? (Array.isArray(res) ? res : []);
      setLeads(data);
      setMeta(res?.meta ?? {});
    } catch {}
  }, [page]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const vendor: any = await vendorsApi.getMyProfile();
        const vId = vendor?.id;
        setVendorId(vId);
        const [, wallet, statsRes] = await Promise.all([
          fetchLeads(vId),
          tokensApi.getWallet(vId).catch(() => ({ balance: 0 })),
          leadsApi.getStats(vId).catch(() => ({})),
        ]);
        setTokenBalance((wallet as any)?.balance || 0);
        setStats(statsRes || {});
      } catch {}
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    if (vendorId) fetchLeads(vendorId);
  }, [vendorId, page, fetchLeads]);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await leadsApi.markViewed(id); // mark viewed first if new
      // Optimistic update
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
      // Call the status endpoint
      await leadsApi.updateStatus(id, status);
      showToast(`Status updated to ${STATUS_CFG[status]?.label}`);
    } catch {
      // Revert on failure
      if (vendorId) fetchLeads(vendorId);
      showToast('Failed to update status');
    }
  };

  const handleConvertDeal = async (lead: any) => {
    if (!vendorId) return;
    setConverting(lead.id);
    try {
      await dealsApi.create(vendorId, {
        leadId: lead.id,
        title: `Deal — ${lead.contactName}`,
        notes: lead.requirement,
        value: lead.budget,
      });
      showToast('Lead converted to deal! 🤝');
      setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, status: 'converted' } : l));
    } catch (e: any) {
      showToast(e?.message || 'Failed to convert');
    }
    setConverting(null);
  };

  const filteredLeads = filterStatus
    ? leads.filter((l) => l.status === filterStatus)
    : leads;

  const statItems = [
    { label: 'Total', value: stats.total ?? leads.length, color: 'text-gray-900', bg: 'bg-white' },
    { label: 'New', value: stats.newLeads ?? leads.filter(l => l.status === 'new').length, color: 'text-blue-700', bg: 'bg-blue-50' },
    { label: 'Converted', value: stats.converted ?? leads.filter(l => l.status === 'converted').length, color: 'text-green-700', bg: 'bg-green-50' },
    { label: 'Rate', value: stats.conversionRate ? `${Number(stats.conversionRate).toFixed(0)}%` : '—', color: 'text-violet-700', bg: 'bg-violet-50' },
  ];

  return (
    <DashboardLayout tokenBalance={tokenBalance}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[9999] bg-gray-900 text-white text-sm px-4 py-3 rounded-2xl shadow-xl font-semibold">
          {toast}
        </div>
      )}

      <div className="p-4 sm:p-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">Leads</h1>
          <p className="text-gray-400 text-sm mt-0.5">Customer enquiries matched to your profile</p>
        </div>

        {/* Stats strip */}
        {!loading && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {statItems.map((s) => (
              <div key={s.label} className={`${s.bg} border border-gray-100 rounded-2xl p-3.5 text-center`}>
                <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-xs font-semibold text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Status filter pills */}
        {!loading && leads.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4 overflow-x-auto pb-1">
            <button
              onClick={() => setFilterStatus('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                !filterStatus ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              All · {leads.length}
            </button>
            {Object.entries(STATUS_CFG).map(([k, v]) => {
              const count = leads.filter(l => l.status === k).length;
              if (!count) return null;
              return (
                <button
                  key={k}
                  onClick={() => setFilterStatus(filterStatus === k ? '' : k)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                    filterStatus === k
                      ? `${v.bg} ${v.text} border-current`
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {v.label} · {count}
                </button>
              );
            })}
          </div>
        )}

        {/* Lead list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-40" />
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="font-extrabold text-gray-900 text-lg mb-2">
              {filterStatus ? `No ${STATUS_CFG[filterStatus]?.label} leads` : 'No leads yet'}
            </h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              {filterStatus
                ? 'Try clearing the filter to see all leads'
                : 'Complete your vendor profile and get listed to start receiving customer enquiries'}
            </p>
            {filterStatus && (
              <button
                onClick={() => setFilterStatus('')}
                className="mt-4 text-sm font-bold text-violet-600 hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onStatusChange={handleStatusChange}
                onConvertDeal={handleConvertDeal}
                converting={converting}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta.pages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 text-gray-600 hover:border-violet-300 disabled:opacity-30 transition"
            >
              ← Prev
            </button>
            <span className="px-4 py-2 text-sm font-bold text-gray-500">
              {page} / {meta.pages}
            </span>
            <button
              onClick={() => setPage(Math.min(meta.pages, page + 1))}
              disabled={page === meta.pages}
              className="px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 text-gray-600 hover:border-violet-300 disabled:opacity-30 transition"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
