"use client";

import { memo } from "react";
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
    <div
      className="bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-lg flex flex-col w-full"
    >
      {/* Weekly Activity Top Stats */}
      <div className="grid grid-cols-3 divide-x divide-white/10 mb-6 select-none">
        <div className="flex flex-col items-center justify-center text-center px-2">
          <div className="flex items-center gap-1.5 text-white/50 mb-1">
            <BookOpen size={12}/> 
            <span className="text-[10px] uppercase tracking-wider font-semibold">Sessions</span>
          </div>
          <span className="text-3xl font-semibold tracking-tight text-white leading-none">
            {totalSessions}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center text-center px-2">
          <div className="flex items-center gap-1.5 text-white/50 mb-1">
            <Calendar size={12}/> 
            <span className="text-[10px] uppercase tracking-wider font-semibold">Days</span>
          </div>
          <span className="text-3xl font-semibold tracking-tight text-white leading-none">
            {daysStudied}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center text-center px-2">
          <div className="flex items-center gap-1.5 text-white/50 mb-1">
            <Clock size={12}/> 
            <span className="text-[10px] uppercase tracking-wider font-semibold">Time</span>
          </div>
          <span className="text-3xl font-semibold tracking-tight text-white leading-none">
            {formatStudyTime(estimatedStudyMinutes)}
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div
          className="flex items-end justify-between gap-1.5 min-w-[320px] md:min-w-0"
          role="img"
          aria-label={`Weekly study activity: ${daysStudied} days studied, ${totalSessions} sessions`}
        >
          {weeklyData.map((day) => {
            const fillHeight = day.sessions > 0
              ? `${Math.max(15, (day.sessions / maxSessions) * 100)}%`
              : "0%";

            return (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-3 min-w-0">
                <div
                  className="relative w-2.5 h-24 bg-white/[0.03] rounded-full overflow-hidden flex items-end"
                  title={`${day.sessions} session${day.sessions === 1 ? "" : "s"} on ${day.day}`}
                >
                  {day.sessions > 0 && (
                    <div 
                      className="w-full bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all duration-300"
                      style={{ height: fillHeight }}
                    />
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 uppercase">{day.day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
