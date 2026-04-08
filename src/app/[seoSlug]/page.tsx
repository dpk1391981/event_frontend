/**
 * SEO-friendly vendor listing page — fully DB-driven.
 *
 * URL format:  /{service}-in-{city}
 * Examples:
 *   /photographers-in-noida
 *   /caterers-in-delhi
 *   /wedding-planners-in-gurgaon
 *   /events-in-noida
 *
 * SEO content (title, meta, H1, FAQ, schema) is loaded from the DB via
 * GET /seo/page/:slug. Falls back to computed values if DB record missing.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  parseSeoSlug,
  citySlugToName,
  CATEGORY_TO_SEO,
  STATIC_SEO_SLUGS,
} from '@/lib/seo-urls';
import { searchApi, locationsApi, categoriesApi } from '@/lib/api';
import type { SearchResult, City, Category } from '@/types';
import VendorListCard from '@/components/vendor/VendorListCard';
import { Suspense } from 'react';
import PaginationScroller from '@/components/vendor/PaginationScroller';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface SeoPageData {
  id: number;
  slug: string;
  h1?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  seoContentTop?: string;
  seoContentBottom?: string;
  faqJson?: string;
  schemaJson?: string;
  canonicalUrl?: string;
}

interface FaqItem {
  q: string;
  a: string;
}

interface Props {
  params: Promise<{ seoSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

/* ── Fetch SEO page from DB ────────────────────────────────────────────── */
async function getDbSeoPage(slug: string): Promise<SeoPageData | null> {
  try {
    const res = await fetch(`${API_URL}/seo/page/${slug}`, {
      next: { revalidate: 3600 }, // ISR: revalidate every hour
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/* ── Vendor data fetching ──────────────────────────────────────────────── */
async function getPageData(categorySlug: string, citySlug: string, page = 1) {
  try {
    const [cities, categories] = await Promise.all([
      locationsApi.getCities() as unknown as Promise<City[]>,
      categoriesApi.getAll() as unknown as Promise<Category[]>,
    ]);

    const cityObj = cities.find((c) => c.slug === citySlug);
    if (!cityObj) return null;

    const catObj = categorySlug
      ? categories.find((c) => c.slug === categorySlug)
      : undefined;

    const results = await searchApi.search({
      cityId: cityObj.id,
      categoryId: catObj?.id,
      limit: 12,
      page,
      sortBy: 'relevance',
    }) as unknown as SearchResult;

    return { city: cityObj, category: catObj ?? null, results, allCities: cities };
  } catch {
    return null;
  }
}

/* ── Static params ─────────────────────────────────────────────────────── */
export async function generateStaticParams() {
  return STATIC_SEO_SLUGS;
}

/* ── Metadata — DB-driven with fallback ───────────────────────────────── */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoSlug } = await params;
  const parsed = parseSeoSlug(seoSlug);
  if (!parsed) return { title: 'Not Found', robots: { index: false, follow: false } };

  const { displayService, citySlug, isAllEvents } = parsed;
  const cityName = citySlugToName(citySlug);
  const dbPage = await getDbSeoPage(seoSlug);

  const metaTitle = dbPage?.metaTitle
    || (isAllEvents
      ? `Events & Vendors in ${cityName} — PlanToday`
      : `Best ${displayService} in ${cityName} — PlanToday`);

  const metaDesc = dbPage?.metaDescription
    || (isAllEvents
      ? `Find top wedding photographers, caterers, venues, DJs & decorators in ${cityName}. 500+ verified vendors with free instant quotes.`
      : `Find top-rated ${displayService.toLowerCase()} in ${cityName}. Compare prices, read reviews & get free quotes from 500+ verified vendors.`);

  const keywords = dbPage?.metaKeywords
    ? dbPage.metaKeywords.split(',').map((k) => k.trim())
    : [
        `${displayService.toLowerCase()} in ${cityName}`,
        `best ${displayService.toLowerCase()} ${cityName}`,
        `${displayService.toLowerCase()} near me`,
        `hire ${displayService.toLowerCase()} ${cityName}`,
      ];

  const canonicalUrl = dbPage?.canonicalUrl || `/${seoSlug}`;

  return {
    title: metaTitle,
    description: metaDesc,
    keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: { title: metaTitle, description: metaDesc, type: 'website' },
    twitter: { card: 'summary_large_image', title: metaTitle },
  };
}

/* ── Page component ────────────────────────────────────────────────────── */
export default async function SeoListingPage({ params, searchParams }: Props) {
  const { seoSlug } = await params;
  const sp = searchParams ? await searchParams : {};
  const page = Number(sp.page) || 1;

  const parsed = parseSeoSlug(seoSlug);
  if (!parsed) notFound();

  const { categorySlug, citySlug, displayService, isAllEvents } = parsed;
  const cityName = citySlugToName(citySlug);

  // Fetch DB SEO data + vendor data in parallel
  const [dbPage, data] = await Promise.all([
    getDbSeoPage(seoSlug),
    getPageData(categorySlug, citySlug, page),
  ]);

  const cityExists = data !== null;

  // DB-driven content with fallback
  const h1 = dbPage?.h1
    || (isAllEvents ? `Events & Vendors in ${cityName}` : `Best ${displayService} in ${cityName}`);

  const description = dbPage?.metaDescription
    || (isAllEvents
      ? `Discover verified event vendors across all categories in ${cityName}. Free instant quotes.`
      : `Find top-rated, verified ${displayService.toLowerCase()} in ${cityName}. Compare prices & get free quotes instantly.`);

  // Parse FAQ
  let faqItems: FaqItem[] = [];
  if (dbPage?.faqJson) {
    try { faqItems = JSON.parse(dbPage.faqJson); } catch { /* ignore */ }
  }

  // Build JSON-LD
  let jsonLd: object;
  if (dbPage?.schemaJson) {
    try { jsonLd = JSON.parse(dbPage.schemaJson); } catch {
      jsonLd = buildDefaultSchema(h1, description, seoSlug, data);
    }
  } else {
    jsonLd = buildDefaultSchema(h1, description, seoSlug, data);
  }

  const relatedCities = ['noida', 'delhi', 'gurgaon', 'faridabad', 'ghaziabad', 'greater-noida']
    .filter((c) => c !== citySlug);
  const relatedServices = Object.entries(CATEGORY_TO_SEO)
    .filter(([cat]) => cat !== categorySlug)
    .slice(0, 8);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqItems.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqItems.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            }),
          }}
        />
      )}

      {/* Auto-scroll to vendor list on pagination (mobile) */}
      <Suspense fallback={null}>
        <PaginationScroller />
      </Suspense>

      <div className="min-h-screen bg-gray-50">
        {/* Compact breadcrumb header */}
        <div className="bg-gradient-to-r from-gray-900 to-red-950 text-white py-6 px-4">
          <div className="max-w-7xl mx-auto">
            <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-3" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-white transition">Home</Link>
              <span>/</span>
              <Link href={`/events-in-${citySlug}`} className="hover:text-white transition">{cityName}</Link>
              {!isAllEvents && (<><span>/</span><span className="text-gray-300">{displayService}</span></>)}
            </nav>
            {cityExists && data?.results && (
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="flex items-center gap-1 bg-white/10 rounded-full px-3 py-1">
                  <span className="text-green-400">✓</span><strong>{data.results.meta.total}</strong> verified vendors
                </span>
                <span className="flex items-center gap-1 bg-white/10 rounded-full px-3 py-1">⚡ Free instant quotes</span>
                <span className="flex items-center gap-1 bg-white/10 rounded-full px-3 py-1">📍 {cityName}</span>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-6">
            {/* Sidebar */}
            <aside className="hidden lg:block w-60 xl:w-64 shrink-0">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20 space-y-6">
                {!isAllEvents && (
                  <div>
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">More in {cityName}</p>
                    <ul className="space-y-1">
                      {relatedServices.map(([cat, seo]) => (
                        <li key={cat}>
                          <Link href={`/${seo}-in-${citySlug}`} className="text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 flex items-center gap-2 px-2 py-1.5 rounded-xl transition">
                            <span className="text-red-400 text-[8px]">▶</span>
                            {cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} in {cityName}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">
                    {isAllEvents ? 'Events in Other Cities' : `${displayService} in Other Cities`}
                  </p>
                  <ul className="space-y-1">
                    {relatedCities.map((c) => (
                      <li key={c}>
                        <Link
                          href={isAllEvents ? `/events-in-${c}` : `/${CATEGORY_TO_SEO[categorySlug] ?? categorySlug}-in-${c}`}
                          className="text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 flex items-center gap-2 px-2 py-1.5 rounded-xl transition"
                        >
                          <span className="text-red-400 text-[8px]">▶</span>{citySlugToName(c)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl p-4 text-white text-center">
                  <p className="font-extrabold text-sm mb-1">Are You a Vendor?</p>
                  <p className="text-xs text-red-100 mb-3">Get leads from {cityName}</p>
                  <Link href="/partner/onboard" className="block bg-white text-red-700 font-extrabold text-xs px-4 py-2 rounded-xl hover:bg-red-50 transition">List Free →</Link>
                </div>
              </div>
            </aside>

            {/* Main column */}
            <div className="flex-1 min-w-0" id="vendor-list">
              {/* ── Title + SEO content TOP — above the listing ── */}
              <div className="mb-5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-2">{h1}</h1>
                <p className="text-gray-500 text-sm sm:text-base mb-3">{description}</p>
                {dbPage?.seoContentTop && (
                  <div className="prose prose-sm max-w-none text-gray-600 bg-white rounded-2xl border border-gray-100 px-5 py-4"
                    dangerouslySetInnerHTML={{ __html: dbPage.seoContentTop }} />
                )}
              </div>

              {/* ── Vendor listing ── */}
              {!cityExists || !data ? (
                <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
                  <div className="text-6xl mb-4">🏙️</div>
                  <h2 className="text-xl font-extrabold text-gray-800 mb-2">Coming to {cityName} Soon</h2>
                  <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">We&apos;re expanding to {cityName}. Be the first vendor to list!</p>
                  <Link href="/partner/onboard" className="bg-red-600 text-white font-extrabold px-6 py-3 rounded-2xl hover:bg-red-700 transition">List Your Business Free →</Link>
                </div>
              ) : data.results?.data?.length ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-600"><strong className="text-gray-900 text-base">{data.results.meta.total}</strong> vendors found</p>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-full">
                        <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        All Verified
                      </span>
                      <span className="flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-full">⚡ Free Quotes</span>
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col gap-3">
                    {data.results.data.map((vendor, idx) => (
                      <VendorListCard key={vendor.id} vendor={vendor} rank={idx + 1 + (page - 1) * 12} />
                    ))}
                  </div>
                  <div className="sm:hidden grid grid-cols-2 gap-3">
                    {data.results.data.map((vendor) => (<VendorListCard key={vendor.id} vendor={vendor} />))}
                  </div>
                  {data.results.meta.pages > 1 && (
                    <div className="flex justify-center gap-2 mt-8 flex-wrap">
                      {page > 1 && <Link href={`/${seoSlug}?page=${page - 1}#vendor-list`} className="px-4 py-2 rounded-full text-sm font-medium border border-gray-200 text-gray-600 hover:border-red-400 transition">‹ Prev</Link>}
                      {[...Array(Math.min(data.results.meta.pages, 7))].map((_, i) => (
                        <Link key={i} href={`/${seoSlug}?page=${i + 1}#vendor-list`} className={`w-9 h-9 rounded-full text-sm font-bold flex items-center justify-center transition ${page === i + 1 ? 'bg-red-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600'}`}>{i + 1}</Link>
                      ))}
                      {page < data.results.meta.pages && <Link href={`/${seoSlug}?page=${page + 1}#vendor-list`} className="px-4 py-2 rounded-full text-sm font-medium border border-gray-200 text-gray-600 hover:border-red-400 transition">Next ›</Link>}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
                  <div className="text-6xl mb-4">🔍</div>
                  <h2 className="text-xl font-extrabold text-gray-800 mb-2">{displayService} in {cityName} — Coming Soon</h2>
                  <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">We&apos;re onboarding vendors in this category. Be the first!</p>
                  <div className="flex gap-3 justify-center">
                    <Link href="/partner/onboard" className="bg-red-600 text-white font-extrabold px-6 py-3 rounded-2xl hover:bg-red-700 transition">List Your Business Free →</Link>
                    <Link href={`/events-in-${citySlug}`} className="border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-2xl hover:border-red-300 transition">All vendors in {cityName}</Link>
                  </div>
                </div>
              )}

              {/* ── SEO content BOTTOM — below the listing ── */}
              {dbPage?.seoContentBottom && (
                <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-6">
                  <div className="prose prose-sm max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: dbPage.seoContentBottom }} />
                </div>
              )}

              {/* ── FAQ — below the listing ── */}
              {faqItems.length > 0 && (
                <section className="mt-8">
                  <h2 className="text-lg font-extrabold text-gray-900 mb-4">Frequently Asked Questions</h2>
                  <div className="space-y-3">
                    {faqItems.map((faq, i) => (
                      <details key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm group">
                        <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none">
                          <span className="font-semibold text-gray-900 text-sm pr-4">{faq.q}</span>
                          <span className="text-gray-400 group-open:rotate-180 transition-transform shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                          </span>
                        </summary>
                        <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">{faq.a}</div>
                      </details>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Why PlanToday ── */}
              <section className="mt-8 grid sm:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-base font-extrabold text-gray-900 mb-4">
                    Why Choose PlanToday for {isAllEvents ? `Vendors in ${cityName}` : `${displayService} in ${cityName}`}?
                  </h2>
                  <ul className="space-y-2.5">
                    {[
                      `All ${isAllEvents ? 'vendors' : displayService.toLowerCase()} are verified and background checked`,
                      'Free quotes — zero booking fees or commissions',
                      'Compare multiple vendors with real customer reviews',
                      `Hyperlocal vendors serving ${cityName} specifically`,
                      'Average response time under 2 hours',
                    ].map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-gray-900 to-red-950 rounded-2xl p-6 text-white flex flex-col justify-between">
                  <div>
                    <div className="text-3xl mb-3">🏪</div>
                    <h3 className="text-base font-extrabold mb-2">Are You a {isAllEvents ? 'Vendor' : displayService.replace(/s$/, '')} in {cityName}?</h3>
                    <p className="text-gray-300 text-sm leading-relaxed mb-4">Join thousands of vendors on PlanToday and start receiving quality leads in under 5 minutes. It&apos;s completely free.</p>
                    <ul className="space-y-1.5 text-xs text-gray-300 mb-5">
                      {['Free basic listing', 'Premium visibility plans', 'Direct lead notifications', 'Profile analytics'].map((f) => (
                        <li key={f} className="flex items-center gap-2"><span className="text-yellow-400">✓</span> {f}</li>
                      ))}
                    </ul>
                  </div>
                  <Link href="/partner/onboard" className="block text-center bg-white text-red-700 font-extrabold text-sm px-6 py-2.5 rounded-2xl hover:bg-red-50 transition">List My Business — Free →</Link>
                </div>
              </section>

              {/* ── Related categories ── */}
              {!isAllEvents && (
                <section className="mt-8">
                  <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-wider mb-3">Related Services in {cityName}</h2>
                  <div className="flex flex-wrap gap-2">
                    {relatedServices.map(([cat, seo]) => (
                      <Link key={cat} href={`/${seo}-in-${citySlug}`} className="text-sm border border-gray-200 text-gray-600 px-3.5 py-1.5 rounded-full hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition bg-white">
                        {cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} in {cityName}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Cross-city links ── */}
              <section className="mt-5 mb-8">
                <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-wider mb-3">
                  {isAllEvents ? 'Explore Other Cities' : `${displayService} in Other Cities`}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {relatedCities.map((c) => {
                    const href = isAllEvents ? `/events-in-${c}` : `/${CATEGORY_TO_SEO[categorySlug] ?? categorySlug}-in-${c}`;
                    return (
                      <Link key={c} href={href} className="text-sm border border-gray-200 text-gray-600 px-3.5 py-1.5 rounded-full hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition bg-white">
                        {isAllEvents ? `Events in ${citySlugToName(c)}` : `${displayService} in ${citySlugToName(c)}`}
                      </Link>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function buildDefaultSchema(
  title: string,
  description: string,
  seoSlug: string,
  data: Awaited<ReturnType<typeof getPageData>>,
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    description,
    url: `https://plantoday.in/${seoSlug}`,
    ...(data?.results?.data?.length
      ? {
          numberOfItems: data.results.meta.total,
          itemListElement: data.results.data.slice(0, 5).map((v, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: v.businessName,
            url: `https://plantoday.in/vendor/${v.slug}`,
          })),
        }
      : {}),
  };
}
