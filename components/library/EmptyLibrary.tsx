"use client";

import React from "react";
import Link from "next/link";
import { BookOpenText, Upload, Sparkles } from "lucide-react";

interface EmptyLibraryProps {
  onDemoClick?: () => void;
}

export function EmptyLibrary({ onDemoClick }: EmptyLibraryProps) {
  return (
    <div 
      className="border border-dashed border-white/10 rounded-[32px] bg-white/[0.02] p-12 text-center backdrop-blur-md max-w-lg mx-auto mt-6 w-full relative overflow-hidden group"
      role="region"
      aria-label="Empty library onboarding instructions"
    >
      {/* Premium glow indicators */}
      <div className="absolute -right-20 -top-20 opacity-10 pointer-events-none group-hover:scale-105 transition-transform duration-500 text-omnave-primary" aria-hidden="true">
        <Sparkles size={200} />
      </div>

      <div className="w-20 h-20 bg-omnave-primary/20 rounded-full flex items-center justify-center text-omnave-primary mb-6 transition-transform group-hover:scale-105 duration-350 shadow-xs mx-auto">
        <BookOpenText size={36} aria-hidden="true" />
      </div>

      <h3 className="text-lg font-black text-white mb-2 tracking-tight">
        Build Your Study Library
      </h3>
      
      <p className="text-xs md:text-sm text-white/50 font-medium max-w-sm leading-relaxed mb-8 mx-auto">
        Upload your first PDF and omnave. will automatically generate summaries, flashcards, quizzes, and an AI tutor.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
        <Link 
          href="/import" 
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-button-gradient hover:brightness-110 text-white rounded-2xl text-xs font-extrabold shadow-[0_4px_15px_rgba(127,34,254,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all focus:outline-none"
          aria-label="Upload first PDF document"
        >
          <Upload className="w-4 h-4" />
          Upload PDF
        </Link>

        {onDemoClick && (
          <button 
            onClick={onDemoClick}
            className="w-full sm:w-auto px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs font-extrabold border border-white/10 hover:scale-[1.02] active:scale-[0.98] transition-all focus:outline-none"
            aria-label="View study kit interactive demo"
          >
            View Demo
          </button>
        )}
      </div>
    </div>
  );
}
