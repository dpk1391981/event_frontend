'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { leadsApi, api, locationsApi } from '@/lib/api';

interface Props {
  mode?: 'single' | 'multi';
  vendorId?: number;
  vendorName?: string;
  categoryId?: number;
  serviceType?: string;
  packageId?: number;
  budget?: number;
  searchQuery?: string;
  onClose: () => void;
}

export default function SmartLeadModal({
  mode = 'multi',
  vendorId,
  vendorName,
  categoryId,
  serviceType,
  packageId,
  budget,
  searchQuery,
  onClose,
}: Props) {
  const { user, selectedCity } = useAppStore();

  const [form, setForm] = useState({
    contactName: user?.name || '',
    contactPhone: user?.phone || '',
    requirement: '',
    cityId: selectedCity?.id?.toString() || '',
  });
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [assignedCount, setAssignedCount] = useState(0);
  const [error, setError] = useState('');

  // Load cities for the dropdown (multi mode)
  useEffect(() => {
    if (mode === 'multi') {
      locationsApi.getCities().then((data: any) => setCities(data || [])).catch(() => {});
    }
  }, [mode]);

  // Auto-fill from auth state when user changes
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        contactName: f.contactName || user.name || '',
        contactPhone: f.contactPhone || user.phone || '',
      }));
    }
  }, [user]);

  const isLoggedIn = !!user;

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const resolvedCityId = form.cityId ? Number(form.cityId) : selectedCity?.id;

      if (mode === 'single' && vendorId) {
        await leadsApi.create({
          vendorId,
          contactName: form.contactName,
          contactPhone: form.contactPhone,
          requirement: form.requirement || undefined,
          cityId: resolvedCityId,
          categoryId,
          packageId,
          budget,
          source: searchQuery ? 'search' : 'vendor_profile',
          searchQuery,
        });
        setSuccess(true);
      } else {
        const res: any = await leadsApi.route({
          contactName: form.contactName,
          contactPhone: form.contactPhone,
          requirement: form.requirement || undefined,
          cityId: resolvedCityId,
          categoryId,
          source: 'seo_page',
          searchQuery,
        });
        setAssignedCount(res?.assignedCount || 0);
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const input =
    'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition bg-white';

  return (
    // Backdrop — click outside to close
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      onMouseDown={onClose}
    >
      {/* Modal card — stop propagation so click inside doesn't close */}
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white px-5 pt-5 pb-4 border-b border-gray-100 rounded-t-2xl z-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-snug">
                {mode === 'single' && vendorName
                  ? `Get Free Quote from ${vendorName}`
                  : 'Get Best Vendor Quotes Instantly'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {mode === 'multi'
                  ? `Matched to top ${serviceType || 'vendors'} in your city · Free · No spam`
                  : vendorName}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition shrink-0"
            >
              ✕
            </button>
          </div>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Request Sent!</h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              {mode === 'multi'
                ? `Sent to ${assignedCount > 0 ? `${assignedCount} top vendor${assignedCount !== 1 ? 's' : ''}` : 'best vendors'} in your city. Expect calls within 2 hours.`
                : `${vendorName || 'The vendor'} will contact you shortly.`}
            </p>
            <button
              onClick={onClose}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {mode === 'multi' && (
              <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <span className="text-base shrink-0">⚡</span>
                <p className="text-xs text-blue-700 font-medium leading-relaxed">
                  Free · Match with top 3–5 verified vendors · No spam calls
                </p>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={form.contactName}
                onChange={(e) => set('contactName', e.target.value)}
                className={input}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <span className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-gray-500 text-sm font-medium shrink-0">
                  +91
                </span>
                <input
                  required
                  type="tel"
                  placeholder="9876543210"
                  pattern="[6-9]\d{9}"
                  maxLength={10}
                  value={form.contactPhone}
                  onChange={(e) => set('contactPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="flex-1 border border-gray-200 rounded-r-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition"
                />
              </div>
            </div>

            {/* City selector for multi mode when no city in store */}
            {mode === 'multi' && !selectedCity && cities.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Your City</label>
                <select
                  value={form.cityId}
                  onChange={(e) => set('cityId', e.target.value)}
                  className={input}
                >
                  <option value="">Select city</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Requirement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Requirement</label>
              <textarea
                rows={3}
                placeholder={
                  serviceType
                    ? `Describe your ${serviceType} requirement briefly...`
                    : 'e.g. Wedding photographer needed for 200 guests on Dec 15...'
                }
                value={form.requirement}
                onChange={(e) => set('requirement', e.target.value)}
                className={`${input} resize-none`}
              />
            </div>

            {serviceType && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Category:</span>
                <span className="bg-red-50 text-red-600 text-xs font-semibold px-3 py-1 rounded-full capitalize">
                  {serviceType}
                </span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-60 text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </span>
              ) : mode === 'multi' ? 'Get Free Quotes — Instant' : "Send Request — It's Free"}
            </button>

            <p className="text-center text-xs text-gray-400">
              🔒 Your details are only shared with matched vendors
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
