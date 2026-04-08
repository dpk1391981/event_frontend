import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CitySync from './CitySync';
import TopVendorCarousel from '@/components/home/TopVendorCarousel';
import CategorySection from '@/components/home/CategorySection';
import CTABanners from '@/components/home/CTABanners';
import SEOContentBlock from '@/components/home/SEOContentBlock';
import PlanWizard from '@/components/home/PlanWizard';
import FeaturedPackages from '@/components/home/FeaturedPackages';
import HeroTicker from '@/components/home/HeroTicker';
import { StoreIcon, CalendarIcon, StarIcon, CheckCircleIcon, ClipboardIcon, RobotIcon } from '@/components/ui/Icon';

// Render city pages on-demand (SSR) — not statically pre-built at deploy time
export const dynamic = 'force-dynamic';

interface Props {
  params: { city: string };
}

function slugToName(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!params?.city) return { title: 'PlanToday' };
  const cityName = slugToName(params.city);
  return {
    title: `Plan Your Event in ${cityName} — PlanToday`,
    description: `Find top-rated wedding photographers, caterers, venues, DJs & decorators in ${cityName}. AI-powered vendor matching. Free quotes instantly.`,
    alternates: { canonical: `/plan-event-in-${params.city}` },
    openGraph: {
      title: `Plan Your Event in ${cityName} — PlanToday`,
      description: `2000+ verified vendors in ${cityName}. Free instant quotes, AI-powered matching.`,
      type: 'website',
    },
  };
}

const STATS = [
  { value: '2,000+', label: 'Verified Vendors', Icon: StoreIcon },
  { value: '50K+',   label: 'Events Planned',   Icon: CalendarIcon },
  { value: '4.8',    label: 'Avg Rating',        Icon: StarIcon },
  { value: 'Free',   label: 'Always Free',       Icon: CheckCircleIcon },
];

const HOW_IT_WORKS = [
  {
    step: '01', Icon: ClipboardIcon, title: 'Tell Us Your Event',
    desc: 'Enter event type, city, budget & guest count. Takes 30 seconds.',
    gradient: 'from-red-500 to-rose-600',
  },
  {
    step: '02', Icon: RobotIcon, title: 'Get Instant Plan',
    desc: 'AI breaks your budget into categories and shortlists the best 3 vendors per category.',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    step: '03', Icon: CheckCircleIcon, title: 'Decide & Contact',
    desc: 'Review your personalised plan, shortlist vendors, and get free quotes instantly.',
    gradient: 'from-emerald-500 to-teal-500',
  },
];

export default function CityHomePage({ params }: Props) {
  if (!params?.city) notFound();
  const citySlug = params.city;
  const cityName = slugToName(citySlug);

  return (
    <main className="min-h-screen bg-gray-50 overflow-x-hidden">

      {/* Sync city into Zustand store (client-side) */}
      <CitySync citySlug={citySlug} />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative -mt-16 pt-16 min-h-[94vh] flex flex-col bg-gradient-to-br from-gray-950 via-red-950 to-gray-900 text-white overflow-hidden">
        <div className="hero-pattern absolute inset-0 opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-950/60" />
        <div className="absolute top-32 left-10 w-96 h-96 bg-red-600/15 rounded-full blur-3xl animate-float-slow pointer-events-none" />
        <div className="absolute bottom-32 right-8 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl animate-float-medium pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-red-900/10 rounded-full blur-3xl pointer-events-none" />

        <HeroTicker />

        <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-14 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-5 py-2 text-sm mb-6 border border-white/15 shadow-xl">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="font-semibold text-white">Top Event Vendors in {cityName}</span>
            <span className="bg-red-500/30 text-red-300 text-xs font-bold px-2 py-0.5 rounded-full">AI ✦</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight mb-4 tracking-tight max-w-4xl">
            Plan Your Event
            <br />
            <span className="gradient-text">in {cityName}</span>
          </h1>
          <p className="text-gray-300 text-base sm:text-lg mb-8 max-w-xl leading-relaxed">
            Tell us your event type, budget &amp; guests —
            <br className="hidden sm:block" />
            we&apos;ll match you with <strong className="text-white">top vendors in {cityName}</strong>.
          </p>

          <div className="w-full max-w-2xl mb-6">
            <PlanWizard />
          </div>

          <p className="text-gray-400 text-sm">
            Just browsing?{' '}
            <Link href={`/search?city=${citySlug}`} className="text-white font-semibold hover:underline underline-offset-2">
              Search vendors in {cityName} →
            </Link>
          </p>
        </div>

        <div className="relative border-t border-white/10 bg-black/30 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 py-5 grid grid-cols-4 gap-2">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="flex justify-center mb-0.5 text-red-400">
                  <s.Icon className="w-4 h-4" />
                </div>
                <p className="text-white font-extrabold text-lg sm:text-2xl">{s.value}</p>
                <p className="text-gray-400 text-[10px] sm:text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────────── */}
      <section className="py-14 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-extrabold text-red-500 uppercase tracking-widest mb-2">How It Works</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">From input to decision in 3 steps</h2>
            <p className="text-gray-500 text-sm mt-2">No searching. No comparing 50 vendors. Just a plan.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 relative">
            {HOW_IT_WORKS.map((s, i) => (
              <div key={s.step} className="text-center group relative">
                <div className={`w-20 h-20 bg-gradient-to-br ${s.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-105 transition-transform`}>
                  <s.Icon className="w-9 h-9 text-white" />
                </div>
                <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-extrabold mx-auto mb-3 shadow">
                  {s.step}
                </div>
                <h3 className="font-extrabold text-gray-900 mb-2 text-lg">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                {i < 2 && (
                  <div className="hidden sm:block absolute right-0 top-10 translate-x-1/2 text-2xl text-gray-300">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PACKAGES ────────────────────────────────────────── */}
      <FeaturedPackages />

      {/* ── CATEGORIES ───────────────────────────────────────────────── */}
      <CategorySection />

      {/* ── TOP VENDORS carousel ─────────────────────────────────────── */}
      <TopVendorCarousel />

      {/* ── DUAL CTA BANNERS ─────────────────────────────────────────── */}
      <CTABanners />

      {/* ── SEO CONTENT BLOCK ────────────────────────────────────────── */}
      <SEOContentBlock />

    </main>
  );
}
