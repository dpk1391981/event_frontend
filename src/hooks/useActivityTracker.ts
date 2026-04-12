'use client';

import { useCallback, useRef } from 'react';
import { activityApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

export type ActionType =
  | 'search' | 'view_vendor' | 'view_package' | 'save_package' | 'unsave_package'
  | 'click_vendor' | 'click_package' | 'filter_used' | 'lead_created' | 'get_best_deal'
  | 'onboarding_step' | 'onboarding_done' | 'category_browse' | 'package_inquiry'
  | 'vendor_contact' | 'page_view';

interface TrackEvent {
  actionType: ActionType;
  entityId?: number;
  entityType?: 'vendor' | 'package' | 'category' | string;
  metadata?: Record<string, any>;
}

// Queue events that failed or are waiting to batch
const queue: TrackEvent[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;

const BATCH_DELAY_MS = 2000;

/**
 * Hook for tracking user behavior.
 * Events are batched and sent every 2s to reduce API calls.
 *
 * Usage:
 *   const { track } = useActivityTracker();
 *   track('view_vendor', { entityId: 5, entityType: 'vendor' });
 */
export function useActivityTracker() {
  const { user } = useAppStore();
  const isFlushing = useRef(false);

  const flush = useCallback(async () => {
    if (isFlushing.current || queue.length === 0) return;
    isFlushing.current = true;

    const toSend = queue.splice(0, queue.length);
    try {
      await activityApi.trackBatch(toSend);
    } catch {
      // Silent fail — don't interrupt user flow for analytics
    } finally {
      isFlushing.current = false;
    }
  }, []);

  const track = useCallback((actionType: ActionType, opts?: Omit<TrackEvent, 'actionType'>) => {
    if (typeof window === 'undefined') return;

    queue.push({ actionType, ...opts });

    // Debounce flush
    if (flushTimeout) clearTimeout(flushTimeout);
    flushTimeout = setTimeout(flush, BATCH_DELAY_MS);
  }, [flush]);

  /**
   * Track immediately (no batching) — for high-priority events like lead creation
   */
  const trackNow = useCallback(async (actionType: ActionType, opts?: Omit<TrackEvent, 'actionType'>) => {
    if (typeof window === 'undefined') return;
    try {
      await activityApi.track({ actionType, ...opts });
    } catch { /* silent */ }
  }, []);

  /**
   * Track a vendor view (fires on component mount for vendor detail page)
   */
  const trackVendorView = useCallback((vendorId: number, metadata?: Record<string, any>) => {
    track('view_vendor', { entityId: vendorId, entityType: 'vendor', metadata });
  }, [track]);

  /**
   * Track a package view
   */
  const trackPackageView = useCallback((packageId: number, metadata?: Record<string, any>) => {
    track('view_package', { entityId: packageId, entityType: 'package', metadata });
  }, [track]);

  /**
   * Track a search query
   */
  const trackSearch = useCallback((query: string, filters?: Record<string, any>) => {
    track('search', { metadata: { query, ...filters } });
  }, [track]);

  /**
   * Track saving a package
   */
  const trackSavePackage = useCallback((packageId: number) => {
    track('save_package', { entityId: packageId, entityType: 'package' });
  }, [track]);

  /**
   * Track category browse
   */
  const trackCategoryBrowse = useCallback((categoryId: number, categoryName?: string) => {
    track('category_browse', { entityId: categoryId, entityType: 'category', metadata: { name: categoryName } });
  }, [track]);

  return {
    track,
    trackNow,
    trackVendorView,
    trackPackageView,
    trackSearch,
    trackSavePackage,
    trackCategoryBrowse,
  };
}
