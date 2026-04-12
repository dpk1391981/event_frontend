'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';

export default function OnboardingPage() {
  const { user } = useAppStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace('/auth/login?redirect=%2Fonboarding');
      return;
    }
    // If already completed, redirect away
    if (user.onboardingComplete) {
      router.replace(user.role === 'vendor' ? '/vendor/dashboard' : '/');
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-200" />
          <div className="h-4 w-40 rounded bg-red-100" />
        </div>
      </div>
    );
  }

  if (user.onboardingComplete) return null;

  return <OnboardingFlow />;
}
