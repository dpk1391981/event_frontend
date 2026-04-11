'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import type { User } from '@/store/useAppStore';

type State = 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const router       = useRouter();
  const params       = useSearchParams();
  const { setUser, setToken } = useAppStore();

  const [state, setState] = useState<State>('loading');
  const [msg,   setMsg]   = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setState('error'); setMsg('Missing verification token. Please use the link from your email.'); return; }

    (authApi.verifyEmail(token) as unknown as Promise<{ token: string; user: User; message: string }>)
      .then(res => {
        setToken(res.token); setUser(res.user);
        setMsg(res.message || 'Email verified successfully!');
        setState('success');
        setTimeout(() => router.push('/'), 2500);
      })
      .catch((err: any) => {
        setMsg(err?.message || 'Invalid or expired verification link. Please request a new one.');
        setState('error');
      });
  }, []);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-red-50 to-rose-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-8 font-black text-2xl tracking-tight text-gray-900">
          Plan<span className="text-red-600">Today</span>
        </Link>

        {state === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-6" />
            <h1 className="text-xl font-extrabold text-gray-900 mb-2">Verifying your email…</h1>
            <p className="text-gray-500 text-sm">Please wait a moment.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✅</div>
            <h1 className="text-xl font-extrabold text-gray-900 mb-2">Email Verified!</h1>
            <p className="text-gray-500 text-sm mb-6">{msg}</p>
            <p className="text-xs text-gray-400">Redirecting you to PlanToday…</p>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">❌</div>
            <h1 className="text-xl font-extrabold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-500 text-sm mb-6">{msg}</p>
            <div className="space-y-3">
              <Link href="/auth/login"
                className="block w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold py-3.5 rounded-2xl">
                Back to Sign In
              </Link>
              <p className="text-xs text-gray-400">
                Need a new link?{' '}
                <button className="text-red-600 font-medium">Resend verification email</button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
