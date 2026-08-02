'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';

  const getVariants = () => {
    if (pathname.includes('/library') || pathname.includes('/lesson')) {
      // Lesson routes slide UP (subtle)
      return {
        initial: { opacity: 0, y: 15 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0 }
      };
    }
    if (pathname.includes('/profile') || pathname.includes('/progress') || pathname.includes('/settings')) {
      // Profile/Progress/Settings routes stay vertically static (fade only)
      return {
        initial: { opacity: 0, y: 0 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0 }
      };
    }
    // Default (Home / Upload / other): slide DOWN (subtle)
    return {
      initial: { opacity: 0, y: -15 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0 }
    };
  };

  const variants = getVariants();

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex-1 w-full flex flex-col"
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
