"use client";

import { memo } from "react";
import { BookOpen, BrainCircuit, Presentation, FileQuestion } from "lucide-react";
import type { TabId } from "./LessonNav";

interface StudySessionBannerProps {
  activeTab: TabId;
  flashcardCount: number;
  quizCount: number;
  studyDuration?: number; // in seconds
}

const tabConfig: Record<TabId, { label: string; icon: React.ReactNode }> = {
  summary: { label: "Studying Summary", icon: <BookOpen size={12} /> },
  quiz: { label: "Practice Quiz", icon: <BrainCircuit size={12} /> },
  slides: { label: "Reviewing Flashcards", icon: <Presentation size={12} /> },
  exam: { label: "Exam Prep", icon: <FileQuestion size={12} /> },
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export const StudySessionBanner = memo(function StudySessionBanner({
  activeTab,
  flashcardCount,
  quizCount,
  studyDuration,
}: StudySessionBannerProps) {
  const config = tabConfig[activeTab];

  return (
    <div className="flex items-center justify-between py-3 select-none bg-white/5 border border-white/10 rounded-2xl px-4 mb-4 w-full">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-white/80">
          {config.icon}
          {config.label}
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px] font-semibold text-white/60">
        {studyDuration !== undefined && studyDuration > 0 && (
          <>
            <span>{formatDuration(studyDuration)}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
          </>
        )}
        <span>{flashcardCount} cards</span>
        <span className="w-1 h-1 rounded-full bg-white/20" />
        <span>{quizCount} questions</span>
      </div>
    </div>
  );
});
