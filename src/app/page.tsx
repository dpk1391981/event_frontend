import type { Metadata } from 'next';
import TopVendorCarousel from '@/components/home/TopVendorCarousel';
import HeroTicker from '@/components/home/HeroTicker';
import CategorySection from '@/components/home/CategorySection';
import CTABanners from '@/components/home/CTABanners';
import SEOContentBlock from '@/components/home/SEOContentBlock';
import PlanWizard from '@/components/home/PlanWizard';
import FeaturedPackages from '@/components/home/FeaturedPackages';
import CityRedirect from '@/components/home/CityRedirect';
import { StoreIcon, CalendarIcon, StarIcon, CheckCircleIcon, ClipboardIcon, RobotIcon } from '@/components/ui/Icon';
import RecommendedSection from '@/components/recommendations/RecommendedSection';

export const metadata: Metadata = {
  title: 'PlanToday — Plan Your Event in 2 Minutes | AI-Powered Vendor Matching',
  description:
    'Get a complete event plan with budget breakdown and top vendor recommendations in 2 minutes. Wedding, birthday, corporate events across India. 2000+ verified vendors.',
  keywords: [
    'event planning India', 'wedding plan budget', 'event vendor recommendations',
    'birthday party plan', 'corporate event plan', 'wedding budget planner',
    'event vendor matching', 'AI event planner India',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Plan Your Event in 2 Minutes — PlanToday',
    description: 'Tell us your event type, budget & guests. Get a complete vendor plan instantly.',
    type: 'website',
  },
};

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

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 overflow-x-hidden">
      <CityRedirect />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative -mt-16 pt-16 min-h-[100svh] sm:min-h-[94vh] flex flex-col bg-gradient-to-br from-gray-950 via-red-950 to-gray-900 text-white overflow-hidden">
        <div className="hero-pattern absolute inset-0 opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-950/60" />
        {/* Orbs — hidden on mobile to save paint cost */}
        <div className="hidden sm:block absolute top-32 left-10 w-96 h-96 bg-red-600/15 rounded-full blur-3xl animate-float-slow pointer-events-none" />
        <div className="hidden sm:block absolute bottom-32 right-8 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl animate-float-medium pointer-events-none" />

        <HeroTicker />

        <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-14 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 text-xs sm:text-sm mb-5 border border-white/15">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse shrink-0" />
            <span className="font-semibold text-white">India&apos;s #1 Event Planning Platform</span>
            <span className="hidden sm:inline bg-red-500/30 text-red-300 text-xs font-bold px-2 py-0.5 rounded-full">AI ✦</span>
          </div>

          {/* Headline — fluid font size */}
          <h1 className="text-[2.1rem] leading-[1.15] sm:text-5xl lg:text-6xl font-extrabold mb-3 tracking-tight max-w-4xl">
            Plan Your Event
            <br />
            <span className="gradient-text">in 2 Minutes.</span>
          </h1>
          <p className="text-gray-300 text-sm sm:text-lg mb-6 sm:mb-8 max-w-sm sm:max-w-xl leading-relaxed">
            Tell us your event &amp; budget —<br className="hidden sm:block" />
            get a <strong className="text-white">complete vendor plan instantly</strong>.
          </p>

          {/* PlanWizard */}
          <div className="w-full max-w-2xl mb-5">
            <PlanWizard />
          </div>
        </div>

        {/* Stats bar — 2 cols on mobile, 4 on desktop */}
        <div className="relative border-t border-white/10 bg-black/30 backdrop-blur-sm safe-bottom">
          <div className="max-w-5xl mx-auto px-4 py-4 sm:py-5 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-2">
            {STATS.map((s) => (
              <div key={s.label} className="text-center flex sm:flex-col items-center sm:items-center gap-2 sm:gap-0 bg-white/5 sm:bg-transparent rounded-xl sm:rounded-none px-3 py-2 sm:p-0">
                <s.Icon className="w-4 h-4 sm:w-4 sm:h-4 text-red-400 sm:mb-0.5 shrink-0" />
                <div className="text-left sm:text-center">
                  <p className="text-white font-extrabold text-base sm:text-2xl leading-none">{s.value}</p>
                  <p className="text-gray-400 text-[10px] sm:text-xs mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="py-10 sm:py-14 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-10">
            <p className="text-xs font-extrabold text-red-500 uppercase tracking-widest mb-2">How It Works</p>
            <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900">From input to decision in 3 steps</h2>
            <p className="text-gray-500 text-sm mt-1.5">No comparing 50 vendors. Just a plan.</p>
          </div>
          {/* Horizontal scrollable on mobile, grid on desktop */}
          <div className="flex sm:grid sm:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 -mx-4 sm:mx-0 px-4 sm:px-0 snap-x snap-mandatory">
            {HOW_IT_WORKS.map((s, i) => (
              <div key={s.step} className="text-center group relative shrink-0 w-64 sm:w-auto snap-center">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${s.gradient} rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg`}>
                  <s.Icon className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-extrabold mx-auto mb-2 sm:mb-3">
                  {s.step}
                </div>
                <h3 className="font-extrabold text-gray-900 mb-1.5 text-base sm:text-lg">{s.title}</h3>
                <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{s.desc}</p>
                {i < 2 && <div className="hidden sm:block absolute right-0 top-10 translate-x-1/2 text-2xl text-gray-300">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PERSONALIZED RECOMMENDATIONS (for logged-in users) ───────── */}
      <RecommendedSection />

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
