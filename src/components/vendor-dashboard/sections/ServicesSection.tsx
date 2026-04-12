'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Edit, Trash2, X, Save, Loader2, Wrench, ChevronDown,
} from 'lucide-react';
import { vendorServicesApi, categoriesApi } from '@/lib/api';

interface ServiceForm {
  title: string;
  categoryId: string;
  description: string;
  priceUnit: string;
  minPrice: string;
  maxPrice: string;
  duration: string;
  highlights: string;
}

const EMPTY: ServiceForm = {
  title: '', categoryId: '', description: '',
  priceUnit: 'per event', minPrice: '', maxPrice: '',
  duration: '', highlights: '',
};

const PRICE_UNITS = ['per event', 'per hour', 'per person', 'per day', 'per session'];

function ServiceModal({
  initial, categories, onSave, onClose,
}: {
  initial?: any; categories: any[];
  onSave: (data: ServiceForm) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ServiceForm>(initial ? {
    title: initial.title ?? '',
    categoryId: initial.categoryId?.toString() ?? '',
    description: initial.description ?? '',
    priceUnit: initial.priceUnit ?? 'per event',
    minPrice: initial.minPrice?.toString() ?? '',
    maxPrice: initial.maxPrice?.toString() ?? '',
    duration: initial.duration ?? '',
    highlights: (initial.highlights ?? []).join('\n'),
  } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.title) { setError('Title is required'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const inp = (key: keyof ServiceForm, label: string, opts?: { type?: string; placeholder?: string; multiline?: boolean }) => (
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
          <h3 className="font-semibold text-gray-900">{initial ? 'Edit Service' : 'New Service'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          {inp('title', 'Service Name', { placeholder: 'e.g. Wedding Photography' })}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Category</label>
              <select
                value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <option value="">Select...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Price Unit</label>
              <select
                value={form.priceUnit}
                onChange={e => setForm(f => ({ ...f, priceUnit: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                {PRICE_UNITS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {inp('minPrice', 'Min Price (₹)', { type: 'number', placeholder: '5000' })}
            {inp('maxPrice', 'Max Price (₹)', { type: 'number', placeholder: '20000' })}
          </div>
          {inp('duration', 'Duration', { placeholder: 'e.g. 4 hours, Full Day' })}
          {inp('description', 'Description', { multiline: true, placeholder: 'Describe this service...' })}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Highlights (one per line)</label>
            <textarea
              value={form.highlights}
              onChange={e => setForm(f => ({ ...f, highlights: e.target.value }))}
              rows={4}
              placeholder={'High-resolution edited photos\nSame-day teaser\nOnline gallery'}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Service'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ServicesSection({ vendorId }: { vendorId?: number }) {
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSvc, setEditSvc] = useState<any>(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [svcs, cats]: [any, any] = await Promise.all([
        vendorServicesApi.getAll(),
        categoriesApi.getAll('service'),
      ]);
      setServices(svcs ?? []);
      setCategories(cats ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form: ServiceForm) => {
    const payload = {
      ...form,
      categoryId: form.categoryId ? parseInt(form.categoryId) : undefined,
      minPrice: form.minPrice ? parseFloat(form.minPrice) : undefined,
      maxPrice: form.maxPrice ? parseFloat(form.maxPrice) : undefined,
      highlights: form.highlights.split('\n').map(s => s.trim()).filter(Boolean),
    };
    if (editSvc) {
      await vendorServicesApi.update(editSvc.id, payload);
    } else {
      await vendorServicesApi.create(payload as any);
    }
    await load();
    setEditSvc(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this service?')) return;
    setDeleting(id);
    try {
      await vendorServicesApi.remove(id);
      await load();
    } catch {
      setError('Failed to delete service');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Services</h2>
          <p className="text-sm text-gray-500">{services.length} service{services.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setEditSvc(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all"
        >
          <Plus className="w-4 h-4" /> New Service
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="space-y-3 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-gray-100" />)}</div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Wrench className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-1">No services yet</h3>
          <p className="text-sm text-gray-400 mb-4">Add your services to help clients understand what you offer</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700"
          >
            Add First Service
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((svc: any) => (
            <div key={svc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{svc.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      svc.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>{svc.status}</span>
                  </div>
                  {svc.categoryName && <p className="text-xs text-gray-500">{svc.categoryName}</p>}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    {svc.minPrice && (
                      <span>₹{Number(svc.minPrice).toLocaleString('en-IN')}
                        {svc.maxPrice ? ` – ₹${Number(svc.maxPrice).toLocaleString('en-IN')}` : ''}
                        <span className="text-gray-400 text-xs ml-1">{svc.priceUnit}</span>
                      </span>
                    )}
                    {svc.duration && <span className="text-gray-400 text-xs">{svc.duration}</span>}
                  </div>
                  {svc.highlights?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {svc.highlights.slice(0, 3).map((h: string, i: number) => (
                        <span key={i} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">{h}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  <button
                    onClick={() => { setEditSvc(svc); setShowModal(true); }}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-all"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(svc.id)}
                    disabled={deleting === svc.id}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ServiceModal
          initial={editSvc}
          categories={categories}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditSvc(null); }}
        />
      )}
    </div>
  );
}
