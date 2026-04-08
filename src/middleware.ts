import { NextRequest, NextResponse } from 'next/server';

/**
 * Launch Gate Middleware
 *
 * When the app has not yet launched, this middleware intercepts every
 * navigable route and redirects to "/" — which renders the coming-soon
 * landing page.  Once LAUNCH_DATE_TIME has passed (server time), all
 * routes become accessible again automatically on the next request
 * without any redeploy.
 *
 * Efficiency note: we read LAUNCH_DATE_TIME directly from the Edge
 * environment rather than making an outbound network call on every
 * request.  The value is set once at deploy / server start time and the
 * time comparison is O(1).
 */

// Paths that are always allowed regardless of launch state
const ALWAYS_ALLOWED = [
  '/api/launch-config', // the polling endpoint itself
  '/api/',              // other API routes must stay reachable
  '/_next/',            // Next.js internals
  '/favicon',
  '/robots.txt',
  '/sitemap.xml',
];

function isLaunchedNow(): boolean {
  const raw = process.env.LAUNCH_DATE_TIME;
  if (!raw) return true; // no config → treat as already launched

  const launchDateTime = new Date(raw);
  if (isNaN(launchDateTime.getTime())) return true; // malformed → fail open

  return Date.now() >= launchDateTime.getTime();
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and API routes are always allowed
  if (ALWAYS_ALLOWED.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  if (!isLaunchedNow()) {
    // Allow the root path (renders the landing page)
    if (pathname === '/') return NextResponse.next();

    // Block every other navigable route — redirect to landing page
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url, { status: 302 });
  }

  return NextResponse.next();
}

export const config = {
  // Run on all paths except Next.js static chunks and image optimizer
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};
