'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { getProgressSyncSummary, PROGRESS_SYNC_EVENT, replayQuizProgressQueue, type ProgressSyncSummary } from '@/lib/offline-progress';

export default function OfflineBanner() {
  const isOnline = useNetworkStatus();
  const [showBanner, setShowBanner] = useState(false);
  const [sync, setSync] = useState<ProgressSyncSummary>({ pending: 0, conflicts: 0 });

  useEffect(() => {
    if (!isOnline || sync.pending > 0) {
      setShowBanner(true);
      const timer = isOnline && sync.pending === 0 ? setTimeout(() => setShowBanner(false), 3000) : undefined;

      return () => { if (timer) clearTimeout(timer); };
    } else {
      setShowBanner(false);
    }
  }, [isOnline, sync.pending]);

  useEffect(() => {
    const refresh = () => getProgressSyncSummary().then(setSync);
    const syncWhenOnline = () => replayQuizProgressQueue().finally(refresh);
    refresh();
    window.addEventListener(PROGRESS_SYNC_EVENT, refresh);
    window.addEventListener('online', syncWhenOnline);
    return () => {
      window.removeEventListener(PROGRESS_SYNC_EVENT, refresh);
      window.removeEventListener('online', syncWhenOnline);
    };
  }, []);

  const message = sync.conflicts > 0
    ? `${sync.conflicts} study result${sync.conflicts === 1 ? '' : 's'} need attention.`
    : !isOnline && sync.pending > 0
      ? `${sync.pending} result${sync.pending === 1 ? '' : 's'} saved on this device. Syncs when online.`
      : !isOnline
        ? 'Offline. Showing study kits saved on this device.'
        : sync.pending > 0
          ? `Syncing ${sync.pending} saved result${sync.pending === 1 ? '' : 's'}...`
          : 'Study progress synced.';
  const Icon = sync.conflicts > 0 ? AlertTriangle : !isOnline ? CloudOff : sync.pending > 0 ? RefreshCw : Cloud;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!showBanner}
      className={`fixed top-12 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-in-out ${
        showBanner
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}
    >
      <div className="bg-[#1c1c1c]/90 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg border border-white/10 flex items-center gap-2 font-poppins select-none">
        <Icon size={14} className={`${sync.pending > 0 && isOnline ? 'animate-spin' : ''} text-amber-400 shrink-0`} />
        <span>{message}</span>
      </div>
    </div>
  );
}
