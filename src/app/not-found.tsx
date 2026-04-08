import Link from 'next/link';
import type { Metadata } from 'next';
import { LogoMark, SearchIcon, ClipboardIcon, WeddingIcon, StoreIcon, WarningIcon } from '@/components/ui/Icon';

export const metadata: Metadata = {
  title: '404 — Page Not Found | PlanToday',
  description: 'The page you are looking for does not exist.',
};

function HomeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

const QUICK_LINKS = [
  { label: 'Find Vendors',    href: '/search',                  Icon: SearchIcon,    desc: 'Search photographers, caterers, venues & more' },
  { label: 'Plan an Event',   href: '/plan',                    Icon: ClipboardIcon, desc: 'Get tailored vendor recommendations' },
  { label: 'Wedding Vendors', href: '/search?category=wedding', Icon: WeddingIcon,   desc: 'Photographers, makeup, decorators & more' },
  { label: 'List Business',   href: '/partner/onboard',         Icon: StoreIcon,     desc: 'Grow your event business with us' },
];

export default function NotFound() {
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-b from-gray-50 to-white overflow-hidden">

      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-red-100/40 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-rose-100/30 rounded-full blur-3xl animate-float-medium" />
      </div>

      {/* 404 visual */}
      <div className="relative z-10 mb-10 select-none">
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          <span className="text-[80px] sm:text-[120px] font-extrabold text-red-100 leading-none tracking-tighter">4</span>
          <div className="relative">
            <div className="w-20 h-20 sm:w-28 sm:h-28 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-200 animate-bounce-gentle">
              <LogoMark className="w-10 h-10 sm:w-14 sm:h-14" />
            </div>
            <div className="absolute -inset-2 rounded-full border-4 border-dashed border-red-200 animate-spin-slow" />
          </div>
          <span className="text-[80px] sm:text-[120px] font-extrabold text-red-100 leading-none tracking-tighter">4</span>
        </div>
      </div>

      {/* Text */}
      <div className="relative z-10 text-center max-w-xl mb-10">
        <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 rounded-full px-4 py-1.5 text-sm text-red-600 font-semibold mb-4">
          <WarningIcon className="w-4 h-4" /> Page Not Found
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3 leading-tight">
          Looks like this page
          <br />
          <span className="text-red-500">took the day off!</span>
        </h1>
        <p className="text-gray-500 text-base leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          Let&apos;s get you back to finding the perfect event vendor.
        </p>
      </div>

      {/* Primary CTAs */}
      <div className="relative z-10 flex flex-col sm:flex-row gap-3 mb-14">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold px-8 py-4 rounded-2xl hover:from-red-700 hover:to-rose-700 transition shadow-lg shadow-red-200 text-base"
        >
          <HomeIcon className="w-5 h-5" />
          Go to Homepage
        </Link>
        <Link
          href="/search"
          className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 font-bold px-8 py-4 rounded-2xl hover:border-red-300 hover:text-red-600 transition text-base"
        >
          <SearchIcon className="w-5 h-5" />
          Search Vendors
        </Link>
      </div>

      {/* Quick links grid */}
      <div className="relative z-10 w-full max-w-2xl">
        <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">
          Where would you like to go?
        </p>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-start gap-3 bg-white border border-gray-100 rounded-2xl p-4 hover:border-red-200 hover:bg-red-50/50 hover:shadow-md transition group shadow-sm"
            >
              <div className="w-11 h-11 bg-red-50 group-hover:bg-red-100 rounded-xl flex items-center justify-center transition shrink-0 mt-0.5">
                <link.Icon className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 group-hover:text-red-700 transition">{link.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-tight">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
