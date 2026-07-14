"use client";

import { useUserContext } from "@/context/UserContext";
import { useProgressStats } from "@/hooks/useProgressStats";

export default function ProgressOverview() {
  const { xp, streak, lessons: notes, quizScores, quizzesCount, gamificationStats } = useUserContext();
  const stats = useProgressStats(quizScores, notes, xp, streak, quizzesCount);

  // Convert sessions to chart height percentages (capped at 100)
  const chartData = stats.weeklyData.map((d) => Math.min(d.sessions * 25, 100));
  
  const studyHours = Math.floor(stats.estimatedStudyMinutes / 60);
  const studyMins = stats.estimatedStudyMinutes % 60;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header */}
      <span className="text-[10px] font-extrabold tracking-[0.2em] text-neutral-500 uppercase pl-2 mb-1">
        Today's Progress
      </span>

      {/* Main Bar Chart Card */}
      <div className="w-full p-6 bg-black/[0.4] border border-white/[0.1] backdrop-blur-2xl rounded-3xl flex flex-col gap-6 relative overflow-hidden shadow-2xl">
        {/* Ambient Inner Glow */}
        <div className="absolute -bottom-[20%] -left-[10%] w-[250px] h-[250px] bg-omnave-primary/15 blur-[90px] rounded-full pointer-events-none" aria-hidden="true" />
        
        <div className="flex justify-between items-start relative z-10">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-white/40 font-semibold">Study Time trend</span>
            <span className="text-2xl font-bold text-white tracking-tight">
              {studyHours}h {studyMins}m <span className="text-sm font-normal text-white/40">this week</span>
            </span>
          </div>
          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white">
            Level {gamificationStats.currentLevel}
          </div>
        </div>

        {/* CSS Bar Chart */}
        <div className="h-24 w-full flex items-end justify-between gap-2 relative z-10">
          {chartData.map((height, i) => (
            <div 
              key={i} 
              className={`w-full rounded-t-md transition-all duration-500 hover:brightness-125 border-t border-white/10 ${
                i === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)
                  ? "bg-gradient-to-t from-omnave-primary/40 to-omnave-primary shadow-[0_-5px_20px_rgba(127,34,254,0.5)]" 
                  : "bg-white/10"
              }`}
              style={{ height: `${height || 5}%` }} // Default min height 5% for empty days
            />
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        
        {/* Streak */}
        <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center text-center min-h-[110px] transition-all hover:bg-white/[0.05] shadow-lg overflow-hidden">
          <div className="text-white/40 mb-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-1.5 whitespace-nowrap">
            Streak
          </span>
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-black text-white tracking-tighter leading-none">
              {gamificationStats.currentStreak}
            </span>
            <span className="text-[9px] font-medium text-white/40 leading-none uppercase tracking-wider">days</span>
          </div>
        </div>

        {/* XP */}
        <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center text-center min-h-[110px] transition-all hover:bg-white/[0.05] shadow-lg overflow-hidden">
          <div className="text-white/40 mb-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22 12 2l10 20-10-4Z"/></svg>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-1.5 whitespace-nowrap">
            Total XP
          </span>
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-black text-white tracking-tighter leading-none">
              {gamificationStats.currentXp >= 1000 ? `${(gamificationStats.currentXp / 1000).toFixed(1)}k` : gamificationStats.currentXp}
            </span>
            <span className="text-[9px] font-medium text-white/40 leading-none uppercase tracking-wider">earned</span>
          </div>
        </div>

        {/* Completion */}
        <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center text-center min-h-[110px] transition-all hover:bg-white/[0.05] shadow-lg overflow-hidden col-span-2 lg:col-span-1">
          <div className="text-omnave-primary mb-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-omnave-primary mb-1.5 whitespace-nowrap">
            Completed
          </span>
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-black text-white tracking-tighter leading-none">
              {stats.completionRate}%
            </span>
            <span className="text-[9px] font-medium text-white/40 leading-none uppercase tracking-wider">ratio</span>
          </div>
        </div>

      </div>
    </div>
  );
}