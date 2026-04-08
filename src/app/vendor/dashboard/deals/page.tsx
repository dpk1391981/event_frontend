'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/vendor/DashboardLayout';
import { tokensApi, vendorsApi, dealsApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

const STAGES = ['open', 'negotiation', 'proposal', 'closed_won', 'closed_lost'];
const STAGE_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  open:        { label: 'Open',        bg: 'bg-blue-100',  text: 'text-blue-700',  icon: '📂' },
  negotiation: { label: 'Negotiating', bg: 'bg-amber-100', text: 'text-amber-700', icon: '🤝' },
  proposal:    { label: 'Proposal',    bg: 'bg-purple-100',text: 'text-purple-700',icon: '📄' },
  closed_won:  { label: 'Won',         bg: 'bg-green-100', text: 'text-green-700', icon: '🏆' },
  closed_lost: { label: 'Lost',        bg: 'bg-red-100',   text: 'text-red-700',   icon: '❌' },
};

export default function DealsPage() {
  const { user } = useAppStore();
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [deals, setDeals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', notes: '', value: '', stage: 'open' });
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async (vId: number) => {
    const [dealsRes, dealStats, wallet]: any[] = await Promise.all([
      dealsApi.list(vId),
      dealsApi.stats(vId),
      tokensApi.getWallet(vId),
    ]);
    setDeals(dealsRes?.data || []);
    setStats(dealStats || {});
    setTokenBalance(wallet?.balance || 0);
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const vendor: any = await vendorsApi.getMyProfile();
        const vId = vendor?.id;
        setVendorId(vId);
        await load(vId);
      } catch {}
      setLoading(false);
    })();
  }, [user]);

  const updateStage = async (deal: any, stage: string) => {
    if (!vendorId) return;
    setUpdating(deal.id);
    try {
      await dealsApi.update(vendorId, deal.id, { stage });
      await load(vendorId);
    } catch (e: any) { showToast(e?.message || 'Failed'); }
    setUpdating(null);
  };

  const createDeal = async () => {
    if (!vendorId || !form.title) return;
    setCreating(true);
    try {
      await dealsApi.create(vendorId, { ...form, value: form.value ? +form.value : undefined });
      await load(vendorId);
      setForm({ title: '', notes: '', value: '', stage: 'open' });
      setShowCreate(false);
      showToast('Deal created!');
    } catch (e: any) { showToast(e?.message || 'Failed'); }
    setCreating(false);
  };

  return (
    <DashboardLayout tokenBalance={tokenBalance}>
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>}
      <div className="p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Deals 🤝</h1>
            <p className="text-gray-500 text-sm mt-0.5">Track your sales pipeline</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition">
            + New Deal
          </button>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {STAGES.map(s => {
              const cfg = STAGE_CONFIG[s];
              const key = s === 'open' ? 'open' : s === 'negotiation' ? 'negotiation' : s === 'closed_won' ? 'closedWon' : s === 'closed_lost' ? 'closedLost' : 'proposal';
              return (
                <div key={s} className={`${cfg.bg} rounded-xl p-3 text-center`}>
                  <p className="text-lg mb-0.5">{cfg.icon}</p>
                  <p className={`text-xl font-extrabold ${cfg.text}`}>{stats[key] || 0}</p>
                  <p className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</p>
                </div>
              );
            })}
          </div>
        )}

        {stats.totalRevenue > 0 && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-4 mb-6">
            <p className="text-green-100 text-xs font-semibold">Total Revenue (Won Deals)</p>
            <p className="text-3xl font-extrabold">₹{Number(stats.totalRevenue).toLocaleString()}</p>
          </div>
        )}

        {/* Create deal form */}
        {showCreate && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
            <h3 className="font-extrabold text-gray-900 mb-4">Create New Deal</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Deal title *" value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              <input type="number" placeholder="Deal value (₹)" value={form.value}
                onChange={e => setForm({...form, value: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              <textarea placeholder="Notes" value={form.notes} rows={2}
                onChange={e => setForm({...form, notes: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400" />
              <div className="flex gap-2">
                <button onClick={createDeal} disabled={creating || !form.title}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold px-5 py-2 rounded-xl transition">
                  {creating ? 'Creating...' : 'Create Deal'}
                </button>
                <button onClick={() => setShowCreate(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2 rounded-xl transition">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Deals kanban-style list */}
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-24" />)}</div>
        ) : deals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">🤝</div>
            <h3 className="font-extrabold text-gray-900 mb-2">No deals yet</h3>
            <p className="text-sm text-gray-500">Convert leads to deals or create manually</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deals.map((deal: any) => {
              const cfg = STAGE_CONFIG[deal.stage] || STAGE_CONFIG.open;
              return (
                <div key={deal.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg">{cfg.icon}</span>
                        <h3 className="font-extrabold text-gray-900 text-sm">{deal.title}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                      </div>
                      {deal.value && <p className="text-sm font-bold text-gray-700 mt-1">₹{Number(deal.value).toLocaleString()}</p>}
                      {deal.notes && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{deal.notes}</p>}
                      {deal.lead && (
                        <p className="text-xs text-gray-400 mt-1">
                          From: {deal.lead.contactName} · {deal.lead.contactPhone}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-300 mt-1">{new Date(deal.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className="shrink-0">
                      <select
                        value={deal.stage}
                        disabled={updating === deal.id}
                        onChange={e => updateStage(deal, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-400">
                        {STAGES.map(s => (
                          <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
