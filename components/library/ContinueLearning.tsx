"use client";

import React from "react";
import Link from "next/link";
import { Clock } from "lucide-react";

interface ContinueLearningProps {
  noteId: string;
  filePath: string;
  progress: number;
  studyTimeRemaining: string;
}

export function ContinueLearning({
  noteId,
  filePath,
  progress,
  studyTimeRemaining,
}: ContinueLearningProps) {
  const getCleanTitle = (path: string) => {
    const parts = path.split("_");
    return parts.slice(1).join("_").replace(".pdf", "") || "Study Material";
  };

  return (
    <div className="w-full" aria-labelledby="continue-learning-title">
      <h2 
        id="continue-learning-title" 
        className="text-[10px] font-extrabold tracking-[0.2em] text-neutral-500 uppercase mb-4"
      >
        Continue Learning
      </h2>

      <Link 
        href={`/lesson/${noteId}`}
        className="block relative overflow-hidden bg-black/[0.4] border border-white/[0.1] backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-2xl group hover:bg-black/[0.5] hover:border-omnave-primary/20 active:scale-[0.98] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-omnave-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] outline-none"
        aria-label={`Resume studying ${getCleanTitle(filePath)}`}
      >
        {/* Ambient Inner Glow */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-omnave-primary/15 blur-[100px] rounded-full pointer-events-none" aria-hidden="true" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex-1 space-y-3 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-omnave-primary/15 text-omnave-primary text-[9px] font-extrabold uppercase tracking-wider rounded-md border border-omnave-primary/20">
                Featured Kit
              </span>
              <span className="text-[10px] font-semibold text-white/50 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {studyTimeRemaining}
              </span>
            </div>

            <h3 className="text-base md:text-lg font-black text-white truncate group-hover:text-omnave-primary transition-colors" title={getCleanTitle(filePath)}>
              {getCleanTitle(filePath)}
            </h3>

            <div className="flex items-center gap-2 text-[10px] text-white/40 font-semibold">
              <span>{progress}% complete</span>
            </div>
          </div>

          {/* Subtle play affordance */}
          <div className="shrink-0 flex items-center">
            <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-omnave-primary/20 border border-white/10 group-hover:border-omnave-primary/30 flex items-center justify-center transition-all">
              <svg className="w-4 h-4 text-white/60 group-hover:text-omnave-primary transition-colors" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Absolute Bottom-Edge Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Course progress">
          <div 
            className="h-full bg-omnave-primary rounded-r-full transition-all duration-1000 ease-out" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </Link>
    </div>
  );
}
