'use client';

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminApi, tokensApi } from '@/lib/api';

const STATUS_TABS = ['all', 'pending', 'active', 'rejected', 'suspended'];
const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  pending:   { bg: 'bg-amber-100', text: 'text-amber-700' },
  active:    { bg: 'bg-green-100', text: 'text-green-700' },
  rejected:  { bg: 'bg-red-100',   text: 'text-red-700' },
  suspended: { bg: 'bg-gray-200',  text: 'text-gray-600' },
};

function AdminVendorsContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('status') || 'pending');
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [tokenModal, setTokenModal] = useState<any>(null);
  const [tokenForm, setTokenForm] = useState({ amount: 500, note: '' });
  const [rankModal, setRankModal] = useState<any>(null);
  const [rankForm, setRankForm] = useState({ rankWeight: 50, profileScore: 0 });
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await adminApi.getVendors(tab === 'all' ? undefined : tab);
      setVendors(res?.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [tab]);

  const approve  = async (id: number) => { setActionId(id); try { await adminApi.approveVendor(id); showToast('Vendor approved! ✅'); load(); } catch (e: any) { showToast(e?.message || 'Failed'); } setActionId(null); };
  const reject   = async (id: number) => { setActionId(id); try { await adminApi.rejectVendor(id); showToast('Vendor rejected'); load(); } catch (e: any) { showToast(e?.message || 'Failed'); } setActionId(null); };
  const suspend  = async (id: number) => { setActionId(id); try { await adminApi.suspendVendor(id); showToast('Vendor suspended'); load(); } catch (e: any) { showToast(e?.message || 'Failed'); } setActionId(null); };
  const featured = async (id: number) => { setActionId(id); try { await adminApi.toggleFeatured(id); showToast('Featured toggled'); load(); } catch (e: any) { showToast(e?.message || 'Failed'); } setActionId(null); };

  const grantTokens = async () => {
    if (!tokenModal) return;
    try {
      await tokensApi.adminGrant({ vendorId: tokenModal.id, amount: tokenForm.amount, note: tokenForm.note });
      showToast(`${tokenForm.amount} tokens granted to ${tokenModal.businessName}! 🪙`);
      setTokenModal(null);
    } catch (e: any) { showToast(e?.message || 'Failed'); }
  };

  const openRankModal = (v: any) => {
    setRankForm({ rankWeight: v.rankWeight ?? 50, profileScore: v.profileScore ?? 0 });
    setRankModal(v);
  };

  const saveRank = async () => {
    if (!rankModal) return;
    try {
      await adminApi.updateVendorRank(rankModal.id, rankForm);
      showToast('Rank updated ✅');
      setRankModal(null);
      load();
    } catch (e: any) { showToast(e?.message || 'Failed'); }
  };

  return (
    <div className="p-6 max-w-6xl">
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>}

      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Vendor Management 🏢</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit flex-wrap">
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-xs font-bold px-4 py-2 rounded-lg transition capitalize ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-28" />)}</div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-2">🏢</p>
          <p className="font-extrabold text-gray-900">No {tab} vendors</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vendors.map((v: any) => {
            const cfg = STATUS_CONFIG[v.status] || STATUS_CONFIG.pending;
            return (
              <div key={v.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex gap-4 hover:shadow-sm transition">
                <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                  {v.logo ? <img src={v.logo} alt="" className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center text-xl">🏢</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-gray-900 text-sm">{v.businessName}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} capitalize`}>{v.status}</span>
                    {v.isFeatured && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">⭐ Featured</span>}
                    {v.isVerified && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">✓ Verified</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {v.user?.email || v.user?.phone} · {v.city?.name}
                    {v.categories?.length > 0 && ` · ${v.categories.map((c: any) => c.name).join(', ')}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    ⭐ {v.rating} · {v.leadCount} leads · {v.profileViews} views
                  </p>
                  <p className="text-[10px] text-gray-300 mt-1">{new Date(v.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {v.status === 'pending' && (
                    <button onClick={() => approve(v.id)} disabled={actionId === v.id}
                      className="text-xs font-bold bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg transition disabled:opacity-50">✅ Approve</button>
                  )}
                  {v.status === 'pending' && (
                    <button onClick={() => reject(v.id)} disabled={actionId === v.id}
                      className="text-xs font-bold bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg transition disabled:opacity-50">❌ Reject</button>
                  )}
                  {v.status === 'active' && (
                    <button onClick={() => suspend(v.id)} disabled={actionId === v.id}
                      className="text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition disabled:opacity-50">⏸ Suspend</button>
                  )}
                  <button onClick={() => featured(v.id)} disabled={actionId === v.id}
                    className="text-xs font-bold bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                    {v.isFeatured ? '★ Unfeature' : '⭐ Feature'}
                  </button>
                  <button onClick={() => setTokenModal(v)}
                    className="text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-700 px-3 py-1.5 rounded-lg transition">
                    🪙 Tokens
                  </button>
                  <button onClick={() => openRankModal(v)}
                    className="text-xs font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg transition">
                    ⚡ Rank {v.rankWeight ?? 50}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rank / Score modal */}
      {rankModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-extrabold text-gray-900 mb-1">Rank &amp; Score</h3>
            <p className="text-sm text-gray-500 mb-4">{rankModal.businessName}</p>
            <div className="space-y-4 mb-5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-600">Rank Weight (0–100)</label>
                  <span className="text-xs font-extrabold text-indigo-600">{rankForm.rankWeight}</span>
                </div>
                <input type="range" min={0} max={100} value={rankForm.rankWeight}
                  onChange={e => setRankForm(f => ({ ...f, rankWeight: +e.target.value }))}
                  className="w-full accent-indigo-600" />
                <p className="text-[10px] text-gray-400 mt-1">Higher = boosted in search &amp; event plan results. Default 50 = neutral.</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-600">Profile Score Override (0–100)</label>
                  <span className="text-xs font-extrabold text-purple-600">{rankForm.profileScore}</span>
                </div>
                <input type="range" min={0} max={100} value={rankForm.profileScore}
                  onChange={e => setRankForm(f => ({ ...f, profileScore: +e.target.value }))}
                  className="w-full accent-purple-600" />
                <p className="text-[10px] text-gray-400 mt-1">Affects match score in event plan &amp; search. 0 = use vendor&apos;s own score.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={saveRank}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition text-sm">
                Save Rank ⚡
              </button>
              <button onClick={() => setRankModal(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-5 rounded-xl transition text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Token grant modal */}
      {tokenModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-extrabold text-gray-900 mb-1">Grant Tokens</h3>
            <p className="text-sm text-gray-500 mb-4">to {tokenModal.businessName}</p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Amount</label>
                <input type="number" value={tokenForm.amount}
                  onChange={e => setTokenForm({...tokenForm, amount: +e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Note (optional)</label>
                <input type="text" value={tokenForm.note}
                  onChange={e => setTokenForm({...tokenForm, note: e.target.value})}
                  placeholder="Reason for granting"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={grantTokens}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition text-sm">
                Grant Tokens 🪙
              </button>
              <button onClick={() => setTokenModal(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-5 rounded-xl transition text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminVendorsPage() {
  return (
    <AdminLayout>
      <Suspense>
        <AdminVendorsContent />
      </Suspense>
    </AdminLayout>
  );
}
