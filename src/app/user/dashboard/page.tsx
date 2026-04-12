'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import UserDashboardShell from '@/components/user-dashboard/UserDashboardShell';

export default function UserDashboardPage() {
  const { user } = useAppStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace('/auth/login?redirect=%2Fuser%2Fdashboard');
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-200" />
          <div className="h-4 w-32 rounded bg-red-100" />
        </div>
      </div>
    );
  }

  return <UserDashboardShell />;
}
