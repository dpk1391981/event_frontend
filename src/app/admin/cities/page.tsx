'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { locationsApi } from '@/lib/api';
import { City, Locality } from '@/types';

const EMPTY_CITY = { name: '', slug: '', state: '', latitude: '', longitude: '' };
const EMPTY_LOCALITY = { name: '', slug: '', cityId: 0 };

function CityForm({
  initial, onSave, onCancel,
}: { initial: typeof EMPTY_CITY; onSave: (d: typeof EMPTY_CITY) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError('');
    try { await onSave(form); }
    catch (err: unknown) { setError((err as Error).message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-gray-50 rounded-2xl p-4 border border-gray-200">
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">City Name *</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400"
            placeholder="e.g. Noida" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Slug</label>
          <input value={form.slug} onChange={(e) => set('slug', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400"
            placeholder="auto if blank" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">State</label>
          <input value={form.state} onChange={(e) => set('state', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400"
            placeholder="e.g. Uttar Pradesh" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Latitude <span className="text-gray-400 font-normal">(for geo-detect)</span></label>
          <input type="number" step="any" value={form.latitude} onChange={(e) => set('latitude', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400"
            placeholder="e.g. 28.5355" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Longitude</label>
          <input type="number" step="any" value={form.longitude} onChange={(e) => set('longitude', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400"
            placeholder="e.g. 77.3910" />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving}
          className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-5 py-2 rounded-xl disabled:opacity-50 transition">
          {saving ? 'Saving…' : 'Save City'}
        </button>
        <button type="button" onClick={onCancel}
          className="text-sm font-semibold px-5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition">
          Cancel
        </button>
      </div>
    </form>
  );
}

function LocalityForm({
  initial, cities, onSave, onCancel,
}: {
  initial: typeof EMPTY_LOCALITY;
  cities: City[];
  onSave: (d: typeof EMPTY_LOCALITY) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.cityId) { setError('City is required'); return; }
    setSaving(true); setError('');
    try { await onSave(form); }
    catch (err: unknown) { setError((err as Error).message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-gray-50 rounded-2xl p-4 border border-gray-200">
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">City *</label>
          <select value={form.cityId} onChange={(e) => set('cityId', Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400 bg-white">
            <option value={0}>Select city</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Locality Name *</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400"
            placeholder="e.g. Sector 62" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Slug</label>
          <input value={form.slug} onChange={(e) => set('slug', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400"
            placeholder="auto if blank" />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving}
          className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-5 py-2 rounded-xl disabled:opacity-50 transition">
          {saving ? 'Saving…' : 'Save Locality'}
        </button>
        <button type="button" onClick={onCancel}
          className="text-sm font-semibold px-5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AdminCitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'cities' | 'localities'>('cities');
  const [creatingCity, setCreatingCity] = useState(false);
  const [creatingLocality, setCreatingLocality] = useState(false);
  const [editCityId, setEditCityId] = useState<number | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [c, l] = await Promise.all([
        locationsApi.getCities(),
        locationsApi.getAllLocalities(),
      ]);
      setCities((c as unknown) as City[]);
      setLocalities((l as unknown) as Locality[]);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const handleCreateCity = async (form: typeof EMPTY_CITY) => {
    const payload = {
      ...form,
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
    };
    await locationsApi.createCity(payload);
    showToast('City created ✅');
    setCreatingCity(false);
    loadAll();
  };

  const handleUpdateCity = async (id: number, form: typeof EMPTY_CITY) => {
    const payload = {
      ...form,
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
    };
    await locationsApi.updateCity(id, payload);
    showToast('City updated ✅');
    setEditCityId(null);
    loadAll();
  };

  const handleDeleteCity = async (id: number, name: string) => {
    if (!confirm(`Remove city "${name}"? Associated data will be preserved.`)) return;
    try {
      await locationsApi.removeCity(id);
      showToast(`"${name}" removed`);
      loadAll();
    } catch (e: unknown) { showToast((e as Error).message || 'Failed'); }
  };

  const handleCreateLocality = async (form: typeof EMPTY_LOCALITY) => {
    await locationsApi.createLocality(form);
    showToast('Locality created ✅');
    setCreatingLocality(false);
    loadAll();
  };

  return (
    <AdminLayout>
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>}

      <div className="p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Cities & Localities 🏙️</h1>
            <p className="text-sm text-gray-500 mt-1">Manage service areas. Cities and localities set lat/lng for auto-detect to work.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {(['cities', 'localities'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition capitalize ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t} {t === 'cities' ? `(${cities.length})` : `(${localities.length})`}
            </button>
          ))}
        </div>

        {/* Cities tab */}
        {tab === 'cities' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-bold text-gray-600">All Cities</p>
              {!creatingCity && (
                <button onClick={() => setCreatingCity(true)}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition">
                  + Add City
                </button>
              )}
            </div>
            {creatingCity && (
              <div className="mb-4">
                <CityForm initial={EMPTY_CITY} onSave={handleCreateCity} onCancel={() => setCreatingCity(false)} />
              </div>
            )}
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />)}</div>
            ) : (
              <div className="space-y-2">
                {cities.map((city) => (
                  <div key={city.id}>
                    {editCityId === city.id ? (
                      <CityForm
                        initial={{
                          name: city.name,
                          slug: city.slug,
                          state: city.state || '',
                          latitude: (city as any).latitude?.toString() || '',
                          longitude: (city as any).longitude?.toString() || '',
                        }}
                        onSave={(form) => handleUpdateCity(city.id, form)}
                        onCancel={() => setEditCityId(null)}
                      />
                    ) : (
                      <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
                        <span className="text-xl">🏙️</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900 text-sm">{city.name}</span>
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{city.slug}</span>
                            {city.state && <span className="text-[10px] text-gray-400">{city.state}</span>}
                            {(city as any).latitude && (
                              <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">📍 geo set</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {localities.filter((l) => l.cityId === city.id).length} localities
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setEditCityId(city.id)}
                            className="text-xs text-blue-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition">Edit</button>
                          <button onClick={() => handleDeleteCity(city.id, city.name)}
                            className="text-xs text-red-500 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition">Remove</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Localities tab */}
        {tab === 'localities' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-bold text-gray-600">All Localities</p>
              {!creatingLocality && (
                <button onClick={() => setCreatingLocality(true)}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition">
                  + Add Locality
                </button>
              )}
            </div>
            {creatingLocality && (
              <div className="mb-4">
                <LocalityForm initial={EMPTY_LOCALITY} cities={cities} onSave={handleCreateLocality} onCancel={() => setCreatingLocality(false)} />
              </div>
            )}
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 rounded-xl bg-gray-100 animate-pulse" />)}</div>
            ) : (
              <div className="space-y-1">
                {localities.map((loc) => {
                  const city = cities.find((c) => c.id === loc.cityId);
                  return (
                    <div key={loc.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-2.5">
                      <span className="text-base">📍</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm">{loc.name}</span>
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{loc.slug}</span>
                          {city && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{city.name}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
