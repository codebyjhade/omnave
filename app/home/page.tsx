"use client";

import Header from "@/components/Header";
import { useUserContext } from "@/context/UserContext";
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  FileText,
  Flame
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { calculateKitProgress } from "@/hooks/useProgressStats";
import Link from "next/link";
import { getLocalDateString } from "@/lib/gamification";

export default function HomePage() {
  const router = useRouter();
  const { 
    streak, 
    lessons, 
    quizScores, 
    loading, 
    gamificationStats,
    tasks,
    insights
  } = useUserContext();

  const lessonsList = lessons || [];
  const quizScoresList = quizScores || [];
  const dailyGoals = tasks?.dailyGoals || [];

  const studiedToday = useMemo(() => {
    if (!gamificationStats?.lastStudyDate) return false;
    return gamificationStats.lastStudyDate === getLocalDateString();
  }, [gamificationStats?.lastStudyDate]);

  const currentLesson = lessonsList.length > 0 ? lessonsList[0] : null;

  const getCleanTitle = (path: string) => {
    const base = path.split("/").pop() || "";
    const name = base.replace(/^\d+_/, "");
    return name.replace(".pdf", "") || "Study Material";
  };

  const displayTitle = currentLesson?.is_processed && currentLesson?.title 
    ? currentLesson.title 
    : (currentLesson ? getCleanTitle(currentLesson.file_path) : "");

  const quizCount = currentLesson?.quizzes?.length ?? 0;
  const flashcardCount = currentLesson?.flashcards?.length ?? 0;
  const progress = currentLesson ? calculateKitProgress(currentLesson, quizScoresList) : 0;

  // AI Recommendation Logic
  const recommendation = useMemo(() => {
    if (!gamificationStats) {
      return {
        text: "Analyzing your learning profile...",
        actionLabel: "Upload PDF",
        onClick: () => router.push("/upload")
      };
    }

    const currentLesson = lessonsList[0];
    const displayTitle = currentLesson?.title || (currentLesson ? getCleanTitle(currentLesson.file_path) : "");

    // 1. Zero streak warning
    if (gamificationStats.currentStreak === 0) {
      return {
        text: "Start studying daily to build your momentum streak!",
        actionLabel: currentLesson ? "Start Lesson" : "Upload PDF",
        onClick: () => {
          if (currentLesson) {
            router.push(`/lesson/${currentLesson.id}`);
          } else {
            router.push("/upload");
          }
        }
      };
    }

    // 2. No flashcards generated warning
    if (currentLesson && currentLesson.is_processed && (!currentLesson.flashcards || currentLesson.flashcards.length === 0)) {
      return {
        text: `You haven't reviewed flashcards for '${displayTitle}'. Let's check it out.`,
        actionLabel: "Open Flashcards",
        onClick: () => {
          router.push(`/lesson/${currentLesson.id}?tab=slides`);
        }
      };
    }

    // 3. Close to level up
    if (gamificationStats.xpNeeded <= 150) {
      return {
        text: `You are only ${gamificationStats.xpNeeded} XP away from Level ${gamificationStats.currentLevel + 1}. Take a quick quiz to level up!`,
        actionLabel: "Start Quiz",
        onClick: () => {
          if (currentLesson) {
            router.push(`/lesson/${currentLesson.id}?tab=quiz`);
          } else {
            router.push("/library");
          }
        }
      };
    }

    // 4. Default: insights or latest lesson completion
    if (insights && insights.length > 0) {
      return {
        text: insights[0],
        actionLabel: currentLesson ? "Resume Study" : "View Progress",
        onClick: () => {
          if (currentLesson) {
            router.push(`/lesson/${currentLesson.id}`);
          } else {
            router.push("/progress");
          }
        }
      };
    }

    if (currentLesson) {
      return {
        text: `You're only one session away from completing ${displayTitle}.`,
        actionLabel: "Resume Study",
        onClick: () => {
          router.push(`/lesson/${currentLesson.id}`);
        }
      };
    }

    return {
      text: "Upload a study document to start generating custom flashcards and quizzes!",
      actionLabel: "Upload PDF",
      onClick: () => {
        router.push("/upload");
      }
    };
  }, [gamificationStats, lessonsList, insights, router]);

  // Goal Click Handler
  const handleGoalClick = (goalId: string) => {
    const currentLesson = lessonsList[0];
    if (goalId === "daily-upload" || goalId === "weekly-upload") {
      router.push("/upload");
    } else if (goalId === "daily-quiz" || goalId === "weekly-quiz" || goalId === "mission-perfect-quiz" || goalId === "mission-study-time") {
      if (currentLesson) {
        router.push(`/lesson/${currentLesson.id}?tab=quiz`);
      } else {
        router.push("/library");
      }
    } else {
      if (currentLesson) {
        router.push(`/lesson/${currentLesson.id}`);
      } else {
        router.push("/library");
      }
    }
  };

  // Completed daily goals calculation
  const completedGoalsCount = dailyGoals.filter(g => g.completed).length;
  const totalGoalsCount = dailyGoals.length || 3;

  // Dynamic sorted Materials logic (no mock data)
  const displayMaterials = useMemo(() => {
    return [...lessonsList]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .map((l) => {
        const base = l.file_path.split("/").pop() || "";
        const cleanName = base.replace(/^\d+_/, "").replace(".pdf", "") || "Study Material";
        const title = l.is_processed && l.title ? l.title : cleanName;
        const progress = calculateKitProgress(l, quizScoresList);
        return {
          id: l.id,
          title,
          cardCount: Array.isArray(l.flashcards) ? l.flashcards.length : 0,
          progress,
        };
      });
  }, [lessonsList, quizScoresList]);

  return (
    <main className="w-full max-w-5xl mx-auto px-6 md:px-8 pt-6 pb-20 flex flex-col gap-6 bg-[#0A0A0A]">
      {/* 1. Header: Greeting Block */}
      <Header />

      {/* ASYMMETRICAL BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">

        {/* 1. UP NEXT HERO CARD */}
        {loading ? (
          <div className="lg:col-start-1 lg:col-span-8 lg:row-start-1 lg:row-span-2 w-full bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 flex flex-col justify-between animate-pulse min-h-[180px]">
            <div>
              <div className="h-3 w-16 bg-white/[0.05] rounded-md mb-2" />
              <div className="h-6 w-1/2 bg-white/[0.05] rounded-md mb-2" />
              <div className="h-3 w-24 bg-white/[0.05] rounded-md" />
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <div className="w-full h-[2px] bg-white/[0.05] rounded-full" />
            </div>
          </div>
        ) : !currentLesson ? (
          /* Empty State Hero */
          <div 
            onClick={() => router.push("/library")}
            className="lg:col-start-1 lg:col-span-8 lg:row-start-1 lg:row-span-2 w-full bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 flex flex-col justify-between min-h-[180px] transition-all duration-500 ease-out hover:border-white/[0.15] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] cursor-pointer select-none"
          >
            <div>
              <span className="text-[11px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-2 block">UP NEXT</span>
              <h2 className="text-xl font-semibold tracking-tight text-white leading-tight">Your workspace is empty</h2>
              <p className="text-xs text-zinc-400 mt-1.5">Upload your first study document to generate a study kit.</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-purple-400 mt-4">
              <span>Go to Library</span>
              <ArrowRight size={14} />
            </div>
          </div>
        ) : (
          /* Active State Hero */
          <div 
            onClick={() => router.push(`/lesson/${currentLesson.id}`)}
            className="lg:col-start-1 lg:col-span-8 lg:row-start-1 lg:row-span-2 w-full bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 flex flex-col justify-between min-h-[180px] transition-all duration-500 ease-out hover:border-white/[0.15] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] cursor-pointer relative group select-none"
          >
            {/* Ambient Spotlight Glow */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-600/10 blur-3xl rounded-full pointer-events-none" />
            
            <div>
              <span className="text-[11px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-2 block">UP NEXT</span>
              <h2 className="text-2xl font-semibold tracking-tight text-white leading-tight">
                {displayTitle}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {flashcardCount} cards • {quizCount} quizzes
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Course Progress</span>
                <span className="font-semibold text-purple-400">{progress}%</span>
              </div>
              {/* Razor-Thin Progress Bar */}
              <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all duration-500" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. AI ASSISTANT INSIGHT STRIP */}
        {loading ? (
          <div className="lg:col-start-1 lg:col-span-8 lg:row-start-3 lg:row-span-1 w-full bg-white/[0.03] border border-white/[0.08] rounded-3xl p-4 animate-pulse min-h-[64px]" />
        ) : (
          <div className="lg:col-start-1 lg:col-span-8 lg:row-start-3 lg:row-span-1 w-full bg-white/[0.03] backdrop-blur-md border border-white/[0.08] shadow-inner rounded-3xl p-4 flex flex-row items-center justify-between gap-4 transition-all duration-500 ease-out hover:border-white/[0.15] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <Sparkles size={16} strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold tracking-[0.15em] text-purple-400 uppercase block leading-none mb-1">AI Assistant</span>
                <p className="text-xs text-zinc-300 leading-normal truncate">
                  {!currentLesson 
                    ? "I am standing by. Once you upload your first document, I will generate personalized insights here."
                    : recommendation.text}
                </p>
              </div>
            </div>
            
            <button 
              onClick={!currentLesson ? () => router.push("/upload") : recommendation.onClick} 
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[10px] uppercase tracking-wider rounded-lg transition-all shadow-[0_0_10px_rgba(147,51,234,0.3)] shrink-0 select-none group"
            >
              <span>{!currentLesson ? "Upload" : recommendation.actionLabel}</span>
              <ArrowRight size={10} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        )}

        {/* 3. PROGRESS MINI-GRID (Level & Streak Squares) */}
        {loading ? (
          <div className="lg:col-start-9 lg:col-span-4 lg:row-start-1 lg:row-span-1 grid grid-cols-2 gap-4 w-full">
            <div className="bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-5 animate-pulse min-h-[110px]" />
            <div className="bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-5 animate-pulse min-h-[110px]" />
          </div>
        ) : (
          <div className="lg:col-start-9 lg:col-span-4 lg:row-start-1 lg:row-span-1 grid grid-cols-2 gap-4 w-full">
            {/* LEVEL CARD */}
            <div className="bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-5 flex flex-col justify-between transition-all duration-500 ease-out hover:border-white/[0.15] hover:bg-[#151515] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] select-none">
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase block mb-1">LEVEL</span>
                <span className="text-3xl font-semibold tracking-tight text-white leading-none">
                  {gamificationStats?.currentLevel || 1}
                </span>
              </div>
              <div className="mt-2">
                <span className="text-[9px] font-bold text-zinc-500 block">
                  {gamificationStats?.currentXp || 0} / {(gamificationStats?.currentXp || 0) + (gamificationStats?.xpNeeded || 100)} XP
                </span>
                <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${gamificationStats?.xpProgress || 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* STREAK CARD */}
            <div className="bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-5 flex flex-col justify-between transition-all duration-500 ease-out hover:border-white/[0.15] hover:bg-[#151515] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] select-none">
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase block mb-1">STREAK</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-3xl font-semibold tracking-tight text-white leading-none">
                    {streak || 0}d
                  </span>
                  <Flame 
                    size={20} 
                    strokeWidth={1.5} 
                    className={`transition-colors duration-300 ${
                      streak > 0 && studiedToday ? "text-purple-400 fill-purple-400/20" : "text-zinc-500"
                    }`}
                  />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-[9px] font-bold text-zinc-500 block leading-tight">
                  {studiedToday ? "Keep it up!" : "Study today to extend"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 4. DAILY GOALS CARD */}
        {loading ? (
          <div className="lg:col-start-9 lg:col-span-4 lg:row-start-2 lg:row-span-2 w-full bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 animate-pulse min-h-[220px]">
            <div className="flex justify-between items-center mb-4">
              <div className="h-3.5 w-24 bg-white/[0.05] rounded-md" />
              <div className="h-4 w-12 bg-white/[0.05] rounded-full" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 w-full bg-white/[0.03] border border-white/[0.04] rounded-2xl" />
              ))}
            </div>
          </div>
        ) : (
          <div className="lg:col-start-9 lg:col-span-4 lg:row-start-2 lg:row-span-2 w-full bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 transition-all duration-500 ease-out hover:border-white/[0.15] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Daily Goals</span>
                <span 
                  className="text-[10px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full"
                  aria-label={`${completedGoalsCount} of ${totalGoalsCount} goals completed`}
                >
                  {completedGoalsCount}/{totalGoalsCount} Done
                </span>
              </div>

              {/* List of 3 nested goals */}
              <ul className="space-y-3" role="list">
                {(dailyGoals.length === 0 
                  ? [
                      { id: "daily-upload", title: "Upload a PDF", description: "Import a study document.", completed: lessonsList.length > 0 },
                      { id: "daily-quiz", title: "Complete a Quiz", description: "Take a diagnostic quiz.", completed: quizScoresList.length > 0 },
                      { id: "daily-streak", title: "Maintain Streak", description: "Keep your momentum active.", completed: streak > 0 }
                  ]
                  : dailyGoals.slice(0, 3)
                ).map((goal) => (
                  <li 
                    key={goal.id}
                    onClick={() => handleGoalClick(goal.id)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors cursor-pointer select-none"
                  >
                    {/* Circular Checkbox button (44px touch target) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGoalClick(goal.id);
                      }}
                      className="w-11 h-11 flex items-center justify-center -ml-3 shrink-0 rounded-full hover:bg-white/[0.04] focus:outline-none transition-colors"
                      aria-label={goal.completed ? `Mark ${goal.title} as incomplete` : `Mark ${goal.title} as completed`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          goal.completed
                            ? "bg-purple-600 border-purple-600 text-white"
                            : "border-white/20 bg-white/[0.02] hover:border-purple-500/50"
                        }`}
                      >
                        {goal.completed && <Check size={12} strokeWidth={3} />}
                      </div>
                    </button>

                    <div className="flex flex-col text-left min-w-0">
                      <span
                        className={`text-xs font-semibold block ${
                          goal.completed ? "text-zinc-500 line-through" : "text-zinc-200"
                        }`}
                      >
                        {goal.title}
                      </span>
                      <span className="text-[10px] text-zinc-500 leading-tight mt-0.5">
                        {goal.description}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 5. RECENT MATERIALS CARD */}
        {loading ? (
          <div className="lg:col-span-12 w-full bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 animate-pulse min-h-[160px]" />
        ) : (
          <div className="lg:col-span-12 w-full bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 transition-all duration-500 ease-out hover:border-white/[0.15] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
                Recent Materials
              </span>
              <Link
                href="/library"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-[0.05em] select-none"
              >
                <span>View All</span>
                <ArrowRight size={12} strokeWidth={2} />
              </Link>
            </div>

            {/* Responsive grid container: grid on Desktop/Tablet, horizontal overflow scrolling on Mobile */}
            {displayMaterials.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500 font-medium border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                No study materials found. Upload your first document to populate your library.
              </div>
            ) : (
              <div className="flex sm:grid sm:grid-cols-2 overflow-x-auto sm:overflow-x-visible gap-4 pb-2 sm:pb-0 snap-x hide-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {displayMaterials.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => router.push(`/lesson/${item.id}`)}
                    className="min-w-[240px] sm:min-w-0 snap-start shrink-0 sm:shrink flex flex-col justify-between gap-4 p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl transition-colors hover:bg-white/[0.04] hover:border-white/10 group cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.04] flex items-center justify-center shrink-0 text-zinc-400">
                        <FileText size={16} strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0 text-left">
                        <h3 className="text-xs font-semibold text-zinc-100 truncate group-hover:text-white">
                          {item.title}
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-normal">
                          {item.cardCount} cards
                        </p>
                      </div>
                    </div>

                    <div className="w-full flex flex-col gap-1.5">
                      <div className="w-full h-[2px] bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(item.progress, 5)}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-zinc-500 text-left font-medium">
                        {item.progress}% completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}