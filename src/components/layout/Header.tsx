'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { locationsApi } from '@/lib/api';
import { City } from '@/types';
import GlobalSearch from '@/components/search/GlobalSearch';
import {
  LogoMark, LocationIcon, ChevronDownIcon, PlusIcon,
  MenuIcon, CloseIcon, SearchIcon, ClipboardIcon,
  StoreIcon, WeddingIcon, SettingsIcon, LogoutIcon, GlobeIcon, CalendarIcon,
} from '@/components/ui/Icon';

export default function Header() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, selectedCity, setSelectedCity, logout, openAuthModal } = useAppStore();
  const [userMenuOpen, setUserMenuOpen]   = useState(false);
  const [mobileOpen, setMobileOpen]       = useState(false);
  const [cityOpen, setCityOpen]           = useState(false);
  const [cities, setCities]               = useState<City[]>([]);
  const [citySearch, setCitySearch]       = useState('');
  const [geoLoading, setGeoLoading]       = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);

  // Load cities once (on mount) — not deferred behind cityOpen so mobile drawer has them too
  useEffect(() => {
    locationsApi.getCities()
      .then((d: unknown) => setCities(d as City[]))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setCityOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /** Select city, persist to store, redirect to city home page.
   *  forceRedirect=true → always redirects (used by auto-detect).
   *  Without forceRedirect → only redirects from / and /plan-event-in-* pages.
   */
  const pickCity = useCallback((city: City | null, forceRedirect = false) => {
    setSelectedCity(city);
    setCityOpen(false);
    setCitySearch('');
    setMobileOpen(false);
    if (city && (forceRedirect || pathname === '/' || pathname?.startsWith('/plan-event-in-'))) {
      router.push(`/plan-event-in-${city.slug}`);
    } else if (!city && pathname?.startsWith('/plan-event-in-')) {
      router.push('/');
    }
  }, [pathname, router, setSelectedCity]);

  /** Find nearest city in our DB list by Euclidean lat/lng distance */
  const findClosestCity = useCallback((lat: number, lng: number): City | null => {
    let closest: City | null = null;
    let minDist = Infinity;
    for (const c of cities) {
      const clat = Number(c.latitude);
      const clng = Number(c.longitude);
      if (!clat || !clng) continue;
      const d = Math.hypot(clat - lat, clng - lng);
      if (d < minDist) { minDist = d; closest = c; }
    }
    return closest;
  }, [cities]);

  /** Auto-detect city:
   *  1. Try browser geolocation (accurate, needs permission)
   *  2. Fall back to IP geolocation (no permission, less precise)
   *  Always redirects to /plan-event-in-{city} on success.
   */
  const detectCity = useCallback(async () => {
    if (!cities.length) return;
    setGeoLoading(true);

    // ── Step 1: browser geolocation ─────────────────────────────────
    if (typeof window !== 'undefined' && navigator?.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000 }),
        );
        const found = findClosestCity(pos.coords.latitude, pos.coords.longitude);
        if (found) {
          setGeoLoading(false);
          pickCity(found, true);
          return;
        }
      } catch {
        // Permission denied or timeout — fall through to IP lookup
      }
    }

    // ── Step 2: IP-based geolocation (no permission needed) ─────────
    try {
      const res  = await fetch('https://ip-api.com/json/?fields=status,city,lat,lon', { cache: 'no-store' });
      const data = await res.json();
      if (data.status === 'success') {
        // Name match first (most reliable)
        const nameMatch = cities.find((c) =>
          c.name.toLowerCase() === data.city?.toLowerCase() ||
          c.slug === data.city?.toLowerCase().replace(/\s+/g, '-'),
        );
        if (nameMatch) {
          setGeoLoading(false);
          pickCity(nameMatch, true);
          return;
        }
        // Distance fallback if IP coords available
        if (data.lat && data.lon) {
          const distMatch = findClosestCity(data.lat, data.lon);
          if (distMatch) {
            setGeoLoading(false);
            pickCity(distMatch, true);
            return;
          }
        }
      }
    } catch {
      // IP lookup failed silently
    }

    setGeoLoading(false);
  }, [cities, findClosestCity, pickCity]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const filteredCities = cities.filter((c) =>
    c.name.toLowerCase().includes(citySearch.toLowerCase())
  );

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center gap-2 sm:gap-3">

          {/* Logo — goes to city landing page when a city is selected */}
          <Link
            href={selectedCity ? `/plan-event-in-${selectedCity.slug}` : '/'}
            className="flex items-center gap-2 shrink-0 group"
          >
            <LogoMark className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-black text-[17px] tracking-tight text-gray-900">
                Plan<span className="text-red-500">Today</span>
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">
                plantoday.in
              </span>
            </div>
          </Link>

          {/* City selector — hidden on small mobile, visible sm+ */}
          <div ref={cityRef} className="relative shrink-0 hidden sm:block">
            <button
              onClick={() => setCityOpen(!cityOpen)}
              className="flex items-center gap-1.5 text-sm border rounded-full px-3 py-1.5 transition-all max-w-[120px] text-gray-700 border-gray-200 hover:border-red-300 hover:text-red-600 bg-white"
            >
              <LocationIcon className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="font-medium truncate">{selectedCity?.name || 'All Cities'}</span>
              <ChevronDownIcon className="w-3 h-3 opacity-60 shrink-0" />
            </button>

            {cityOpen && (
              <div className="absolute top-10 left-0 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 w-68 z-50" style={{ minWidth: '16rem' }}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select City</p>
                  <button
                    onClick={detectCity}
                    disabled={geoLoading || !cities.length}
                    className="flex items-center gap-1 text-xs text-red-600 font-semibold hover:text-red-700 disabled:opacity-40 transition"
                  >
                    {geoLoading
                      ? <span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                      : <LocationIcon className="w-3 h-3" />}
                    Auto-detect
                  </button>
                </div>
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Search city…"
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400 mb-2"
                />
                <button
                  onClick={() => pickCity(null)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition mb-1 flex items-center gap-2 ${
                    !selectedCity ? 'bg-red-50 text-red-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <GlobeIcon className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  All Cities
                </button>
                <div className="max-h-52 overflow-y-auto space-y-0.5">
                  {cities
                    .filter((c) => c.name.toLowerCase().includes(citySearch.toLowerCase()))
                    .map((c) => (
                      <button
                        key={c.id}
                        onClick={() => pickCity(c)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition flex items-center gap-2 ${
                          selectedCity?.id === c.id ? 'bg-red-50 text-red-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <LocationIcon className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        {c.name}
                        {c.state && <span className="text-xs text-gray-400 ml-auto">{c.state}</span>}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Search — flex-1. On mobile: pill that opens fullscreen. On desktop: full compact bar. */}
          <div className="flex-1 min-w-0">
            <GlobalSearch compact />
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium shrink-0">
            {[
              { href: '/search', label: 'Find Vendors' },
              { href: '/plan', label: 'Plan Event' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-full text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all"
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => {
                if (!user) {
                  router.push('/auth/login?step=signup&role=vendor&redirect=%2Fpartner%2Fonboard');
                } else if (user.role === 'vendor') {
                  router.push('/partner/dashboard');
                } else {
                  router.push('/auth/login?role=vendor&redirect=%2Fpartner%2Fonboard');
                }
              }}
              className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-full text-red-600 border border-red-200 hover:bg-red-50 transition-all">
              <PlusIcon className="w-3.5 h-3.5" />
              List Business
            </button>
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-1.5 shrink-0">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 rounded-full pl-1.5 pr-2.5 py-1 transition"
                >
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-rose-700 text-white flex items-center justify-center font-extrabold text-xs shadow">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                  <span className="text-xs font-semibold text-gray-700 hidden sm:block">{user.name?.split(' ')[0]}</span>
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-11 bg-white shadow-2xl border border-gray-100 rounded-2xl py-2 w-48 z-50">
                      <div className="px-4 py-2.5 border-b border-gray-50">
                        <p className="text-sm font-bold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                      </div>
                      {user.role === 'vendor' && (
                        <Link href="/vendor/dashboard" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <StoreIcon className="w-4 h-4 text-gray-400" /> Dashboard
                        </Link>
                      )}
                      {(user.role === 'admin' || user.role === 'super_admin') && (
                        <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <SettingsIcon className="w-4 h-4 text-gray-400" /> Admin
                        </Link>
                      )}
                      <div className="border-t border-gray-50 mt-1">
                        <button onClick={() => { logout(); setUserMenuOpen(false); }}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                          <LogoutIcon className="w-4 h-4" /> Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Desktop: Login → navigate to /auth/login page */}
                <button
                  onClick={() => router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`)}
                  className="hidden sm:block text-sm font-semibold px-3 py-2 rounded-full text-gray-700 hover:text-red-600 transition">
                  Login
                </button>
                {/* Desktop: Register → navigate to /auth/login with signup step */}
                <button
                  onClick={() => router.push(`/auth/login?step=signup&redirect=${encodeURIComponent(pathname)}`)}
                  className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 text-white text-sm font-bold px-4 py-2 rounded-full hover:from-red-700 hover:to-rose-700 transition shadow-md shadow-red-200 whitespace-nowrap">
                  Register
                </button>
                {/* Mobile: Login pill → opens AuthBottomSheet */}
                <button
                  onClick={() => openAuthModal({ initialStep: 'signin' })}
                  className="sm:hidden bg-gradient-to-r from-red-600 to-rose-600 text-white text-sm font-bold px-3 py-2 rounded-full hover:from-red-700 hover:to-rose-700 active:scale-95 transition shadow-md shadow-red-200 whitespace-nowrap flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Login
                </button>
              </>
            )}

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition"
              aria-label="Menu"
            >
              {mobileOpen ? <CloseIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile full-screen nav drawer ─────────────────────────────── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)} />

          {/* Drawer */}
          <div className="fixed top-14 left-0 right-0 bottom-0 z-50 bg-white flex flex-col overflow-y-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            {/* City selector row */}
            <div className="px-4 pt-4 pb-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Your City</p>
              <div className="flex flex-wrap gap-2">
                {/* Auto-detect button */}
                <button
                  onClick={detectCity}
                  disabled={geoLoading || !cities.length}
                  className="flex items-center gap-1.5 text-sm border rounded-full px-3 py-1.5 transition text-red-600 border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-40"
                >
                  {geoLoading
                    ? <span className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                    : <LocationIcon className="w-3.5 h-3.5 shrink-0" />}
                  Detect
                </button>
                {/* All Cities */}
                <button
                  onClick={() => pickCity(null)}
                  className={`flex items-center gap-1.5 text-sm border rounded-full px-3 py-1.5 transition ${
                    !selectedCity ? 'bg-red-600 text-white border-red-600' : 'text-gray-700 border-gray-200 bg-white'
                  }`}
                >
                  <GlobeIcon className="w-3.5 h-3.5 shrink-0" />
                  All
                </button>
                {/* Dynamic cities from API */}
                {cities.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => pickCity(c)}
                    className={`text-sm border rounded-full px-3 py-1.5 transition ${
                      selectedCity?.id === c.id ? 'bg-red-600 text-white border-red-600' : 'text-gray-700 border-gray-200 bg-white'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-gray-100 mx-4 my-3" />

            {/* Nav links */}
            <div className="px-4 space-y-1">
              {[
                { href: '/search',                    label: 'Find Vendors',    Icon: SearchIcon },
                { href: '/plan',                      label: 'Plan My Event',   Icon: ClipboardIcon },
                { href: '/wedding-planners-in-delhi', label: 'Wedding Vendors', Icon: WeddingIcon },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-gray-700 hover:bg-red-50 hover:text-red-700 active:bg-red-100 transition text-sm font-semibold"
                >
                  <span className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <item.Icon className="w-4 h-4 text-gray-500" />
                  </span>
                  {item.label}
                </Link>
              ))}
              {/* List Business — guards non-logged-in users */}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  if (!user) {
                    openAuthModal({ defaultRole: 'vendor', initialStep: 'signup', redirectTo: '/partner/onboard' });
                  } else if (user.role === 'vendor') {
                    router.push('/partner/dashboard');
                  } else {
                    openAuthModal({ defaultRole: 'vendor', redirectTo: '/partner/onboard' });
                  }
                }}
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-700 hover:bg-red-50 active:bg-red-100 transition text-sm font-semibold w-full text-left"
              >
                <span className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                  <StoreIcon className="w-4 h-4 text-red-500" />
                </span>
                List Your Business
              </button>
            </div>

            <div className="h-px bg-gray-100 mx-4 my-3" />

            {/* Auth section — sticky at bottom of drawer */}
            <div className="mt-auto px-4 pb-6 pt-3 border-t border-gray-100 bg-white">
              {!user ? (
                <div className="space-y-2.5">
                  <button
                    onClick={() => { setMobileOpen(false); openAuthModal(); }}
                    className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold py-4 rounded-2xl text-base shadow-lg shadow-red-200 active:scale-[0.98] transition">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Login / Register — Free
                  </button>
                  <p className="text-center text-xs text-gray-400">Email · Google · OTP — 100% free</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4">
                  <span className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-700 text-white flex items-center justify-center font-extrabold text-sm shadow shrink-0">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{user.role} · {user.phone || ''}</p>
                  </div>
                  <button onClick={() => { logout(); setMobileOpen(false); }}
                    className="flex items-center gap-1.5 text-xs text-red-600 font-semibold px-3 py-2.5 rounded-xl bg-red-50 active:bg-red-100 transition shrink-0">
                    <LogoutIcon className="w-3.5 h-3.5" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
