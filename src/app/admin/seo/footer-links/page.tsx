'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { seoAdminApi } from '@/lib/api';

interface FooterLink {
  id: number;
  anchorText: string;
  targetUrl: string;
  groupType: string;
  groupValue?: string;
  groupLabel?: string;
  priority: number;
  isActive: boolean;
}

const EMPTY_FORM = {
  anchorText: '',
  targetUrl: '',
  groupType: 'category',
  groupValue: '',
  groupLabel: '',
  priority: 0,
  isActive: true,
};

export default function AdminFooterLinks() {
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await seoAdminApi.listFooterLinks();
      setLinks(res.data || []);
      setTotal(res.total || 0);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ ...EMPTY_FORM }); setEditId(null); setShowForm(true); setError(''); };
  const openEdit = (link: FooterLink) => {
    setForm({
      anchorText: link.anchorText,
      targetUrl: link.targetUrl,
      groupType: link.groupType,
      groupValue: link.groupValue || '',
      groupLabel: link.groupLabel || '',
      priority: link.priority,
      isActive: link.isActive,
    });
    setEditId(link.id);
    setShowForm(true);
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editId) {
        await seoAdminApi.updateFooterLink(editId, form);
      } else {
        await seoAdminApi.createFooterLink(form);
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err?.message || 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async (id: number, text: string) => {
    if (!confirm(`Delete "${text}"?`)) return;
    try {
      await seoAdminApi.deleteFooterLink(id);
      load();
    } catch { /* ignore */ }
  };

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  // Group links by groupLabel for display
  const grouped: Record<string, FooterLink[]> = {};
  for (const link of links) {
    const key = link.groupLabel || link.groupValue || link.groupType;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(link);
  }

  const GROUP_TYPE_COLORS: Record<string, string> = {
    category: 'bg-blue-100 text-blue-700',
    city: 'bg-green-100 text-green-700',
    custom: 'bg-gray-100 text-gray-600',
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/admin/seo" className="text-gray-400 hover:text-gray-700 text-sm">SEO Manager</Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-700 text-sm font-semibold">Footer Links</span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">SEO Footer Links</h1>
            <p className="text-gray-500 text-sm mt-1">{total} links — grouped by category/city for footer SEO</p>
          </div>
          <button onClick={openNew} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition">
            + Add Link
          </button>
        </div>

        {/* Sub-nav */}
        <div className="flex gap-2 mb-5 border-b border-gray-200 pb-3">
          <Link href="/admin/seo" className="text-sm text-gray-500 hover:text-gray-800 px-1">SEO Pages</Link>
          <Link href="/admin/seo/footer-links" className="text-sm font-semibold text-red-600 border-b-2 border-red-600 pb-1 px-1">Footer Links</Link>
        </div>

        {/* Add/Edit form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="font-extrabold text-gray-900 mb-4">{editId ? 'Edit Link' : 'Add New Footer Link'}</h2>
            {error && <div className="mb-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">{error}</div>}
            <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Anchor Text <span className="text-red-500">*</span></label>
                <input required type="text" value={form.anchorText} onChange={(e) => set('anchorText', e.target.value)} placeholder="Photographers in Noida" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400" />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Target URL <span className="text-red-500">*</span></label>
                <input required type="text" value={form.targetUrl} onChange={(e) => set('targetUrl', e.target.value)} placeholder="/photographers-in-noida" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 font-mono" />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Group Type</label>
                <select value={form.groupType} onChange={(e) => set('groupType', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400">
                  <option value="category">Category</option>
                  <option value="city">City</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Group Value</label>
                <input type="text" value={form.groupValue} onChange={(e) => set('groupValue', e.target.value)} placeholder="photography / noida / featured" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400" />
                <p className="text-[11px] text-gray-400 mt-1">Internal key for grouping, e.g. "photography"</p>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Group Label</label>
                <input type="text" value={form.groupLabel} onChange={(e) => set('groupLabel', e.target.value)} placeholder="Photography / Noida / Popular" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400" />
                <p className="text-[11px] text-gray-400 mt-1">Display heading shown in footer above the group</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Priority</label>
                  <input type="number" min={0} value={form.priority} onChange={(e) => set('priority', +e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`} onClick={() => set('isActive', !form.isActive)}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                    <span className="text-sm text-gray-600">Active</span>
                  </label>
                </div>
              </div>
              <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl transition">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2 text-sm font-extrabold bg-red-600 hover:bg-red-700 text-white rounded-xl transition disabled:opacity-50">
                  {saving ? 'Saving...' : editId ? 'Update Link' : 'Add Link'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Links grouped view */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-32" />)}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400">
            <p className="text-lg font-semibold mb-2">No footer links yet</p>
            <p className="text-sm mb-4">Go back to SEO Pages and click "Seed Defaults" to add initial links.</p>
            <button onClick={openNew} className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-700 transition">Add First Link</button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(grouped).map(([groupLabel, groupLinks]) => (
              <div key={groupLabel} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-extrabold text-gray-900 text-sm">{groupLabel}</h3>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${GROUP_TYPE_COLORS[groupLinks[0]?.groupType || 'custom']}`}>
                    {groupLinks[0]?.groupType}
                  </span>
                </div>
                <ul className="space-y-2">
                  {groupLinks.map((link) => (
                    <li key={link.id} className={`flex items-center justify-between text-xs p-2 rounded-lg ${link.isActive ? 'bg-gray-50' : 'bg-gray-50 opacity-50'}`}>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-700 truncate">{link.anchorText}</p>
                        <p className="font-mono text-gray-400 truncate text-[10px]">{link.targetUrl}</p>
                      </div>
                      <div className="flex gap-1 ml-2 shrink-0">
                        <button onClick={() => openEdit(link)} className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition">Edit</button>
                        <button onClick={() => handleDelete(link.id, link.anchorText)} className="px-2 py-1 text-red-500 hover:bg-red-50 rounded-lg transition">×</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
