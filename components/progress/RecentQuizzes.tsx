"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import type { QuizScore } from "@/context/UserContext";
import { getCleanTitle } from "@/hooks/useProgressStats";

interface RecentQuizzesProps {
  quizScores: QuizScore[];
  notesMap: Map<string, string>;
}

export const RecentQuizzes = memo(function RecentQuizzes({
  quizScores,
  notesMap,
}: RecentQuizzesProps) {
  const recent = quizScores.slice(0, 4);
  if (recent.length === 0) return null;

  return (
    <section aria-labelledby="recent-quizzes-heading">
      <div className="space-y-3">
        <h2
          id="recent-quizzes-heading"
          className="text-[10px] md:text-xs font-black tracking-[0.3em] uppercase text-white/40 px-1"
        >
          Recent Quizzes
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-omnave-surface border border-white/10 rounded-[24px] shadow-premium-glass backdrop-blur-md p-4 hover:border-white/20 transition-colors duration-150"
        >
          <ul className="space-y-2" role="list">
            {recent.map((score) => {
              const title = getCleanTitle(notesMap.get(score.lesson_id) || "Lesson Notes");
              const date = score.created_at
                ? new Date(score.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                : "Recent";

              return (
                <li
                  key={score.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors duration-150"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white/80"
                      aria-hidden="true"
                    >
                      <BookOpen size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{title}</p>
                      <p className="text-[10px] text-white/60 font-medium mt-0.5">
                        {date} · Practice Quiz
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 border ${
                      score.percentage >= 80
                        ? "border-emerald-700/50 text-emerald-400 bg-emerald-950/30"
                        : score.percentage >= 50
                           ? "border-amber-700/50 text-amber-400 bg-amber-950/30"
                           : "border-red-700/50 text-red-400 bg-red-950/30"
                    }`}
                  >
                    {score.percentage}%
                  </span>
                </li>
              );
            })}
          </ul>
        </motion.div>
      </div>
    </section>
  );
});
