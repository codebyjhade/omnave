'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import AuthModal from "@/components/AuthModal";
import { createBrowserClient } from "@supabase/ssr";
import { FileText, Sparkles, BrainCircuit, Layers, BookOpen, ArrowRight } from "lucide-react";

export default function LandingPage() {
  // Session Check State
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Ultra-simple, one-time check. No subscriptions, no dependencies.
    const checkSession = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          window.location.href = '/home'; // Hard redirect bypasses React Router caching issues
        } else {
          setHasSession(false);
        }
      } catch (err) {
        setHasSession(false);
      }
    };

    checkSession();
  }, []); // Strictly empty.

  // Auth Overlay Config State
  const [authConfig, setAuthConfig] = useState<{ isOpen: boolean; mode: 'login' | 'signup' }>({
    isOpen: false,
    mode: 'signup'
  });

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthConfig({ isOpen: true, mode });
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen pt-6 md:pt-12 pb-40 md:pb-16 lg:px-10 xl:px-12 w-full max-w-[1200px] mx-auto overflow-hidden">
      
      {/* Background - Hero Focus */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_35%,#000_20%,transparent_100%)]" />
        <div className="absolute top-[15%] md:top-[25%] left-1/2 -translate-x-1/2 w-[600px] md:w-[900px] h-[400px] md:h-[600px] bg-omnave-primary/20 blur-[120px] rounded-full" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl w-full mt-4">
        {/* Hero Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[400px] bg-omnave-primary/10 blur-[150px] rounded-full pointer-events-none" aria-hidden="true" />
        
        {/* Top Beta Badge - Tier 1 Glass */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8 backdrop-blur-md">
          <span className="text-omnave-primary text-xs">✨</span>
          <span className="text-[10px] font-bold tracking-wider text-white/80 uppercase">Omnave Beta is Live</span>
        </div>

        <div className="mb-4 relative flex items-center justify-center">
          <div className="absolute inset-0 bg-omnave-primary/20 blur-2xl rounded-full" />
          <Image src="/omnave.png" alt="Omnave Logo" width={88} height={88} className="relative z-10 drop-shadow-2xl" priority />
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight mb-6">
          Learn anything.<br className="hidden md:block" /> Forget nothing.
        </h1>
        <p className="text-base md:text-lg text-white/50 mb-10 max-w-lg mx-auto leading-relaxed">
          Upload any document, link, or lecture. Omnave instantly transforms it into interactive quizzes, deep-dives, and flashcards powered by spaced repetition.
        </p>

        {/* Trigger Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-16 min-h-[56px]">
          {hasSession === null ? (
            // Keeps the space layout stable while quickly checking session state
            <div className="h-[56px] w-[200px] animate-pulse bg-white/5 border border-white/10 rounded-full" />
          ) : (
            // Only renders the Auth buttons (Go to Dashboard button is completely removed)
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <button
                onClick={() => openAuth('signup')}
                className="flex w-full sm:w-auto items-center justify-center px-8 py-4 rounded-full bg-omnave-primary shadow-[0_0_20px_rgba(127,34,254,0.3)] text-white font-bold transition-all hover:scale-105 hover:bg-omnave-primary/90 hover:shadow-[0_0_25px_rgba(127,34,254,0.5)] active:scale-[0.98] cursor-pointer"
              >
                Get Started
              </button>
              <button
                onClick={() => openAuth('login')}
                className="flex w-full sm:w-auto items-center justify-center px-8 py-4 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md text-white/80 transition-all hover:bg-white/[0.06] shadow-lg hover:scale-105 active:scale-[0.98] cursor-pointer"
              >
                Sign In
              </button>
            </div>
          )}
        </div>

        {/* AI Transformation Visualizer - Floating Pipeline */}
        <div className="w-full max-w-4xl mx-auto mt-8 md:mt-12 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-16 md:mb-24 flex-wrap">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center w-16 h-16 bg-white/[0.03] border border-white/[0.08] backdrop-blur-md rounded-full shadow-lg text-white/80">
              <FileText className="w-7 h-7" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/60">Your Material</span>
          </div>

          <div className="flex items-center justify-center text-white/20" aria-hidden="true">
            <ArrowRight className="hidden md:block w-5 h-5 animate-pulse" />
            <span className="block md:hidden text-lg font-black leading-none animate-pulse">↓</span>
          </div>

          <div className="flex flex-col items-center gap-2 relative">
            <div className="flex items-center justify-center w-20 h-20 bg-omnave-primary/20 border border-omnave-primary/50 backdrop-blur-md rounded-full shadow-[0_0_40px_rgba(127,34,254,0.4)] text-omnave-primary animate-pulse">
              <Sparkles className="w-9 h-9 text-omnave-primary" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-omnave-primary">AI Engine</span>
          </div>

          <div className="flex items-center justify-center text-white/20" aria-hidden="true">
            <ArrowRight className="hidden md:block w-5 h-5 animate-pulse" />
            <span className="block md:hidden text-lg font-black leading-none animate-pulse">↓</span>
          </div>

          <div className="flex flex-col items-center justify-center gap-2 w-full md:w-auto">
            {[
              { label: "Interactive Quizzes", icon: BrainCircuit, color: "text-emerald-400" },
              { label: "Spaced Flashcards", icon: Layers, color: "text-amber-400" },
              { label: "Structured Notes", icon: BookOpen, color: "text-blue-400" }
            ].map((out, idx) => (
              <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/[0.08] backdrop-blur-md rounded-full text-xs font-semibold text-white/70 hover:bg-white/[0.05] transition-all shadow-md w-max max-w-full truncate">
                <out.icon className={`w-3.5 h-3.5 ${out.color}`} />
                <span className="text-[10px] tracking-wide text-white/80">{out.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* The Sneak Peek Dashboard UI Teaser */}
      <div className="relative z-10 w-full max-w-5xl mx-auto mt-8">
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[60%] h-[300px] bg-omnave-primary/20 blur-[120px] rounded-full pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-omnave-canvas/80 to-omnave-canvas z-20 pointer-events-none" />
        
        <div className="relative w-full max-w-5xl mx-auto rounded-t-3xl border-t border-x border-white/[0.1] bg-black/[0.4] backdrop-blur-2xl shadow-2xl overflow-hidden h-[300px] p-6">
           <div className="absolute inset-0 shadow-premium-inner pointer-events-none rounded-t-[32px]" />
           <div className="flex items-center justify-between mb-6">
              <div className="h-4 w-32 bg-white/5 rounded-full" />
              <div className="size-10 bg-white/5 rounded-full" />
           </div>
           <div className="h-10 w-3/4 bg-white/5 rounded-xl mb-4" />
           <div className="h-4 w-1/2 bg-white/5 rounded-full mb-8" />
           <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
             <div className="h-full w-[40%] bg-progress-gradient rounded-full" />
           </div>
        </div>
      </div>

      <AnimatePresence>
        {authConfig.isOpen && (
          <AuthModal
            isOpen={authConfig.isOpen}
            initialView={authConfig.mode}
            onClose={() => setAuthConfig((current) => ({ ...current, isOpen: false }))}
          />
        )}
      </AnimatePresence>

    </div>
  );
}