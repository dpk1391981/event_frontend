'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { seoAdminApi } from '@/lib/api';
import SeoPageForm from '../_components/SeoPageForm';

export default function EditSeoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data: any = await seoAdminApi.getPage(+id);
        setPage(data);
      } catch {
        setError('Page not found');
      }
      setLoading(false);
    })();
  }, [id]);

  const handleSubmit = async (data: any) => {
    setSaving(true);
    setError('');
    try {
      await seoAdminApi.updatePage(+id, data);
      router.push('/admin/seo');
    } catch (e: any) {
      setError(e?.message || e?.error || 'Failed to update page');
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
            <h1 className="text-2xl font-extrabold text-gray-900">Edit SEO Page</h1>
            {page && <p className="text-gray-400 text-sm font-mono">/{page.slug}</p>}
          </div>
        </div>

        {error && <div className="mb-4 px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">{error}</div>}

        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-12" />)}
          </div>
        ) : page ? (
          <SeoPageForm initialData={page} onSubmit={handleSubmit} saving={saving} />
        ) : (
          <p className="text-gray-500">Page not found.</p>
        )}
      </div>
    </AdminLayout>
  );
}
