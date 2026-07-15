'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';
import { useUserContext } from '@/context/UserContext';
import { Bell, Check, ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, completeOnboarding, loading } = useUserContext();
  const [notificationStatus, setNotificationStatus] = useState<string>('default');
  const [isLaunching, setIsLaunching] = useState(false);

  // Sync notification status on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  const requestNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      if (permission === 'granted') {
        new Notification("Welcome to Omnave!", {
          body: "Let's lock in and master your concepts.",
          icon: "/icon.png"
        });
      }
    }
  };

  const handleLaunch = async () => {
    try {
      setIsLaunching(true);
      
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      await supabase.auth.updateUser({
        data: { onboarding_complete: true }
      });
      
      await completeOnboarding(); // Updates context state and refreshes context
      router.push('/home');
    } catch (err) {
      console.error('[Onboarding] Error launching workspace:', err);
      setIsLaunching(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-omnave-canvas">
        <div className="animate-spin w-8 h-8 border-4 border-omnave-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.nickname || user?.email?.split('@')[0] || "Learner";
  const firstName = fullName.split(' ')[0] || "Learner";

  return (
    <div className="min-h-screen bg-omnave-canvas flex flex-col justify-center items-center relative overflow-hidden select-none px-6 py-8 md:py-12">
      {/* Background radial overlays */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_40%,#000_10%,transparent_100%)]" />
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-omnave-primary/10 blur-[150px] rounded-full" />
      </div>

      {/* Main Single Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md z-10 relative"
      >
        <div className="bg-[#0f0a1c]/80 border border-white/10 backdrop-blur-md shadow-2xl rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center gap-6 relative overflow-hidden">
          {/* Subtle background glow inside the card */}
          <div className="absolute -top-10 -left-10 w-48 h-48 bg-omnave-primary/20 blur-[80px] pointer-events-none" />

          {/* Icon */}
          <div className="w-14 h-14 bg-omnave-primary/20 text-omnave-primary rounded-2xl flex items-center justify-center relative">
            <div className="absolute inset-0 bg-omnave-primary/35 blur-xl rounded-full animate-pulse" />
            <Bell size={28} className="relative z-10" />
          </div>

          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Welcome to Omnave, {firstName}.
            </h1>
            <p className="text-xs sm:text-sm text-white/50 leading-relaxed max-w-xs mx-auto">
              Let's finalize your workspace.
            </p>
          </div>

          {/* Action Card: Sync & Remind */}
          <div className="w-full flex flex-col gap-3 mt-1 text-left">
            <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Check size={14} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider">Sync Enabled</p>
                <p className="text-[10px] text-emerald-400/70 truncate max-w-[240px]">Connected as {user.email}</p>
              </div>
            </div>

            {/* Notification button */}
            <button
              onClick={requestNotifications}
              className={`w-full py-4 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                notificationStatus === 'granted'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 pointer-events-none'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
              }`}
            >
              {notificationStatus === 'granted' ? (
                <>
                  <Check size={14} /> Reminders Enabled
                </>
              ) : (
                <>
                  🔔 Enable Study Reminders
                </>
              )}
            </button>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleLaunch}
            disabled={isLaunching}
            className="w-full py-4 mt-2 bg-omnave-primary hover:bg-omnave-primary/95 text-white font-extrabold rounded-2xl shadow-[0_0_15px_rgba(127,34,254,0.4)] hover:shadow-[0_0_25px_rgba(127,34,254,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer text-sm disabled:opacity-50 animate-pulse-subtle"
          >
            {isLaunching ? "Launching..." : (
              <>
                Launch Workspace <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
