'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import dynamic from "next/dynamic";
import SplashScreen from "@/components/SplashScreen";

const AuthModal = dynamic(() => import("@/components/AuthModal"), { ssr: false });
import InstallGuideModal from "@/components/InstallGuideModal";

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
  const [showInstallGuide, setShowInstallGuide] = useState(false);

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
      setShowInstallGuide(true);
    }
  };

  if (hasSession === null) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex flex-col items-center justify-center z-50">
        <Image alt="Omnave Logo" className="mb-6 drop-shadow-xl animate-pulse" height={80} priority src="/omnave.png" width={80}/>
        <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <motion.div 
            className="h-full bg-[#6949a8] rounded-full shadow-md"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 relative overflow-x-hidden font-sans antialiased">
      
      {/* Background grid canvas pattern & top light emitter */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_15%,transparent_100%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] md:w-[1300px] h-[400px] md:h-[650px] bg-[#6949a8]/5 blur-[130px] rounded-full" />
        <div className="absolute top-[-10%] left-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-purple-400/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-[40%] right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-indigo-400/10 blur-[120px] rounded-full pointer-events-none" />
      </div>

      {/* ─── 1. NAVIGATION BAR ─── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-6 pb-4 transition-all"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 bg-omnave-primary/20 blur-lg rounded-full" />
              <Image src="/omnave.png" alt="Logo" width={28} height={28} className="relative z-10" priority sizes="28px" />
            </div>
            <span className="font-black text-lg tracking-tight bg-gradient-to-r from-gray-900 to-[#6949a8] bg-clip-text text-transparent font-poppins">
              Omnave
            </span>
          </div>

          {/* Desktop Right CTA Action Items */}
          <div className="hidden md:flex items-center gap-4 font-sans text-gray-600">
            <button 
              onClick={() => openAuth('login')}
              className="px-5 py-2 text-sm font-bold hover:text-gray-900 transition-colors cursor-pointer font-poppins"
            >
              Sign In
            </button>
            <button 
              onClick={() => openAuth('signup')}
              className="px-6 py-2.5 bg-[#6949a8] rounded-xl text-sm font-extrabold text-white active:scale-[0.98] transition-all cursor-pointer font-poppins shadow-[0_8px_20px_rgba(105,73,168,0.25)] hover:shadow-[0_12px_25px_rgba(105,73,168,0.35)]"
            >
              Start Learning Free
            </button>
          </div>

          {/* Mobile Menu Action Icon */}
          <button 
            className="block md:hidden text-gray-600 hover:text-gray-900 cursor-pointer"
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
            className="fixed inset-x-0 z-40 bg-white/95 border-b border-gray-200 px-6 py-8 flex flex-col gap-4 md:hidden backdrop-blur-xl"
            style={{ top: 'calc(env(safe-area-inset-top) + 69px)' }}
          >
            <button 
              onClick={() => openAuth('login')}
              className="w-full py-3.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 hover:bg-gray-50 transition-all cursor-pointer font-poppins"
            >
              Sign In
            </button>
            <button 
              onClick={() => openAuth('signup')}
              className="w-full py-3.5 bg-[#6949a8] rounded-xl text-sm font-black text-white text-center cursor-pointer font-poppins shadow-[0_8px_20px_rgba(105,73,168,0.25)] hover:shadow-[0_12px_25px_rgba(105,73,168,0.35)]"
            >
              Start Learning Free
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 2. HERO SECTION ─── */}
      <section
        className="relative z-10 pb-20 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-8"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 128px)' }}
      >
        
        {/* Left Side Copy */}
        <div className="flex-1 text-left flex flex-col gap-6 select-none">
          {/* Glass pill badge */}
          <div className="w-fit flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-55 border border-gray-200 backdrop-blur-md">
            <span className="text-omnave-primary text-xs">✨</span>
            <span className="text-[10px] font-extrabold tracking-wider text-gray-700 uppercase font-poppins">Omnave v1.0 is live</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tighter leading-[1.08] max-w-xl font-poppins">
            Learn anything.<br />
            <span className="bg-gradient-to-r from-[#6949a8] to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
              Forget nothing.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-gray-500 leading-relaxed max-w-lg font-poppins">
            Omnave is the AI study companion designed to convert raw files, study slides, and lecture URLs into custom flashcard decks, gamified recall quizzes, and interactive audio chat modules in under 10 seconds.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3.5 mt-2 w-full sm:w-auto">
            <button 
              onClick={() => openAuth('signup')}
              className="py-4 px-8 bg-[#6949a8] rounded-xl text-white font-extrabold active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer text-sm font-poppins shadow-[0_8px_20px_rgba(105,73,168,0.25)] hover:shadow-[0_12px_25px_rgba(105,73,168,0.35)]"
            >
              Get Started Free <ArrowRight size={16} />
            </button>
            
            {!isAlreadyInstalled && (
              <button 
                onClick={handleInstallApp}
                className="py-4 px-8 bg-white border border-gray-200 text-gray-900 shadow-md rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer text-sm font-poppins"
              >
                <Download size={16} /> Install Web App
              </button>
            )}
          </div>
        </div>

        {/* Right Side Visual Centerpiece */}
        <div className="flex-1 w-full max-w-lg relative select-none">
          <div className="absolute inset-0 bg-[#6949a8]/5 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative bg-white/60 backdrop-blur-xl border border-purple-100 rounded-3xl p-6 shadow-[0_20px_60px_-15px_rgba(105,73,168,0.15)] flex flex-col gap-5 overflow-hidden w-full aspect-[4/3] justify-center">
            {/* Top Bar Circles */}
            <div className="flex gap-1.5 absolute top-4 left-5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>

            {/* Simulated file conversion pipeline */}
            <div className="flex flex-row items-center justify-between gap-4 mt-4 select-none relative">
              {/* PDF Icon container */}
              <motion.div 
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-20 h-24 bg-purple-50 border border-purple-200 rounded-xl flex flex-col items-center justify-center gap-2 shadow-sm shrink-0 relative"
              >
                <FileText className="text-purple-600" size={32} />
                <span className="text-[9px] font-black tracking-wider text-purple-600 uppercase font-poppins">Study.pdf</span>
              </motion.div>

              {/* Glowing animated transfer streams */}
              <div className="flex-1 flex flex-col gap-3 relative h-16 justify-center items-center overflow-hidden">
                <div className="w-full h-[1px] bg-gradient-to-r from-purple-300 via-[#6949a8] to-emerald-300 relative">
                  <motion.div 
                    initial={{ x: "-100%" }}
                    animate={{ x: ["-100%", "1100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute h-[3px] w-[10%] bg-[#6949a8] blur-[2px] -top-[1px] left-0 transform-gpu"
                  />
                </div>
                <div className="w-full h-[1px] bg-gradient-to-r from-purple-300 via-[#6949a8] to-emerald-300 relative">
                  <motion.div 
                    initial={{ x: "-100%" }}
                    animate={{ x: ["-100%", "1100%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }}
                    className="absolute h-[3px] w-[10%] bg-[#6949a8] blur-[2px] -top-[1px] left-0 transform-gpu"
                  />
                </div>
              </div>

              {/* Conversion Outputs Container */}
              <div className="flex flex-col gap-2 shrink-0">
                {/* Quiz card */}
                <motion.div 
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="flex items-center gap-2 py-2 px-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-extrabold shadow-sm w-36"
                >
                  <BrainCircuit size={14} />
                  <span className="font-poppins">Interactive Quiz</span>
                </motion.div>
                {/* Flashcard card */}
                <motion.div 
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                  className="flex items-center gap-2 py-2 px-3 bg-amber-50 border border-amber-100 text-amber-600 text-[10px] font-extrabold shadow-sm w-36"
                >
                  <Layers size={14} />
                  <span className="font-poppins">Spaced Flashcard</span>
                </motion.div>
                {/* Assistant card */}
                <motion.div 
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                  className="flex items-center gap-2 py-2 px-3 bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-extrabold shadow-sm w-36"
                >
                  <Sparkles size={14} />
                  <span className="font-poppins">AI Study Guide</span>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ─── 3. THE CORE LOOP (Upload ➔ Generate ➔ Master) ─── */}
      <section className="relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-gray-200">
        <div className="text-center flex flex-col gap-2 mb-16 select-none">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-gray-900 font-poppins">How Omnave Locks in Concepts</h2>
          <p className="text-xs sm:text-sm text-gray-500 font-poppins">Three automated stages to optimize learning speed.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto select-none">
          {/* Step 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden shadow-md hover:border-purple-300 hover:shadow-[0_8px_30px_rgba(105,73,168,0.12)] transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#6949a8] font-black text-sm font-poppins">
              01
            </div>
            <h3 className="text-base sm:text-lg font-black text-gray-900 font-poppins">Feed the AI</h3>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-medium font-poppins">
              Upload dense PDFs, textbooks, audio files, or lecture slideshows directly to your workspace.
            </p>
          </motion.div>

          {/* Step 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden shadow-md hover:border-purple-300 hover:shadow-[0_8px_30px_rgba(105,73,168,0.12)] transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#6949a8] font-black text-sm font-poppins">
              02
            </div>
            <h3 className="text-base sm:text-lg font-black text-gray-900 font-poppins">Instant Extraction</h3>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-medium font-poppins">
              Our backend instantly splits definitions, compiles formulas, generates smart flashcards, and builds custom quizzes.
            </p>
          </motion.div>

          {/* Step 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden shadow-md hover:border-purple-300 hover:shadow-[0_8px_30px_rgba(105,73,168,0.12)] transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#6949a8] font-black text-sm font-poppins">
              03
            </div>
            <h3 className="text-base sm:text-lg font-black text-gray-900 font-poppins">Lock It In</h3>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-medium font-poppins">
              Revise on the go using spaced-repetition schedules, tracking your consistency levels, daily missions, and streaks.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── 4. THE "PWA SUPERPOWERS" SECTION ─── */}
      <section className="relative z-10 py-16 px-6 max-w-7xl mx-auto">
        <div className="bg-purple-50/30 border border-purple-100 backdrop-blur-md rounded-3xl p-6 sm:p-8 md:p-12 relative overflow-hidden shadow-sm w-full max-w-5xl mx-auto select-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#6949a8]/5 blur-[100px] pointer-events-none" />
          
          <div className="flex flex-col gap-2 mb-10 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-poppins">The PWA Superpowers</h2>
            <p className="text-xs sm:text-sm text-gray-500 font-poppins">Omnave is optimized to run as a full standalone PWA, bypassing slow browser controls.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <Smartphone size={18} />
              </div>
              <h4 className="text-sm font-extrabold text-gray-900 font-poppins">Install Instantly</h4>
              <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed font-medium font-poppins">
                Add directly to your home screen or doc drawer with zero downloads from the App Store. Bypasses installation gates instantly.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <Zap size={18} />
              </div>
              <h4 className="text-sm font-extrabold text-gray-900 font-poppins">Zero Online Limits</h4>
              <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed font-medium font-poppins">
                Access your cached flashcard decks, study sheets, and offline recall assets even when on flights or during transit.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <Bell size={18} />
              </div>
              <h4 className="text-sm font-extrabold text-gray-900 font-poppins">Streak Reminders</h4>
              <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed font-medium font-poppins">
                Configure smart study alarms and notification signals so you never break your consistency chain or forget card intervals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. THE "ARSENAL" BENTO BOX ─── */}
      <section className="relative z-10 py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center flex flex-col gap-2 mb-16 select-none">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-gray-900 font-poppins">Built for High-Yield Study</h2>
          <p className="text-xs sm:text-sm text-gray-500 font-poppins">Every tool you need to study, recall, and review, packed in one clean dashboard.</p>
        </div>

        {/* Asymmetrical Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto select-none">
          
          {/* Card 1: AI Chat Assistant (Big Card) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 relative overflow-hidden group shadow-md hover:border-purple-300 hover:shadow-[0_8px_30px_rgba(105,73,168,0.12)] transition-all duration-300 md:col-span-2">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 blur-[80px] pointer-events-none" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="text-[#6949a8]" size={16} />
                <span className="text-xs font-black uppercase tracking-wider text-gray-700 font-poppins">AI Study partner</span>
              </div>
              <span className="text-[10px] text-gray-400 font-semibold font-poppins">Active Mode</span>
            </div>
            
            <h3 className="text-lg font-black text-gray-900 font-poppins">Chat with Documents</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-poppins">
              Don't just read. Question. Chat directly with uploaded textbooks, query definitions, or ask for complex code block summaries instantly.
            </p>

            {/* Mock chat bubble visual */}
            <div className="flex flex-col gap-2.5 mt-2 bg-gray-50 border border-gray-200 rounded-xl p-3 text-[10px] leading-relaxed">
              <div className="self-start bg-white border border-gray-200 text-gray-800 p-2 rounded-lg max-w-[80%] text-left font-poppins shadow-sm">
                What does the spaced repetition algorithm do?
              </div>
              <div className="self-end bg-[#6949a8]/10 border border-[#6949a8]/20 text-[#6949a8] p-2 rounded-lg max-w-[80%] text-left flex gap-1.5 items-start font-poppins">
                <Sparkles className="shrink-0 text-[#6949a8] mt-0.5" size={10} />
                <span>It schedules reviews based on your recall accuracy, pushing cards further out as your memory score rises!</span>
              </div>
            </div>
          </div>

          {/* Card 2: Memory Retention Decay (Tall Card) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 relative overflow-hidden group shadow-md hover:border-purple-300 hover:shadow-[0_8px_30px_rgba(105,73,168,0.12)] transition-all duration-300 justify-between">
            <div className="flex flex-col gap-1 text-left">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mb-2">
                <Activity className="text-purple-600" size={16} />
              </div>
              <h3 className="text-sm sm:text-base font-black text-gray-900 font-poppins">Spaced Repetition</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium font-poppins">
                Automatic decay algorithms scheduling reviews exactly before you forget.
              </p>
            </div>

            {/* Mock decay graph chart */}
            <div className="w-full h-24 bg-gray-50 border border-gray-200 rounded-xl p-2 flex flex-col justify-end gap-1 relative overflow-hidden mt-3">
              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-300 font-bold uppercase tracking-widest pointer-events-none font-poppins">
                Retention curve
              </div>
              <svg className="w-full h-full" viewBox="0 0 100 40">
                {/* Line path decay */}
                <path d="M 0 5 Q 30 15 60 30 T 100 38" fill="none" stroke="#6949a8" strokeWidth="2" />
                <path d="M 0 5 Q 30 15 60 30 T 100 38 L 100 40 L 0 40 Z" fill="url(#decay-grad)" opacity="0.1" />
                <defs>
                  <linearGradient id="decay-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6949a8" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Card 3: Cross-Device Sync (Wide Card) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 relative overflow-hidden group shadow-md hover:border-purple-300 hover:shadow-[0_8px_30px_rgba(105,73,168,0.12)] transition-all duration-300 md:col-span-2">
            <div className="flex items-center gap-2">
              <Laptop className="text-[#6949a8]" size={16} />
              <span className="text-xs font-black uppercase tracking-wider text-gray-700 font-poppins">Cloud Syncing</span>
            </div>
            
            <h3 className="text-lg font-black text-gray-900 font-poppins">Cross-Device Momentum</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-poppins">
              Start your study sessions on your desktop browser, sync your flashcards instantly, and continue running review quizzes on your phone during your morning transit.
            </p>

            <div className="flex justify-center items-center gap-12 py-3">
              <div className="flex flex-col items-center gap-1 opacity-70">
                <Laptop size={24} className="text-gray-400" />
                <span className="text-[8px] font-black uppercase tracking-wider text-gray-405 font-poppins">Laptop</span>
              </div>
              <div className="h-[1px] w-20 border-t border-dashed border-gray-200 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#6949a8] animate-ping" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <Smartphone size={24} className="text-[#6949a8]" />
                <span className="text-[8px] font-black uppercase tracking-wider text-[#6949a8] font-poppins">Phone PWA</span>
              </div>
            </div>
          </div>

          {/* Card 4: Quick Specs (Small Cards) */}
          <div className="grid grid-cols-2 gap-3 md:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col justify-center items-center text-center gap-2 shadow-md hover:border-purple-300 hover:shadow-[0_8px_30px_rgba(105,73,168,0.12)] transition-all duration-300">
              <span className="text-xs font-black text-gray-900 font-poppins">Zero Ads</span>
              <span className="text-[10px] text-gray-500 font-poppins">Pure Study Focus</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col justify-center items-center text-center gap-2 shadow-md hover:border-purple-300 hover:shadow-[0_8px_30px_rgba(105,73,168,0.12)] transition-all duration-300">
              <span className="text-xs font-black text-gray-900 font-poppins">100% Free</span>
              <span className="text-[10px] text-gray-500 font-poppins">App Features</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col justify-center items-center text-center gap-2 shadow-md hover:border-purple-300 hover:shadow-[0_8px_30px_rgba(105,73,168,0.12)] transition-all duration-300">
              <span className="text-xs font-black text-gray-900 font-poppins">PDF Export</span>
              <span className="text-[10px] text-gray-500 font-poppins">Offline Sync</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col justify-center items-center text-center gap-2 shadow-md hover:border-purple-300 hover:shadow-[0_8px_30px_rgba(105,73,168,0.12)] transition-all duration-300">
              <span className="text-xs font-black text-gray-900 font-poppins">High Speed</span>
              <span className="text-[10px] text-gray-500 font-poppins">Instant Load</span>
            </div>
          </div>

        </div>
      </section>

      {/* ─── 6. STREAMLINED PRICING ─── */}
      <section className="relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-gray-200">
        <div className="text-center flex flex-col gap-2 mb-16 select-none">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-gray-900 font-poppins">Fair, Transparent Pricing</h2>
          <p className="text-xs sm:text-sm text-gray-500 font-poppins">Start learning with no upfront costs, upgrade when you need extreme power.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto select-none">
          {/* Free Tier */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 relative justify-between shadow-md hover:shadow-lg transition-all duration-300">
            <div className="flex flex-col gap-4 text-left">
              <div>
                <h3 className="text-lg font-black text-gray-900 font-poppins">Free Learner</h3>
                <p className="text-xs text-gray-500 mt-1 font-poppins">For casual study sessions and note revision.</p>
              </div>

              <div className="flex items-baseline gap-1 py-2 font-poppins">
                <span className="text-3xl sm:text-4xl font-black text-gray-900">$0</span>
                <span className="text-xs text-gray-500">/ forever</span>
              </div>

              <div className="h-[1px] bg-gray-150 w-full" />

              <ul className="flex flex-col gap-3.5 text-xs text-gray-700 font-medium font-poppins">
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-[#6949a8]" />
                  <span>3 AI document uploads monthly</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-[#6949a8]" />
                  <span>Basic flashcard and quiz generators</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-[#6949a8]" />
                  <span>PWA offline support & cloud sync</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={() => openAuth('signup')}
              className="w-full py-3.5 mt-6 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold transition-all cursor-pointer font-poppins"
            >
              Sign Up Free
            </button>
          </div>

          {/* Pro Tier */}
          <div className="bg-white border-2 border-purple-300 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 relative justify-between overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
            {/* Pro badge tag */}
            <div className="absolute top-4 right-4 bg-[#6949a8]/10 border border-[#6949a8]/20 text-[#6949a8] text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full font-poppins">
              Recommended
            </div>

            <div className="flex flex-col gap-4 text-left">
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-1.5 font-poppins">
                  Omnave Pro <Zap size={14} className="text-amber-500 fill-amber-500" />
                </h3>
                <p className="text-xs text-gray-500 mt-1 font-poppins">For power students locking in complex exams.</p>
              </div>

              <div className="flex items-baseline gap-1 py-2 font-poppins">
                <span className="text-3xl sm:text-4xl font-black text-gray-900">$12</span>
                <span className="text-xs text-gray-500">/ month</span>
              </div>

              <div className="h-[1px] bg-gray-200/50 w-full" />

              <ul className="flex flex-col gap-3.5 text-xs text-gray-850 font-medium font-poppins">
                {/* Base Value Anchor */}
                <li className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
                  <Check size={14} className="text-[#6949a8] shrink-0" />
                  <span className="text-xs font-medium text-gray-600">
                    Everything in <span className="text-gray-900 font-bold">Free Learner</span>, plus:
                  </span>
                </li>

                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-purple-600" />
                  <span className="font-extrabold text-gray-900">Unlimited document uploads</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-purple-600" />
                  <span>Priority AI processing engine</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-purple-600" />
                  <span>Customizable retention analytics</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={14} className="text-purple-600" />
                  <span>Advanced quiz configurations</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={() => openAuth('signup')}
              className="w-full py-3.5 mt-6 rounded-xl bg-[#6949a8] hover:bg-[#5a3d94] text-white text-xs font-black active:scale-[0.98] transition-all cursor-pointer font-poppins shadow-[0_8px_20px_rgba(105,73,168,0.25)] hover:shadow-[0_12px_25px_rgba(105,73,168,0.35)]"
            >
              Go Pro Now
            </button>
          </div>
        </div>
      </section>

      {/* ─── 7. IMMERSIVE FOOTER CTA ─── */}
      <footer className="relative z-10 pt-20 pb-16 px-6 max-w-7xl mx-auto text-center overflow-hidden select-none">
        {/* Bottom ambient lighting glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[300px] bg-omnave-primary/[0.03] blur-[130px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tighter font-poppins">Your next exam is waiting.</h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md font-poppins">
            Join thousands of active students using Omnave's automated recall pipeline to master concepts in half the time.
          </p>

          <button 
            onClick={() => openAuth('signup')}
            className="py-4 px-8 mt-2 rounded-full bg-[#6949a8] hover:bg-[#5a3d94] text-white font-extrabold animate-pulse hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer text-xs sm:text-sm font-poppins shadow-[0_8px_20px_rgba(105,73,168,0.25)] hover:shadow-[0_12px_25px_rgba(105,73,168,0.35)]"
          >
            Create Free Account
          </button>

          <div className="text-[10px] text-gray-400 font-medium tracking-wide mt-12 flex flex-col sm:flex-row items-center gap-1.5 sm:gap-6 justify-center font-poppins">
            <span>© 2026 Omnave Inc. All rights reserved.</span>
            <span className="hidden sm:inline">•</span>
            <span className="hover:text-gray-900 transition-colors cursor-pointer">Terms of Service</span>
            <span className="hidden sm:inline">•</span>
            <span className="hover:text-gray-900 transition-colors cursor-pointer">Privacy Policy</span>
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

      <InstallGuideModal isOpen={showInstallGuide} onClose={() => setShowInstallGuide(false)} />

    </div>
  );
}