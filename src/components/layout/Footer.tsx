'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buildCityEventsUrl, buildSeoUrl } from '@/lib/seo-urls';
import { CheckCircleIcon, ChevronRightIcon, LocationIcon, LogoMark, RobotIcon } from '@/components/ui/Icon';

const FOOTER_CITIES = [
  { name: 'Noida', slug: 'noida' },
  { name: 'Delhi', slug: 'delhi' },
  { name: 'Gurgaon', slug: 'gurgaon' },
  { name: 'Faridabad', slug: 'faridabad' },
];

const FOOTER_SERVICES = [
  { name: 'Photography', slug: 'photography' },
  { name: 'Catering', slug: 'catering' },
  { name: 'Venue', slug: 'venue' },
  { name: 'Decoration', slug: 'decoration' },
  { name: 'DJ & Music', slug: 'dj-music' },
];

const FOOTER_EVENTS = [
  { name: 'Wedding', slug: 'wedding' },
  { name: 'Birthday', slug: 'birthday' },
  { name: 'Corporate', slug: 'corporate' },
  { name: 'Reception', slug: 'reception' },
];

const SEO_LINKS = [
  { label: 'Wedding Photographers in Noida', href: buildSeoUrl('photography', 'noida') },
  { label: 'Caterers in Delhi', href: buildSeoUrl('catering', 'delhi') },
  { label: 'Wedding Venues in Gurgaon', href: buildSeoUrl('venue', 'gurgaon') },
  { label: 'Decorators in Noida', href: buildSeoUrl('decoration', 'noida') },
  { label: 'Corporate Events in Delhi', href: buildSeoUrl('corporate', 'delhi') },
  { label: 'Birthday Planners in Gurgaon', href: buildSeoUrl('birthday', 'gurgaon') },
];

export default function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith('/vendor/dashboard') || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="mt-auto bg-gray-950 text-gray-400">
      <div className="border-b border-red-700/50 bg-gradient-to-r from-red-800 to-red-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <div>
            <h3 className="text-lg font-extrabold text-white">List Your Business on PlanToday</h3>
            <p className="text-sm text-red-200">Get quality leads from thousands of event seekers. Free to start.</p>
          </div>
          <Link href="/partner/onboard" className="shrink-0 rounded-2xl bg-white px-6 py-3 text-sm font-extrabold text-red-700 shadow-lg transition hover:bg-red-50">
            List My Business — Free
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-12 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <div className="mb-4 flex items-center gap-2.5">
              <LogoMark className="h-9 w-9 shrink-0" />
              <div className="flex flex-col leading-none">
                <p className="text-xl font-black tracking-tight text-white">Plan<span className="text-red-400">Today</span></p>
                <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-500">plantoday.in</span>
              </div>
            </div>
            <p className="mb-4 max-w-xs text-xs leading-relaxed text-gray-500">
              India&apos;s smartest platform for finding event vendors &amp; local services with hyperlocal discovery and instant free quotes.
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-red-800/50 bg-red-900/40 px-2.5 py-1 text-xs text-red-300">
                <RobotIcon className="h-3 w-3" /> AI Search
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-gray-800 px-2.5 py-1 text-xs text-gray-400">
                <LocationIcon className="h-3 w-3" /> Hyperlocal
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-green-800/50 bg-green-900/40 px-2.5 py-1 text-xs text-green-400">
                <CheckCircleIcon className="h-3 w-3" /> Verified
              </span>
            </div>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-200">Top Cities</p>
            <ul className="space-y-2 text-xs">
              {FOOTER_CITIES.map((city) => (
                <li key={city.slug}>
                  <Link href={buildCityEventsUrl(city.slug)} className="flex items-center gap-1.5 transition hover:text-red-400">
                    <ChevronRightIcon className="h-2.5 w-2.5 shrink-0 text-red-600" /> {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-200">Services</p>
            <ul className="space-y-2 text-xs">
              {FOOTER_SERVICES.map((service) => (
                <li key={service.slug}>
                  <Link href={buildSeoUrl(service.slug, 'noida')} className="flex items-center gap-1.5 transition hover:text-red-400">
                    <ChevronRightIcon className="h-2.5 w-2.5 shrink-0 text-red-600" /> {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-200">For Vendors</p>
            <ul className="space-y-2 text-xs">
              {FOOTER_EVENTS.map((event) => (
                <li key={event.slug}>
                  <Link href={buildSeoUrl(event.slug, 'noida')} className="flex items-center gap-1.5 transition hover:text-red-400">
                    <ChevronRightIcon className="h-2.5 w-2.5 shrink-0 text-red-600" /> {event.name}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <Link href="/vendor/dashboard" className="flex items-center gap-1.5 transition hover:text-red-400">
                  <ChevronRightIcon className="h-2.5 w-2.5 shrink-0 text-red-600" /> Vendor Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mb-10 border-t border-gray-800 pt-10">
          <p className="mb-5 text-xs font-bold uppercase tracking-wider text-gray-500">Popular Searches</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
            {SEO_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="flex items-center gap-1.5 truncate py-0.5 text-xs text-gray-500 transition hover:text-red-400">
                <ChevronRightIcon className="h-2.5 w-2.5 shrink-0 text-red-700" />
                <span className="truncate">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-6 text-xs text-gray-600 sm:flex-row">
          <p>© {new Date().getFullYear()} PlanToday. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="transition hover:text-gray-400">Privacy Policy</Link>
            <Link href="/terms" className="transition hover:text-gray-400">Terms of Service</Link>
            <Link href="/sitemap.xml" className="transition hover:text-gray-400">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
