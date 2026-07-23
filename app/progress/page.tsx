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
      <main className="relative z-10 w-full max-w-[1200px] mx-auto pt-6 pb-24 lg:px-10 xl:px-12">
        <header className="px-6 md:px-10 lg:px-0 mb-6">
          <p className="text-[11px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-2 m-0 leading-none">Analytics</p>
          <div className="flex items-center min-h-[40px] gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white leading-none m-0">Your Progress</h1>
          </div>
        </header>

        {!hasStudyHistory ? (
          <div className="px-6 md:px-10 lg:px-0 w-full">
            <ProgressEmptyState/>
          </div>
        ) : (
          <div className="px-6 md:px-10 lg:px-0">
            
            {/* Top Metrics - 4 Grid (Mirrors Home Page Quick Stats) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                { label: "Current Level", value: `Lv. ${gamificationStats.currentLevel}`, icon: Star },
                { label: "Study Points", value: gamificationStats.currentXp, icon: null },
                { label: "Current Streak", value: `${gamificationStats.currentStreak}d`, icon: Flame },
                { label: "Completion", value: `${stats.completionRate}%`, icon: Target }
              ].map((metric, idx) => (
                <div key={idx} className="bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 flex flex-col items-center justify-center">
                  {metric.icon ? (
                    <metric.icon className="w-6 h-6 text-zinc-500 mb-3" />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 mb-3"><path d="M2 22 12 2l10 20-10-4Z"/></svg>
                  )}
                  <span className="text-3xl font-semibold tracking-tight text-white mb-1">{metric.value}</span>
                  <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">{metric.label}</span>
                </div>
              ))}
            </div>

            {/* Main Spatial Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 mt-8 md:mt-12">
              {/* Left Column */}
              <div className="lg:col-span-7 space-y-8 md:space-y-12">
                <section>
                  <h3 className="text-[11px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-4">Weekly Activity</h3>
                  <WeeklyActivity daysStudied={stats.daysStudiedThisWeek} estimatedStudyMinutes={stats.estimatedStudyMinutes} totalSessions={stats.quizzesThisWeek} weeklyData={stats.weeklyData}/>
                </section>
                <section>
                  <h3 className="text-[11px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-4">Subject Performance</h3>
                  <SubjectPerformance subjects={stats.subjectScores}/>
                </section>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-5 space-y-8 md:space-y-12">
                <section>
                  <h3 className="text-[11px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-4">Study Consistency</h3>
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
