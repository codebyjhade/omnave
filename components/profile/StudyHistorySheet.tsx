"use client";

/**
 * StudyHistorySheet — Standalone vaul bottom sheet for quiz history.
 * Opened from ProfileMenuSheet > Study History row.
 */

import { useState } from "react";
import { Drawer } from "vaul";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";

interface QuizScore {
  id?: string;
  lesson_id: string;
  percentage: number;
  created_at?: string;
}

interface Lesson {
  id: string;
  file_path: string;
  title?: string;
}

interface StudyHistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  quizScores: QuizScore[];
  lessons: Lesson[];
}

function getCleanTitle(path: string, title?: string): string {
  if (title) return title;
  const base = path.split("/").pop() || "";
  return base.replace(/^\d+_/, "").replace(".pdf", "") || "Study Material";
}

export function StudyHistorySheet({
  isOpen,
  onClose,
  quizScores,
  lessons,
}: StudyHistorySheetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayed = isExpanded ? quizScores : quizScores.slice(0, 8);

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      shouldScaleBackground={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm" />

        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-[10000] flex flex-col rounded-t-[28px] bg-[#0D0A1A] border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.6)] outline-none"
          style={{ maxHeight: "88dvh" }}
          aria-label="Study history"
        >
          {/* Handle */}
          <div className="mx-auto mb-5 mt-1 h-1 w-10 rounded-full bg-white/20 shrink-0" />

          {/* Header */}
          <div className="px-5 pb-4 shrink-0">
            <h2 className="text-lg font-black text-white tracking-tight">
              Study History
            </h2>
            <p className="text-xs text-white/40 mt-0.5">
              {quizScores.length} quiz attempt{quizScores.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-4 pb-10 overscroll-contain">
            {quizScores.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <span className="text-5xl select-none">📝</span>
                <p className="text-sm text-white/40 max-w-[200px] leading-relaxed">
                  No quiz history yet. Take a quiz from a lesson to start
                  tracking!
                </p>
              </div>
            ) : (
              <>
                <motion.div layout className="flex flex-col gap-2.5">
                  {displayed.map((q, idx) => {
                    const lesson = lessons.find((l) => l.id === q.lesson_id);
                    const title = lesson
                      ? getCleanTitle(lesson.file_path, lesson.title)
                      : "Study Lesson";
                    const date = q.created_at
                      ? new Date(q.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recently";

                    return (
                      <motion.div
                        layout
                        key={q.id || idx}
                        className="flex justify-between items-center p-4 bg-white/[0.04] border border-white/[0.06] hover:border-white/10 transition-colors rounded-2xl"
                      >
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-sm font-bold text-white truncate pr-4">
                            {title}
                          </span>
                          <span className="text-[10px] text-white/40">
                            {date}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`text-sm font-black ${
                              q.percentage >= 80
                                ? "text-[#1db954]"
                                : q.percentage >= 50
                                ? "text-yellow-400"
                                : "text-red-400"
                            }`}
                          >
                            {q.percentage}%
                          </span>
                          <p className="text-[10px] text-white/30 mt-0.5">
                            Practice Quiz
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>

                {quizScores.length > 8 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full mt-3 py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70 flex items-center justify-center gap-2"
                  >
                    {isExpanded ? (
                      <><ChevronUp size={14} /> Show Less</>
                    ) : (
                      <><ChevronDown size={14} /> View All ({quizScores.length})</>
                    )}
                  </button>
                )}

                <div className="h-6" />
              </>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
