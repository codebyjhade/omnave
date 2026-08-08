'use client';

import React from 'react';
import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export default function OfflineBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-[#1c1c1c] text-white text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2 transition-all duration-300 shadow-md z-[100] font-poppins shrink-0"
    >
      <WifiOff size={14} className="text-amber-400 shrink-0" />
      <span>No connection. Viewing Offline Library.</span>
    </div>
  );
}
