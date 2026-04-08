'use client';

import { useState, useEffect } from 'react';

interface FaqItem {
  q: string;
  a: string;
}

interface SeoFormData {
  slug: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  seoContentTop: string;
  seoContentBottom: string;
  faqJson: string;
  schemaJson: string;
  canonicalUrl: string;
  pageType: string;
  priority: number;
  isActive: boolean;
}

interface Props {
  initialData?: Partial<SeoFormData>;
  onSubmit: (data: SeoFormData) => void;
  saving: boolean;
}

export default function SeoPageForm({ initialData, onSubmit, saving }: Props) {
  const [form, setForm] = useState<SeoFormData>({
    slug: '',
    h1: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    seoContentTop: '',
    seoContentBottom: '',
    faqJson: '[]',
    schemaJson: '',
    canonicalUrl: '',
    pageType: 'city-service',
    priority: 0,
    isActive: true,
    ...initialData,
  });

  const [faqs, setFaqs] = useState<FaqItem[]>(() => {
    try { return JSON.parse(initialData?.faqJson || '[]'); } catch { return []; }
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'faq' | 'schema'>('basic');
  const [slugPreview, setSlugPreview] = useState('');

  useEffect(() => {
    setSlugPreview(form.slug ? `/${form.slug}` : '');
  }, [form.slug]);

  const set = (key: keyof SeoFormData, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addFaq = () => setFaqs((prev) => [...prev, { q: '', a: '' }]);
  const removeFaq = (i: number) => setFaqs((prev) => prev.filter((_, idx) => idx !== i));
  const updateFaq = (i: number, field: 'q' | 'a', value: string) =>
    setFaqs((prev) => prev.map((f, idx) => idx === i ? { ...f, [field]: value } : f));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      faqJson: JSON.stringify(faqs.filter((f) => f.q.trim())),
      canonicalUrl: form.canonicalUrl || `/${form.slug}`,
    };
    onSubmit(data);
  };

  const charCount = (str: string, max: number) => (
    <span className={`text-[10px] ${str.length > max ? 'text-red-500' : 'text-gray-400'}`}>
      {str.length}/{max}
    </span>
  );

  const TAB_CLS = (t: string) =>
    `px-4 py-2 text-sm font-semibold rounded-lg transition ${activeTab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tab nav */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button type="button" className={TAB_CLS('basic')} onClick={() => setActiveTab('basic')}>Basic SEO</button>
        <button type="button" className={TAB_CLS('content')} onClick={() => setActiveTab('content')}>Content</button>
        <button type="button" className={TAB_CLS('faq')} onClick={() => setActiveTab('faq')}>FAQ ({faqs.length})</button>
        <button type="button" className={TAB_CLS('schema')} onClick={() => setActiveTab('schema')}>Schema</button>
      </div>

      {/* ── Basic SEO ── */}
      {activeTab === 'basic' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-extrabold text-gray-900">Basic SEO Fields</h2>

          {/* Slug */}
          <div>
            <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
              URL Slug <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-red-400">
              <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-200 select-none">plantoday.in/</span>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="photographers-in-noida"
                className="flex-1 px-3 py-2.5 text-sm focus:outline-none font-mono"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Lowercase letters, numbers and hyphens only. Example: <code>photographers-in-noida</code></p>
          </div>

          {/* H1 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">H1 Heading</label>
              {charCount(form.h1, 80)}
            </div>
            <input
              type="text"
              value={form.h1}
              onChange={(e) => set('h1', e.target.value)}
              placeholder="Best Photographers in Noida"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400"
            />
            <p className="text-[11px] text-gray-400 mt-1">The main heading displayed on the page (H1 tag)</p>
          </div>

          {/* Meta Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Meta Title</label>
              {charCount(form.metaTitle, 70)}
            </div>
            <input
              type="text"
              value={form.metaTitle}
              onChange={(e) => set('metaTitle', e.target.value)}
              placeholder="Best Photographers in Noida | PlanToday"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400"
            />
            <p className="text-[11px] text-gray-400 mt-1">Shown in browser tab and Google search results. Ideal: 50–70 chars.</p>
          </div>

          {/* Meta Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Meta Description</label>
              {charCount(form.metaDescription, 160)}
            </div>
            <textarea
              rows={3}
              value={form.metaDescription}
              onChange={(e) => set('metaDescription', e.target.value)}
              placeholder="Hire professional photographers in Noida. Compare 200+ verified photographers with prices and reviews."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 resize-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">Shown in Google search results. Ideal: 120–160 chars.</p>
          </div>

          {/* Meta Keywords */}
          <div>
            <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Meta Keywords</label>
            <input
              type="text"
              value={form.metaKeywords}
              onChange={(e) => set('metaKeywords', e.target.value)}
              placeholder="photographers in noida, best photographer noida, wedding photographer noida"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400"
            />
            <p className="text-[11px] text-gray-400 mt-1">Comma-separated keywords. Low SEO impact but good for documentation.</p>
          </div>

          {/* Canonical URL */}
          <div>
            <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Canonical URL</label>
            <input
              type="text"
              value={form.canonicalUrl}
              onChange={(e) => set('canonicalUrl', e.target.value)}
              placeholder={slugPreview || '/photographers-in-noida'}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 font-mono"
            />
            <p className="text-[11px] text-gray-400 mt-1">Leave blank to auto-set to /{form.slug || 'slug'}</p>
          </div>

          {/* Page Type + Priority + Status */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Page Type</label>
              <select
                value={form.pageType}
                onChange={(e) => set('pageType', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400"
              >
                <option value="city-service">City Service</option>
                <option value="locality-service">Locality Service</option>
                <option value="homepage">Homepage</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Priority</label>
              <input
                type="number"
                min={0}
                value={form.priority}
                onChange={(e) => set('priority', +e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                  onClick={() => set('isActive', !form.isActive)}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm text-gray-600">Active</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {activeTab === 'content' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <h2 className="font-extrabold text-gray-900 mb-1">SEO Content</h2>
            <p className="text-xs text-gray-400">HTML content blocks shown above/below the vendor listing. Supports basic HTML tags.</p>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
              SEO Content — Top (shown above vendor list)
            </label>
            <textarea
              rows={6}
              value={form.seoContentTop}
              onChange={(e) => set('seoContentTop', e.target.value)}
              placeholder="<p>Find top <strong>photographers</strong> in Noida...</p>"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 resize-none font-mono"
            />
            <p className="text-[11px] text-gray-400 mt-1">Rendered as HTML. Use &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;li&gt; etc.</p>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
              SEO Content — Bottom (shown below vendor list + FAQ)
            </label>
            <textarea
              rows={8}
              value={form.seoContentBottom}
              onChange={(e) => set('seoContentBottom', e.target.value)}
              placeholder="<p>Noida has a thriving photography community...</p>"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 resize-none font-mono"
            />
          </div>
        </div>
      )}

      {/* ── FAQ ── */}
      {activeTab === 'faq' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-gray-900">FAQ Section</h2>
              <p className="text-xs text-gray-400 mt-0.5">Renders as an accordion + FAQPage JSON-LD schema for Google.</p>
            </div>
            <button type="button" onClick={addFaq} className="px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition">
              + Add FAQ
            </button>
          </div>

          {faqs.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
              <p className="text-sm mb-2">No FAQ items yet</p>
              <button type="button" onClick={addFaq} className="text-xs font-semibold text-red-600 hover:text-red-700">Add first FAQ →</button>
            </div>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-gray-400 uppercase">FAQ #{i + 1}</span>
                    <button type="button" onClick={() => removeFaq(i)} className="text-xs text-red-500 hover:text-red-700 transition">Remove</button>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Question</label>
                    <input
                      type="text"
                      value={faq.q}
                      onChange={(e) => updateFaq(i, 'q', e.target.value)}
                      placeholder="What is the cost of photographers in Noida?"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Answer</label>
                    <textarea
                      rows={3}
                      value={faq.a}
                      onChange={(e) => updateFaq(i, 'a', e.target.value)}
                      placeholder="Photography packages start from ₹15,000..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 resize-none bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Schema ── */}
      {activeTab === 'schema' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <h2 className="font-extrabold text-gray-900">JSON-LD Schema Override</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Paste custom JSON-LD structured data. Leave blank to auto-generate from vendor data.
              FAQ schema is always auto-generated from the FAQ tab.
            </p>
          </div>
          <textarea
            rows={16}
            value={form.schemaJson}
            onChange={(e) => set('schemaJson', e.target.value)}
            placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "ItemList",\n  "name": "Photographers in Noida"\n}`}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 resize-none font-mono"
            spellCheck={false}
          />
          {form.schemaJson && (() => {
            try { JSON.parse(form.schemaJson); return <p className="text-xs text-green-600">Valid JSON</p>; }
            catch { return <p className="text-xs text-red-500">Invalid JSON — fix before saving</p>; }
          })()}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-gray-400">All fields are saved to the database. Changes take effect on next page load (ISR: ~1 hour).</p>
        <button
          type="submit"
          disabled={saving || !form.slug}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save SEO Page'}
        </button>
      </div>
    </form>
  );
}
