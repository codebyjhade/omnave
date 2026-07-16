"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ChevronRight, Presentation, CheckCircle, BrainCircuit, BookOpen, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

interface FlashcardEngineProps {
  lessonId: string;
  flashcards: { front: string; back: string }[];
  onNavigateToQuiz: () => void;
  onNavigateToSummary: () => void;
}

export function FlashcardEngine({ lessonId, flashcards, onNavigateToQuiz, onNavigateToSummary }: FlashcardEngineProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  
  // Tracking
  const [flashcardRatings, setFlashcardRatings] = useState<Record<number, "again" | "hard" | "good" | "easy">>({});
  const [leitnerIntervals, setLeitnerIntervals] = useState<Record<number, "new" | "hard" | "easy">>({});

  // Load saved Leitner data on mount
  useEffect(() => {
    const leitnerMemory = localStorage.getItem(`omni_leitner_${lessonId}`);
    if (leitnerMemory) setLeitnerIntervals(JSON.parse(leitnerMemory));
  }, [lessonId]);

  const handleRateDifficulty = useCallback((rating: "again" | "hard" | "good" | "easy") => {
    setFlashcardRatings((prev) => ({ ...prev, [currentSlide]: rating }));
    const mappedRating: "hard" | "easy" = (rating === "again" || rating === "hard") ? "hard" : "easy";
    
    const nextIntervals = { ...leitnerIntervals, [currentSlide]: mappedRating };
    setLeitnerIntervals(nextIntervals);
    localStorage.setItem(`omni_leitner_${lessonId}`, JSON.stringify(nextIntervals));

    if (currentSlide < flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentSlide((s) => s + 1), 200);
    } else {
      setIsSessionCompleted(true);
    }
  }, [currentSlide, flashcards.length, leitnerIntervals, lessonId]);

  const restartSession = () => {
    setCurrentSlide(0);
    setIsFlipped(false);
    setFlashcardRatings({});
    setIsSessionCompleted(false);
  };

  // Keyboard Navigation
  useEffect(() => {
    if (isSessionCompleted || !flashcards.length) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) return;

      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        setCurrentSlide((s) => Math.max(0, s - 1));
        setIsFlipped(false);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        if (currentSlide < flashcards.length - 1) {
          setCurrentSlide((s) => s + 1);
          setIsFlipped(false);
        } else {
          setIsSessionCompleted(true);
        }
      } else if (isFlipped) {
        if (e.key === "1") { e.preventDefault(); handleRateDifficulty("again"); }
        else if (e.key === "2") { e.preventDefault(); handleRateDifficulty("hard"); }
        else if (e.key === "3") { e.preventDefault(); handleRateDifficulty("good"); }
        else if (e.key === "4") { e.preventDefault(); handleRateDifficulty("easy"); }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, isFlipped, isSessionCompleted, flashcards.length, handleRateDifficulty]);

  // Content Formatter Helper
  const renderFormattedContent = (text: string) => {
    if (!text) return null;
    return (
      <div className="text-left w-full max-w-md mx-auto text-white text-sm sm:text-base leading-relaxed space-y-2">
        {text.split("\n").map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith("###")) return <h3 key={idx} className="text-base font-bold text-white mt-3 mb-1">{trimmed.replace(/^###\s*/, "")}</h3>;
          if (trimmed.startsWith("##")) return <h2 key={idx} className="text-lg font-extrabold text-white mt-4 mb-2">{trimmed.replace(/^##\s*/, "")}</h2>;
          if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
            return <ul key={idx} className="list-disc pl-5 my-1 space-y-1"><li>{trimmed.replace(/^[\-\*]\s*/, "")}</li></ul>;
          }
          return <p key={idx} className="my-1">{line}</p>;
        })}
      </div>
    );
  };

  // 1. Empty State
  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-black/[0.4] border border-white/[0.1] backdrop-blur-2xl rounded-[24px] min-h-[220px] shadow-premium-glass select-none w-full max-w-2xl mx-auto">
        <div className="w-12 h-12 bg-white/5 text-white/40 border border-white/10 rounded-xl flex items-center justify-center mb-4">
          <Presentation size={20} />
        </div>
        <h3 className="text-sm font-black text-white mb-1">Flashcards aren't available yet.</h3>
        <p className="text-xs text-white/50 max-w-xs">Generate study materials to review concepts here.</p>
      </div>
    );
  }

  // 2. Completed State
  if (isSessionCompleted) {
    return (
      <div className="bg-black/[0.4] border border-white/[0.1] backdrop-blur-2xl rounded-[24px] p-8 md:p-10 shadow-premium-glass flex flex-col items-center text-center w-full max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-omnave-primary/20 border border-omnave-primary/30 text-omnave-primary rounded-full flex items-center justify-center mb-6 shadow-lg">
          <CheckCircle size={32} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Review Complete! 🎉</h2>
        <p className="text-sm text-white/50 mt-2 max-w-md leading-relaxed">
          Excellent work! You've successfully completed studying the concept flashcards for this lesson.
        </p>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-8 bg-white/[0.02] border border-white/5 p-5 rounded-2xl shadow-sm">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-white">{flashcards.length}</span>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Cards Reviewed</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-white">100%</span>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Completion</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <button onClick={onNavigateToQuiz} className="flex-1 h-12 bg-omnave-primary hover:brightness-110 text-white font-bold rounded-2xl shadow-md active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 text-sm">
            Continue to Quiz <BrainCircuit size={16} />
          </button>
          <button onClick={onNavigateToSummary} className="flex-1 h-12 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 text-sm">
            Return to Lesson <BookOpen size={16} />
          </button>
        </div>
        
        <button onClick={restartSession} className="mt-6 text-xs font-semibold text-white/55 hover:text-white transition-colors flex items-center gap-1.5">
          <RotateCcw size={12} /> Restart Session
        </button>
      </div>
    );
  }

  // 3. Active Playing State
  return (
    <div className="flex flex-col max-w-2xl mx-auto w-full">
      {/* Progress Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-[10px] font-bold text-white/40 mb-4 px-1.5 select-none">
        <span className="uppercase tracking-wider">Card {currentSlide + 1} of {flashcards.length}</span>
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
            <motion.div
              className="bg-gradient-to-r from-omnave-primary/50 to-omnave-primary h-full w-full rounded-full origin-left transform-gpu"
              initial={false}
              animate={{ scaleX: (currentSlide + 1) / flashcards.length }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
          <span className="shrink-0 text-white/60">{Math.round(((currentSlide + 1) / flashcards.length) * 100)}%</span>
        </div>
      </div>      {/* 3D Card Container */}
      <div className="relative w-full aspect-square md:aspect-[4/3] [perspective:1000px] cursor-pointer mb-6 select-none" onClick={() => setIsFlipped(!isFlipped)}>
        <div className="absolute inset-x-4 bottom-[-10px] h-full bg-black/[0.4] border border-white/[0.1] backdrop-blur-2xl rounded-3xl pointer-events-none -z-20 scale-[0.96]" />
        <div className="absolute inset-x-2 bottom-[-5px] h-full bg-black/[0.4] border border-white/[0.1] backdrop-blur-2xl rounded-3xl pointer-events-none -z-10 scale-[0.98]" />
 
        {/* 2. The 3D Flipper Container */}
        <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>

          {/* 3. THE FRONT FACE (Displays the Term) */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-[#130E24]/80 backdrop-blur-xl border border-omnave-primary/40 rounded-3xl shadow-[0_0_40px_rgba(127,34,254,0.15)] flex flex-col items-center justify-center p-8 overflow-hidden transition-transform duration-300">
            {/* Ambient Radial Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(127,34,254,0.15)_0%,transparent_70%)] pointer-events-none" aria-hidden="true" />
            
            <span className="absolute top-6 right-6 text-[10px] font-extrabold tracking-widest text-white/50 uppercase">Concept Card</span>
            
            {/* RENDER THE TERM HERE */}
            <h3 className="text-3xl font-bold text-white drop-shadow-md text-center leading-tight">
              {flashcards[currentSlide].front}
            </h3>
            
            <span className="absolute bottom-6 text-xs text-white/40 uppercase tracking-widest">Tap to Flip</span>
          </div>

          {/* 4. THE BACK FACE (Displays the Explanation - MUST HAVE rotateY(180deg)) */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-[#130E24]/80 backdrop-blur-xl border border-omnave-primary/40 rounded-3xl shadow-[0_0_40px_rgba(127,34,254,0.15)] flex flex-col items-center justify-center p-8 overflow-hidden transition-transform duration-300">
            {/* Ambient Radial Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(127,34,254,0.15)_0%,transparent_70%)] pointer-events-none" aria-hidden="true" />

            <span className="absolute top-6 right-6 text-[10px] font-extrabold tracking-widest text-white/50 uppercase">Explanation</span>
            
            {/* RENDER THE EXPLANATION HERE */}
            <div className="w-full max-h-full overflow-y-auto px-4 py-8 flex items-center justify-center">
              <p className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md text-center leading-normal whitespace-pre-line">
                {flashcards[currentSlide].back} 
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Leitner Controls */}
      {isFlipped && (
        <div className="w-full mb-5 grid grid-cols-4 gap-2 select-none">
          {[
            { label: "Again", rating: "again", color: "bg-red-500/10 border-red-500/20 text-red-400", hint: "1" },
            { label: "Hard", rating: "hard", color: "bg-orange-500/10 border-orange-500/20 text-orange-400", hint: "2" },
            { label: "Good", rating: "good", color: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400", hint: "3" },
            { label: "Easy", rating: "easy", color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-450", hint: "4" }
          ].map((btn) => (
            <button key={btn.label} onClick={(e) => { e.stopPropagation(); handleRateDifficulty(btn.rating as any); }} className={`h-12 rounded-xl border text-[10px] font-black flex flex-col items-center justify-center hover:bg-white/5 ${btn.color}`}>
              <span>{btn.label}</span>
              <span className="text-[8px] opacity-60 mt-0.5 font-semibold">[{btn.hint}]</span>
            </button>
          ))}
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex items-center justify-between gap-3 w-full max-w-md mx-auto mt-4">
        <button onClick={() => { setCurrentSlide((s) => Math.max(0, s - 1)); setIsFlipped(false); }} disabled={currentSlide === 0} className="flex-1 h-12 bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] text-white text-xs font-black rounded-xl disabled:opacity-50 flex items-center justify-center gap-1.5">
          <ArrowLeft size={14} /> Previous
        </button>
        <button onClick={() => setIsFlipped(!isFlipped)} className="flex-1 h-12 bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] text-white font-black rounded-xl">Flip</button>
        <button onClick={() => { currentSlide < flashcards.length - 1 ? (setCurrentSlide((s) => s + 1), setIsFlipped(false)) : setIsSessionCompleted(true) }} className="flex-1 h-12 bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5">
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}