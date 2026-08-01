"use client";
 
import React from "react";
import { Zap, Target, Play, Sparkles, CheckSquare, AlignLeft, ToggleLeft } from "lucide-react";
 
interface QuizSetupProps {
  selectedFormats: string[];
  setSelectedFormats: React.Dispatch<React.SetStateAction<string[]>>;
  sessionLength: number;
  setSessionLength: (len: number) => void;
  focusArea: string;
  setFocusArea: (area: string) => void;
  potentialXp: number;
  onStartQuiz: () => void;
}
 
export const QuizSetup = React.memo(function QuizSetup({
  selectedFormats,
  setSelectedFormats,
  sessionLength,
  setSessionLength,
  focusArea,
  setFocusArea,
  potentialXp,
  onStartQuiz
}: QuizSetupProps) {
 
  const toggleType = (type: string) => {
    setSelectedFormats(prev => 
      prev.includes(type) && prev.length > 1 
        ? prev.filter(t => t !== type) 
        : !prev.includes(type) 
          ? [...prev, type] 
          : prev
    );
  };
 
  const isSelectedFormat = (type: string) => {
    return selectedFormats.some(f => f.replace(/[^a-z0-9]/g, '') === type.replace(/[^a-z0-9]/g, ''));
  };
 
  return (
    <div className="w-full max-w-3xl mx-auto mt-4 animate-in fade-in duration-300 font-poppins">
      <div className="mb-8 text-left">
        <h2 className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-2">Formative Assessment</h2>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">Custom Practice Quiz</h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-xl font-normal">Configure your ideal study session. Select your preferred formats and let the AI pull from the master question bank.</p>
      </div>
 
      <div className="p-6 sm:p-10 relative overflow-hidden bg-transparent">
        <div className="relative z-10 flex flex-col gap-10">
          
          {/* Section 1: Question Format */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-gray-400" />
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Question Formats</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button 
                onClick={() => toggleType("multiple-choice")} 
                className={`flex flex-col items-start p-4 rounded-xl border text-left cursor-pointer active:scale-[0.98] transition-all duration-100 ${
                  isSelectedFormat("multiple-choice") 
                    ? 'border-[#6949a8] bg-[#6949a8]/5 text-[#6949a8] ring-1 ring-[#6949a8]' 
                    : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50/50 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CheckSquare size={16} className={isSelectedFormat("multiple-choice") ? "text-[#6949a8]" : ""} />
                  <span className="text-xs font-bold">Multiple Choice</span>
                </div>
                <span className="text-[10px] opacity-70">Standard 4-option questions</span>
              </button>
 
              <button 
                onClick={() => toggleType("true-false")} 
                className={`flex flex-col items-start p-4 rounded-xl border text-left cursor-pointer active:scale-[0.98] transition-all duration-100 ${
                  isSelectedFormat("true-false") 
                    ? 'border-[#6949a8] bg-[#6949a8]/5 text-[#6949a8] ring-1 ring-[#6949a8]' 
                    : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50/50 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ToggleLeft size={16} className={isSelectedFormat("true-false") ? "text-[#6949a8]" : ""} />
                  <span className="text-xs font-bold">True / False</span>
                </div>
                <span className="text-[10px] opacity-70">Quick binary fact checking</span>
              </button>
 
              <button 
                onClick={() => toggleType("identification")} 
                className={`flex flex-col items-start p-4 rounded-xl border text-left cursor-pointer active:scale-[0.98] transition-all duration-100 ${
                  isSelectedFormat("identification") 
                    ? 'border-[#6949a8] bg-[#6949a8]/5 text-[#6949a8] ring-1 ring-[#6949a8]' 
                    : 'border-gray-200 bg-white text-gray-550 hover:bg-gray-50/50 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlignLeft size={16} className={isSelectedFormat("identification") ? "text-[#6949a8]" : ""} />
                  <span className="text-xs font-bold">Identification</span>
                </div>
                <span className="text-[10px] opacity-70">Type the exact term/concept</span>
              </button>
            </div>
          </div>
 
          <div className="w-full h-[1px] bg-gray-100" />
 
          {/* Section 2: Question Count */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-gray-400" />
              <h3 className="text-xs font-bold text-gray-505 uppercase tracking-wider">Session Length</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[15, 20, 30, 40].map((num) => {
                const isSelected = sessionLength === num;
                return (
                  <button 
                    key={num} 
                    onClick={() => setSessionLength(num)} 
                    className={`relative h-12 rounded-xl border text-xs font-bold transition-all duration-100 active:scale-[0.97] overflow-hidden cursor-pointer ${
                      isSelected 
                        ? 'border-[#6949a8] bg-[#6949a8]/5 text-[#6949a8] ring-1 ring-[#6949a8]' 
                        : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50/50 hover:text-gray-700'
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
              <Target className="w-4 h-4 text-gray-400" />
              <h3 className="text-xs font-bold text-gray-550 uppercase tracking-wider">Focus Area</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                onClick={() => setFocusArea("random")} 
                className={`flex flex-col items-start text-left p-4 rounded-xl border cursor-pointer active:scale-[0.98] transition-all duration-100 ${
                  focusArea === "random" 
                    ? 'border-[#6949a8] bg-[#6949a8]/5' 
                    : 'border-gray-200 bg-white hover:bg-gray-50/50'
                }`}
              >
                <span className={`text-xs font-bold mb-1 ${focusArea === "random" ? 'text-[#6949a8]' : 'text-gray-705'}`}>Random Mix</span>
                <span className="text-[10px] text-gray-400 font-medium">Pull from the entire Master Bank.</span>
              </button>
              
              <button 
                onClick={() => setFocusArea("weaknesses")} 
                className={`flex flex-col items-start text-left p-4 rounded-xl border cursor-pointer active:scale-[0.98] transition-all duration-100 ${
                  focusArea === "weaknesses" || focusArea === "weakness"
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                    : 'border-gray-200 bg-white hover:bg-gray-50/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold ${focusArea === "weaknesses" || focusArea === "weakness" ? 'text-emerald-700' : 'text-gray-700'}`}>Target Weaknesses</span>
                  <Sparkles className={`w-3 h-3 ${focusArea === "weaknesses" || focusArea === "weakness" ? 'text-emerald-500' : 'text-gray-300'}`} />
                </div>
                <span className="text-[10px] text-gray-400 font-medium">Focus on concepts flagged as "Hard".</span>
              </button>
            </div>
          </div>
 
          <div className="w-full h-[1px] bg-gray-100 my-2" />
 
          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-[#6949a8]">
                <span className="text-[10px] font-bold">+{potentialXp}</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-gray-800">XP Reward</span>
                <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">Upon Completion</span>
              </div>
            </div>
 
            <button 
              disabled={selectedFormats.length === 0}
              onClick={onStartQuiz} 
              className="w-full sm:w-auto h-12 px-8 bg-[#6949a8] hover:bg-[#6949a8]/95 text-white font-bold rounded-xl border-none flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97] transition-all duration-100 text-xs shadow-md disabled:opacity-50"
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