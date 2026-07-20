"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BrainCircuit, Trophy, ShieldAlert, Timer, ChevronLeft, 
  ChevronRight, Award, CheckCircle2, RotateCcw, AlertTriangle, 
  FileText, Sparkles, Check, Play, Flag, HelpCircle, X, 
  PanelRightClose, PanelRightOpen, ArrowLeft, RefreshCw, BookOpen, 
  Sparkle, ShieldCheck 
} from "lucide-react";
import { generateAssessment, type GeneratedQuestion } from "@/lib/assessmentGenerator";
import { useUserContext } from "@/context/UserContext";
import { useAssessmentGuard } from "@/context/AssessmentContext";
import { ProgressService } from "../../services/progress.service";

// Import our new dedicated setup screens
import { QuizSetup } from "@/components/assessment/QuizSetup";
import { ExamSetup } from "@/components/assessment/ExamSetup";

interface AssessmentEngineProps {
  lesson: {
    id: string;
    file_path?: string;
    content_url?: string;
    summary?: string;
    quizzes?: any;
  };
  activeTab: "quiz" | "exam";
}

type AssessmentState = "setup" | "playing" | "review-screen" | "grading" | "results";
type AssessmentMode = "quiz" | "mock";

interface IdentificationInputProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  className?: string;
}

const IdentificationInput = React.memo(({ value, onChange, disabled = false, className }: IdentificationInputProps) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (localValue === value) return;
    const handler = setTimeout(() => {
      onChange(localValue);
    }, 300);
    return () => clearTimeout(handler);
  }, [localValue, onChange, value]);

  const handleBlur = () => {
    onChange(localValue);
  };

  return (
    <input
      type="text"
      disabled={disabled}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      placeholder="Type your answer here..."
      className={className}
    />
  );
});
IdentificationInput.displayName = "IdentificationInput";

// Helper function: Fisher-Yates Scrambler for maximum randomness
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const prepareScrambledAssessment = (generated: GeneratedQuestion[]) => {
  // 1. Scramble the order of the questions
  let scrambledQuestions = shuffleArray(generated);
  
  // 2. Scramble the Multiple Choice options inside each question!
  scrambledQuestions = scrambledQuestions.map(q => {
    if (q.type === "multiple-choice" && q.options) {
      return { ...q, options: shuffleArray(q.options) };
    }
    return q;
  });

  return scrambledQuestions;
};

