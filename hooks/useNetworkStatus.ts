'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook to track real-time network connectivity status.
 * Safely handles SSR by defaulting to true on the server and checking window/navigator on client mount.
 */
export function useNetworkStatus(): boolean {
  // 1. Always initialize as true to perfectly match the server's SSR HTML
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // 2. Immediately sync with actual network status right after hydration
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
