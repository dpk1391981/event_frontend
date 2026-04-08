'use client';

import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { buildSeoUrl } from '@/lib/seo-urls';

function WeddingIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>;
}
function BriefcaseIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="2" y="7" width="20" height="14" rx="2" /><path strokeLinecap="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>;
}
function CakeIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 012-2h14a2 2 0 012 2v3zM3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3" /><path strokeLinecap="round" d="M8 10V8m4 2V6m4 4V8" /></svg>;
}
function CameraIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><circle cx="12" cy="13" r="3" /></svg>;
}
function ForkIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M12 3v18M6 3v5a4 4 0 008 0V3M18 3v5a2 2 0 01-2 2h-1v11" /></svg>;
}
function TrophyIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4M6 3H3v4a3 3 0 003 3h1m5 0h1a3 3 0 003-3V3h-3M9 6h6v5a3 3 0 01-6 0V6z" /></svg>;
}

const CATEGORIES = [
  {
    label: 'Wedding', slug: 'wedding', Icon: WeddingIcon,
    desc: 'Photographers, venues, makeup, mehendi & more',
    count: '500+ vendors',
    gradient: 'from-rose-500 to-pink-600',
    lightBg: 'bg-rose-50', lightText: 'text-rose-700',
    border: 'border-rose-200 hover:border-rose-400',
    popular: ['Photography', 'Catering', 'Decoration', 'Makeup'],
  },
  {
    label: 'Corporate', slug: 'corporate', Icon: BriefcaseIcon,
    desc: 'Venues, AV equipment, catering & event mgmt',
    count: '280+ vendors',
    gradient: 'from-blue-500 to-indigo-600',
    lightBg: 'bg-blue-50', lightText: 'text-blue-700',
    border: 'border-blue-200 hover:border-blue-400',
    popular: ['Venues', 'Catering', 'AV Setup', 'Photography'],
  },
  {
    label: 'Birthday', slug: 'birthday', Icon: CakeIcon,
    desc: 'Party venues, decorators, cakes & entertainers',
    count: '320+ vendors',
    gradient: 'from-orange-500 to-amber-500',
    lightBg: 'bg-orange-50', lightText: 'text-orange-700',
    border: 'border-orange-200 hover:border-orange-400',
    popular: ['Venues', 'Decoration', 'Cakes', 'DJ'],
  },
  {
    label: 'Photography', slug: 'photography', Icon: CameraIcon,
    desc: 'Wedding, portrait, product & event photographers',
    count: '400+ vendors',
    gradient: 'from-teal-500 to-cyan-600',
    lightBg: 'bg-teal-50', lightText: 'text-teal-700',
    border: 'border-teal-200 hover:border-teal-400',
    popular: ['Wedding', 'Pre-Wedding', 'Baby', 'Corporate'],
  },
  {
    label: 'Catering', slug: 'catering', Icon: ForkIcon,
    desc: 'Multi-cuisine, live counters, buffet & cocktails',
    count: '250+ vendors',
    gradient: 'from-emerald-500 to-green-600',
    lightBg: 'bg-emerald-50', lightText: 'text-emerald-700',
    border: 'border-emerald-200 hover:border-emerald-400',
    popular: ['Veg', 'Non-Veg', 'Jain', 'Live Stations'],
  },
  {
    label: 'Sports Events', slug: 'sports', Icon: TrophyIcon,
    desc: 'Cricket, football, badminton & marathon events',
    count: '80+ vendors',
    gradient: 'from-purple-500 to-violet-600',
    lightBg: 'bg-purple-50', lightText: 'text-purple-700',
    border: 'border-purple-200 hover:border-purple-400',
    popular: ['Cricket', 'Football', 'Marathon', 'Yoga'],
  },
];

const CROSS_CITY_LINKS = [
  { city: 'delhi', name: 'Delhi', cat: 'wedding' },
  { city: 'gurgaon', name: 'Gurgaon', cat: 'corporate' },
  { city: 'faridabad', name: 'Faridabad', cat: 'photography' },
  { city: 'ghaziabad', name: 'Ghaziabad', cat: 'catering' },
  { city: 'noida', name: 'Noida', cat: 'venue' },
  { city: 'greater-noida', name: 'Greater Noida', cat: 'makeup' },
];

export default function CategorySection() {
  const { selectedCity } = useAppStore();
  const citySlug = selectedCity?.slug || 'noida';
  const cityName = selectedCity?.name || 'Noida';

  return (
    <section className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-extrabold text-red-500 uppercase tracking-widest mb-2">Browse by Category</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
            Find the Right Vendor for
            <br /><span className="text-red-500">Every Occasion</span>
          </h2>
          <p className="text-gray-500 text-sm">
            Explore verified vendors across all event categories in {cityName}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => {
            const href = buildSeoUrl(cat.slug, citySlug);
            return (
              <Link
                key={cat.slug}
                href={href}
                className={`group bg-white border-2 ${cat.border} rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg block`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${cat.gradient} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform shrink-0`}>
                    <cat.Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-900 group-hover:text-red-700 transition text-base">{cat.label}</h3>
                    <p className={`text-xs font-semibold ${cat.lightText} mt-0.5`}>{cat.count}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-3 hidden sm:block">{cat.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {cat.popular.map((sub) => (
                    <span key={sub} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.lightBg} ${cat.lightText}`}>
                      {sub}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3 flex items-center gap-1 group-hover:text-red-500 transition">
                  {cat.label} in {cityName}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </p>
              </Link>
            );
          })}
        </div>

        {/* Cross-city SEO links */}
        <div className="mt-10 pt-8 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 text-center">Popular in Other Cities</p>
          <div className="flex flex-wrap justify-center gap-3">
            {CROSS_CITY_LINKS.map((link) => (
              <Link
                key={`${link.cat}-${link.city}`}
                href={buildSeoUrl(link.cat, link.city)}
                className="text-xs text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-full transition bg-white hover:bg-red-50"
              >
                {link.cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} in {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
