'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Edit, Trash2, Zap, X, Save, Loader2, Package2,
  DollarSign, Tag, ChevronDown,
} from 'lucide-react';
import { packagesApi, categoriesApi } from '@/lib/api';

const PACKAGE_TAGS = ['BUDGET', 'STANDARD', 'PREMIUM', 'LUXURY'];
const PRICE_TYPES = ['FIXED', 'PER_PERSON'];

interface PackageForm {
  title: string;
  categoryId: string;
  price: string;
  priceType: string;
  description: string;
  includes: string;
  tag: string;
  minGuests: string;
  maxGuests: string;
}

const EMPTY_FORM: PackageForm = {
  title: '', categoryId: '', price: '', priceType: 'FIXED',
  description: '', includes: '', tag: 'STANDARD',
  minGuests: '', maxGuests: '',
};

function PackageModal({
  initial, categories, onSave, onClose,
}: {
  initial?: any;
  categories: any[];
  onSave: (data: PackageForm) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<PackageForm>(initial ? {
    title: initial.title ?? '',
    categoryId: initial.categoryId?.toString() ?? '',
    price: initial.price?.toString() ?? '',
    priceType: initial.priceType ?? 'FIXED',
    description: initial.description ?? '',
    includes: (initial.includes ?? []).join('\n'),
    tag: initial.tag ?? 'STANDARD',
    minGuests: initial.minGuests?.toString() ?? '',
    maxGuests: initial.maxGuests?.toString() ?? '',
  } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.title || !form.price) { setError('Title and price are required'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to save package');
    } finally {
      setSaving(false);
    }
  };

  const f = (key: keyof PackageForm, label: string, opts?: {
    type?: string; placeholder?: string; multiline?: boolean;
  }) => (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
      {opts?.multiline ? (
        <textarea
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          rows={3}
          placeholder={opts?.placeholder}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
        />
      ) : (
        <input
          type={opts?.type ?? 'text'}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={opts?.placeholder}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
        />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-900">{initial ? 'Edit Package' : 'New Package'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          {f('title', 'Package Title', { placeholder: 'e.g. Full Day Wedding Photography' })}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Category</label>
              <select
                value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Tag</label>
              <select
                value={form.tag}
                onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                {PACKAGE_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {f('price', 'Price (₹)', { type: 'number', placeholder: '25000' })}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Price Type</label>
              <select
                value={form.priceType}
                onChange={e => setForm(f => ({ ...f, priceType: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                {PRICE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {f('minGuests', 'Min Guests', { type: 'number', placeholder: '50' })}
            {f('maxGuests', 'Max Guests', { type: 'number', placeholder: '500' })}
          </div>
          {f('description', 'Description', { multiline: true, placeholder: 'What is included in this package...' })}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">What's Included (one per line)</label>
            <textarea
              value={form.includes}
              onChange={e => setForm(f => ({ ...f, includes: e.target.value }))}
              rows={4}
              placeholder={'8 hours of coverage\n2 photographers\n500 edited photos\nSame-day highlights'}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Package'}
          </button>
        </div>
      </div>
    </div>
  );
}

const TAG_COLORS: Record<string, string> = {
  BUDGET: 'bg-green-100 text-green-700',
  STANDARD: 'bg-blue-100 text-blue-700',
  PREMIUM: 'bg-purple-100 text-purple-700',
  LUXURY: 'bg-amber-100 text-amber-700',
};

export default function PackagesSection({ vendorId }: { vendorId?: number }) {
  const [packages, setPackages] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPkg, setEditPkg] = useState<any>(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pkgs, cats]: [any, any] = await Promise.all([
        packagesApi.getMyPackages(),
        categoriesApi.getAll('service'),
      ]);
      setPackages(pkgs ?? []);
      setCategories(cats ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form: PackageForm) => {
    const payload = {
      ...form,
      categoryId: form.categoryId ? parseInt(form.categoryId) : undefined,
      price: parseFloat(form.price),
      minGuests: form.minGuests ? parseInt(form.minGuests) : undefined,
      maxGuests: form.maxGuests ? parseInt(form.maxGuests) : undefined,
      includes: form.includes.split('\n').map(s => s.trim()).filter(Boolean),
    };
    if (editPkg) {
      await packagesApi.update(editPkg.id, payload);
    } else {
      await packagesApi.create(payload);
    }
    await load();
    setEditPkg(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this package?')) return;
    setDeleting(id);
    setError('');
    try {
      await packagesApi.remove(id);
      await load();
    } catch {
      setError('Failed to delete package');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Packages</h2>
          <p className="text-sm text-gray-500">{packages.length} package{packages.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setEditPkg(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all"
        >
          <Plus className="w-4 h-4" /> New Package
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
          {[1,2].map(i => <div key={i} className="h-48 rounded-2xl bg-gray-100" />)}
        </div>
      ) : packages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Package2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-1">No packages yet</h3>
          <p className="text-sm text-gray-400 mb-4">Create packages to attract more clients</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700"
          >
            Create First Package
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {packages.map((pkg: any) => (
            <div key={pkg.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TAG_COLORS[pkg.tag] ?? 'bg-gray-100 text-gray-600'}`}>
                      {pkg.tag}
                    </span>
                    {pkg.status === 'active' ? (
                      <span className="text-xs text-green-600 font-medium">Active</span>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">Inactive</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">{pkg.title}</h3>
                  {pkg.category?.name && <p className="text-xs text-gray-500 mt-0.5">{pkg.category.name}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditPkg(pkg); setShowModal(true); }}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-all"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(pkg.id)}
                    disabled={deleting === pkg.id}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl font-bold text-gray-900">
                  ₹{Number(pkg.price).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-gray-400">{pkg.priceType === 'PER_PERSON' ? 'per person' : 'fixed'}</span>
              </div>
              {pkg.includes?.length > 0 && (
                <ul className="space-y-1">
                  {pkg.includes.slice(0, 3).map((inc: string, i: number) => (
                    <li key={i} className="text-xs text-gray-500 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" /> {inc}
                    </li>
                  ))}
                  {pkg.includes.length > 3 && (
                    <li className="text-xs text-red-500">+{pkg.includes.length - 3} more</li>
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <PackageModal
          initial={editPkg}
          categories={categories}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditPkg(null); }}
        />
      )}
    </div>
  );
}
