'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import AuthModal from "@/components/AuthModal";
import { 
  FileText, 
  Sparkles, 
  BrainCircuit, 
  Layers, 
  BookOpen, 
  ArrowRight, 
  Download, 
  Smartphone, 
  Bell, 
  Laptop, 
  Zap, 
  Check, 
  Menu, 
  X,
  Activity
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  
  // Auth Modal State
  const [authConfig, setAuthConfig] = useState<{ isOpen: boolean; mode: 'login' | 'signup' }>({
    isOpen: false,
    mode: 'signup'
  });

  // PWA Install States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1. Session Check & Redirect
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/home');
        } else {
          setHasSession(false);
        }
      } catch (err) {
        setHasSession(false);
      }
    };
    checkSession();
  }, [router]);

  // 2. PWA Install Event Handler
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      setIsAlreadyInstalled(isStandalone);

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }
  }, []);

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthConfig({ isOpen: true, mode });
    setMobileMenuOpen(false);
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // iOS or unsupported browser fallback instruction
      alert("To install Omnave on your home screen:\n\n• On iOS (Safari): Tap Share, then select 'Add to Home Screen'.\n• On Desktop (Chrome/Edge): Click the install icon in the top right URL bar.");
    }
  };

  if (hasSession === null) {
    return (
      <div className="fixed inset-0 bg-omnave-canvas flex items-center justify-center z-50">
        <div className="relative flex flex-col items-center gap-4">
          <div className="absolute inset-0 bg-omnave-primary/20 blur-2xl rounded-full" />
          <Image src="/omnave.png" alt="Omnave Logo" width={80} height={80} className="relative z-10 animate-pulse" priority />
          <div className="w-12 h-0.5 bg-white/10 rounded-full overflow-hidden relative">
            <div className="h-full w-1/2 bg-omnave-primary rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-omnave-canvas text-white relative overflow-x-hidden font-sans antialiased">
      
      {/* Background grid canvas pattern & top light emitter */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff07_1px,transparent_1px),linear-gradient(to_bottom,#ffffff07_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_15%,transparent_100%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] md:w-[1300px] h-[400px] md:h-[650px] bg-omnave-primary/10 blur-[130px] rounded-full" />
      </div>

      {/* ─── 1. NAVIGATION BAR ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/40 backdrop-blur-xl border-b border-white/5 px-6 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 bg-omnave-primary/30 blur-lg rounded-full" />
              <Image src="/omnave.png" alt="Logo" width={28} height={28} className="relative z-10" />
            </div>
            <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-white to-omnave-primary bg-clip-text text-transparent">
              Omnave
            </span>
          </div>

          {/* Desktop Right CTA Action Items */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => openAuth('login')}
              className="px-5 py-2 text-sm font-bold text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button 
              onClick={() => openAuth('signup')}
              className="px-6 py-2.5 rounded-xl bg-omnave-primary hover:bg-omnave-primary/95 text-sm font-extrabold text-white shadow-[0_4px_12px_rgba(127,34,254,0.3)] hover:shadow-[0_4px_20px_rgba(127,34,254,0.5)] active:scale-[0.98] transition-all cursor-pointer"
            >
              Start Learning Free
            </button>
          </div>

          {/* Mobile Menu Action Icon */}
          <button 
            className="block md:hidden text-white/70 hover:text-white cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-[69px] z-40 bg-[#0A0A0A]/95 border-b border-white/5 px-6 py-8 flex flex-col gap-4 md:hidden backdrop-blur-xl"
          >
            <button 
              onClick={() => openAuth('login')}
              className="w-full py-3.5 rounded-xl border border-white/10 text-sm font-bold text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button 
              onClick={() => openAuth('signup')}
              className="w-full py-3.5 rounded-xl bg-omnave-primary text-sm font-black text-white text-center shadow-[0_0_15px_rgba(127,34,254,0.3)] cursor-pointer"
            >
              Start Learning Free
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 2. HERO SECTION ─── */}
      <section className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
        
        {/* Left Side Copy */}
        <div className="flex-1 text-left flex flex-col gap-6 select-none">
          {/* Glass pill badge */}
          <div className="w-fit flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
            <span className="text-omnave-primary text-xs">✨</span>
            <span className="text-[10px] font-extrabold tracking-wider text-white/80 uppercase">Omnave v1.0 is live</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-[1.08] max-w-xl">
            Learn anything.<br />
            <span className="bg-gradient-to-r from-omnave-primary via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Forget nothing.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-white/50 leading-relaxed max-w-lg">
            Omnave is the AI study companion designed to convert raw files, slide decks, and lecture URLs into custom flashcard decks, gamified recall quizzes, and interactive audio chat modules in under 10 seconds.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3.5 mt-2 w-full sm:w-auto">
            <button 
              onClick={() => openAuth('signup')}
              className="py-4 px-8 rounded-full bg-omnave-primary hover:bg-omnave-primary/95 text-white font-extrabold shadow-[0_0_20px_rgba(127,34,254,0.4)] hover:shadow-[0_0_30px_rgba(127,34,254,0.6)] hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              Get Started Free <ArrowRight size={16} />
            </button>
            
            {!isAlreadyInstalled && (
              <button 
                onClick={handleInstallApp}
                className="py-4 px-8 rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <Download size={16} /> Install Web App
              </button>
            )}
          </div>
        </div>

        {/* Right Side Visual Centerpiece (Mock Isometric Dashboard Transformation) */}
        <div className="flex-1 w-full max-w-lg relative select-none">
          <div className="absolute inset-0 bg-omnave-primary/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative border border-white/10 bg-[#0f0a1c]/70 backdrop-blur-md rounded-3xl p-6 shadow-2xl flex flex-col gap-5 overflow-hidden w-full aspect-[4/3] justify-center">
            {/* Top Bar Circles */}
            <div className="flex gap-1.5 absolute top-4 left-5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
            </div>

            {/* Simulated file conversion pipeline */}
            <div className="flex flex-row items-center justify-between gap-4 mt-4 select-none relative">
              {/* PDF Icon container */}
              <motion.div 
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-20 h-24 bg-[#1C112C] border border-purple-500/30 rounded-xl flex flex-col items-center justify-center gap-2 shadow-lg shrink-0 relative"
              >
                <div className="absolute -inset-[1px] bg-gradient-to-b from-purple-500/20 to-transparent rounded-xl" />
                <FileText className="text-purple-400" size={32} />
                <span className="text-[9px] font-black tracking-wider text-purple-400/80 uppercase">Study.pdf</span>
              </motion.div>

              {/* Glowing animated transfer streams */}
              <div className="flex-1 flex flex-col gap-3 relative h-16 justify-center items-center overflow-hidden">
                <div className="w-full h-[1px] bg-gradient-to-r from-purple-500/10 via-omnave-primary/50 to-emerald-500/10 relative">
                  <motion.div 
                    animate={{ left: ["-10%", "110%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute h-[3px] w-6 bg-omnave-primary blur-[2px] -top-[1px]"
                  />
                </div>
                <div className="w-full h-[1px] bg-gradient-to-r from-purple-500/10 via-omnave-primary/50 to-amber-500/10 relative">
                  <motion.div 
                    animate={{ left: ["-10%", "110%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }}
                    className="absolute h-[3px] w-6 bg-omnave-primary blur-[2px] -top-[1px]"
                  />
                </div>
              </div>

              {/* Conversion Outputs Container */}
              <div className="flex flex-col gap-2 shrink-0">
                {/* Quiz card */}
                <motion.div 
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="flex items-center gap-2 py-2 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[10px] font-extrabold shadow-sm w-36"
                >
                  <BrainCircuit size={14} />
                  <span>Interactive Quiz</span>
                </motion.div>
                {/* Flashcard card */}
                <motion.div 
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                  className="flex items-center gap-2 py-2 px-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-[10px] font-extrabold shadow-sm w-36"
                >
                  <Layers size={14} />
                  <span>Spaced Flashcard</span>
                </motion.div>
                {/* Assistant card */}
                <motion.div 
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                  className="flex items-center gap-2 py-2 px-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-[10px] font-extrabold shadow-sm w-36"
                >
                  <Sparkles size={14} />
                  <span>AI Study Guide</span>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ─── 3. THE CORE LOOP (Upload ➔ Generate ➔ Master) ─── */}
      <section className="relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center flex flex-col gap-2 mb-16 select-none">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">How Omnave Locks in Concepts</h2>
          <p className="text-xs sm:text-sm text-white/50">Three automated stages to optimize learning speed.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto select-none">
          {/* Step 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-[#130E24] border border-white/5 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-omnave-primary font-black text-sm">
              01
            </div>
            <h3 className="text-base sm:text-lg font-black text-white">Feed the AI</h3>
            <p className="text-xs sm:text-sm text-white/40 leading-relaxed font-medium">
              Upload dense PDFs, textbooks, audio files, or lecture slideshows directly to your workspace.
            </p>
          </motion.div>

          {/* Step 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="bg-[#130E24] border border-white/5 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-omnave-primary font-black text-sm">
              02
            </div>
            <h3 className="text-base sm:text-lg font-black text-white">Instant Extraction</h3>
            <p className="text-xs sm:text-sm text-white/40 leading-relaxed font-medium">
              Our backend instantly splits definitions, compiles formulas, generates smart flashcards, and builds custom quizzes.
            </p>
          </motion.div>

          {/* Step 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-[#130E24] border border-white/5 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-omnave-primary font-black text-sm">
              03
            </div>
            <h3 className="text-base sm:text-lg font-black text-white">Lock It In</h3>
            <p className="text-xs sm:text-sm text-white/40 leading-relaxed font-medium">
              Revise on the go using spaced-repetition schedules, tracking your consistency levels, daily missions, and streaks.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── 4. THE "PWA SUPERPOWERS" SECTION ─── */}
      <section className="relative z-10 py-16 px-6 max-w-7xl mx-auto">
        <div className="bg-[#0f0a1c]/80 border border-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 md:p-12 relative overflow-hidden shadow-2xl w-full max-w-5xl mx-auto select-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 blur-[100px] pointer-events-none" />
          
          <div className="flex flex-col gap-2 mb-10 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">The PWA Superpowers</h2>
            <p className="text-xs sm:text-sm text-white/50">Omnave is optimized to run as a full standalone PWA, bypassing slow browser controls.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-left hover:border-white/10 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300">
                <Smartphone size={18} />
              </div>
              <h4 className="text-sm font-extrabold text-white">Install Instantly</h4>
              <p className="text-[11px] sm:text-xs text-white/40 leading-relaxed font-medium">
                Add directly to your home screen or doc drawer with zero downloads from the App Store. Bypasses installation gates instantly.
              </p>
            </div>

            <div className="flex flex-col gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-left hover:border-white/10 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300">
                <Zap size={18} />
              </div>
              <h4 className="text-sm font-extrabold text-white">Zero Online Limits</h4>
              <p className="text-[11px] sm:text-xs text-white/40 leading-relaxed font-medium">
                Access your cached flashcard decks, study sheets, and offline recall assets even when on flights or during transit.
              </p>
            </div>

            <div className="flex flex-col gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-left hover:border-white/10 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300">
                <Bell size={18} />
              </div>
              <h4 className="text-sm font-extrabold text-white">Streak Reminders</h4>
              <p className="text-[11px] sm:text-xs text-white/40 leading-relaxed font-medium">
                Configure smart study alarms and notification signals so you never break your consistency chain or forget card intervals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. THE "ARSENAL" BENTO BOX ─── */}
      <section className="relative z-10 py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center flex flex-col gap-2 mb-16 select-none">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">Built for High-Yield Study</h2>
          <p className="text-xs sm:text-sm text-white/50">Every tool you need to study, recall, and review, packed in one clean dashboard.</p>
        </div>

        {/* Asymmetrical Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto select-none">
          
          {/* Card 1: AI Chat Assistant (Big Card) */}
          <div className="md:col-span-2 bg-[#130E24] border border-white/5 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 blur-[80px] pointer-events-none" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="text-omnave-primary" size={16} />
                <span className="text-xs font-black uppercase tracking-wider text-white/80">AI Study partner</span>
              </div>
              <span className="text-[10px] text-white/40 font-semibold">Active Mode</span>
            </div>
            
            <h3 className="text-lg font-black text-white">Chat with Documents</h3>
            <p className="text-xs text-white/40 leading-relaxed">
              Don't just read. Question. Chat directly with uploaded textbooks, query definitions, or ask for complex code block summaries instantly.
            </p>

            {/* Mock chat bubble visual */}
            <div className="flex flex-col gap-2.5 mt-2 bg-white/[0.01] border border-white/5 rounded-xl p-3 text-[10px] leading-relaxed">
              <div className="self-start bg-white/5 border border-white/10 text-white/80 p-2 rounded-lg max-w-[80%] text-left">
                What does the spaced repetition algorithm do?
              </div>
              <div className="self-end bg-omnave-primary/20 border border-omnave-primary/30 text-white p-2 rounded-lg max-w-[80%] text-left flex gap-1.5 items-start">
                <Sparkles className="shrink-0 text-omnave-primary mt-0.5" size={10} />
                <span>It schedules reviews based on your recall accuracy, pushing cards further out as your memory score rises!</span>
              </div>
            </div>
          </div>

          {/* Card 2: Memory Retention Decay (Tall Card) */}
          <div className="bg-[#130E24] border border-white/5 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-white/10 transition-all duration-300 justify-between">
            <div className="flex flex-col gap-1 text-left">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-2">
                <Activity className="text-purple-400" size={16} />
              </div>
              <h3 className="text-sm sm:text-base font-black text-white">Spaced Repetition</h3>
              <p className="text-xs text-white/40 leading-relaxed font-medium">
                Automatic decay algorithms scheduling reviews exactly before you forget.
              </p>
            </div>

            {/* Mock decay graph chart */}
            <div className="w-full h-24 bg-white/[0.01] border border-white/5 rounded-xl p-2 flex flex-col justify-end gap-1 relative overflow-hidden mt-3">
              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/10 font-bold uppercase tracking-widest pointer-events-none">
                Retention curve
              </div>
              <svg className="w-full h-full" viewBox="0 0 100 40">
                {/* Line path decay */}
                <path d="M 0 5 Q 30 15 60 30 T 100 38" fill="none" stroke="#7f22fe" strokeWidth="2" />
                <path d="M 0 5 Q 30 15 60 30 T 100 38 L 100 40 L 0 40 Z" fill="url(#decay-grad)" opacity="0.1" />
                <defs>
                  <linearGradient id="decay-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7f22fe" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Card 3: Cross-Device Sync (Wide Card) */}
          <div className="md:col-span-2 bg-[#130E24] border border-white/5 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
            <div className="flex items-center gap-2">
              <Laptop className="text-omnave-primary" size={16} />
              <span className="text-xs font-black uppercase tracking-wider text-white/80">Cloud Syncing</span>
            </div>
            
            <h3 className="text-lg font-black text-white">Cross-Device Momentum</h3>
            <p className="text-xs text-white/40 leading-relaxed">
              Start your study sessions on your desktop browser, sync your flashcards instantly, and continue running review quizzes on your phone during your morning transit.
            </p>

            <div className="flex justify-center items-center gap-12 py-3">
              <div className="flex flex-col items-center gap-1 opacity-70">
                <Laptop size={24} className="text-white/60" />
                <span className="text-[8px] font-black uppercase tracking-wider text-white/40">Laptop</span>
              </div>
              <div className="h-[1px] w-20 border-t border-dashed border-white/10 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-omnave-primary animate-ping" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <Smartphone size={24} className="text-omnave-primary" />
                <span className="text-[8px] font-black uppercase tracking-wider text-omnave-primary">Phone PWA</span>
              </div>
            </div>
          </div>

          {/* Card 4: Quick Specs (Small Cards) */}
          <div className="grid grid-cols-2 gap-3 md:col-span-1">
            <div className="bg-[#130E24] border border-white/5 rounded-xl p-3 flex flex-col justify-center items-center text-center gap-2">
              <span className="text-xs font-black text-white">Zero Ads</span>
              <span className="text-[10px] text-white/40">Pure Study Focus</span>
            </div>
            <div className="bg-[#130E24] border border-white/5 rounded-xl p-3 flex flex-col justify-center items-center text-center gap-2">
              <span className="text-xs font-black text-white">100% Dark</span>
              <span className="text-[10px] text-white/40">AMOLED Canvas</span>
            </div>
            <div className="bg-[#130E24] border border-white/5 rounded-xl p-3 flex flex-col justify-center items-center text-center gap-2">
              <span className="text-xs font-black text-white">PDF Export</span>
              <span className="text-[10px] text-white/40">Offline Offline</span>
            </div>
            <div className="bg-[#130E24] border border-white/5 rounded-xl p-3 flex flex-col justify-center items-center text-center gap-2">
              <span className="text-xs font-black text-white">High Speed</span>
              <span className="text-[10px] text-white/40">Instant Load</span>
            </div>
          </div>

        </div>
      </section>

      {/* ─── 6. STREAMLINED PRICING ─── */}
      <section className="relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center flex flex-col gap-2 mb-16 select-none">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">Fair, Transparent Pricing</h2>
          <p className="text-xs sm:text-sm text-white/50">Start learning with no upfront costs, upgrade when you need extreme power.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto select-none">
          {/* Free Tier */}
          <div className="bg-[#130E24] border border-white/5 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 relative justify-between">
            <div className="flex flex-col gap-4 text-left">
              <div>
                <h3 className="text-lg font-black text-white">Free Learner</h3>
                <p className="text-xs text-white/40 mt-1">For casual study sessions and note revision.</p>
              </div>

              <div className="flex items-baseline gap-1 py-2">
                <span className="text-3xl sm:text-4xl font-black text-white">$0</span>
                <span className="text-xs text-white/40">/ forever</span>
              </div>

              <div className="h-[1px] bg-white/5 w-full" />

              <ul className="flex flex-col gap-3.5 text-xs text-white/70 font-medium">
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-omnave-primary" />
                  <span>3 AI document uploads monthly</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-omnave-primary" />
                  <span>Basic flashcard and quiz generators</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-omnave-primary" />
                  <span>PWA offline support & cloud sync</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={() => openAuth('signup')}
              className="w-full py-3.5 mt-6 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Sign Up Free
            </button>
          </div>

          {/* Pro Tier */}
          <div className="bg-gradient-to-br from-[#2e1a5e]/60 to-[#130E24] border border-purple-500/30 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 relative justify-between shadow-[0_8px_30px_rgba(88,28,135,0.15)] overflow-hidden">
            {/* Pro badge tag */}
            <div className="absolute top-4 right-4 bg-omnave-primary/20 border border-omnave-primary/30 text-omnave-primary text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
              Recommended
            </div>

            <div className="flex flex-col gap-4 text-left">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                  Omnave Pro <Zap size={14} className="text-amber-400 fill-amber-400" />
                </h3>
                <p className="text-xs text-white/40 mt-1">For power students locking in complex exams.</p>
              </div>

              <div className="flex items-baseline gap-1 py-2">
                <span className="text-3xl sm:text-4xl font-black text-white">$12</span>
                <span className="text-xs text-white/40">/ month</span>
              </div>

              <div className="h-[1px] bg-white/5 w-full" />

              <ul className="flex flex-col gap-3.5 text-xs text-white/80 font-medium">
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-purple-400" />
                  <span className="font-extrabold text-white">Unlimited document uploads</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-purple-400" />
                  <span>Priority AI processing engine</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-purple-400" />
                  <span>Customizable retention analytics</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-purple-400" />
                  <span>Advanced quiz configurations</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={() => openAuth('signup')}
              className="w-full py-3.5 mt-6 rounded-xl bg-omnave-primary hover:bg-omnave-primary/95 text-white text-xs font-black shadow-[0_0_15px_rgba(127,34,254,0.3)] hover:shadow-[0_0_20px_rgba(127,34,254,0.5)] active:scale-[0.98] transition-all cursor-pointer"
            >
              Go Pro Now
            </button>
          </div>
        </div>
      </section>

      {/* ─── 7. IMMERSIVE FOOTER CTA ─── */}
      <footer className="relative z-10 pt-20 pb-16 px-6 max-w-7xl mx-auto text-center overflow-hidden select-none">
        {/* Bottom ambient lighting glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[300px] bg-omnave-primary/10 blur-[130px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tighter">Your next exam is waiting.</h2>
          <p className="text-xs sm:text-sm text-white/50 max-w-md">
            Join thousands of active students using Omnave's automated recall pipeline to master concepts in half the time.
          </p>

          <button 
            onClick={() => openAuth('signup')}
            className="py-4 px-8 mt-2 rounded-full bg-omnave-primary hover:bg-omnave-primary/95 text-white font-extrabold shadow-[0_0_20px_rgba(127,34,254,0.4)] hover:shadow-[0_0_35px_rgba(127,34,254,0.6)] animate-pulse hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer text-xs sm:text-sm"
          >
            Create Free Account
          </button>

          <div className="text-[10px] text-white/30 font-medium tracking-wide mt-12 flex flex-col sm:flex-row items-center gap-1.5 sm:gap-6 justify-center">
            <span>© 2026 Omnave Inc. All rights reserved.</span>
            <span className="hidden sm:inline">•</span>
            <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
            <span className="hidden sm:inline">•</span>
            <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
          </div>
        </div>
      </footer>

      {/* AUTHENTICATION OVERLAY MODALS */}
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