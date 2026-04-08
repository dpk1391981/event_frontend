/**
 * Legacy route: /noida/photography
 * Permanently redirects to canonical SEO URL: /photographers-in-noida
 *
 * Next.js 15+ passes params as a Promise — must be awaited.
 * The first segment shares the [seoSlug] name with the parent dynamic route
 * to avoid Next.js "different slug names" conflict.
 */
import { permanentRedirect } from 'next/navigation';
import { buildSeoUrl } from '@/lib/seo-urls';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ seoSlug: string; service: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoSlug: city, service } = await params;
  const target = buildSeoUrl(service, city);
  return {
    alternates: { canonical: target },
    robots: { index: false, follow: true },
  };
}

export default async function LegacyCityServicePage({ params }: Props) {
  const { seoSlug: city, service } = await params;
  permanentRedirect(buildSeoUrl(service, city));
}
