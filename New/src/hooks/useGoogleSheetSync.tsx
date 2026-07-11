import { useEffect, useRef, useCallback } from 'react';
import type { AppState } from '@/types';

export interface UseGoogleSheetSyncOptions {
  enabled?: boolean;
  pollInterval?: number; // in milliseconds
  onDataUpdate?: (data: Partial<AppState>) => void;
  onError?: (error: Error) => void;
}

export function useGoogleSheetSync({
  enabled = true,
  pollInterval = 5000, // 5 seconds
  onDataUpdate,
  onError,
}: UseGoogleSheetSyncOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const isActiveRef = useRef<boolean>(false);

  const fetchData = useCallback(async () => {
    if (!isActiveRef.current) return;

    try {
      // Add cache-busting query parameter
      const timestamp = Date.now();
      const response = await fetch(`/api/get-data?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Request-Time': timestamp.toString(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const result = await response.json();
      lastFetchTimeRef.current = timestamp;

      if (result.success && result.data) {
        onDataUpdate?.(result.data);
      } else if (result.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Google Sheets sync error:', err);
      onError?.(err);
    }
  }, [onDataUpdate, onError]);

  const startPolling = useCallback(() => {
    if (!enabled || intervalRef.current) return;

    isActiveRef.current = true;
    // Initial fetch
    fetchData();
    // Then set up polling
    intervalRef.current = setInterval(() => {
      fetchData();
    }, pollInterval);
  }, [enabled, fetchData, pollInterval]);

  const stopPolling = useCallback(() => {
    isActiveRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const manualRefresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, startPolling, stopPolling]);

  return {
    manualRefresh,
    startPolling,
    stopPolling,
    lastFetchTime: lastFetchTimeRef.current,
  };
}