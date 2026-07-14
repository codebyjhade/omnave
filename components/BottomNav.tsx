'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Ensure we only portal on the client to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  
  // Hide the global dock on the landing page
  if (pathname === '/' || pathname === '/welcome') return null;

  const navContent = (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999]">
      {/* Tightly packed flex container with even gaps */}
      <nav className="flex items-center justify-center w-max gap-4 md:gap-6 px-6 py-3 bg-white/[0.05] backdrop-blur-2xl border border-white/[0.08] rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]">
        
        {/* Home */}
        <NavItem 
          href="/home"
          active={pathname === '/home'} 
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>} 
        />
        
        {/* Library */}
        <NavItem 
          href="/library"
          active={pathname === '/library' || pathname?.startsWith('/library/')}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-0-5H20"/></svg>} 
        />
        
        {/* Center Action Button (Import) - Removed relative -top-5, embedded perfectly inline */}
        <Link 
          className="flex items-center justify-center size-12 shrink-0 rounded-full bg-button-gradient text-white shadow-[0_4px_15px_rgba(127,34,254,0.5)] hover:scale-105 hover:shadow-[0_4px_20px_rgba(127,34,254,0.6)] active:scale-95 transition-all duration-300 border border-white/20" 
          href="/import"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </Link>
        
        {/* Progress */}
        <NavItem 
          href="/progress"
          active={pathname === '/progress'}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>} 
        />
        
        {/* Profile */}
        <NavItem 
          href="/profile"
          active={pathname === '/profile'}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} 
        />
        
      </nav>
    </div>
  );

  // Teleport to body to escape CSS transforms
  return createPortal(navContent, document.body);
}

function NavItem({ icon, href, active = false }: { icon: React.ReactNode, href: string, active?: boolean }) {
  return (
    <Link className="relative flex items-center justify-center p-3 group" href={href}>
      <div className={`${active ? 'text-white' : 'text-white/50 group-hover:text-white/90'} transition-all duration-300 group-hover:-translate-y-1`}>
        {icon}
      </div>
      {active && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 size-1 bg-omnave-primary rounded-full shadow-[0_0_8px_rgba(127,34,254,0.8)]" />
      )}
    </Link>
  );
}