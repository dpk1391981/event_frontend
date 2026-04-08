import type { MetadataRoute } from 'next';
import { STATIC_SEO_SLUGS } from '@/lib/seo-urls';
import { locationsApi, categoriesApi } from '@/lib/api';
import { City, Category } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://plantoday.in';

const BUDGET_TIERS = ['50k', '2l', '5l', '10l'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── Static pages ──────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,               lastModified: now, changeFrequency: 'daily',  priority: 1.0 },
    { url: `${BASE_URL}/plan`,     lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/search`,   lastModified: now, changeFrequency: 'daily',  priority: 0.8 },
    { url: `${BASE_URL}/events/create`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  // ── Vendor-listing SEO pages (/photographers-in-noida etc.) ──────────────
  const seoListingPages: MetadataRoute.Sitemap = STATIC_SEO_SLUGS.map(({ seoSlug }) => ({
    url: `${BASE_URL}/${seoSlug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // ── Event-plan SEO pages — slugs built from API data ─────────────────────
  let planPages: MetadataRoute.Sitemap = [];
  try {
    const [citiesRaw, eventCatsRaw] = await Promise.all([
      locationsApi.getCities()      as Promise<unknown>,
      categoriesApi.getAll('event') as Promise<unknown>,
    ]);
    const cities    = (citiesRaw as City[]).slice(0, 10);
    const eventCats = eventCatsRaw as Category[];

    const slugs: string[] = [];
    for (const cat of eventCats) {
      for (const city of cities) {
        for (const budget of BUDGET_TIERS) {
          slugs.push(`${cat.slug}-plan-${city.slug}-under-${budget}`);
        }
        slugs.push(`${cat.slug}-plan-${city.slug}`);
      }
    }

    planPages = slugs.map(slug => ({
      url: `${BASE_URL}/event-plan/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {
    // API unavailable — sitemap still works, just without plan pages
  }

  return [...staticPages, ...seoListingPages, ...planPages];
}
