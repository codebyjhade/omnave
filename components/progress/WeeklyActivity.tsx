"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, BookOpen } from "lucide-react";
import type { WeeklyDay } from "@/hooks/useProgressStats";

interface WeeklyActivityProps {
  weeklyData: WeeklyDay[];
  daysStudied: number;
  totalSessions: number;
  estimatedStudyMinutes: number;
}

function formatStudyTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export const WeeklyActivity = memo(function WeeklyActivity({
  weeklyData,
  daysStudied,
  totalSessions,
  estimatedStudyMinutes,
}: WeeklyActivityProps) {
  const maxSessions = Math.max(...weeklyData.map((d) => d.sessions), 1);

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
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen size={14} className="text-white/50 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-black text-white leading-none">{totalSessions}</p>
            <p className="text-[10px] text-white/50 font-semibold mt-0.5">Sessions</p>
          </div>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <Calendar size={14} className="text-white/50 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-black text-white leading-none">{daysStudied}</p>
            <p className="text-[10px] text-white/50 font-semibold mt-0.5">Days Studied</p>
          </div>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <Clock size={14} className="text-white/50 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-black text-white leading-none">
              {formatStudyTime(estimatedStudyMinutes)}
            </p>
            <p className="text-[10px] text-white/50 font-semibold mt-0.5">Study Time</p>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div
          className="flex items-end justify-between gap-1.5 min-w-[320px] md:min-w-0"
          role="img"
          aria-label={`Weekly study activity: ${daysStudied} days studied, ${totalSessions} sessions`}
        >
          {weeklyData.map((day) => {
            const height =
              day.sessions === 0 ? 4 : Math.max(12, (day.sessions / maxSessions) * 40);
            const isActive = day.sessions > 0;

            return (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                <div
                  className={`w-full max-w-[28px] rounded-md transition-all duration-150 ${
                    isActive
                      ? "bg-gradient-to-t from-omnave-primary/50 to-omnave-primary"
                      : "bg-white/5 border border-white/10"
                  }`}
                  style={{ height: `${height}px` }}
                  title={`${day.sessions} session${day.sessions === 1 ? "" : "s"} on ${day.day}`}
                />
                <span className="text-[9px] font-bold text-white/40">{day.day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
});
