'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { LogoMark, CheckIcon, ChevronLeftIcon, WarningIcon } from '@/components/ui/Icon';

type Step = 'phone' | 'otp' | 'profile';
const STEPS: Step[] = ['phone', 'otp', 'profile'];

const FEATURES = [
  { icon: '⚡', label: 'Instant Quotes',   desc: 'Free quotes in 2 hrs' },
  { icon: '✅', label: 'Verified Vendors', desc: 'Background checked' },
  { icon: '🤖', label: 'AI Matching',      desc: 'Smart recommendations' },
  { icon: '₹0', label: 'Always Free',      desc: 'Zero platform fee' },
];

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken } = useAppStore();
  const formRef = useRef<HTMLDivElement>(null);

  const [step,    setStep]    = useState<Step>('phone');
  const [phone,   setPhone]   = useState('');
  const [otp,     setOtp]     = useState('');
  const [name,    setName]    = useState('');
  const [role,    setRole]    = useState<'user' | 'vendor'>('user');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [devOtp,  setDevOtp]  = useState('');

  const stepIdx = STEPS.indexOf(step);

  // Keyboard-aware: lift form above keyboard on mobile
  useEffect(() => {
    const form = formRef.current;
    const vv = window.visualViewport;
    if (!form || !vv) return;

    const update = () => {
      if (window.innerWidth >= 1024) return;
      const kbH = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      form.style.paddingBottom = kbH > 0 ? `${kbH + 16}px` : '';
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await authApi.sendOtp(phone) as unknown as { otp?: string };
      if (res.otp) setDevOtp(res.otp);
      setStep('otp');
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Failed to send OTP.');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await authApi.verifyOtp(phone, otp) as unknown as {
        token: string;
        user: { id: number; name?: string; role: 'user' | 'vendor' | 'admin' | 'super_admin' };
        isNewUser: boolean;
      };
      setToken(res.token); setUser(res.user);
      if (res.isNewUser) { setStep('profile'); return; }
      router.push(
        res.user.role === 'vendor' ? '/partner/dashboard' :
        (res.user.role === 'admin' || res.user.role === 'super_admin') ? '/admin' : '/'
      );
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  };

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await authApi.updateProfile({ name, role }) as unknown as {
        user: { id: number; name: string; role: string };
      };
      setUser(res.user);
      router.push(role === 'vendor' ? '/partner/onboard' : '/');
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Failed to save profile.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col lg:flex-row overflow-hidden">

      {/* ── Desktop: brand panel (left) ───────────────────────────── */}
      <div className="
        hidden lg:flex lg:w-5/12 lg:min-h-screen
        flex-col relative overflow-hidden
        bg-gradient-to-br from-red-900 via-red-800 to-rose-900 text-white
      ">
        <div className="hero-pattern absolute inset-0 opacity-40" />
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 -left-10 w-40 h-40 bg-yellow-400/15 rounded-full blur-3xl" />

        <div className="relative px-10 pt-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <LogoMark className="w-7 h-7" />
            </div>
            <span className="font-black text-2xl tracking-tight">Plan<span className="text-yellow-300">Today</span></span>
          </Link>
        </div>

        <div className="relative flex-1 flex flex-col justify-center px-10 py-8">
          <h2 className="text-3xl font-extrabold leading-tight mb-3">
            Your Perfect Event Vendor
            <br /><span className="text-yellow-300">is One Search Away</span>
          </h2>
          <p className="text-red-100 text-sm leading-relaxed mb-8 max-w-sm">
            Join 2 million+ users who find photographers, caterers, venues and more — with free instant quotes.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {FEATURES.map((f) => (
              <div key={f.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15">
                <div className="text-2xl mb-2">{f.icon}</div>
                <p className="text-sm font-bold text-white">{f.label}</p>
                <p className="text-xs text-red-200 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
            {[{ value: '2000+', label: 'Vendors' }, { value: '50K+', label: 'Events' }, { value: '4.8★', label: 'Rating' }].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-white font-extrabold text-xl">{s.value}</p>
                <p className="text-red-200 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile + Desktop form panel ──────────────────────────── */}
      <div className="flex-1 flex flex-col lg:items-center lg:justify-center lg:p-10 bg-white">

        {/* Mobile: compact hero strip */}
        <div className="lg:hidden bg-gradient-to-br from-red-800 to-rose-900 text-white px-5 pt-10 pb-6 relative overflow-hidden">
          <div className="hero-pattern absolute inset-0 opacity-30" />
          <div className="relative flex items-center gap-3 mb-3">
            <Link href="/" className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
              <ChevronLeftIcon className="w-4 h-4 text-white" />
            </Link>
            <div className="flex items-center gap-2">
              <LogoMark className="w-7 h-7" />
              <span className="font-black text-lg">Plan<span className="text-yellow-300">Today</span></span>
            </div>
          </div>
          <div className="relative">
            <h1 className="text-xl font-extrabold text-white leading-tight">
              {step === 'phone'   ? 'Sign in to continue 👋' :
               step === 'otp'    ? 'Enter your OTP 🔐' :
                                   'Almost done! 🎉'}
            </h1>
            <p className="text-red-200 text-sm mt-1">
              {step === 'phone'   ? 'We\'ll send a 6-digit OTP to verify' :
               step === 'otp'    ? `Sent to +91 ${phone}` :
                                   'Tell us a bit about yourself'}
            </p>
          </div>
        </div>

        {/* Form area */}
        <div
          ref={formRef}
          className="flex-1 flex flex-col w-full lg:max-w-md px-5 pt-6 pb-6 lg:px-0 overflow-y-auto"
        >
          {/* Desktop: heading */}
          <div className="hidden lg:block mb-6">
            <h1 className="text-2xl font-extrabold text-gray-900">
              {step === 'phone'   ? 'Welcome Back 👋' :
               step === 'otp'    ? 'Enter OTP 🔐' :
                                   'Almost There! 🎉'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {step === 'phone'   ? 'Login or register with your mobile number' :
               step === 'otp'    ? `Code sent to +91 ${phone}` :
                                   'Quick setup to personalise your experience'}
            </p>
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-1.5 mb-6">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 transition-all ${
                  i < stepIdx  ? 'bg-emerald-500 text-white'
                  : s === step ? 'bg-red-600 text-white ring-4 ring-red-100'
                               : 'bg-gray-100 text-gray-400'
                }`}>
                  {i < stepIdx ? <CheckIcon className="w-3.5 h-3.5" /> : i + 1}
                </div>
                {i < 2 && <div className={`flex-1 h-1 mx-1 rounded-full ${i < stepIdx ? 'bg-emerald-400' : 'bg-gray-100'}`} />}
              </div>
            ))}
          </div>

          {/* ── Phone ── */}
          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-4 flex-1 flex flex-col">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mobile Number</label>
                <div className="flex rounded-2xl overflow-hidden border-2 border-gray-200 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-50 transition-all">
                  <span className="flex items-center gap-1.5 px-4 bg-gray-50 border-r border-gray-200 text-gray-600 text-sm font-semibold shrink-0">
                    <svg className="w-4 h-3 shrink-0" viewBox="0 0 28 20" fill="none">
                      <rect width="28" height="20" rx="2" fill="#FF9933"/>
                      <rect y="6.667" width="28" height="6.667" fill="white"/>
                      <rect y="13.333" width="28" height="6.667" fill="#138808"/>
                      <circle cx="14" cy="10" r="2.5" fill="none" stroke="#000080" strokeWidth="0.6"/>
                    </svg>
                    +91
                  </span>
                  <input
                    required autoFocus
                    type="tel" inputMode="numeric"
                    pattern="[6-9]\d{9}" placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="flex-1 px-4 py-4 bg-white outline-none text-gray-800 text-lg font-medium placeholder-gray-300 min-h-[56px]"
                  />
                  {phone.length === 10 && (
                    <span className="flex items-center pr-4 text-emerald-500 shrink-0">
                      <CheckIcon className="w-5 h-5" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1.5 ml-1">No password needed · OTP via SMS · 100% free</p>
              </div>

              {error && <ErrorBox msg={error} />}

              {devOtp && <DevBox otp={devOtp} />}

              <div className="flex-1" />

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold py-4 rounded-2xl transition-all disabled:opacity-50 text-base shadow-lg shadow-red-200/60 active:scale-[0.98] min-h-[56px]"
              >
                {loading ? <Spinner label="Sending OTP…" /> : 'Get OTP →'}
              </button>

              <p className="text-center text-xs text-gray-400">
                By continuing you agree to our{' '}
                <Link href="/terms" className="text-red-600 font-medium">Terms</Link> &amp;{' '}
                <Link href="/privacy" className="text-red-600 font-medium">Privacy Policy</Link>
              </p>
            </form>
          )}

          {/* ── OTP ── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 flex-1 flex flex-col">
              {devOtp && <DevBox otp={devOtp} />}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">6-digit OTP</label>
                <input
                  required autoFocus
                  type="text" inputMode="numeric"
                  maxLength={6} placeholder="· · · · · ·"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full border-2 border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 rounded-2xl px-5 py-5 text-center text-3xl font-extrabold tracking-[0.6em] outline-none transition-all text-gray-800 min-h-[72px]"
                />
                {/* Progress dots */}
                <div className="flex justify-center gap-2.5 mt-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-150 ${i < otp.length ? 'bg-red-500 scale-125' : 'bg-gray-200'}`} />
                  ))}
                </div>
              </div>

              {error && <ErrorBox msg={error} />}

              <div className="flex-1" />

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold py-4 rounded-2xl transition-all disabled:opacity-50 text-base shadow-lg shadow-red-200/60 active:scale-[0.98] min-h-[56px]"
              >
                {loading ? <Spinner label="Verifying…" /> : 'Verify & Continue →'}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button type="button"
                  onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                  className="flex items-center gap-1 text-gray-500 hover:text-red-600 font-medium active:opacity-70 min-h-[44px]">
                  <ChevronLeftIcon className="w-4 h-4" /> Change number
                </button>
                <button type="button"
                  onClick={() => handleSendOtp()}
                  className="text-red-600 font-bold hover:text-red-700 active:opacity-70 min-h-[44px]">
                  Resend OTP
                </button>
              </div>
            </form>
          )}

          {/* ── Profile ── */}
          {step === 'profile' && (
            <form onSubmit={handleProfile} className="space-y-4 flex-1 flex flex-col">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Your Name</label>
                <input
                  required autoFocus
                  type="text" placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 rounded-2xl px-4 py-4 outline-none transition-all text-gray-800 font-medium min-h-[56px]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">I&apos;m joining as…</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'user',   label: 'Customer', icon: '🛍️', desc: 'Looking for vendors' },
                    { value: 'vendor', label: 'Vendor',   icon: '🏪', desc: 'Offering services' },
                  ].map((opt) => (
                    <button key={opt.value} type="button"
                      onClick={() => setRole(opt.value as 'user' | 'vendor')}
                      className={`relative p-4 border-2 rounded-2xl text-left transition-all active:scale-[0.97] min-h-[96px] ${
                        role === opt.value
                          ? 'border-red-500 bg-red-50 shadow-md shadow-red-100'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                      {role === opt.value && (
                        <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                          <CheckIcon className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <span className="text-2xl block mb-2">{opt.icon}</span>
                      <p className="text-sm font-extrabold text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {error && <ErrorBox msg={error} />}

              <div className="flex-1" />

              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold py-4 rounded-2xl transition-all disabled:opacity-50 text-base shadow-lg shadow-red-200/60 active:scale-[0.98] min-h-[56px]"
              >
                {loading ? <Spinner label="Saving…" /> : role === 'vendor' ? 'List My Business →' : 'Start Exploring →'}
              </button>
            </form>
          )}

          {/* Back link — desktop */}
          <div className="hidden lg:block mt-6 text-center">
            <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-red-600 transition font-medium">
              <ChevronLeftIcon className="w-4 h-4" /> Back to PlanToday
            </Link>
          </div>
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

function DevBox({ otp }: { otp: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-2.5">
      <span className="text-lg">🔧</span>
      <span className="text-sm text-amber-800">Dev OTP: <strong className="font-mono text-base tracking-widest">{otp}</strong></span>
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <span className="flex items-center justify-center gap-2">
      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      {label}
    </span>
  );
}
