'use client';

/**
 * LaunchGate
 *
 * Wraps the entire app. On mount it fetches /api/launch-config, then polls
 * every POLL_INTERVAL ms.  While we do not yet know the launch state we show
 * a minimal full-screen loader so there is no flash of the landing page when
 * the app is already live.  Once isLaunched flips to true the main children
 * are rendered seamlessly — no reload required.
 */

import { useEffect, useRef, useState } from 'react';
import LaunchPage from './LaunchPage';
import type { LaunchConfig } from '@/app/api/launch-config/route';

const POLL_INTERVAL = 30_000; // 30 seconds

type GateState =
  | { status: 'loading' }
  | { status: 'launched' }
  | { status: 'pending'; config: LaunchConfig };

async function fetchLaunchConfig(): Promise<LaunchConfig> {
  const res = await fetch('/api/launch-config', { cache: 'no-store' });
  if (!res.ok) throw new Error('launch-config fetch failed');
  return res.json();
}

export default function LaunchGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>({ status: 'loading' });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = async () => {
    try {
      const config = await fetchLaunchConfig();

      if (config.isLaunched) {
        // Stop polling — we are live
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setState({ status: 'launched' });
      } else {
        setState({ status: 'pending', config });
      }
    } catch {
      // Network hiccup — keep current state, retry on next poll tick
    }
  };

  useEffect(() => {
    // Immediate check on mount
    check();

    // Start polling — interval is cleared once we go live
    intervalRef.current = setInterval(check, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.status === 'loading') {
    // Minimal skeleton — avoids flash of wrong content while we fetch
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Pulse ring */}
          <div className="w-12 h-12 rounded-full border-4 border-red-600/30 border-t-red-600 animate-spin" />
          <p className="text-gray-500 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (state.status === 'pending') {
    return <LaunchPage launchDateTime={state.config.launchDateTime} />;
  }

  // status === 'launched'
  return <>{children}</>;
}
