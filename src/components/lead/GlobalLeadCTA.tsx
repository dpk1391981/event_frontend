'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import SmartLeadModal from './SmartLeadModal';

const HIDDEN_PREFIXES = ['/admin', '/vendor/dashboard', '/partner', '/auth'];

export default function GlobalLeadCTA() {
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);
  const [visible, setVisible] = useState(false);

  // Show bar after 2s delay on mount — avoids flash on navigation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const isHidden = HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p));

  if (isHidden) return null;

  return (
    <>
      {/* Sticky bottom CTA bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[100] transition-transform duration-500 ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Safe-area padding for mobile notch */}
        <div className="px-3 pb-3 sm:px-6 sm:pb-4" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <div className="max-w-2xl mx-auto bg-gray-900 rounded-2xl shadow-2xl border border-white/10">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4">
              {/* Lightning icon */}
              <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>

              {/* Copy */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-tight">
                  Get best vendors instantly
                </p>
                <p className="text-gray-400 text-xs mt-0.5 hidden sm:block">
                  Tell us your requirement · Free · No spam
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition"
                >
                  Get Quotes
                </button>
                <a
                  href="tel:+919999999999"
                  className="hidden sm:flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-3 py-2.5 rounded-xl transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Help?
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add body padding so content isn't hidden behind bar */}
      <div className="h-20 sm:h-24" />

      {/* Modal rendered at root level — full z-index */}
      {showModal && (
        <SmartLeadModal
          mode="multi"
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
