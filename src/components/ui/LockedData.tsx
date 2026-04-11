'use client';

import { useAuth } from '@/hooks/useAuth';

interface LockedDataProps {
  /** The actual sensitive value (phone, email, etc.) */
  value: string;
  type?: 'phone' | 'email' | 'text';
  /** Where to redirect after auth. Defaults to current page. */
  redirectTo?: string;
  /** Variant — 'button' fills full width like a CTA, 'inline' sits in text flow */
  variant?: 'button' | 'inline';
  /** Label shown when locked (button variant only) */
  lockedLabel?: string;
  /** Icon shown when locked */
  icon?: React.ReactNode;
  className?: string;
}

export default function LockedData({
  value,
  type = 'text',
  redirectTo,
  variant = 'button',
  lockedLabel,
  icon,
  className = '',
}: LockedDataProps) {
  const { isLoggedIn, requireAuth } = useAuth();

  // ── Unlocked (logged in) ────────────────────────────────────────────────────
  if (isLoggedIn) {
    if (variant === 'inline') {
      const href = type === 'phone' ? `tel:+91${value.replace(/\D/g, '')}` :
                   type === 'email' ? `mailto:${value}` : undefined;
      return href
        ? <a href={href} className={`font-semibold text-gray-800 hover:text-red-600 transition ${className}`}>{value}</a>
        : <span className={`font-semibold text-gray-800 ${className}`}>{value}</span>;
    }

    // Button variant — full call/email CTA
    if (type === 'phone') {
      const digits = value.replace(/\D/g, '');
      return (
        <a
          href={`tel:+91${digits}`}
          className={`w-full flex items-center justify-center gap-2.5 bg-emerald-50 border-2 border-emerald-200 text-emerald-700 font-bold py-3.5 rounded-2xl hover:bg-emerald-100 hover:border-emerald-300 transition group ${className}`}
        >
          <svg className="w-4 h-4 group-hover:scale-110 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Call +91 {digits.slice(0,5)} {digits.slice(5)}
        </a>
      );
    }
    if (type === 'email') {
      return (
        <a
          href={`mailto:${value}`}
          className={`w-full flex items-center justify-center gap-2.5 bg-blue-50 border-2 border-blue-200 text-blue-700 font-bold py-3.5 rounded-2xl hover:bg-blue-100 transition group ${className}`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {value}
        </a>
      );
    }
    return <span className={`font-semibold text-gray-800 ${className}`}>{value}</span>;
  }

  // ── Locked (guest) ──────────────────────────────────────────────────────────
  const handleClick = () => requireAuth(redirectTo);

  if (variant === 'inline') {
    // Blur the value with a lock icon inline
    const masked = type === 'phone'
      ? `+91 ${value.slice(0,2)}●●●●● ●●●${value.slice(-2)}`
      : type === 'email'
      ? `${value.split('@')[0].slice(0,2)}●●●@${value.split('@')[1] ?? '●●●'}`
      : value.slice(0, 3) + '●●●';

    return (
      <button
        onClick={handleClick}
        title="Login to view"
        className={`inline-flex items-center gap-1.5 group cursor-pointer ${className}`}
      >
        <span className="blur-[3px] select-none text-gray-600 font-medium group-hover:blur-[2px] transition-all">{masked}</span>
        <span className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full group-hover:bg-red-100 transition">
          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Login
        </span>
      </button>
    );
  }

  // Button variant — locked CTA
  const label = lockedLabel ?? (
    type === 'phone' ? 'Login to Call Vendor' :
    type === 'email' ? 'Login to Email Vendor' :
    'Login to View'
  );

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center justify-center gap-2.5 border-2 border-dashed border-gray-200 bg-gray-50 text-gray-500 font-semibold py-3.5 rounded-2xl hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all group ${className}`}
    >
      {icon ?? (
        <svg className="w-4 h-4 group-hover:scale-110 transition-transform shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      )}
      {label}
    </button>
  );
}
