"use client";

import { useUserContext } from "@/context/UserContext";
import { Skeleton } from "@/components/Skeleton";

export default function ProgressOverview() {
  const { gamificationStats, lessons, loading } = useUserContext();

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 w-full">
        <Skeleton className="h-[110px] w-full rounded-2xl" />
        <Skeleton className="h-[110px] w-full rounded-2xl" />
      </div>
    );
  }

  const isZeroState = lessons.length === 0;

  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      
      {/* Streak */}
      <div className={`${
        isZeroState 
          ? "bg-[#130E24] border border-white/5" 
          : "bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05]"
      } backdrop-blur-xl rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center text-center min-h-[110px] transition-all shadow-lg overflow-hidden`}>
        <div className="text-white/40 mb-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-1.5 whitespace-nowrap">
          Streak
        </span>
        <div className="flex flex-col items-center gap-1">
          <span className={`text-3xl font-black tracking-tighter leading-none ${isZeroState ? "text-white/20" : "text-white"}`}>
            {isZeroState ? 0 : gamificationStats.currentStreak}
          </span>
          <span className="text-[9px] font-medium text-white/40 leading-none uppercase tracking-wider">days</span>
        </div>
        {isZeroState && (
          <span className="text-[10px] text-white/40 uppercase tracking-widest mt-2">
            Complete your first lesson to begin.
          </span>
        )}
      </div>

      {/* XP */}
      <div className={`${
        isZeroState 
          ? "bg-[#130E24] border border-white/5" 
          : "bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05]"
      } backdrop-blur-xl rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center text-center min-h-[110px] transition-all shadow-lg overflow-hidden`}>
        <div className="text-white/40 mb-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22 12 2l10 20-10-4Z"/></svg>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-1.5 whitespace-nowrap">
          Total XP
        </span>
        <div className="flex flex-col items-center gap-1">
          <span className={`text-3xl font-black tracking-tighter leading-none ${isZeroState ? "text-white/20" : "text-white"}`}>
            {isZeroState ? 0 : (gamificationStats.currentXp >= 1000 ? `${(gamificationStats.currentXp / 1000).toFixed(1)}k` : gamificationStats.currentXp)}
          </span>
          <span className="text-[9px] font-medium text-white/40 leading-none uppercase tracking-wider">earned</span>
        </div>
        {isZeroState && (
          <span className="text-[10px] text-white/40 uppercase tracking-widest mt-2">
            Complete your first lesson to begin.
          </span>
        )}
      </div>

    </div>
  );
}