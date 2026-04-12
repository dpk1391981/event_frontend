'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { feedbackApi } from '@/lib/api';
import {
  MessageSquare, AlertCircle, CheckCircle2, Clock, Eye,
  Filter, Search, RefreshCw, ChevronLeft, ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeedbackItem {
  id: number;
  type: 'complaint' | 'feedback';
  category: string;
  message: string;
  name?: string;
  email?: string;
  phone?: string;
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  adminNote?: string;
  rating?: number;
  createdAt: string;
  resolvedAt?: string;
}

interface Stats {
  total: number; open: number; inReview: number; resolved: number;
  complaints: number; feedbacks: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  open:      'bg-red-100 text-red-700',
  in_review: 'bg-yellow-100 text-yellow-700',
  resolved:  'bg-green-100 text-green-700',
  closed:    'bg-gray-100 text-gray-600',
};

const STATUS_LABELS: Record<string, string> = {
  open:      'Open',
  in_review: 'In Review',
  resolved:  'Resolved',
  closed:    'Closed',
};

const CAT_LABELS: Record<string, string> = {
  vendor_behaviour: 'Vendor Behaviour', fake_vendor: 'Fake/Fraud Vendor',
  payment_issue: 'Payment Issue', lead_quality: 'Lead Quality',
  app_bug: 'App Bug', other_complaint: 'Other',
  feature_request: 'Feature Request', ui_ux: 'UI/UX',
  performance: 'Performance', general_feedback: 'General Feedback',
  appreciation: 'Appreciation',
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ item, onClose, onUpdated }: {
  item: FeedbackItem;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [status, setStatus]   = useState(item.status);
  const [note, setNote]       = useState(item.adminNote || '');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await feedbackApi.update(item.id, { status, adminNote: note });
      setSaved(true);
      setTimeout(() => { onUpdated(); onClose(); }, 800);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            {item.type === 'complaint'
              ? <AlertCircle className="w-5 h-5 text-red-600" />
              : <MessageSquare className="w-5 h-5 text-blue-600" />
            }
            <span className="font-bold text-gray-900 capitalize">{item.type} #{item.id}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500 font-medium">Category</p>
              <p className="font-semibold text-gray-800">{CAT_LABELS[item.category] || item.category}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Submitted</p>
              <p className="font-semibold text-gray-800">{fmt(item.createdAt)}</p>
            </div>
            {item.name && (
              <div>
                <p className="text-xs text-gray-500 font-medium">From</p>
                <p className="font-semibold text-gray-800">{item.name}</p>
              </div>
            )}
            {item.email && (
              <div>
                <p className="text-xs text-gray-500 font-medium">Email</p>
                <a href={`mailto:${item.email}`} className="font-semibold text-blue-600 hover:underline truncate block">{item.email}</a>
              </div>
            )}
            {item.rating && item.rating > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-medium">Rating</p>
                <p className="font-semibold text-amber-600">{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</p>
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Message</p>
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-800 whitespace-pre-wrap">{item.message}</div>
          </div>

          {/* Update status */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Update Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as FeedbackItem['status'])}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="open">Open</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Admin note */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Admin Note (internal)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Add internal notes or action taken…"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <button
            onClick={save}
            disabled={saving || saved}
            className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl text-sm hover:from-red-500 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminFeedbackPage() {
  const [data, setData]       = useState<FeedbackItem[]>([]);
  const [stats, setStats]     = useState<Stats | null>(null);
  const [meta, setMeta]       = useState({ total: 0, page: 1, pages: 1, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FeedbackItem | null>(null);

  // Filters
  const [typeF, setTypeF]     = useState('');
  const [statusF, setStatusF] = useState('');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await feedbackApi.list({
        type:   typeF || undefined,
        status: statusF || undefined,
        search: search || undefined,
        page,
        limit: 20,
      });
      setData(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, pages: 1, limit: 20 });
      if (res.stats) setStats(res.stats);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [typeF, statusF, search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [typeF, statusF, search]);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Feedback & Complaints</h1>
            <p className="text-sm text-gray-500 mt-1">Manage user feedback and complaints</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Total',      value: stats.total,      color: 'bg-gray-900 text-white' },
              { label: 'Open',       value: stats.open,       color: 'bg-red-600 text-white' },
              { label: 'In Review',  value: stats.inReview,   color: 'bg-yellow-500 text-white' },
              { label: 'Resolved',   value: stats.resolved,   color: 'bg-green-600 text-white' },
              { label: 'Complaints', value: stats.complaints, color: 'bg-orange-500 text-white' },
              { label: 'Feedbacks',  value: stats.feedbacks,  color: 'bg-blue-600 text-white' },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl px-4 py-3 ${s.color}`}>
                <p className="text-2xl font-black">{s.value}</p>
                <p className="text-xs font-semibold opacity-80">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-gray-50 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search message, name, email…"
              className="bg-transparent text-sm flex-1 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={typeF}
              onChange={e => setTypeF(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Types</option>
              <option value="complaint">Complaints</option>
              <option value="feedback">Feedback</option>
            </select>
            <select
              value={statusF}
              onChange={e => setStatusF(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading…
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
              <p className="font-medium">No records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">#</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Type</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Category</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Message</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">From</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Date</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3 text-gray-400 font-mono text-xs">{item.id}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          item.type === 'complaint' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {item.type === 'complaint' ? <AlertCircle className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                          {item.type === 'complaint' ? 'Complaint' : 'Feedback'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600 text-xs">{CAT_LABELS[item.category] || item.category}</td>
                      <td className="px-5 py-3 max-w-[200px]">
                        <p className="text-gray-700 truncate">{item.message}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800">{item.name || '—'}</p>
                        {item.email && <p className="text-xs text-gray-400 truncate max-w-[120px]">{item.email}</p>}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[item.status]}`}>
                          {item.status === 'resolved' && <CheckCircle2 className="w-3 h-3" />}
                          {item.status === 'in_review' && <Clock className="w-3 h-3" />}
                          {STATUS_LABELS[item.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">{fmt(item.createdAt)}</td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => setSelected(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {meta.pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {((page - 1) * meta.limit) + 1}–{Math.min(page * meta.limit, meta.total)} of {meta.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-700">{page} / {meta.pages}</span>
              <button
                disabled={page >= meta.pages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <DetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onUpdated={load}
        />
      )}
    </AdminLayout>
  );
}
