'use client';

import { useEffect, useState, useCallback } from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { vendorPanelApi } from '@/lib/api';

export default function WalletSection({ vendorId }: { vendorId?: number }) {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txMeta, setTxMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [txPage, setTxPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [w, txRes]: [any, any] = await Promise.all([
        vendorPanelApi.getWallet(),
        vendorPanelApi.getTransactions(txPage),
      ]);
      setWallet(w);
      setTransactions(txRes.data ?? []);
      setTxMeta(txRes.meta);
    } finally {
      setLoading(false);
    }
  }, [txPage]);

  useEffect(() => { load(); }, [load]);

  const REASON_LABELS: Record<string, string> = {
    signup_bonus: 'Signup Bonus',
    monthly_grant: 'Monthly Grant',
    admin_grant: 'Admin Grant',
    admin_deduct: 'Admin Deduction',
    post_event: 'Post Event',
    boost_event: 'Boost Event',
    boost_package: 'Boost Package',
    lead_unlock: 'Lead Unlock',
    featured_listing: 'Featured Listing',
    purchase: 'Purchase',
    refund: 'Refund',
  };

  if (loading) {
    return <div className="space-y-4 animate-pulse">{[1,2].map(i => <div key={i} className="h-40 rounded-2xl bg-gray-100" />)}</div>;
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Wallet card */}
      <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-red-200" />
            <span className="text-red-200 text-sm font-medium">Token Wallet</span>
          </div>
          <button onClick={load} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
            <RefreshCw className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-5xl font-bold">{wallet?.balance?.toLocaleString('en-IN') ?? 0}</p>
        <p className="text-red-200 mt-1 text-sm">tokens available</p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-red-200">Total Earned</p>
            <p className="text-xl font-bold mt-0.5">{wallet?.totalEarned?.toLocaleString('en-IN') ?? 0}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-red-200">Total Spent</p>
            <p className="text-xl font-bold mt-0.5">{wallet?.totalSpent?.toLocaleString('en-IN') ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-700">
        <strong>How tokens work:</strong> Free plan vendors spend 50 tokens per lead unlock. Upgrade to Pro to connect with unlimited leads at no token cost.
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Transaction History</h3>
        </div>
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No transactions yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    tx.type === 'credit' ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    {tx.type === 'credit'
                      ? <ArrowUpRight className="w-4 h-4 text-green-600" />
                      : <ArrowDownRight className="w-4 h-4 text-red-600" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {REASON_LABELS[tx.reason] ?? tx.reason}
                    </p>
                    <p className="text-xs text-gray-400">
                      Balance after: {tx.balanceAfter?.toLocaleString('en-IN')} • {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        )}
        {txMeta && txMeta.total > txMeta.limit && (
          <div className="flex items-center justify-center gap-3 p-4 border-t border-gray-100">
            <button
              onClick={() => setTxPage(p => Math.max(1, p - 1))}
              disabled={txPage === 1}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-50 hover:bg-gray-50"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-500">Page {txPage}</span>
            <button
              onClick={() => setTxPage(p => p + 1)}
              disabled={txPage * txMeta.limit >= txMeta.total}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-50 hover:bg-gray-50"
            >
              Next ��
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
