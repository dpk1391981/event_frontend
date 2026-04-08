'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { seoAdminApi } from '@/lib/api';
import SeoPageForm from '../_components/SeoPageForm';

export default function NewSeoPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (data: any) => {
    setSaving(true);
    setError('');
    try {
      await seoAdminApi.createPage(data);
      router.push('/admin/seo');
    } catch (e: any) {
      setError(e?.message || e?.error || 'Failed to create page');
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/seo" className="text-gray-400 hover:text-gray-700 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">New SEO Page</h1>
            <p className="text-gray-400 text-sm">Create a new dynamic SEO listing page</p>
          </div>
        </div>

        {error && <div className="mb-4 px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">{error}</div>}

        <SeoPageForm onSubmit={handleSubmit} saving={saving} />
      </div>
    </AdminLayout>
  );
}
