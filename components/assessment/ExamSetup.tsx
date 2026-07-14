"use client";

import React, { useState } from "react";
import { ShieldAlert, Clock, BarChart, Flag, ChevronRight, Layers } from "lucide-react";
import { motion } from "framer-motion";

interface ExamSetupProps {
  maxQuestions: number;
  onStartExam: (config: { count: number; timeLimit: number; difficulty: string }) => void;
}

export function ExamSetup({ maxQuestions, onStartExam }: ExamSetupProps) {
  // Hardcore scaling: 50 to 80 questions.
  const safeMax = Math.max(1, maxQuestions);
  const countOptions = Array.from(new Set([50, 60, 70, 80].map(n => Math.min(n, safeMax))));
  const timeOptions = [60, 90, 120, 180]; // Scaled up in minutes

  const [examLength, setExamLength] = useState<number>(countOptions[countOptions.length - 1] || 50);
  const [timeLimit, setTimeLimit] = useState<number>(120);
  const [difficulty, setDifficulty] = useState<"standard" | "hard">("hard");

  return (
    <div className="w-full max-w-3xl mx-auto mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="mb-8 text-left">
        <h2 className="text-[10px] font-extrabold tracking-[0.2em] text-neutral-500 uppercase mb-2">Summative Assessment</h2>
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-3">Master Examination</h1>
        <p className="text-sm text-white/50 max-w-xl">
          A high-endurance, distraction-free simulation. This exam utilizes a strictly randomized mix of Multiple Choice, True/False, and Identification questions.
        </p>
      </div>
 
      {/* Configuration Card */}
      <div className="bg-black/[0.4] border border-amber-500/20 backdrop-blur-2xl rounded-[24px] p-6 sm:p-10 shadow-premium-glass relative overflow-hidden">
        
        {/* Background warning glow */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-10">
          
          {/* Warning Banner */}
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl shadow-sm">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-amber-500">Endurance Mode Required</span>
              <span className="text-xs text-amber-500/70 font-medium mt-1 leading-relaxed">
                Starting this exam locks your screen. Questions and options are completely scrambled. Leaving early results in an automatic score of zero.
              </span>
            </div>
          </div>

          <div className="w-full h-[1px] bg-white/5" />

          {/* Section 1: Exam Length */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <BarChart className="w-4 h-4 text-white/40" />
              <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Exam Length</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {countOptions.map((num) => {
                const isSelected = examLength === num;
                return (
                  <button
                    key={`count-${num}`}
                    onClick={() => setExamLength(num)}
                    className={`relative h-14 rounded-2xl border text-sm font-bold transition-all duration-200 overflow-hidden
                      ${isSelected 
                          ? 'border-amber-500 bg-amber-500/10 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                          : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white cursor-pointer'
                      }
                    `}
                  >
                    {isSelected && <motion.div layoutId="activeExamLength" className="absolute inset-0 bg-amber-500/20" initial={false} transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                    <span className="relative z-10">{num} Qs</span>
                  </button>
                );
              })}
            </div>
            {maxQuestions < 60 && (
              <p className="text-[10px] text-red-400 font-bold ml-1">
                * Your Master Bank currently only has {maxQuestions} questions. Upload a new document to generate 60.
              </p>
            )}
          </div>

          {/* Section 2: Time Limit */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-white/40" />
              <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Time Limit</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {timeOptions.map((mins) => {
                const isSelected = timeLimit === mins;
                return (
                  <button
                    key={`time-${mins}`}
                    onClick={() => setTimeLimit(mins)}
                    className={`relative h-14 rounded-2xl border text-sm font-bold transition-all duration-200 overflow-hidden
                      ${isSelected 
                          ? 'border-amber-500 bg-amber-500/10 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                          : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white cursor-pointer'
                      }
                    `}
                  >
                    {isSelected && <motion.div layoutId="activeTimeLimit" className="absolute inset-0 bg-amber-500/20" initial={false} transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                    <span className="relative z-10">{mins} Min</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full h-[1px] bg-white/5 my-2" />

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <span className="text-[10px] font-black text-amber-500">+100</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">Master XP Reward</span>
                <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest">Maximum Multiplier</span>
              </div>
            </div>

            <button
              onClick={() => onStartExam({ count: examLength, timeLimit, difficulty })}
              disabled={maxQuestions === 0}
              className="group relative w-full sm:w-auto h-14 px-8 bg-amber-500 hover:bg-amber-400 text-[#0A0A0A] font-black rounded-2xl overflow-hidden transition-all duration-200 active:scale-[0.98] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                <span>Enter Exam Room</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}