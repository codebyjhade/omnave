"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";

interface GamificationToastProps {
  xpReward: { xp: number; streakBonus: boolean } | null;
}

export const GamificationToast = memo(function GamificationToast({ xpReward }: GamificationToastProps) {
  return (
    <AnimatePresence>
      {xpReward && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-24 left-0 right-0 mx-auto w-max z-50 flex flex-col items-center pointer-events-none"
        >
          <div className="bg-[#151C2C] text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center space-x-4 border border-white/10">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Session Complete</span>
              <div className="flex items-center space-x-3">
                <span className="text-xl font-black text-omnave-primary">+{xpReward.xp} XP</span>
                {xpReward.streakBonus && (
                  <>
                    <span className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                    <span className="text-sm font-bold text-amber-400 flex items-center">
                      <Flame size={16} className="mr-1 fill-amber-400" /> Streak Kept!
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
