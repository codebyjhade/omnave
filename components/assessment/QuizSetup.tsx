"use client";

import React, { useState } from "react";
import { BrainCircuit, Zap, Target, Play, Sparkles, CheckSquare, AlignLeft, ToggleLeft } from "lucide-react";
import { motion } from "framer-motion";

interface QuizSetupProps {
  onStartQuiz: (config: { count: number; focus: "random" | "weakness"; types: string[] }) => void;
}

export const QuizSetup = React.memo(function QuizSetup({ onStartQuiz }: QuizSetupProps) {
  const [questionCount, setQuestionCount] = useState<number>(15);
  const [focusMode, setFocusMode] = useState<"random" | "weakness">("random");
  
  // Let the user choose their exact formats!
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["multiple-choice"]);

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) && prev.length > 1 
        ? prev.filter(t => t !== type) 
        : !prev.includes(type) 
          ? [...prev, type] 
          : prev
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-4 animate-in fade-in duration-300">
      <div className="mb-8 text-left">
        <h2 className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 uppercase mb-2">Formative Assessment</h2>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-3">Custom Practice Quiz</h1>
        <p className="text-xs sm:text-sm text-white/50 max-w-xl">Configure your ideal study session. Select your preferred formats and let the AI pull from the massive master question bank.</p>
      </div>
 
      <div className="bg-omnave-surface border border-white/5 rounded-2xl p-6 sm:p-10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-10">
          
          {/* Section 1: Question Format */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-white/40" />
              <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Question Formats</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button 
                onClick={() => toggleType("multiple-choice")} 
                className={`flex flex-col items-start p-4 rounded-xl border text-left cursor-pointer active:scale-[0.98] transition-[background-color,border-color] duration-100 ${
                  selectedTypes.includes("multiple-choice") 
                    ? 'border-omnave-primary bg-[#201B30] text-white ring-1 ring-omnave-primary' 
                    : 'border-white/10 bg-white/[0.01] text-white/50 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CheckSquare size={16} className={selectedTypes.includes("multiple-choice") ? "text-omnave-primary" : ""} />
                  <span className="text-xs font-bold">Multiple Choice</span>
                </div>
                <span className="text-[10px] opacity-70">Standard 4-option questions</span>
              </button>

              <button 
                onClick={() => toggleType("true-false")} 
                className={`flex flex-col items-start p-4 rounded-xl border text-left cursor-pointer active:scale-[0.98] transition-[background-color,border-color] duration-100 ${
                  selectedTypes.includes("true-false") 
                    ? 'border-omnave-primary bg-[#201B30] text-white ring-1 ring-omnave-primary' 
                    : 'border-white/10 bg-white/[0.01] text-white/50 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ToggleLeft size={16} className={selectedTypes.includes("true-false") ? "text-omnave-primary" : ""} />
                  <span className="text-xs font-bold">True / False</span>
                </div>
                <span className="text-[10px] opacity-70">Quick binary fact checking</span>
              </button>

              <button 
                onClick={() => toggleType("identification")} 
                className={`flex flex-col items-start p-4 rounded-xl border text-left cursor-pointer active:scale-[0.98] transition-[background-color,border-color] duration-100 ${
                  selectedTypes.includes("identification") 
                    ? 'border-omnave-primary bg-[#201B30] text-white ring-1 ring-omnave-primary' 
                    : 'border-white/10 bg-white/[0.01] text-white/50 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlignLeft size={16} className={selectedTypes.includes("identification") ? "text-omnave-primary" : ""} />
                  <span className="text-xs font-bold">Identification</span>
                </div>
                <span className="text-[10px] opacity-70">Type the exact term/concept</span>
              </button>
            </div>
          </div>

          <div className="w-full h-[1px] bg-white/5" />

          {/* Section 2: Question Count */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-white/40" />
              <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Session Length</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[15, 20, 30, 40].map((num) => {
                const isSelected = questionCount === num;
                return (
                  <button 
                    key={num} 
                    onClick={() => setQuestionCount(num)} 
                    className={`relative h-12 rounded-xl border text-xs font-bold transition-[background-color,border-color] duration-100 active:scale-[0.97] active:opacity-80 overflow-hidden cursor-pointer ${
                      isSelected 
                        ? 'border-omnave-primary bg-[#201B30] text-white ring-1 ring-omnave-primary' 
                        : 'border-white/10 bg-white/[0.01] text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="relative z-10">{num} Qs</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Focus Area */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-white/40" />
              <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Focus Area</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                onClick={() => setFocusMode("random")} 
                className={`flex flex-col items-start text-left p-4 rounded-xl border cursor-pointer active:scale-[0.98] transition-[background-color,border-color] duration-100 ${
                  focusMode === "random" 
                    ? 'border-omnave-primary bg-[#201B30]' 
                    : 'border-white/10 bg-white/[0.01] hover:bg-white/5'
                }`}
              >
                <span className={`text-xs font-bold mb-1 ${focusMode === "random" ? 'text-white' : 'text-white/70'}`}>Random Mix</span>
                <span className="text-[10px] text-white/40 font-medium">Pull from the entire Master Bank.</span>
              </button>
              
              <button 
                onClick={() => setFocusMode("weakness")} 
                className={`flex flex-col items-start text-left p-4 rounded-xl border cursor-pointer active:scale-[0.98] transition-[background-color,border-color] duration-100 ${
                  focusMode === "weakness" 
                    ? 'border-emerald-500 bg-[#14291B]' 
                    : 'border-white/10 bg-white/[0.01] hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold ${focusMode === "weakness" ? 'text-emerald-400' : 'text-white/70'}`}>Target Weaknesses</span>
                  <Sparkles className={`w-3 h-3 ${focusMode === "weakness" ? 'text-emerald-400' : 'text-white/20'}`} />
                </div>
                <span className="text-[10px] text-white/40 font-medium">Focus on concepts flagged as "Hard".</span>
              </button>
            </div>
          </div>

          <div className="w-full h-[1px] bg-white/5 my-2" />

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white/60">+15</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-white">XP Reward</span>
                <span className="text-[9px] font-medium text-white/40 uppercase tracking-wider">Upon Completion</span>
              </div>
            </div>

            <button 
              onClick={() => onStartQuiz({ count: questionCount, focus: focusMode, types: selectedTypes })} 
              className="w-full sm:w-auto h-12 px-8 bg-white hover:bg-white/95 text-black font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97] active:opacity-90 transition-[background-color,opacity] duration-100 text-xs font-sans"
            >
              <span>Start Practice</span>
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

QuizSetup.displayName = "QuizSetup";