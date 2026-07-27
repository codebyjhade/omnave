'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Upload, TrendingUp, User } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionLink = motion(Link);

export default function BottomNav() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Ensure we only portal on the client to prevent hydration errors
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;
  
  // Hide the global dock on the landing page and lesson focus hub
  if (pathname === '/' || pathname === '/welcome' || pathname?.startsWith('/lesson/')) return null;

  const navContent = (
    <div className="fixed bottom-0 left-0 w-full h-[76px] bg-[#FFFFFF] border-t border-[#EBEBEB] flex items-start justify-center z-[9999] pb-safe shadow-[0px_-4px_10px_rgba(0,0,0,0.05)]">
      <nav className="w-full max-w-5xl flex justify-around items-start px-2" aria-label="Bottom navigation">
        
        {/* Home */}
        <NavItem 
          href="/home"
          active={pathname === '/home'} 
          icon={<Home size={24} strokeWidth={2} />} 
          label="Home"
        />
        
        {/* Lesson */}
        <NavItem 
          href="/library"
          active={pathname === '/library' || pathname?.startsWith('/library/')}
          icon={<BookOpen size={24} strokeWidth={2} />} 
          label="Lesson"
        />

        {/* Upload */}
        <NavItem 
          href="/upload"
          active={pathname === '/upload'}
          icon={<Upload size={24} strokeWidth={2} />} 
          label="Upload"
        />
        
        {/* Progress */}
        <NavItem 
          href="/progress"
          active={pathname === '/progress'}
          icon={<TrendingUp size={24} strokeWidth={2} />} 
          label="Progress"
        />
        
        {/* Profile */}
        <NavItem 
          href="/profile"
          active={pathname === '/profile'}
          icon={<User size={24} strokeWidth={2} />} 
          label="Profile"
        />
        
      </nav>
    </div>
  );
 
  // Teleport to body to escape CSS transforms
  return createPortal(navContent, document.body);
}
 
function NavItem({ 
  icon, 
  href, 
  active = false, 
  label 
}: { 
  icon: React.ReactNode; 
  href: string; 
  active?: boolean; 
  label: string; 
}) {
  const springTransition = { type: "spring" as const, stiffness: 400, damping: 25 };

  return (
    <MotionLink 
      href={href} 
      prefetch={true}
      whileTap={{ scale: 0.95 }}
      transition={springTransition}
      className={`flex flex-col items-center justify-center gap-1 pt-3 pb-4 px-4 rounded-t-none rounded-b-[15px] transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6949a8]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
        active 
          ? 'bg-[#6949a8] text-[#FFFFFF] drop-shadow-[0px_10px_10px_#e9deff]' 
          : 'bg-transparent text-[#a0a0a0] hover:text-[#6949a8]'
      }`}
      aria-label={label}
    >
      <div className="shrink-0">
        {icon}
      </div>
      <span className="text-[11px] font-medium font-poppins tracking-wide">
        {label}
      </span>
    </MotionLink>
  );
}