export const AssessmentEngine = React.memo(function AssessmentEngine({ lesson, activeTab }: AssessmentEngineProps) {
  const { user, updateStatsAfterQuiz } = useUserContext();
  const { 
    isAssessmentActive, 
    setIsAssessmentActive, 
    setSaveAndExitHandler,
    abandonHandler,
    setAbandonHandler,
    triggerNavAttempt 
  } = useAssessmentGuard();

  // Engine States
  const [gameState, setGameState] = useState<AssessmentState>("setup");
  const [mode, setMode] = useState<AssessmentMode>("quiz");
  
  // Playing States
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [duration, setDuration] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [quizChecked, setQuizChecked] = useState<Record<number, boolean>>({});

  // Restore State Banner
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [showAbortModal, setShowAbortModal] = useState(false);

  // Results State
  const [completedTime, setCompletedTime] = useState(0);
  const [score, setScore] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [gradingProgress, setGradingProgress] = useState(0);
  const [gradingText, setGradingText] = useState("Validating blueprint answers...");

  // Timers Refs
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const spentIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const gradingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Master cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (spentIntervalRef.current) clearInterval(spentIntervalRef.current);
      if (gradingIntervalRef.current) clearInterval(gradingIntervalRef.current);
    };
  }, []);

  // =============================================================================
  // 1. ROUTE GUARD & LOCK STATE INTERCEPT
  // =============================================================================

  useEffect(() => {
    if (gameState === "playing" || gameState === "review-screen") {
      setIsAssessmentActive(true);
    } else {
      setIsAssessmentActive(false);
    }
  }, [gameState, setIsAssessmentActive]);

  useEffect(() => {
    if (gameState === "playing" || gameState === "review-screen") {
      setSaveAndExitHandler(() => () => {
        setIsAssessmentActive(false);
      });
      setAbandonHandler(() => () => {
        clearSavedSession();
        setIsAssessmentActive(false);
        setGameState("setup");
      });
    } else {
      setSaveAndExitHandler(null);
      setAbandonHandler(null);
    }
    return () => {
      setSaveAndExitHandler(null);
      setAbandonHandler(null);
    };
  }, [gameState, setSaveAndExitHandler, setAbandonHandler, setIsAssessmentActive]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`omnilearn:assessment:state:${lesson.id}`);
      if (saved) setHasSavedSession(true);
    } catch {}
  }, [lesson.id]);

  useEffect(() => {
    if (gameState !== "playing") return;
    try {
      const stateObj = { mode, questions, currentIdx, userAnswers, flaggedQuestions, timeLeft, timeSpent, duration, quizChecked };
      localStorage.setItem(`omnilearn:assessment:state:${lesson.id}`, JSON.stringify(stateObj));
    } catch {}
  }, [gameState, mode, questions, currentIdx, userAnswers, flaggedQuestions, timeLeft, timeSpent, duration, quizChecked, lesson.id]);



  // =============================================================================
  // 2. TIMERS CLOCKS
  // =============================================================================

  useEffect(() => {
    if (gameState !== "playing" || timeLeft <= 0) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          triggerGrading();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [gameState, timeLeft]);

  useEffect(() => {
    if (gameState !== "playing") {
      if (spentIntervalRef.current) clearInterval(spentIntervalRef.current);
      return;
    }
    spentIntervalRef.current = setInterval(() => setTimeSpent((prev) => prev + 1), 1000);
    return () => { if (spentIntervalRef.current) clearInterval(spentIntervalRef.current); };
  }, [gameState]);

  // =============================================================================
  // 3. CORE HANDLERS
  // =============================================================================

  const handleResumeSession = useCallback(() => {
    try {
      const saved = localStorage.getItem(`omnilearn:assessment:state:${lesson.id}`);
      if (saved) {
        const stateObj = JSON.parse(saved);
        setMode(stateObj.mode);
        setQuestions(stateObj.questions);
        setCurrentIdx(stateObj.currentIdx);
        setUserAnswers(stateObj.userAnswers);
        setFlaggedQuestions(stateObj.flaggedQuestions);
        setTimeLeft(stateObj.timeLeft);
        setTimeSpent(stateObj.timeSpent || 0);
        setDuration(stateObj.duration || stateObj.timeLeft);
        setQuizChecked(stateObj.quizChecked || {});
        setGameState("playing");
        setHasSavedSession(false);
      }
    } catch {
      setHasSavedSession(false);
    }
  }, [lesson.id]);

  const clearSavedSession = useCallback(() => {
    try { localStorage.removeItem(`omnilearn:assessment:state:${lesson.id}`); } catch {}
  }, [lesson.id]);

  const resetPlayState = useCallback((initialTimeLeft: number, initialDuration: number) => {
    setCurrentIdx(0);
    setUserAnswers({});
    setFlaggedQuestions({});
    setTimeSpent(0);
    setQuizChecked({});
    setReviewMode(false);
    setTimeLeft(initialTimeLeft);
    setDuration(initialDuration);
    setGameState("playing");
    setHasSavedSession(false);
  }, []);

  const handleStartQuiz = useCallback((config: { count: number; focus: "random" | "weakness"; types: string[] }) => {
    setMode("quiz");
    const generated = generateAssessment(
      lesson.quizzes, lesson.summary || "", "quiz", config.count, "moderate", config.types, "recommended", {}
    );
    setQuestions(prepareScrambledAssessment(generated));
    resetPlayState(0, 0); 
  }, [lesson.quizzes, lesson.summary, resetPlayState]);

  const handleStartExam = useCallback((config: { count: number; timeLimit: number; difficulty: string }) => {
    setMode("mock");
    // Force a mixed array of all types for the exam
    const generated = generateAssessment(
      lesson.quizzes, lesson.summary || "", "mock", config.count, config.difficulty as any, ["multiple-choice", "true-false", "identification"], "recommended", {}
    );
    setQuestions(prepareScrambledAssessment(generated));
    const mockTime = config.timeLimit * 60;
    resetPlayState(mockTime, mockTime);
  }, [lesson.quizzes, lesson.summary, resetPlayState]);

  const submitGrading = useCallback(async () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      const ans = userAnswers[idx]?.trim().toLowerCase();
      const correct = q.correctAnswer.trim().toLowerCase();
      if (ans && (ans === correct || correct.includes(ans) || ans.includes(correct))) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setCompletedTime(timeSpent);
    clearSavedSession();

    const baseXP = mode === "mock" ? 45 : 15;
    const isPerfect = correctCount === questions.length;
    const totalXP = baseXP + (isPerfect ? 20 : 0);
    setXpAwarded(totalXP);
    setGameState("results");

    if (user) {
      const percentage = Math.round((correctCount / questions.length) * 100);
      try {
        await ProgressService.insertQuizScore(user.id, {
          lesson_id: lesson.id, score: correctCount, total_questions: questions.length, percentage,
        } as any);
        await updateStatsAfterQuiz(percentage, totalXP);
      } catch (err) { console.error("Error committing score metrics:", err); }
    }
  }, [questions, userAnswers, timeSpent, clearSavedSession, mode, user, lesson.id, updateStatsAfterQuiz]);

  const triggerGrading = useCallback(() => {
    setGameState("grading");
    setGradingProgress(0);
    setGradingText("Validating blueprint answers...");
    let prog = 0;

    if (gradingIntervalRef.current) clearInterval(gradingIntervalRef.current);

    gradingIntervalRef.current = setInterval(() => {
      prog += 20;
      setGradingProgress(prog);
      if (prog === 40) setGradingText("Calculating subject mastery levels...");
      else if (prog === 80) setGradingText("Compiling performance recommendations...");
      else if (prog >= 100) { 
        if (gradingIntervalRef.current) {
          clearInterval(gradingIntervalRef.current);
          gradingIntervalRef.current = null;
        }
        submitGrading(); 
      }
    }, 400);
  }, [submitGrading]);

  const handleSelectAnswer = useCallback((ans: string) => setUserAnswers((prev) => ({ ...prev, [currentIdx]: ans })), [currentIdx]);
  const toggleFlag = useCallback(() => setFlaggedQuestions((prev) => ({ ...prev, [currentIdx]: !prev[currentIdx] })), [currentIdx]);
  const handlePrev = useCallback(() => { if (currentIdx > 0) { setCurrentIdx((prev) => prev - 1); setReviewMode(false); } }, [currentIdx]);
  const handleNext = useCallback(() => { if (currentIdx < questions.length - 1) { setCurrentIdx((prev) => prev + 1); setReviewMode(false); } }, [currentIdx, questions.length]);
  const checkQuizAnswer = useCallback(() => setQuizChecked((prev) => ({ ...prev, [currentIdx]: true })), [currentIdx]);

  const answeredCount = Object.keys(userAnswers).length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  
  const formatTime = useCallback((secs: number) => {
    const mins = Math.floor(secs / 60);
    const remains = secs % 60;
    return `${mins}:${remains < 10 ? "0" : ""}${remains}`;
  }, []);

  const gradeLetter = useMemo(() => {
    if (questions.length === 0) return "F";
    const pct = score / questions.length;
    if (pct >= 0.9) return "A";
    if (pct >= 0.8) return "B";
    if (pct >= 0.7) return "C";
    if (pct >= 0.6) return "D";
    return "F";
  }, [score, questions]);

  const isZenMode = mode === "mock" && (gameState === "playing" || gameState === "review-screen");

  // =============================================================================
  // RENDER WORKSPACE JSX VARIABLE (Fixes the UI Reset Bug!)
  // =============================================================================
  const workspaceContent = (
    <div className={`w-full max-w-4xl mx-auto space-y-6 select-none text-left relative ${isZenMode ? "mt-24 pb-24" : ""}`}>
      
      {/* 1. SETUP SCREENS */}
      {gameState === "setup" && activeTab === "quiz" && (
        <QuizSetup onStartQuiz={handleStartQuiz} />
      )}

      {gameState === "setup" && activeTab === "exam" && (
        <ExamSetup maxQuestions={lesson.quizzes?.length || 0} onStartExam={handleStartExam} />
      )}

      {/* Restore Banner */}
      {hasSavedSession && gameState === "setup" && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
            <div className="leading-tight">
              <h4 className="text-xs font-black text-amber-500">Unfinished Session Found</h4>
              <p className="text-[10px] text-amber-500/70 mt-0.5 font-medium">Continue where you left off.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { clearSavedSession(); setHasSavedSession(false); }} className="h-9 px-4 border border-white/10 text-[10px] font-bold text-white/50 rounded-xl hover:bg-white/5 cursor-pointer">
              Delete
            </button>
            <button onClick={handleResumeSession} className="h-9 px-5 bg-amber-500 text-[#0A0A0A] text-[10px] font-black rounded-xl cursor-pointer">
              Resume
            </button>
          </div>
        </div>
      )}      {/* 2. PLAYING WORKSPACE */}
      {gameState === "playing" && questions[currentIdx] && (
        mode === "quiz" ? (
          <div className="fixed inset-0 z-[100] bg-[#0A0710] overflow-y-auto flex flex-col min-h-[100dvh] w-full select-none text-left">
            {/* THE SAFE-AREA ESCAPE HATCH */}
            <div className="absolute top-0 left-0 w-full p-4 sm:p-8 pt-[max(1rem,env(safe-area-inset-top))] z-50 pointer-events-none">
              <button 
                onClick={() => {
                  if (abandonHandler) abandonHandler();
                }}
                className="pointer-events-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors active:scale-[0.97] active:opacity-80 cursor-pointer"
              >
                <span className="text-[11px] font-bold tracking-widest uppercase">✖ End Session</span>
              </button>
            </div>

            {/* PERFECTLY CENTERED CARD CONTAINER */}
            <div className="flex-1 flex items-center justify-center w-full p-4 pt-20 pb-[env(safe-area-inset-bottom)]">
              <div className="w-full max-w-2xl bg-[#121214] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 relative">
                
                {/* Progress bar */}
                <div className="w-full bg-white/[0.02] rounded-xl p-3 flex items-center gap-3">
                  <div className="flex-1 bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-omnave-primary h-full w-full rounded-full transition-transform duration-300 transform-gpu origin-left" style={{ transform: `scaleX(${(currentIdx + 1) / questions.length})` }} />
                  </div>
                  <span className="text-[10px] font-extrabold text-white/40">Q{currentIdx + 1}/{questions.length}</span>
                </div>

                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2">
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-bold text-white/40 uppercase tracking-widest select-none">
                      {questions[currentIdx].type?.replace("-", " ") || "Question"}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-white leading-snug pt-2 select-text text-left">
                      {questions[currentIdx].question}
                    </h3>
                  </div>
                </div>

                <div className="space-y-3.5 pt-2">
                  {(questions[currentIdx].type === "multiple-choice" || questions[currentIdx].type?.toLowerCase() === "true-false") && 
                   (questions[currentIdx].type?.toLowerCase() === "true-false" ? ["True", "False"] : (questions[currentIdx].options || [])).map((opt, i) => {
                     const isSel = userAnswers[currentIdx] === opt;
                     const isQuizRevealed = quizChecked[currentIdx] === true;
                     const isCor = opt === questions[currentIdx].correctAnswer;

                     let btnStyle = "border-white/10 bg-white/[0.01] hover:bg-white/5 text-white/70 hover:text-white";
                     if (isSel) btnStyle = "border-omnave-primary bg-[#201B30] text-white font-semibold ring-1 ring-omnave-primary";
                     if (isQuizRevealed) {
                       if (isCor) btnStyle = "border-emerald-500 bg-[#14291B] text-emerald-400 font-semibold";
                       else if (isSel) btnStyle = "border-red-500 bg-[#2E1819] text-red-400 font-semibold";
                       else btnStyle = "border-white/5 opacity-30 text-white/30";
                     }

                     return (
                       <button
                         key={i}
                         disabled={isQuizRevealed}
                         onClick={() => handleSelectAnswer(opt)}
                         className={`w-full p-4 border rounded-xl text-sm font-medium text-left cursor-pointer flex items-center justify-between active:scale-[0.98] transition-[background-color,border-color,opacity] duration-100 ${btnStyle}`}
                       >
                         <span>{opt}</span>
                         {isSel && <CheckCircle2 size={16} className={isQuizRevealed && !isCor ? "text-red-400" : "text-omnave-primary"} />}
                       </button>
                     );
                   })}

                  {questions[currentIdx].type === "identification" && (
                    <IdentificationInput
                      disabled={quizChecked[currentIdx] === true}
                      value={userAnswers[currentIdx] || ""}
                      onChange={handleSelectAnswer}
                      className="w-full h-14 px-5 bg-white/[0.01] border border-white/10 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-omnave-primary focus:ring-1 focus:ring-omnave-primary disabled:opacity-50 transition-colors"
                    />
                  )}
                </div>

                {quizChecked[currentIdx] && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={`p-5 rounded-xl border text-xs leading-relaxed mt-6 text-left ${
                      (userAnswers[currentIdx]?.trim().toLowerCase() === questions[currentIdx].correctAnswer.trim().toLowerCase())
                        ? "bg-[#14291B] border-emerald-500/20 text-emerald-400"
                        : "bg-[#2E1819] border-red-500/20 text-red-400"
                    }`}
                  >
                    <span className="font-bold uppercase tracking-wider block mb-1.5">
                      {(userAnswers[currentIdx]?.trim().toLowerCase() === questions[currentIdx].correctAnswer.trim().toLowerCase()) ? "✓ Correct" : "✕ Incorrect"}
                    </span>
                    <p className="font-medium text-white/80 select-text">{questions[currentIdx].explanation}</p>
                  </motion.div>
                )}

                <div className="flex justify-between items-center pt-6 border-t border-white/5 mt-6">
                  <button
                    onClick={handlePrev} disabled={currentIdx === 0}
                    className="h-11 px-6 border border-white/10 rounded-xl text-xs font-bold text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-[0.97] active:opacity-80 transition-[background-color,opacity] duration-100"
                  >
                    Previous
                  </button>

                  {!quizChecked[currentIdx] && (
                    <button
                      onClick={checkQuizAnswer} disabled={!userAnswers[currentIdx]}
                      className="bg-omnave-primary text-white font-bold transition-[background-color,opacity] px-6 h-11 rounded-xl cursor-pointer disabled:opacity-30 text-xs active:scale-[0.97] active:opacity-80 duration-100"
                    >
                      Check Answer
                    </button>
                  )}

                  {currentIdx === questions.length - 1 ? (
                    <button
                      onClick={triggerGrading}
                      className="h-11 px-8 text-white text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 cursor-pointer active:scale-[0.97] active:opacity-80 transition-[background-color,opacity] duration-100"
                    >
                      Finish Quiz
                    </button>
                  ) : (
                    <button onClick={handleNext} className="h-11 px-6 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/5 cursor-pointer active:scale-[0.97] active:opacity-80 transition-[background-color,opacity] duration-100">
                      Next
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <motion.div key="playing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="w-full max-w-2xl mx-auto mt-8 p-6 sm:p-8 bg-[#121214] border border-white/10 rounded-2xl space-y-6 relative">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-2">
                  <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-bold text-white/40 uppercase tracking-widest select-none">
                    {questions[currentIdx].type?.replace("-", " ") || "Question"}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-white leading-snug mt-4 select-text text-left">
                    {questions[currentIdx].question}
                  </h3>
                </div>

                <button
                  onClick={toggleFlag}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border cursor-pointer active:scale-[0.95] active:opacity-80 transition-[background-color,border-color,opacity] duration-100 ${
                    flaggedQuestions[currentIdx] ? "border-amber-500 bg-amber-500/10 text-amber-500" : "border-white/5 text-white/40 hover:text-white/70"
                  }`}
                >
                  <Flag size={16} className={flaggedQuestions[currentIdx] ? "fill-amber-500" : ""} />
                </button>
              </div>

              <div className="space-y-3.5 pt-2">
                {(questions[currentIdx].type === "multiple-choice" || questions[currentIdx].type?.toLowerCase() === "true-false") && 
                 (questions[currentIdx].type?.toLowerCase() === "true-false" ? ["True", "False"] : (questions[currentIdx].options || [])).map((opt, i) => {
                   const isSel = userAnswers[currentIdx] === opt;

                   let btnStyle = "border-white/10 bg-white/[0.01] hover:bg-white/5 text-white/70 hover:text-white";
                   if (isSel) btnStyle = "border-omnave-primary bg-[#201B30] text-white font-semibold ring-1 ring-omnave-primary";

                   return (
                     <button
                       key={i}
                       onClick={() => handleSelectAnswer(opt)}
                       className={`w-full p-4 border rounded-xl text-sm font-medium text-left cursor-pointer flex items-center justify-between active:scale-[0.98] transition-[background-color,border-color,opacity] duration-100 ${btnStyle}`}
                     >
                       <span>{opt}</span>
                       {isSel && <CheckCircle2 size={16} className="text-omnave-primary" />}
                     </button>
                   );
                 })}

                {questions[currentIdx].type === "identification" && (
                  <IdentificationInput
                    value={userAnswers[currentIdx] || ""}
                    onChange={handleSelectAnswer}
                    className="w-full h-14 px-5 bg-white/[0.01] border border-white/10 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-omnave-primary focus:ring-1 focus:ring-omnave-primary transition-colors mt-6"
                  />
                )}
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-white/5 mt-6">
                <button
                  onClick={handlePrev} disabled={currentIdx === 0}
                  className="h-11 px-6 border border-white/10 rounded-xl text-xs font-bold text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-[0.97] active:opacity-80 transition-[background-color,opacity] duration-100"
                >
                  Previous
                </button>

                {currentIdx === questions.length - 1 ? (
                  <button
                    onClick={() => setGameState("review-screen")}
                    className="h-11 px-8 text-black text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 cursor-pointer active:scale-[0.97] active:opacity-80 transition-[background-color,opacity] duration-100"
                  >
                    Review Exam
                  </button>
                ) : (
                  <button onClick={handleNext} className="h-11 px-6 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/5 cursor-pointer active:scale-[0.97] active:opacity-80 transition-[background-color,opacity] duration-100">
                    Next
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )
      )}

      {/* 3. REVIEW SCREEN */}
      {gameState === "review-screen" && (
        <motion.div key="review-screen" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#121214] border border-white/10 rounded-2xl p-6 md:p-10 space-y-6 text-left max-w-2xl mx-auto mt-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-base font-bold text-white">Review Assessment</h2>
            <button onClick={() => setGameState("playing")} className="text-xs font-bold text-white/50 hover:text-white cursor-pointer active:opacity-75 transition-opacity">Return to Exam</button>
          </div>
          
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
            {questions.map((q, idx) => {
              const isAns = !!userAnswers[idx];
              const isFlag = flaggedQuestions[idx];
              return (
                <button
                  key={idx}
                  onClick={() => { setCurrentIdx(idx); setGameState("playing"); }}
                  className={`relative h-12 rounded-xl flex items-center justify-center font-bold text-sm border cursor-pointer active:scale-[0.95] active:opacity-80 transition-[background-color,border-color,opacity] duration-100 ${
                    isFlag ? "border-amber-500 bg-[#342416] text-amber-500" :
                    isAns ? "border-white/20 bg-white/5 text-white" : "border-white/5 bg-transparent text-white/40"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="pt-6 border-t border-white/5 flex justify-end">
            <button onClick={triggerGrading} className="h-14 px-10 bg-amber-500 hover:bg-amber-600 text-black text-sm font-bold rounded-2xl cursor-pointer active:scale-[0.97] active:opacity-80 transition-[background-color,opacity] duration-100 shadow-[0_4px_12px_rgba(245,158,11,0.15)]">
              Submit Final Exam
            </button>
          </div>
        </motion.div>
      )}

      {/* 4. GRADING LOADER */}
      {gameState === "grading" && (
        <motion.div key="grading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#121214] border border-white/10 rounded-2xl p-10 text-center space-y-6 max-w-md mx-auto py-16 mt-10">
          <div className="w-1.5 h-1.5 rounded-full bg-omnave-primary animate-ping mx-auto" />
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Grading Engine</h3>
            <p className="text-xs text-white/50 font-medium">{gradingText}</p>
          </div>
        </motion.div>
      )}

      {/* 5. RESULTS SCREEN */}
      {gameState === "results" && (
        <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          {mode === "quiz" ? (
            <div className="bg-black/[0.4] border border-white/[0.1] backdrop-blur-2xl rounded-[24px] p-8 md:p-12 shadow-premium-glass text-center space-y-8">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-2xl font-black shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <Trophy size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white mb-2">Quiz Complete!</h2>
                <p className="text-sm text-white/50 font-medium">You successfully finished the formative assessment block.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">Accuracy</span>
                  <span className="text-3xl font-black text-white">{Math.round((score / questions.length) * 100)}%</span>
                </div>
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">XP Earned</span>
                  <span className="text-3xl font-black text-omnave-primary">+{xpAwarded}</span>
                </div>
              </div>

              <button
                onClick={() => setGameState("setup")}
                className="h-14 px-10 bg-white text-black text-sm font-black rounded-2xl transition-all hover:scale-[1.02]"
              >
                Back to Settings
              </button>
            </div>
          ) : (
            <div className="bg-black/[0.4] border border-white/[0.1] backdrop-blur-2xl rounded-[24px] p-8 md:p-12 shadow-premium-glass space-y-8 max-w-3xl mx-auto">
              <div className="border-b border-white/10 pb-6 flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-2">Official Simulation Report</span>
                  <h2 className="text-2xl font-black text-white">Mock Examination</h2>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-white block">{score} / {questions.length}</span>
                  <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Final Score</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                  <span className="text-[10px] text-white/40 font-bold uppercase block mb-1">Grade</span>
                  <span className="text-xl font-black text-white">{gradeLetter}</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                  <span className="text-[10px] text-white/40 font-bold uppercase block mb-1">Time Spent</span>
                  <span className="text-xl font-black text-white">{formatTime(completedTime)}</span>
                </div>
                <div className="bg-amber-500/10 rounded-2xl p-5 border border-amber-500/20">
                  <span className="text-[10px] text-amber-500/60 font-bold uppercase block mb-1">XP Reward</span>
                  <span className="text-xl font-black text-amber-500">+{xpAwarded}</span>
                </div>
              </div>

              <button onClick={() => setGameState("setup")} className="w-full h-14 bg-amber-500 text-black text-sm font-black rounded-2xl transition-all hover:bg-amber-400">
                Close Report
              </button>
            </div>
          )}
        </motion.div>
      )}

    </div>
  );

  if (isZenMode) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0A0710] overflow-y-auto flex flex-col">
        {/* THE KILLSWITCH: This forces the parent header to vanish regardless of React state */}
        <style dangerouslySetInnerHTML={{ __html: `
          #global-lesson-header { display: none !important; }
        `}} />
        {/* EXAM HUD HEADER */}
        <div className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4 bg-[#0A0710]/95 backdrop-blur-xl border-b border-white/5 flex items-center justify-between">
           {/* 2px Absolute Top Progress Bar */}
           <div 
             className="absolute top-0 left-0 w-full h-[2px] bg-omnave-primary transition-transform duration-300 transform-gpu origin-left" 
             style={{ transform: `scaleX(${(currentIdx + 1) / questions.length})` }}
           />

           {/* Left: Leave / Abort Action */}
           <button 
             onClick={() => setShowAbortModal(true)}
             className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors active:scale-95 cursor-pointer"
             aria-label="Leave Exam"
           >
             <span className="text-sm font-bold tracking-wide">Leave Exam</span>
           </button>

           {/* Center: Progress */}
           <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
              <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">
                Question {currentIdx + 1} of {questions.length}
              </span>
           </div>

           {/* Right: Timer */}
           <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm font-mono font-medium text-white">
              {formatTime(timeLeft)}
           </div>
        </div>

        {/* Exam Workspace */}
        <div className="flex-1 w-full relative px-4 md:px-8 mt-20">
          {workspaceContent}
        </div>

        {/* Abort Confirmation Modal */}
        <AnimatePresence>
          {showAbortModal && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#130E24] border border-red-500/30 p-6 rounded-2xl max-w-md w-full shadow-2xl text-left"
              >
                <h3 className="text-lg font-black text-white mb-2">Abort Examination?</h3>
                <p className="text-sm text-white/70 leading-relaxed mb-6">
                  Leaving now will automatically submit your current progress, resulting in a score of 0 for unanswered questions.
                </p>
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setShowAbortModal(false)}
                    className="px-4 py-2 text-sm font-bold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      setShowAbortModal(false);
                      submitGrading();
                    }}
                    className="px-5 py-2 text-sm font-black text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] cursor-pointer"
                  >
                    Yes, Abort
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return workspaceContent;
});

AssessmentEngine.displayName = "AssessmentEngine";