"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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

export function AssessmentEngine({ lesson, activeTab }: AssessmentEngineProps) {
  const { user, updateStatsAfterQuiz } = useUserContext();
  const { 
    isAssessmentActive, 
    setIsAssessmentActive, 
    setSaveAndExitHandler,
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
      setSaveAndExitHandler(() => {
        setIsAssessmentActive(false);
      });
      setAbandonHandler(() => {
        clearSavedSession();
        setIsAssessmentActive(false);
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

  const handleResumeSession = () => {
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
  };

  const clearSavedSession = () => {
    try { localStorage.removeItem(`omnilearn:assessment:state:${lesson.id}`); } catch {}
  };

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

  const handleStartQuiz = (config: { count: number; focus: "random" | "weakness"; types: string[] }) => {
    setMode("quiz");
    const generated = generateAssessment(
      lesson.quizzes, lesson.summary || "", "quiz", config.count, "moderate", config.types, "recommended", {}
    );
    setQuestions(prepareScrambledAssessment(generated));
    resetPlayState(0, 0); 
  };

  const handleStartExam = (config: { count: number; timeLimit: number; difficulty: string }) => {
    setMode("mock");
    // Force a mixed array of all types for the exam
    const generated = generateAssessment(
      lesson.quizzes, lesson.summary || "", "mock", config.count, config.difficulty as any, ["multiple-choice", "true-false", "identification"], "recommended", {}
    );
    setQuestions(prepareScrambledAssessment(generated));
    const mockTime = config.timeLimit * 60;
    resetPlayState(mockTime, mockTime);
  };

  const resetPlayState = (initialTimeLeft: number, initialDuration: number) => {
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
  };

  const triggerGrading = () => {
    setGameState("grading");
    setGradingProgress(0);
    setGradingText("Validating blueprint answers...");
    let prog = 0;
    const interval = setInterval(() => {
      prog += 20;
      setGradingProgress(prog);
      if (prog === 40) setGradingText("Calculating subject mastery levels...");
      else if (prog === 80) setGradingText("Compiling performance recommendations...");
      else if (prog >= 100) { clearInterval(interval); submitGrading(); }
    }, 400);
  };

  const submitGrading = async () => {
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
  };

  const handleSelectAnswer = (ans: string) => setUserAnswers((prev) => ({ ...prev, [currentIdx]: ans }));
  const toggleFlag = () => setFlaggedQuestions((prev) => ({ ...prev, [currentIdx]: !prev[currentIdx] }));
  const handlePrev = () => { if (currentIdx > 0) { setCurrentIdx((prev) => prev - 1); setReviewMode(false); } };
  const handleNext = () => { if (currentIdx < questions.length - 1) { setCurrentIdx((prev) => prev + 1); setReviewMode(false); } };
  const checkQuizAnswer = () => setQuizChecked((prev) => ({ ...prev, [currentIdx]: true }));

  const answeredCount = Object.keys(userAnswers).length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remains = secs % 60;
    return `${mins}:${remains < 10 ? "0" : ""}${remains}`;
  };

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
    <div className={`w-full max-w-4xl mx-auto space-y-6 select-none text-left ${isZenMode ? "mt-24 pb-24" : ""}`}>
      
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
      )}

      {/* 2. PLAYING WORKSPACE */}
      {gameState === "playing" && questions[currentIdx] && (
        <motion.div key="playing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          
          <div className="bg-black/[0.4] border border-white/[0.1] backdrop-blur-2xl rounded-[24px] p-5 md:p-8 shadow-premium-glass space-y-6 relative">
            
            {mode === "quiz" && (
              <div className="w-full bg-white/5 rounded-2xl p-3 flex items-center gap-3">
                <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-omnave-primary h-full rounded-full transition-all duration-300" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
                </div>
                <span className="text-[10px] font-black text-white/50">Q{currentIdx + 1}/{questions.length}</span>
              </div>
            )}

            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2">
                <span className="px-2.5 py-0.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-white/50 uppercase tracking-wider">
                  {questions[currentIdx].type?.replace("-", " ") || "Question"}
                </span>
                <h3 className="text-base sm:text-lg font-black text-white leading-normal pt-1.5 select-text">
                  {questions[currentIdx].question}
                </h3>
              </div>

              {mode === "mock" && (
                <button
                  onClick={toggleFlag}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                    flaggedQuestions[currentIdx] ? "border-amber-500 bg-amber-500/10 text-amber-500" : "border-white/5 text-white/40 hover:text-white/70"
                  }`}
                >
                  <Flag size={16} className={flaggedQuestions[currentIdx] ? "fill-amber-500" : ""} />
                </button>
              )}
            </div>

            <div className="space-y-3.5 pt-2">
              {(questions[currentIdx].type === "multiple-choice" || questions[currentIdx].type === "true-false") && (questions[currentIdx].options || ["True", "False"]).map((opt, i) => {
                const isSel = userAnswers[currentIdx] === opt;
                const isQuizRevealed = quizChecked[currentIdx] === true;
                const isCor = opt === questions[currentIdx].correctAnswer;

                let btnStyle = "border-white/10 bg-white/5 hover:bg-white/10 text-white/70";
                if (isSel) btnStyle = "border-omnave-primary bg-omnave-primary/10 text-white font-black ring-1 ring-omnave-primary/20";
                if (mode === "quiz" && isQuizRevealed) {
                  if (isCor) btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-black";
                  else if (isSel) btnStyle = "border-red-500 bg-red-500/10 text-red-400 font-bold";
                  else btnStyle = "border-white/5 opacity-40 text-white/40";
                }

                return (
                  <button
                    key={i}
                    disabled={mode === "quiz" && isQuizRevealed}
                    onClick={() => handleSelectAnswer(opt)}
                    className={`w-full p-4 border rounded-2xl text-xs sm:text-sm font-bold text-left transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isSel && <CheckCircle2 size={16} className={mode === "quiz" && isQuizRevealed && !isCor ? "text-red-400" : "text-omnave-primary"} />}
                  </button>
                );
              })}

              {questions[currentIdx].type === "identification" && (
                <input
                  type="text"
                  disabled={mode === "quiz" && quizChecked[currentIdx] === true}
                  value={userAnswers[currentIdx] || ""}
                  onChange={(e) => handleSelectAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full h-14 px-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-omnave-primary/50 disabled:opacity-60"
                />
              )}
            </div>

            {mode === "quiz" && quizChecked[currentIdx] && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-2xl border text-sm leading-relaxed mt-6 ${
                  (userAnswers[currentIdx]?.trim().toLowerCase() === questions[currentIdx].correctAnswer.trim().toLowerCase())
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}
              >
                <span className="font-black uppercase tracking-wider block mb-2">
                  {(userAnswers[currentIdx]?.trim().toLowerCase() === questions[currentIdx].correctAnswer.trim().toLowerCase()) ? "✓ Correct" : "✕ Incorrect"}
                </span>
                <p className="font-medium text-white/80">{questions[currentIdx].explanation}</p>
              </motion.div>
            )}

            <div className="flex justify-between items-center pt-6 border-t border-white/5 mt-6">
              <button
                onClick={handlePrev} disabled={currentIdx === 0}
                className="h-12 px-6 border border-white/10 rounded-xl text-xs font-bold text-white/50 hover:bg-white/5 disabled:opacity-30 transition-all"
              >
                Previous
              </button>

              {mode === "quiz" && !quizChecked[currentIdx] && (
                <button
                  onClick={checkQuizAnswer} disabled={!userAnswers[currentIdx]}
                  className="h-12 px-8 bg-omnave-primary hover:bg-omnave-primary/80 text-white text-xs font-black rounded-xl disabled:opacity-30 transition-all"
                >
                  Check Answer
                </button>
              )}

              {currentIdx === questions.length - 1 ? (
                <button
                  onClick={() => mode === "quiz" ? triggerGrading() : setGameState("review-screen")}
                  className={`h-12 px-8 text-white text-xs font-black rounded-xl transition-all ${mode === "quiz" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 text-black hover:bg-amber-600"}`}
                >
                  {mode === "quiz" ? "Finish Quiz" : "Review Exam"}
                </button>
              ) : (
                <button onClick={handleNext} className="h-12 px-6 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/5 transition-all">
                  Next
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. REVIEW SCREEN */}
      {gameState === "review-screen" && (
        <motion.div key="review-screen" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-black/[0.4] border border-white/[0.1] backdrop-blur-2xl rounded-[24px] p-6 md:p-10 shadow-premium-glass space-y-6 text-left">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-lg font-black text-white">Review Assessment</h2>
            <button onClick={() => setGameState("playing")} className="text-xs font-bold text-white/50 hover:text-white transition-colors">Return to Exam</button>
          </div>
          
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
            {questions.map((q, idx) => {
              const isAns = !!userAnswers[idx];
              const isFlag = flaggedQuestions[idx];
              return (
                <button
                  key={idx}
                  onClick={() => { setCurrentIdx(idx); setGameState("playing"); }}
                  className={`relative h-12 rounded-xl flex items-center justify-center font-bold text-sm border transition-all ${
                    isFlag ? "border-amber-500 bg-amber-500/20 text-amber-500" :
                    isAns ? "border-white/20 bg-white/10 text-white" : "border-white/5 bg-transparent text-white/40"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="pt-6 border-t border-white/5 flex justify-end">
            <button onClick={triggerGrading} className="h-14 px-10 bg-amber-500 hover:bg-amber-400 text-black text-sm font-black rounded-2xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              Submit Final Exam
            </button>
          </div>
        </motion.div>
      )}

      {/* 4. GRADING LOADER */}
      {gameState === "grading" && (
        <motion.div key="grading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-black/[0.4] border border-white/[0.1] backdrop-blur-2xl rounded-[24px] p-12 text-center space-y-8 shadow-2xl max-w-md mx-auto py-20 mt-10">
          <div className="w-20 h-20 rounded-full border-4 border-omnave-primary/20 border-t-omnave-primary animate-spin mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-black text-white">AI Grading Engine</h3>
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
    const rawPath = lesson?.file_path || lesson?.content_url || "Exam_Assessment";
    const titleParts = rawPath.split("_");
    const displayName = titleParts.length > 1 
      ? titleParts.slice(1).join("_").replace(".pdf", "") 
      : rawPath.replace(".pdf", "");

    return (
      <div className="fixed inset-0 z-[9999] bg-[#0A0A0A] overflow-y-auto overflow-x-hidden flex flex-col">
        {/* Zen Mode Strict Header */}
        <div className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 h-20 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/10 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => triggerNavAttempt(`/library/${lesson.id}`)}
              className="px-4 py-2 border border-red-500/30 text-red-500 text-xs font-bold rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              Abort Exam
            </button>
            <div className="hidden sm:block">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block">Mock Examination</span>
              <span className="text-sm font-bold text-white/70">{displayName}</span>
            </div>
          </div>

          {/* Center Timer */}
          <div className={`flex items-center gap-2 px-5 py-2 rounded-xl border ${timeLeft < 300 ? "bg-red-500/10 border-red-500/30 text-red-500 animate-pulse" : "bg-white/5 border-white/10 text-white"}`}>
            <Timer size={16} />
            <span className="font-mono text-lg font-black tracking-wider">{formatTime(timeLeft)}</span>
          </div>

          {/* Right Progress */}
          <div className="text-right">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block">Progress</span>
            <span className="text-sm font-bold text-white/70">{answeredCount} of {questions.length} Answered</span>
          </div>
        </div>

        {/* Exam Workspace */}
        <div className="flex-1 w-full relative">
          {workspaceContent}
        </div>
      </div>
    );
  }

  return workspaceContent;
}