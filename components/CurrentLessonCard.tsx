"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import { useLessons } from "@/hooks/useLessons";
import { useProgress } from "@/hooks/useProgress";
import { calculateKitProgress } from "@/hooks/useProgressStats";
import { motion } from "framer-motion";

export default function CurrentLessonCard() {
  const { lessons, loading } = useLessons();
  const { quizScores } = useProgress();

  if (loading) {
    return (
      <div className="relative overflow-hidden bg-omnave-surface border-none rounded-[15px] p-[20px] flex justify-between items-center w-full shadow-[0px_10px_10px_rgba(0,0,0,0.09)] animate-pulse min-h-[140px]">
        {/* Ambient Spotlight Glow */}
        <div className="ambient-glow absolute -top-12 -right-12 w-48 h-48 bg-purple-600/20 blur-3xl rounded-full pointer-events-none" />

        <div className="flex flex-col text-left flex-1">
          <div className="h-4 w-20 bg-omnave-border rounded-md mb-2" />
          <div className="h-6 w-3/4 bg-omnave-border rounded mb-1" />
          <div className="h-3.5 w-1/2 bg-omnave-border rounded" />
        </div>
        <div className="flex flex-col items-end justify-center gap-2 shrink-0 ml-4">
          <div className="w-12 h-12 rounded-full bg-omnave-border" />
          <div className="h-3 w-16 bg-omnave-border rounded" />
        </div>

        <div className="absolute bottom-0 left-0 w-full h-1 bg-omnave-border" />
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
  const springTransition = { type: "spring" as const, stiffness: 400, damping: 25 };

  return (
    <motion.div 
      whileTap={{ scale: 0.95 }}
      transition={springTransition}
      className="relative overflow-hidden bg-omnave-surface border-none rounded-[15px] p-[20px] flex flex-col justify-between w-full shadow-[0px_10px_10px_rgba(0,0,0,0.09)] cursor-pointer select-none"
    >
      {/* Ambient Spotlight Glow */}
      <div className="ambient-glow absolute -top-12 -right-12 w-48 h-48 bg-purple-600/20 blur-3xl rounded-full pointer-events-none" />

      {/* Top Section */}
      <div className="flex justify-between items-center w-full z-10">
        <div className="flex flex-col text-left">
          <span className="inline-block px-2 py-1 bg-black/[0.03] border border-omnave-border rounded-md text-[9px] font-bold tracking-widest text-omnave-secondary-text uppercase mb-2 self-start font-poppins">
            Current Lesson
          </span>
          <h2 className="text-xl font-semibold text-omnave-primary-text leading-tight font-poppins">
            {displayTitle}
          </h2>
          <p className="text-xs text-omnave-secondary-text mt-1 font-poppins">
            {flashcardCount} cards • {quizCount} quizzes
          </p>
        </div>

        {/* Right column: Play Button and Completed indicator grouped vertically */}
        <div className="flex flex-col items-end justify-center gap-2 shrink-0 ml-4">
          <motion.div
            whileTap={{ scale: 0.90 }}
            transition={springTransition}
          >
            <Link
              href={targetHref}
              className="w-12 h-12 rounded-full bg-[#6949a8] hover:bg-[#563b8c] flex items-center justify-center text-white transition-colors cursor-pointer"
              aria-label="Resume study session"
            >
              <Play className="w-5 h-5 fill-current text-white translate-x-0.5" />
            </Link>
          </motion.div>
          <span className="text-[10px] font-semibold text-[#6949a8] font-poppins">
            {progress}% Completed
          </span>
        </div>
      </div>

      {/* Edge-Aligned Progress Bar Track */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-omnave-border">
        <div 
          className="h-full bg-gradient-to-r from-[#6949a8] to-[#86d1ff] transition-all duration-500" 
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}