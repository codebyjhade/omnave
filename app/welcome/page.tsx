'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserContext } from '@/context/UserContext';
import AuthModal from '@/components/AuthModal';
import { 
  BrainCircuit, 
  Layers, 
  FileText, 
  Sparkles, 
  Upload, 
  BookOpen, 
  LineChart, 
  Smartphone, 
  Bell, 
  ArrowRight, 
  Check, 
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, completeOnboarding, refreshUser } = useUserContext();
  
  // Navigation states
  const [currentStep, setCurrentStep] = useState(1);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [direction, setDirection] = useState(0); // -1 for back, 1 for forward

  // Notification and PWA states
  const [notificationStatus, setNotificationStatus] = useState<string>('default');
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  // Restore step on refresh if signed up
  useEffect(() => {
    const savedStep = localStorage.getItem('omnave_onboarding_step');
    if (savedStep) {
      setCurrentStep(parseInt(savedStep, 10));
    }
  }, []);

  // Sync PWA standalone state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      setIsStandalone(standalone);

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setPwaPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }
  }, []);

  // Update notification permission status state
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  // Safe navigation
  const nextSlide = useCallback(() => {
    if (currentStep === 3) {
      // Screen 4 is PWA. If standalone, or PWA is not supported and not iOS (where we can guide safari install),
      // we skip screen 4 and go straight to screen 5.
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const canInstall = pwaPrompt !== null || isIOS;
      if (isStandalone || !canInstall) {
        setDirection(1);
        setCurrentStep(5);
        localStorage.setItem('omnave_onboarding_step', '5');
        return;
      }
    }

    if (currentStep < 6) {
      setDirection(1);
      const next = currentStep + 1;
      setCurrentStep(next);
      localStorage.setItem('omnave_onboarding_step', next.toString());
    }
  }, [currentStep, pwaPrompt, isStandalone]);

  const prevSlide = useCallback(() => {
    if (currentStep === 5) {
      // Check if we skipped screen 4 previously
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const canInstall = pwaPrompt !== null || isIOS;
      if (isStandalone || !canInstall) {
        setDirection(-1);
        setCurrentStep(3);
        localStorage.setItem('omnave_onboarding_step', '3');
        return;
      }
    }

    if (currentStep > 1) {
      setDirection(-1);
      const prev = currentStep - 1;
      setCurrentStep(prev);
      localStorage.setItem('omnave_onboarding_step', prev.toString());
    }
  }, [currentStep, pwaPrompt, isStandalone]);

  // Complete and redirect
  const handleComplete = async (action: 'upload' | 'explore') => {
    await completeOnboarding();
    localStorage.removeItem('omnave_onboarding_step');
    if (action === 'upload') {
      router.push('/upload');
    } else {
      router.push('/home');
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    localStorage.removeItem('omnave_onboarding_step');
    router.push('/home');
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAuthOpen) return; // Disable when AuthModal is open

      if (e.key === 'Enter') {
        e.preventDefault();
        if (currentStep === 6) {
          handleComplete('upload');
        } else {
          nextSlide();
        }
      } else if (e.key === 'ArrowRight') {
        if (currentStep < 6) nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        if (currentStep > 1) prevSlide();
      } else if (e.key === 'Escape') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, nextSlide, prevSlide, isAuthOpen]);

  // Framer Motion Variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
      filter: 'blur(4px)',
      scale: 0.98
    }),
    center: {
      x: 0,
      opacity: 1,
      filter: 'blur(0px)',
      scale: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 350, damping: 30 },
        opacity: { duration: 0.2 },
        filter: { duration: 0.2 },
        scale: { duration: 0.2 }
      }
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 100 : -100,
      opacity: 0,
      filter: 'blur(4px)',
      scale: 0.98,
      transition: {
        x: { type: 'spring' as const, stiffness: 350, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  // PWA trigger
  const triggerPwaInstall = async () => {
    if (pwaPrompt) {
      pwaPrompt.prompt();
      const { outcome } = await pwaPrompt.userChoice;
      if (outcome === 'accepted') {
        setPwaPrompt(null);
        nextSlide();
      }
    } else {
      // iOS Safari fallback trigger guide
      alert("To install on iOS: Tap the Share button in Safari, then select 'Add to Home Screen'.");
    }
  };

  // Notification trigger
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

  return (
    <div className="min-h-screen bg-omnave-canvas flex flex-col justify-between items-center relative overflow-hidden select-none px-6 py-8 md:py-12">
      
      {/* Background radial overlays */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_40%,#000_10%,transparent_100%)]" />
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-omnave-primary/10 blur-[150px] rounded-full" />
      </div>

      {/* TOP HEADER: Progress indicator and Skip */}
      <div className="w-full max-w-lg flex items-center justify-between z-20 relative select-none">
        {/* Progress Dots */}
        <div className="flex gap-1.5 items-center">
          {Array.from({ length: 6 }).map((_, idx) => {
            const stepNum = idx + 1;
            const isCompleted = currentStep > stepNum;
            const isActive = currentStep === stepNum;
            return (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isActive ? 'w-6 bg-omnave-primary shadow-[0_0_8px_rgba(127,34,254,0.6)]' :
                  isCompleted ? 'w-2 bg-omnave-primary/60' : 'w-2 bg-white/10'
                }`}
              />
            );
          })}
        </div>

        {/* Skip button (only shown if not on last screen) */}
        {currentStep < 6 && (
          <button 
            onClick={handleSkip}
            className="text-xs font-semibold text-white/40 hover:text-white transition-colors cursor-pointer"
          >
            Skip
          </button>
        )}
      </div>

      {/* CENTER WORKSPACE: Slide transition card */}
      <div className="flex-1 w-full max-w-lg flex items-center justify-center z-10 my-4 select-none">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full flex justify-center items-center"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.3}
            onDragEnd={(e, info) => {
              if (info.offset.x < -100 && currentStep < 6) {
                nextSlide();
              } else if (info.offset.x > 100 && currentStep > 1) {
                prevSlide();
              }
            }}
          >
            {currentStep === 1 && (
              <div className="bg-[#0f0a1c]/80 border border-white/10 backdrop-blur-md shadow-2xl rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center gap-6 relative overflow-hidden select-none max-w-md w-full">
                {/* Backlight glow */}
                <div className="absolute -top-10 -left-10 w-48 h-48 bg-omnave-primary/20 blur-[80px] pointer-events-none" />
                
                <div className="relative w-20 h-20 flex items-center justify-center mb-2">
                  <div className="absolute inset-0 bg-omnave-primary/25 blur-xl rounded-full" />
                  <Image src="/omnave.png" alt="Omnave Logo" width={80} height={80} className="relative z-10 drop-shadow-2xl" priority />
                </div>

                <div className="flex flex-col gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                    Learn anything.<br/>Forget nothing.
                  </h1>
                  <p className="text-xs sm:text-sm text-white/50 leading-relaxed max-w-xs mx-auto">
                    Turn PDFs, lecture slides, and video links into personalized quizzes, flashcards, and an AI study assistant in seconds.
                  </p>
                </div>

                <button 
                  onClick={nextSlide}
                  className="w-full py-4 mt-2 bg-omnave-primary hover:bg-omnave-primary/95 text-white font-extrabold rounded-2xl shadow-[0_0_15px_rgba(127,34,254,0.4)] hover:shadow-[0_0_25px_rgba(127,34,254,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  Get Started <ArrowRight size={16} />
                </button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="flex flex-col gap-5 w-full select-none">
                <div className="text-center flex flex-col gap-1.5">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Your AI Study Arsenal</h2>
                  <p className="text-xs text-white/50">Four specialized engines working in perfect harmony.</p>
                </div>

                {/* 2x2 Bento Box Grid */}
                <div className="grid grid-cols-2 gap-3.5 w-full">
                  <BentoFeatureCard 
                    icon={<BrainCircuit className="text-purple-400" size={20} />}
                    title="Quiz Generator"
                    desc="Test your recall with custom AI-generated exams."
                  />
                  <BentoFeatureCard 
                    icon={<Layers className="text-indigo-400" size={20} />}
                    title="Smart Cards"
                    desc="Spaced repetition designed to lock in concepts."
                  />
                  <BentoFeatureCard 
                    icon={<FileText className="text-pink-400" size={20} />}
                    title="AI Summaries"
                    desc="Condense textbooks and slides into key insights."
                  />
                  <BentoFeatureCard 
                    icon={<Sparkles className="text-yellow-400" size={20} />}
                    title="Study Partner"
                    desc="Chat with your documents for deep explanations."
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="bg-[#0f0a1c]/80 border border-white/10 backdrop-blur-md shadow-2xl rounded-3xl p-6 sm:p-8 flex flex-col gap-6 relative overflow-hidden select-none w-full max-w-md">
                <div className="text-center flex flex-col gap-1">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">How Omnave Works</h2>
                  <p className="text-xs text-white/50">An automated pipeline from raw files to concept mastery.</p>
                </div>

                {/* Interactive Animated Connectors Pipeline */}
                <div className="relative flex flex-col gap-6 pl-10 py-2 select-none">
                  {/* Glowing connector track line */}
                  <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-white/10 overflow-hidden">
                    <motion.div 
                      className="w-full bg-gradient-to-b from-transparent via-omnave-primary to-transparent h-16 absolute top-0"
                      animate={{
                        top: ['0%', '100%'],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2.2,
                        ease: 'linear',
                      }}
                    />
                  </div>

                  <PipelineStep 
                    stepNum={1} 
                    icon={<Upload size={14} className="text-purple-400" />}
                    title="Upload Material"
                    desc="Drop notes, slide decks, or YouTube links."
                  />
                  <PipelineStep 
                    stepNum={2} 
                    icon={<Sparkles size={14} className="text-indigo-400" />}
                    title="AI Processing"
                    desc="Omnave AI extracts topics, definitions, and stats."
                  />
                  <PipelineStep 
                    stepNum={3} 
                    icon={<BookOpen size={14} className="text-pink-400" />}
                    title="Study Anywhere"
                    desc="Engage with generated flashcards and review tabs."
                  />
                  <PipelineStep 
                    stepNum={4} 
                    icon={<LineChart size={14} className="text-yellow-400" />}
                    title="Track Progress"
                    desc="Watch your streak grow and level up your account."
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="bg-gradient-to-br from-[#2e1a5e]/50 to-[#130E24] border border-purple-500/20 rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center gap-6 relative overflow-hidden shadow-2xl max-w-md w-full select-none">
                {/* Purple radial backlight glow */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/20 blur-[60px] rounded-full pointer-events-none" />
                
                <div className="w-14 h-14 bg-purple-500/20 text-purple-300 rounded-2xl flex items-center justify-center">
                  <Smartphone size={28} />
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">The PWA Edge</h2>
                  <p className="text-xs sm:text-sm text-white/60 leading-relaxed max-w-xs mx-auto">
                    Install Omnave as a Progressive Web App on your phone or desktop for the best experience.
                  </p>
                </div>

                <div className="w-full text-left bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300">✓</div>
                    <span className="text-white/80 font-medium">Launch instantly from your Home Screen</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300">✓</div>
                    <span className="text-white/80 font-medium">Immersive full-screen UI (no URL bars)</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300">✓</div>
                    <span className="text-white/80 font-medium">Faster loading speeds & offline access</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
                  <button 
                    onClick={triggerPwaInstall}
                    className="flex-1 py-3 bg-white text-black font-extrabold rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all text-xs cursor-pointer"
                  >
                    Install App
                  </button>
                  <button 
                    onClick={nextSlide}
                    className="flex-1 py-3 bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 active:scale-[0.98] transition-all text-xs rounded-xl cursor-pointer"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="bg-[#0f0a1c]/80 border border-white/10 backdrop-blur-md shadow-2xl rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center gap-6 relative overflow-hidden max-w-md w-full select-none">
                <div className="absolute -top-10 -left-10 w-48 h-48 bg-omnave-primary/10 blur-[80px] pointer-events-none" />
                
                <div className="w-14 h-14 bg-omnave-primary/20 text-omnave-primary rounded-2xl flex items-center justify-center">
                  <Bell size={28} />
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Sync & Remind</h2>
                  <p className="text-xs sm:text-sm text-white/50 leading-relaxed max-w-xs mx-auto">
                    Save your streak across devices and stay on track with smart study reminders.
                  </p>
                </div>

                <div className="w-full flex flex-col gap-3 mt-1">
                  {/* Account state container */}
                  {user ? (
                    <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-left">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <Check size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider">Account Active</p>
                        <p className="text-[10px] text-emerald-400/70 truncate max-w-[200px]">{user.email}</p>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsAuthOpen(true)}
                      className="w-full py-4 bg-omnave-primary hover:bg-omnave-primary/95 text-white font-extrabold rounded-2xl shadow-[0_0_15px_rgba(127,34,254,0.3)] hover:shadow-[0_0_20px_rgba(127,34,254,0.5)] active:scale-[0.98] transition-all text-xs cursor-pointer flex items-center justify-center gap-2"
                    >
                      💻 Create Free Account
                    </button>
                  )}

                  {/* Notification state container */}
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

                <button 
                  onClick={nextSlide}
                  className="text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer mt-2"
                >
                  Continue to Launchpad →
                </button>
              </div>
            )}

            {currentStep === 6 && (
              <div className="bg-[#0f0a1c]/80 border border-white/10 backdrop-blur-md shadow-2xl rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center gap-6 relative overflow-hidden max-w-md w-full select-none">
                <div className="absolute inset-0 bg-radial-glow opacity-30 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-omnave-primary/30 blur-[100px] rounded-full pointer-events-none" />
                
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 bg-omnave-primary/40 blur-2xl rounded-full animate-pulse" />
                  <span className="text-5xl relative z-10">🚀</span>
                </div>

                <div className="flex flex-col gap-2 relative z-10">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Ready to lock in?</h2>
                  <p className="text-xs sm:text-sm text-white/50 leading-relaxed max-w-xs mx-auto">
                    Upload your first document or lecture link, and let our AI engine generate your personalized study space.
                  </p>
                </div>

                <div className="flex flex-col gap-3 w-full mt-2 relative z-10">
                  <button 
                    onClick={() => handleComplete('upload')}
                    className="w-full py-4 bg-omnave-primary hover:bg-omnave-primary/95 text-white font-extrabold rounded-2xl shadow-[0_0_20px_rgba(127,34,254,0.4)] hover:shadow-[0_0_30px_rgba(127,34,254,0.6)] active:scale-[0.98] transition-all text-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Upload size={14} /> Upload Your First File
                  </button>
                  <button 
                    onClick={() => handleComplete('explore')}
                    className="w-full py-4 bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white active:scale-[0.98] transition-all text-xs rounded-2xl cursor-pointer"
                  >
                    Explore Dashboard
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* BOTTOM FOOTER: Sticky bottom navigation bar for mobile thumb accessibility */}
      <div className="w-full max-w-lg flex items-center justify-between z-20 relative select-none pt-4">
        {currentStep > 1 ? (
          <button 
            onClick={prevSlide}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white/80 rounded-xl transition-all cursor-pointer"
          >
            <ChevronLeft size={16} /> Back
          </button>
        ) : (
          <div className="w-20" /> // Spacer
        )}

        {currentStep < 6 ? (
          <button 
            onClick={nextSlide}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-omnave-primary hover:bg-omnave-primary/90 text-xs font-extrabold text-white rounded-xl shadow-[0_4px_12px_rgba(127,34,254,0.2)] hover:shadow-[0_4px_16px_rgba(127,34,254,0.4)] transition-all cursor-pointer"
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <div className="w-20" /> // Spacer
        )}
      </div>

      {/* AUTHENTICATION OVERLAY */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={async () => {
          setIsAuthOpen(false);
          await refreshUser();
        }} 
        initialView="signup"
      />
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function BentoFeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-[#130E24] border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-md hover:border-white/10 transition-all duration-300 relative overflow-hidden select-none group">
      <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-omnave-primary/5 blur-xl rounded-full group-hover:bg-omnave-primary/10 transition-colors" />
      
      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
        {icon}
      </div>

      <div className="flex flex-col gap-1 text-left">
        <h3 className="text-xs sm:text-sm font-extrabold text-white tracking-tight">{title}</h3>
        <p className="text-[10px] sm:text-xs text-white/40 leading-relaxed font-medium">{desc}</p>
      </div>
    </div>
  );
}

function PipelineStep({ stepNum, icon, title, desc }: { stepNum: number, icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex gap-4 relative z-10 text-left select-none group">
      <div className="absolute -left-10 w-10 h-10 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-[#1A1A24] border border-white/10 flex items-center justify-center text-white/50 font-bold text-xs relative group-hover:border-omnave-primary/30 transition-colors">
          <div className="absolute inset-0 bg-white/5 rounded-full" />
          <span className="relative z-10 text-[9px] font-black text-white/70">{stepNum}</span>
        </div>
      </div>

      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
        {icon}
      </div>

      <div className="flex flex-col gap-0.5">
        <h4 className="text-xs sm:text-sm font-extrabold text-white tracking-tight">{title}</h4>
        <p className="text-[10px] sm:text-xs text-white/40 leading-normal font-medium max-w-xs">{desc}</p>
      </div>
    </div>
  );
}
