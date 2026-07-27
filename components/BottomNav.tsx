'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const ActionDrawer = dynamic(() => import('./ActionDrawer'), { ssr: false });
const MotionLink = motion(Link);

export default function BottomNav() {
  const [mounted, setMounted] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();
  const springTransition = { type: "spring" as const, stiffness: 400, damping: 25 };

  // Ensure we only portal on the client to prevent hydration errors
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;
  
  // Hide the global dock on the landing page and lesson focus hub
  if (pathname === '/' || pathname === '/welcome' || pathname?.startsWith('/lesson/')) return null;

  const navContent = (
    <>
      {/* Full-width, bottom-docked white bar */}
      <div className="fixed bottom-0 left-0 w-full h-[72px] bg-white border-t border-[#EBEBEB] flex items-center justify-around px-2 md:px-6 z-[9999] pb-safe shadow-[0px_-4px_10px_rgba(0,0,0,0.05)]">
        
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
        <motion.button 
          whileTap={{ scale: 0.95 }}
          transition={springTransition}
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className="relative -translate-y-3 w-14 h-14 rounded-full bg-[#6949a8] hover:bg-[#563b8c] flex items-center justify-center text-white transition-all shadow-[0px_10px_10px_rgba(105,73,168,0.3)] border-none z-50 overflow-hidden group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6949a8]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          aria-label="Open study menu"
        >
          {/* Inner glow effect */}
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
          
          <Plus className="relative z-10" size={28} strokeWidth={2.5}/>
        </motion.button>
        
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
  const springTransition = { type: "spring" as const, stiffness: 400, damping: 25 };

  return (
    <MotionLink 
      whileTap={{ scale: 0.95 }}
      transition={springTransition}
      className="relative flex items-center justify-center p-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6949a8]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-xl transition-[opacity] duration-100 cursor-pointer" 
      href={href} 
      prefetch={true}
      aria-label={ariaLabel}
    >
      <div className={`${
        active 
          ? 'text-[#6949a8] scale-110 drop-shadow-[0px_10px_10px_#e9deff]' 
          : 'text-[#a0a0a0] hover:text-[#6949a8]'
      } transform-gpu transition-all duration-100 group-hover:-translate-y-1`}>
        {icon}
      </div>
      {active && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 size-1 bg-[#6949a8] rounded-full shadow-[0_0_8px_rgba(105,73,168,0.8)]" />
      )}
    </MotionLink>
  );
}