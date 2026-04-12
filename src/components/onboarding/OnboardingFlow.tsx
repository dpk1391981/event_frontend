'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar, MapPin, Users, DollarSign, Star, Camera, Utensils,
  Building2, Sparkles, Music, Wand2, ChevronRight, ChevronLeft,
  CheckCircle2, Package, Phone, Mail, Briefcase, Image,
  Heart, Cake, Trophy, Headphones, X,
} from 'lucide-react';
import { onboardingApi, locationsApi, categoriesApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'user' | 'vendor';
type UserStep = 'role' | 'eventType' | 'budget' | 'location' | 'guests' | 'date' | 'services' | 'priceType' | 'done';
type VendorStep = 'role' | 'businessInfo' | 'services' | 'pricing' | 'contact' | 'firstPackage' | 'done';

const EVENT_TYPES = [
  { id: 'wedding',     label: 'Wedding',      icon: Heart,      color: 'from-pink-500 to-rose-500' },
  { id: 'birthday',    label: 'Birthday',     icon: Cake,       color: 'from-orange-500 to-amber-500' },
  { id: 'corporate',   label: 'Corporate',    icon: Briefcase,  color: 'from-blue-500 to-indigo-500' },
  { id: 'anniversary', label: 'Anniversary',  icon: Trophy,     color: 'from-purple-500 to-violet-500' },
  { id: 'other',       label: 'Other Event',  icon: Sparkles,   color: 'from-green-500 to-emerald-500' },
];

const BUDGET_RANGES = [
  { id: '0-50000',      label: 'Under ₹50K',        min: 0,      max: 50000   },
  { id: '50000-100000', label: '₹50K – ₹1L',        min: 50000,  max: 100000  },
  { id: '100000-200000',label: '₹1L – ₹2L',         min: 100000, max: 200000  },
  { id: '200000-500000',label: '₹2L – ₹5L',         min: 200000, max: 500000  },
  { id: '500000+',      label: '₹5L+',              min: 500000, max: 9999999 },
];

const SERVICES = [
  { id: 'photography', label: 'Photography',  icon: Camera   },
  { id: 'catering',    label: 'Catering',     icon: Utensils },
  { id: 'venue',       label: 'Venue',        icon: Building2},
  { id: 'decoration',  label: 'Decoration',   icon: Sparkles },
  { id: 'makeup',      label: 'Makeup',       icon: Wand2    },
  { id: 'dj',          label: 'DJ / Music',   icon: Music    },
];

const PRICE_TYPES = [
  { id: 'budget',   label: 'Budget Friendly', desc: 'Best value, essential services',   emoji: '💡' },
  { id: 'balanced', label: 'Balanced',         desc: 'Quality + value blend',            emoji: '⚖️' },
  { id: 'premium',  label: 'Premium',          desc: 'Top-tier vendors, luxury feel',    emoji: '👑' },
];

const VENDOR_SERVICES = [
  'Photography & Videography', 'Catering', 'Venue / Banquet Hall',
  'Decoration', 'Makeup & Styling', 'DJ & Music', 'Mehndi Artist',
  'Wedding Planner', 'Florist', 'Invitation Cards', 'Choreography', 'Other',
];

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
      <div
        className="h-1.5 rounded-full bg-red-600 transition-all duration-500"
        style={{ width: `${(current / total) * 100}%` }}
      />
    </div>
  );
}

// ─── Step Wrapper ─────────────────────────────────────────────────────────────

