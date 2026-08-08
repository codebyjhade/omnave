'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export default function OfflineBanner() {
  const isOnline = useNetworkStatus();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setShowBanner(false);
    }
  }, [isOnline]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-12 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-in-out ${
        showBanner
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}
    >
      <div className="bg-[#1c1c1c]/90 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg border border-white/10 flex items-center gap-2 font-poppins select-none">
        <WifiOff size={14} className="text-amber-400 shrink-0" />
        <span>No connection. Viewing Offline Library.</span>
      </div>
    </div>
  );
}
