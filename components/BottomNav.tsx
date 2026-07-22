'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import dynamic from 'next/dynamic';

const ActionDrawer = dynamic(() => import('./ActionDrawer'), { ssr: false });

export default function BottomNav() {
  const [mounted, setMounted] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Ensure we only portal on the client to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  
  // Hide the global dock on the landing page and lesson focus hub
  if (pathname === '/' || pathname === '/welcome' || pathname?.startsWith('/lesson/')) return null;

  const navContent = (
    <>
      {/* Full-width, bottom-docked glass bar */}
      <div className="fixed bottom-0 left-0 w-full h-[72px] bg-[#05030A]/60 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around px-2 md:px-6 z-[9999] pb-safe">
        
        {/* Home */}
        <NavItem 
          href="/home"
          active={pathname === '/home'} 
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>} 
          ariaLabel="Home"
        />
        
        {/* Library */}
        <NavItem 
          href="/library"
          active={pathname === '/library' || pathname?.startsWith('/library/')}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-0-5H20"/></svg>} 
          ariaLabel="Library"
        />
        
        {/* Center Action Button */}
        <button 
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className="relative -translate-y-3 w-14 h-14 rounded-full bg-gradient-to-tr from-[#7C3AED] via-[#9333EA] to-[#c084fc] flex items-center justify-center text-white active:scale-[0.95] active:opacity-80 transition-[opacity,box-shadow] duration-100 shadow-[0_8px_25px_rgba(147,51,234,0.5)] border-[1.5px] border-white/20 z-50 overflow-hidden group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
          aria-label="Open study menu"
        >
          {/* Inner glow effect */}
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
          
          <Plus className="relative z-10" size={28} strokeWidth={2.5}/>
        </button>
        
        {/* Progress */}
        <NavItem 
          href="/progress"
          active={pathname === '/progress'}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>} 
          ariaLabel="Progress"
        />
        
        {/* Profile */}
        <NavItem 
          href="/profile"
          active={pathname === '/profile'}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} 
          ariaLabel="Profile"
        />
        
      </div>
      <ActionDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
 
  // Teleport to body to escape CSS transforms
  return createPortal(navContent, document.body);
}
 
function NavItem({ icon, href, active = false, ariaLabel }: { icon: React.ReactNode, href: string, active?: boolean, ariaLabel: string }) {
  return (
    <Link 
      className="relative flex items-center justify-center p-3 group active:scale-[0.95] active:opacity-80 transform-gpu focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] rounded-xl transition-[opacity] duration-100" 
      href={href} 
      prefetch={true}
      aria-label={ariaLabel}
    >
      <div className={`${active ? 'text-white scale-110' : 'text-white/40 group-hover:text-white/70'} transform-gpu transition-transform duration-100 group-hover:-translate-y-1`}>
        {icon}
      </div>
      {active && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 size-1 bg-omnave-primary rounded-full shadow-[0_0_8px_rgba(127,34,254,0.8)]" />
      )}
    </Link>
  );
}