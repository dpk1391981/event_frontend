'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Phone, MessageCircle, ChevronDown, Search, Filter,
  Clock, CheckCircle, XCircle, AlertCircle, Eye, Calendar,
  MapPin, DollarSign, User, RefreshCw, Lock, Unlock, History,
  X, Check,
} from 'lucide-react';
import { vendorPanelApi } from '@/lib/api';

// ─── Status config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  new:         { label: 'New',         color: 'text-blue-700',  bg: 'bg-blue-50 border-blue-200',   dot: 'bg-blue-500' },
  viewed:      { label: 'Viewed',      color: 'text-purple-700',bg: 'bg-purple-50 border-purple-200',dot: 'bg-purple-500' },
  contacted:   { label: 'Contacted',   color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200',  dot: 'bg-amber-500' },
  in_progress: { label: 'In Progress', color: 'text-orange-700',bg: 'bg-orange-50 border-orange-200',dot: 'bg-orange-500' },
  negotiated:  { label: 'Negotiating', color: 'text-indigo-700',bg: 'bg-indigo-50 border-indigo-200',dot: 'bg-indigo-500' },
  booked:      { label: 'Booked',      color: 'text-green-700', bg: 'bg-green-50 border-green-200',  dot: 'bg-green-500' },
  closed:      { label: 'Closed',      color: 'text-gray-600',  bg: 'bg-gray-50 border-gray-200',    dot: 'bg-gray-400' },
  rejected:    { label: 'Rejected',    color: 'text-red-700',   bg: 'bg-red-50 border-red-200',      dot: 'bg-red-500' },
  converted:   { label: 'Converted',   color: 'text-green-700', bg: 'bg-green-50 border-green-200',  dot: 'bg-green-500' },
};

const STATUS_OPTIONS = [
  'all', 'new', 'viewed', 'contacted', 'in_progress', 'negotiated', 'booked', 'closed', 'rejected',
];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.new;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function fmtBudget(n: string | number | null) {
  if (!n) return '—';
  const num = Number(n);
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000)   return `₹${Math.round(num / 1000)}K`;
  return `₹${num}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Status Update Modal ─────────────────────────────────────────────────────

function StatusUpdateModal({
  leadId, currentStatus, onClose, onUpdated,
}: {
  leadId: number; currentStatus: string; onClose: () => void; onUpdated: () => void;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async () => {
    if (!status || status === currentStatus) { onClose(); return; }
    setLoading(true);
    setError('');
    try {
      await vendorPanelApi.updateLeadStatus(leadId, status, notes);
      onUpdated();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Update Lead Status</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">New Status</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.filter(s => s !== 'all').map(s => {
                const cfg = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                      status === s
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${cfg?.dot ?? 'bg-gray-400'}`} />
                    {cfg?.label ?? s}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add notes about this status change..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Lead Row ─────────────────────────────────────────────────────────────────

