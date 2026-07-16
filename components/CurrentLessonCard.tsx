"use client";

import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";
import { useUserContext } from "@/context/UserContext";
import { useLessons } from "@/hooks/useLessons";
import { useProgress } from "@/hooks/useProgress";
import { calculateKitProgress } from "@/hooks/useProgressStats";
import EmptyLessonCard from "@/components/EmptyLessonCard";

export default function CurrentLessonCard() {
  const { lessons } = useLessons();
  const { gamificationStats } = useUserContext();
  const { quizScores } = useProgress();

  const currentLesson = lessons[0];

  if (!currentLesson) {
    return <EmptyLessonCard />;
  }

  const getCleanTitle = (path: string) => {
    const base = path.split("/").pop() || "";
    const name = base.replace(/^\d+_/, "");
    return name.replace(".pdf", "") || "Study Material";
  };

  const getRawFilename = (path: string) => {
    const base = path.split("/").pop() || "";
    return base.replace(/^\d+_/, "") || "document.pdf";
  };

  const filename = getRawFilename(currentLesson.file_path);
  const displayTitle = currentLesson.is_processed && currentLesson.title 
    ? currentLesson.title 
    : (!currentLesson.is_processed ? "Analyzing topic..." : getCleanTitle(currentLesson.file_path));

  const quizCount = currentLesson.quizzes?.length || 0;
  const flashcardCount = currentLesson.flashcards?.length || 0;

  const progress = calculateKitProgress(currentLesson, quizScores);

  return (
    <div className="w-full flex flex-col">
      <span className="text-[10px] font-extrabold tracking-[0.2em] text-white/40 uppercase mb-4 pl-2">
        Current Lesson
      </span>
      
      <Link
        href={`/lesson/${currentLesson.id}`}
        className="group relative flex flex-col p-6 pb-7 bg-[#130E24]/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden hover:bg-white/[0.03] transition-all duration-300 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.2)] active:scale-[0.99] outline-none"
        aria-label={`Resume studying: ${displayTitle}, ${progress} percent complete`}
      >
        {/* Ambient Hover Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-omnave-primary/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-omnave-primary/15 transition-colors duration-500"></div>

        {/* Top Section: Headers & Chevron */}
        <div className="flex justify-between items-start mb-6 relative z-10 w-full">
          <div className="flex flex-col pr-6 min-w-0 text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight line-clamp-2">
              {displayTitle}
            </h2>
            <p className="text-sm text-white/40 mt-1.5 flex items-center gap-1.5 truncate" title={filename}>
              <FileText className="w-4 h-4 shrink-0 text-white/30" />
              {filename}
            </p>
          </div>
          
          {/* Action Chevron */}
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-omnave-primary/20 group-hover:text-omnave-primary transition-colors flex-shrink-0">
            <ChevronRight className="w-5 h-5 text-white/50 group-hover:text-omnave-primary transition-colors" />
          </div>
        </div>

        {/* Bottom Section: Stats & Progress Text */}
        <div className="mt-auto flex flex-col gap-3 relative z-10 w-full text-left">
          {/* Condensed Meta Row (Replaces bulky pills) */}
          <p className="text-[11px] text-white/40 font-medium tracking-wide uppercase">
            {flashcardCount} {flashcardCount === 1 ? "Card" : "Cards"} • {quizCount} {quizCount === 1 ? "Quiz" : "Quizzes"}
          </p>

          <div className="flex justify-between items-end">
            <span className="text-sm font-semibold text-white/80">{progress}% Progress</span>
            <span className="text-sm font-bold text-omnave-primary">Level {gamificationStats.currentLevel}</span>
          </div>
        </div>

        {/* Edge-to-Edge Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-white/5 pointer-events-none">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 to-omnave-primary relative transition-all duration-500" 
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/40 blur-[2px]"></div>
          </div>
        </div>
      </Link>
    </div>
  );
}