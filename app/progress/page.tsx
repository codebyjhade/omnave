"use client";

import { useUserContext } from "@/context/UserContext";
import { useProgressStats } from "@/hooks/useProgressStats";
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
  Sparkles,
  Check
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
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

  // Map 7 days of the week starting from Sunday (image layout reference)
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  
  const currentWeekDays = useMemo(() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
    
    return daysOfWeek.map((dayName, index) => {
      const diff = index - currentDayOfWeek;
      const dayDate = new Date(today);
      dayDate.setDate(today.getDate() + diff);
      
      const weeklyDataItem = stats.weeklyData.find(
        (d) => d.day === dayName || (d.day === "SUN" && dayName === "SUN") || (d.day === "SAT" && dayName === "SAT")
      );
      const isCompleted = (weeklyDataItem?.sessions || 0) > 0;
      
      return {
        name: dayName,
        shortLabel: dayName.charAt(0) + dayName.slice(1).toLowerCase(), // "Sun", "Mon"...
        dateNum: dayDate.getDate(),
        isCompleted
      };
    });
  }, [stats.weeklyData]);

  // Dynamic Subject Mastery calculations for Activity Rings
  const topSubjects = useMemo(() => {
    const defaultSubjects = [
      { subject: "Maths", score: 80, color: "#00D26A", trackColor: "#E6FBF0" },
      { subject: "Chemistry", score: 65, color: "#FFB020", trackColor: "#FFF7E6" },
      { subject: "Biology", score: 45, color: "#FA5C5C", trackColor: "#FFEBEB" }
    ];
    
    if (!stats.subjectScores || stats.subjectScores.length === 0) {
      return defaultSubjects;
    }
    
    return [0, 1, 2].map((idx) => {
      const sub = stats.subjectScores[idx];
      const defaults = defaultSubjects[idx];
      return {
        subject: sub ? sub.subject : defaults.subject,
        score: sub ? sub.score : defaults.score,
        color: defaults.color,
        trackColor: defaults.trackColor
      };
    });
  }, [stats.subjectScores]);

  if (loading) {
    return (
      <main className="w-full h-[100dvh] bg-[#6949a8] overflow-hidden relative touch-none pt-[env(safe-area-inset-top)] flex flex-col">
        <header className="w-full bg-[#6949a8] pt-7 pb-23 relative flex-none">
          <div className="max-w-5xl mx-auto px-[25px] flex flex-col justify-center select-none relative z-30 text-left h-[72px]">
            <div className="bg-white/20 text-white backdrop-blur-md border border-white/20 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full w-fit mb-2">
              📊 LIFETIME STATS
            </div>
            <div className="h-8 w-48 bg-white/20 rounded animate-pulse" />
          </div>
        </header>
        <div className="absolute inset-0 top-[140px] z-10 bg-white rounded-t-[40px] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#6949a8] border-t-transparent rounded-full" />
        </div>
      </main>
    );
  }

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
    <main className="w-full h-[100dvh] bg-[#6949a8] overflow-hidden relative touch-none pt-[env(safe-area-inset-top)] flex flex-col">
      {/* 1. THE PURPLE HEADER */}
      <header className="w-full bg-[#6949a8] pt-7 pb-23 relative flex-none">
        <div className="max-w-5xl mx-auto px-[25px] flex flex-col justify-center select-none relative z-30 text-left h-[72px]">
          <div className="bg-white/20 text-white backdrop-blur-md border border-white/20 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full w-fit mb-2">
            📊 LIFETIME STATS
          </div>
          <h1 className="text-3xl font-bold text-white font-poppins leading-none">
            Your Progress
          </h1>
        </div>
      </header>

      {/* 2. THE SCROLLABLE WHITE CANVAS */}
      <div className="absolute inset-0 top-[140px] z-10 bg-white rounded-t-[40px] px-[25px] pt-8 pb-[120px] overflow-y-auto">
        <div className="w-full max-w-md mx-auto flex flex-col gap-8 pt-2">
          
          {/* Daily Streak Section */}
          <div className="flex flex-col text-left">
            <h2 className="text-base font-bold text-gray-900 mb-3 font-poppins">
              Daily Streak
            </h2>
            <div className="bg-[#6949a8] text-white rounded-[24px] p-5 flex flex-col relative overflow-hidden select-none">
              {/* Grid of days */}
              <div className="grid grid-cols-7 gap-1.5 w-full text-center">
                {currentWeekDays.map((day) => (
                  <div key={day.name} className="flex flex-col items-center gap-2">
                    <span className="text-[11px] font-semibold text-purple-200 uppercase font-poppins">
                      {day.name.charAt(0) + day.name.slice(1).toLowerCase()}
                    </span>
                    {day.isCompleted ? (
                      <div className="w-8 h-8 rounded-full bg-[#00D26A] flex items-center justify-center text-white shrink-0">
                        <Check size={16} strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white text-[#6949a8] flex items-center justify-center font-bold text-xs shrink-0 font-poppins">
                        {day.dateNum}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lesson Learned Section */}
          <div className="flex flex-col text-left">
            <h2 className="text-base font-bold text-gray-900 mb-3 font-poppins">
              Lesson learned
            </h2>
            
            {/* Custom Bar Chart with Y Axis */}
            <div className="flex flex-row items-stretch h-44 mt-2 w-full">
              {/* Y Axis Labels */}
              <div className="flex flex-col justify-between text-[11px] text-gray-400 font-semibold select-none pr-3 pb-6 text-right w-6">
                <span>8</span>
                <span>6</span>
                <span>4</span>
                <span>2</span>
                <span>0</span>
              </div>
              
              {/* Bars Container */}
              <div className="flex-1 flex flex-row items-end justify-between h-full border-b border-gray-100 pb-6">
                {currentWeekDays.map((day) => {
                  const weeklyDataItem = stats.weeklyData.find((d) => d.day === day.name);
                  const sessions = weeklyDataItem?.sessions || 0;
                  const pct = Math.min(100, (sessions / 8) * 100);
                  
                  return (
                    <div key={day.name} className="flex-1 flex flex-col items-center justify-end h-full">
                      {/* Rounded Bar */}
                      <div className="w-5 bg-purple-100/60 rounded-full h-full flex items-end overflow-hidden">
                        <div 
                          className="w-full bg-[#6949a8] rounded-full transition-all duration-500"
                          style={{ height: `${Math.max(5, pct)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-gray-400 font-semibold mt-2 select-none font-poppins">
                        {day.shortLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Subject Mastery Section */}
          <div className="flex flex-col text-left">
            <h2 className="text-base font-bold text-gray-900 mb-3 font-poppins">
              Subject Mastery
            </h2>
            
            {/* Selector Pills */}
            <div className="flex gap-1 overflow-x-auto pb-4 shrink-0 scrollbar-none">
              <span className="bg-purple-50 text-[#6949a8] px-3.5 py-1.5 rounded-full text-xs font-bold font-poppins">1D</span>
              <span className="text-gray-400 px-3.5 py-1.5 rounded-full text-xs font-semibold font-poppins">1W</span>
              <span className="text-gray-400 px-3.5 py-1.5 rounded-full text-xs font-semibold font-poppins">1M</span>
              <span className="text-gray-400 px-3.5 py-1.5 rounded-full text-xs font-semibold font-poppins">6M</span>
              <span className="text-gray-400 px-3.5 py-1.5 rounded-full text-xs font-semibold font-poppins">1Y</span>
            </div>

            {/* Concentric Progress Rings (Activity Rings) & Legend */}
            <div className="flex items-center justify-between gap-6 py-2">
              
              {/* Dynamic Concentric Rings SVG */}
              <div className="w-36 h-36 shrink-0 relative flex items-center justify-center">
                <svg width="100%" height="100%" viewBox="0 0 120 120" className="transform -rotate-90">
                  {/* Green Ring (Outer) */}
                  <circle cx="60" cy="60" r="45" stroke="#E6FBF0" strokeWidth="8" fill="none" />
                  <circle 
                    cx="60" 
                    cy="60" 
                    r="45" 
                    stroke={topSubjects[0].color} 
                    strokeWidth="8" 
                    fill="none" 
                    strokeDasharray="282.7"
                    strokeDashoffset={282.7 * (1 - topSubjects[0].score / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />

                  {/* Yellow Ring (Middle) */}
                  <circle cx="60" cy="60" r="33" stroke="#FFF7E6" strokeWidth="8" fill="none" />
                  <circle 
                    cx="60" 
                    cy="60" 
                    r="33" 
                    stroke={topSubjects[1].color} 
                    strokeWidth="8" 
                    fill="none" 
                    strokeDasharray="207.3"
                    strokeDashoffset={207.3 * (1 - topSubjects[1].score / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />

                  {/* Red Ring (Inner) */}
                  <circle cx="60" cy="60" r="21" stroke="#FFEBEB" strokeWidth="8" fill="none" />
                  <circle 
                    cx="60" 
                    cy="60" 
                    r="21" 
                    stroke={topSubjects[2].color} 
                    strokeWidth="8" 
                    fill="none" 
                    strokeDasharray="131.9"
                    strokeDashoffset={131.9 * (1 - topSubjects[2].score / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
              </div>

              {/* Rings Legend List */}
              <div className="flex-1 flex flex-col gap-3 font-poppins">
                {topSubjects.map((sub, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-xs font-bold text-gray-900 truncate leading-snug">{sub.subject}</span>
                      <span className="text-[10px] text-gray-400 font-semibold">{sub.score}% mastery</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Performance & Flashcards Section */}
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-4 block border-b border-gray-100 pb-2 font-poppins">
              Performance & Flashcards
            </span>
            <div className="grid grid-cols-2 gap-6 mt-1">
              
              {/* Quizzes details */}
              <div className="flex flex-col justify-between h-full min-h-[140px]">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-[#6949a8] uppercase block mb-3 font-poppins">Quizzes</span>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase block tracking-wider font-poppins">Average</span>
                      <span className="text-xl font-bold text-gray-900 mt-1 block leading-none font-poppins">{avgScore}%</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase block tracking-wider font-poppins">Best</span>
                      <span className="text-xl font-bold text-gray-900 mt-1 block leading-none font-poppins">{bestScore}%</span>
                    </div>
                  </div>

                  {recentScores.length === 0 ? (
                    <div className="py-2 text-center text-xs text-gray-400 font-medium">
                      No quiz data yet.
                    </div>
                  ) : (
                    <div className="flex items-end justify-between h-10 px-1 gap-2 select-none">
                      {[...recentScores].reverse().slice(-5).map((score, i) => (
                        <div key={score.id || i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                          <div className="w-1.5 h-5 bg-gray-100 rounded-full overflow-hidden flex items-end">
                            <div 
                              className="w-full bg-[#6949a8]"
                              style={{ height: `${score.percentage}%` }}
                            />
                          </div>
                          <span className="text-[8px] text-gray-400 font-semibold font-poppins">Q{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100 text-[9px] font-bold text-gray-400 uppercase tracking-wider flex justify-between font-poppins">
                  <span>Runs: {quizzesCount}</span>
                  <span>Perfect: {gamificationStats.perfectScores}</span>
                </div>
              </div>

              {/* Flashcard details */}
              <div className="flex flex-col justify-between h-full min-h-[140px]">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-[#6949a8] uppercase block mb-3 font-poppins">Flashcards</span>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase block tracking-wider font-poppins">Reviewed</span>
                      <span className="text-xl font-bold text-gray-900 mt-1 block leading-none font-poppins">{gamificationStats.flashcardsReviewed}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase block tracking-wider font-poppins">Decks</span>
                      <span className="text-xl font-bold text-gray-900 mt-1 block leading-none font-poppins">{notes.length}</span>
                    </div>
                  </div>

                  <div className="space-y-1 mt-1 font-poppins">
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[8px] font-semibold">
                        <span className="text-gray-400 uppercase">Box 1</span>
                        <span className="text-gray-600">{box1} cards</span>
                      </div>
                      <div className="w-full h-[2px] bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-300/80" style={{ width: "35%" }} />
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[8px] font-semibold">
                        <span className="text-gray-400 uppercase">Box 2</span>
                        <span className="text-gray-600">{box2} cards</span>
                      </div>
                      <div className="w-full h-[2px] bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500/80" style={{ width: "45%" }} />
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[8px] font-semibold">
                        <span className="text-gray-400 uppercase">Box 3</span>
                        <span className="text-gray-600">{box3} cards</span>
                      </div>
                      <div className="w-full h-[2px] bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500/80" style={{ width: "20%" }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100 text-[9px] font-bold text-gray-400 uppercase tracking-wider font-poppins">
                  Total: {flashcardsCount} Cards
                </div>
              </div>

            </div>
          </div>

          {/* Memory Status & mastery list */}
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-4 block border-b border-gray-100 pb-2 font-poppins">
              Retention & Mastery
            </span>
            <div className="grid grid-cols-2 gap-6 mt-1">

              {/* Memory Retention */}
              <div className="flex flex-col justify-between h-full min-h-[140px]">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-[#6949a8] uppercase block mb-3 font-poppins">Retention</span>
                  
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xl font-bold tracking-tight text-gray-900 leading-none font-poppins">
                      {quizzesCount > 0 ? `${retentionRate}%` : "—"}
                    </span>
                    {quizzesCount > 0 && (
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none font-poppins">
                        Strength
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 font-poppins">
                    <div>
                      <div className="flex items-center justify-between text-[8px] mb-0.5">
                        <span className="font-semibold text-gray-400 uppercase tracking-wider">Optimal (&gt;80%)</span>
                        <span className="text-gray-800 font-semibold">{optimalCount} files</span>
                      </div>
                      <div className="w-full h-[2px] bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: notes.length > 0 ? `${(optimalCount / notes.length) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[8px] mb-0.5">
                        <span className="font-semibold text-gray-400 uppercase tracking-wider">Fading (50-80%)</span>
                        <span className="text-gray-800 font-semibold">{fadingCount} files</span>
                      </div>
                      <div className="w-full h-[2px] bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 transition-all duration-300"
                          style={{ width: notes.length > 0 ? `${(fadingCount / notes.length) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[8px] mb-0.5">
                        <span className="font-semibold text-gray-400 uppercase tracking-wider">Critical (&lt;50%)</span>
                        <span className="text-gray-800 font-semibold">{criticalCount} files</span>
                      </div>
                      <div className="w-full h-[2px] bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-500 transition-all duration-300"
                          style={{ width: notes.length > 0 ? `${(criticalCount / notes.length) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[9px] font-bold text-gray-400 mt-3 uppercase tracking-wider font-poppins">
                  {lastStudyDiffDays > 0 ? `${lastStudyDiffDays}d since last run.` : "Stable."}
                </p>
              </div>

              {/* Subject Mastery List */}
              <div className="flex flex-col justify-between h-full min-h-[140px]">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-[#6949a8] uppercase block mb-3 font-poppins">Mastery List</span>
                  
                  {stats.subjectScores.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-400 font-medium">
                      No quiz data.
                    </div>
                  ) : (
                    <ul className="space-y-2 font-poppins" role="list">
                      {stats.subjectScores.slice(0, 3).map((subject) => (
                        <li key={subject.subject} className="relative">
                          <div className="flex items-center justify-between gap-3 text-[10px]">
                            <span className="font-bold text-gray-700 truncate">{subject.subject}</span>
                            <span className="font-semibold text-gray-400">{subject.score}%</span>
                          </div>
                          <div className="w-full h-[2px] bg-gray-100 mt-1 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#6949a8] transition-all duration-1000 ease-out"
                              style={{ width: mounted ? `${subject.score}%` : "0%" }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[8px] text-gray-400 uppercase font-bold tracking-widest font-poppins">
                  <span className="truncate mr-1">Top: {stats.strongest?.subject || "N/A"}</span>
                  <span className="truncate font-semibold">Weak: {stats.weakest?.subject || "N/A"}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Achievements Section */}
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-4 block border-b border-gray-100 pb-2 font-poppins">
              Achievements
            </span>
            <div className="flex flex-col">
              {achievements.slice(0, 4).map((achievement) => {
                const Icon = getAchievementIcon(achievement.icon);
                return (
                  <div 
                    key={achievement.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 font-poppins"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-xl shrink-0 ${achievement.completed ? "bg-[#6949a8]/10 text-[#6949a8]" : "bg-gray-50 text-gray-300"}`}>
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0 text-left">
                        <span className="text-xs font-bold text-gray-900 block leading-snug truncate">{achievement.title}</span>
                        <span className="text-[10px] text-gray-400 block leading-snug truncate mt-0.5">{achievement.description}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                      <span className="text-[9px] font-semibold text-[#6949a8]">+{achievement.rewardXp} XP</span>
                      <span className="text-[9px] text-gray-400">{achievement.completed ? "Unlocked" : `${achievement.progress}/${achievement.target}`}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-4 block border-b border-gray-100 pb-2 font-poppins">
              Recent Activity
            </span>
            <div className="flex flex-col">
              {xpHistory.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400 font-medium">
                  No recent activity logged. Start uploading files or taking quizzes!
                </div>
              ) : (
                xpHistory.slice(0, 4).map((item, itemIdx) => {
                  const isUpload = item.activity.includes("Uploaded") || item.activity.includes("Upload");
                  const Icon = isUpload ? Upload : BookOpen;
                  
                  return (
                    <div 
                      key={item.id || itemIdx} 
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 font-poppins"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-gray-100/50 ${isUpload ? "bg-blue-50 text-blue-600" : "bg-[#6949a8]/10 text-[#6949a8]"}`}>
                          <Icon size={12} />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-xs font-bold text-gray-900 truncate leading-snug">{item.activity}</p>
                          <p className="text-[9px] text-gray-400 leading-snug mt-0.5">
                            {item.date ? new Date(item.date).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            }) : "Recently"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 shrink-0 select-none ml-4">
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
    </main>
  );
}
