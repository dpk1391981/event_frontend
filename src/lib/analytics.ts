/**
 * Plantoday Analytics — fires only when cookie consent is granted.
 * Consent is stored in localStorage under key "pt_cookie_consent".
 * Values: "granted" | "denied" | undefined (not yet decided)
 */

// Matches the key used by CookieConsent component
const CONSENT_KEY = 'pt_cookie_consent';
const EVENTS_KEY  = 'pt_events';

/** Returns true when user has accepted analytics cookies */
function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CONSENT_KEY) === 'all';
}

/** Track a named event with optional properties. No-op if analytics consent not granted. */
export function track(name: string, props?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  if (!hasAnalyticsConsent()) return;

  const event = { name, props, ts: Date.now() };

  // Push to window.dataLayer for GTM / GA4 compatibility
  const w = window as any;
  if (!w.dataLayer) w.dataLayer = [];
  w.dataLayer.push({ event: name, ...props });

  // Also persist to localStorage for offline/replay (keep last 200 events)
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    const list: typeof event[] = raw ? JSON.parse(raw) : [];
    list.push(event);
    if (list.length > 200) list.splice(0, list.length - 200);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(list));
  } catch { /* storage full — ignore */ }
}

/** Common tracked events */
export const Analytics = {
  planView:       (params: { eventType: string; budget: number; cityId: number }) =>
    track('plan_view', params),
  packageSelect:  (tag: string, cost: number) =>
    track('package_select', { tag, cost }),
  bookClick:      (tag: string, cost: number) =>
    track('plan_book_click', { tag, cost }),
  customizeClick: () => track('plan_customize_click'),
  compareClick:   () => track('plan_compare_click'),
  leadSubmit:     (source: string) => track('lead_submit', { source }),
};
