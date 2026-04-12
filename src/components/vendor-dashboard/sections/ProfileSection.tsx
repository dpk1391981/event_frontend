'use client';

import { useEffect, useState, useCallback } from 'react';
import { Camera, CheckCircle, Save, AlertCircle, Loader2 } from 'lucide-react';
import { vendorPanelApi, locationsApi, categoriesApi, uploadApi } from '@/lib/api';

interface Props {
  onSaved?: () => void;
}

export default function ProfileSection({ onSaved }: Props) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cities, setCities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    businessName: '', description: '', phone: '', email: '',
    address: '', website: '', yearsOfExperience: '',
    minPrice: '', maxPrice: '', priceUnit: 'per event',
    cityId: '', localityId: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, cs, cats]: [any, any, any] = await Promise.all([
        vendorPanelApi.getProfile(),
        locationsApi.getCities(),
        categoriesApi.getAll('service'),
      ]);
      setProfile(p);
      setCities(cs ?? []);
      setCategories(cats ?? []);
      if (p) {
        setForm({
          businessName: p.businessName ?? '',
          description: p.description ?? '',
          phone: p.phone ?? '',
          email: p.email ?? '',
          address: p.address ?? '',
          website: p.website ?? '',
          yearsOfExperience: p.yearsOfExperience?.toString() ?? '',
          minPrice: p.minPrice?.toString() ?? '',
          maxPrice: p.maxPrice?.toString() ?? '',
          priceUnit: p.priceUnit ?? 'per event',
          cityId: p.cityId?.toString() ?? '',
          localityId: p.localityId?.toString() ?? '',
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await vendorPanelApi.updateProfile({
        ...form,
        cityId: form.cityId ? parseInt(form.cityId) : undefined,
        localityId: form.localityId ? parseInt(form.localityId) : undefined,
        yearsOfExperience: form.yearsOfExperience ? parseInt(form.yearsOfExperience) : undefined,
        minPrice: form.minPrice ? parseFloat(form.minPrice) : undefined,
        maxPrice: form.maxPrice ? parseFloat(form.maxPrice) : undefined,
      });
      setSuccess('Profile updated successfully!');
      onSaved?.();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const base64s = await Promise.all(files.map(f => uploadApi.compressToBase64(f)));
      const existing = profile?.portfolioImages ?? [];
      await vendorPanelApi.updateProfile({ portfolioImages: [...existing, ...base64s] });
      await load();
      setSuccess('Images uploaded! Pending admin approval.');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const field = (key: keyof typeof form, label: string, opts?: {
    type?: string; placeholder?: string; multiline?: boolean; options?: { v: string; l: string }[];
  }) => (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
      {opts?.options ? (
        <select
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
        >
          <option value="">Select...</option>
          {opts.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      ) : opts?.multiline ? (
        <textarea
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          rows={4}
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

  if (loading) {
    return <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl bg-gray-100" />)}</div>;
  }

  const checklist = profile?.checklist ?? [];
  const score = profile?.profileScore ?? 0;

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Profile score */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Profile Completeness</h3>
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${
            score >= 80 ? 'bg-green-100 text-green-700' :
            score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
          }`}>{score}/100</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
          <div
            className={`h-2 rounded-full transition-all ${score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {checklist.map((item: any) => (
            <div
              key={item.id}
              className={`flex items-center gap-2 p-2 rounded-xl text-xs ${
                item.done ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
              }`}
            >
              {item.done
                ? <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                : <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              }
              <span className="truncate">{item.label.replace('Add at least', '').replace('Write a', '').replace('Add', '').replace('Publish', '').replace('List', '').trim()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio images */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Portfolio Images</h3>
            <p className="text-xs text-gray-500 mt-0.5">Images require admin approval before going live</p>
          </div>
          <label className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all ${
            uploading ? 'bg-gray-100 text-gray-400' : 'bg-red-600 text-white hover:bg-red-700'
          }`}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {uploading ? 'Uploading...' : 'Upload Images'}
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>
        </div>
        {(profile?.portfolioImages?.length ?? 0) > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {profile.portfolioImages.map((img: string, i: number) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
            No images uploaded yet. Add at least 5 images to improve your profile score.
          </div>
        )}
      </div>

      {/* Basic info form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-5">Business Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('businessName', 'Business Name', { placeholder: 'Your business name' })}
          {field('phone', 'Phone Number', { type: 'tel', placeholder: '10-digit mobile number' })}
          {field('email', 'Business Email', { type: 'email', placeholder: 'business@example.com' })}
          {field('website', 'Website (optional)', { placeholder: 'https://yourbusiness.com' })}
          {field('cityId', 'City', { options: cities.map(c => ({ v: String(c.id), l: c.name })) })}
          {field('address', 'Address', { placeholder: 'Full address' })}
          {field('yearsOfExperience', 'Years of Experience', { type: 'number', placeholder: '5' })}
          {field('priceUnit', 'Price Unit', { options: [
            { v: 'per event', l: 'Per Event' },
            { v: 'per hour', l: 'Per Hour' },
            { v: 'per person', l: 'Per Person' },
            { v: 'per day', l: 'Per Day' },
          ]})}
          {field('minPrice', 'Min Price (₹)', { type: 'number', placeholder: '5000' })}
          {field('maxPrice', 'Max Price (₹)', { type: 'number', placeholder: '50000' })}
        </div>
        <div className="mt-4">
          {field('description', 'Business Description', {
            multiline: true,
            placeholder: 'Describe your business, specialties, and what makes you unique...',
          })}
        </div>
      </div>

      {/* Feedback */}
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">{success}</div>}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  );
}
