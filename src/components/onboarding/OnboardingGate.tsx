'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';

const EXEMPT_PATHS = [
  '/onboarding',
  '/auth/',
  '/admin',
  '/api/',
  '/_next',
];

/**
 * OnboardingGate — rendered inside ClientProviders (layout).
 * After login, if onboardingComplete === false, redirects to /onboarding.
 * Runs on every navigation so there's no way to skip it.
 */
export default function OnboardingGate() {
  const { user } = useAppStore();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) return;

    // Skip for admin/super_admin
    if (user.role === 'admin' || user.role === 'super_admin') return;

    // Skip exempt paths
    if (EXEMPT_PATHS.some(p => pathname.startsWith(p))) return;

    // If onboarding not done, redirect
    if (user.onboardingComplete === false) {
      router.replace('/onboarding');
    }
  }, [user, pathname, router]);

  return null; // renders nothing, only side effects
}
