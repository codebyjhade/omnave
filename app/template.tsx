'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '@/context/NavigationContext';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const { currentPath, prevPath } = useNavigation();

  // Capture the pathname when this template instance was mounted
  const [mountedPath] = useState(pathname);

  const isHome = (path: string) => path.startsWith('/home');
  const isLibraryOrLesson = (path: string) => path.startsWith('/library') || path.startsWith('/lesson');
  const isProgress = (path: string) => path.startsWith('/progress');
  const isProfile = (path: string) => path.startsWith('/profile');

  // Determine transition type
  const getTransitionType = (current: string, prev: string) => {
    if (
      (isHome(current) && isLibraryOrLesson(prev)) ||
      (isLibraryOrLesson(current) && isHome(prev))
    ) {
      return 'home-library-lesson';
    }
    if (
      (isProgress(current) && isProfile(prev)) ||
      (isProfile(current) && isProgress(prev))
    ) {
      return 'progress-profile';
    }
    return 'default';
  };

  const isEntering = mountedPath === currentPath;
  
  // Resolve transition type based on whether we are entering or exiting
  const transitionType = isEntering
    ? getTransitionType(currentPath, prevPath)
    : getTransitionType(currentPath, mountedPath);

  const isHomeLibraryTransition = transitionType === 'home-library-lesson';

  const variants = {
    initial: {
      opacity: 0,
      y: isHomeLibraryTransition ? -20 : 0,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.25,
        ease: 'easeOut' as const,
      },
    },
    exit: {
      opacity: 0,
      y: isHomeLibraryTransition ? -20 : 0,
      transition: {
        duration: 0.25,
        ease: 'easeIn' as const,
      },
    },
  };

  return (
    <AnimatePresence mode="popLayout">
      <motion.main
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        className="w-full flex-1 flex flex-col"
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
