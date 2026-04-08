'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminApi } from '@/lib/api';

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  new:       { bg: 'bg-blue-100',  text: 'text-blue-700' },
  viewed:    { bg: 'bg-gray-100',  text: 'text-gray-600' },
  contacted: { bg: 'bg-amber-100', text: 'text-amber-700' },
  converted: { bg: 'bg-green-100', text: 'text-green-700' },
  rejected:  { bg: 'bg-red-100',   text: 'text-red-700' },
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res: any = await adminApi.getLeads(page);
        setLeads(res?.data || []);
        setMeta(res?.meta || {});
      } catch {}
      setLoading(false);
    })();
  }, [page]);

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">Leads Monitoring 📋</h1>
          <p className="text-gray-500 text-sm mt-0.5">All leads across the platform · {meta.total || 0} total</p>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-20" />)}</div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-4xl mb-2">📋</p><p className="font-extrabold text-gray-900">No leads yet</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {leads.map((lead: any) => {
                const cfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
                return (
                  <div key={lead.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-gray-900 text-sm">{lead.contactName}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{lead.status}</span>
                          {lead.source && <span className="text-[10px] text-gray-400 capitalize">{lead.source.replace(/_/g, ' ')}</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Vendor: <span className="font-semibold text-gray-600">{lead.vendor?.businessName}</span>
                          {lead.category && ` · ${lead.category?.name}`}
                          {lead.city && ` · ${lead.city?.name}`}
                        </p>
                        <div className="flex gap-4 mt-1.5 flex-wrap">
                          <span className="text-xs text-gray-500">{lead.contactPhone}</span>
                          {lead.budget && <span className="text-xs text-gray-500">₹{Number(lead.budget).toLocaleString()}</span>}
                          {lead.guestCount && <span className="text-xs text-gray-500">{lead.guestCount} guests</span>}
                          {lead.eventDate && <span className="text-xs text-gray-500">{new Date(lead.eventDate).toLocaleDateString('en-IN')}</span>}
                        </div>
                        {lead.requirement && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{lead.requirement}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] text-gray-300">{new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                        <p className="text-xs font-bold text-gray-400 mt-1">Score: {lead.qualityScore}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {meta.pages > 1 && (
              <div className="flex justify-center gap-2">
                {Array.from({ length: meta.pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-bold transition ${p === page ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-red-300'}`}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
