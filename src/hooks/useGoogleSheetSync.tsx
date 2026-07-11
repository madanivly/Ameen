import { useEffect, useRef, useCallback, useState } from 'react';
import type { AppState } from '@/types';

export interface UseGoogleSheetSyncOptions {
  enabled?: boolean;
  pollInterval?: number; // in milliseconds
  onDataUpdate?: (data: Partial<AppState>) => void;
  onError?: (error: Error) => void;
  onConnectionStatusChange?: (status: ConnectionStatus) => void;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'error' | 'idle';

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;
const ACTIVE_POLL_INTERVAL = 2000;  // 2s when user is active
const IDLE_POLL_INTERVAL = 15000;   // 15s when tab is idle

export function useGoogleSheetSync({
  enabled = true,
  pollInterval = ACTIVE_POLL_INTERVAL,
  onDataUpdate,
  onError,
  onConnectionStatusChange,
}: UseGoogleSheetSyncOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const isActiveRef = useRef<boolean>(false);
  const retryCountRef = useRef<number>(0);
  const etagRef = useRef<string | null>(null);
  const currentPollIntervalRef = useRef<number>(pollInterval);
  const visibilityChangeCountRef = useRef<number>(0);
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');

  // Track user activity to reduce polling when idle
  const userActivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUserActiveRef = useRef<boolean>(true);

  // Notify connection status changes
  const updateConnectionStatus = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    onConnectionStatusChange?.(status);
  }, [onConnectionStatusChange]);

  const fetchData = useCallback(async () => {
    if (!isActiveRef.current) return;

    try {
      updateConnectionStatus('connecting');
      
      const timestamp = Date.now();
      const headers: Record<string, string> = {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Request-Time': timestamp.toString(),
      };

      // Send ETag for conditional request if we have one
      if (etagRef.current) {
        headers['If-None-Match'] = etagRef.current;
      }

      const response = await fetch(`/api/fetch-data?t=${timestamp}`, {
        method: 'GET',
        headers,
      });

      // Handle 304 Not Modified — data hasn't changed
      if (response.status === 304) {
        lastFetchTimeRef.current = timestamp;
        retryCountRef.current = 0;
        updateConnectionStatus('connected');
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Store the ETag from response for future conditional requests
      const responseEtag = result.etag || response.headers.get('etag');
      if (responseEtag) {
        etagRef.current = responseEtag;
      }

      lastFetchTimeRef.current = timestamp;
      retryCountRef.current = 0;

      if (result.success && result.data) {
        onDataUpdate?.(result.data);
        updateConnectionStatus('connected');
      } else if (result.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Google Sheets sync error:', err);
      
      retryCountRef.current += 1;
      
      if (retryCountRef.current >= MAX_RETRIES) {
        updateConnectionStatus('error');
        onError?.(err);
        retryCountRef.current = 0; // Reset after reporting
      } else {
        // Will retry on next interval cycle
        console.warn(`Sync retry ${retryCountRef.current}/${MAX_RETRIES} after error:`, err.message);
      }
    }
  }, [onDataUpdate, onError, updateConnectionStatus]);

  // Handle visibility change for adaptive polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      visibilityChangeCountRef.current += 1;
      
      if (document.hidden) {
        // Tab is hidden — switch to idle polling
        isUserActiveRef.current = false;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        // Start slow polling
        intervalRef.current = setInterval(() => {
          fetchData();
        }, IDLE_POLL_INTERVAL);
      } else {
        // Tab is visible again — switch to active polling
        isUserActiveRef.current = true;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        // Immediate fetch on return, then fast polling
        fetchData();
        intervalRef.current = setInterval(() => {
          fetchData();
        }, currentPollIntervalRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData]);

  // Track user activity (mouse/keyboard) to keep polling fast
  useEffect(() => {
    const handleUserActivity = () => {
      isUserActiveRef.current = true;
      
      // Reset user idle timer
      if (userActivityTimerRef.current) {
        clearTimeout(userActivityTimerRef.current);
      }
      
      // If we were on a slower interval, speed back up
      if (intervalRef.current && connectionStatus !== 'error') {
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
          fetchData();
        }, currentPollIntervalRef.current);
      }
      
      // Mark user as idle after 2 minutes of inactivity
      userActivityTimerRef.current = setTimeout(() => {
        isUserActiveRef.current = false;
      }, 120000);
    };

    window.addEventListener('mousemove', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('touchstart', handleUserActivity, { passive: true });
    window.addEventListener('scroll', handleUserActivity, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      if (userActivityTimerRef.current) {
        clearTimeout(userActivityTimerRef.current);
      }
    };
  }, [fetchData, connectionStatus]);

  const startPolling = useCallback(() => {
    if (!enabled || intervalRef.current) return;

    isActiveRef.current = true;
    currentPollIntervalRef.current = pollInterval;
    updateConnectionStatus('connecting');
    
    // Initial fetch
    fetchData();
    // Then set up polling
    intervalRef.current = setInterval(() => {
      fetchData();
    }, pollInterval);
  }, [enabled, fetchData, pollInterval, updateConnectionStatus]);

  const stopPolling = useCallback(() => {
    isActiveRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    etagRef.current = null;
    retryCountRef.current = 0;
    updateConnectionStatus('idle');
  }, [updateConnectionStatus]);

  const manualRefresh = useCallback(async () => {
    // Force clear ETag to get fresh data regardless
    etagRef.current = null;
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
    connectionStatus,
    retryCount: retryCountRef.current,
  };
}