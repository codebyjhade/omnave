"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, CalendarDays } from "lucide-react";
import type { HeatmapDay } from "@/hooks/useProgressStats";

interface StudyConsistencyProps {
  currentStreak: number;
  longestStreak: number;
  daysStudiedThisMonth: number;
  heatmapDays: HeatmapDay[];
}

export const StudyConsistency = memo(function StudyConsistency({
  currentStreak,
  longestStreak,
  daysStudiedThisMonth,
  heatmapDays,
}: StudyConsistencyProps) {
  const showMilestone = currentStreak >= 7 || longestStreak >= 7;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-black/[0.4] border border-white/[0.1] backdrop-blur-2xl rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl flex flex-col w-full"
    >
      {/* Ambient Inner Glow */}
      <div className="absolute -top-[50%] -right-[20%] w-[500px] h-[500px] bg-omnave-primary/20 blur-[120px] rounded-full pointer-events-none" aria-hidden="true" />
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame size={14} className="text-orange-400" aria-hidden="true" />
            <span className="text-lg font-black text-white">{currentStreak}</span>
          </div>
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
            Current
          </p>
        </div>
        <div className="text-center border-x border-white/10">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Trophy size={14} className="text-amber-400" aria-hidden="true" />
            <span className="text-lg font-black text-white">{longestStreak}</span>
          </div>
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
            Longest
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CalendarDays size={14} className="text-blue-400" aria-hidden="true" />
            <span className="text-lg font-black text-white">{daysStudiedThisMonth}</span>
          </div>
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
            This Month
          </p>
        </div>
      </div>

      {showMilestone && (
        <p className="text-[11px] text-white/50 font-medium text-center mb-4 border-t border-white/10 pt-3">
          {currentStreak >= 7
            ? "🔥 One week streak — great consistency!"
            : "🏆 Personal best streak achieved."}
        </p>
      )}

      <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-1 px-1">
        <div
          className="grid grid-flow-col grid-rows-7 gap-[3px] w-max"
          role="grid"
          aria-label="Study activity over the last 12 weeks"
        >
          {heatmapDays.map((day, idx) => {
            const level =
              day.count === 0
                ? "bg-white/5 border border-white/10"
                : day.count === 1
                  ? "bg-omnave-primary/20 border border-omnave-primary/30"
                  : day.count === 2
                    ? "bg-omnave-primary/50 border border-omnave-primary/60"
                    : "bg-omnave-primary border border-omnave-primary/80";

            return (
              <div
                key={idx}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[2px] ${level} transition-colors duration-150`}
                title={`${day.count} session${day.count === 1 ? "" : "s"} on ${day.date.toLocaleDateString()}`}
                role="gridcell"
                aria-label={`${day.count} sessions on ${day.date.toLocaleDateString()}`}
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
});
