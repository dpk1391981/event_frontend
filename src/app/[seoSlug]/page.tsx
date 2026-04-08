/**
 * SEO-friendly vendor listing page.
 *
 * URL format:  /{service}-in-{city}
 * Examples:
 *   /photographers-in-noida
 *   /caterers-in-delhi
 *   /wedding-planners-in-gurgaon
 *   /events-in-noida          (all vendors in city)
 *
 * Next.js 15+: params is a Promise → must be awaited.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  parseSeoSlug,
  buildSeoUrl,
  citySlugToName,
  CATEGORY_TO_SEO,
  STATIC_SEO_SLUGS,
} from '@/lib/seo-urls';
import { searchApi, locationsApi, categoriesApi } from '@/lib/api';
import type { SearchResult, City, Category } from '@/types';
import VendorListCard from '@/components/vendor/VendorListCard';

interface Props {
  params: Promise<{ seoSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

/* ── Data fetching ─────────────────────────────────────────────────────── */

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

/* ── Static params (pre-render top combinations) ──────────────────────── */
export async function generateStaticParams() {
  return STATIC_SEO_SLUGS;
}

/* ── Metadata ──────────────────────────────────────────────────────────── */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoSlug } = await params;
  const parsed = parseSeoSlug(seoSlug);
  if (!parsed) return { title: 'Not Found', robots: { index: false, follow: false } };

  const { displayService, citySlug, isAllEvents } = parsed;
  const cityName = citySlugToName(citySlug);
  const canonicalUrl = `/${seoSlug}`;

  if (isAllEvents) {
    return {
      title: `Events & Vendors in ${cityName} — PlanToday`,
      description: `Find top wedding photographers, caterers, venues, DJs & decorators in ${cityName}. 500+ verified vendors with free instant quotes.`,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title: `Events & Vendors in ${cityName} | PlanToday`,
        description: `Find verified event vendors in ${cityName}. Free instant quotes.`,
        type: 'website',
      },
    };
  }

  return {
    title: `Best ${displayService} in ${cityName} — PlanToday`,
    description: `Find top-rated ${displayService.toLowerCase()} in ${cityName}. Compare prices, read reviews & get free quotes from 500+ verified vendors.`,
    keywords: [
      `${displayService.toLowerCase()} in ${cityName}`,
      `best ${displayService.toLowerCase()} ${cityName}`,
      `${displayService.toLowerCase()} near me`,
      `hire ${displayService.toLowerCase()} ${cityName}`,
      `${cityName} event vendors`,
    ],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `Best ${displayService} in ${cityName} | PlanToday`,
      description: `Hire verified ${displayService.toLowerCase()} in ${cityName}. Free quotes, no fees.`,
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: `Best ${displayService} in ${cityName}` },
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

  const data = await getPageData(categorySlug, citySlug, page);

  // City not in our DB → soft 404 with helpful message
  const cityExists = data !== null;

  const title = isAllEvents
    ? `Events & Vendors in ${cityName}`
    : `Best ${displayService} in ${cityName}`;

  const description = isAllEvents
    ? `Discover verified event vendors across all categories in ${cityName}. Free instant quotes.`
    : `Find top-rated, verified ${displayService.toLowerCase()} in ${cityName}. Compare prices & get free quotes instantly.`;

  // Related cities for SEO cross-linking
  const relatedCities = ['noida', 'delhi', 'gurgaon', 'faridabad', 'ghaziabad', 'greater-noida']
    .filter((c) => c !== citySlug);

  // Related services in same city
  const relatedServices = Object.entries(CATEGORY_TO_SEO)
    .filter(([cat]) => cat !== categorySlug)
    .slice(0, 8);

  // JSON-LD schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    description,
    url: `https://plantoday.in/${seoSlug}`,
    ...(data?.results?.data?.length ? {
      numberOfItems: data.results.meta.total,
      itemListElement: data.results.data.slice(0, 5).map((v, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: v.businessName,
        url: `https://plantoday.in/vendor/${v.slug}`,
      })),
    } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="min-h-screen bg-gray-50">
        {/* ── Page header banner ─────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-gray-900 to-red-950 text-white py-10 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-white transition">Home</Link>
              <span>/</span>
              <Link href={`/events-in-${citySlug}`} className="hover:text-white transition">{cityName}</Link>
              {!isAllEvents && (
                <>
                  <span>/</span>
                  <span className="text-gray-300">{displayService}</span>
                </>
              )}
            </nav>

            <h1 className="text-2xl sm:text-4xl font-extrabold mb-3 leading-tight">{title}</h1>
            <p className="text-gray-300 text-sm sm:text-base max-w-2xl">{description}</p>

            {/* Quick stats */}
            {cityExists && data?.results && (
              <div className="flex flex-wrap gap-4 mt-5 text-sm">
                <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-4 py-1.5">
                  <span className="text-green-400">✓</span>
                  <strong>{data.results.meta.total}</strong> verified vendors
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-4 py-1.5">
                  <span>⚡</span> Free instant quotes
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-4 py-1.5">
                  <span>📍</span> {cityName} based
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Main content ────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-6">

            {/* ── Sidebar ─────────────────────────────────────────────── */}
            <aside className="hidden lg:block w-60 xl:w-64 shrink-0">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20 space-y-6">

                {/* Related services */}
                {!isAllEvents && (
                  <div>
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">
                      More in {cityName}
                    </p>
                    <ul className="space-y-1">
                      {relatedServices.map(([cat, seo]) => (
                        <li key={cat}>
                          <Link
                            href={`/${seo}-in-${citySlug}`}
                            className="text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 flex items-center gap-2 px-2 py-1.5 rounded-xl transition"
                          >
                            <span className="text-red-400 text-[8px]">▶</span>
                            {cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} in {cityName}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Related cities */}
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
                          <span className="text-red-400 text-[8px]">▶</span>
                          {citySlugToName(c)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl p-4 text-white text-center">
                  <p className="font-extrabold text-sm mb-1">Are You a Vendor?</p>
                  <p className="text-xs text-red-100 mb-3">Get leads from {cityName}</p>
                  <Link href="/partner/onboard" className="block bg-white text-red-700 font-extrabold text-xs px-4 py-2 rounded-xl hover:bg-red-50 transition">
                    List Free →
                  </Link>
                </div>
              </div>
            </aside>

            {/* ── Vendor list ─────────────────────────────────────────── */}
            <div className="flex-1 min-w-0">
              {!cityExists || !data ? (
                /* City not in DB */
                <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
                  <div className="text-6xl mb-4">🏙️</div>
                  <h2 className="text-xl font-extrabold text-gray-800 mb-2">Coming to {cityName} Soon</h2>
                  <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                    We&apos;re expanding to {cityName}. Be the first vendor to list and get early leads!
                  </p>
                  <Link href="/partner/onboard" className="bg-red-600 text-white font-extrabold px-6 py-3 rounded-2xl hover:bg-red-700 transition">
                    List Your Business Free →
                  </Link>
                </div>
              ) : data.results?.data?.length ? (
                <>
                  {/* Result count + sort */}
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-600">
                      <strong className="text-gray-900 text-base">{data.results.meta.total}</strong> vendors found
                    </p>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-full">
                        <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        All Verified
                      </span>
                      <span className="flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-full">
                        ⚡ Free Quotes
                      </span>
                    </div>
                  </div>

                  {/* Desktop: list view (99acres style) */}
                  <div className="hidden sm:flex flex-col gap-3">
                    {data.results.data.map((vendor, idx) => (
                      <VendorListCard
                        key={vendor.id}
                        vendor={vendor}
                        rank={idx + 1 + (page - 1) * 12}
                      />
                    ))}
                  </div>

                  {/* Mobile: 2-col grid */}
                  <div className="sm:hidden grid grid-cols-2 gap-3">
                    {data.results.data.map((vendor) => (
                      <VendorListCard key={vendor.id} vendor={vendor} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {data.results.meta.pages > 1 && (
                    <div className="flex justify-center gap-2 mt-8 flex-wrap">
                      {page > 1 && (
                        <Link href={`/${seoSlug}?page=${page - 1}`} className="px-4 py-2 rounded-full text-sm font-medium border border-gray-200 text-gray-600 hover:border-red-400 transition">
                          ‹ Prev
                        </Link>
                      )}
                      {[...Array(Math.min(data.results.meta.pages, 7))].map((_, i) => (
                        <Link
                          key={i}
                          href={`/${seoSlug}?page=${i + 1}`}
                          className={`w-9 h-9 rounded-full text-sm font-bold flex items-center justify-center transition ${
                            page === i + 1
                              ? 'bg-red-600 text-white shadow-md'
                              : 'bg-white border border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600'
                          }`}
                        >
                          {i + 1}
                        </Link>
                      ))}
                      {page < data.results.meta.pages && (
                        <Link href={`/${seoSlug}?page=${page + 1}`} className="px-4 py-2 rounded-full text-sm font-medium border border-gray-200 text-gray-600 hover:border-red-400 transition">
                          Next ›
                        </Link>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* No vendors in this category+city */
                <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
                  <div className="text-6xl mb-4">🔍</div>
                  <h2 className="text-xl font-extrabold text-gray-800 mb-2">
                    {displayService} in {cityName} — Coming Soon
                  </h2>
                  <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                    We&apos;re onboarding vendors in this category. Be the first to list!
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link href="/partner/onboard" className="bg-red-600 text-white font-extrabold px-6 py-3 rounded-2xl hover:bg-red-700 transition">
                      List Your Business Free →
                    </Link>
                    <Link href={`/events-in-${citySlug}`} className="border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-2xl hover:border-red-300 transition">
                      All vendors in {cityName}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── SEO Content ─────────────────────────────────────────── */}
          <section className="mt-14 grid sm:grid-cols-2 gap-6">
            {/* Why PlanToday */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
              <h2 className="text-lg font-extrabold text-gray-900 mb-4">
                Why Choose PlanToday for {isAllEvents ? `Vendors in ${cityName}` : `${displayService} in ${cityName}`}?
              </h2>
              <ul className="space-y-2.5">
                {[
                  `All ${isAllEvents ? 'vendors' : displayService.toLowerCase()} are verified and background checked`,
                  'Free quotes — zero booking fees or commissions',
                  'Compare multiple vendors with real customer reviews',
                  'AI-powered matching based on your budget & requirements',
                  `Hyperlocal vendors serving ${cityName} specifically`,
                  'Average response time under 2 hours',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Vendor CTA */}
            <div className="bg-gradient-to-br from-gray-900 to-red-950 rounded-2xl p-7 text-white flex flex-col justify-between">
              <div>
                <div className="text-4xl mb-3">🏪</div>
                <h3 className="text-lg font-extrabold mb-2">
                  Are You a {isAllEvents ? 'Vendor' : displayService.replace(/s$/, '')} in {cityName}?
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-5">
                  Join thousands of vendors on PlanToday and start receiving quality leads in under 5 minutes. It&apos;s completely free.
                </p>
                <ul className="space-y-1.5 text-xs text-gray-300 mb-6">
                  {['Free basic listing', 'Premium visibility plans', 'Direct lead notifications', 'Profile analytics'].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="text-yellow-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/partner/onboard" className="block text-center bg-white text-red-700 font-extrabold px-6 py-3 rounded-2xl hover:bg-red-50 transition">
                List My Business — Free →
              </Link>
            </div>
          </section>

          {/* ── Related categories (SEO internal links) ────────────── */}
          {!isAllEvents && (
            <section className="mt-10">
              <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-wider mb-4">
                Related Services in {cityName}
              </h2>
              <div className="flex flex-wrap gap-2">
                {relatedServices.map(([cat, seo]) => (
                  <Link
                    key={cat}
                    href={`/${seo}-in-${citySlug}`}
                    className="text-sm border border-gray-200 text-gray-600 px-3.5 py-1.5 rounded-full hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition bg-white"
                  >
                    {cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} in {cityName}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Cross-city SEO links ────────────────────────────────── */}
          <section className="mt-6">
            <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-wider mb-4">
              {isAllEvents ? 'Explore Other Cities' : `${displayService} in Other Cities`}
            </h2>
            <div className="flex flex-wrap gap-2">
              {relatedCities.map((c) => {
                const href = isAllEvents
                  ? `/events-in-${c}`
                  : `/${CATEGORY_TO_SEO[categorySlug] ?? categorySlug}-in-${c}`;
                return (
                  <Link
                    key={c}
                    href={href}
                    className="text-sm border border-gray-200 text-gray-600 px-3.5 py-1.5 rounded-full hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition bg-white"
                  >
                    {isAllEvents ? `Events in ${citySlugToName(c)}` : `${displayService} in ${citySlugToName(c)}`}
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
