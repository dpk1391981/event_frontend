'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { locationsApi, categoriesApi, vendorsApi } from '@/lib/api';
import { City, Locality, Category } from '@/types';
import { useAppStore } from '@/store/useAppStore';

const STEPS = ['Business Info', 'Location', 'Services & Pricing', 'Done'];

export default function VendorOnboardPage() {
  const router = useRouter();
  const { user, openAuthModal } = useAppStore();
  const [step, setStep] = useState(0);
  const [cities, setCities] = useState<City[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    businessName: '',
    description: '',
    phone: '',
    cityId: '',
    localityId: '',
    address: '',
    categoryIds: [] as number[],
    minPrice: '',
    maxPrice: '',
    priceUnit: 'per event',
    yearsOfExperience: '',
    teamSize: '',
  });

  useEffect(() => {
    if (!user) { openAuthModal(); return; }
    locationsApi.getCities().then((d: unknown) => setCities(d as City[])).catch(() => {});
    categoriesApi.getAll().then((d: unknown) => setCategories(d as Category[])).catch(() => {});
  }, [user, router]);

  const handleCityChange = async (cityId: string) => {
    setForm({ ...form, cityId, localityId: '' });
    if (cityId) {
      const data = await locationsApi.getLocalities(Number(cityId)) as unknown as Locality[];
      setLocalities(data);
    }
  };

  const toggleCategory = (id: number) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((c) => c !== id)
        : [...prev.categoryIds, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await vendorsApi.create({
        businessName: form.businessName,
        description: form.description,
        phone: form.phone,
        cityId: Number(form.cityId),
        localityId: form.localityId ? Number(form.localityId) : undefined,
        address: form.address,
        categoryIds: form.categoryIds,
        minPrice: form.minPrice ? Number(form.minPrice) : undefined,
        maxPrice: form.maxPrice ? Number(form.maxPrice) : undefined,
        priceUnit: form.priceUnit,
        yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
        teamSize: form.teamSize ? Number(form.teamSize) : undefined,
      });
      setStep(3);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">List Your Business</h1>
          <p className="text-gray-500 text-sm">Join thousands of vendors getting quality leads on PlanToday</p>
        </div>

        {/* Progress */}
        {step < 3 && (
          <div className="flex items-center mb-8">
            {STEPS.slice(0, 3).map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition ${
                  i < step ? 'bg-green-500 text-white' : i === step ? 'bg-purple-700 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                {i < 2 && <div className={`flex-1 h-1 mx-1 rounded ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          {/* Step 0: Business Info */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Business Information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Royal Events & Photography"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe your services, experience, specialties..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-200 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone *</label>
                <input
                  required
                  type="tel"
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5"
                    value={form.yearsOfExperience}
                    onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team Size</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 10"
                    value={form.teamSize}
                    onChange={(e) => setForm({ ...form, teamSize: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                    suppressHydrationWarning
                  />
                </div>
              </div>
              <button
                onClick={() => setStep(1)}
                disabled={!form.businessName || !form.phone}
                className="w-full bg-purple-700 text-white font-bold py-3.5 rounded-xl hover:bg-purple-800 transition disabled:opacity-50"
              >
                Next: Location →
              </button>
            </div>
          )}

          {/* Step 1: Location */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Service Location</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <select
                  required
                  value={form.cityId}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                >
                  <option value="">Select city</option>
                  {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {localities.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Locality</label>
                  <select
                    value={form.localityId}
                    onChange={(e) => setForm({ ...form, localityId: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                  >
                    <option value="">Select locality</option>
                    {localities.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                <textarea
                  rows={2}
                  placeholder="Shop/Office address..."
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-200 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!form.cityId}
                  className="flex-1 bg-purple-700 text-white font-bold py-3 rounded-xl hover:bg-purple-800 transition disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Services & Pricing */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Services & Pricing</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Categories *</label>
                <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`text-left px-3 py-2.5 rounded-xl border-2 text-sm transition ${
                        form.categoryIds.includes(cat.id)
                          ? 'border-purple-600 bg-purple-50 text-purple-700 font-medium'
                          : 'border-gray-200 text-gray-600 hover:border-purple-300'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (₹)</label>
                  <input
                    type="number"
                    placeholder="10000"
                    value={form.minPrice}
                    onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (₹)</label>
                  <input
                    type="number"
                    placeholder="100000"
                    value={form.maxPrice}
                    onChange={(e) => setForm({ ...form, maxPrice: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Unit</label>
                <select
                  value={form.priceUnit}
                  onChange={(e) => setForm({ ...form, priceUnit: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                >
                  <option>per event</option>
                  <option>per person</option>
                  <option>per hour</option>
                  <option>per day</option>
                </select>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading || form.categoryIds.length === 0}
                  className="flex-1 bg-purple-700 text-white font-bold py-3 rounded-xl hover:bg-purple-800 transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Submit'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Profile Submitted!</h2>
              <p className="text-gray-500 mb-2">Your profile is under review. We&apos;ll approve it within 24 hours.</p>
              <p className="text-gray-500 text-sm mb-8">You&apos;ll start receiving leads once approved.</p>
              <button
                onClick={() => router.push('/partner/dashboard')}
                className="bg-purple-700 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-purple-800 w-full"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
