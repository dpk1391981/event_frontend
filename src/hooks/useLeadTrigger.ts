'use client';

import { useEffect, useRef, useCallback } from 'react';

const SESSION_KEY = 'lead_trigger_shown';

export function useLeadTrigger(
  onTrigger: () => void,
  {
    scrollThreshold = 0.5,
    enableExitIntent = true,
    enabled = true,
  }: {
    scrollThreshold?: number;
    enableExitIntent?: boolean;
    enabled?: boolean;
  } = {},
) {
  const triggered = useRef(false);

  const fire = useCallback(() => {
    if (triggered.current) return;
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) return;
    triggered.current = true;
    sessionStorage.setItem(SESSION_KEY, '1');
    onTrigger();
  }, [onTrigger]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) return;

    // Scroll trigger
    const handleScroll = () => {
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrolled >= scrollThreshold) fire();
    };

    // Exit intent (desktop only)
    const handleMouseLeave = (e: MouseEvent) => {
      if (!enableExitIntent) return;
      if (e.clientY <= 0) fire();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled, scrollThreshold, enableExitIntent, fire]);
}
