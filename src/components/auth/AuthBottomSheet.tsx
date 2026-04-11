'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { CheckIcon, ChevronLeftIcon, WarningIcon } from '@/components/ui/Icon';
import type { User } from '@/store/useAppStore';

// ── Step machine (email-first progressive flow) ───────────────────────────────
type Step =
  | 'email'       // always start here — enter email
  | 'password'    // existing account with password
  | 'register'    // new account (positive framing)
  | 'otp-verify'  // enter OTP (auto-sent)
  | 'forgot'      // forgot password
  | 'profile'     // role selection (post-auth)
  | 'preferences'; // user budget/event types

interface EmailStatus {
  exists:      boolean;
  hasPassword: boolean;
  hasGoogle:   boolean;
  name:        string | null;
}

interface AuthConfig {
  otpMode:         'email' | 'sms';
  emailConfigured: boolean;
  googleEnabled:   boolean;
  googleClientId:  string;
  showPhone:       boolean;
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function ErrBox({ msg }: { msg: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-700 text-sm flex items-center gap-2.5">
      <WarningIcon className="w-4 h-4 shrink-0" /> {msg}
    </div>
  );
}
function InfoBox({ msg, icon = '💡' }: { msg: string; icon?: string }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-blue-700 text-sm flex items-center gap-2.5">
      <span className="text-base shrink-0">{icon}</span> {msg}
    </div>
  );
}
function DevBox({ otp }: { otp: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-2.5">
      <span className="text-lg">🔧</span>
      <span className="text-sm text-amber-800">Dev OTP: <strong className="font-mono tracking-widest">{otp}</strong></span>
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

const inputCls = 'w-full border-2 border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 rounded-2xl px-4 py-3.5 outline-none transition-all text-gray-800 font-medium placeholder-gray-300 text-sm';

// ── Google button ─────────────────────────────────────────────────────────────
function GoogleButton({ clientId, onSuccess }: { clientId: string; onSuccess: (c: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!clientId || !ref.current) return;
    const init = () => {
      (window as any).google?.accounts.id.initialize({
        client_id: clientId, callback: (r: { credential: string }) => onSuccess(r.credential), ux_mode: 'popup',
      });
      (window as any).google?.accounts.id.renderButton(ref.current, {
        theme: 'outline', size: 'large', text: 'continue_with', width: ref.current?.offsetWidth || 320,
      });
    };
    if ((window as any).google?.accounts) { init(); return; }
    const el = document.getElementById('gis-script');
    if (!el) {
      const s = document.createElement('script');
      s.id = 'gis-script'; s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
      s.onload = init; document.head.appendChild(s);
    } else { el.addEventListener('load', init); }
  }, [clientId, onSuccess]);
  return <div ref={ref} className="w-full min-h-[44px]" />;
}

// ── Password visibility toggle input ─────────────────────────────────────────
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
        className={`${inputCls} pr-12`}
      />
      <button type="button" tabIndex={-1} onClick={() => setShow(p => !p)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}

// ── Password strength ─────────────────────────────────────────────────────────
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
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i < score ? colors[score-1] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className="text-xs text-gray-400">{labels[score - 1] ?? 'Enter a password'}</p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface AuthBottomSheetProps {
  isOpen?:      boolean;
  onClose?:     () => void;
  initialStep?: 'signin' | 'signup';
}

export default function AuthBottomSheet({
  isOpen: isOpenProp,
  onClose: onCloseProp,
  initialStep: initialStepProp = 'signin',
}: AuthBottomSheetProps) {
  const router = useRouter();
  const { setUser, setToken, authModalOpen, closeAuthModal, authModalIntent } = useAppStore();

  const isOpen  = isOpenProp  ?? authModalOpen;
  const onClose = onCloseProp ?? closeAuthModal;
  const intent  = authModalIntent;

  // signupIntent: true when opened from Register/List Business
  const signupIntent = (intent?.initialStep === 'signup') || (initialStepProp === 'signup');

  const [config,      setConfig]      = useState<AuthConfig | null>(null);
  const [step,        setStep]        = useState<Step>('email');
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [checking,    setChecking]    = useState(false);
  const [error,       setError]       = useState('');
  const [info,        setInfo]        = useState('');

  // Fields
  const [email,      setEmail]      = useState('');
  const [name,       setName]       = useState('');
  const [password,   setPassword]   = useState('');
  const [otp,        setOtp]        = useState('');
  const [devOtp,     setDevOtp]     = useState('');
  const [otpHint,    setOtpHint]    = useState('');

  // Onboarding
  const [role,       setRole]       = useState<'user' | 'vendor'>(intent?.defaultRole ?? 'user');
  const [budget,     setBudget]     = useState('');
  const [eventTypes, setEventTypes] = useState<string[]>([]);

  // Reset on every open
  useEffect(() => {
    if (isOpen) {
      setStep('email');
      setEmailStatus(null);
      setError(''); setInfo(''); setDevOtp(''); setOtpHint('');
      setEmail(''); setName(''); setPassword(''); setOtp('');
      setBudget(''); setEventTypes([]);
      setRole(intent?.defaultRole ?? 'user');
    }
  }, [isOpen]);

  // Load auth config once
  useEffect(() => {
    if (!isOpen || config) return;
    (authApi.getConfig() as unknown as Promise<AuthConfig>)
      .then(setConfig)
      .catch(() => setConfig({ otpMode: 'email', emailConfigured: false, googleEnabled: false, googleClientId: '', showPhone: false }));
  }, [isOpen]);

  const clear = () => { setError(''); setInfo(''); };

  // ── After successful auth ─────────────────────────────────────────────────
  function onAuth(res: { token: string; user: User; isNewUser?: boolean }) {
    setToken(res.token);
    setUser(res.user);
    if (res.isNewUser || !res.user.name) { setStep('profile'); return; }
    finish(res.user);
  }

  function finish(user: User) {
    onClose();
    const dest = intent?.redirectTo;
    if (dest) { router.push(dest); return; }
    if (user.role === 'vendor')                                    router.push('/partner/dashboard');
    else if (user.role === 'admin' || user.role === 'super_admin') router.push('/admin');
    // else stay on page
  }

  // ── Step 1: Check email ───────────────────────────────────────────────────
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault(); clear(); setChecking(true);
    try {
      const status = await authApi.checkEmail(email) as unknown as EmailStatus;
      setEmailStatus(status);
      if (status.exists) {
        if (status.hasPassword) {
          setStep('password');
        } else {
          // OTP/Google-only account — auto-send OTP
          await doSendOtp(email);
        }
      } else {
        // New user — go to register (positive framing)
        setStep('register');
      }
    } catch {
      // Fallback: show password step
      setStep('password');
    } finally { setChecking(false); }
  };

  // ── Send OTP (auto-triggered or manual resend) ────────────────────────────
  const doSendOtp = async (targetEmail: string) => {
    clear(); setLoading(true);
    try {
      const res = await authApi.sendOtp({ email: targetEmail }) as unknown as { message: string; otp?: string };
      if (res.otp) setDevOtp(res.otp);
      setOtpHint(res.message || `Code sent to ${targetEmail}`);
      setStep('otp-verify');
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP. Please try again.');
    } finally { setLoading(false); }
  };

  // ── Sign in with password ─────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault(); clear(); setLoading(true);
    try {
      const res = await authApi.login({ email, password }) as unknown as { token: string; user: User; isNewUser: boolean };
      onAuth(res);
    } catch (err: any) {
      const msg: string = err?.message || '';
      // Route to register if no account found
      if (msg.toLowerCase().includes('no account') || msg.toLowerCase().includes('register first')) {
        setStep('register'); clear(); return;
      }
      // Route to OTP if passwordless account
      if (msg.toLowerCase().includes('otp') || msg.toLowerCase().includes('google sign-in')) {
        await doSendOtp(email); return;
      }
      setError(msg || 'Incorrect password. Please try again.');
    } finally { setLoading(false); }
  };

  // ── Register ──────────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); clear(); setLoading(true);
    try {
      const res = await authApi.register({ name, email, password }) as unknown as { token: string; user: User; isNewUser: boolean; message?: string };
      onAuth(res);
    } catch (err: any) {
      const msg: string = err?.message || '';
      // Account already exists — route to password login
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('sign in')) {
        setEmailStatus(prev => prev ? { ...prev, exists: true, hasPassword: true } : null);
        setStep('password');
        setInfo('Account already exists. Please sign in.');
        clear();
        return;
      }
      setError(msg || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  // ── Google ────────────────────────────────────────────────────────────────
  const handleGoogle = useCallback(async (credential: string) => {
    clear(); setLoading(true);
    try {
      const res = await authApi.googleLogin(credential) as unknown as { token: string; user: User; isNewUser: boolean };
      onAuth(res);
    } catch (err: any) { setError(err?.message || 'Google sign-in failed.'); }
    finally { setLoading(false); }
  }, []);

  // ── Verify OTP ────────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); clear(); setLoading(true);
    try {
      const res = await authApi.verifyOtp({ email }, otp) as unknown as { token: string; user: User; isNewUser: boolean };
      onAuth(res);
    } catch (err: any) { setError(err?.message || 'Invalid OTP. Try again.'); }
    finally { setLoading(false); }
  };

  // ── Forgot password ───────────────────────────────────────────────────────
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault(); clear(); setLoading(true);
    try {
      const res = await authApi.forgotPassword(email) as unknown as { message: string };
      setInfo(res.message || 'Check your email for a reset link.');
    } catch (err: any) { setError(err?.message || 'Failed to send reset email.'); }
    finally { setLoading(false); }
  };

  // ── Profile (role) ────────────────────────────────────────────────────────
  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault(); clear(); setLoading(true);
    try {
      const res = await authApi.updateProfile({ name: name || 'User', role }) as unknown as { user: User };
      setUser(res.user);
      if (role === 'vendor') { onClose(); router.push(intent?.redirectTo || '/partner/onboard'); return; }
      setStep('preferences');
    } catch (err: any) { setError(err?.message || 'Failed to save profile.'); }
    finally { setLoading(false); }
  };

  // ── Preferences ───────────────────────────────────────────────────────────
  const handlePreferences = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await authApi.savePreferences({ budget: budget || undefined, eventTypes: eventTypes.length ? eventTypes : undefined }) as unknown as { user: User };
      setUser(res.user);
    } catch { /* non-critical */ }
    finally { setLoading(false); onClose(); }
  };

  if (!isOpen) return null;

  const googleSection = config?.googleEnabled && config.googleClientId ? (
    <>
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      <GoogleButton clientId={config.googleClientId} onSuccess={handleGoogle} />
    </>
  ) : null;

  // Step header config
  const stepConfig: Record<Step, { title: string; sub: string }> = {
    email:       {
      title: signupIntent ? 'Create your free account' : 'Sign in or Register',
      sub:   signupIntent ? 'Enter your email — we\'ll set everything up' : 'Enter your email to continue',
    },
    password:    {
      title: emailStatus?.name ? `Welcome back, ${emailStatus.name.split(' ')[0]}!` : 'Welcome back!',
      sub:   `Signing in as ${email}`,
    },
    register:    { title: 'Create your account',    sub: `Setting up for ${email}` },
    'otp-verify':{ title: 'Enter your code',        sub: otpHint || `6-digit code sent to ${email}` },
    forgot:      { title: 'Reset your password',    sub: 'We\'ll email you a reset link' },
    profile:     { title: 'One last step! 🎉',       sub: 'Tell us a bit about yourself' },
    preferences: { title: 'Personalise your feed ✨', sub: 'We\'ll show you the most relevant vendors' },
  };
  const { title, sub } = stepConfig[step];

  const canGoBack = ['password', 'register', 'otp-verify', 'forgot'].includes(step);
  const backStep: Record<string, Step> = {
    password: 'email', register: 'email', 'otp-verify': 'email', forgot: 'password',
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[92dvh] flex flex-col overflow-hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              {canGoBack && (
                <button type="button"
                  onClick={() => { setStep(backStep[step] || 'email'); clear(); setDevOtp(''); setOtpHint(''); }}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-600 mb-2 font-medium transition">
                  <ChevronLeftIcon className="w-3.5 h-3.5" /> Back
                </button>
              )}
              <h2 className="text-lg font-extrabold text-gray-900 leading-tight">{title}</h2>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">{sub}</p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 shrink-0 transition">
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {/* ── STEP: email ── */}
          {step === 'email' && (
            <div className="space-y-4">
              {/* Vendor intent banner */}
              {(intent?.defaultRole === 'vendor' || signupIntent && intent?.redirectTo?.includes('onboard')) && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                  <span className="text-2xl shrink-0">🏪</span>
                  <div>
                    <p className="text-sm font-bold text-amber-900">List your business on PlanToday</p>
                    <p className="text-xs text-amber-700 mt-0.5">Create a free vendor account · Get leads instantly</p>
                  </div>
                </div>
              )}
              <form onSubmit={handleCheckEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Email address</label>
                  <div className="relative">
                    <input type="email" required autoFocus inputMode="email"
                      placeholder="you@example.com" value={email}
                      onChange={e => setEmail(e.target.value)}
                      className={inputCls} />
                    {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                        <CheckIcon className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>
                {error && <ErrBox msg={error} />}
                <button type="submit" disabled={checking || !email}
                  className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 text-white font-extrabold py-4 rounded-2xl transition-all min-h-[52px]">
                  {checking
                    ? <Spinner label="Checking…" />
                    : signupIntent ? 'Create Account →' : 'Continue →'}
                </button>
              </form>
              {googleSection}
              <p className="text-center text-xs text-gray-400 pt-1">
                By continuing you agree to our Terms &amp; Privacy Policy
              </p>
            </div>
          )}

          {/* ── STEP: password ── */}
          {step === 'password' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              {/* Email confirmation chip */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <span className="w-4 h-4 text-emerald-500 shrink-0"><CheckIcon className="w-4 h-4" /></span>
                <span className="text-sm text-gray-700 font-medium truncate">{email}</span>
              </div>

              {info && <InfoBox msg={info} />}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-bold text-gray-700">Password</label>
                  <button type="button" onClick={() => { setStep('forgot'); clear(); }}
                    className="text-xs text-red-600 font-medium hover:text-red-700">Forgot?</button>
                </div>
                <PasswordInput value={password} onChange={setPassword} autoFocus />
              </div>

              {error && <ErrBox msg={error} />}

              <button type="submit" disabled={loading || !password}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 text-white font-extrabold py-4 rounded-2xl transition-all min-h-[52px]">
                {loading ? <Spinner label="Signing in…" /> : 'Sign In →'}
              </button>

              {googleSection}

              <div className="space-y-2 border-t border-gray-100 pt-3">
                <button type="button" onClick={() => doSendOtp(email)}
                  className="w-full text-center text-sm text-gray-500 py-1.5 hover:text-red-600 transition">
                  Sign in with OTP instead →
                </button>
                <button type="button" onClick={() => { setStep('register'); clear(); setPassword(''); }}
                  className="w-full text-center text-sm text-gray-500 py-1.5">
                  Don't have an account?{' '}
                  <span className="text-red-600 font-bold">Create one free</span>
                </button>
              </div>
            </form>
          )}

          {/* ── STEP: register ── */}
          {step === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Positive framing */}
              <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
                <span className="text-lg">🎉</span>
                <div>
                  <p className="text-sm font-bold text-emerald-800">New here — welcome!</p>
                  <p className="text-xs text-emerald-600">It's free. No credit card needed.</p>
                </div>
              </div>

              {/* Email chip */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <span className="w-4 h-4 text-emerald-500 shrink-0"><CheckIcon className="w-4 h-4" /></span>
                <span className="text-sm text-gray-700 font-medium truncate">{email}</span>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Your name</label>
                <input type="text" required autoFocus placeholder="e.g. Rahul Sharma"
                  value={name} onChange={e => setName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Create password <span className="font-normal text-gray-400">(min 8 chars)</span>
                </label>
                <PasswordInput value={password} onChange={setPassword} placeholder="Min 8 characters" />
                <PasswordStrength pw={password} />
              </div>

              {error && <ErrBox msg={error} />}

              <button type="submit" disabled={loading || !name || password.length < 8}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 text-white font-extrabold py-4 rounded-2xl transition-all min-h-[52px]">
                {loading ? <Spinner label="Creating account…" /> : 'Create Free Account →'}
              </button>

              {googleSection}

              <div className="border-t border-gray-100 pt-3 space-y-2">
                <button type="button" onClick={() => { setStep('password'); clear(); setName(''); setPassword(''); }}
                  className="w-full text-center text-sm text-gray-500 py-1.5">
                  Already have an account?{' '}
                  <span className="text-red-600 font-bold">Sign in →</span>
                </button>
                <p className="text-center text-xs text-gray-400">
                  By continuing you agree to our Terms &amp; Privacy Policy
                </p>
              </div>
            </form>
          )}

          {/* ── STEP: otp-verify ── */}
          {step === 'otp-verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {devOtp && <DevBox otp={devOtp} />}
              {otpHint && !devOtp && <InfoBox msg={otpHint} icon="✉️" />}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">6-digit code</label>
                <input autoFocus required type="text" inputMode="numeric" maxLength={6}
                  placeholder="· · · · · ·" value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                  className="w-full border-2 border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 rounded-2xl px-5 py-5 text-center text-3xl font-extrabold tracking-[0.6em] outline-none transition-all text-gray-800 min-h-[72px]" />
                <div className="flex justify-center gap-2 mt-3">
                  {[...Array(6)].map((_,i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-all ${i < otp.length ? 'bg-red-500 scale-125' : 'bg-gray-200'}`} />
                  ))}
                </div>
              </div>

              {error && <ErrBox msg={error} />}

              <button type="submit" disabled={loading || otp.length < 6}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 text-white font-extrabold py-4 rounded-2xl transition-all min-h-[52px]">
                {loading ? <Spinner label="Verifying…" /> : 'Verify & Continue →'}
              </button>

              <div className="flex items-center justify-between text-sm pt-1">
                <span className="text-gray-400 text-xs">Didn't receive it?</span>
                <button type="button" onClick={() => { setOtp(''); doSendOtp(email); }}
                  className="text-red-600 font-bold hover:text-red-700 text-xs">Resend code</button>
              </div>
            </form>
          )}

          {/* ── STEP: forgot ── */}
          {step === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <p className="text-sm text-gray-500">
                Enter your email and we'll send a reset link instantly.
              </p>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Email address</label>
                <input type="email" inputMode="email" autoFocus
                  placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)} required className={inputCls} />
              </div>

              {error && <ErrBox msg={error} />}
              {info && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-4 text-emerald-800 text-sm">
                  <p className="font-bold mb-0.5">✅ Check your inbox!</p>
                  <p>{info}</p>
                </div>
              )}

              {!info && (
                <button type="submit" disabled={loading || !email}
                  className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 text-white font-extrabold py-4 rounded-2xl transition-all min-h-[52px]">
                  {loading ? <Spinner label="Sending…" /> : 'Send Reset Link →'}
                </button>
              )}
            </form>
          )}

          {/* ── STEP: profile (role selection) ── */}
          {step === 'profile' && (
            <form onSubmit={handleProfile} className="space-y-4">
              {!name && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Your name</label>
                  <input type="text" placeholder="e.g. Rahul Sharma" autoFocus required
                    value={name} onChange={e => setName(e.target.value)} className={inputCls} />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">I'm joining as…</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'user',   icon: '🛍️', label: 'Customer',  desc: 'Find & book vendors' },
                    { value: 'vendor', icon: '🏪', label: 'Vendor',     desc: 'List my services' },
                  ].map(opt => (
                    <button key={opt.value} type="button" onClick={() => setRole(opt.value as any)}
                      className={`relative p-4 border-2 rounded-2xl text-left transition-all min-h-[88px] ${
                        role === opt.value ? 'border-red-500 bg-red-50 shadow-md shadow-red-100' : 'border-gray-200 hover:border-gray-300 bg-white'
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

              {error && <ErrBox msg={error} />}

              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 text-white font-extrabold py-4 rounded-2xl transition-all min-h-[52px]">
                {loading ? <Spinner label="Saving…" /> :
                  role === 'vendor' ? 'Set Up My Business →' : 'Continue →'}
              </button>
            </form>
          )}

          {/* ── STEP: preferences ── */}
          {step === 'preferences' && (
            <form onSubmit={handlePreferences} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">What's your typical event budget?</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'budget',   label: 'Under ₹50K',    emoji: '💰' },
                    { key: 'standard', label: '₹50K – ₹1.5L',  emoji: '💳' },
                    { key: 'premium',  label: '₹1.5L – ₹5L',   emoji: '✨' },
                    { key: 'luxury',   label: 'Above ₹5L',      emoji: '👑' },
                  ].map(b => (
                    <button key={b.key} type="button" onClick={() => setBudget(b.key)}
                      className={`p-3 border-2 rounded-xl text-left text-sm font-bold transition-all ${
                        budget === b.key ? 'border-red-500 bg-red-50 text-red-800' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}>
                      <span className="mr-1.5">{b.emoji}</span>{b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  What are you planning? <span className="font-normal text-gray-400">(pick all)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Wedding','Birthday','Corporate','Anniversary','Engagement','Reception','Baby Shower','Puja'].map(et => {
                    const active = eventTypes.includes(et);
                    return (
                      <button key={et} type="button"
                        onClick={() => setEventTypes(prev => active ? prev.filter(x => x !== et) : [...prev, et])}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                          active ? 'bg-red-600 border-red-600 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}>
                        {et}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && <ErrBox msg={error} />}

              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 text-white font-extrabold py-4 rounded-2xl transition-all min-h-[52px]">
                {loading ? <Spinner label="Saving…" /> : "Let's go! →"}
              </button>
              <button type="button" onClick={onClose}
                className="w-full text-center text-sm text-gray-400 py-1">Skip for now</button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
