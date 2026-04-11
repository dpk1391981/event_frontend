'use client';

import { useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore, type AuthModalIntent } from '@/store/useAppStore';

/**
 * Universal auth gate hook.
 *
 * Desktop (≥1024px): navigates to /auth/login?redirect=<dest>
 * Mobile  (<1024px): opens AuthBottomSheet modal
 *
 * Usage:
 *   const { user, isLoggedIn, requireAuth } = useAuth();
 *   <button onClick={() => requireAuth('/partner/onboard', { defaultRole: 'vendor' })}>
 *     List Business
 *   </button>
 */
export function useAuth() {
  const { user, openAuthModal } = useAppStore();
  const router   = useRouter();
  const pathname = usePathname();

  const requireAuth = useCallback((
    redirectTo?: string,
    intent?: Omit<AuthModalIntent, 'redirectTo'>
  ): boolean => {
    if (user) return true;

    const dest = redirectTo ?? pathname;
    // Safe to read window at call time — this always runs from a user interaction
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    if (isMobile) {
      openAuthModal({ ...intent, redirectTo: dest });
    } else {
      const params = new URLSearchParams();
      params.set('redirect', dest);
      if (intent?.defaultRole)  params.set('role',  intent.defaultRole);
      if (intent?.initialStep)  params.set('step',  intent.initialStep);
      router.push(`/auth/login?${params.toString()}`);
    }

    return false;
  }, [user, openAuthModal, router, pathname]);

  return { user, isLoggedIn: !!user, requireAuth };
}
