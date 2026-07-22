"use client";

import { useUserContext } from "@/context/UserContext";
import { useMemo } from "react";
import { Check } from "lucide-react";

export default function Checklist() {
  const { lessons, quizScores, streak, loading } = useUserContext();

  const goals = useMemo(() => {
    return [
      {
        id: "finish-lesson",
        title: "Finish Lesson",
        description: "Complete your active study material",
        completed: lessons.length > 0,
      },
      {
        id: "practice-quiz",
        title: "Practice Quiz",
        description: "Test your recall with a quick assessment",
        completed: quizScores.length > 0,
      },
      {
        id: "review-cards",
        title: "Review Flashcards",
        description: "Reinforce key concepts & definitions",
        completed: streak > 0,
      }
    ];
  }, [lessons.length, quizScores.length, streak]);

  const completedCount = useMemo(() => goals.filter(g => g.completed).length, [goals]);
  const totalCount = goals.length;

  if (loading) {
    return (
      <div className="bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-5 shadow-lg shadow-black/40 flex flex-col gap-4 animate-pulse h-full">
        <div className="flex justify-between items-center mb-2">
          <div className="h-3.5 w-24 bg-white/[0.06] rounded" />
          <div className="h-4 w-12 bg-white/[0.06] rounded-full" />
        </div>
        <div className="flex flex-col">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 w-full bg-white/[0.04] border border-white/[0.04] rounded-2xl mb-2" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-5 shadow-lg shadow-black/40 flex flex-col justify-between h-full transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-900/10 hover:border-white/10">
      <div className="flex flex-col gap-3">
        {/* Header Row with Psychological Momentum */}
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
            Today's Focus
          </span>
          <span className="text-[10px] font-medium text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
            {completedCount}/{totalCount} Done
          </span>
        </div>

        {/* Compact List Container */}
        <div className="flex flex-col">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="flex items-center gap-3 p-3 mb-2 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              {/* Checkmark Box - Purple when completed, Neutral border when pending */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                  goal.completed
                    ? "bg-purple-600 border-purple-600 text-white"
                    : "border-white/20 bg-white/[0.02] hover:border-purple-500/50"
                }`}
              >
                {goal.completed && <Check size={12} strokeWidth={3} />}
              </div>

              <div className="flex flex-col text-left min-w-0">
                <span
                  className={
                    goal.completed
                      ? "text-sm font-medium text-zinc-500 line-through"
                      : "text-sm font-medium text-zinc-200"
                  }
                >
                  {goal.title}
                </span>
                <span className="text-[11px] text-zinc-500 leading-tight mt-0.5">
                  {goal.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
