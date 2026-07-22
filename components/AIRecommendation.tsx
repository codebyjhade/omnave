"use client";

import { useUserContext } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Sparkles, ArrowRight } from "lucide-react";

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
      <div className="w-full h-40 bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] border-t-white/[0.12] rounded-3xl animate-pulse shadow-lg" />
    );
  }

  return (
    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 sm:p-8 flex flex-col items-start gap-5 shadow-lg shadow-black/40 text-left transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-900/10 hover:border-white/10">
      {/* Internal Section Header */}
      <span className="text-[11px] font-bold tracking-[0.15em] text-zinc-500 uppercase">
        AI Recommendation
      </span>

      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
          <Sparkles size={20} strokeWidth={1.5} />
        </div>
        <h3 className="text-base md:text-lg font-semibold text-zinc-100 leading-snug">
          {recommendation.text}
        </h3>
      </div>

      <button
        onClick={recommendation.onClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm rounded-xl transition-all shadow-[0_4px_20px_rgba(147,51,234,0.3)] active:scale-[0.98] cursor-pointer mt-2"
      >
        <span>{recommendation.actionLabel}</span>
        <ArrowRight size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}