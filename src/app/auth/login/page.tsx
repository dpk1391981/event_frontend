'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { LogoMark, CheckIcon, ChevronLeftIcon, WarningIcon } from '@/components/ui/Icon';
import type { User } from '@/store/useAppStore';

// ─── Types ────────────────────────────────────────────────────────────────────
type Step =
  | 'email'       // enter email — always start here
  | 'password'    // existing account with password
  | 'register'    // new account
  | 'otp-send'    // no password / chose OTP
  | 'otp-verify'  // enter OTP
  | 'forgot'      // forgot password
  | 'forgot-sent'
  | 'profile'     // role selection
  | 'preferences';// user event preferences

interface EmailStatus {
  exists:      boolean;
  hasPassword: boolean;
  hasGoogle:   boolean;
  name:        string | null;
}

interface AuthConfig {
  googleEnabled:  boolean;
  googleClientId: string;
  showPhone:      boolean;
}

// ─── Left panel: rotating proof points ────────────────────────────────────────
const PROOF = [
  { quote: 'Found our wedding photographer in 10 minutes. Zero haggling!', author: 'Priya S.', city: 'Noida', role: 'Bride' },
  { quote: 'Got 6 caterer quotes in one afternoon. Saved ₹40,000.', author: 'Rahul V.', city: 'Gurgaon', role: 'Event Host' },
  { quote: 'My venue bookings doubled after listing on PlanToday.', author: 'Sunita K.', city: 'Delhi', role: 'Venue Owner' },
  { quote: 'AI matched us with the perfect decorator in seconds.', author: 'Anjali M.', city: 'Faridabad', role: 'Birthday Mom' },
];

const SERVICES = [
  { icon: '📸', name: 'Photography' }, { icon: '🍽️', name: 'Catering' },
  { icon: '🏛️', name: 'Venues' },     { icon: '🌸', name: 'Decoration' },
  { icon: '🎵', name: 'DJ & Music' },  { icon: '💄', name: 'Makeup' },
  { icon: '🎭', name: 'Entertainment'},{ icon: '🚗', name: 'Transport' },
];

// ─── Small shared UI ──────────────────────────────────────────────────────────
function ErrBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-700 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
      <WarningIcon className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{msg}</span>
    </div>
  );
}
function InfoBox({ msg, icon = '💡' }: { msg: string; icon?: string }) {
  return (
    <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-blue-700 text-sm">
      <span className="text-base shrink-0">{icon}</span> {msg}
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
function PrimaryBtn({ loading, disabled = false, children }: { loading: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={loading || disabled}
      className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold py-4 rounded-2xl transition-all disabled:opacity-50 text-base shadow-lg shadow-red-200/60 active:scale-[0.98] min-h-[56px] flex items-center justify-center">
      {children}
    </button>
  );
}
function PasswordInput({ value, onChange, placeholder = 'Your password', autoFocus = false }: {
  value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        autoFocus={autoFocus} required
        type={show ? 'text' : 'password'} placeholder={placeholder}
        value={value} onChange={e => onChange(e.target.value)}
        className="w-full border-2 border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 rounded-2xl px-4 py-4 outline-none transition-all text-gray-800 font-medium placeholder-gray-300 min-h-[56px] pr-12"
      />
      <button type="button" tabIndex={-1} onClick={() => setShow(p => !p)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}

// ─── Google button ────────────────────────────────────────────────────────────
function GoogleBtn({ clientId, onSuccess }: { clientId: string; onSuccess: (c: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!clientId || !ref.current) return;
    const init = () => {
      (window as any).google?.accounts.id.initialize({
        client_id: clientId, callback: (r: any) => onSuccess(r.credential), ux_mode: 'popup',
      });
      (window as any).google?.accounts.id.renderButton(ref.current, {
        theme: 'outline', size: 'large', text: 'continue_with', width: ref.current?.offsetWidth || 400,
      });
    };
    if ((window as any).google?.accounts) { init(); return; }
    const el = document.getElementById('gis-script');
    if (!el) {
      const s = document.createElement('script');
      s.id = 'gis-script'; s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
      s.onload = init; document.head.appendChild(s);
    } else el.addEventListener('load', init);
  }, [clientId, onSuccess]);
  return <div ref={ref} className="w-full min-h-[44px]" />;
}

// ─── Password strength ─────────────────────────────────────────────────────────
function PasswordStrength({ pw }: { pw: string }) {
  if (!pw) return null;
  const checks = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)];
  const score = checks.filter(Boolean).length;
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0,1,2,3].map(i => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i < score ? colors[score-1] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className="text-xs text-gray-400">{labels[score - 1] ?? 'Enter a password'}</p>
    </div>
  );
}

