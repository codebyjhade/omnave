'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleUpgrade = () => {
    toast('Upgrade flow initialized! Redirecting to checkout...', 'info');
  };

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
          {/* Glassmorphism Blur Backdrop */}
          <motion.div
            key="upgrade-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            key="upgrade-modal"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
            className="relative w-full max-w-[760px] max-h-[90dvh] overflow-y-auto rounded-[32px] border border-white/10 bg-[#0f0a21]/90 p-6 sm:p-10 pb-12 sm:pb-14 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl z-10 text-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upgrade-title"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-6 top-6 z-50 rounded-xl border border-white/5 bg-white/[0.02] p-2 text-white/50 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>

            {/* Glowing Accent Blur */}
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-72 h-72 bg-omnave-primary/20 rounded-full blur-[100px] pointer-events-none" />

            {/* Title / Header */}
            <div className="relative mb-8 text-center">
              <span className="px-3 py-1 bg-omnave-primary/20 text-omnave-primary text-[10px] font-bold tracking-wider uppercase rounded-full border border-omnave-primary/30">
                Limit Reached
              </span>
              <h2
                id="upgrade-title"
                className="mt-3 text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight"
              >
                You&apos;ve hit your free limit!<br />Ready to go limitless?
              </h2>
              <p className="mt-2 text-sm text-white/60">
                You&apos;re doing great, but you could be unstoppable.
              </p>
            </div>

            {/* Side-by-Side Comparison (Pricing Contrast) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch mb-8 relative">
              {/* Card 1: Free Tier (The Anchor) */}
              <div className="flex flex-col p-6 rounded-2xl border border-white/5 bg-white/[0.01] text-left opacity-70 transition-opacity hover:opacity-85">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-white/50 tracking-wider uppercase">
                    Free Forever
                  </h3>
                  <div className="flex items-baseline mt-1 text-white/80">
                    <span className="text-3xl font-black">$0</span>
                    <span className="ml-1 text-xs text-white/40">/ month</span>
                  </div>
                </div>

                {/* Features list */}
                <ul className="space-y-3.5 my-auto text-sm text-white/70">
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-white/40 shrink-0" />
                    <span>100 Pages / week</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-white/40 shrink-0" />
                    <span>25 Flashcards / lesson</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-white/40 shrink-0" />
                    <span>15 AI Messages / day</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-white/30 line-through">
                    <span className="shrink-0 text-red-500/50 text-[16px] leading-none font-bold">✗</span>
                    <span>Master Exams (Locked)</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-white/30 line-through">
                    <span className="shrink-0 text-red-500/50 text-[16px] leading-none font-bold">✗</span>
                    <span>Priority AI Speed (Locked)</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-white/30 line-through">
                    <span className="shrink-0 text-red-500/50 text-[16px] leading-none font-bold">✗</span>
                    <span>Offline Study Mode (Locked)</span>
                  </li>
                </ul>
              </div>

              {/* Card 2: Omnave PRO (The Target) */}
              <div className="relative flex flex-col p-6 rounded-2xl border border-omnave-primary bg-[#130d2d]/60 text-left shadow-[0_0_40px_rgba(127,34,254,0.15)] hover:scale-[1.01] transition-transform duration-300">
                {/* Popular Ribbon/Badge */}
                <div className="absolute -top-3 right-4 bg-omnave-primary text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-[0_0_15px_rgba(127,34,254,0.5)]">
                  Highly Recommended
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-black text-omnave-primary tracking-wider uppercase">
                    Omnave PRO
                  </h3>
                  <div className="flex items-baseline mt-1 text-white">
                    <span className="text-3xl font-black">₱149</span>
                    <span className="ml-1 text-xs text-white/50">/ month</span>
                  </div>
                  <p className="text-[10px] text-white/40 mt-0.5">
                    Billed annually at ₱1,188 — That&apos;s just ₱99/mo!
                  </p>
                </div>

                {/* Features list */}
                <ul className="space-y-3.5 mb-6 text-sm text-white">
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-omnave-primary shrink-0 filter drop-shadow-[0_0_5px_rgba(127,34,254,0.5)]" />
                    <span><strong className="text-purple-300">Unlimited</strong> PDF Uploads</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-omnave-primary shrink-0 filter drop-shadow-[0_0_5px_rgba(127,34,254,0.5)]" />
                    <span><strong className="text-purple-300">Unlimited</strong> Flashcards & Quizzes</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-omnave-primary shrink-0 filter drop-shadow-[0_0_5px_rgba(127,34,254,0.5)]" />
                    <span><strong className="text-purple-300">Unlimited</strong> AI Assistant</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-omnave-primary shrink-0 filter drop-shadow-[0_0_5px_rgba(127,34,254,0.5)]" />
                    <span><strong className="text-purple-300">Unlock</strong> 80-Item Master Exams</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-omnave-primary shrink-0 filter drop-shadow-[0_0_5px_rgba(127,34,254,0.5)]" />
                    <span><strong className="text-purple-300">Offline</strong> Study Mode</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-omnave-primary shrink-0 filter drop-shadow-[0_0_5px_rgba(127,34,254,0.5)]" />
                    <span><strong className="text-purple-300">Priority</strong> AI Processing Speed</span>
                  </li>
                </ul>

                {/* Pulse Button CTA */}
                <motion.button
                  animate={{
                    scale: [1, 1.02, 1],
                    boxShadow: [
                      '0 0 20px rgba(127, 34, 254, 0.4)',
                      '0 0 35px rgba(127, 34, 254, 0.7)',
                      '0 0 20px rgba(127, 34, 254, 0.4)',
                    ],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: 'easeInOut',
                  }}
                  onClick={handleUpgrade}
                  className="w-full mt-auto py-3.5 rounded-xl bg-omnave-primary hover:bg-omnave-primary/95 text-white font-extrabold text-sm transition-colors duration-200 cursor-pointer shadow-[0_0_20px_rgba(127,34,254,0.4)] text-center"
                >
                  Upgrade to Pro Now
                </motion.button>
              </div>
            </div>

            {/* Pennies a Day Closer */}
            <p className="text-xs text-white/50 italic mb-6">
              &quot;Master your exams for less than the price of a campus iced coffee.&quot;
            </p>

            {/* Dismissal Link */}
            <button
              onClick={onClose}
              className="text-xs font-semibold text-white/40 hover:text-white/60 transition-colors cursor-pointer"
            >
              No thanks, I&apos;ll stick to the limits.
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
