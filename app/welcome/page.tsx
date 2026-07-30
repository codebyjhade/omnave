'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import dynamic from "next/dynamic";
import { 
  FileText, 
  Sparkles, 
  BrainCircuit, 
  Layers
} from "lucide-react";

const AuthModal = dynamic(() => import("@/components/AuthModal"), { ssr: false });

export default function WelcomePage() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  
  // Auth Modal State
  const [authConfig, setAuthConfig] = useState<{ isOpen: boolean; mode: 'login' | 'signup' }>({
    isOpen: false,
    mode: 'signup'
  });

  // Session Check & Redirect
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

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthConfig({ isOpen: true, mode });
  };

  if (hasSession === null) {
    return (
      <main className="min-h-[100dvh] bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#6949a8] border-t-transparent rounded-full" />
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-white relative flex flex-col justify-between px-6 pt-12 pb-8 overflow-hidden font-sans antialiased">
      
      {/* Top Section: The Hero Graphic Container */}
      <div className="w-full flex-1 flex flex-col items-center justify-center max-h-[50vh] mt-4">
        <div className="relative border border-white/10 bg-[#0f0a1c]/70 backdrop-blur-md rounded-3xl p-6 shadow-2xl flex flex-col gap-5 overflow-hidden w-full max-w-sm aspect-[4/3] justify-center select-none">
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
              <span className="text-[9px] font-black tracking-wider text-purple-400/80 uppercase font-poppins">Study.pdf</span>
            </motion.div>

            {/* Glowing animated transfer streams */}
            <div className="flex-1 flex flex-col gap-3 relative h-16 justify-center items-center overflow-hidden">
              <div className="w-full h-[1px] bg-gradient-to-r from-purple-500/10 via-purple-500/50 to-emerald-500/10 relative">
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: ["-100%", "1100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute h-[3px] w-[10%] bg-[#6949a8] blur-[2px] -top-[1px] left-0 transform-gpu"
                />
              </div>
              <div className="w-full h-[1px] bg-gradient-to-r from-purple-500/10 via-purple-500/50 to-amber-500/10 relative">
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
                className="flex items-center gap-2 py-2 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[10px] font-extrabold shadow-sm w-36"
              >
                <BrainCircuit size={14} />
                <span className="font-poppins">Interactive Quiz</span>
              </motion.div>
              {/* Flashcard card */}
              <motion.div 
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                className="flex items-center gap-2 py-2 px-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-[10px] font-extrabold shadow-sm w-36"
              >
                <Layers size={14} />
                <span className="font-poppins">Spaced Flashcard</span>
              </motion.div>
              {/* Assistant card */}
              <motion.div 
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                className="flex items-center gap-2 py-2 px-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-[10px] font-extrabold shadow-sm w-36"
              >
                <Sparkles size={14} />
                <span className="font-poppins">AI Study Guide</span>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Typography & Actions */}
      <div className="w-full flex flex-col gap-4 mt-8 pb-[env(safe-area-inset-bottom)]">
        
        {/* Typography */}
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter leading-[1.1] text-center font-poppins">
          Learn anything.<br />
          <span className="bg-gradient-to-r from-[#6949a8] to-indigo-500 bg-clip-text text-transparent">
            Forget nothing.
          </span>
        </h1>
        
        <p className="text-[15px] text-gray-500 font-medium text-center leading-relaxed px-2 mb-4 font-poppins">
          Omnave uses AI to instantly generate interactive quizzes, spaced flashcards, and study guides in under 10 seconds.
        </p>

        {/* Action Buttons */}
        <button 
          onClick={() => openAuth('signup')} 
          className="w-full bg-[#6949a8] hover:bg-[#5a3d94] text-white py-4 rounded-2xl text-[16px] font-bold shadow-[0px_8px_16px_rgba(105,73,168,0.25)] transition-all cursor-pointer"
        >
          Get Started Free
        </button>
        
        <button 
          onClick={() => openAuth('login')} 
          className="w-full bg-purple-50 hover:bg-purple-100 text-[#6949a8] py-4 rounded-2xl text-[16px] font-bold transition-all cursor-pointer"
        >
          I already have an account
        </button>
      </div>

      {/* Auth Modal Overlay */}
      <AnimatePresence>
        {authConfig.isOpen && (
          <AuthModal
            isOpen={authConfig.isOpen}
            initialView={authConfig.mode}
            onClose={() => setAuthConfig((current) => ({ ...current, isOpen: false }))}
          />
        )}
      </AnimatePresence>

    </main>
  );
}
