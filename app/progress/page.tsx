"use client";

import { useUserContext } from "@/context/UserContext";
import { useProgressStats } from "@/hooks/useProgressStats";
import { ProgressLoading } from "@/components/progress";
import { 
  Flame, 
  Star, 
  Target, 
  Zap, 
  Brain, 
  Clock, 
  BookOpen, 
  Award, 
  Layers, 
  CalendarDays,
  FolderOpen,
  BrainCircuit,
  Infinity as InfinityIcon,
  Crown,
  Upload,
  GraduationCap,
  Trophy,
  Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getLocalDateString } from "@/lib/gamification";

export default function ProgressPage() {
  const router = useRouter();
  const { 
    xp, 
    streak, 
    lessons: notes, 
    quizScores, 
    quizzesCount, 
    loading, 
    gamificationStats,
    achievements,
    xpHistory
  } = useUserContext();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = useProgressStats(quizScores, notes, xp, streak, quizzesCount);

  if (loading) return <ProgressLoading />;

  const studiedToday = gamificationStats.lastStudyDate === getLocalDateString();

  // Recent Quizzes
  const recentScores = [...quizScores]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  // Memory Retention calculations
  const lastStudyDate = gamificationStats.lastStudyDate;
  const lastStudyDiffDays = lastStudyDate 
    ? Math.max(0, Math.floor((Date.now() - new Date(lastStudyDate).getTime()) / (1000 * 3600 * 24))) 
    : 0;
  
  // Calculate average score dynamically or fallback to overall average
  const avgScore = stats.overallAvg || 0;
  const bestScore = stats.overallBest || 0;
  const retentionRate = quizzesCount > 0 
    ? Math.max(30, Math.min(100, Math.round(avgScore * Math.pow(0.98, lastStudyDiffDays)))) 
    : 100;

  const optimalCount = notes.filter((l) => {
    const scores = quizScores.filter((s) => s.lesson_id === l.id);
    if (scores.length === 0) return false;
    return Math.max(...scores.map((s) => s.percentage)) >= 80;
  }).length;

  const fadingCount = notes.filter((l) => {
    const scores = quizScores.filter((s) => s.lesson_id === l.id);
    if (scores.length === 0) return false;
    const maxScore = Math.max(...scores.map((s) => s.percentage));
    return maxScore >= 50 && maxScore < 80;
  }).length;

  const criticalCount = notes.filter((l) => {
    const scores = quizScores.filter((s) => s.lesson_id === l.id);
    if (scores.length === 0) return false;
    const maxScore = Math.max(...scores.map((s) => s.percentage));
    return maxScore > 0 && maxScore < 50;
  }).length;

  // Flashcards Count helper
  const flashcardsCount = notes.reduce(
    (acc, l) => acc + (Array.isArray(l.flashcards) ? l.flashcards.length : 0),
    0
  );

  const box1 = Math.round(flashcardsCount * 0.35);
  const box2 = Math.round(flashcardsCount * 0.45);
  const box3 = Math.round(flashcardsCount * 0.20);

  // Achievement Icon mapping helper
  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case "Upload": return Upload;
      case "FolderOpen": return FolderOpen;
      case "BookOpen": return BookOpen;
      case "GraduationCap": return GraduationCap;
      case "BrainCircuit": return BrainCircuit;
      case "Award": return Award;
      case "Layers": return Layers;
      case "ListCollapse": return Layers;
      case "Flame": return Flame;
      case "CalendarDays": return CalendarDays;
      case "Infinity": return InfinityIcon;
      case "Sparkles": return Sparkles;
      case "Crown": return Crown;
      default: return Trophy;
    }
  };

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

        {/* DO NOT TOUCH THE <main> OR <header> ABOVE THIS SECTION */}
        <div className="px-6 md:px-10 lg:px-0 flex flex-col gap-6 mt-4">
          
          {/* DYNAMIC 12-COLUMN BENTO GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* ROW 1: Analytics KPI Row (Compact Status Bar) */}
            <div className="lg:col-span-12 bg-[#111111]/50 border border-white/[0.06] rounded-3xl py-4 px-6 transition-colors duration-300 hover:border-white/[0.12]">
              
              {/* Desktop/Tablet Horizontal Layout */}
              <div className="hidden md:flex items-center justify-between w-full">
                
                {/* Level (Left Group - Vertically Staggered) */}
                <div className="w-[35%] flex flex-col justify-center pr-6">
                  <span className="text-2xl font-semibold tracking-tight text-white leading-none mb-1.5">Lv. {gamificationStats.currentLevel}</span>
                  <div className="w-full flex flex-col gap-1">
                    {/* Razor-Thin Level Progress Bar */}
                    <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all duration-1000 ease-out"
                        style={{ width: mounted ? `${gamificationStats.xpProgress}%` : "0%" }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider leading-none">
                      {xp.toLocaleString()} XP / {(gamificationStats.currentXp + gamificationStats.xpNeeded).toLocaleString()} XP ({gamificationStats.xpProgress}% XP)
                    </span>
                  </div>
                </div>

                <div className="border-l border-white/[0.06] h-8 shrink-0 mx-6" />

                {/* Streak */}
                <div className="flex-1 flex flex-col justify-between h-9">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block leading-none mb-1">Streak</span>
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-2xl font-semibold tracking-tight text-white leading-none">{streak}d</span>
                    <Flame size={16} strokeWidth={1.5} className={streak > 0 && studiedToday ? "text-purple-400 fill-purple-400/20" : "text-zinc-500"} />
                  </div>
                </div>

                <div className="border-l border-white/[0.06] h-8 shrink-0 mx-6" />

                {/* Completion */}
                <div className="flex-1 flex flex-col justify-between h-9">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block leading-none mb-1">Completion</span>
                  <span className="text-2xl font-semibold tracking-tight text-white leading-none">{stats.completionRate}%</span>
                </div>

                <div className="border-l border-white/[0.06] h-8 shrink-0 mx-6" />

                {/* Study Days */}
                <div className="flex-1 flex flex-col justify-between h-9">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block leading-none mb-1">Study Days</span>
                  <span className="text-2xl font-semibold tracking-tight text-white leading-none">{gamificationStats.totalStudyDays}</span>
                </div>

                <div className="border-l border-white/[0.06] h-8 shrink-0 mx-6" />

                {/* Lessons */}
                <div className="flex-1 flex flex-col justify-between h-9">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block leading-none mb-1">Lessons</span>
                  <span className="text-2xl font-semibold tracking-tight text-white leading-none">{gamificationStats.lessonsCompleted}</span>
                </div>
              </div>

              {/* Mobile Ultra-Compact Layout */}
              <div className="flex md:hidden flex-col w-full">
                {/* Row 1: Level and XP bar stacked vertically */}
                <div className="flex flex-col pb-3 border-b border-white/[0.06] gap-1.5">
                  <span className="text-xl font-semibold tracking-tight text-white leading-none">Lv. {gamificationStats.currentLevel}</span>
                  <div className="w-full flex flex-col gap-1">
                    <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all duration-1000 ease-out"
                        style={{ width: mounted ? `${gamificationStats.xpProgress}%` : "0%" }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[8px] font-bold text-zinc-500 uppercase tracking-wider leading-none">
                      <span>{xp.toLocaleString()} XP / {(gamificationStats.currentXp + gamificationStats.xpNeeded).toLocaleString()} XP</span>
                      <span>{gamificationStats.xpProgress}%</span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Tight 2x2 grid */}
                <div className="grid grid-cols-2 gap-px bg-white/[0.04] rounded-xl overflow-hidden border border-white/[0.04] w-full mt-3">
                  <div className="bg-[#111111]/50 p-2.5 flex flex-col justify-between h-14">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Streak</span>
                    <div className="flex items-center gap-1 leading-none mt-1">
                      <span className="text-lg font-semibold text-white">{streak}d</span>
                      <Flame size={12} strokeWidth={1.5} className={streak > 0 && studiedToday ? "text-purple-400 fill-purple-400/20" : "text-zinc-500"} />
                    </div>
                  </div>
                  <div className="bg-[#111111]/50 p-2.5 flex flex-col justify-between h-14">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Completion</span>
                    <span className="text-lg font-semibold text-white mt-1 leading-none">{stats.completionRate}%</span>
                  </div>
                  <div className="bg-[#111111]/50 p-2.5 flex flex-col justify-between h-14">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Study Days</span>
                    <span className="text-lg font-semibold text-white mt-1 leading-none">{gamificationStats.totalStudyDays}</span>
                  </div>
                  <div className="bg-[#111111]/50 p-2.5 flex flex-col justify-between h-14">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Lessons</span>
                    <span className="text-lg font-semibold text-white mt-1 leading-none">{gamificationStats.lessonsCompleted}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* ROW 2: Heatmap & Study Time (Borderless, sitting directly on main background) */}
            <div className="lg:col-span-12 py-4 flex flex-col md:flex-row gap-8 justify-between items-stretch select-none">
              
              {/* Heatmap Area */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Weekly Activity Heatmap</span>
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase">Last 12 Weeks</span>
                  </div>

                  <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-1 px-1 py-1">
                    <div
                      className="grid grid-flow-col grid-rows-7 gap-[3px] w-max"
                      role="grid"
                      aria-label="Activity heatmap over the last 12 weeks"
                    >
                      {stats.heatmapDays.map((day, idx) => {
                        const level =
                          day.count === 0
                            ? "bg-white/[0.02] border border-white/[0.01]"
                            : day.count === 1
                              ? "bg-purple-500/20 border border-purple-500/30"
                              : day.count === 2
                                ? "bg-purple-500/50 border border-purple-500/60"
                                : "bg-purple-500 border border-purple-500/80 shadow-[0_0_8px_rgba(168,85,247,0.4)]";

                        return (
                          <div
                            key={idx}
                            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[2px] ${level} transition-colors duration-150`}
                            title={`${day.count} session${day.count === 1 ? "" : "s"} on ${day.date.toLocaleDateString()}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 text-[10px] text-zinc-500 select-none">
                  <span>Streak: <strong className="text-white">{streak}d</strong> (max: {stats.longestStreak}d)</span>
                  <div className="flex items-center gap-1">
                    <span>Less</span>
                    <div className="w-2 h-2 bg-white/[0.02] rounded-[1px]" />
                    <div className="w-2 h-2 bg-purple-500/20 rounded-[1px]" />
                    <div className="w-2 h-2 bg-purple-500/50 rounded-[1px]" />
                    <div className="w-2 h-2 bg-purple-500 rounded-[1px]" />
                    <span>More</span>
                  </div>
                </div>
              </div>

              {/* Study Time Area */}
              <div className="w-full md:w-[260px] border-t md:border-t-0 md:border-l border-white/[0.04] pt-6 md:pt-0 md:pl-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Study Time</span>
                    <Clock size={14} className="text-zinc-500" />
                  </div>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-semibold text-white leading-none">
                      {gamificationStats.studyMinutes >= 60 
                        ? `${Math.floor(gamificationStats.studyMinutes / 60)}h ${gamificationStats.studyMinutes % 60}m` 
                        : `${gamificationStats.studyMinutes}m`}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider leading-none">Total</span>
                  </div>
                </div>

                <div className="flex items-end justify-between h-14 px-1 gap-1 select-none">
                  {stats.weeklyData.map((day) => {
                    const maxSessions = Math.max(...stats.weeklyData.map((d) => d.sessions), 1);
                    const fillHeight = day.sessions > 0
                      ? `${Math.max(15, (day.sessions / maxSessions) * 100)}%`
                      : "0%";

                    return (
                      <div key={day.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end min-w-0">
                        {/* Sleek Vertical Pill */}
                        <div className="w-1.5 h-10 bg-white/[0.02] rounded-full overflow-hidden flex items-end">
                          {day.sessions > 0 && (
                            <div 
                              className="w-full bg-purple-500 rounded-full"
                              style={{ height: fillHeight }}
                            />
                          )}
                        </div>
                        <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">{day.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* ROW 3: Re-Containerized Bento Cards */}
            
            {/* Knowledge Performance Card (Left Col - 6 cols) */}
            <div className="lg:col-span-6 bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 transition-all duration-500 ease-out hover:border-white/[0.15] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-4 block border-b border-white/[0.04] pb-2">Performance & Flashcards</span>
                <div className="grid grid-cols-2 gap-6 mt-2">
                  
                  {/* Quiz Performance */}
                  <div className="flex flex-col justify-between h-full min-h-[140px]">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase block mb-3">Quizzes</span>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <span className="text-[9px] font-bold text-zinc-500 uppercase block tracking-wider">Average</span>
                          <span className="text-xl font-semibold text-white mt-1 block leading-none">{avgScore}%</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-zinc-500 uppercase block tracking-wider">Best</span>
                          <span className="text-xl font-semibold text-white mt-1 block leading-none">{bestScore}%</span>
                        </div>
                      </div>

                      {recentScores.length === 0 ? (
                        <div className="py-2 text-center text-xs text-zinc-500 font-medium">
                          No quiz data yet.
                        </div>
                      ) : (
                        <div className="flex items-end justify-between h-10 px-1 gap-2 select-none">
                          {[...recentScores].reverse().slice(-5).map((score, i) => (
                            <div key={score.id || i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                              <div className="w-1.5 h-5 bg-white/[0.03] rounded-full overflow-hidden flex items-end">
                                <div 
                                  className="w-full bg-purple-500 rounded-full"
                                  style={{ height: `${score.percentage}%` }}
                                />
                              </div>
                              <span className="text-[8px] text-zinc-500 font-semibold">Q{i + 1}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/[0.04] text-[9px] font-bold text-zinc-500 uppercase tracking-wider flex justify-between">
                      <span>Runs: {quizzesCount}</span>
                      <span>Perfect: {gamificationStats.perfectScores}</span>
                    </div>
                  </div>

                  {/* Flashcard Analytics */}
                  <div className="flex flex-col justify-between h-full min-h-[140px]">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase block mb-3">Flashcards</span>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <span className="text-[9px] font-bold text-zinc-500 uppercase block tracking-wider">Reviewed</span>
                          <span className="text-xl font-semibold text-white mt-1 block leading-none">{gamificationStats.flashcardsReviewed}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-zinc-500 uppercase block tracking-wider">Decks</span>
                          <span className="text-xl font-semibold text-white mt-1 block leading-none">{notes.length}</span>
                        </div>
                      </div>

                      <div className="space-y-1 mt-1">
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between text-[8px] font-semibold">
                            <span className="text-zinc-500 uppercase">Box 1</span>
                            <span className="text-zinc-300">{box1} cards</span>
                          </div>
                          <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-700/60" style={{ width: "35%" }} />
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between text-[8px] font-semibold">
                            <span className="text-zinc-500 uppercase">Box 2</span>
                            <span className="text-zinc-300">{box2} cards</span>
                          </div>
                          <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500/80" style={{ width: "45%" }} />
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between text-[8px] font-semibold">
                            <span className="text-zinc-500 uppercase">Box 3</span>
                            <span className="text-zinc-300">{box3} cards</span>
                          </div>
                          <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500/80" style={{ width: "20%" }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/[0.04] text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                      Total: {flashcardsCount} Cards
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Subject Mastery Card (Right Col - 6 cols) */}
            <div className="lg:col-span-6 bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 transition-all duration-500 ease-out hover:border-white/[0.15] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-4 block border-b border-white/[0.04] pb-2">Retention & Subject Mastery</span>
                <div className="grid grid-cols-2 gap-6 mt-2">

                  {/* Memory Retention */}
                  <div className="flex flex-col justify-between h-full min-h-[140px]">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase block mb-3">Retention Status</span>
                      
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-xl font-semibold tracking-tight text-white leading-none">
                          {quizzesCount > 0 ? `${retentionRate}%` : "—"}
                        </span>
                        {quizzesCount > 0 && (
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider leading-none">
                            Strength
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div>
                          <div className="flex items-center justify-between text-[8px] mb-0.5">
                            <span className="font-semibold text-zinc-500 uppercase tracking-wider">Optimal (&gt;80%)</span>
                            <span className="text-white font-semibold">{optimalCount} files</span>
                          </div>
                          <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 transition-all duration-300"
                              style={{ width: notes.length > 0 ? `${(optimalCount / notes.length) * 100}%` : "0%" }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-[8px] mb-0.5">
                            <span className="font-semibold text-zinc-500 uppercase tracking-wider">Fading (50-80%)</span>
                            <span className="text-white font-semibold">{fadingCount} files</span>
                          </div>
                          <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-500 transition-all duration-300"
                              style={{ width: notes.length > 0 ? `${(fadingCount / notes.length) * 100}%` : "0%" }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-[8px] mb-0.5">
                            <span className="font-semibold text-zinc-500 uppercase tracking-wider">Critical (&lt;50%)</span>
                            <span className="text-white font-semibold">{criticalCount} files</span>
                          </div>
                          <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-rose-500 transition-all duration-300"
                              style={{ width: notes.length > 0 ? `${(criticalCount / notes.length) * 100}%` : "0%" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-[9px] font-bold text-zinc-500 mt-3 uppercase tracking-wider">
                      {lastStudyDiffDays > 0 ? `${lastStudyDiffDays}d since last run.` : "Stable."}
                    </p>
                  </div>

                  {/* Mastery by Subject */}
                  <div className="flex flex-col justify-between h-full min-h-[140px]">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase block mb-3">Subject Mastery</span>
                      
                      {stats.subjectScores.length === 0 ? (
                        <div className="py-6 text-center text-xs text-zinc-500 font-medium">
                          No quiz data.
                        </div>
                      ) : (
                        <ul className="space-y-2" role="list">
                          {stats.subjectScores.slice(0, 3).map((subject) => (
                            <li key={subject.subject} className="relative">
                              <div className="flex items-center justify-between gap-3 text-[10px]">
                                <span className="font-bold text-white truncate">{subject.subject}</span>
                                <span className="font-semibold text-zinc-400">{subject.score}%</span>
                              </div>
                              <div className="w-full h-[2px] bg-white/5 mt-1 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-500 transition-all duration-1000 ease-out"
                                  style={{ width: mounted ? `${subject.score}%` : "0%" }}
                                />
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[8px] text-zinc-500 uppercase font-bold tracking-widest">
                      <span className="truncate mr-1">Top: {stats.strongest?.subject || "N/A"}</span>
                      <span className="truncate">Weak: {stats.weakest?.subject || "N/A"}</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* ROW 4: Re-Containerized Activity Lists */}
            
            {/* Achievements Card (Left Col - 6 cols) */}
            <div className="lg:col-span-6 bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 transition-all duration-500 ease-out hover:border-white/[0.15] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-4 block border-b border-white/[0.04] pb-2">Achievements</span>
                <div className="flex flex-col">
                  {achievements.slice(0, 4).map((achievement) => {
                    const Icon = getAchievementIcon(achievement.icon);
                    return (
                      <div 
                        key={achievement.id}
                        className="flex items-center justify-between py-3 border-b border-white/[0.06] last:border-b-0"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-xl border shrink-0 ${achievement.completed ? "bg-purple-950/30 border-purple-500/20 text-purple-400" : "bg-white/5 border-white/5 text-zinc-600"}`}>
                            <Icon size={14} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white block leading-snug truncate">{achievement.title}</span>
                            <span className="text-[10px] text-zinc-500 block leading-snug truncate mt-0.5">{achievement.description}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                          <span className="text-[9px] font-semibold text-purple-400">+{achievement.rewardXp} XP</span>
                          <span className="text-[9px] text-zinc-500">{achievement.completed ? "Unlocked" : `${achievement.progress}/${achievement.target}`}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Activity Card (Right Col - 6 cols) */}
            <div className="lg:col-span-6 bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 transition-all duration-500 ease-out hover:border-white/[0.15] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-4 block border-b border-white/[0.04] pb-2">Recent Activity</span>
                <div className="flex flex-col">
                  {xpHistory.length === 0 ? (
                    <div className="py-6 text-center text-xs text-zinc-500 font-medium">
                      No recent activity logged. Start uploading files or taking quizzes!
                    </div>
                  ) : (
                    xpHistory.slice(0, 4).map((item, itemIdx) => {
                      const isUpload = item.activity.includes("Uploaded") || item.activity.includes("Upload");
                      const Icon = isUpload ? Upload : BookOpen;
                      
                      return (
                        <div 
                          key={item.id || itemIdx} 
                          className="flex items-center justify-between py-3 border-b border-white/[0.06] last:border-b-0"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${isUpload ? "bg-blue-950/20 border-blue-500/20 text-blue-400" : "bg-purple-950/20 border-purple-500/20 text-purple-400"}`}>
                              <Icon size={12} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate leading-snug">{item.activity}</p>
                              <p className="text-[9px] text-zinc-500 leading-snug mt-0.5">
                                {item.date ? new Date(item.date).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                }) : "Recently"}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-emerald-400 shrink-0 select-none ml-4">
                            +{item.xp} XP
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
