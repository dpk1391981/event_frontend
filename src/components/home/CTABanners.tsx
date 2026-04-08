import Link from 'next/link';
import { CheckCircleIcon, SearchIcon } from '@/components/ui/Icon';

function CalendarPlusIcon() {
  return (
    <svg className="w-12 h-12 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18M12 14v4m-2-2h4" />
    </svg>
  );
}
function VendorGridIcon() {
  return (
    <svg className="w-12 h-12 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
function ZapIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}
function CoinIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 7v2m0 6v2m-2-4h4" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="5" y="11" width="14" height="10" rx="2" /><path strokeLinecap="round" d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  );
}
function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

const TRUST = [
  { Icon: ShieldIcon, text: 'All vendors verified' },
  { Icon: ZapIcon,    text: 'Quotes in 2 hours' },
  { Icon: CoinIcon,   text: 'Zero booking fees' },
  { Icon: StarIcon,   text: '4.8/5 avg rating' },
  { Icon: LockIcon,   text: 'Secure & private' },
];

export default function CTABanners() {
  return (
    <section className="py-14 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid sm:grid-cols-2 gap-5">

          {/* Left CTA — List Event */}
          <div className="relative bg-gradient-to-br from-red-600 to-rose-700 rounded-3xl p-8 overflow-hidden group hover:from-red-700 hover:to-rose-800 transition-all duration-300">
            <div className="hero-pattern absolute inset-0 opacity-30" />
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
            <div className="relative">
              <div className="mb-4 opacity-80">
                <CalendarPlusIcon />
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-2 leading-tight">
                List Your Event &<br />Get Bookings
              </h3>
              <p className="text-red-100 text-sm leading-relaxed mb-6 max-w-xs">
                Reach thousands of potential attendees. Post your event, sell tickets, and manage bookings — all in one place.
              </p>
              <ul className="space-y-1.5 text-sm text-red-100 mb-6">
                {['Free to list', 'Built-in ticketing', 'Instant payments', 'Analytics dashboard'].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-yellow-300 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/partner/onboard"
                className="inline-flex items-center gap-2 bg-white text-red-700 font-extrabold px-6 py-3.5 rounded-2xl hover:bg-red-50 transition shadow-xl text-sm"
              >
                Post Your Event Free
                <ChevronRightIcon />
              </Link>
            </div>
          </div>

          {/* Right CTA — Find Vendors */}
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 overflow-hidden group border border-gray-700 hover:border-red-500/50 transition-all duration-300">
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-red-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
            <div className="absolute top-4 right-4 opacity-20">
              <VendorGridIcon />
            </div>
            <div className="relative">
              <div className="w-14 h-14 bg-red-600/20 rounded-2xl flex items-center justify-center mb-4">
                <SearchIcon className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-2 leading-tight">
                Find Best Vendors<br />Near You
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-xs">
                AI-powered search matches you with the perfect photographer, caterer, or venue based on your budget & location.
              </p>
              <ul className="space-y-1.5 text-sm text-gray-400 mb-6">
                {['2000+ verified vendors', 'Free instant quotes', 'Compare & shortlist', 'No platform fees'].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-red-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/search"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold px-6 py-3.5 rounded-2xl hover:from-red-700 hover:to-rose-700 transition shadow-xl shadow-red-900/30 text-sm"
                >
                  Explore Vendors
                  <SearchIcon className="w-4 h-4" />
                </Link>
                <Link
                  href="/plan"
                  className="inline-flex items-center justify-center gap-2 border border-gray-600 text-gray-300 font-semibold px-6 py-3.5 rounded-2xl hover:border-red-500 hover:text-red-400 transition text-sm"
                >
                  Plan My Event
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          {TRUST.map((t) => (
            <span key={t.text} className="flex items-center gap-1.5">
              <t.Icon />
              <span>{t.text}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
