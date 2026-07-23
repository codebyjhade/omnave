"use client";

import { memo } from "react";
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
    <div
      className="bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-lg flex flex-col w-full"
    >
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame size={14} className="text-zinc-500" aria-hidden="true" />
            <span className="text-lg font-black text-white">{currentStreak}</span>
          </div>
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
            Current
          </p>
        </div>
        <div className="text-center border-x border-white/10">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Trophy size={14} className="text-zinc-500" aria-hidden="true" />
            <span className="text-lg font-black text-white">{longestStreak}</span>
          </div>
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
            Longest
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CalendarDays size={14} className="text-zinc-500" aria-hidden="true" />
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
                ? "bg-white/[0.02] border border-white/[0.02] rounded-sm"
                : day.count === 1
                  ? "bg-purple-500/20 border border-purple-500/30 rounded-sm"
                  : day.count === 2
                    ? "bg-purple-500/50 border border-purple-500/60 rounded-sm"
                    : "bg-purple-500 border border-purple-500/80 shadow-[0_0_8px_rgba(168,85,247,0.4)] rounded-sm";

            return (
              <div
                key={idx}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${level} transition-colors duration-150`}
                title={`${day.count} session${day.count === 1 ? "" : "s"} on ${day.date.toLocaleDateString()}`}
                role="gridcell"
                aria-label={`${day.count} sessions on ${day.date.toLocaleDateString()}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});
