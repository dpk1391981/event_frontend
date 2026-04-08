'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';

/**
 * Placed on the "/" home page.
 * If a city is already selected in the persisted store, redirects to
 * /plan-event-in-{city} so the user lands on their city-specific page.
 */
export default function CityRedirect() {
  const router = useRouter();
  const selectedCity = useAppStore((s) => s.selectedCity);

  useEffect(() => {
    if (selectedCity?.slug) {
      router.replace(`/plan-event-in-${selectedCity.slug}`);
    }
  }, [selectedCity?.slug, router]);

  return null;
}
