"use client";

import { useUserContext } from "@/context/UserContext";
import { useProgressStats } from "@/hooks/useProgressStats";
import { WeeklyActivity, SubjectPerformance, StudyConsistency, ProgressEmptyState, ProgressLoading } from "@/components/progress";
import { Flame, Star, Target, Zap } from "lucide-react";

export default function ProgressPage() {
  const { xp, streak, lessons: notes, quizScores, quizzesCount, loading, gamificationStats } = useUserContext();
  const stats = useProgressStats(quizScores, notes, xp, streak, quizzesCount);

  if (loading) return <ProgressLoading/>;
  const hasStudyHistory = stats.overallAvg > 0;

  return (
    <div className="relative min-h-screen">
 
      {/* Main Content - Vertically aligned to top-right global icons */}
      <main className="relative z-10 w-full max-w-[1200px] mx-auto pt-4 pb-40 md:pb-24 lg:px-10 xl:px-12 flex flex-col gap-8 md:gap-12">
        <header className="px-6 md:px-10 lg:px-0 text-left flex flex-col">
          <h2 className="text-[10px] font-extrabold tracking-[0.2em] uppercase text-neutral-500 mb-1.5">
            Analytics
          </h2>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter drop-shadow-lg">
            Your Progress.
          </h1>
        </header>

        {!hasStudyHistory ? (
          <div className="px-6 md:px-10 lg:px-0 w-full">
            <ProgressEmptyState/>
          </div>
        ) : (
          <div className="space-y-8 md:space-y-12 animate-in fade-in duration-500 pb-16 px-6 md:px-10 lg:px-0">
            
            {/* Top Metrics - 4 Grid (Mirrors Home Page Quick Stats) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                { label: "Current Level", value: `Lv. ${gamificationStats.currentLevel}`, icon: Star, color: "text-yellow-400" },
                { label: "Study Points", value: gamificationStats.currentXp, icon: null, color: "text-omnave-primary" },
                { label: "Current Streak", value: `${gamificationStats.currentStreak}d`, icon: Flame, color: "text-orange-400" },
                { label: "Completion", value: `${stats.completionRate}%`, icon: Target, color: "text-emerald-400" }
              ].map((metric, idx) => (
                <div key={idx} className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl rounded-2xl py-4 px-4 flex flex-col items-center justify-center transition-all hover:bg-white/[0.05] shadow-lg">
                  {metric.icon ? (
                    <metric.icon className={`w-6 h-6 ${metric.color} mb-3`} />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`${metric.color} mb-3`}><path d="M2 22 12 2l10 20-10-4Z"/></svg>
                  )}
                  <span className="text-2xl font-bold text-white mb-1">{metric.value}</span>
                  <span className="text-[10px] font-bold tracking-widest text-white/60 uppercase">{metric.label}</span>
                </div>
              ))}
            </div>

            {/* Main Spatial Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
              {/* Left Column */}
              <div className="lg:col-span-7 space-y-8 md:space-y-12">
                <section>
                  <h3 className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase mb-4 pl-2">Weekly Activity</h3>
                  <WeeklyActivity daysStudied={stats.daysStudiedThisWeek} estimatedStudyMinutes={stats.estimatedStudyMinutes} totalSessions={stats.quizzesThisWeek} weeklyData={stats.weeklyData}/>
                </section>
                <section>
                  <h3 className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase mb-4 pl-2">Subject Performance</h3>
                  <SubjectPerformance subjects={stats.subjectScores}/>
                </section>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-5 space-y-8 md:space-y-12">
                <section>
                  <h3 className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase mb-4 pl-2">Study Consistency</h3>
                  <StudyConsistency currentStreak={gamificationStats.currentStreak} daysStudiedThisMonth={stats.daysStudiedThisMonth} heatmapDays={stats.heatmapDays} longestStreak={gamificationStats.longestStreak}/>
                </section>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
