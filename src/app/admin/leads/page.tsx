'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminApi } from '@/lib/api';

/* ── Constants ────────────────────────────────────────────────────────────── */

const STATUS_CFG: Record<string, { bg: string; text: string; label: string }> = {
  new:       { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'New' },
  viewed:    { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Viewed' },
  contacted: { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Contacted' },
  converted: { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Converted' },
  rejected:  { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Rejected' },
};
const ALL_STATUSES = Object.keys(STATUS_CFG);
const ALL_SOURCES = ['search', 'vendor_profile', 'event_plan', 'seo_page', 'direct'];

/* ── Lead Detail Drawer ───────────────────────────────────────────────────── */

function LeadDetailDrawer({ leadId, onClose, onUpdate }: { leadId: number; onClose: () => void; onUpdate: () => void }) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data: any = await adminApi.getLeadDetail(leadId);
      setDetail(data);
    } catch {}
    setLoading(false);
  }, [leadId]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (siblingId: number, status: string) => {
    setActionLoading(`status-${siblingId}`);
    try {
      await adminApi.updateLeadStatus(siblingId, status);
      showToast('Status updated');
      load();
      onUpdate();
    } catch { showToast('Failed to update status'); }
    setActionLoading(null);
  };

  const handleAssign = async () => {
    if (!selectedVendorId) return;
    setAssigning(true);
    try {
      const res: any = await adminApi.assignLeadToVendor(leadId, Number(selectedVendorId));
      if (res?.success) {
        showToast('Lead assigned to vendor successfully!');
        setSelectedVendorId('');
        load();
        onUpdate();
      } else {
        showToast(res?.message || 'Assignment failed');
      }
    } catch (e: any) {
      showToast(e?.message || 'Assignment failed');
    }
    setAssigning(false);
  };

  const handleUnassign = async (siblingId: number) => {
    setActionLoading(`unassign-${siblingId}`);
    try {
      await adminApi.unassignLead(siblingId);
      showToast('Lead unassigned');
      load();
      onUpdate();
    } catch { showToast('Failed to unassign'); }
    setActionLoading(null);
  };

  const lead = detail?.lead;
  const siblings: any[] = detail?.siblings || [];
  const eligibleVendors: any[] = detail?.eligibleVendors || [];

  // Vendors already assigned (from siblings)
  const assignedVendorIds = new Set(siblings.filter((s) => s.vendorId).map((s) => s.vendorId));
  const unassignedEligible = eligibleVendors.filter((v) => !assignedVendorIds.has(v.id));

  return (
    <div
      className="fixed inset-0 z-[200] flex"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onMouseDown={onClose}
    >
      <div
        className="ml-auto w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {toast && (
          <div className="fixed top-4 right-4 z-[300] bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-extrabold text-gray-900 text-lg">Lead Detail #{leadId}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition text-lg"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : !lead ? (
          <div className="p-6 text-center text-gray-500">Lead not found</div>
        ) : (
          <div className="p-6 space-y-6">

            {/* Contact Info */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Information</h3>
              <div className="bg-gray-50 rounded-2xl p-4 grid grid-cols-2 gap-3">
                {[
                  { label: 'Name', value: lead.contactName },
                  { label: 'Phone', value: lead.contactPhone, link: `tel:+91${lead.contactPhone}` },
                  { label: 'Email', value: lead.contactEmail || '—' },
                  { label: 'Source', value: lead.source?.replace(/_/g, ' ') || '—' },
                  { label: 'City', value: lead.city?.name || '—' },
                  { label: 'Category', value: lead.category?.name || '—' },
                  { label: 'Budget', value: lead.budget ? `₹${Number(lead.budget).toLocaleString()}` : '—' },
                  { label: 'Guests', value: lead.guestCount || '—' },
                  { label: 'Event Date', value: lead.eventDate ? new Date(lead.eventDate).toLocaleDateString('en-IN') : '—' },
                  { label: 'Quality Score', value: `${lead.qualityScore}/100` },
                ].map((f) => (
                  <div key={f.label}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{f.label}</p>
                    {f.link ? (
                      <a href={f.link} className="text-sm font-semibold text-blue-600 hover:underline">{f.value}</a>
                    ) : (
                      <p className="text-sm font-semibold text-gray-800 capitalize">{f.value}</p>
                    )}
                  </div>
                ))}
              </div>
              {lead.requirement && (
                <div className="mt-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Requirement</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{lead.requirement}</p>
                </div>
              )}
              {(lead as any).groupId && (
                <p className="mt-2 text-xs text-purple-600 font-semibold">
                  Multi-vendor batch · Group: {(lead as any).groupId?.slice(0, 8)}…
                </p>
              )}
            </section>

            {/* Assigned Vendors */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Assigned Vendors ({siblings.filter((s) => s.vendorId).length})
              </h3>
              {siblings.filter((s) => s.vendorId).length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700 text-center">
                  No vendor assigned yet. Use the panel below to assign.
                </div>
              ) : (
                <div className="space-y-2">
                  {siblings.filter((s) => s.vendorId).map((s: any) => {
                    const cfg = STATUS_CFG[s.status] || STATUS_CFG.new;
                    const isMain = s.id === lead.id;
                    return (
                      <div key={s.id} className={`border rounded-2xl p-4 ${isMain ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-white'}`}>
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-900 text-sm">{s.vendor?.businessName || `Vendor #${s.vendorId}`}</span>
                              {isMain && <span className="text-[10px] bg-blue-100 text-blue-600 font-bold px-2 py-0.5 rounded-full">This lead</span>}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                              {s.isUnlocked && <span className="text-[10px] text-green-600 font-bold">🔓 Unlocked</span>}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {s.vendor?.city?.name} · Lead #{s.id} · {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap shrink-0">
                            {/* Quick status */}
                            <select
                              value={s.status}
                              disabled={actionLoading === `status-${s.id}`}
                              onChange={(e) => handleStatusChange(s.id, e.target.value)}
                              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-400 bg-white"
                            >
                              {ALL_STATUSES.map((st) => (
                                <option key={st} value={st}>{STATUS_CFG[st].label}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleUnassign(s.id)}
                              disabled={actionLoading === `unassign-${s.id}`}
                              className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1.5 rounded-lg hover:bg-red-50 transition"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Assign to New Vendor */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Assign to Vendor ({unassignedEligible.length} eligible)
              </h3>
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex gap-2">
                  <select
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-400 bg-white"
                  >
                    <option value="">— Select vendor —</option>
                    {unassignedEligible.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.businessName} · {v.city?.name} · {v.plan}
                      </option>
                    ))}
                    {unassignedEligible.length === 0 && (
                      <option disabled>All eligible vendors already assigned</option>
                    )}
                  </select>
                  <button
                    onClick={handleAssign}
                    disabled={!selectedVendorId || assigning}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition disabled:opacity-50 shrink-0"
                  >
                    {assigning ? '...' : 'Assign'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  The same lead can be assigned to multiple vendors. Each vendor sees it independently.
                </p>
              </div>
            </section>

            {/* History */}
            {detail.history?.length > 1 && (
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Contact History ({detail.history.length} leads from this number)
                </h3>
                <div className="space-y-1.5">
                  {detail.history.slice(0, 5).map((h: any) => {
                    const cfg = STATUS_CFG[h.status] || STATUS_CFG.new;
                    return (
                      <div key={h.id} className="flex items-center gap-3 text-xs bg-gray-50 rounded-xl px-3 py-2">
                        <span className="text-gray-400">#{h.id}</span>
                        <span className="font-semibold text-gray-700 truncate flex-1">{h.vendor?.businessName || 'Unassigned'}</span>
                        <span className={`font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                        <span className="text-gray-400 shrink-0">{new Date(h.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────────── */

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>({});
  const [filters, setFilters] = useState({ status: '', source: '' });
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const [seeding, setSeeding] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await adminApi.getLeads(page, {
        status: filters.status || undefined,
        source: filters.source || undefined,
      });
      setLeads(res?.data || []);
      setMeta(res?.meta || {});
    } catch {}
    setLoading(false);
  }, [page, filters]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  useEffect(() => {
    adminApi.getLeadAnalytics().then((d: any) => setAnalytics(d)).catch(() => {});
  }, []);

  const handleFilterChange = (key: string, val: string) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  const handleSeed = async () => {
    if (!confirm('Seed fake leads and packages for testing? This will only run if less than 10 leads exist.')) return;
    setSeeding(true);
    try {
      const res: any = await adminApi.seedLeads();
      if (res?.success) {
        showToast(`Seeded ${res.leads} leads and ${res.packages} packages!`);
        fetchLeads();
        adminApi.getLeadAnalytics().then((d: any) => setAnalytics(d)).catch(() => {});
      } else {
        showToast(res?.message || 'Seed failed');
      }
    } catch (e: any) {
      showToast(e?.message || 'Seed failed');
    }
    setSeeding(false);
  };

  return (
    <AdminLayout>
      {toast && (
        <div className="fixed top-4 right-4 z-[9999] bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      <div className="p-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Leads Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">{meta.total || 0} total leads across the platform</p>
          </div>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="text-sm font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-4 py-2 rounded-xl transition disabled:opacity-50"
          >
            {seeding ? 'Seeding...' : '🌱 Seed Test Leads'}
          </button>
        </div>

        {/* Analytics Strip */}
        {analytics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <p className="text-2xl font-extrabold text-gray-900">{analytics.total || 0}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Total Leads</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
              <p className="text-2xl font-extrabold text-green-700">{analytics.converted || 0}</p>
              <p className="text-xs text-green-600 font-medium mt-0.5">Converted</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <p className="text-2xl font-extrabold text-blue-700">{analytics.conversionRate || 0}%</p>
              <p className="text-xs text-blue-600 font-medium mt-0.5">Conversion Rate</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-2xl font-extrabold text-amber-700">
                {(analytics.byStatus?.find((s: any) => s.status === 'new')?.count) || 0}
              </p>
              <p className="text-xs text-amber-600 font-medium mt-0.5">New (unread)</p>
            </div>
          </div>
        )}

        {/* Status quick-filter pills */}
        {analytics?.byStatus && (
          <div className="flex gap-2 flex-wrap mb-4">
            <button
              onClick={() => handleFilterChange('status', '')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                !filters.status ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              All · {analytics.total}
            </button>
            {analytics.byStatus.map((s: any) => {
              const cfg = STATUS_CFG[s.status] || STATUS_CFG.new;
              return (
                <button
                  key={s.status}
                  onClick={() => handleFilterChange('status', filters.status === s.status ? '' : s.status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    filters.status === s.status
                      ? `${cfg.bg} ${cfg.text} border-current`
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {cfg.label} · {s.count}
                </button>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 flex-wrap mb-5">
          <select
            value={filters.source}
            onChange={(e) => handleFilterChange('source', e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400 bg-white"
          >
            <option value="">All Sources</option>
            {ALL_SOURCES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          {(filters.status || filters.source) && (
            <button
              onClick={() => { setFilters({ status: '', source: '' }); setPage(1); }}
              className="text-xs text-red-600 font-semibold hover:underline px-2"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Lead list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-24" />)}
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-extrabold text-gray-900 mb-1">No leads found</p>
            <p className="text-sm text-gray-400">Try adjusting filters or seed test data above</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-6">
              {leads.map((lead: any) => {
                const cfg = STATUS_CFG[lead.status] || STATUS_CFG.new;
                const isUnassigned = !lead.vendorId;

                return (
                  <div
                    key={lead.id}
                    className={`bg-white border rounded-2xl p-4 hover:shadow-sm transition cursor-pointer ${
                      isUnassigned ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'
                    }`}
                    onClick={() => setSelectedLeadId(lead.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-gray-900 text-sm">{lead.contactName}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                          {isUnassigned && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                              Unassigned
                            </span>
                          )}
                          {(lead as any).groupId && (
                            <span className="text-[10px] bg-purple-100 text-purple-600 font-semibold px-2 py-0.5 rounded-full">
                              Multi-vendor
                            </span>
                          )}
                          {lead.source && (
                            <span className="text-[10px] text-gray-400 capitalize">
                              {lead.source.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {lead.vendor?.businessName
                            ? <><span className="font-semibold text-gray-600">{lead.vendor.businessName}</span> · </>
                            : <span className="text-amber-600 font-semibold">No vendor assigned · </span>}
                          {lead.category?.name && `${lead.category.name} · `}
                          {lead.city?.name}
                        </p>
                        <div className="flex gap-3 mt-1.5 flex-wrap">
                          <span className="text-xs text-gray-500">{lead.contactPhone}</span>
                          {lead.budget && <span className="text-xs text-gray-500">₹{Number(lead.budget).toLocaleString()}</span>}
                          {lead.guestCount && <span className="text-xs text-gray-500">{lead.guestCount} guests</span>}
                        </div>
                        {lead.requirement && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-1">{lead.requirement}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] text-gray-300">
                          {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1">Score: {lead.qualityScore}</p>
                        <p className="text-[10px] text-red-500 font-semibold mt-2">View →</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {meta.pages > 1 && (
              <div className="flex justify-center gap-2">
                {Array.from({ length: Math.min(meta.pages, 8) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-bold transition ${
                      p === page ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-red-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Lead detail drawer */}
      {selectedLeadId && (
        <LeadDetailDrawer
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
          onUpdate={fetchLeads}
        />
      )}
    </AdminLayout>
  );
}
