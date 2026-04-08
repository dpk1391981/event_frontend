'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/vendor/DashboardLayout';
import { tokensApi, vendorsApi, dealsApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/lib/api';

const LEAD_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  new:       { label: 'New',       bg: 'bg-blue-100',  text: 'text-blue-700' },
  viewed:    { label: 'Viewed',    bg: 'bg-gray-100',  text: 'text-gray-600' },
  contacted: { label: 'Contacted', bg: 'bg-amber-100', text: 'text-amber-700' },
  converted: { label: 'Converted', bg: 'bg-green-100', text: 'text-green-700' },
  rejected:  { label: 'Rejected',  bg: 'bg-red-100',   text: 'text-red-700' },
};

export default function LeadsPage() {
  const { user } = useAppStore();
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState<number | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const vendor: any = await vendorsApi.getMyProfile();
        const vId = vendor?.id;
        setVendorId(vId);
        const [leadsRes, wallet]: any[] = await Promise.all([
          api.get(`/leads/vendor/${vId}`),
          tokensApi.getWallet(vId),
        ]);
        setLeads(leadsRes?.data || leadsRes || []);
        setTokenBalance(wallet?.balance || 0);
      } catch {}
      setLoading(false);
    })();
  }, [user]);

  const convertToDeal = async (lead: any) => {
    if (!vendorId) return;
    setConverting(lead.id);
    try {
      await dealsApi.create(vendorId, {
        leadId: lead.id,
        title: `Deal from ${lead.contactName}`,
        notes: lead.requirement,
        value: lead.budget,
      });
      showToast('Lead converted to deal! 🤝');
    } catch (e: any) {
      showToast(e?.message || 'Failed to convert');
    }
    setConverting(null);
  };

  return (
    <DashboardLayout tokenBalance={tokenBalance}>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>
      )}
      <div className="p-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">Leads 📋</h1>
          <p className="text-gray-500 text-sm mt-0.5">Inquiries from potential customers</p>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
            {Object.entries(LEAD_STATUS_CONFIG).map(([status, cfg]) => (
              <div key={status} className={`${cfg.bg} rounded-xl p-3 text-center`}>
                <p className={`text-xl font-extrabold ${cfg.text}`}>{leads.filter(l => l.status === status).length}</p>
                <p className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-24" />)}
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">📋</div>
            <h3 className="font-extrabold text-gray-900 mb-2">No leads yet</h3>
            <p className="text-sm text-gray-500">Post events and get your vendor profile live to receive leads</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map((lead: any) => {
              const cfg = LEAD_STATUS_CONFIG[lead.status] || LEAD_STATUS_CONFIG.new;
              return (
                <div key={lead.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-gray-900 text-sm">{lead.contactName}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                        {lead.source && <span className="text-[10px] text-gray-400 capitalize">{lead.source.replace(/_/g, ' ')}</span>}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Phone</p>
                          <p className="text-xs text-gray-700 font-semibold">{lead.contactPhone}</p>
                        </div>
                        {lead.contactEmail && (
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Email</p>
                            <p className="text-xs text-gray-700 truncate">{lead.contactEmail}</p>
                          </div>
                        )}
                        {lead.budget && (
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Budget</p>
                            <p className="text-xs text-gray-700 font-semibold">₹{Number(lead.budget).toLocaleString()}</p>
                          </div>
                        )}
                        {lead.eventDate && (
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Event Date</p>
                            <p className="text-xs text-gray-700">{new Date(lead.eventDate).toLocaleDateString('en-IN')}</p>
                          </div>
                        )}
                      </div>
                      {lead.requirement && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{lead.requirement}</p>
                      )}
                      <p className="text-[10px] text-gray-300 mt-1">{new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <a href={`tel:${lead.contactPhone}`}
                        className="text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg transition">
                        📞 Call
                      </a>
                      {lead.status !== 'converted' && (
                        <button
                          onClick={() => convertToDeal(lead)}
                          disabled={converting === lead.id}
                          className="text-xs font-bold bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                          {converting === lead.id ? '...' : '→ Deal'}
                        </button>
                      )}
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
