'use client';

import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { buildSeoUrl, buildCityEventsUrl } from '@/lib/seo-urls';
import { ChevronRightIcon, CheckCircleIcon, StarIcon, LocationIcon, ClipboardIcon, SearchIcon } from '@/components/ui/Icon';

function WeddingIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>;
}
function CameraIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><circle cx="12" cy="13" r="3" /></svg>;
}
function ForkIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M12 3v18M6 3v5a4 4 0 008 0V3M18 3v5a2 2 0 01-2 2h-1v11" /></svg>;
}
function BuildingIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
}
function MakeupIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
}
function MusicIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>;
}
function BriefcaseIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="2" y="7" width="20" height="14" rx="2" /><path strokeLinecap="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>;
}
function CakeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 012-2h14a2 2 0 012 2v3z" /><path strokeLinecap="round" d="M8 10V8m4 2V6m4 4V8" /></svg>;
}
function FlowerIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3" /><path strokeLinecap="round" d="M12 3a3 3 0 000 6M12 15a3 3 0 000 6M3 12a3 3 0 006 0M15 12a3 3 0 006 0" /></svg>;
}
function RingIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" fill="currentColor" /></svg>;
}
function ZapIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
}

type HighlightItem = { title: string; slug: string; cat: string; Icon: React.FC<{ className?: string }>; desc: string };
type PlanItem = { label: string; href: string; Icon: React.FC<{ className?: string }> };

const CITY_HIGHLIGHTS: Record<string, {
  heading: string; subtext: string;
  highlights: HighlightItem[];
}> = {
  noida: {
    heading: 'Best Event Vendors in Noida',
    subtext: 'Noida is one of NCR\'s most vibrant cities for events. From Sector 62\'s upscale venues to Sector 18\'s bustling markets, find top wedding photographers, caterers, and decorators near you.',
    highlights: [
      { title: 'Wedding Planners in Noida',  slug: 'noida', cat: 'wedding',    Icon: WeddingIcon,  desc: 'Premium wedding planning across Noida sectors' },
      { title: 'Photographers in Noida',     slug: 'noida', cat: 'photography', Icon: CameraIcon,   desc: 'Top wedding & event photographers' },
      { title: 'Caterers in Noida',          slug: 'noida', cat: 'catering',   Icon: ForkIcon,     desc: 'Multi-cuisine catering for all occasions' },
      { title: 'Event Venues in Noida',      slug: 'noida', cat: 'venue',      Icon: BuildingIcon, desc: 'Banquet halls and outdoor venues' },
      { title: 'Makeup Artists in Noida',    slug: 'noida', cat: 'makeup',     Icon: MakeupIcon,   desc: 'Bridal and party makeup specialists' },
      { title: 'DJ Services in Noida',       slug: 'noida', cat: 'dj-music',   Icon: MusicIcon,    desc: 'Professional DJs for weddings & parties' },
    ],
  },
  delhi: {
    heading: 'Top Event Vendors in Delhi',
    subtext: 'Delhi\'s rich culture makes it a hub for grand weddings and corporate events. Discover verified vendors across South Delhi, East Delhi, and NCR.',
    highlights: [
      { title: 'Wedding Planners in Delhi',      slug: 'delhi', cat: 'wedding',    Icon: WeddingIcon,   desc: 'Grand wedding services in Delhi' },
      { title: 'Corporate Event Organizers',     slug: 'delhi', cat: 'corporate',  Icon: BriefcaseIcon, desc: 'Professional corporate event management' },
      { title: 'Photographers in Delhi',         slug: 'delhi', cat: 'photography',Icon: CameraIcon,    desc: 'Award-winning photographers in Delhi' },
      { title: 'Caterers in Delhi',              slug: 'delhi', cat: 'catering',   Icon: ForkIcon,      desc: 'From street food to fine dining catering' },
      { title: 'Decorators in Delhi',            slug: 'delhi', cat: 'decoration', Icon: FlowerIcon,    desc: 'Floral and theme decorators' },
      { title: 'DJ Services in Delhi',           slug: 'delhi', cat: 'dj-music',   Icon: MusicIcon,     desc: 'Top DJs for sangeet & parties' },
    ],
  },
  gurgaon: {
    heading: 'Premium Event Vendors in Gurgaon',
    subtext: 'Gurgaon\'s corporate culture and upscale lifestyle demand premium event services. Find top-tier vendors for corporate events, luxury weddings, and social gatherings.',
    highlights: [
      { title: 'Corporate Events in Gurgaon',    slug: 'gurgaon', cat: 'corporate',  Icon: BriefcaseIcon, desc: 'Premium corporate event management' },
      { title: 'Wedding Planners in Gurgaon',    slug: 'gurgaon', cat: 'wedding',    Icon: WeddingIcon,   desc: 'Luxury wedding planning services' },
      { title: 'Event Venues in Gurgaon',        slug: 'gurgaon', cat: 'venue',      Icon: BuildingIcon,  desc: 'Five-star venues and farmhouses' },
      { title: 'Photographers in Gurgaon',       slug: 'gurgaon', cat: 'photography',Icon: CameraIcon,    desc: 'Pre-wedding & wedding photographers' },
      { title: 'Caterers in Gurgaon',            slug: 'gurgaon', cat: 'catering',   Icon: ForkIcon,      desc: 'International cuisine caterers' },
      { title: 'Makeup Artists in Gurgaon',      slug: 'gurgaon', cat: 'makeup',     Icon: MakeupIcon,    desc: 'Luxury bridal makeup artists' },
    ],
  },
};

