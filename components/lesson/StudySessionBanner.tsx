"use client";

import { memo } from "react";
import { BookOpen, BrainCircuit, Presentation, FileQuestion, X } from "lucide-react";
import type { TabId } from "./LessonNav";
import { useAssessmentGuard } from "@/context/AssessmentContext";

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
  studyDuration,
}: StudySessionBannerProps) {
  const config = tabConfig[activeTab];
  const { abandonHandler } = useAssessmentGuard();

  return (
    <div className="flex items-center justify-between w-full px-4 py-2.5 bg-omnave-surface border border-white/5 rounded-full shadow-sm mt-4 select-none antialiased mb-4">
      {/* Left: Status Dot & Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[13px] font-semibold text-white/90">
          {config.label}
        </span>
      </div>

      {/* Right: Timer & Exit Button */}
      <div className="flex items-center gap-3">
        {/* Timer */}
        {studyDuration !== undefined && studyDuration > 0 && (
          <span className="text-[13px] font-mono font-medium text-omnave-primary">
            {formatDuration(studyDuration)}
          </span>
        )}
        
        {/* End Button */}
        {abandonHandler && (
          <>
            <div className="w-px h-4 bg-white/10" />
            <button 
              onClick={() => abandonHandler()}
              className="text-white/40 hover:text-red-400 hover:bg-red-500/10 px-2 py-1 rounded-md transition-colors text-[12px] font-bold tracking-wide uppercase flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              <X size={12} /> End
            </button>
          </>
        )}
      </div>
    </div>
  );
});
