import { NextResponse } from 'next/server';

export interface LaunchConfig {
  launchDateTime: string;
  isLaunched: boolean;
}

/**
 * GET /api/launch-config
 *
 * Proxies to the NestJS backend and adds a 30-second server-side cache.
 * Falls back to computing from LAUNCH_DATE_TIME env var if NestJS is unreachable.
 * The response also carries Cache-Control so the CDN / browser caches briefly.
 */
export async function GET() {
  try {
    const internalApi =
      process.env.INTERNAL_API_URL || 'http://localhost:3001';

    const res = await fetch(`${internalApi}/api/v1/launch-config`, {
      // Next.js ISR — revalidate cached result every 30 seconds on the server
      next: { revalidate: 30 },
    });

    if (!res.ok) throw new Error(`Upstream ${res.status}`);

    const data: LaunchConfig = await res.json();

    return NextResponse.json(data, {
      headers: {
        // Allow browsers / CDN to cache for 30 s and serve stale for up to 60 s
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch {
    // Fallback: compute locally from env so the page keeps working even if
    // NestJS is temporarily down during startup.
    const launchDateTimeStr =
      process.env.LAUNCH_DATE_TIME || '2026-04-15T10:00:00+05:30';
    const launchDateTime = new Date(launchDateTimeStr);
    const isLaunched =
      isNaN(launchDateTime.getTime()) ? false : new Date() >= launchDateTime;

    return NextResponse.json(
      { launchDateTime: launchDateTimeStr, isLaunched },
      {
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }
}
