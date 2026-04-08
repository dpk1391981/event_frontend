import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CityLandingPage from '@/components/home/CityLandingPage';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ city: string }>;
}

function slugToName(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  if (!city) return { title: 'PlanToday' };
  const cityName = slugToName(city);
  return {
    title: `Plan Your Event in ${cityName} — PlanToday`,
    description: `Find top-rated wedding photographers, caterers, venues, DJs & decorators in ${cityName}. AI-powered vendor matching. Free quotes instantly.`,
    alternates: { canonical: `/plan-event-in-${city}` },
    openGraph: {
      title: `Plan Your Event in ${cityName} — PlanToday`,
      description: `2000+ verified vendors in ${cityName}. Free instant quotes, AI-powered matching.`,
      type: 'website',
    },
  };
}

export default async function CityHomePage({ params }: Props) {
  const { city: citySlug } = await params;
  if (!citySlug) notFound();
  return <CityLandingPage citySlug={citySlug} />;
}
