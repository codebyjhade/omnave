'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationContextType {
  currentPath: string;
  prevPath: string;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const [currentPath, setCurrentPath] = useState(pathname);
  const [prevPath, setPrevPath] = useState('');

  useEffect(() => {
    if (pathname !== currentPath) {
      setPrevPath(currentPath);
      setCurrentPath(pathname);
    }
  }, [pathname, currentPath]);

  return (
    <NavigationContext.Provider value={{ currentPath, prevPath }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    return { currentPath: '', prevPath: '' };
  }
  return context;
}
