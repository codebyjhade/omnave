'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from '../Header';
import BottomNav from '../BottomNav';
import OfflineBanner from '../OfflineBanner';
import { useAssessmentGuard } from '@/context/AssessmentContext';

export default function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const { isAssessmentActive } = useAssessmentGuard();
  
  // Safely check URL state on the client side without calling useSearchParams() to prevent Next.js layout compile-time bailout
  const [isQuizActiveUrl, setIsQuizActiveUrl] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setIsQuizActiveUrl(params.get('quizActive') === 'true');
    }
  }, [pathname]);

  // Combine hoisted global context state and URL query parameter state, scoped strictly to the lesson route
  const isQuizActive = pathname.startsWith('/lesson/') && (isAssessmentActive || isQuizActiveUrl);

  // Exclude landing page and onboarding welcome page from standard shell layout
  const isOuterRoute = pathname === '/' || pathname === '/welcome';

  if (isOuterRoute) {
    return (
      <div className="relative z-10 w-full min-h-screen flex flex-col bg-white">
        <OfflineBanner />
        <div className="flex-1 w-full flex flex-col">
          {children}
        </div>
      </div>
    );
  }

  // Detect routes requiring a flat white layout sat flush with the top screen (Progress, Profile, and Lesson viewer)
  const isFlatWhiteRoute = pathname === '/progress' || pathname === '/profile' || pathname.startsWith('/lesson/');

  return (
    <div className={`relative z-10 w-full min-h-screen flex flex-col pb-[env(safe-area-inset-bottom)] pwa-safe-root transition-colors duration-200 ${
      isFlatWhiteRoute ? 'bg-white' : 'bg-[#6949a8]'
    }`}>
      <OfflineBanner />
      {/* 1. FIXED HEADER AREA - Hidden during active quiz takeover */}
      {!isQuizActive && (
        <React.Suspense fallback={<div className="w-full bg-[#6949a8]/80 backdrop-blur-xl relative z-10 flex-none pb-[88px] animate-pulse" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 48px)' }} />}>
          <Header />
        </React.Suspense>
      )}

      {/* 2. THE SCROLLABLE MAIN CANVAS */}
      <div className={`flex-1 w-full max-w-5xl mx-auto px-[25px] pt-8 bg-white relative z-20 flex flex-col transition-all duration-200 ${
        isQuizActive ? 'pb-8' : 'pb-[120px]'
      } ${
        isFlatWhiteRoute 
          ? 'mt-0 rounded-none' 
          : '-mt-12 rounded-t-[40px]'
      }`}>
        <React.Suspense fallback={
          <div className="flex-1 w-full flex items-center justify-center min-h-[300px]">
            <div className="animate-spin w-8 h-8 border-4 border-[#6949a8] border-t-transparent rounded-full" />
          </div>
        }>
          {children}
        </React.Suspense>
      </div>

      {/* 3. GLOBAL HUDS - Hidden during active quiz takeover */}
      {!isQuizActive && <BottomNav />}
    </div>
  );
}
