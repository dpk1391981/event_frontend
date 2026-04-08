'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import SmartLeadModal from './SmartLeadModal';

const HIDDEN_PREFIXES = ['/admin', '/vendor/dashboard', '/partner', '/auth'];

interface ModalCtx {
  eventType?: string;
  budget?: number;
  guestCount?: number;
  eventDate?: string;
}

function readCtxFromUrl(): ModalCtx {
  if (typeof window === 'undefined') return {};
  const p = new URLSearchParams(window.location.search);
  return {
    eventType:  p.get('eventType') || p.get('from')      || undefined,
    budget:     p.get('budget')    ? Number(p.get('budget'))    : undefined,
    guestCount: p.get('guests')    ? Number(p.get('guests'))    : undefined,
    eventDate:  p.get('date')      || p.get('eventDate') || undefined,
  };
}

export default function GlobalLeadCTA() {
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);
  const [modalCtx,  setModalCtx]  = useState<ModalCtx>({});
  const [visible, setVisible]     = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [hovered, setHovered]     = useState(false);
  const [pulse, setPulse]         = useState(false);

  // Appear after 3s; pulse attention after 8s
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 3000);
    const t2 = setTimeout(() => setPulse(true),   8000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const isHidden = HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p));
  if (isHidden || dismissed) return null;

  return (
    <>
      {/* Floating help button
          Mobile: raised higher to clear browser chrome + safe area
          Web/Desktop: clean bottom-right anchor */}
      <div
        className={[
          'fixed z-[120] flex flex-col items-end gap-2 transition-all duration-500',
          // Mobile: raised above browser chrome (bottom nav bar ~56px)
          'bottom-20 right-4',
          // Desktop: standard bottom-right corner
          'sm:bottom-6 sm:right-6',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none',
        ].join(' ')}
      >
        {/* Tooltip bubble — shown on hover */}
        <div
          className={`flex items-center gap-2.5 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl whitespace-nowrap transition-all duration-200 ${
            hovered ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-1 pointer-events-none'
          }`}
        >
          <span className="text-red-400">💡</span>
          Need help finding vendors?
          {/* Tail */}
          <span className="absolute -bottom-1.5 right-6 w-3 h-3 bg-gray-900 rotate-45" />
        </div>

        {/* FAB row — button + dismiss */}
        <div className="flex items-center gap-2">
          {/* Dismiss × */}
          {hovered && (
            <button
              onClick={() => setDismissed(true)}
              className="w-6 h-6 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full text-xs font-bold flex items-center justify-center transition"
              aria-label="Dismiss"
            >
              ×
            </button>
          )}

          {/* Main FAB */}
          <button
            onClick={() => { setModalCtx(readCtxFromUrl()); setShowModal(true); }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            aria-label="Get help finding vendors"
            className="relative w-14 h-14 bg-gradient-to-br from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-full shadow-2xl shadow-red-300/60 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
          >
            {/* Pulse rings — shown until user interacts */}
            {pulse && !hovered && (
              <>
                <span className="absolute inset-0 rounded-full bg-red-500/40 animate-ping" />
                <span className="absolute inset-[-6px] rounded-full border-2 border-red-400/30 animate-ping" style={{ animationDelay: '0.3s' }} />
              </>
            )}

            {/* Help icon */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>

            {/* Red dot badge */}
            <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full" />
          </button>
        </div>

        {/* Label under button */}
        <p className="text-[10px] font-bold text-gray-500 text-center pr-1">Get Quotes</p>
      </div>

      {showModal && (
        <SmartLeadModal
          mode="multi"
          eventType={modalCtx.eventType}
          budget={modalCtx.budget}
          guestCount={modalCtx.guestCount}
          eventDate={modalCtx.eventDate}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
