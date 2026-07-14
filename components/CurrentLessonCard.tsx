"use client";

import Link from "next/link";
import { useUserContext } from "@/context/UserContext";
import { useLessons } from "@/hooks/useLessons";
import { getCleanTitle, getSubject } from "@/hooks/useProgressStats";
import EmptyLessonCard from "@/components/EmptyLessonCard";

export default function CurrentLessonCard() {
  const { lessons } = useLessons();
  const { gamificationStats } = useUserContext();

  const currentLesson = lessons[0];

  if (!currentLesson) {
    return <EmptyLessonCard />;
  }

  const title = getCleanTitle(currentLesson.file_path);
  const subject = getSubject(currentLesson.file_path);
  const quizCount = currentLesson.quizzes?.length || 0;
  const flashcardCount = currentLesson.flashcards?.length || 0;

  return (
    <div className="w-full flex flex-col">
      <span className="text-[10px] font-extrabold tracking-[0.2em] text-white/40 uppercase mb-4 pl-2">
        Current Lesson
      </span>
      
      <Link
        href={`/lesson/${currentLesson.id}`}
        role="button"
        tabIndex={0}
        aria-label={`Resume studying: ${title}, ${gamificationStats.xpProgress} percent complete`}
        className="group relative bg-black/[0.4] border border-white/[0.1] backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col w-full overflow-hidden hover:border-omnave-primary/30 transition-all duration-300 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary"
      >
        {/* Ambient Inner Glow */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-omnave-primary/15 blur-[100px] rounded-full pointer-events-none" aria-hidden="true" />
        
        {/* Card Header (Title & Chevron) */}
        <div className="relative z-10 flex items-start justify-between gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-white leading-tight">
              {title}
            </h2>
            <p className="text-xs text-white/50">
              Structured Lesson • {subject}
            </p>
          </div>
          <div className="text-white/40 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all duration-300 pt-1 shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>

        {/* Progress Labels */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <span className="text-[12px] font-medium text-white/60">{gamificationStats.xpProgress}% level progress</span>
          <span className="text-[12px] font-medium text-omnave-primary">Level {gamificationStats.currentLevel}</span>
        </div>

        {/* Tags */}
        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-full text-[10px] font-bold tracking-wide text-white/70">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-omnave-primary"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <span>{flashcardCount} flashcards</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-full text-[10px] font-bold tracking-wide text-white/70">
            <span>{quizCount} quiz tools</span>
          </div>
        </div>

        {/* Absolute Bottom-Edge Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/10" role="progressbar" aria-valuenow={gamificationStats.xpProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Lesson progress">
          <div className="h-full bg-omnave-primary shadow-[0_0_10px_rgba(var(--omnave-primary),0.5)] transition-all" style={{ width: `${gamificationStats.xpProgress}%` }} />
        </div>
      </Link>
    </div>
  );
}