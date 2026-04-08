'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { LogoMark, CheckIcon, ChevronLeftIcon, RobotIcon, CheckCircleIcon, StoreIcon, UsersIcon, WarningIcon } from '@/components/ui/Icon';

type Step = 'phone' | 'otp' | 'profile';

const TESTIMONIALS = [
  { text: 'Found the perfect wedding photographer in just 10 minutes! The AI search is incredible.', author: 'Priya Sharma', city: 'Noida', role: 'Bride', avatar: 'P' },
  { text: 'Best platform for event vendors. Got 8 leads in the first week of listing my business!', author: 'Rahul Verma', city: 'Delhi', role: 'Photographer', avatar: 'R' },
  { text: 'Got 5 catering quotes within 2 hours. Saved so much time and money. Highly recommended!', author: 'Anjali Kapoor', city: 'Gurgaon', role: 'Event Planner', avatar: 'A' },
];

function PhoneIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}
function LockIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path strokeLinecap="round" d="M8 11V7a4 4 0 018 0v4" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}
function UserPlusIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );
}
function ShieldIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
function ZapIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}
function CoinIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 7v2m0 6v2m-2-4h4" />
    </svg>
  );
}
function WrenchIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function CartIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}
function StarIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

const FEATURES = [
  { Icon: RobotIcon,    title: 'AI-Powered Search',  desc: 'Smart matching with your needs' },
  { Icon: ZapIcon,      title: 'Instant Quotes',      desc: 'Get quotes within 2 hours' },
  { Icon: ShieldIcon,   title: 'Verified Vendors',    desc: 'All vendors are background checked' },
  { Icon: CoinIcon,     title: 'Always Free',         desc: 'Zero booking or platform fees' },
];

