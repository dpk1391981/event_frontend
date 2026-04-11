'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import type { User } from '@/store/useAppStore';

export default function ResetPasswordPage() {
  const router  = useRouter();
  const params  = useSearchParams();
  const token   = params.get('token') || '';
  const { setUser, setToken } = useAppStore();

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);

  if (!token) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-red-50 to-rose-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-500 text-sm mb-6">This reset link is missing or invalid. Please request a new one.</p>
          <Link href="/auth/login" className="block w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold py-3.5 rounded-2xl">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      const res = await authApi.resetPassword(token, password) as unknown as { token: string; user: User; message: string };
      setToken(res.token); setUser(res.user);
      setSuccess(true);
      setTimeout(() => router.push('/'), 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. The link may have expired.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-red-50 to-rose-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full">
        <Link href="/" className="inline-flex items-center gap-2 mb-8 font-black text-2xl tracking-tight text-gray-900">
          Plan<span className="text-red-600">Today</span>
        </Link>

        {success ? (
          <div className="text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-xl font-extrabold text-gray-900 mb-2">Password Updated!</h1>
            <p className="text-gray-500 text-sm">Redirecting you back to PlanToday…</p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Set New Password</h1>
              <p className="text-gray-500 text-sm">Choose a strong password for your account.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} placeholder="Min 8 characters"
                  value={password} onChange={e => setPassword(e.target.value)} minLength={8} required autoFocus
                  className="w-full border-2 border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 rounded-2xl px-4 py-4 outline-none transition-all text-gray-800 font-medium placeholder-gray-300 min-h-[56px] pr-12" />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
              {/* Strength indicator */}
              {password && (
                <div className="flex gap-1 mt-2">
                  {[
                    password.length >= 8,
                    /[A-Z]/.test(password),
                    /[0-9]/.test(password),
                    /[^A-Za-z0-9]/.test(password),
                  ].map((ok, i) => (
                    <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${ok ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password</label>
              <input type={showPw ? 'text' : 'password'} placeholder="Re-enter password"
                value={confirm} onChange={e => setConfirm(e.target.value)} required
                className={`w-full border-2 rounded-2xl px-4 py-4 outline-none transition-all text-gray-800 font-medium placeholder-gray-300 min-h-[56px] ${
                  confirm && confirm !== password ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50'
                }`} />
              {confirm && confirm !== password && (
                <p className="text-xs text-red-500 mt-1.5">Passwords don&apos;t match</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-700 text-sm">{error}</div>
            )}

            <button type="submit"
              disabled={loading || password.length < 8 || password !== confirm}
              className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold py-4 rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-red-200/60 min-h-[56px]">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating…
                </span>
              ) : 'Update Password →'}
            </button>

            <p className="text-center text-sm text-gray-400">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-red-600 font-bold">Sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
