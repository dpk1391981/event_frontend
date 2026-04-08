'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { seoAdminApi } from '@/lib/api';

interface SeoPage {
  id: number;
  slug: string;
  h1?: string;
  metaTitle?: string;
  metaDescription?: string;
  pageType: string;
  isActive: boolean;
  pageViews: number;
  updatedAt: string;
}

export default function AdminSeoPages() {
  const [pages, setPages] = useState<SeoPage[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState('');
  const [pageType, setPageType] = useState('');
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await seoAdminApi.listPages(page, 20, search || undefined, pageType || undefined);
      setPages(res.data || []);
      setTotal(res.total || 0);
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, search, pageType]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (id: number) => {
    try {
      await seoAdminApi.togglePage(id);
      load();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: number, slug: string) => {
    if (!confirm(`Delete "${slug}"? This cannot be undone.`)) return;
    try {
      await seoAdminApi.deletePage(id);
      load();
    } catch { /* ignore */ }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setMsg('');
    try {
      const res: any = await seoAdminApi.seed();
      setMsg(`Seeded ${res.seeded} pages/links successfully.`);
      load();
    } catch (e: any) {
      setMsg(e?.message || 'Seed failed');
    }
    setSeeding(false);
  };

  const handleGenerate = async () => {
    if (!confirm('This will generate SEO pages for ALL city×category combinations. Continue?')) return;
    setGenerating(true);
    setMsg('');
    try {
      const res: any = await seoAdminApi.generate();
      setMsg(`Generated ${res.generated} new pages.`);
      load();
    } catch (e: any) {
      setMsg(e?.message || 'Generation failed');
    }
    setGenerating(false);
  };

  const PAGE_TYPE_COLORS: Record<string, string> = {
    'city-service': 'bg-blue-100 text-blue-700',
    'locality-service': 'bg-purple-100 text-purple-700',
    'homepage': 'bg-yellow-100 text-yellow-700',
    'custom': 'bg-gray-100 text-gray-700',
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">SEO Manager</h1>
            <p className="text-gray-500 text-sm mt-1">{total} pages total — all content DB-driven</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition disabled:opacity-50"
            >
              {seeding ? 'Seeding...' : 'Seed Defaults'}
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2 text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate All Pages'}
            </button>
            <Link
              href="/admin/seo/footer-links"
              className="px-4 py-2 text-sm font-semibold bg-gray-700 hover:bg-gray-800 text-white rounded-xl transition"
            >
              Footer Links
            </Link>
            <Link
              href="/admin/seo/new"
              className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition"
            >
              + New Page
            </Link>
          </div>
        </div>

        {/* Feedback */}
        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${msg.includes('fail') || msg.includes('error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {msg}
          </div>
        )}

        {/* Sub-nav tabs */}
        <div className="flex gap-2 mb-5 border-b border-gray-200 pb-3">
          <Link href="/admin/seo" className="text-sm font-semibold text-red-600 border-b-2 border-red-600 pb-1 px-1">SEO Pages</Link>
          <Link href="/admin/seo/footer-links" className="text-sm text-gray-500 hover:text-gray-800 px-1">Footer Links</Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <input
            type="text"
            placeholder="Search by slug..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-red-400 w-64"
          />
          <select
            value={pageType}
            onChange={(e) => { setPageType(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-red-400"
          >
            <option value="">All types</option>
            <option value="city-service">City Service</option>
            <option value="locality-service">Locality Service</option>
            <option value="homepage">Homepage</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="space-y-0">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 px-6 py-4 border-b border-gray-50">
                  <div className="h-4 bg-gray-100 rounded flex-1" />
                  <div className="h-4 bg-gray-100 rounded w-24" />
                  <div className="h-4 bg-gray-100 rounded w-16" />
                </div>
              ))}
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg font-semibold mb-2">No SEO pages yet</p>
              <p className="text-sm mb-4">Click "Seed Defaults" to add initial pages, or "New Page" to create one.</p>
              <button onClick={handleSeed} className="bg-amber-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-amber-600 transition">
                Seed Default Pages
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Slug / H1</th>
                  <th className="text-left px-4 py-3 text-xs font-extrabold text-gray-500 uppercase tracking-wider hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-extrabold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Views</th>
                  <th className="text-left px-4 py-3 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-6 py-3.5">
                      <div className="font-mono text-xs text-red-600 mb-0.5">/{p.slug}</div>
                      <div className="text-gray-700 text-sm font-medium truncate max-w-xs">{p.h1 || p.metaTitle || '—'}</div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${PAGE_TYPE_COLORS[p.pageType] || 'bg-gray-100 text-gray-600'}`}>
                        {p.pageType}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-gray-500">{p.pageViews.toLocaleString()}</td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleToggle(p.id)}
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full transition ${p.isActive ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' : 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700'}`}
                      >
                        {p.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/${p.slug}`}
                          target="_blank"
                          rel="noopener"
                          className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition"
                          title="Preview"
                        >
                          ↗
                        </a>
                        <Link
                          href={`/admin/seo/${p.id}`}
                          className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id, p.slug)}
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex justify-center gap-2 mt-5">
            {page > 1 && (
              <button onClick={() => setPage(p => p - 1)} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:border-red-400 transition">
                ‹ Prev
              </button>
            )}
            <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {Math.ceil(total / 20)}</span>
            {page < Math.ceil(total / 20) && (
              <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:border-red-400 transition">
                Next ›
              </button>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
