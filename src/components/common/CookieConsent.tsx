'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const CONSENT_KEY = 'pt_cookie_consent';

type ConsentState = 'all' | 'essential' | null;

function getStoredConsent(): ConsentState {
  try { return (localStorage.getItem(CONSENT_KEY) as ConsentState) ?? null; }
  catch { return null; }
}

function storeConsent(v: 'all' | 'essential') {
  try { localStorage.setItem(CONSENT_KEY, v); } catch { /* noop */ }
}

export default function CookieConsent() {
  const [visible, setVisible]     = useState(false);
  const [expanded, setExpanded]   = useState(false);
  const [animOut, setAnimOut]     = useState(false);

  // Preferences state (shown in expanded mode)
  const [analyticsOn, setAnalyticsOn] = useState(true);
  const [marketingOn, setMarketingOn] = useState(false);

  useEffect(() => {
    // Only show if user hasn't consented yet
    if (getStoredConsent() !== null) return;
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const dismiss = (type: 'all' | 'essential') => {
    storeConsent(type);
    setAnimOut(true);
    setTimeout(() => setVisible(false), 400);
  };

  const acceptAll = () => dismiss('all');
  const acceptEssential = () => dismiss('essential');
  const savePreferences = () => {
    // If both off — essential only; if analytics on — 'all' (simplified)
    dismiss(analyticsOn ? 'all' : 'essential');
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[110] px-3 pb-3 sm:px-6 sm:pb-4 transition-all duration-400 ${
        animOut ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      }`}
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Top accent */}
          <div className="h-1 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500" />

          <div className="px-5 py-4">
            {!expanded ? (
              /* ── Compact banner ── */
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Icon + text */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-2xl shrink-0 mt-0.5">🍪</span>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">We use cookies</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      We use cookies to personalise content, improve performance, and show relevant vendor suggestions.
                      {' '}<button onClick={() => setExpanded(true)} className="text-red-600 font-semibold hover:underline underline-offset-2">Manage preferences</button>
                      {' '}or read our{' '}
                      <Link href="/privacy" className="text-red-600 font-semibold hover:underline underline-offset-2">Privacy Policy</Link>.
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={acceptEssential}
                    className="flex-1 sm:flex-none text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition whitespace-nowrap"
                  >
                    Essential Only
                  </button>
                  <button
                    onClick={acceptAll}
                    className="flex-1 sm:flex-none text-xs font-bold px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition shadow-md shadow-red-200 whitespace-nowrap"
                  >
                    Accept All
                  </button>
                </div>
              </div>
            ) : (
              /* ── Expanded preferences ── */
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🍪</span>
                    <h3 className="text-sm font-extrabold text-gray-900">Cookie Preferences</h3>
                  </div>
                  <button onClick={() => setExpanded(false)} className="text-gray-400 hover:text-gray-600 p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  {/* Essential — always on */}
                  <CookieToggle
                    title="Essential Cookies"
                    desc="Required for the site to function. Cannot be disabled."
                    checked={true}
                    locked
                    onChange={() => {}}
                  />
                  <CookieToggle
                    title="Analytics Cookies"
                    desc="Help us understand how visitors use the site so we can improve it."
                    checked={analyticsOn}
                    onChange={setAnalyticsOn}
                  />
                  <CookieToggle
                    title="Marketing Cookies"
                    desc="Used to show personalised ads and vendor recommendations across the web."
                    checked={marketingOn}
                    onChange={setMarketingOn}
                  />
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-gray-100 mt-3">
                  <button
                    onClick={acceptEssential}
                    className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                  >
                    Essential Only
                  </button>
                  <button
                    onClick={savePreferences}
                    className="text-xs font-bold px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition shadow-md shadow-red-200"
                  >
                    Save Preferences
                  </button>
                  <button
                    onClick={acceptAll}
                    className="ml-auto text-xs font-bold px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white transition"
                  >
                    Accept All
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CookieToggle({
  title, desc, checked, locked = false, onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  locked?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${locked ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-100'}`}>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-800">{title}</p>
        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <div className="shrink-0 mt-0.5">
        {locked ? (
          <span className="text-[10px] font-bold text-gray-400 bg-gray-200 px-2 py-1 rounded-full">Always on</span>
        ) : (
          <button
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${checked ? 'bg-red-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        )}
      </div>
    </div>
  );
}