// ─── Inner page content (needs useSearchParams, so wrapped in Suspense) ───────
function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser, setToken, user } = useAppStore();

  const redirectTo   = params.get('redirect') || '/';
  const defaultRole  = (params.get('role') as 'user' | 'vendor') || 'user';
  const defaultStep: Step = 'email'; // always start at email — progressive detection
  const signupIntent = params.get('step') === 'signup'; // show "create account" framing

  // ── Already logged in → redirect away from auth pages ─────────────────────
  useEffect(() => {
    if (user) {
      // Avoid redirect loops: if redirectTo is /auth/login, go to home instead
      const safe = redirectTo.startsWith('/auth') ? '/' : redirectTo;
      router.replace(safe);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const [config,      setConfig]      = useState<AuthConfig>({ googleEnabled: false, googleClientId: '', showPhone: false });
  const [step,        setStep]        = useState<Step>(defaultStep as Step);
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [checking,    setChecking]    = useState(false); // for checkEmail
  const [error,       setError]       = useState('');
  const [info,        setInfo]        = useState('');
  const [proofIdx,    setProofIdx]    = useState(0);

  // Fields
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [name,       setName]       = useState('');
  const [otp,        setOtp]        = useState('');
  const [devOtp,     setDevOtp]     = useState('');
  const [otpHint,    setOtpHint]    = useState('');
  const [role,       setRole]       = useState<'user' | 'vendor'>(defaultRole);
  const [budget,     setBudget]     = useState('');
  const [eventTypes, setEventTypes] = useState<string[]>([]);

  // Rotate proof quotes every 4s
  useEffect(() => {
    const t = setInterval(() => setProofIdx(i => (i + 1) % PROOF.length), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (authApi.getConfig() as unknown as Promise<AuthConfig>)
      .then(setConfig).catch(() => {});
  }, []);

  // Auto-send OTP when arriving at otp-send step (passwordless / OTP-only accounts)
  // Uses a ref to prevent double-fire in React strict mode
  const otpAutoSentRef = useRef(false);
  useEffect(() => {
    if (step === 'otp-send' && email && !otpAutoSentRef.current) {
      otpAutoSentRef.current = true;
      handleSendOtp();
    }
    if (step !== 'otp-send') otpAutoSentRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const clear = () => { setError(''); setInfo(''); };

  // ── After auth ──────────────────────────────────────────────────────────────
  function onAuth(res: { token: string; user: User; isNewUser?: boolean; message?: string }) {
    setToken(res.token); setUser(res.user);
    if (res.message) setInfo(res.message);
    if (res.isNewUser || !res.user.name) { setStep('profile'); return; }
    router.push(redirectTo);
  }

  // ── Step 1: Check email ────────────────────────────────────────────────────
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault(); clear(); setChecking(true);
    try {
      const status = await authApi.checkEmail(email) as unknown as EmailStatus;
      setEmailStatus(status);
      if (status.exists) {
        if (status.hasPassword) {
          setStep('password');
        } else if (status.hasGoogle && !status.hasPassword) {
          // Google-only account — offer OTP or Google
          setStep('otp-send');
          setInfo('This account was created with Google. Sign in with Google or use a one-time code.');
        } else {
          // OTP-only account — auto-send OTP directly, skip otp-send step
          setStep('otp-send');
          setInfo(`We'll send a sign-in code to ${email}`);
        }
      } else {
        // New user — smoothly transition to registration (positive framing)
        setStep('register');
      }
    } catch {
      // On network error, show password step as fallback
      setStep('password');
    } finally { setChecking(false); }
  };

  // ── Sign in with password ──────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault(); clear(); setLoading(true);
    try { onAuth(await authApi.login({ email, password }) as any); }
    catch (err: any) {
      const msg: string = err?.message || '';
      // If account not found → route to register instead of showing cryptic error
      if (msg.toLowerCase().includes('no account') || msg.toLowerCase().includes('register first')) {
        setStep('register');
        return;
      }
      // OTP-only account — route to OTP flow
      if (msg.toLowerCase().includes('otp') || msg.toLowerCase().includes('google sign-in')) {
        setStep('otp-send');
        setInfo(msg);
        return;
      }
      setError(msg || 'Incorrect password. Please try again.');
    }
    finally { setLoading(false); }
  };

  // ── Register ───────────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); clear(); setLoading(true);
    try { onAuth(await authApi.register({ name, email, password }) as any); }
    catch (err: any) { setError(err?.message || 'Registration failed. Please try again.'); }
    finally { setLoading(false); }
  };

  // ── Google ─────────────────────────────────────────────────────────────────
  const handleGoogle = useCallback(async (credential: string) => {
    clear(); setLoading(true);
    try { onAuth(await authApi.googleLogin(credential) as any); }
    catch (err: any) { setError(err?.message || 'Google sign-in failed.'); }
    finally { setLoading(false); }
  }, []);

  // ── Forgot password ────────────────────────────────────────────────────────
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault(); clear(); setLoading(true);
    try {
      const res = await authApi.forgotPassword(email) as any;
      setInfo(res.message || 'Check your email for a reset link.');
      setStep('forgot-sent');
    } catch (err: any) { setError(err?.message || 'Failed. Please try again.'); }
    finally { setLoading(false); }
  };

  // ── Send OTP ───────────────────────────────────────────────────────────────
  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault(); clear(); setLoading(true);
    try {
      const res = await authApi.sendOtp({ email }) as any;
      if (res.otp) setDevOtp(res.otp);
      setOtpHint(res.message || '');
      setStep('otp-verify');
    } catch (err: any) { setError(err?.message || 'Failed to send OTP.'); }
    finally { setLoading(false); }
  };

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); clear(); setLoading(true);
    try { onAuth(await authApi.verifyOtp({ email }, otp) as any); }
    catch (err: any) { setError(err?.message || 'Invalid OTP. Try again.'); }
    finally { setLoading(false); }
  };

  // ── Profile (role) ─────────────────────────────────────────────────────────
  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault(); clear(); setLoading(true);
    try {
      const res = await authApi.updateProfile({ name: name || 'User', role }) as any;
      setUser(res.user);
      if (role === 'vendor') { router.push('/partner/onboard'); return; }
      setStep('preferences');
    } catch (err: any) { setError(err?.message || 'Failed to save profile.'); }
    finally { setLoading(false); }
  };

  // ── Preferences ────────────────────────────────────────────────────────────
  const handlePreferences = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await authApi.savePreferences({ budget: budget || undefined, eventTypes: eventTypes.length ? eventTypes : undefined }) as any;
      setUser(res.user);
    } catch { /* non-critical */ }
    finally { setLoading(false); router.push(redirectTo); }
  };

  const googleSection = config.googleEnabled && config.googleClientId ? (
    <>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      <GoogleBtn clientId={config.googleClientId} onSuccess={handleGoogle} />
    </>
  ) : null;

  // Vendor intent banner
  const showVendorBanner = defaultRole === 'vendor' && (step === 'email' || step === 'register');

  return (
    <div className="min-h-[100dvh] bg-white flex overflow-hidden">

      {/* ── Left: Brand Panel ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] min-h-screen flex-col relative overflow-hidden bg-gradient-to-br from-gray-950 via-red-950 to-rose-950 text-white">
        {/* Background texture */}
        <div className="absolute inset-0 hero-pattern opacity-20" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-red-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/15 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

        {/* Logo */}
        <div className="relative px-10 pt-10 shrink-0">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <LogoMark className="w-7 h-7" />
            </div>
            <div>
              <span className="font-black text-2xl tracking-tight">Plan<span className="text-red-400">Today</span></span>
              <p className="text-[10px] text-white/50 font-medium tracking-widest uppercase">India's #1 Event Platform</p>
            </div>
          </Link>
        </div>

        {/* Main copy */}
        <div className="relative flex-1 flex flex-col justify-center px-10 py-8">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs font-semibold text-white/80 mb-4">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              2,000+ vendors active now
            </div>
            <h2 className="text-3xl xl:text-4xl font-black leading-tight mb-4">
              Find the perfect event vendor.
              <br /><span className="text-red-400">In minutes, not days.</span>
            </h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              India's smartest event vendor marketplace. AI-powered matching, instant quotes, verified portfolios — across Delhi NCR.
            </p>
          </div>

          {/* Service grid */}
          <div className="grid grid-cols-4 gap-2 mb-8">
            {SERVICES.map(s => (
              <div key={s.name} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center hover:bg-white/10 transition">
                <div className="text-xl mb-1">{s.icon}</div>
                <p className="text-[10px] text-white/60 font-medium leading-tight">{s.name}</p>
              </div>
            ))}
          </div>

          {/* Rotating testimonial */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 relative overflow-hidden">
            <div className="text-3xl text-red-400/40 font-serif absolute top-3 left-4 leading-none">"</div>
            <p className="text-sm text-white/80 leading-relaxed mb-3 pl-5">
              {PROOF[proofIdx].quote}
            </p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-400 to-rose-600 flex items-center justify-center text-xs font-extrabold">
                {PROOF[proofIdx].author[0]}
              </div>
              <div>
                <p className="text-xs font-bold text-white">{PROOF[proofIdx].author}</p>
                <p className="text-[10px] text-white/50">{PROOF[proofIdx].role} · {PROOF[proofIdx].city}</p>
              </div>
              <div className="ml-auto flex gap-0.5">
                {PROOF.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === proofIdx ? 'bg-red-400 w-4' : 'bg-white/20'}`} />
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { v: '2,000+', l: 'Verified Vendors' },
              { v: '50,000+', l: 'Happy Events' },
              { v: '4.8 ★', l: 'Avg Rating' },
            ].map(s => (
              <div key={s.l} className="text-center bg-white/5 rounded-xl py-3 border border-white/10">
                <p className="font-extrabold text-white text-lg xl:text-xl">{s.v}</p>
                <p className="text-[10px] text-white/50 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cities footer */}
        <div className="relative px-10 pb-8 shrink-0">
          <p className="text-[10px] text-white/30 font-medium mb-2 tracking-widest uppercase">Available in</p>
          <div className="flex flex-wrap gap-1.5">
            {['Delhi', 'Noida', 'Gurgaon', 'Greater Noida', 'Ghaziabad', 'Faridabad'].map(c => (
              <span key={c} className="text-[10px] bg-white/10 border border-white/15 rounded-full px-2.5 py-1 text-white/60 font-medium">{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Auth Form ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:items-center lg:justify-center bg-white overflow-y-auto">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-5 pt-8 pb-4 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="w-7 h-7" />
            <span className="font-black text-lg">Plan<span className="text-red-600">Today</span></span>
          </Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← Home</Link>
        </div>

        <div className="w-full lg:max-w-[420px] px-5 lg:px-0 py-8 flex flex-col gap-0">

          {/* Vendor intent context banner */}
          {showVendorBanner && (
            <div className="mb-5 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <span className="text-2xl shrink-0">🏪</span>
              <div>
                <p className="text-sm font-bold text-amber-900">List your business on PlanToday</p>
                <p className="text-xs text-amber-700 mt-0.5">Create a free vendor account to start getting leads</p>
              </div>
            </div>
          )}

          {/* ── STEP: email ─────────────────────────────────────────────────── */}
          {step === 'email' && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-gray-900">
                  {signupIntent ? 'Create your free account' : 'Welcome to PlanToday'}
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  {signupIntent
                    ? 'Enter your email — we\'ll set everything up'
                    : 'Enter your email to sign in or register'}
                </p>
              </div>

              <form onSubmit={handleCheckEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email address</label>
                  <div className="relative">
                    <input type="email" required autoFocus inputMode="email"
                      placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full border-2 border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 rounded-2xl px-4 py-4 outline-none transition-all text-gray-800 font-medium placeholder-gray-300 min-h-[56px]" />
                    {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                        <CheckIcon className="w-5 h-5" />
                      </span>
                    )}
                  </div>
                </div>
                {error && <ErrBox msg={error} />}
                <PrimaryBtn loading={checking} disabled={!email}>
                  {checking ? <Spinner label="Checking…" /> : 'Continue →'}
                </PrimaryBtn>
              </form>

              {googleSection && (
                <div className="mt-4 space-y-3">
                  {googleSection}
                </div>
              )}

              <p className="text-center text-xs text-gray-400 mt-5">
                By continuing you agree to our{' '}
                <Link href="/terms" className="text-red-600 font-medium">Terms</Link> &amp;{' '}
                <Link href="/privacy" className="text-red-600 font-medium">Privacy Policy</Link>
              </p>
            </div>
          )}

          {/* ── STEP: password (existing account) ──────────────────────────── */}
          {step === 'password' && (
            <div>
              <button type="button" onClick={() => { setStep('email'); clear(); }}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-600 font-medium mb-5 transition">
                <ChevronLeftIcon className="w-4 h-4" /> Change email
              </button>
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-gray-900">
                  {emailStatus?.name ? `Welcome back, ${emailStatus.name.split(' ')[0]}!` : 'Welcome back!'}
                </h1>
                <p className="text-gray-400 text-sm mt-1 flex items-center gap-1.5">
                  <span className="w-5 h-5 bg-emerald-100 rounded-full text-emerald-600 flex items-center justify-center">
                    <CheckIcon className="w-3 h-3" />
                  </span>
                  Signing in as <strong className="text-gray-700 font-semibold">{email}</strong>
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-gray-700">Password</label>
                    <button type="button" onClick={() => { setStep('forgot'); clear(); }}
                      className="text-xs text-red-600 font-medium hover:text-red-700">Forgot?</button>
                  </div>
                  <PasswordInput value={password} onChange={setPassword} autoFocus />
                </div>
                {error && <ErrBox msg={error} />}
                <PrimaryBtn loading={loading} disabled={!password}>
                  {loading ? <Spinner label="Signing in…" /> : 'Sign In →'}
                </PrimaryBtn>
              </form>

              <div className="mt-4 space-y-3">
                {googleSection}
                <button type="button" onClick={() => { setStep('otp-send'); clear(); }}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm text-gray-500 hover:text-red-600 font-medium transition">
                  Sign in with OTP instead →
                </button>
                <div className="border-t border-gray-100 pt-3 text-center">
                  <button type="button" onClick={() => { setStep('register'); clear(); setPassword(''); }}
                    className="text-sm text-gray-500">
                    Don't have an account?{' '}
                    <span className="text-red-600 font-bold">Create one free →</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP: register (new account) ────────────────────────────────── */}
          {step === 'register' && (
            <div>
              <button type="button" onClick={() => { setStep('email'); clear(); }}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-600 font-medium mb-5 transition">
                <ChevronLeftIcon className="w-4 h-4" /> Change email
              </button>
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
                  🎉 New here — let's get you set up, it's free!
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900">Create your account</h1>
                <p className="text-gray-400 text-sm mt-1">
                  Setting up for <strong className="text-gray-700 font-semibold">{email}</strong>
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Your name</label>
                  <input type="text" required autoFocus placeholder="e.g. Rahul Sharma"
                    value={name} onChange={e => setName(e.target.value)}
                    className="w-full border-2 border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 rounded-2xl px-4 py-4 outline-none transition-all text-gray-800 font-medium placeholder-gray-300 min-h-[56px]" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Create password</label>
                  <PasswordInput value={password} onChange={setPassword} placeholder="Min 8 characters" />
                  <PasswordStrength pw={password} />
                </div>
                {error && <ErrBox msg={error} />}
                <PrimaryBtn loading={loading} disabled={!name || password.length < 8}>
                  {loading ? <Spinner label="Creating account…" /> : 'Create Account →'}
                </PrimaryBtn>
              </form>

              <div className="mt-4 space-y-3">
                {googleSection}
              </div>
              <div className="mt-4 space-y-2">
                <div className="border-t border-gray-100 pt-3 text-center">
                  <button type="button" onClick={() => { setStep('password'); clear(); setName(''); setPassword(''); }}
                    className="text-sm text-gray-500">
                    Already have an account?{' '}
                    <span className="text-red-600 font-bold">Sign in →</span>
                  </button>
                </div>
                <p className="text-center text-xs text-gray-400">
                  By continuing you agree to our Terms &amp; Privacy Policy
                </p>
              </div>
            </div>
          )}

          {/* ── STEP: otp-send (auto-sends, shows spinner then routes to otp-verify) ── */}
          {step === 'otp-send' && (
            <div>
              <button type="button" onClick={() => { setStep('email'); clear(); setInfo(''); }}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-600 font-medium mb-5 transition">
                <ChevronLeftIcon className="w-4 h-4" /> Change email
              </button>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Sending your code…</h1>
              <p className="text-gray-400 text-sm mb-6">
                Sending a 6-digit sign-in code to{' '}
                <strong className="text-gray-700">{email}</strong>
              </p>

              {info && <div className="mb-4"><InfoBox msg={info} icon={emailStatus?.hasGoogle ? '🌐' : '💬'} /></div>}
              {error && <div className="mb-4"><ErrBox msg={error} /></div>}

              {/* Loading state */}
              {loading && (
                <div className="flex items-center justify-center gap-3 py-6 text-gray-500">
                  <span className="w-5 h-5 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
                  <span className="text-sm font-medium">Sending OTP…</span>
                </div>
              )}

              {/* Retry button (shown on error) */}
              {error && (
                <form onSubmit={handleSendOtp} className="space-y-3 mt-2">
                  <PrimaryBtn loading={loading}>
                    {loading ? <Spinner label="Sending OTP…" /> : 'Retry — Send OTP →'}
                  </PrimaryBtn>
                </form>
              )}

              {googleSection && <div className="mt-4 space-y-3">{googleSection}</div>}
            </div>
          )}

          {/* ── STEP: otp-verify ────────────────────────────────────────────── */}
          {step === 'otp-verify' && (
            <div>
              <button type="button" onClick={() => { setStep('otp-send'); setOtp(''); setDevOtp(''); clear(); }}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-600 font-medium mb-5 transition">
                <ChevronLeftIcon className="w-4 h-4" /> Resend / change email
              </button>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Enter OTP</h1>
              <p className="text-gray-400 text-sm mb-6">{otpHint || `6-digit code sent to ${email}`}</p>

              {devOtp && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-2.5 mb-4">
                  <span className="text-lg">🔧</span>
                  <span className="text-sm text-amber-800">Dev OTP: <strong className="font-mono tracking-widest">{devOtp}</strong></span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <input autoFocus required type="text" inputMode="numeric" maxLength={6} placeholder="· · · · · ·"
                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                    className="w-full border-2 border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 rounded-2xl px-5 py-5 text-center text-3xl font-extrabold tracking-[0.6em] outline-none transition-all text-gray-800 min-h-[72px]" />
                  <div className="flex justify-center gap-2 mt-3">
                    {[...Array(6)].map((_,i) => (
                      <div key={i} className={`w-2 h-2 rounded-full transition-all ${i < otp.length ? 'bg-red-500 scale-125' : 'bg-gray-200'}`} />
                    ))}
                  </div>
                </div>
                {error && <ErrBox msg={error} />}
                <PrimaryBtn loading={loading} disabled={otp.length < 6}>
                  {loading ? <Spinner label="Verifying…" /> : 'Verify & Continue →'}
                </PrimaryBtn>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Didn't receive it?</span>
                  <button type="button" onClick={() => handleSendOtp()}
                    className="text-red-600 font-bold hover:text-red-700">Resend OTP</button>
                </div>
              </form>
            </div>
          )}

          {/* ── STEP: forgot ────────────────────────────────────────────────── */}
          {step === 'forgot' && (
            <div>
              <button type="button" onClick={() => { setStep('password'); clear(); }}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-600 font-medium mb-5 transition">
                <ChevronLeftIcon className="w-4 h-4" /> Back to sign in
              </button>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Reset your password</h1>
              <p className="text-gray-400 text-sm mb-6">We'll email you a reset link for <strong className="text-gray-700">{email}</strong></p>

              <form onSubmit={handleForgot} className="space-y-4">
                {!email && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email address</label>
                    <input type="email" required autoFocus placeholder="you@example.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full border-2 border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 rounded-2xl px-4 py-4 outline-none transition-all text-gray-800 font-medium placeholder-gray-300 min-h-[56px]" />
                  </div>
                )}
                {error && <ErrBox msg={error} />}
                <PrimaryBtn loading={loading} disabled={!email}>
                  {loading ? <Spinner label="Sending…" /> : 'Send Reset Link →'}
                </PrimaryBtn>
              </form>
            </div>
          )}

          {/* ── STEP: forgot-sent ───────────────────────────────────────────── */}
          {step === 'forgot-sent' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-5 text-4xl">📬</div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Check your inbox!</h1>
              <p className="text-gray-500 text-sm mb-6">{info || 'If an account exists, you will receive a reset link shortly.'}</p>
              <button type="button" onClick={() => { setStep('email'); clear(); }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-4 rounded-2xl transition min-h-[56px]">
                Back to Sign In
              </button>
            </div>
          )}

          {/* ── STEP: profile (onboarding — role) ──────────────────────────── */}
          {step === 'profile' && (
            <div>
              <div className="mb-6">
                <div className="text-4xl mb-3">🎉</div>
                <h1 className="text-2xl font-extrabold text-gray-900 mb-1">You're almost in!</h1>
                <p className="text-gray-400 text-sm">How will you use PlanToday?</p>
              </div>
              <form onSubmit={handleProfile} className="space-y-4">
                {!name && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Your name</label>
                    <input type="text" required autoFocus placeholder="e.g. Rahul Sharma"
                      value={name} onChange={e => setName(e.target.value)}
                      className="w-full border-2 border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 rounded-2xl px-4 py-4 outline-none transition-all text-gray-800 font-medium placeholder-gray-300 min-h-[56px]" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { v: 'user',   icon: '🛍️', label: 'Customer',   desc: 'Find & book vendors' },
                    { v: 'vendor', icon: '🏪', label: 'Vendor',      desc: 'List my services' },
                  ].map(opt => (
                    <button key={opt.v} type="button" onClick={() => setRole(opt.v as any)}
                      className={`relative p-4 border-2 rounded-2xl text-left transition-all min-h-[100px] ${role === opt.v ? 'border-red-500 bg-red-50 shadow-md shadow-red-100' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                      {role === opt.v && (
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
                {error && <ErrBox msg={error} />}
                <PrimaryBtn loading={loading}>
                  {loading ? <Spinner label="Saving…" /> :
                    role === 'vendor' ? 'Set Up My Business →' : 'Continue →'}
                </PrimaryBtn>
              </form>
            </div>
          )}

          {/* ── STEP: preferences (user only) ───────────────────────────────── */}
          {step === 'preferences' && (
            <div>
              <div className="mb-6">
                <div className="text-4xl mb-3">✨</div>
                <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Personalise your feed</h1>
                <p className="text-gray-400 text-sm">Help us show you the most relevant vendors</p>
              </div>
              <form onSubmit={handlePreferences} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">What's your event budget?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { k: 'budget',   l: 'Under ₹50K',   e: '💰' },
                      { k: 'standard', l: '₹50K – ₹1.5L', e: '💳' },
                      { k: 'premium',  l: '₹1.5L – ₹5L',  e: '✨' },
                      { k: 'luxury',   l: 'Above ₹5L',     e: '👑' },
                    ].map(b => (
                      <button key={b.k} type="button" onClick={() => setBudget(b.k)}
                        className={`p-3 border-2 rounded-xl text-left text-sm font-bold transition-all ${budget === b.k ? 'border-red-500 bg-red-50 text-red-800' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                        <span className="mr-1">{b.e}</span>{b.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    What are you planning? <span className="text-gray-400 font-normal">(pick all that apply)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Wedding','Birthday','Corporate','Anniversary','Engagement','Reception','Baby Shower','Puja'].map(et => {
                      const active = eventTypes.includes(et);
                      return (
                        <button key={et} type="button"
                          onClick={() => setEventTypes(p => active ? p.filter(x => x !== et) : [...p, et])}
                          className={`px-3.5 py-2 rounded-full text-sm font-medium border-2 transition-all ${active ? 'bg-red-600 border-red-600 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                          {et}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <PrimaryBtn loading={loading}>
                  {loading ? <Spinner label="Saving…" /> : 'Start Exploring →'}
                </PrimaryBtn>
                <button type="button" onClick={() => router.push(redirectTo)}
                  className="w-full text-center text-sm text-gray-400 py-1">Skip for now</button>
              </form>
            </div>
          )}

          {/* Back to site — desktop */}
          {['email', 'register'].includes(step) && (
            <div className="hidden lg:block mt-6 text-center">
              <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-red-600 transition font-medium">
                <ChevronLeftIcon className="w-4 h-4" /> Back to PlanToday
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
