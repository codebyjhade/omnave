"use client";

import { useUserContext } from "@/context/UserContext";
import { Skeleton } from "@/components/Skeleton";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

export default function AIRecommendation() {
  const router = useRouter();
  const { insights, lessons, gamificationStats, loading } = useUserContext();

  const recommendation = useMemo(() => {
    if (loading || !gamificationStats) {
      return {
        text: "Analyzing your learning profile...",
        actionLabel: "View Details",
        onClick: () => {}
      };
    }

    const currentLesson = lessons[0];
    const getCleanTitle = (path: string, title?: string) => {
      if (title) return title;
      const base = path.split("/").pop() || "";
      const name = base.replace(/^\d+_/, "");
      return name.replace(".pdf", "") || "Study Material";
    };
    const displayTitle = currentLesson ? getCleanTitle(currentLesson.file_path, currentLesson.title) : "";

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
            router.push("/home");
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
  }, [loading, gamificationStats, lessons, insights, router]);

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-4">
        <div className="flex items-center gap-2 pl-2">
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>
        <Skeleton className="h-[140px] w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="w-full relative overflow-hidden bg-gradient-to-br from-omnave-primary/40 to-omnave-primary/10 border border-omnave-primary/30 backdrop-blur-xl rounded-[24px] p-6 md:p-8 flex flex-col items-start gap-4 shadow-[0_10px_40px_rgba(127,34,254,0.15)] group">
      
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-white/10 transition-colors duration-700" />

      <div className="flex items-center gap-2 text-white mb-2 pl-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
        <span className="text-[10px] font-extrabold tracking-[0.2em] text-neutral-500 uppercase">AI Recommendation</span>
      </div>

      <h3 className="text-lg md:text-2xl font-bold text-white leading-tight max-w-[90%] drop-shadow-md text-left">
        {recommendation.text}
      </h3>

      <button 
        onClick={recommendation.onClick}
        className="mt-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm transition-all active:scale-95 shadow-premium-glass cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#130E24]"
      >
        {recommendation.actionLabel}
      </button>
    </div>
  );
}