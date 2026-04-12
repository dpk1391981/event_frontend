'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import SearchModal from './SearchModal';

interface Props {
  compact?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function GlobalSearch({ compact = false, placeholder, autoFocus }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Only render portal after hydration
  useEffect(() => { setMounted(true); }, []);

  const openModal = useCallback(() => {
    inputRef.current?.blur();
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  // Portal: renders modal at document.body — outside any button nesting
  const modal = mounted && modalOpen
    ? createPortal(
        <SearchModal onClose={closeModal} />,
        document.body
      )
    : null;

  /* ── Full hero search (non-compact) ────────────────────────────────── */
  if (!compact) {
    return (
      <>
        <div className="relative w-full max-w-3xl mx-auto">
          <div
            className="flex items-center bg-white rounded-2xl overflow-hidden shadow-xl shadow-black/20 h-14 sm:h-16 cursor-pointer hover:shadow-2xl hover:shadow-red-500/20 transition-shadow"
            onClick={openModal}
          >
            <div className="pl-5 shrink-0 text-gray-400">
              <SearchSVG className="w-5 h-5" />
            </div>
            <input
              ref={inputRef}
              type="text"
              readOnly
              autoFocus={autoFocus}
              onFocus={openModal}
              placeholder={placeholder || 'Search photographers, caterers, venues…'}
              className="flex-1 px-3 py-4 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm sm:text-base font-medium cursor-pointer"
            />
            <div className="w-px h-8 bg-gray-200 hidden sm:block" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openModal(); }}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold px-6 h-full transition shrink-0 flex items-center gap-2 text-sm"
            >
              <span className="hidden sm:inline">Search</span>
              <SearchSVG className="w-4 h-4" />
            </button>
          </div>
        </div>
        {modal}
      </>
    );
  }

  /* ── Compact header mode ─────────────────────────────────────────── */
  return (
    <>
      {/* Desktop compact search bar */}
      <div
        className="relative flex-1 max-w-xl hidden md:flex cursor-pointer"
        onClick={openModal}
      >
        <div className="flex items-center bg-gray-100 hover:bg-gray-50 border border-gray-200 hover:border-red-300 rounded-full transition-all h-10 w-full">
          <div className="pl-3.5 text-gray-400 shrink-0">
            <SearchSVG className="w-4 h-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            readOnly
            onFocus={openModal}
            placeholder={placeholder || 'Search vendors, packages…'}
            className="flex-1 bg-transparent px-2.5 py-2 text-sm outline-none text-gray-800 placeholder-gray-400 min-w-0 cursor-pointer"
          />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); openModal(); }}
            className="bg-red-600 hover:bg-red-700 text-white px-3 h-full rounded-r-full text-xs font-bold transition shrink-0"
          >
            Search
          </button>
        </div>
      </div>

      {/* Mobile search trigger pill */}
      <button
        type="button"
        onClick={openModal}
        className="md:hidden flex-1 flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full h-10 px-3.5 text-sm text-gray-400 text-left min-w-0 hover:border-red-300 transition"
      >
        <SearchSVG className="w-4 h-4 shrink-0" />
        <span className="truncate text-gray-400 text-sm">Search vendors…</span>
      </button>

      {modal}
    </>
  );
}

function SearchSVG({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <circle cx="11" cy="11" r="8" />
      <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
    </svg>
  );
}
