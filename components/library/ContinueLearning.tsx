"use client";

import React from "react";
import Link from "next/link";
import { Clock, FileText, Play } from "lucide-react";

interface ContinueLearningProps {
  noteId: string;
  filename: string;
  ai_title?: string | null;
  progress: number;
  studyTimeRemaining: string;
}

export function ContinueLearning({
  noteId,
  filename,
  ai_title,
  progress,
  studyTimeRemaining,
}: ContinueLearningProps) {
  const getCleanTitle = (name: string) => {
    // Strip timestamp prefix if present
    const parts = name.split("_");
    if (parts.length > 1 && /^\d+$/.test(parts[0])) {
      return parts.slice(1).join("_").replace(".pdf", "") || "Study Material";
    }
    return name.replace(".pdf", "") || "Study Material";
  };

  const displayTitle = ai_title || (progress === 100 ? getCleanTitle(filename) : "Analyzing topic...");

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
        className="relative flex flex-col p-6 pb-7 bg-[#130E24]/80 backdrop-blur-xl border border-omnave-primary/20 rounded-3xl overflow-hidden w-full min-h-[200px] shadow-[0_0_40px_rgba(127,34,254,0.05)] cursor-pointer group active:scale-[0.99] transition-all select-none block"
        aria-label={`Resume studying ${displayTitle}`}
      >
        {/* Ambient Glow (Exclusive to Featured Card) */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-omnave-primary/10 rounded-full blur-[80px] pointer-events-none translate-x-[-20%] translate-y-[-20%]" aria-hidden="true" />

        {/* Top Badges */}
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <span className="px-3 py-1 bg-omnave-primary/20 text-omnave-primary text-[10px] font-bold tracking-wider uppercase rounded-md border border-omnave-primary/30">
            Featured Kit
          </span>
          <span className="text-white/40 text-[12px] font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {studyTimeRemaining}
          </span>
        </div>

        {/* Text Hierarchy: Title + Filename */}
        <div className="flex flex-col mb-6 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight line-clamp-2 drop-shadow-sm text-left">
            {displayTitle}
          </h2>
          <p className="text-sm text-white/50 mt-1.5 flex items-center gap-2 text-left" title={filename}>
            <FileText className="w-4 h-4 shrink-0 text-white/40" />
            {filename}
          </p>
        </div>

        {/* Bottom Action Area (Grouped CTA & Status) */}
        <div className="mt-auto flex items-center justify-between relative z-10 w-full">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-omnave-primary hover:bg-omnave-primary/80 transition-all shadow-[0_0_20px_rgba(127,34,254,0.4)] hover:scale-105">
            <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
          </div>
          
          <span className="text-sm font-semibold text-white/70">
            {progress}% Complete
          </span>
        </div>

        {/* Edge-to-Edge Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-white/5 pointer-events-none">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 to-omnave-primary relative shadow-[0_0_10px_rgba(127,34,254,0.8)] transition-all duration-500" 
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-white/40 blur-[3px]" />
          </div>
        </div>
      </Link>
    </div>
  );
}
