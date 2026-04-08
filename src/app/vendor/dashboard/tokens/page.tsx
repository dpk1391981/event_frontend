'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/vendor/DashboardLayout';
import { tokensApi, vendorsApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

const TX_REASON_LABEL: Record<string, string> = {
  signup_bonus:     'Welcome Bonus',
  monthly_grant:    'Monthly Grant',
  admin_grant:      'Admin Credit',
  admin_deduct:     'Admin Deduction',
  post_event:       'Event Post',
  boost_event:      'Event Boost',
  featured_listing: 'Featured Listing',
  purchase:         'Token Purchase',
  refund:           'Refund',
};

export default function TokensPage() {
  const { user } = useAppStore();
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [form, setForm] = useState({ requestedAmount: 500, reason: '' });
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const vendor: any = await vendorsApi.getMyProfile();
        const vId = vendor?.id;
        setVendorId(vId);
        const [w, tx, reqs]: any[] = await Promise.all([
          tokensApi.getWallet(vId),
          tokensApi.getTransactions(vId),
          tokensApi.getMyRequests(vId),
        ]);
        setWallet(w);
        setTransactions(tx?.data || []);
        setRequests(reqs || []);
      } catch {}
      setLoading(false);
    })();
  }, [user]);

  const handleRequest = async () => {
    if (!vendorId || form.requestedAmount < 1) return;
    setRequesting(true);
    try {
      await tokensApi.requestTokens(vendorId, form);
      const reqs: any = await tokensApi.getMyRequests(vendorId);
      setRequests(reqs || []);
      setShowForm(false);
      setToast('Token request submitted! Admin will review shortly.');
      setTimeout(() => setToast(''), 3000);
    } catch (e: any) {
      setToast(e?.message || 'Failed to submit request');
    }
    setRequesting(false);
  };

  return (
    <DashboardLayout tokenBalance={wallet?.balance || 0}>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>
      )}

      <div className="p-6 max-w-4xl">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Token Management 🪙</h1>

        {/* Wallet summary */}
        {loading ? (
          <div className="animate-pulse bg-gray-100 rounded-2xl h-32 mb-6" />
        ) : (
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Available Balance', value: wallet?.balance ?? 0, icon: '🪙', bg: 'from-amber-400 to-orange-500' },
              { label: 'Total Earned', value: wallet?.totalEarned ?? 0, icon: '⬆️', bg: 'from-green-400 to-emerald-500' },
              { label: 'Total Spent', value: wallet?.totalSpent ?? 0, icon: '⬇️', bg: 'from-red-400 to-rose-500' },
            ].map((c) => (
              <div key={c.label} className={`bg-gradient-to-br ${c.bg} rounded-2xl p-5 text-white`}>
                <div className="text-2xl mb-2">{c.icon}</div>
                <div className="text-3xl font-extrabold">{c.value.toLocaleString()}</div>
                <div className="text-sm text-white/80 mt-1">{c.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Request tokens */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-extrabold text-gray-900">Request More Tokens</h2>
              <p className="text-sm text-gray-500 mt-0.5">Request additional tokens from admin for review</p>
            </div>
            <button onClick={() => setShowForm(!showForm)}
              className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition">
              + Request Tokens
            </button>
          </div>

          {showForm && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Amount Requested</label>
                <input
                  type="number"
                  min={1}
                  value={form.requestedAmount}
                  onChange={(e) => setForm({ ...form, requestedAmount: +e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Reason (optional)</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  rows={2}
                  placeholder="Why do you need additional tokens?"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleRequest} disabled={requesting}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-bold px-5 py-2 rounded-xl transition">
                  {requesting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2 rounded-xl transition">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Token requests history */}
        {requests.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
            <h2 className="font-extrabold text-gray-900 mb-4">Request History</h2>
            <div className="space-y-2">
              {requests.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="text-sm font-semibold text-gray-800">{r.requestedAmount.toLocaleString()} tokens</span>
                    {r.reason && <span className="text-xs text-gray-400 ml-2">· {r.reason}</span>}
                    {r.adminNote && <p className="text-xs text-gray-400 mt-0.5">Admin: {r.adminNote}</p>}
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    r.status === 'approved' ? 'bg-green-100 text-green-700' :
                    r.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction history */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-extrabold text-gray-900 mb-4">Transaction History</h2>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="animate-pulse h-12 bg-gray-100 rounded-xl" />)}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No transactions yet</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {tx.type === 'credit' ? '⬆️' : '⬇️'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{TX_REASON_LABEL[tx.reason] || tx.reason}</p>
                      <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-extrabold text-sm ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{tx.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">Balance: {tx.balanceAfter.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