function StepWrapper({
  title, subtitle, children, onBack, onNext, nextLabel = 'Continue', nextDisabled, step, total, loading,
}: {
  title: string; subtitle?: string; children: React.ReactNode;
  onBack?: () => void; onNext: () => void; nextLabel?: string;
  nextDisabled?: boolean; step: number; total: number; loading?: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      <ProgressBar current={step} total={total} />
      <div className="mb-6">
        <p className="text-xs text-red-500 font-semibold uppercase tracking-widest mb-1">
          Step {step} of {total}
        </p>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
        <button
          onClick={onNext}
          disabled={nextDisabled || loading}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>{nextLabel} <ChevronRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main Flow Component ──────────────────────────────────────────────────────

export default function OnboardingFlow() {
  const { user, setUser, setPreferences } = useAppStore();
  const router = useRouter();

  const [role, setRole] = useState<Role | null>(null);
  const [userStep, setUserStep] = useState<UserStep>('role');
  const [vendorStep, setVendorStep] = useState<VendorStep>('role');
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<any[]>([]);

  // User form state
  const [eventType, setEventType] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [cityId, setCityId] = useState<number | null>(null);
  const [citySearch, setCitySearch] = useState('');
  const [guestCount, setGuestCount] = useState<number>(50);
  const [eventDate, setEventDate] = useState('');
  const [isFlexible, setIsFlexible] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [priceType, setPriceType] = useState('');

  // Vendor form state
  const [businessName, setBusinessName] = useState('');
  const [vendorCategoryIds, setVendorCategoryIds] = useState<number[]>([]);
  const [vendorCityId, setVendorCityId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [minPrice, setMinPrice] = useState<number>(10000);
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [vendorServices, setVendorServices] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  // First package
  const [pkgTitle, setPkgTitle] = useState('');
  const [pkgPrice, setPkgPrice] = useState<number>(25000);
  const [pkgDesc, setPkgDesc] = useState('');
  const [pkgIncludes, setPkgIncludes] = useState('');
  const [pkgTag, setPkgTag] = useState('standard');

  // Load cities
  useEffect(() => {
    locationsApi.getCities().then((data: any) => setCities(Array.isArray(data) ? data : data?.data ?? [])).catch(() => {});
    categoriesApi.getAll().then((data: any) => setCategories(Array.isArray(data) ? data : data?.data ?? [])).catch(() => {});
  }, []);

  const filteredCities = cities.filter(c =>
    !citySearch || c.name.toLowerCase().includes(citySearch.toLowerCase()),
  );

  // ─── Role selection ──────────────────────────────────────────────────────

  if (!role) {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-red-50 via-white to-rose-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-red-600 items-center justify-center mb-4 shadow-lg shadow-red-200">
              <Star className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">Welcome to PlanToday</h1>
            <p className="text-gray-500 mt-2">India's smartest event marketplace</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">What brings you here?</h2>
            <p className="text-sm text-gray-500 text-center mb-8">This helps us personalize your experience</p>

            <div className="space-y-4">
              <button
                onClick={() => { setRole('user'); setUserStep('eventType'); }}
                className="w-full group relative overflow-hidden rounded-2xl border-2 border-transparent hover:border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-6 text-left transition-all hover:shadow-lg hover:shadow-red-100 active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">Plan an Event</p>
                    <p className="text-sm text-gray-500 mt-0.5">Find vendors, compare packages, get the best deals</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-red-400 ml-auto shrink-0" />
                </div>
              </button>

              <button
                onClick={() => { setRole('vendor'); setVendorStep('businessInfo'); }}
                className="w-full group relative overflow-hidden rounded-2xl border-2 border-transparent hover:border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 text-left transition-all hover:shadow-lg hover:shadow-blue-100 active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0">
                    <Briefcase className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">Grow My Business</p>
                    <p className="text-sm text-gray-500 mt-0.5">List your services, get leads, grow your client base</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-blue-400 ml-auto shrink-0" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── User Steps ──────────────────────────────────────────────────────────

  const USER_TOTAL = 7;

  const submitUserOnboarding = async () => {
    const budget = BUDGET_RANGES.find(b => b.id === budgetRange);
    setLoading(true);
    try {
      const res: any = await onboardingApi.completeUser({
        eventType,
        budgetMin:  budget?.min ?? 0,
        budgetMax:  budget?.max ?? 999999,
        cityId:     cityId!,
        guestCount,
        eventDate:  !isFlexible && eventDate ? eventDate : undefined,
        isFlexibleDate: isFlexible,
        services,
        priceType,
      });
      setPreferences({
        eventType,
        budgetMin: budget?.min,
        budgetMax: budget?.max,
        cityId: cityId ?? undefined,
        guestCount,
        eventDate: !isFlexible ? eventDate : undefined,
        isFlexibleDate: isFlexible,
        services,
        priceType,
      });
      setUser({ ...user!, onboardingComplete: true, role: 'user' });
      setUserStep('done');
    } catch { /* show error */ } finally { setLoading(false); }
  };

  if (role === 'user') {
    const stepNum = {
      eventType: 1, budget: 2, location: 3, guests: 4, date: 5, services: 6, priceType: 7
    }[userStep as string] ?? 1;

    const Shell = ({ children, title, subtitle, nextDisabled, onNext, onBack, nextLabel }: any) => (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-red-50 via-white to-rose-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-gray-100 p-8">
          <StepWrapper
            title={title} subtitle={subtitle} step={stepNum} total={USER_TOTAL}
            nextDisabled={nextDisabled} onNext={onNext} onBack={onBack} nextLabel={nextLabel}
            loading={loading}
          >
            {children}
          </StepWrapper>
        </div>
      </div>
    );

    // Step 1: Event Type
    if (userStep === 'eventType') return (
      <Shell title="What are you planning?" subtitle="Select the type of event you want to organize"
        nextDisabled={!eventType} onNext={() => setUserStep('budget')}
        onBack={() => { setRole(null); setUserStep('role'); }}
      >
        <div className="grid grid-cols-2 gap-3">
          {EVENT_TYPES.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setEventType(id)}
              className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                eventType === id ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-gray-200 bg-gray-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-2`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-800">{label}</p>
              {eventType === id && (
                <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-red-500" />
              )}
            </button>
          ))}
        </div>
      </Shell>
    );

    // Step 2: Budget
    if (userStep === 'budget') return (
      <Shell title="What's your budget?" subtitle="We'll show vendors that fit your budget"
        nextDisabled={!budgetRange} onNext={() => setUserStep('location')}
        onBack={() => setUserStep('eventType')}
      >
        <div className="space-y-3">
          {BUDGET_RANGES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setBudgetRange(id)}
              className={`w-full p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
                budgetRange === id ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <span className="font-semibold text-gray-800">{label}</span>
              {budgetRange === id && <CheckCircle2 className="w-5 h-5 text-red-500" />}
            </button>
          ))}
        </div>
      </Shell>
    );

    // Step 3: Location
    if (userStep === 'location') return (
      <Shell title="Where's the event?" subtitle="We'll find vendors in your city"
        nextDisabled={!cityId} onNext={() => setUserStep('guests')}
        onBack={() => setUserStep('budget')}
      >
        <div className="space-y-3">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search city..."
              value={citySearch}
              onChange={e => setCitySearch(e.target.value)}
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredCities.slice(0, 20).map((city: any) => (
              <button
                key={city.id}
                onClick={() => setCityId(city.id)}
                className={`w-full p-3 rounded-xl border-2 text-left flex items-center justify-between transition-all ${
                  cityId === city.id ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <span className="text-sm font-medium text-gray-800">{city.name}</span>
                {cityId === city.id && <CheckCircle2 className="w-4 h-4 text-red-500" />}
              </button>
            ))}
          </div>
        </div>
      </Shell>
    );

    // Step 4: Guest Count
    if (userStep === 'guests') return (
      <Shell title="How many guests?" subtitle="Approximate number of attendees"
        onNext={() => setUserStep('date')} onBack={() => setUserStep('location')}
      >
        <div className="space-y-6">
          <div className="text-center py-4">
            <p className="text-6xl font-extrabold text-red-600">{guestCount}</p>
            <p className="text-gray-500 mt-1">guests</p>
          </div>
          <input
            type="range"
            min={10} max={1000} step={10}
            value={guestCount}
            onChange={e => setGuestCount(Number(e.target.value))}
            className="w-full accent-red-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>10</span><span>250</span><span>500</span><span>1000+</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[25, 50, 100, 200, 300, 500, 750, 1000].map(n => (
              <button
                key={n}
                onClick={() => setGuestCount(n)}
                className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                  guestCount === n ? 'bg-red-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-red-50'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </Shell>
    );

    // Step 5: Date
    if (userStep === 'date') return (
      <Shell title="When's the event?" subtitle="Helps us check vendor availability"
        onNext={() => setUserStep('services')} onBack={() => setUserStep('guests')}
      >
        <div className="space-y-4">
          <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-100 cursor-pointer hover:border-gray-200">
            <input
              type="checkbox"
              checked={isFlexible}
              onChange={e => setIsFlexible(e.target.checked)}
              className="accent-red-600 w-4 h-4"
            />
            <div>
              <p className="text-sm font-semibold text-gray-800">Flexible / Not decided yet</p>
              <p className="text-xs text-gray-500">I'll confirm the date later</p>
            </div>
          </label>
          {!isFlexible && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Select a date</label>
              <input
                type="date"
                value={eventDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setEventDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>
          )}
        </div>
      </Shell>
    );

    // Step 6: Services
    if (userStep === 'services') return (
      <Shell title="Which services do you need?"
        subtitle="Select all that apply — we'll match you with the right vendors"
        nextDisabled={services.length === 0} onNext={() => setUserStep('priceType')}
        onBack={() => setUserStep('date')}
      >
        <div className="grid grid-cols-2 gap-3">
          {SERVICES.map(({ id, label, icon: Icon }) => {
            const selected = services.includes(id);
            return (
              <button
                key={id}
                onClick={() => setServices(s => selected ? s.filter(x => x !== id) : [...s, id])}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  selected ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl ${selected ? 'bg-red-600' : 'bg-gray-200'} flex items-center justify-center mb-2 transition-all`}>
                  <Icon className={`w-5 h-5 ${selected ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                {selected && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-red-500" />}
              </button>
            );
          })}
        </div>
      </Shell>
    );

    // Step 7: Price Type
    if (userStep === 'priceType') return (
      <Shell title="What's your preference?" subtitle="We'll highlight vendors that match your style"
        nextDisabled={!priceType} onNext={submitUserOnboarding}
        onBack={() => setUserStep('services')} nextLabel="Find My Vendors →"
      >
        <div className="space-y-4">
          {PRICE_TYPES.map(({ id, label, desc, emoji }) => (
            <button
              key={id}
              onClick={() => setPriceType(id)}
              className={`w-full p-5 rounded-2xl border-2 text-left flex items-center gap-4 transition-all ${
                priceType === id ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <span className="text-3xl">{emoji}</span>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{label}</p>
                <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
              </div>
              {priceType === id && <CheckCircle2 className="w-5 h-5 text-red-500 shrink-0" />}
            </button>
          ))}
        </div>
      </Shell>
    );

    // Done screen
    if (userStep === 'done') {
      setTimeout(() => router.replace('/'), 2500);
      return (
        <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4 overflow-y-auto">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h2>
            <p className="text-gray-500">Finding the best vendors for your {eventType}…</p>
            <div className="mt-6 flex justify-center">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // ─── Vendor Steps ─────────────────────────────────────────────────────────

  const VENDOR_TOTAL = 5;

  const vendorStepNum = {
    businessInfo: 1, services: 2, pricing: 3, contact: 4, firstPackage: 5
  }[vendorStep as string] ?? 1;

  const submitVendorProfile = async () => {
    setLoading(true);
    try {
      await onboardingApi.completeVendor({
        businessName,
        categoryIds: vendorCategoryIds,
        cityId:      vendorCityId!,
        description,
        phone,
        email:       email || undefined,
        minPrice,
        maxPrice,
      });
      setUser({ ...user!, role: 'vendor' });
      setVendorStep('firstPackage');
    } catch { /* err */ } finally { setLoading(false); }
  };

  const submitFirstPackage = async () => {
    setLoading(true);
    try {
      const firstCatId = vendorCategoryIds[0] ?? 1;
      await onboardingApi.createFirstPackage({
        title:       pkgTitle,
        price:       pkgPrice,
        priceType:   'fixed',
        categoryId:  firstCatId,
        description: pkgDesc,
        includes:    pkgIncludes.split('\n').filter(Boolean),
        tag:         pkgTag,
      });
      setUser({ ...user!, onboardingComplete: true, role: 'vendor' });
      setVendorStep('done');
    } catch { /* err */ } finally { setLoading(false); }
  };

  const skipPackage = async () => {
    await onboardingApi.skipFirstPackage();
    setUser({ ...user!, onboardingComplete: true, role: 'vendor' });
    router.replace('/vendor/dashboard');
  };

  const VendorShell = ({ children, title, subtitle, nextDisabled, onNext, onBack, nextLabel }: any) => (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-gray-100 p-8">
        <StepWrapper
          title={title} subtitle={subtitle} step={vendorStepNum} total={VENDOR_TOTAL}
          nextDisabled={nextDisabled} onNext={onNext} onBack={onBack} nextLabel={nextLabel}
          loading={loading}
        >
          {children}
        </StepWrapper>
      </div>
    </div>
  );

  // Vendor Step 1: Business Info
  if (vendorStep === 'businessInfo') return (
    <VendorShell
      title="Tell us about your business"
      subtitle="This is how customers will find you"
      nextDisabled={!businessName || !vendorCityId}
      onNext={() => setVendorStep('services')}
      onBack={() => { setRole(null); setVendorStep('role'); }}
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Business Name *</label>
          <input
            type="text"
            value={businessName}
            onChange={e => setBusinessName(e.target.value)}
            placeholder="e.g. Amit Photography Studio"
            className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">City *</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search your city..."
              value={citySearch}
              onChange={e => setCitySearch(e.target.value)}
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          {citySearch && (
            <div className="mt-2 max-h-40 overflow-y-auto border border-gray-100 rounded-xl divide-y">
              {filteredCities.slice(0, 10).map((city: any) => (
                <button key={city.id} onClick={() => { setVendorCityId(city.id); setCitySearch(city.name); }}
                  className="w-full px-3 py-2.5 text-left text-sm hover:bg-blue-50"
                >
                  {city.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Briefly describe your business and expertise..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
          />
        </div>
      </div>
    </VendorShell>
  );

  // Vendor Step 2: Services
  if (vendorStep === 'services') return (
    <VendorShell
      title="What services do you offer?"
      subtitle="Select all that apply"
      nextDisabled={vendorServices.length === 0}
      onNext={() => setVendorStep('pricing')}
      onBack={() => setVendorStep('businessInfo')}
    >
      <div className="grid grid-cols-2 gap-2">
        {VENDOR_SERVICES.map(svc => {
          const sel = vendorServices.includes(svc);
          return (
            <button
              key={svc}
              onClick={() => setVendorServices(s => sel ? s.filter(x => x !== svc) : [...s, svc])}
              className={`p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                sel ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-700 hover:border-gray-200'
              }`}
            >
              {svc}
            </button>
          );
        })}
      </div>
    </VendorShell>
  );

  // Vendor Step 3: Pricing
  if (vendorStep === 'pricing') return (
    <VendorShell
      title="What's your pricing range?"
      subtitle="Helps clients find you by budget"
      onNext={() => setVendorStep('contact')}
      onBack={() => setVendorStep('services')}
    >
      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Minimum Price: <span className="text-blue-600 font-bold">₹{minPrice.toLocaleString('en-IN')}</span>
          </label>
          <input type="range" min={1000} max={500000} step={1000} value={minPrice}
            onChange={e => setMinPrice(Number(e.target.value))}
            className="w-full accent-blue-600" />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>₹1K</span><span>₹5L</span>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Maximum Price: <span className="text-blue-600 font-bold">₹{maxPrice.toLocaleString('en-IN')}</span>
          </label>
          <input type="range" min={5000} max={2000000} step={5000} value={maxPrice}
            onChange={e => setMaxPrice(Number(e.target.value))}
            className="w-full accent-blue-600" />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>₹5K</span><span>₹20L</span>
          </div>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4">
          <p className="text-sm text-blue-700 font-medium">
            Your range: ₹{minPrice.toLocaleString('en-IN')} – ₹{maxPrice.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-blue-500 mt-0.5">You can always update this from your dashboard</p>
        </div>
      </div>
    </VendorShell>
  );

  // Vendor Step 4: Contact
  if (vendorStep === 'contact') return (
    <VendorShell
      title="How can clients reach you?"
      nextDisabled={!phone}
      onNext={submitVendorProfile}
      onBack={() => setVendorStep('pricing')}
      nextLabel="Create My Profile →"
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Phone Number *</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Email (optional)</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="business@email.com"
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900">What happens next?</p>
            <p className="text-xs text-blue-600 mt-0.5">Your profile goes live and you can start receiving leads. We'll send you 2000 welcome tokens to unlock your first leads!</p>
          </div>
        </div>
      </div>
    </VendorShell>
  );

  // Vendor Step 5: First Package (critical activation step)
  if (vendorStep === 'firstPackage') return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-gray-100 p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Create Your First Package</h2>
          <p className="text-sm text-gray-500 mt-1">Packages get 3x more inquiries than plain profiles</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Package Title *</label>
            <input type="text" value={pkgTitle} onChange={e => setPkgTitle(e.target.value)}
              placeholder="e.g. Complete Wedding Photography Package"
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Price: <span className="text-blue-600">₹{pkgPrice.toLocaleString('en-IN')}</span>
              </label>
              <input type="range" min={1000} max={500000} step={500} value={pkgPrice}
                onChange={e => setPkgPrice(Number(e.target.value))}
                className="w-full accent-blue-600" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Package Type</label>
              <select value={pkgTag} onChange={e => setPkgTag(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="budget">Budget</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
            <textarea value={pkgDesc} onChange={e => setPkgDesc(e.target.value)}
              placeholder="What makes this package special?"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              What's included? <span className="text-gray-400 font-normal">(one per line)</span>
            </label>
            <textarea value={pkgIncludes} onChange={e => setPkgIncludes(e.target.value)}
              placeholder={"e.g.\n8 hours coverage\n500 edited photos\nOnline gallery"}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none font-mono text-xs"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={skipPackage}
            className="px-4 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50"
          >
            Skip for now
          </button>
          <button
            onClick={submitFirstPackage}
            disabled={!pkgTitle || loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <><Package className="w-4 h-4" /> Launch My Profile</>
            }
          </button>
        </div>
      </div>
    </div>
  );

  // Vendor done
  if (vendorStep === 'done') {
    setTimeout(() => router.replace('/vendor/dashboard'), 2500);
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4 overflow-y-auto">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're live on PlanToday! 🎉</h2>
          <p className="text-gray-500">Setting up your vendor dashboard…</p>
          <div className="mt-6 flex justify-center gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
