'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserContext } from '@/context/UserContext';

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUserContext();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;

    const isOnboardingComplete = !!user?.user_metadata?.onboarding_complete;

    if (!user) {
      if (pathname !== '/' && pathname !== '/login' && pathname !== '/signup') {
        router.replace('/');
      }
    } else {
      if (!isOnboardingComplete) {
        if (pathname !== '/welcome') {
          router.replace('/welcome');
        }
      } else {
        if (pathname === '/welcome') {
          router.replace('/home');
        }
      }
    }
  }, [user, loading, pathname, router, mounted]);

  return <>{children}</>;
}
