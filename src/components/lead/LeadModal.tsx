'use client';

import { useState } from 'react';
import { Vendor, VendorPackage } from '@/types';
import { leadsApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

interface Props {
  vendor: Vendor;
  onClose: () => void;
  searchQuery?: string;
  budget?: number;
  guestCount?: number;
  eventDate?: string;
  // Package context — pre-fills the lead with package info
  selectedPackage?: Pick<VendorPackage, 'id' | 'title' | 'price' | 'priceType' | 'includes' | 'addons'>;
}

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  return `₹${Math.round(n / 1000)}K`;
}

export default function LeadModal({
  vendor, onClose, searchQuery, budget, guestCount, eventDate, selectedPackage,
}: Props) {
  const user = useAppStore((s) => s.user);
  const [form, setForm] = useState({
    contactName: user?.name || '',
    contactPhone: user?.phone || '',
    contactEmail: user?.email || '',
    requirement: selectedPackage
      ? `Interested in: ${selectedPackage.title}`
      : '',
    eventDate: eventDate || '',
    budget: budget || (selectedPackage?.price ?? ''),
    guestCount: guestCount || '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await leadsApi.create({
        vendorId: vendor.id,
        packageId: selectedPackage?.id,
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail || undefined,
        requirement: form.requirement || undefined,
        eventDate: form.eventDate || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        guestCount: form.guestCount ? Number(form.guestCount) : undefined,
        source: selectedPackage ? 'package' : searchQuery ? 'search' : 'vendor_profile',
        searchQuery,
      });
      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-5 pt-5 pb-4 border-b border-gray-100 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {selectedPackage ? 'Book This Package' : 'Get Free Quote'}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">{vendor.businessName}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Request Sent! 🎉</h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              <span className="font-semibold text-gray-700">{vendor.businessName}</span> will contact you shortly.
              Expect a response within 2 hours.
            </p>
            <button
              onClick={onClose}
              className="bg-red-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-red-700 transition w-full"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Package summary banner */}
            {selectedPackage && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-1">Selected Package</p>
                <p className="font-bold text-gray-900 text-sm leading-tight">{selectedPackage.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-red-600">
                    {fmt(Number(selectedPackage.price))}
                    {selectedPackage.priceType === 'per_person' ? '/person' : ''}
                  </span>
                </div>
                {selectedPackage.includes && selectedPackage.includes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedPackage.includes.slice(0, 4).map((item) => (
                      <span key={item} className="rounded-full bg-white border border-red-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                        {item}
                      </span>
                    ))}
                    {selectedPackage.includes.length > 4 && (
                      <span className="text-[10px] text-gray-400">+{selectedPackage.includes.length - 4} more</span>
                    )}
                  </div>
                )}
                {selectedPackage.addons && selectedPackage.addons.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] font-semibold text-gray-500 mb-1">Available add-ons:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedPackage.addons.map((a, i) => (
                        <span key={i} className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          + {a.label} ({fmt(a.price)})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name *</label>
              <input
                required
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
              <div className="flex">
                <span className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-gray-500 text-sm font-medium">
                  +91
                </span>
                <input
                  required
                  type="tel"
                  placeholder="9876543210"
                  pattern="[6-9]\d{9}"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  className="flex-1 border border-gray-200 rounded-r-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Date</label>
              <input
                type="date"
                value={form.eventDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Budget (₹)</label>
                <input
                  type="number"
                  placeholder="50000"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Guests</label>
                <input
                  type="number"
                  placeholder="100"
                  value={form.guestCount}
                  onChange={(e) => setForm({ ...form, guestCount: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Requirement</label>
              <textarea
                rows={3}
                placeholder="Describe your requirement briefly..."
                value={form.requirement}
                onChange={(e) => setForm({ ...form, requirement: e.target.value })}
                className={`${inputClass} resize-none`}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white font-bold py-3.5 rounded-xl hover:bg-red-700 active:bg-red-800 transition disabled:opacity-60 text-base shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </span>
              ) : selectedPackage ? 'Book This Package — Free' : "Send Request — It's Free"}
            </button>

            <p className="text-center text-xs text-gray-400">
              🔒 Your details are shared only with {vendor.businessName}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
