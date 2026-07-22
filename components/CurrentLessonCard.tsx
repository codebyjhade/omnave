"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import { useLessons } from "@/hooks/useLessons";
import { useProgress } from "@/hooks/useProgress";
import { calculateKitProgress } from "@/hooks/useProgressStats";

export default function CurrentLessonCard() {
  const { lessons, loading } = useLessons();
  const { quizScores } = useProgress();

  if (loading) {
    return (
      <div className="relative overflow-hidden bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 sm:p-8 flex justify-between items-center w-full shadow-lg shadow-black/40 animate-pulse min-h-[140px]">
        {/* Ambient Spotlight Glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-600/20 blur-3xl rounded-full pointer-events-none" />

        <div className="flex flex-col text-left flex-1">
          <div className="h-4 w-20 bg-white/[0.06] rounded-md mb-2" />
          <div className="h-6 w-3/4 bg-white/[0.06] rounded mb-1" />
          <div className="h-3.5 w-1/2 bg-white/[0.06] rounded" />
        </div>
        <div className="flex flex-col items-end justify-center gap-2 shrink-0 ml-4">
          <div className="w-12 h-12 rounded-full bg-white/[0.06]" />
          <div className="h-3 w-16 bg-white/[0.06] rounded" />
        </div>

        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5" />
      </div>
    );
  }

  const currentLesson = lessons[0];

  const getCleanTitle = (path: string) => {
    const base = path.split("/").pop() || "";
    const name = base.replace(/^\d+_/, "");
    return name.replace(".pdf", "") || "Current & Future Media Trends";
  };

  const displayTitle = currentLesson?.is_processed && currentLesson?.title 
    ? currentLesson.title 
    : (currentLesson ? getCleanTitle(currentLesson.file_path) : "Current & Future Media Trends");

  const quizCount = currentLesson?.quizzes?.length ?? 60;
  const flashcardCount = currentLesson?.flashcards?.length ?? 15;
  const progress = currentLesson ? calculateKitProgress(currentLesson, quizScores) : 40;
  const targetHref = currentLesson ? `/lesson/${currentLesson.id}` : "/upload";

  return (
    <div className="relative overflow-hidden bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 sm:p-8 flex flex-col justify-between w-full shadow-lg shadow-black/40 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-900/10 hover:border-white/10">
      {/* Ambient Spotlight Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-600/20 blur-3xl rounded-full pointer-events-none" />

      {/* Top Section */}
      <div className="flex justify-between items-center w-full z-10">
        <div className="flex flex-col text-left">
          <span className="inline-block px-2 py-1 bg-white/[0.05] border border-white/[0.05] rounded-md text-[9px] font-bold tracking-widest text-zinc-400 uppercase mb-2 self-start">
            Current Lesson
          </span>
          <h2 className="text-xl font-bold text-white leading-tight">
            {displayTitle}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {flashcardCount} cards • {quizCount} quizzes
          </p>
        </div>

        {/* Right column: Play Button and Completed indicator grouped vertically */}
        <div className="flex flex-col items-end justify-center gap-2 shrink-0 ml-4">
          <Link
            href={targetHref}
            className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(147,51,234,0.4)] transition-all active:scale-95"
            aria-label="Resume study session"
          >
            <Play className="w-5 h-5 fill-current text-white translate-x-0.5" />
          </Link>
          <span className="text-[10px] font-medium text-purple-300">
            {progress}% Completed
          </span>
        </div>
      </div>

      {/* Edge-Aligned Progress Bar Track */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
        <div 
          className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all duration-500" 
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}