const DEFAULT_HIGHLIGHTS: HighlightItem[] = [
  { title: 'Wedding Planners Noida',  slug: 'noida',   cat: 'wedding',    Icon: WeddingIcon,   desc: 'Top wedding services in Noida' },
  { title: 'Corporate Events Delhi',  slug: 'delhi',   cat: 'corporate',  Icon: BriefcaseIcon, desc: 'Professional corporate event management' },
  { title: 'Photographers Gurgaon',   slug: 'gurgaon', cat: 'photography',Icon: CameraIcon,    desc: 'Best photographers in Gurgaon' },
  { title: 'Caterers Noida',          slug: 'noida',   cat: 'catering',   Icon: ForkIcon,      desc: 'Top caterers in Noida' },
  { title: 'Event Venues Delhi',      slug: 'delhi',   cat: 'venue',      Icon: BuildingIcon,  desc: 'Premium event venues in Delhi' },
  { title: 'DJ Services NCR',         slug: 'noida',   cat: 'dj-music',   Icon: MusicIcon,     desc: 'Best DJs across Delhi NCR' },
];

const POPULAR_PLANS: PlanItem[] = [
  { label: 'Wedding Plan Noida under ₹5L',        href: '/event-plan/wedding-plan-noida-under-5l',             Icon: WeddingIcon },
  { label: 'Wedding Plan Delhi under ₹10L',        href: '/event-plan/wedding-plan-delhi-under-10l',            Icon: WeddingIcon },
  { label: 'Birthday Party Plan Noida under ₹50K', href: '/event-plan/birthday-party-plan-noida-under-50k',     Icon: CakeIcon },
  { label: 'Birthday Plan Gurgaon under ₹2L',      href: '/event-plan/birthday-party-plan-gurgaon-under-2l',    Icon: CakeIcon },
  { label: 'Corporate Event Plan Delhi under ₹5L', href: '/event-plan/corporate-event-plan-delhi-under-5l',     Icon: BriefcaseIcon },
  { label: 'Corporate Plan Gurgaon under ₹10L',    href: '/event-plan/corporate-event-plan-gurgaon-under-10l',  Icon: BriefcaseIcon },
  { label: 'Anniversary Plan Noida under ₹2L',     href: '/event-plan/anniversary-plan-noida-under-2l',         Icon: RingIcon },
  { label: 'Engagement Plan Delhi under ₹2L',      href: '/event-plan/engagement-plan-delhi-under-2l',          Icon: RingIcon },
];

