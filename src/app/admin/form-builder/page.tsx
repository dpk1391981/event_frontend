'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { formBuilderApi } from '@/lib/api';

const FIELD_TYPES = ['text', 'textarea', 'dropdown', 'multi_select', 'date', 'price', 'number', 'image', 'checkbox'];
const CATEGORIES = ['', 'wedding', 'corporate', 'birthday', 'sports', 'photography', 'catering', 'decoration', 'dj-music', 'makeup'];

const TYPE_ICON: Record<string, string> = {
  text: '✏️', textarea: '📝', dropdown: '▼', multi_select: '☑️',
  date: '📅', price: '💰', number: '#', image: '🖼️', checkbox: '✓',
};

const DEFAULT_FORM = {
  name: '', label: '', fieldType: 'text', categorySlug: '',
  isRequired: false, placeholder: '', helpText: '',
  options: '', sortOrder: 0,
};

export default function FormBuilderPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editField, setEditField] = useState<any>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [filterCat, setFilterCat] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    setLoading(true);
    try {
      const data: any = await formBuilderApi.adminGetAll();
      setFields(data?.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm(DEFAULT_FORM); setEditField(null); setShowForm(false); };

  const handleEdit = (field: any) => {
    setEditField(field);
    setForm({
      ...DEFAULT_FORM,
      ...field,
      categorySlug: field.categorySlug || '',
      options: Array.isArray(field.options) ? field.options.join('\n') : '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        options: form.options ? form.options.split('\n').map((s: string) => s.trim()).filter(Boolean) : undefined,
        categorySlug: form.categorySlug || undefined,
      };
      if (editField) {
        await formBuilderApi.adminUpdate(editField.id, payload);
        showToast('Field updated!');
      } else {
        await formBuilderApi.adminCreate(payload);
        showToast('Field created!');
      }
      resetForm();
      load();
    } catch (e: any) { showToast(e?.message || 'Failed'); }
    setSaving(false);
  };

  const handleToggle = async (id: number) => {
    try { await formBuilderApi.adminToggle(id); load(); } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this field?')) return;
    try { await formBuilderApi.adminDelete(id); showToast('Field deleted'); load(); } catch (e: any) { showToast(e?.message || 'Failed'); }
  };

  const handleSeed = async () => {
    try { await formBuilderApi.adminSeed(); showToast('Default fields seeded!'); load(); } catch {}
  };

  const filtered = filterCat === '' ? fields : fields.filter(f => (f.categorySlug || '') === filterCat);

  return (
    <AdminLayout>
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>}
      <div className="p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Form Builder 🔧</h1>
            <p className="text-gray-500 text-sm mt-0.5">Configure dynamic event form fields per category</p>
          </div>
          <div className="flex gap-2">
            {fields.length === 0 && (
              <button onClick={handleSeed}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold px-4 py-2.5 rounded-xl transition">
                Seed Defaults
              </button>
            )}
            <button onClick={() => { resetForm(); setShowForm(!showForm); }}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition">
              + Add Field
            </button>
          </div>
        </div>

        {/* Create/Edit form */}
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
            <h3 className="font-extrabold text-gray-900 mb-4">{editField ? 'Edit Field' : 'Add New Field'}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Field Name (key)</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="e.g. guest_count" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Display Label</label>
                <input type="text" value={form.label} onChange={e => setForm({...form, label: e.target.value})}
                  placeholder="e.g. Guest Count" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Field Type</label>
                <select value={form.fieldType} onChange={e => setForm({...form, fieldType: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
                  {FIELD_TYPES.map(t => <option key={t} value={t}>{TYPE_ICON[t]} {t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Category (blank = all)</label>
                <select value={form.categorySlug} onChange={e => setForm({...form, categorySlug: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
                  <option value="">All Categories (Global)</option>
                  {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Placeholder</label>
                <input type="text" value={form.placeholder} onChange={e => setForm({...form, placeholder: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Sort Order</label>
                <input type="number" value={form.sortOrder} onChange={e => setForm({...form, sortOrder: +e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
              {['dropdown', 'multi_select'].includes(form.fieldType) && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Options (one per line)</label>
                  <textarea value={form.options} onChange={e => setForm({...form, options: e.target.value})}
                    rows={4} placeholder="Option 1&#10;Option 2&#10;Option 3"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Help Text</label>
                <input type="text" value={form.helpText} onChange={e => setForm({...form, helpText: e.target.value})}
                  placeholder="Optional hint for vendors" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <input type="checkbox" id="required" checked={form.isRequired}
                  onChange={e => setForm({...form, isRequired: e.target.checked})}
                  className="w-4 h-4 accent-red-600" />
                <label htmlFor="required" className="text-sm font-bold text-gray-700 cursor-pointer">Required field</label>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleSave} disabled={saving || !form.name || !form.label}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition text-sm">
                {saving ? 'Saving...' : editField ? 'Update Field' : 'Create Field'}
              </button>
              <button onClick={resetForm}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-5 py-2.5 rounded-xl transition text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Filter by category */}
        <div className="flex gap-2 flex-wrap mb-4">
          <button onClick={() => setFilterCat('')}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${filterCat === '' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200'}`}>
            All
          </button>
          <button onClick={() => setFilterCat('')}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${filterCat === 'global' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200'}`}>
            Global
          </button>
          {CATEGORIES.filter(Boolean).map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium capitalize transition ${filterCat === c ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200'}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Fields list */}
        {loading ? (
          <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-14" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-4xl mb-2">🔧</p>
            <p className="font-extrabold text-gray-900 mb-2">No fields yet</p>
            <button onClick={handleSeed} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-5 py-2 rounded-xl transition">Seed Default Fields</button>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <div className="col-span-1">Type</div>
              <div className="col-span-2">Name</div>
              <div className="col-span-3">Label</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-1">Req</div>
              <div className="col-span-1">Order</div>
              <div className="col-span-2">Actions</div>
            </div>
            {filtered.map((field: any) => (
              <div key={field.id} className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-50 last:border-0 items-center ${!field.isActive ? 'opacity-40' : ''}`}>
                <div className="col-span-1 text-base">{TYPE_ICON[field.fieldType] || '?'}</div>
                <div className="col-span-2 text-xs font-mono text-gray-500 truncate">{field.name}</div>
                <div className="col-span-3 text-sm font-semibold text-gray-800 truncate">{field.label}</div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                    {field.categorySlug || 'global'}
                  </span>
                </div>
                <div className="col-span-1">
                  {field.isRequired && <span className="text-red-500 font-extrabold text-xs">*</span>}
                </div>
                <div className="col-span-1 text-xs text-gray-400">{field.sortOrder}</div>
                <div className="col-span-2 flex gap-1">
                  <button onClick={() => handleEdit(field)} className="text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded-lg transition">Edit</button>
                  <button onClick={() => handleToggle(field.id)} className="text-[10px] font-bold bg-gray-50 hover:bg-gray-100 text-gray-600 px-2 py-1 rounded-lg transition">
                    {field.isActive ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => handleDelete(field.id)} className="text-[10px] font-bold bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded-lg transition">Del</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
