"use client";

import { usePathname, useRouter } from "next/navigation";

export default function TopRightActions() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide the profile and notifications on the landing page
  if (pathname === '/' || pathname === '/welcome') return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] md:w-[calc(100%-4rem)] max-w-[1200px] z-[100] bg-[#121212]/80 backdrop-blur-xl border border-white/10 rounded-full h-16 px-6 md:px-10 xl:px-12 flex items-center justify-between shadow-2xl pointer-events-auto select-none">
      
      {/* Brand Logo */}
      <span 
        onClick={() => router.push('/home')}
        className="text-lg font-black tracking-tighter text-white hover:text-omnave-primary transition-colors cursor-pointer"
      >
        omnave.
      </span>
      
      <div className="flex items-center gap-3">
        
        {/* Notification Bell */}
        <button className="flex items-center justify-center size-11 rounded-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors shadow-premium-glass cursor-pointer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
        </button>
 
        {/* Profile Pill */}
        <button
          onClick={() => router.push('/profile')}
          className="flex items-center justify-center size-11 rounded-full bg-omnave-primary text-white font-black text-xs tracking-wider shadow-[0_0_15px_rgba(127,34,254,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          BR
        </button>
        
      </div>
    </div>
  );
}