const STEP_ICONS = [PhoneIcon, LockIcon, UserPlusIcon];

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken } = useAppStore();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'user' | 'vendor'>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  useEffect(() => {
    setTestimonialIdx(Math.floor(Math.random() * TESTIMONIALS.length));
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await authApi.sendOtp(phone) as unknown as { message: string; otp?: string };
      if (res.otp) setDevOtp(res.otp);
      setStep('otp');
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Failed to send OTP. Try again.');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await authApi.verifyOtp(phone, otp) as unknown as {
        token: string;
        user: { id: number; name?: string; role: 'user' | 'vendor' | 'admin' };
        isNewUser: boolean;
      };
      setToken(res.token); setUser(res.user);
      if (res.isNewUser) { setStep('profile'); }
      else { router.push(res.user.role === 'vendor' ? '/partner/dashboard' : res.user.role === 'admin' ? '/admin' : '/'); }
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  };

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await authApi.updateProfile({ name, role }) as unknown as {
        user: { id: number; name: string; role: 'user' | 'vendor' | 'admin' };
      };
      setUser(res.user);
      router.push(role === 'vendor' ? '/partner/onboard' : '/');
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Failed to save profile.');
    } finally { setLoading(false); }
  };

  const t = TESTIMONIALS[testimonialIdx];
  const steps: Step[] = ['phone', 'otp', 'profile'];
  const stepIdx = steps.indexOf(step);

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── Left branding panel ────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-red-900 via-red-800 to-rose-900 text-white flex-col relative overflow-hidden">
        <div className="hero-pattern absolute inset-0 opacity-50" />
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-20 -left-16 w-56 h-56 bg-yellow-400/15 rounded-full blur-3xl animate-float-medium" />

        {/* Logo */}
        <div className="relative p-10 pb-0">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
              <LogoMark className="w-7 h-7" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-2xl tracking-tight">Plan<span className="text-yellow-300">Today</span></span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mt-0.5">plantoday.in</span>
            </div>
          </Link>
          <p className="text-red-200 text-sm mt-2 ml-1">India&apos;s Smartest Event Vendor Search</p>
        </div>

        {/* Main content */}
        <div className="relative flex-1 flex flex-col justify-center px-10 py-8">
          <h2 className="text-3xl font-extrabold leading-tight mb-4">
            Your Perfect Event Vendor
            <br />
            <span className="text-yellow-300">is One Search Away</span>
          </h2>
          <p className="text-red-100 text-sm leading-relaxed mb-8 max-w-sm">
            Join 2 million+ users who find photographers, caterers, venues and more — with free instant quotes.
          </p>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15">
                <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center mb-3">
                  <f.Icon className="w-5 h-5 text-yellow-300" />
                </div>
                <p className="text-sm font-bold text-white">{f.title}</p>
                <p className="text-xs text-red-200 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
            <div className="flex gap-0.5 mb-3">
              {[...Array(5)].map((_, i) => <StarIcon key={i} className="w-4 h-4 text-yellow-300" />)}
            </div>
            <p className="text-sm text-white/90 italic leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center text-sm font-extrabold shadow">
                {t.avatar}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{t.author}</p>
                <p className="text-xs text-red-200">{t.role} · {t.city}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative px-10 pb-10">
          <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
            {[
              { value: '2000+', label: 'Vendors' },
              { value: '50K+', label: 'Events' },
              { value: '4.8', label: 'Rating' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-white font-extrabold text-xl">{s.value}</p>
                <p className="text-red-200 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-gray-50/50">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <LogoMark className="w-9 h-9" />
              <div className="flex flex-col leading-none text-left">
                <span className="font-black text-2xl text-gray-900 tracking-tight">Plan<span className="text-red-600">Today</span></span>
                <span className="text-[9px] text-gray-400 uppercase tracking-widest">plantoday.in</span>
              </div>
            </Link>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 p-8">

            {/* Step indicator */}
            <div className="flex items-center mb-8">
              {steps.map((s, i) => {
                const StepIcon = STEP_ICONS[i];
                const done = stepIdx > i;
                const active = s === step;
                return (
                  <div key={s} className="flex items-center flex-1">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
                      active  ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-200 scale-110'
                      : done  ? 'bg-emerald-500 text-white'
                              : 'bg-gray-100 text-gray-400'
                    }`}>
                      {done
                        ? <CheckIcon className="w-4 h-4" />
                        : <StepIcon className="w-4 h-4" />
                      }
                    </div>
                    {i < 2 && (
                      <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${done ? 'bg-emerald-400' : 'bg-gray-100'}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Step: Phone ──────────────────────────────────── */}
            {step === 'phone' && (
              <div>
                <div className="mb-7">
                  <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                    <PhoneIcon className="w-7 h-7 text-red-500" />
                  </div>
                  <h1 className="text-2xl font-extrabold text-gray-900">Welcome to PlanToday!</h1>
                  <p className="text-gray-500 text-sm mt-1.5">Enter your mobile number to login or create your account</p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Mobile Number</label>
                    <div className="flex rounded-2xl overflow-hidden border-2 border-gray-200 focus-within:border-red-400 focus-within:shadow-[0_0_0_4px_rgba(220,38,38,0.08)] transition-all">
                      <span className="flex items-center gap-2 px-4 bg-gray-50 border-r border-gray-200 text-gray-600 text-sm font-semibold shrink-0">
                        <svg className="w-4 h-3" viewBox="0 0 28 20" fill="none">
                          <rect width="28" height="20" rx="2" fill="#FF9933"/>
                          <rect y="6.667" width="28" height="6.667" fill="white"/>
                          <rect y="13.333" width="28" height="6.667" fill="#138808"/>
                          <circle cx="14" cy="10" r="2.5" fill="none" stroke="#000080" strokeWidth="0.6"/>
                        </svg>
                        +91
                      </span>
                      <input
                        required
                        type="tel"
                        pattern="[6-9]\d{9}"
                        placeholder="98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="flex-1 px-4 py-4 bg-white outline-none text-gray-800 text-base font-medium placeholder-gray-300"
                        autoFocus
                      />
                      {phone.length === 10 && (
                        <span className="flex items-center pr-4 text-emerald-500">
                          <CheckIcon className="w-5 h-5" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5 ml-1">A 6-digit OTP will be sent to this number</p>
                  </div>

                  {error && <ErrorBox msg={error} />}

                  <button
                    type="submit"
                    disabled={loading || phone.length < 10}
                    className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold py-4 rounded-2xl transition-all disabled:opacity-50 text-base shadow-lg shadow-red-200 disabled:shadow-none active:scale-[0.99]"
                  >
                    {loading ? <Spinner label="Sending OTP..." /> : 'Send OTP →'}
                  </button>

                  <p className="text-center text-xs text-gray-400 leading-relaxed">
                    By continuing, you agree to our{' '}
                    <Link href="/terms" className="text-red-600 hover:underline font-medium">Terms</Link>
                    {' '}&amp;{' '}
                    <Link href="/privacy" className="text-red-600 hover:underline font-medium">Privacy Policy</Link>
                  </p>
                </form>
              </div>
            )}

            {/* ── Step: OTP ────────────────────────────────────── */}
            {step === 'otp' && (
              <div>
                <div className="mb-7">
                  <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-4">
                    <LockIcon className="w-7 h-7 text-orange-500" />
                  </div>
                  <h1 className="text-2xl font-extrabold text-gray-900">Verify Your Number</h1>
                  <p className="text-gray-500 text-sm mt-1.5">
                    We sent a 6-digit OTP to{' '}
                    <span className="font-bold text-gray-900">+91 {phone}</span>
                  </p>
                </div>

                {devOtp && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-800 mb-5 flex items-center gap-3">
                    <WrenchIcon className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>Dev OTP: <strong className="font-mono text-xl tracking-widest">{devOtp}</strong></span>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Enter 6-digit OTP</label>
                    <input
                      required
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="_ _ _ _ _ _"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full border-2 border-gray-200 focus:border-red-400 focus:shadow-[0_0_0_4px_rgba(220,38,38,0.08)] rounded-2xl px-5 py-5 text-center text-4xl font-extrabold tracking-[0.6em] outline-none transition-all text-gray-800"
                      autoFocus
                    />
                    <div className="flex justify-center gap-2.5 mt-3">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                          i < otp.length ? 'bg-red-500 scale-125' : 'bg-gray-200'
                        }`} />
                      ))}
                    </div>
                  </div>

                  {error && <ErrorBox msg={error} />}

                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold py-4 rounded-2xl transition-all disabled:opacity-50 text-base shadow-lg shadow-red-200 disabled:shadow-none"
                  >
                    {loading ? <Spinner label="Verifying..." /> : 'Verify & Continue →'}
                  </button>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                      className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition font-medium"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                      Change number
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOtp(''); setError(''); handleSendOtp({ preventDefault: () => {} } as React.FormEvent); }}
                      className="text-red-600 hover:text-red-700 font-bold transition"
                    >
                      Resend OTP
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── Step: Profile ─────────────────────────────────── */}
            {step === 'profile' && (
              <div>
                <div className="mb-7">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                    <UserPlusIcon className="w-7 h-7 text-emerald-500" />
                  </div>
                  <h1 className="text-2xl font-extrabold text-gray-900">Almost There!</h1>
                  <p className="text-gray-500 text-sm mt-1.5">Just a couple of details to personalize your experience</p>
                </div>

                <form onSubmit={handleProfile} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Your Full Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border-2 border-gray-200 focus:border-red-400 focus:shadow-[0_0_0_4px_rgba(220,38,38,0.08)] rounded-2xl px-4 py-4 outline-none transition-all text-gray-800 font-medium text-base"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">I am joining as...</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'user',   label: 'Customer', Icon: CartIcon,  desc: 'Looking for event vendors',  activeClass: 'border-red-400 bg-red-50 shadow-md shadow-red-100' },
                        { value: 'vendor', label: 'Vendor',   Icon: StoreIcon, desc: 'Offering event services',    activeClass: 'border-blue-400 bg-blue-50 shadow-md shadow-blue-100' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setRole(opt.value as 'user' | 'vendor')}
                          className={`relative p-4 border-2 rounded-2xl text-left transition-all ${
                            role === opt.value ? opt.activeClass : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          {role === opt.value && (
                            <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                              <CheckIcon className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-2">
                            <opt.Icon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="text-sm font-extrabold text-gray-900">{opt.label}</div>
                          <div className="text-xs text-gray-500 mt-0.5 leading-tight">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && <ErrorBox msg={error} />}

                  <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold py-4 rounded-2xl transition-all disabled:opacity-50 text-base shadow-lg shadow-red-200 disabled:shadow-none"
                  >
                    {loading
                      ? <Spinner label="Saving..." />
                      : role === 'vendor' ? 'Continue to List Business →' : 'Start Exploring →'
                    }
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Back link */}
          <p className="text-center text-sm text-gray-400 mt-6">
            <Link href="/" className="hover:text-red-600 transition font-medium inline-flex items-center justify-center gap-1">
              <ChevronLeftIcon className="w-4 h-4" />
              Back to PlanToday
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-700 text-sm flex items-center gap-2.5">
      <WarningIcon className="w-4 h-4 shrink-0" />
      {msg}
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <span className="flex items-center justify-center gap-2.5">
      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      {label}
    </span>
  );
}
