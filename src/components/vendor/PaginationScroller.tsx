'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Invisible component that scrolls the #vendor-list anchor into view
 * whenever the ?page= query param changes (mobile pagination).
 */
export default function PaginationScroller() {
  const searchParams = useSearchParams();
  const page = searchParams.get('page');
  const isFirst = useRef(true);

  useEffect(() => {
    // Skip scroll on initial mount — only scroll on page changes
    if (isFirst.current) { isFirst.current = false; return; }
    const el = document.getElementById('vendor-list');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page]);

  return null;
}
