'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MyPanelShell from '@/components/partner/MyPanelShell';
import { getVendorPanelData, type VendorPanelData } from '@/lib/vendor-panel';
import { useAppStore } from '@/store/useAppStore';

export default function VendorDashboardPage() {
  const { user } = useAppStore();
  const router = useRouter();
  const [panelData, setPanelData] = useState<VendorPanelData | null>(null);
  const [loading, setLoading] = useState(true);
  // Wait for Zustand to hydrate from localStorage before checking auth.
  // Without this, the first render always sees user=null and redirects.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!user) {
      // Desktop: navigate to login page with redirect; mobile: use bottom sheet
      if (window.innerWidth >= 1024) {
        router.replace('/auth/login?redirect=%2Fvendor%2Fdashboard');
      } else {
        router.replace('/auth/login?redirect=%2Fvendor%2Fdashboard');
      }
      return;
    }

    getVendorPanelData()
      .then((data) => setPanelData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hydrated, user, router]);

  // Skeleton while waiting for hydration or data
  if (!hydrated || loading || !panelData) {
    return (
      <div className="min-h-screen bg-gray-950 px-4 py-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-4">
          {/* Sidebar placeholder */}
          <div className="flex gap-6">
            <div className="hidden xl:block w-[260px] shrink-0">
              <div className="h-screen rounded-2xl bg-gray-900" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="h-36 rounded-2xl bg-gray-900" />
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-28 rounded-2xl bg-gray-900" />
                ))}
              </div>
              <div className="h-80 rounded-2xl bg-gray-900" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <MyPanelShell data={panelData} />;
}