const POPULAR_SEARCHES = [
  { q: 'Best wedding photographers in Noida', city: 'noida', cat: 'photography' },
  { q: 'Affordable caterers in Noida Sector 62', city: 'noida', cat: 'catering' },
  { q: 'DJ for wedding sangeet Delhi', city: 'delhi', cat: 'dj-music' },
  { q: 'Bridal makeup artist Gurgaon', city: 'gurgaon', cat: 'makeup' },
  { q: 'Corporate event venue South Delhi', city: 'delhi', cat: 'corporate' },
  { q: 'Flower decoration for reception Noida', city: 'noida', cat: 'decoration' },
  { q: 'Mehendi artist for wedding Noida', city: 'noida', cat: 'mehendi' },
  { q: 'Birthday party planner NCR', city: 'noida', cat: 'birthday' },
];

const TRUST = [
  { Icon: CheckCircleIcon, title: '2000+ Vendors', desc: 'Verified across Delhi NCR' },
  { Icon: StarIcon,        title: '4.8/5 Rating',  desc: 'From 50,000+ reviews' },
  { Icon: ZapIcon,         title: '2hr Response',  desc: 'Average quote turnaround' },
  { Icon: CheckCircleIcon, title: '100% Free',     desc: 'No fees, no commissions' },
];

export default function SEOContentBlock() {
  const { selectedCity } = useAppStore();
  const citySlug = selectedCity?.slug || '';
  const content = CITY_HIGHLIGHTS[citySlug] ?? null;
  const heading = content?.heading ?? 'Top Event Vendors Across Delhi NCR';
  const subtext = content?.subtext ?? 'PlanToday connects you with 2000+ verified vendors across Noida, Delhi, Gurgaon, Faridabad, and Greater Noida. Find the perfect photographer, caterer, venue, and more for any occasion.';
  const highlights = content?.highlights ?? DEFAULT_HIGHLIGHTS;

  return (
    <section className="py-14 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="max-w-3xl mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">{heading}</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{subtext}</p>
        </div>

        {/* Highlights grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
          {highlights.map((item) => (
            <Link
              key={`${item.cat}-${item.slug}`}
              href={buildSeoUrl(item.cat, item.slug)}
              className="flex items-center gap-4 bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-red-200 rounded-2xl p-4 transition group"
            >
              <div className="w-10 h-10 bg-red-100 group-hover:bg-red-200 rounded-xl flex items-center justify-center transition shrink-0">
                <item.Icon className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 group-hover:text-red-700 transition">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
              <ChevronRightIcon className="w-4 h-4 text-gray-300 group-hover:text-red-400 ml-auto shrink-0 transition" />
            </Link>
          ))}
        </div>

        {/* City event pages */}
        {!citySlug && (
          <div className="mb-10">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Browse Events by City</p>
            <div className="flex flex-wrap gap-2">
              {['noida', 'delhi', 'gurgaon', 'faridabad', 'ghaziabad', 'greater-noida'].map((c) => (
                <Link
                  key={c}
                  href={buildCityEventsUrl(c)}
                  className="text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-full hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition bg-white shadow-sm font-medium flex items-center gap-1.5"
                >
                  <LocationIcon className="w-3 h-3 text-red-400" />
                  Events in {c.replace(/-/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase())}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Popular Event Plans */}
        <div className="mb-10">
          <h3 className="text-sm font-extrabold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
              <ClipboardIcon className="w-3.5 h-3.5 text-red-500" />
            </span>
            Popular Event Plans
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {POPULAR_PLANS.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:border-red-200 hover:from-red-50 rounded-xl px-4 py-3 transition group"
              >
                <p.Icon className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-xs font-semibold text-gray-700 group-hover:text-red-700 transition leading-tight">{p.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Popular searches */}
        <div>
          <h3 className="text-sm font-extrabold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
              <SearchIcon className="w-3.5 h-3.5 text-red-500" />
            </span>
            Popular Searches
          </h3>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((s) => (
              <Link
                key={s.q}
                href={buildSeoUrl(s.cat, s.city)}
                className="text-xs border border-gray-200 text-gray-600 px-3.5 py-2 rounded-full hover:border-red-400 hover:text-red-700 hover:bg-red-50 transition bg-white shadow-sm"
              >
                {s.q}
              </Link>
            ))}
          </div>
        </div>

        {/* Trust signals */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-gray-100">
          {TRUST.map((t) => (
            <div key={t.title} className="text-center">
              <div className="flex justify-center mb-2 text-red-500">
                <t.Icon className="w-7 h-7" />
              </div>
              <p className="font-extrabold text-gray-900 text-sm">{t.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
