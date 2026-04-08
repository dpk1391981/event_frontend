'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { LogoMark, CheckIcon, ChevronLeftIcon, WarningIcon } from '@/components/ui/Icon';
import type { User } from '@/store/useAppStore';

type Step = 'phone' | 'otp' | 'profile';

export default function AuthBottomSheet() {
  const router = useRouter();
  const { authModalOpen, closeAuthModal, setUser, setToken, user } = useAppStore();

  const [step,    setStep]    = useState<Step>('phone');
  const [phone,   setPhone]   = useState('');
  const [otp,     setOtp]     = useState('');
  const [name,    setName]    = useState('');
  const [role,    setRole]    = useState<'user' | 'vendor'>('user');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [devOtp,  setDevOtp]  = useState('');
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close if user is already logged in
  useEffect(() => {
    if (user && authModalOpen) closeAuthModal();
  }, [user, authModalOpen]);

  // Lock body scroll while open
  useEffect(() => {
    if (authModalOpen) {
      document.body.style.overflow = 'hidden';
      // Reset state on open
      setStep('phone'); setPhone(''); setOtp(''); setName('');
      setError(''); setDevOtp('');
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [authModalOpen]);

  // Keyboard-aware sheet position — lifts sheet above keyboard on mobile
  useEffect(() => {
    if (!authModalOpen) return;
    const sheet = sheetRef.current;
    const vv = window.visualViewport;
    if (!sheet || !vv) return;

    const update = () => {
      if (window.innerWidth >= 640) return; // desktop uses centered modal, no adjustment needed
      const kbHeight = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      sheet.style.bottom = `${kbHeight}px`;
      sheet.style.maxHeight = `${vv.height * 0.95}px`;
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      if (sheet) { sheet.style.bottom = ''; sheet.style.maxHeight = ''; }
    };
  }, [authModalOpen]);

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
        token: string; user: User; isNewUser: boolean;
      };
      setToken(res.token); setUser(res.user);
      if (res.isNewUser) { setStep('profile'); return; }
      closeAuthModal();
      if (res.user.role === 'vendor') router.push('/partner/dashboard');
      else if (res.user.role === 'admin' || res.user.role === 'super_admin') router.push('/admin');
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  };

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await authApi.updateProfile({ name, role }) as unknown as {
        user: User;
      };
      setUser(res.user);
      closeAuthModal();
      if (role === 'vendor') router.push('/partner/onboard');
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Failed to save profile.');
    } finally { setLoading(false); }
  };

  if (!authModalOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/50 fade-in"
        onClick={closeAuthModal}
      />

      {/* Sheet — bottom on mobile, centered on desktop */}
      <div
        ref={sheetRef}
        className="
          fixed z-[201]
          /* Mobile: full-width bottom sheet */
          bottom-0 left-0 right-0 rounded-t-3xl
          /* Desktop: centered modal */
          sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
          sm:rounded-3xl sm:max-w-md sm:w-full sm:mx-4
          bg-white shadow-2xl
          sheet-up sm:animate-none
          max-h-[92dvh] overflow-y-auto
        "
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
      >
        {/* Drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between px-5 pt-3 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <LogoMark className="w-7 h-7" />
            <span className="font-black text-lg text-gray-900">Plan<span className="text-red-600">Today</span></span>
          </div>
          <button
            onClick={closeAuthModal}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 pt-4 pb-6">
          {/* Step dots */}
          <div className="flex items-center gap-1.5 mb-6">
            {(['phone','otp','profile'] as Step[]).map((s, i) => {
              const stepIdx = ['phone','otp','profile'].indexOf(step);
              return (
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
              );
            })}
          </div>

          {/* ── Phone ───────────────────────────────────────── */}
          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Welcome! 👋</h2>
                <p className="text-gray-500 text-sm mt-0.5">Login or create account with your mobile</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mobile Number</label>
                <div className="flex rounded-2xl overflow-hidden border-2 border-gray-200 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-50 transition-all">
                  <span className="flex items-center gap-1 px-3 bg-gray-50 border-r border-gray-200 text-gray-600 text-sm font-semibold shrink-0">
                    <svg className="w-4 h-3" viewBox="0 0 28 20" fill="none">
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
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
                    className="flex-1 px-4 py-4 bg-white outline-none text-gray-800 font-medium placeholder-gray-300"
                  />
                  {phone.length === 10 && <span className="flex items-center pr-3 text-emerald-500 shrink-0"><CheckIcon className="w-5 h-5" /></span>}
                </div>
              </div>
              {error && <ErrBox msg={error} />}
              <button type="submit" disabled={loading || phone.length < 10}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold py-4 rounded-2xl disabled:opacity-50 shadow-lg shadow-red-200/60 active:scale-[0.98] transition min-h-[52px]">
                {loading ? <Spin label="Sending…" /> : 'Get OTP →'}
              </button>
              <p className="text-center text-xs text-gray-400">No password needed · OTP sent via SMS</p>
            </form>
          )}

          {/* ── OTP ─────────────────────────────────────────── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Enter OTP 🔐</h2>
                <p className="text-gray-500 text-sm mt-0.5">Sent to <strong className="text-gray-800">+91 {phone}</strong></p>
              </div>
              {devOtp && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <span>🔧</span>
                  <span className="text-sm text-amber-800">Dev: <strong className="font-mono tracking-widest">{devOtp}</strong></span>
                </div>
              )}
              <input
                required autoFocus
                type="text" inputMode="numeric" maxLength={6} placeholder="——————"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                className="w-full border-2 border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 rounded-2xl px-5 py-5 text-center text-3xl font-extrabold tracking-[0.5em] outline-none transition text-gray-800"
              />
              <div className="flex justify-center gap-2">
                {[...Array(6)].map((_,i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i < otp.length ? 'bg-red-500 scale-125' : 'bg-gray-200'}`} />
                ))}
              </div>
              {error && <ErrBox msg={error} />}
              <button type="submit" disabled={loading || otp.length < 6}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold py-4 rounded-2xl disabled:opacity-50 shadow-lg shadow-red-200/60 active:scale-[0.98] transition min-h-[52px]">
                {loading ? <Spin label="Verifying…" /> : 'Verify & Continue →'}
              </button>
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                  className="flex items-center gap-1 text-gray-500 font-medium active:opacity-70">
                  <ChevronLeftIcon className="w-4 h-4" /> Change number
                </button>
                <button type="button" onClick={() => handleSendOtp()}
                  className="text-red-600 font-bold active:opacity-70">Resend OTP</button>
              </div>
            </form>
          )}

          {/* ── Profile ─────────────────────────────────────── */}
          {step === 'profile' && (
            <form onSubmit={handleProfile} className="space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Almost There! 🎉</h2>
                <p className="text-gray-500 text-sm mt-0.5">Quick setup to personalise your experience</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Your Name</label>
                <input required autoFocus type="text" placeholder="e.g. Rahul Sharma"
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 rounded-2xl px-4 py-4 outline-none transition text-gray-800 font-medium" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">I&apos;m joining as…</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'user',   emoji: '🛍️', label: 'Customer', desc: 'Looking for vendors' },
                    { value: 'vendor', emoji: '🏪', label: 'Vendor',   desc: 'Offering services' },
                  ].map((o) => (
                    <button key={o.value} type="button" onClick={() => setRole(o.value as 'user' | 'vendor')}
                      className={`relative p-4 border-2 rounded-2xl text-left transition active:scale-[0.97] ${
                        role === o.value ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'
                      }`}>
                      {role === o.value && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                          <CheckIcon className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <span className="text-2xl block mb-1.5">{o.emoji}</span>
                      <p className="text-sm font-extrabold text-gray-900">{o.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{o.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              {error && <ErrBox msg={error} />}
              <button type="submit" disabled={loading || !name.trim()}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold py-4 rounded-2xl disabled:opacity-50 shadow-lg shadow-red-200/60 active:scale-[0.98] transition min-h-[52px]">
                {loading ? <Spin label="Saving…" /> : role === 'vendor' ? 'List My Business →' : 'Start Exploring →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

function ErrBox({ msg }: { msg: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm flex items-center gap-2">
      <WarningIcon className="w-4 h-4 shrink-0" />
      {msg}
    </div>
  );
}

function Spin({ label }: { label: string }) {
  return (
    <span className="flex items-center justify-center gap-2">
      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      {label}
    </span>
  );
}
