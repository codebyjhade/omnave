"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, BookOpen, Clock, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

interface LessonHeaderProps {
  title: string;
  subject?: string;
  flashcardCount: number;
  quizCount: number;
  completionPercentage?: number;
  lastStudied?: string;
  readingTime?: string;
  topics: string[];
  onTopicClick: (topic: string) => void;
}

export const LessonHeader = memo(function LessonHeader({
  title,
  subject = "Study Material",
  flashcardCount,
  quizCount,
  completionPercentage = 0,
  lastStudied,
  readingTime = "5 min read",
  topics,
  onTopicClick,
}: LessonHeaderProps) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full pt-6 pb-2 select-none"
    >
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-1.5 text-[10px] font-extrabold tracking-[0.2em] text-neutral-500 uppercase mb-4">
        <button
          onClick={() => router.push("/library")}
          className="hover:text-white transition-colors duration-150"
        >
          Library
        </button>
        <ChevronRight size={10} className="mx-0.5" />
        <span className="truncate max-w-[120px] text-white/60">{title}</span>
      </nav>
 
      {/* Premium Card Header */}
      <div className="bg-black/[0.4] border border-white/[0.1] backdrop-blur-2xl rounded-[24px] p-6 md:p-8 mb-6 shadow-premium-glass">
        {/* Subject badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-bold text-omnave-primary uppercase tracking-widest bg-omnave-primary/20 border border-omnave-primary/30 px-2.5 py-1 rounded-full">
            {subject}
          </span>
          {completionPercentage > 0 && (
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest bg-white/5 border border-white/10 px-2.5 py-1 rounded-full flex items-center gap-1">
              <BarChart3 size={10} />
              {completionPercentage}%
            </span>
          )}
        </div>
 
        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight select-text mb-4">
          {title}
        </h1>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-white/70 mb-5">
          <span className="flex items-center gap-1.5">
            <BookOpen size={12} />
            {readingTime}
          </span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>{flashcardCount} Concept Cards</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>{quizCount} Quiz Questions</span>
          {lastStudied && (
            <>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="flex items-center gap-1.5">
                <Clock size={12} />
                Last studied {lastStudied}
              </span>
            </>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Lesson Progress</span>
            <span className="text-[10px] font-bold text-omnave-primary">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
            <motion.div
              className="bg-gradient-to-r from-omnave-primary/50 to-omnave-primary h-full w-full rounded-full origin-left transform-gpu"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: completionPercentage / 100 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Topic chips */}
        {topics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {topics.map((topic, i) => (
              <button
                key={i}
                onClick={() => onTopicClick(topic)}
                className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all duration-150 rounded-full text-xs font-bold truncate max-w-[150px] cursor-pointer"
              >
                {topic}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
});