function LeadRow({ lead, onStatusUpdate, onUnlock }: {
  lead: any;
  onStatusUpdate: (id: number, currentStatus: string) => void;
  onUnlock: (id: number) => void;
}) {
  const phone = lead.isUnlocked ? lead.contactPhone : null;
  const isNew = lead.status === 'new';
  const hoursOld = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 3600000);
  const isOverdue = isNew && hoursOld >= 48;

  return (
    <div className={`bg-white rounded-2xl border ${isOverdue ? 'border-red-200 bg-red-50/30' : 'border-gray-100'} p-4 sm:p-5 hover:shadow-md transition-all`}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Left: lead info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusBadge status={lead.status} />
            {isOverdue && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-full">
                <AlertCircle className="w-3 h-3" /> Overdue
              </span>
            )}
            {lead.qualityScore >= 85 && (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                ⭐ High Quality
              </span>
            )}
          </div>

          <h3 className="font-semibold text-gray-900 text-sm">
            {lead.isUnlocked ? lead.contactName : `Customer #${lead.id}`}
          </h3>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            {lead.eventType && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {lead.eventType}
              </span>
            )}
            {lead.budget && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> {fmtBudget(lead.budget)}
              </span>
            )}
            {(lead.city?.name || lead.locality?.name) && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {lead.locality?.name ?? lead.city?.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {fmtDate(lead.createdAt)}
            </span>
          </div>

          {lead.requirement && (
            <p className="mt-2 text-xs text-gray-500 line-clamp-2">{lead.requirement}</p>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex sm:flex-col items-center gap-2 shrink-0">
          {lead.isUnlocked && phone ? (
            <>
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-all"
              >
                <Phone className="w-3.5 h-3.5" /> Call
              </a>
              <a
                href={`https://wa.me/91${phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            </>
          ) : (
            <button
              onClick={() => onUnlock(lead.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-all"
            >
              <Lock className="w-3.5 h-3.5" /> Unlock
            </button>
          )}
          <button
            onClick={() => onStatusUpdate(lead.id, lead.status)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-all"
          >
            <ChevronDown className="w-3.5 h-3.5" /> Status
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Leads Section ───────────────────────────────────────────────────────

export default function LeadsSection({ vendorId }: { vendorId?: number }) {
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalLeadId, setModalLeadId] = useState<number | null>(null);
  const [modalCurrentStatus, setModalCurrentStatus] = useState('');
  const [unlockLoading, setUnlockLoading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const LIMIT = 15;

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [leadsRes, statsRes]: [any, any] = await Promise.all([
        vendorPanelApi.getLeads({ page, status: statusFilter === 'all' ? undefined : statusFilter, search: search || undefined }),
        vendorPanelApi.getLeadStats(),
      ]);
      setLeads(leadsRes.data ?? []);
      setTotal(leadsRes.meta?.total ?? 0);
      setStats(statsRes);
    } catch {
      setError('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const handleUnlock = async (leadId: number) => {
    setUnlockLoading(leadId);
    try {
      await vendorPanelApi.unlockLead(leadId);
      await loadLeads();
    } catch (e: any) {
      setError(e?.message || 'Failed to unlock lead');
      setTimeout(() => setError(''), 4000);
    } finally {
      setUnlockLoading(null);
    }
  };

  const openStatusModal = (id: number, currentStatus: string) => {
    setModalLeadId(id);
    setModalCurrentStatus(currentStatus);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-900', bg: 'bg-white' },
            { label: 'New', value: stats.newLeads, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Contacted', value: stats.contacted, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Converted', value: stats.converted ?? stats.booked, color: 'text-green-600', bg: 'bg-green-50' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-2xl border border-gray-100 p-4 text-center`}>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, event type, location..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.slice(0, 5).map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all capitalize ${
                  statusFilter === s
                    ? 'bg-red-600 text-white border-red-600'
                    : 'border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600'
                }`}
              >
                {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label ?? s}
              </button>
            ))}
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 focus:outline-none focus:border-red-400"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s === 'all' ? 'All Status' : STATUS_CONFIG[s]?.label ?? s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={loadLeads}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Leads list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-1">No leads found</h3>
          <p className="text-sm text-gray-400">
            {statusFilter !== 'all' ? 'Try changing the filter' : 'Your leads will appear here once received'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map(lead => (
            <LeadRow
              key={lead.id}
              lead={lead}
              onStatusUpdate={openStatusModal}
              onUnlock={handleUnlock}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-50 hover:bg-gray-50"
            >
              ← Prev
            </button>
            <span className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold border border-red-100">
              {page}/{totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-50 hover:bg-gray-50"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Status update modal */}
      {modalLeadId !== null && (
        <StatusUpdateModal
          leadId={modalLeadId}
          currentStatus={modalCurrentStatus}
          onClose={() => setModalLeadId(null)}
          onUpdated={loadLeads}
        />
      )}
    </div>
  );
}
