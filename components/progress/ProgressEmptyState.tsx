"use client";

import { memo } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export const ProgressEmptyState = memo(function ProgressEmptyState() {
  return (
    <div className="bg-[#151C2C]/60 border border-white/5 rounded-[24px] shadow-premium-glass backdrop-blur-md p-8 py-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto">
      <div
        className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-amber-500 mb-5"
        aria-hidden="true"
      >
        <AlertCircle size={28} />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">No Study History Yet</h3>
      <p className="text-sm text-white/60 font-medium max-w-sm leading-relaxed mb-6">
        Complete practice quizzes in your library to start tracking scores, streaks, and progress.
      </p>
      <Link
        href="/library"
        className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-button-gradient hover:brightness-110 text-white rounded-xl text-sm font-bold transition-all duration-150 hover:-translate-y-0.5 shadow-[0_4px_15px_rgba(127,34,254,0.3)]"
      >
        Open Library
      </Link>
    </div>
  );
});
