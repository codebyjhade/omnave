'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from '../Header';
import BottomNav from '../BottomNav';
import OfflineBanner from '../OfflineBanner';
import { useAssessmentGuard } from '@/context/AssessmentContext';
import { useUserContext } from '@/context/UserContext';
import Link from 'next/link';
import Image from 'next/image';
import { Home, BookOpen, Upload, TrendingUp, User, Flame } from 'lucide-react';

function DesktopSidebar({ pathname, streak }: { pathname: string; streak: number }) {
  const navItems = [
    { href: '/home', label: 'Home', icon: Home },
    { href: '/library', label: 'Library', icon: BookOpen },
    { href: '/upload', label: 'Upload', icon: Upload },
    { href: '/progress', label: 'Progress', icon: TrendingUp },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:top-0 md:left-0 md:h-screen md:z-40 bg-white border-r border-gray-100 select-none shadow-sm" aria-label="Desktop sidebar">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 gap-3 border-b border-gray-100">
        <Image src="/icon.png" alt="Omnave Logo" width={34} height={34} className="rounded-lg drop-shadow-md" />
        <span className="font-poppins font-extrabold text-gray-900 text-xl tracking-tight">
          omnave
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto" aria-label="Sidebar navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/home' 
            ? pathname === '/home' 
            : pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-poppins transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#6949a8] text-white font-semibold shadow-[0px_4px_12px_rgba(105,73,168,0.3)]'
                  : 'text-gray-600 hover:text-[#6949a8] hover:bg-purple-50/50 font-medium'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? 'text-white' : 'text-gray-400'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Streak Badge */}
      <div className="p-4 border-t border-gray-100 flex flex-col gap-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/60 border border-purple-100/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#6949a8]/10 text-[#6949a8]">
              <Flame size={18} strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-900 font-poppins">{streak || 0}-Day Streak</span>
              <span className="text-[10px] text-gray-500 font-poppins">Keep the momentum</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const { isAssessmentActive } = useAssessmentGuard();
  const { streak } = useUserContext();
  
  // Safely check URL state on the client side without calling useSearchParams() to prevent Next.js layout compile-time bailout
  const [isQuizActiveUrl, setIsQuizActiveUrl] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

      {/* Desktop Fixed Left-hand Sidebar (md:, lg:) in Light Mode */}
      {!isQuizActive && (
        <DesktopSidebar pathname={pathname} streak={streak} />
      )}

      {/* Main Content Area Offset for Desktop Sidebar */}
      <div className="flex-1 w-full flex flex-col md:pl-64">
        {/* 1. FIXED HEADER AREA - Hidden during active quiz takeover */}
        {!isQuizActive && (
          <div className="relative z-50">
            <React.Suspense fallback={<div className="w-full bg-[#6949a8]/80 backdrop-blur-xl relative z-50 flex-none pb-6 animate-pulse" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 48px)' }} />}>
              <Header />
            </React.Suspense>
          </div>
        )}

        {/* 2. THE SCROLLABLE MAIN CANVAS */}
        <div className={`flex-1 w-full max-w-5xl md:max-w-7xl mx-auto px-[25px] md:px-10 pt-8 bg-white relative z-10 flex flex-col transition-all duration-200 ${
          isQuizActive ? 'pb-8' : 'pb-[120px] md:pb-12'
        } ${
          isFlatWhiteRoute 
            ? 'mt-0 rounded-none' 
            : 'mt-0 rounded-t-[40px]'
        }`}>
          <React.Suspense fallback={
            <div className="flex-1 w-full flex items-center justify-center min-h-[300px]">
              <div className="animate-spin w-8 h-8 border-4 border-[#6949a8] border-t-transparent rounded-full" />
            </div>
          }>
            {children}
          </React.Suspense>
        </div>
      </div>

      {/* 3. GLOBAL HUDS - Hidden during active quiz takeover */}
      {!isQuizActive && <BottomNav />}
    </div>
  );
}
