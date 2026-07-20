'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const TAB_PATHS = ['/home', '/library', '/progress', '/profile'];

export default function TabScrollRestorer() {
  const pathname = usePathname();
  const positions = useRef<Record<string, number>>({});
  const prevPathname = useRef(pathname);

  // Monitor and save scroll position continuously
  useEffect(() => {
    const handleScroll = () => {
      if (TAB_PATHS.includes(pathname)) {
        positions.current[pathname] = window.scrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  // Restore scroll position when path changes
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      if (TAB_PATHS.includes(pathname)) {
        const savedPosition = positions.current[pathname] ?? 0;
        
        // Wait a frame to let the new page render, then scroll instantly (0ms)
        const frameId = requestAnimationFrame(() => {
          window.scrollTo({
            top: savedPosition,
            behavior: 'instant' as ScrollBehavior,
          });
        });
        
        prevPathname.current = pathname;
        return () => cancelAnimationFrame(frameId);
      }
      prevPathname.current = pathname;
    }
  }, [pathname]);

  return null;
}
