'use client';

import { useEffect, useState, useCallback } from 'react';
import { LogoMark } from '@/components/ui/Icon';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface LaunchPageProps {
  launchDateTime: string; // ISO 8601 string from backend
}

function computeTimeLeft(launchDateTimeStr: string): TimeLeft {
  const target = new Date(launchDateTimeStr).getTime();
  const diff = Math.max(0, target - Date.now());

  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, '0');
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        {/* Card */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center shadow-xl">
          <span className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums tracking-tight">
            {display}
          </span>
        </div>
        {/* Divider line */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-black/20 pointer-events-none" />
      </div>
      <span className="text-xs font-semibold text-red-300 uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}

export default function LaunchPage({ launchDateTime }: LaunchPageProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    computeTimeLeft(launchDateTime),
  );
  const [mounted, setMounted] = useState(false);

  const tick = useCallback(() => {
    setTimeLeft(computeTimeLeft(launchDateTime));
  }, [launchDateTime]);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);

  const isExpired =
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-950 via-red-950 to-gray-900 text-white overflow-hidden relative">
      {/* Background dot grid */}
      <div className="hero-pattern absolute inset-0 opacity-40 pointer-events-none" />
      {/* Radial fade */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-950/70 pointer-events-none" />

      {/* Animated orbs */}
      <div className="absolute top-24 left-8 w-96 h-96 bg-red-600/15 rounded-full blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute bottom-24 right-8 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl animate-float-medium pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-center border-b border-white/10 bg-black/20 backdrop-blur-sm py-4 px-6">
        <div className="flex items-center gap-3">
          <LogoMark className="w-9 h-9" />
          <span className="text-xl font-extrabold tracking-tight">PlanToday</span>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-5 py-2 text-sm mb-8 border border-white/15 shadow-xl">
          <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          <span className="font-semibold text-white">Coming Soon</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight mb-4 tracking-tight max-w-3xl">
          We&apos;re Launching
          <br />
          <span className="gradient-text">Very Soon</span>
        </h1>

        <p className="text-gray-300 text-base sm:text-lg mb-12 max-w-lg leading-relaxed">
          India&apos;s smartest event planning platform is almost ready.
          <br className="hidden sm:block" />
          Find the best vendors, get instant quotes, and plan your perfect event.
        </p>

        {/* Countdown */}
        {mounted && !isExpired && (
          <div className="mb-12">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
              Launching in
            </p>
            <div className="flex items-start gap-4 sm:gap-6">
              <CountdownUnit value={timeLeft.days}    label="Days"    />
              <div className="text-3xl font-bold text-white/40 mt-5">:</div>
              <CountdownUnit value={timeLeft.hours}   label="Hours"   />
              <div className="text-3xl font-bold text-white/40 mt-5">:</div>
              <CountdownUnit value={timeLeft.minutes} label="Minutes" />
              <div className="text-3xl font-bold text-white/40 mt-5">:</div>
              <CountdownUnit value={timeLeft.seconds} label="Seconds" />
            </div>
          </div>
        )}

        {mounted && isExpired && (
          <div className="mb-12 flex items-center gap-3 bg-green-500/20 border border-green-400/30 rounded-2xl px-8 py-4">
            <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <p className="text-green-300 font-semibold text-lg">
              We&apos;re live! Loading the app…
            </p>
          </div>
        )}

        {/* Feature teasers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
          {[
            { icon: '🎯', title: 'AI Vendor Matching',  desc: 'Smart recommendations based on your budget & event type.' },
            { icon: '💰', title: 'Free Instant Quotes', desc: 'Get quotes from 2000+ verified vendors in minutes.' },
            { icon: '🗓️', title: 'Complete Event Plans', desc: 'Full budget breakdown & vendor shortlist in 2 minutes.' },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 text-left hover:bg-white/8 transition-colors"
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-bold text-white text-sm mb-1">{f.title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/20 py-5 px-6 text-center">
        <p className="text-gray-500 text-xs">
          &copy; {new Date().getFullYear()} PlanToday &mdash; India&apos;s Event Planning Platform
        </p>
      </footer>
    </div>
  );
}
