import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { searchApi, locationsApi, categoriesApi } from '@/lib/api';
import { City, Category, EventPlan } from '@/types';

// ─── Slug parsing ─────────────────────────────────────────────────────────────
// URL format: {event-category-slug}-plan-{city-slug}-under-{budget}
// e.g. wedding-plan-noida-under-5l  /  birthday-party-plan-delhi-under-2l

interface ParsedPlanSlug {
  eventSlug: string;    // category slug as-is from URL (e.g. "birthday-party")
  citySlug:  string;    // city slug
  budget?:   number;
  guestCount?: number;
}

function parsePlanSlug(slug: string): ParsedPlanSlug | null {
  const planIdx = slug.indexOf('-plan-');
  if (planIdx === -1) return null;

  const eventSlug = slug.substring(0, planIdx);          // e.g. "birthday-party"
  const rest      = slug.substring(planIdx + 6);         // e.g. "noida-under-50k"
  if (!eventSlug || !rest) return null;

  // Parse budget — supports: under-50k, under-5l, under-5lakh, under-5lac
  let budget: number | undefined;
  const budgetMatch = rest.match(/(?:under-)?(\d+(?:\.\d+)?)(k|l|lakh|lac)\b/i);
  if (budgetMatch) {
    const amount = parseFloat(budgetMatch[1]);
    const unit   = budgetMatch[2].toLowerCase();
    budget = unit === 'k' ? amount * 1000 : amount * 100000;
  }

  // Parse guest count — e.g. "200-guests"
  let guestCount: number | undefined;
  const guestMatch = rest.match(/(\d+)-?guests?/i);
  if (guestMatch) guestCount = parseInt(guestMatch[1]);

  // City slug is everything before the budget/guest qualifier
  const cityPart = rest
    .replace(/(?:under-)?(\d+(?:\.\d+)?)(k|l|lakh|lac)\b/i, '')
    .replace(/(\d+)-?guests?/i, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const citySlug = cityPart.split('-')[0];
  if (!citySlug) return null;

  return { eventSlug, citySlug, budget, guestCount };
}

// ─── Static params (fully dynamic from API) ───────────────────────────────────

export async function generateStaticParams() {
  // Budget tiers to pre-render (UI preset, not from DB)
  const BUDGET_TIERS = ['50k', '2l', '5l', '10l'];

  try {
    const [citiesRaw, eventCatsRaw] = await Promise.all([
      locationsApi.getCities() as Promise<unknown>,
      categoriesApi.getAll('event') as Promise<unknown>,
    ]);

    const cities     = (citiesRaw as City[]).slice(0, 8);  // top cities only
    const eventCats  = eventCatsRaw as Category[];

    const slugs: { slug: string }[] = [];
    for (const cat of eventCats) {
      for (const city of cities) {
        for (const budget of BUDGET_TIERS) {
          slugs.push({ slug: `${cat.slug}-plan-${city.slug}-under-${budget}` });
        }
        // City-only variant (no budget qualifier)
        slugs.push({ slug: `${cat.slug}-plan-${city.slug}` });
      }
    }
    return slugs;
  } catch {
    // If the API is unavailable at build time, return empty (pages built on demand)
    return [];
  }
}

// ─── Metadata (dynamic) ───────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parsePlanSlug(slug);
  if (!parsed) return { title: 'Event Plan — PlanToday' };

  // Fetch event category name for the title
  let eventName = parsed.eventSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  try {
    const cats = await categoriesApi.getAll('event') as unknown as Category[];
    const match = cats.find(c => c.slug === parsed.eventSlug);
    if (match) eventName = match.name;
  } catch { /* use slug-derived fallback */ }

  const cityDisplay = parsed.citySlug.charAt(0).toUpperCase() + parsed.citySlug.slice(1);
  const budgetStr   = parsed.budget
    ? parsed.budget >= 100000
      ? `₹${(parsed.budget / 100000).toFixed(0)} Lakh`
      : `₹${(parsed.budget / 1000).toFixed(0)}K`
    : '';

  const title = `${eventName} Plan ${cityDisplay}${budgetStr ? ` under ${budgetStr}` : ''} — PlanToday`;
  const description = `Complete ${eventName.toLowerCase()} vendor plan for ${cityDisplay}${budgetStr ? ` under ${budgetStr} budget` : ''}. Budget breakdown, top venues, caterers, photographers & more. Get free instant quotes.`;

  return {
    title,
    description,
    keywords: [
      `${eventName.toLowerCase()} plan ${cityDisplay}`,
      `${eventName.toLowerCase()} vendors ${cityDisplay}`,
      `${eventName.toLowerCase()} budget ${cityDisplay}`,
      `event planner ${cityDisplay}`,
    ],
    alternates: { canonical: `/event-plan/${slug}` },
    openGraph:  { title, description, type: 'website' },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBudget(n: number) {
  return n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}K`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function EventPlanSeoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const parsed = parsePlanSlug(slug);
  if (!parsed) notFound();

  // Fetch all remote data in parallel
  const [citiesRaw, eventCatsRaw, serviceCatsRaw] = await Promise.allSettled([
    locationsApi.getCities()       as Promise<unknown>,
    categoriesApi.getAll('event')  as Promise<unknown>,
    categoriesApi.getAll('service') as Promise<unknown>,
  ]);

  const cities       = citiesRaw.status       === 'fulfilled' ? (citiesRaw.value as City[])       : [] as City[];
  const eventCats    = eventCatsRaw.status    === 'fulfilled' ? (eventCatsRaw.value as Category[]) : [] as Category[];
  const serviceCats  = serviceCatsRaw.status  === 'fulfilled' ? (serviceCatsRaw.value as Category[]) : [] as Category[];

  // Build a combined slug→Category map for icon/name lookups
  const catMap = new Map<string, Category>(
    [...eventCats, ...serviceCats].map(c => [c.slug, c])
  );

  // Resolve city
  const city = cities.find(
    (c) => c.slug === parsed.citySlug || c.name.toLowerCase() === parsed.citySlug.toLowerCase(),
  );
  if (!city) notFound();

  // Resolve event category display info
  const eventCat  = catMap.get(parsed.eventSlug);
  const eventName = eventCat?.name
    || parsed.eventSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const eventIcon = eventCat?.icon || '🎪';

  const budget = parsed.budget || 500000;

  // Fetch plan server-side
  let plan: EventPlan | null = null;
  try {
    plan = await searchApi.eventPlan(
      parsed.eventSlug,
      budget,
      city.id,
      parsed.guestCount,
    ) as unknown as EventPlan;
  } catch {
    // Render page without vendor data — still useful for SEO + CTA
  }

  const budgetStr = formatBudget(budget);

  // Related cities (all fetched cities excluding current one)
  const relatedCities = cities
    .filter(c => c.slug !== city.slug)
    .slice(0, 4);

  // Budget tier labels (UI presets)
  const BUDGET_TIERS: { label: string; value: string }[] = [
    { label: '₹50K', value: '50k' },
    { label: '₹2L',  value: '2l'  },
    { label: '₹5L',  value: '5l'  },
    { label: '₹10L', value: '10l' },
  ];

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${eventName} Plan ${city.name} — PlanToday`,
    description: `Complete ${eventName} vendor plan for ${city.name} under ${budgetStr}`,
    url: `https://plantoday.in/event-plan/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-br from-gray-950 via-red-950 to-gray-900 text-white py-14 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <nav className="text-xs text-white/50 mb-4 flex items-center justify-center gap-2">
              <Link href="/" className="hover:text-white transition">Home</Link>
              <span>›</span>
              <Link href="/plan" className="hover:text-white transition">Event Plan</Link>
              <span>›</span>
              <span className="text-white/80">{eventName}</span>
            </nav>
            <div className="text-4xl mb-3">{eventIcon}</div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
              {eventName} Plan — {city.name}
              {parsed.guestCount && <span className="text-white/70"> for {parsed.guestCount} Guests</span>}
            </h1>
            <p className="text-white/70 text-base mb-4">
              Complete budget breakdown &amp; top vendor recommendations under {budgetStr}
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <span className="bg-white/10 rounded-full px-4 py-1.5 font-semibold">Budget: {budgetStr}</span>
              {parsed.guestCount && (
                <span className="bg-white/10 rounded-full px-4 py-1.5 font-semibold">Guests: {parsed.guestCount}</span>
              )}
              <span className="bg-white/10 rounded-full px-4 py-1.5 font-semibold">City: {city.name}</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">

          {/* Budget breakdown */}
          {plan && plan.plan.filter(p => p.category !== 'misc').length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-extrabold text-gray-900 text-lg mb-4">Budget Breakdown</h2>
              <div className="space-y-3.5">
                {plan.plan.filter(p => p.category !== 'misc').map(item => {
                  const cat  = catMap.get(item.category);
                  const name = cat?.name || item.category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                  const icon = cat?.icon || '✨';
                  return (
                    <div key={item.category}>
                      <div className="flex justify-between items-center mb-1 text-sm">
                        <span className="flex items-center gap-2 font-semibold text-gray-700">
                          {icon} {name}
                        </span>
                        <span className="font-bold text-gray-900">
                          {formatBudget(item.allocatedBudget)}
                          <span className="text-xs text-gray-400 font-normal ml-1">({item.budgetAllocation}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-500" style={{ width: `${item.budgetAllocation}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vendors by category */}
          {plan?.plan.filter(item => item.category !== 'misc' && item.vendors.length > 0).map(item => {
            const cat  = catMap.get(item.category);
            const name = cat?.name || item.category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const icon = cat?.icon || '✨';
            return (
              <div key={item.category} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                  <h2 className="font-extrabold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                    {icon} {name}
                  </h2>
                  <span className="font-bold text-red-600 text-sm">{formatBudget(item.allocatedBudget)}</span>
                </div>
                <div className="p-4 grid sm:grid-cols-3 gap-3">
                  {item.vendors.map(vendor => (
                    <div key={vendor.id} className="border border-gray-100 rounded-xl p-3.5 hover:border-red-200 transition">
                      <h3 className="font-bold text-sm text-gray-900 mb-1 line-clamp-1">{vendor.businessName}</h3>
                      <p className="text-xs text-gray-500 mb-2">{vendor.city?.name}</p>
                      {vendor.minPrice && (
                        <p className="text-xs font-semibold text-gray-700 mb-2">
                          From ₹{(Number(vendor.minPrice) / 1000).toFixed(0)}K
                        </p>
                      )}
                      {Number(vendor.rating) > 0 && (
                        <p className="text-xs text-yellow-600 mb-2">
                          ★ {Number(vendor.rating).toFixed(1)} ({vendor.reviewCount} reviews)
                        </p>
                      )}
                      <Link
                        href={`/vendor/${vendor.slug}`}
                        className="block w-full text-xs font-bold text-center bg-red-50 text-red-700 py-2 rounded-lg hover:bg-red-100 transition"
                      >
                        View Profile
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Customise CTA */}
          <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl p-6 text-white text-center">
            <h2 className="text-xl font-extrabold mb-2">Want a custom plan for your event?</h2>
            <p className="text-red-200 text-sm mb-4">
              Adjust budget, guests &amp; city — get a personalised plan in 2 minutes.
            </p>
            <Link
              href={`/plan?eventType=${parsed.eventSlug}&budget=${budget}${parsed.guestCount ? `&guestCount=${parsed.guestCount}` : ''}&cityId=${city.id}&autosubmit=1`}
              className="inline-block bg-white text-red-700 font-extrabold px-8 py-3 rounded-xl hover:bg-red-50 transition"
            >
              Customise My Plan →
            </Link>
          </div>

          {/* Cross-links: other budgets + other cities (dynamic from API) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-extrabold text-gray-900 mb-3 text-sm">Related Event Plans</h3>
            <div className="flex flex-wrap gap-2">
              {/* Other budget tiers for same event + city */}
              {BUDGET_TIERS
                .filter(t => {
                  const tierBudget = t.value.endsWith('k')
                    ? parseFloat(t.value) * 1000
                    : parseFloat(t.value) * 100000;
                  return Math.abs(tierBudget - budget) > 1000;
                })
                .map(t => (
                  <Link
                    key={t.value}
                    href={`/event-plan/${parsed.eventSlug}-plan-${city.slug}-under-${t.value}`}
                    className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition"
                  >
                    {eventName} {city.name} under {t.label}
                  </Link>
                ))}

              {/* Same event + other cities (from API) */}
              {relatedCities.map(otherCity => (
                <Link
                  key={otherCity.slug}
                  href={`/event-plan/${parsed.eventSlug}-plan-${otherCity.slug}-under-${parsed.budget ? (parsed.budget >= 100000 ? `${parsed.budget / 100000}l` : `${parsed.budget / 1000}k`) : '5l'}`}
                  className="text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition"
                >
                  {eventName} Plan {otherCity.name}
                </Link>
              ))}

              {/* Other event types for same city (from API) */}
              {eventCats
                .filter(c => c.slug !== parsed.eventSlug)
                .slice(0, 3)
                .map(cat => (
                  <Link
                    key={cat.slug}
                    href={`/event-plan/${cat.slug}-plan-${city.slug}-under-${parsed.budget ? (parsed.budget >= 100000 ? `${parsed.budget / 100000}l` : `${parsed.budget / 1000}k`) : '5l'}`}
                    className="text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full transition border border-gray-200"
                  >
                    {cat.icon || '🎪'} {cat.name} Plan {city.name}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
