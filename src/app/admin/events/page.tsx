'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { vendorEventsApi } from '@/lib/api';

const STATUS_TABS = ['all', 'pending', 'approved', 'rejected'];
const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  pending:  { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Pending' },
  approved: { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Live' },
  rejected: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Rejected' },
  draft:    { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Draft' },
};

function AdminEventsContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('status') || 'pending');
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    setLoading(true);
    try {
      const [eventsRes, statsRes]: any[] = await Promise.all([
        vendorEventsApi.adminList(tab === 'all' ? undefined : tab),
        vendorEventsApi.adminStats(),
      ]);
      setEvents(eventsRes?.data || []);
      setStats(statsRes || {});
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [tab]);

  const handleApprove = async (id: number) => {
    setActionId(id);
    try {
      await vendorEventsApi.adminReview(id, { action: 'approve' });
      showToast('Event approved and is now live! ✅');
      load();
    } catch (e: any) { showToast(e?.message || 'Failed'); }
    setActionId(null);
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionId(rejectModal.id);
    try {
      await vendorEventsApi.adminReview(rejectModal.id, { action: 'reject', rejectionReason: rejectReason });
      showToast('Event rejected. Tokens refunded to vendor.');
      setRejectModal(null);
      setRejectReason('');
      load();
    } catch (e: any) { showToast(e?.message || 'Failed'); }
    setActionId(null);
  };

  return (
    <div className="p-6 max-w-6xl">
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>}

      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Event Management 🎉</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, icon: '📊', bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700' },
          { label: 'Pending', value: stats.pending, icon: '⏳', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
          { label: 'Approved', value: stats.approved, icon: '✅', bg: 'bg-green-50 border-green-200', text: 'text-green-700' },
          { label: 'Rejected', value: stats.rejected, icon: '❌', bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
          { label: 'Boosted', value: stats.boosted, icon: '🚀', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
        ].map(c => (
          <div key={c.label} className={`${c.bg} border rounded-xl p-3 text-center`}>
            <p className="text-lg">{c.icon}</p>
            <p className={`text-2xl font-extrabold ${c.text}`}>{c.value ?? 0}</p>
            <p className={`text-xs font-semibold ${c.text}`}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-xs font-bold px-4 py-2 rounded-lg transition capitalize ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-28" />)}</div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-2">🎉</p>
          <p className="font-extrabold text-gray-900">No {tab} events</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event: any) => {
            const cfg = STATUS_CONFIG[event.status] || STATUS_CONFIG.draft;
            return (
              <div key={event.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex gap-4 hover:shadow-sm transition">
                <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                  {event.images?.[0] ? (
                    <img src={event.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🎉</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-gray-900 text-sm">{event.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                    {event.isBoosted && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">🚀 Boosted</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    by <span className="font-semibold text-gray-600">{event.vendor?.businessName}</span>
                    {event.categorySlug && ` · ${event.categorySlug}`}
                    {event.citySlug && ` · ${event.citySlug}`}
                  </p>
                  {event.description && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{event.description}</p>}
                  <p className="text-[10px] text-gray-300 mt-1">
                    {new Date(event.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {event.tokenCost > 0 && ` · Cost: ${event.tokenCost} tokens`}
                  </p>
                </div>

                {event.status === 'pending' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => handleApprove(event.id)} disabled={actionId === event.id}
                      className="text-xs font-bold bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-xl transition disabled:opacity-50">
                      ✅ Approve
                    </button>
                    <button onClick={() => setRejectModal(event)} disabled={actionId === event.id}
                      className="text-xs font-bold bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-xl transition disabled:opacity-50">
                      ❌ Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-extrabold text-gray-900 mb-2">Reject Event</h3>
            <p className="text-sm text-gray-500 mb-4">"{rejectModal.title}"</p>
            <p className="text-xs font-bold text-gray-600 mb-1.5">Rejection Reason</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Tell the vendor why their event was rejected..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 mb-4"
            />
            <p className="text-xs text-amber-600 mb-4">⚠️ Tokens ({rejectModal.tokenCost}) will be refunded to vendor</p>
            <div className="flex gap-2">
              <button onClick={handleReject} disabled={!!actionId}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition text-sm disabled:opacity-50">
                {actionId ? 'Rejecting...' : 'Reject Event'}
              </button>
              <button onClick={() => setRejectModal(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-5 rounded-xl transition text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminEventsPage() {
  return (
    <AdminLayout>
      <Suspense>
        <AdminEventsContent />
      </Suspense>
    </AdminLayout>
  );
}
