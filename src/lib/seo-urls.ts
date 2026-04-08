/**
 * SEO URL utilities for PlanToday
 *
 * SEO URL format:  /{service-plural}-in-{city}
 * Examples:
 *   /photographers-in-noida
 *   /caterers-in-delhi
 *   /wedding-planners-in-gurgaon
 *   /events-in-noida  (all vendors/events in a city)
 */

/* ── Category slug → SEO-friendly plural service name ─────────────────── */
export const CATEGORY_TO_SEO: Record<string, string> = {
  photography:   'photographers',
  catering:      'caterers',
  venue:         'event-venues',
  decoration:    'decorators',
  'dj-music':    'dj-services',
  makeup:        'makeup-artists',
  mehendi:       'mehendi-artists',
  choreography:  'choreographers',
  wedding:       'wedding-planners',
  birthday:      'birthday-planners',
  corporate:     'corporate-event-planners',
  anniversary:   'anniversary-planners',
  reception:     'reception-planners',
  engagement:    'engagement-planners',
  'baby-shower': 'baby-shower-planners',
  'puja-ceremony':'puja-ceremony-pandits',
  sports:        'sports-event-organizers',
};

/* ── SEO service name → category slug ─────────────────────────────────── */
export const SEO_TO_CATEGORY: Record<string, string> = {
  photographers:              'photography',
  caterers:                   'catering',
  'event-venues':             'venue',
  venues:                     'venue',
  decorators:                 'decoration',
  'dj-services':              'dj-music',
  'makeup-artists':           'makeup',
  'mehendi-artists':          'mehendi',
  choreographers:             'choreography',
  'wedding-planners':         'wedding',
  'birthday-planners':        'birthday',
  'corporate-event-planners': 'corporate',
  'corporate-events':         'corporate',
  'anniversary-planners':     'anniversary',
  'reception-planners':       'reception',
  'engagement-planners':      'engagement',
  'baby-shower-planners':     'baby-shower',
  'puja-ceremony-pandits':    'puja-ceremony',
  'sports-event-organizers':  'sports',
  // direct pass-through (old-style slugs still work)
  photography:   'photography',
  catering:      'catering',
  venue:         'venue',
  decoration:    'decoration',
  'dj-music':    'dj-music',
  makeup:        'makeup',
  mehendi:       'mehendi',
  choreography:  'choreography',
  wedding:       'wedding',
  birthday:      'birthday',
  corporate:     'corporate',
  anniversary:   'anniversary',
  reception:     'reception',
  engagement:    'engagement',
};

/* ── Human-readable display names ──────────────────────────────────────── */
export const CATEGORY_DISPLAY: Record<string, string> = {
  photography:   'Photographers',
  catering:      'Caterers',
  venue:         'Event Venues',
  decoration:    'Decorators',
  'dj-music':    'DJ Services',
  makeup:        'Makeup Artists',
  mehendi:       'Mehendi Artists',
  choreography:  'Choreographers',
  wedding:       'Wedding Planners',
  birthday:      'Birthday Planners',
  corporate:     'Corporate Event Planners',
  anniversary:   'Anniversary Planners',
  reception:     'Reception Planners',
  engagement:    'Engagement Planners',
  'baby-shower': 'Baby Shower Planners',
  'puja-ceremony':'Puja & Ceremony Pandits',
  sports:        'Sports Event Organizers',
};

/** Build canonical SEO URL: /photographers-in-noida
 *  @param categorySlugOrSeoPlural  pass category.seoPlural when available, otherwise category.slug
 */
export function buildSeoUrl(categorySlugOrSeoPlural: string, citySlug: string): string {
  if (!categorySlugOrSeoPlural) return `/events-in-${citySlug}`;
  // If caller passes the DB seoPlural directly it won't be in CATEGORY_TO_SEO → use as-is
  const seoService = CATEGORY_TO_SEO[categorySlugOrSeoPlural] ?? categorySlugOrSeoPlural;
  return `/${seoService}-in-${citySlug}`;
}

/**
 * Build SEO URL from a full Category object (preferred — uses seoPlural field set by admin).
 * Falls back to CATEGORY_TO_SEO map then to slug for backwards-compat.
 */
export function buildSeoUrlFromCategory(
  cat: { slug: string; seoPlural?: string },
  citySlug: string,
): string {
  if (!citySlug) return `/search?q=${encodeURIComponent(cat.slug)}&nlp=1`;
  const plural = cat.seoPlural || CATEGORY_TO_SEO[cat.slug] || cat.slug;
  return `/${plural}-in-${citySlug}`;
}

/** Build city events URL: /events-in-noida */
export function buildCityEventsUrl(citySlug: string): string {
  return `/events-in-${citySlug}`;
}

/**
 * Parse a SEO slug like "photographers-in-noida"
 * Returns null if the slug doesn't match the pattern.
 */
export function parseSeoSlug(slug: string): {
  categorySlug: string;      // DB category slug, '' = all
  seoService: string;        // the extracted service part
  citySlug: string;
  displayService: string;    // human label
  isAllEvents: boolean;
} | null {
  // Must contain "-in-"
  const inIdx = slug.lastIndexOf('-in-');
  if (inIdx <= 0) return null;

  const seoService = slug.substring(0, inIdx);         // "photographers"
  const citySlug   = slug.substring(inIdx + 4);        // "noida"

  if (!citySlug || !seoService) return null;

  const isAllEvents = seoService === 'events';
  const categorySlug = isAllEvents ? '' : (SEO_TO_CATEGORY[seoService] ?? seoService);
  const displayService = CATEGORY_DISPLAY[categorySlug] ?? toTitleCase(seoService.replace(/-/g, ' '));

  return { categorySlug, seoService, citySlug, displayService, isAllEvents };
}

/** Capitalise first letter of each word */
export function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Convert a city slug to display name */
export function citySlugToName(slug: string): string {
  return toTitleCase(slug.replace(/-/g, ' '));
}

/**
 * Static-generation hints for Next.js build (ISR fallback = true so new combos work at runtime).
 * These slugs are PRE-RENDERED at build time for the fastest cold-start.
 * At runtime, any /seoPlural-in-citySlug not in this list is SSR'd on first request.
 *
 * SOURCE OF TRUTH for cities/categories is the database; this list is only a performance hint.
 * Update this list periodically as new cities/categories are added via admin.
 */
export const STATIC_SEO_SLUGS = (() => {
  // Build-time hint only — real pages are served from DB regardless of this list
  const cities = ['noida', 'delhi', 'gurgaon', 'faridabad', 'ghaziabad', 'greater-noida'];
  const services = Object.values(CATEGORY_TO_SEO);  // use seoPlural values, not raw slugs
  const slugs: { seoSlug: string }[] = [];

  for (const city of cities) {
    slugs.push({ seoSlug: `events-in-${city}` });
    for (const seoPlural of services) {
      slugs.push({ seoSlug: `${seoPlural}-in-${city}` });
    }
  }
  return slugs;
})();
