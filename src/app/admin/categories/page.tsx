'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { categoriesApi } from '@/lib/api';
import { Category } from '@/types';

const EMPTY_FORM = {
  name: '', slug: '', seoPlural: '', description: '', icon: '',
  type: 'service' as 'service' | 'event', sortOrder: 0, isActive: true,
};

function CategoryForm({
  initial, onSave, onCancel,
}: { initial: typeof EMPTY_FORM; onSave: (data: typeof EMPTY_FORM) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(form);
    } catch (err: unknown) {
      setError((err as Error).message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 rounded-2xl p-5 border border-gray-200">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Name *</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400"
            placeholder="e.g. Photography" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Slug</label>
          <input value={form.slug} onChange={(e) => set('slug', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400"
            placeholder="auto-generated if blank" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">
            SEO Plural <span className="text-gray-400 font-normal">(for URLs like /photographers-in-noida)</span>
          </label>
          <input value={form.seoPlural} onChange={(e) => set('seoPlural', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400"
            placeholder="e.g. photographers" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Icon (emoji)</label>
          <input value={form.icon} onChange={(e) => set('icon', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400"
            placeholder="e.g. 📷" maxLength={4} />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Type</label>
          <select value={form.type} onChange={(e) => set('type', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400 bg-white">
            <option value="service">Service</option>
            <option value="event">Event</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Sort Order</label>
          <input type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400"
            min={0} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1">Description</label>
        <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400 resize-none"
          rows={2} placeholder="Short description shown on category cards" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)}
          className="w-4 h-4 accent-red-500" />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active (visible on site)</label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving}
          className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-5 py-2 rounded-xl disabled:opacity-50 transition">
          {saving ? 'Saving…' : 'Save Category'}
        </button>
        <button type="button" onClick={onCancel}
          className="text-sm font-semibold px-5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    setLoading(true);
    try {
      const data = await categoriesApi.getAll();
      setCategories((data as unknown) as Category[]);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (form: typeof EMPTY_FORM) => {
    await categoriesApi.create(form);
    showToast('Category created ✅');
    setCreating(false);
    load();
  };

  const handleUpdate = async (id: number, form: typeof EMPTY_FORM) => {
    await categoriesApi.update(id, form);
    showToast('Category updated ✅');
    setEditId(null);
    load();
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Deactivate "${name}"? It will be hidden from the site.`)) return;
    try {
      await categoriesApi.remove(id);
      showToast(`"${name}" deactivated`);
      load();
    } catch (e: unknown) {
      showToast((e as Error).message || 'Delete failed');
    }
  };

  return (
    <AdminLayout>
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>}

      <div className="p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Categories 🗂️</h1>
            <p className="text-sm text-gray-500 mt-1">Manage service and event categories. Set seoPlural to control URL slugs.</p>
          </div>
          {!creating && (
            <button onClick={() => setCreating(true)}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition">
              + Add Category
            </button>
          )}
        </div>

        {creating && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-700 mb-3">New Category</h2>
            <CategoryForm initial={EMPTY_FORM} onSave={handleCreate} onCancel={() => setCreating(false)} />
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.id}>
                {editId === cat.id ? (
                  <CategoryForm
                    initial={{
                      name: cat.name,
                      slug: cat.slug,
                      seoPlural: cat.seoPlural || '',
                      description: cat.description || '',
                      icon: cat.icon || '',
                      type: cat.type,
                      sortOrder: cat.sortOrder ?? 0,
                      isActive: cat.isActive !== false,
                    }}
                    onSave={(form) => handleUpdate(cat.id, form)}
                    onCancel={() => setEditId(null)}
                  />
                ) : (
                  <div className={`flex items-center gap-3 bg-white border rounded-xl px-4 py-3 ${cat.isActive === false ? 'opacity-50 border-gray-100' : 'border-gray-200'}`}>
                    <span className="text-2xl w-8 text-center">{cat.icon || '📁'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm">{cat.name}</span>
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{cat.slug}</span>
                        {cat.seoPlural && (
                          <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-mono">/{cat.seoPlural}-in-*</span>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${cat.type === 'event' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {cat.type}
                        </span>
                        {cat.isActive === false && (
                          <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-semibold">inactive</span>
                        )}
                      </div>
                      {cat.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{cat.description}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setEditId(cat.id)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(cat.id, cat.name)}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
                        {cat.isActive === false ? 'Delete' : 'Deactivate'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
