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
import { motion } from "framer-motion";

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

  const currentLesson = useMemo(() => {
    if (!lessonsList || lessonsList.length === 0) return null;
    return [...lessonsList].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )[0];
  }, [lessonsList]);

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
      text: "Upload a PDF to get started!",
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

  const springTransition = { type: "spring" as const, stiffness: 400, damping: 25 };

  return (
    <div className="w-full bg-[#FFFFFF]">
      {/* 1. Header: Greeting Block */}
      <Header />

      {/* Grounded, Friendly EdTech vertical layout wrapper */}
      <main className="w-full max-w-5xl mx-auto px-[25px] pb-24 flex flex-col gap-[20px] bg-[#FFFFFF] -mt-8 relative z-20">

        {/* 1. UP NEXT HERO CARD */}
        {loading ? (
          <div className="w-full bg-omnave-surface border-none rounded-[15px] p-[20px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] flex flex-col justify-between animate-pulse min-h-[180px]">
            <div>
              <div className="h-3 w-16 bg-omnave-border rounded-md mb-2" />
              <div className="h-6 w-1/2 bg-omnave-border rounded-md mb-2" />
              <div className="h-3 w-24 bg-omnave-border rounded-md" />
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <div className="w-full h-[2px] bg-omnave-border rounded-full" />
            </div>
          </div>
        ) : !currentLesson ? (
          /* Empty State Hero */
          <motion.div 
            onClick={() => router.push("/library")}
            whileTap={{ scale: 0.95 }}
            transition={springTransition}
            className="w-full bg-omnave-surface border-none rounded-[15px] p-[20px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] flex flex-col justify-between min-h-[180px] cursor-pointer select-none"
          >
            <div>
              <span className="text-[11px] font-bold tracking-[0.2em] text-omnave-secondary-text uppercase mb-2 block font-poppins">UP NEXT</span>
              <h2 className="text-xl font-bold tracking-tight text-omnave-primary-text leading-tight font-poppins">Your workspace is empty</h2>
              <p className="text-xs text-omnave-secondary-text mt-1.5 font-poppins">Upload a PDF to get started!</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-[#6949a8] mt-4 font-poppins">
              <span>Go to Library</span>
              <ArrowRight size={14} />
            </div>
          </motion.div>
        ) : (
          /* Active State Hero */
          <motion.div 
            onClick={() => router.push(`/lesson/${currentLesson.id}`)}
            whileTap={{ scale: 0.95 }}
            transition={springTransition}
            className="w-full bg-omnave-surface border-none rounded-[15px] p-[20px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] flex flex-col justify-between min-h-[180px] cursor-pointer relative group select-none"
          >
            <div>
              <span className="text-[11px] font-bold tracking-[0.2em] text-omnave-secondary-text uppercase mb-2 block font-poppins">UP NEXT</span>
              <h2 className="text-2xl font-bold tracking-tight text-omnave-primary-text leading-tight font-poppins">
                {displayTitle}
              </h2>
              <p className="text-xs text-omnave-secondary-text mt-1 font-poppins">
                {flashcardCount} cards • {quizCount} quizzes
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-omnave-secondary-text font-poppins">
                <span>Course Progress</span>
                <span className="font-semibold text-[#6949a8]">{progress}%</span>
              </div>
              {/* Razor-Thin Progress Bar — gradient per ODL gamification rule */}
              <div className="w-full h-[2px] bg-omnave-border rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#6949a8] to-[#86d1ff] transition-all duration-500" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* 2. AI ASSISTANT INSIGHT STRIP */}
        {loading ? (
          <div className="w-full bg-omnave-surface border-none rounded-[15px] p-[20px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] animate-pulse min-h-[64px]" />
        ) : (
          <div className="w-full bg-omnave-surface border-none shadow-[0px_10px_10px_rgba(0,0,0,0.09)] rounded-[15px] p-[20px] flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-[#6949a8]/10 border border-[#6949a8]/20 flex items-center justify-center text-[#6949a8] shrink-0">
                <Sparkles size={16} strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold tracking-[0.15em] text-[#6949a8] uppercase block leading-none mb-1 font-poppins">AI Assistant</span>
                <p className="text-xs text-omnave-secondary-text leading-normal truncate font-poppins">
                  {!currentLesson 
                    ? "Upload a PDF to get started!"
                    : recommendation.text}
                </p>
              </div>
            </div>
            
            <motion.button 
              whileTap={{ scale: 0.95 }}
              transition={springTransition}
              onClick={!currentLesson ? () => router.push("/upload") : recommendation.onClick} 
              className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-[#6949a8] hover:bg-[#563b8c] text-white font-semibold text-[10px] uppercase tracking-wider rounded-full transition-all shrink-0 select-none group cursor-pointer border-none"
            >
              <span>{!currentLesson ? "Upload" : recommendation.actionLabel}</span>
              <ArrowRight size={10} className="transition-transform group-hover:translate-x-0.5" />
            </motion.button>
          </div>
        )}

        {/* 3. PROGRESS MINI-GRID (Level & Streak Squares) */}
        {loading ? (
          <div className="grid grid-cols-2 gap-[20px] w-full">
            <div className="bg-omnave-surface border-none rounded-[15px] p-[20px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] animate-pulse min-h-[110px]" />
            <div className="bg-omnave-surface border-none rounded-[15px] p-[20px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] animate-pulse min-h-[110px]" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-[20px] w-full">
            {/* LEVEL CARD */}
            <motion.div 
              whileTap={{ scale: 0.95 }}
              transition={springTransition}
              className="bg-omnave-surface border-none rounded-[15px] p-[20px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] flex flex-col justify-between select-none cursor-pointer"
            >
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] text-omnave-secondary-text uppercase block mb-1 font-poppins">LEVEL</span>
                <span className="text-3xl font-bold tracking-tight text-omnave-primary-text leading-none font-poppins">
                  {gamificationStats?.currentLevel || 1}
                </span>
              </div>
              <div className="mt-2">
                <span className="text-[9px] font-bold text-omnave-secondary-text block font-poppins">
                  {gamificationStats?.currentXp || 0} / {(gamificationStats?.currentXp || 0) + (gamificationStats?.xpNeeded || 100)} XP
                </span>
                {/* XP Bar — gradient per ODL gamification rule */}
                <div className="w-full h-[2px] bg-omnave-border rounded-full overflow-hidden mt-1.5">
                  <div 
                    className="h-full bg-gradient-to-r from-[#6949a8] to-[#86d1ff] transition-all duration-300"
                    style={{ width: `${gamificationStats?.xpProgress || 0}%` }}
                  />
                </div>
              </div>
            </motion.div>

            {/* STREAK CARD */}
            <motion.div 
              whileTap={{ scale: 0.95 }}
              transition={springTransition}
              className="bg-omnave-surface border-none rounded-[15px] p-[20px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] flex flex-col justify-between select-none cursor-pointer"
            >
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] text-omnave-secondary-text uppercase block mb-1 font-poppins">STREAK</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-3xl font-bold tracking-tight text-omnave-primary-text leading-none font-poppins">
                    {streak || 0}d
                  </span>
                  <Flame 
                    size={20} 
                    strokeWidth={1.5} 
                    className={`transition-colors duration-300 ${
                      streak > 0 && studiedToday ? "text-[#6949a8] fill-[#6949a8]/20" : "text-omnave-secondary-text"
                    }`}
                  />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-[9px] font-bold text-omnave-secondary-text block leading-tight font-poppins">
                  {studiedToday ? "Keep it up!" : "Study today to extend"}
                </span>
              </div>
            </motion.div>
          </div>
        )}

        {/* 4. DAILY GOALS CARD */}
        {loading ? (
          <div className="w-full bg-omnave-surface border-none rounded-[15px] p-[20px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] animate-pulse min-h-[220px]">
            <div className="flex justify-between items-center mb-4">
              <div className="h-3.5 w-24 bg-omnave-border rounded-md" />
              <div className="h-4 w-12 bg-omnave-border rounded-full" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 w-full bg-omnave-surface border border-omnave-border rounded-2xl" />
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full bg-omnave-surface border-none rounded-[15px] p-[20px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold tracking-[0.2em] text-omnave-secondary-text uppercase font-poppins">Daily Goals</span>
                <span 
                  className="text-[10px] font-semibold text-[#6949a8] bg-[#6949a8]/10 px-2 py-0.5 rounded-full font-poppins"
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
                  <motion.li 
                    key={goal.id}
                    onClick={() => handleGoalClick(goal.id)}
                    whileTap={{ scale: 0.98 }}
                    transition={springTransition}
                    className={`flex items-center gap-3 p-3 rounded-[15px] bg-black/[0.02] border border-omnave-border cursor-pointer select-none`}
                  >
                    {/* Circular Checkbox button (44px touch target) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGoalClick(goal.id);
                      }}
                      className="w-11 h-11 flex items-center justify-center -ml-3 shrink-0 rounded-full hover:bg-black/[0.04] focus:outline-none transition-colors border-none bg-transparent cursor-pointer"
                      aria-label={goal.completed ? `Mark ${goal.title} as incomplete` : `Mark ${goal.title} as completed`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          goal.completed
                            ? "bg-[#6949a8] border-[#6949a8] text-white"
                            : "border-omnave-border bg-transparent hover:border-[#6949a8]/50"
                        }`}
                      >
                        {goal.completed && <Check size={12} strokeWidth={3} />}
                      </div>
                    </button>

                    <div className="flex flex-col text-left min-w-0">
                      <span
                        className={`text-xs font-bold block font-poppins ${
                          goal.completed ? "text-omnave-muted-text line-through" : "text-omnave-primary-text"
                        }`}
                      >
                        {goal.title}
                      </span>
                      <span className="text-[10px] text-omnave-secondary-text leading-tight mt-0.5 font-poppins">
                        {goal.description}
                      </span>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 5. RECENT MATERIALS CARD */}
        {loading ? (
          <div className="w-full bg-omnave-surface border-none rounded-[15px] p-[20px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] animate-pulse min-h-[160px]" />
        ) : (
          <div className="w-full bg-omnave-surface border-none rounded-[15px] p-[20px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-[0.2em] text-omnave-secondary-text uppercase font-poppins">
                Recent Materials
              </span>
              <Link
                href="/library"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6949a8] hover:text-[#563b8c] transition-colors uppercase tracking-[0.05em] select-none font-poppins"
              >
                <span>View All</span>
                <ArrowRight size={12} strokeWidth={2} />
              </Link>
            </div>

            {/* Responsive grid container: grid on Desktop/Tablet, horizontal overflow scrolling on Mobile */}
            {displayMaterials.length === 0 ? (
              <div className="py-6 text-center text-xs text-omnave-secondary-text font-medium border border-dashed border-omnave-border rounded-[15px] bg-black/[0.01] font-poppins">
                No study materials found. Upload your first document to populate your library.
              </div>
            ) : (
              <div className="flex sm:grid sm:grid-cols-2 overflow-x-auto sm:overflow-x-visible gap-4 pb-2 sm:pb-0 snap-x hide-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {displayMaterials.map((item) => (
                  <motion.div
                    key={item.id}
                    onClick={() => router.push(`/lesson/${item.id}`)}
                    whileTap={{ scale: 0.95 }}
                    transition={springTransition}
                    className="min-w-[240px] sm:min-w-0 snap-start shrink-0 sm:shrink flex flex-col justify-between gap-4 p-4 bg-black/[0.01] border border-omnave-border rounded-[15px] group cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-black/[0.03] border border-omnave-border flex items-center justify-center shrink-0 text-omnave-secondary-text">
                        <FileText size={16} strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0 text-left">
                        <h3 className="text-xs font-bold tracking-tight text-omnave-primary-text truncate group-hover:text-[#6949a8] font-poppins">
                          {item.title}
                        </h3>
                        <p className="text-[10px] text-omnave-secondary-text font-normal font-poppins">
                          {item.cardCount} cards
                        </p>
                      </div>
                    </div>

                    <div className="w-full flex flex-col gap-1.5">
                      {/* Progress Bar — gradient per ODL gamification rule */}
                      <div className="w-full h-[2px] bg-omnave-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#6949a8] to-[#86d1ff] rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(item.progress, 5)}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-omnave-secondary-text text-left font-medium font-poppins">
                        {item.progress}% completed
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}