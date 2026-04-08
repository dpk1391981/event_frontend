'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { tokensApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

export default function AdminTokensPage() {
  const { user } = useAppStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'requests' | 'wallets'>('requests');
  const [reviewModal, setReviewModal] = useState<{ req: any; action: 'approve' | 'reject' } | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    setLoading(true);
    try {
      const [reqs, wals]: any[] = await Promise.all([
        tokensApi.adminPendingReqs(),
        tokensApi.adminWallets(),
      ]);
      setRequests(reqs?.data || []);
      setWallets(wals?.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleReview = async () => {
    if (!reviewModal || !user) return;
    setActionId(reviewModal.req.id);
    try {
      await tokensApi.adminReviewRequest(reviewModal.req.id, { action: reviewModal.action, adminNote });
      showToast(reviewModal.action === 'approve' ? 'Tokens granted! 🪙' : 'Request rejected');
      setReviewModal(null);
      setAdminNote('');
      load();
    } catch (e: any) { showToast(e?.message || 'Failed'); }
    setActionId(null);
  };

  return (
    <AdminLayout>
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>}
      <div className="p-6 max-w-5xl">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Token Management 🪙</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {(['requests', 'wallets'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`text-xs font-bold px-5 py-2 rounded-lg transition capitalize ${activeTab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
              {t === 'requests' ? `Pending Requests ${requests.length > 0 ? `(${requests.length})` : ''}` : 'All Wallets'}
            </button>
          ))}
        </div>

        {activeTab === 'requests' && (
          <>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-20" />)}</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-4xl mb-2">🎉</p>
                <p className="font-extrabold text-gray-900">No pending requests</p>
                <p className="text-sm text-gray-400">All token requests have been reviewed</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req: any) => (
                  <div key={req.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-gray-900 text-sm">{req.vendor?.businessName}</span>
                        <span className="text-amber-600 font-extrabold">+{req.requestedAmount.toLocaleString()} tokens</span>
                      </div>
                      {req.reason && <p className="text-xs text-gray-500 mt-1">Reason: {req.reason}</p>}
                      <p className="text-[10px] text-gray-300 mt-1">{new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => { setReviewModal({ req, action: 'approve' }); setAdminNote(''); }}
                        disabled={actionId === req.id}
                        className="text-xs font-bold bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                        ✅ Approve
                      </button>
                      <button onClick={() => { setReviewModal({ req, action: 'reject' }); setAdminNote(''); }}
                        disabled={actionId === req.id}
                        className="text-xs font-bold bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'wallets' && (
          <div className="space-y-3">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-16" />)
            ) : wallets.map((w: any) => (
              <div key={w.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900 text-sm">{w.vendor?.businessName}</p>
                  <p className="text-xs text-gray-400">Earned: {w.totalEarned?.toLocaleString()} · Spent: {w.totalSpent?.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-amber-600 font-extrabold text-lg">{w.balance?.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">tokens</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-extrabold text-gray-900 mb-1 capitalize">{reviewModal.action} Request</h3>
            <p className="text-sm text-gray-500 mb-1">{reviewModal.req.vendor?.businessName}</p>
            <p className="text-amber-600 font-extrabold mb-4">+{reviewModal.req.requestedAmount.toLocaleString()} tokens</p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-600 mb-1">Note to Vendor</label>
              <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
                placeholder={reviewModal.action === 'approve' ? 'Optional note...' : 'Reason for rejection...'}
                rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleReview} disabled={!!actionId}
                className={`flex-1 text-white font-bold py-2.5 rounded-xl transition text-sm disabled:opacity-50 ${
                  reviewModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}>
                {actionId ? '...' : `${reviewModal.action === 'approve' ? 'Approve & Grant' : 'Reject'}`}
              </button>
              <button onClick={() => setReviewModal(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-5 rounded-xl transition text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
