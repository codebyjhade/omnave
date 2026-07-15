'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserContext } from '@/context/UserContext';

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { hasCompletedOnboarding, loading } = useUserContext();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;

    const isPublicPage = pathname === '/' || pathname === '/welcome';

    if (!hasCompletedOnboarding && !isPublicPage) {
      router.replace('/welcome');
    } else if (hasCompletedOnboarding && pathname === '/welcome') {
      router.replace('/home');
    }
  }, [hasCompletedOnboarding, loading, pathname, router, mounted]);

  return <>{children}</>;
}
