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
 
// Import our setup screens
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
 
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
 
const prepareScrambledAssessment = (generated: GeneratedQuestion[]) => {
  let scrambledQuestions = shuffleArray(generated);
  scrambledQuestions = scrambledQuestions.map(q => {
    if (q.type === "multiple-choice" && q.options) {
      return { ...q, options: shuffleArray(q.options) };
    }
    return q;
  });
  return scrambledQuestions;
};
 
const transformQuestion = (q: GeneratedQuestion, targetFormat: string): GeneratedQuestion => {
  const copy: GeneratedQuestion = JSON.parse(JSON.stringify(q));
  
  // Strictly preserve topic meta-data and explanation
  copy.lesson_topic = q.lesson_topic || (q as any).topic || "General Concept";
  copy.explanation = q.explanation || copy.explanation || "";

  const normFormat = targetFormat.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (normFormat === 'identification') {
    copy.type = 'identification';
    copy.options = [];
    return copy;
  }
  
  if (normFormat === 'truefalse') {
    copy.type = 'true-false';
    copy.options = ['True', 'False'];
    
    const isTrue = Math.random() > 0.5;
    const cleanQText = copy.question.replace(/\?$/, "").trim();
    
    if (isTrue) {
      copy.question = `Is it true that ${cleanQText} is "${copy.correctAnswer}"?`;
      copy.correctAnswer = 'True';
    } else {
      const wrongAnswers = (copy.options || []).filter(o => o !== copy.correctAnswer);
      const wrongAns = wrongAnswers.length > 0 
        ? wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)] 
        : "something else";
      copy.question = `Is it true that ${cleanQText} is "${wrongAns}"?`;
      copy.correctAnswer = 'False';
    }
    return copy;
  }
  
  return copy;
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
  const [lastExamConfig, setLastExamConfig] = useState<{ count: number; timeLimit: number; difficulty: string }>({
    count: 50,
    timeLimit: 120,
    difficulty: "hard"
  });
 
  // Configuration States
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['multiple-choice']);
  const [sessionLength, setSessionLength] = useState<number>(15);
  const [focusArea, setFocusArea] = useState<string>('random');
  const potentialXp = sessionLength * 10;
  
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
    if (gameState === "setup") {
      try {
        const saved = localStorage.getItem(`omnilearn:assessment:state:${lesson.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.questions && parsed.questions.length > 0) {
            setHasSavedSession(true);
          } else {
            setHasSavedSession(false);
          }
        } else {
          setHasSavedSession(false);
        }
      } catch {
        setHasSavedSession(false);
      }
    }
  }, [gameState, lesson.id]);
 
  useEffect(() => {
    if (gameState !== "playing") return;
    try {
      const stateObj = { mode, questions, currentIdx, userAnswers, flaggedQuestions, timeLeft, timeSpent, duration, quizChecked };
      localStorage.setItem(`omnilearn:assessment:state:${lesson.id}`, JSON.stringify(stateObj));
    } catch {}
  }, [gameState, mode, questions, currentIdx, userAnswers, flaggedQuestions, timeLeft, timeSpent, duration, quizChecked, lesson.id]);
 
  // Timers Clocks
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
 
  const generateQuizSession = useCallback(() => {
    setMode("quiz");
    
    const allQuizzes = (lesson.quizzes || []) as GeneratedQuestion[];
    
    // Filter naturally matching
    const filteredArray = allQuizzes.filter((q: GeneratedQuestion) => 
      q.type && selectedFormats.some(f => {
        const normQ = q.type.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normF = f.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normQ === normF;
      })
    );
    
    let combinedArray = [...filteredArray];
    
    if (combinedArray.length < sessionLength) {
      const deficit = sessionLength - combinedArray.length;
      const unmatchedArray = allQuizzes.filter(q => !filteredArray.includes(q));
      const shuffledUnmatched = [...unmatchedArray].sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < Math.min(deficit, shuffledUnmatched.length); i++) {
        const targetFormat = selectedFormats[Math.floor(Math.random() * selectedFormats.length)];
        const transformed = transformQuestion(shuffledUnmatched[i], targetFormat);
        combinedArray.push(transformed);
      }
    }
    
    // Sort / Focus
    const sortedArray = [...combinedArray];
    if (focusArea === "weaknesses" || focusArea === "weakness") {
      sortedArray.sort((a, b) => {
        const aVal = a.difficulty?.toLowerCase() === "hard" ? 1 : 0;
        const bVal = b.difficulty?.toLowerCase() === "hard" ? 1 : 0;
        return bVal - aVal;
      });
    } else {
      sortedArray.sort(() => Math.random() - 0.5);
    }
    
    // Slice
    const finalQuizDeck = sortedArray.slice(0, sessionLength);
    
    setQuestions(prepareScrambledAssessment(finalQuizDeck));
    resetPlayState(0, 0);
  }, [lesson.quizzes, selectedFormats, focusArea, sessionLength, resetPlayState]);
 
  const handleStartExam = useCallback((config: { count: number; timeLimit: number; difficulty: string }) => {
    setMode("mock");
    setLastExamConfig(config);
    const generated = generateAssessment(
      lesson.quizzes, lesson.summary || "", "mock", config.count, config.difficulty as any, ["multiple-choice", "true-false", "identification"], "recommended", {}
    );
    setQuestions(prepareScrambledAssessment(generated));
    const mockTime = config.timeLimit * 60;
    resetPlayState(mockTime, mockTime);
  }, [lesson.quizzes, lesson.summary, resetPlayState]);
 
  const handleRestart = useCallback(() => {
    if (mode === "mock") {
      const generated = generateAssessment(
        lesson.quizzes,
        lesson.summary || "",
        "mock",
        lastExamConfig.count,
        lastExamConfig.difficulty as any,
        ["multiple-choice", "true-false", "identification"],
        "recommended",
        {}
      );
      setQuestions(prepareScrambledAssessment(generated));
      const mockTime = lastExamConfig.timeLimit * 60;
      resetPlayState(mockTime, mockTime);
    } else {
      generateQuizSession();
    }
  }, [mode, lesson.quizzes, lesson.summary, lastExamConfig, generateQuizSession, resetPlayState]);
 
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
 
    const baseXP = mode === "mock" ? 45 : potentialXp;
    const isPerfect = correctCount === questions.length;
    const totalXP = mode === "mock"
      ? baseXP + (isPerfect ? 20 : 0)
      : Math.round((questions.length > 0 ? (correctCount / questions.length) : 0) * potentialXp);
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
 
  const workspaceContent = (
    <div className={`w-full max-w-4xl mx-auto space-y-6 select-none text-left relative font-poppins ${isZenMode ? "mt-24 pb-24" : ""}`}>
      
      {/* Restore Banner */}
      {hasSavedSession && gameState === "setup" && (
        <div className="bg-amber-50 border border-amber-100 rounded-[24px] p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 w-full shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-amber-600 animate-spin" />
            <div className="leading-tight text-left">
              <h4 className="text-xs font-black text-amber-600">Unfinished Session Found</h4>
              <p className="text-[10px] text-amber-500/70 mt-0.5 font-medium">Continue where you left off.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => { clearSavedSession(); setHasSavedSession(false); }} 
              className="h-10 px-5 border border-gray-200 text-xs font-semibold text-gray-555 rounded-full hover:bg-gray-50 cursor-pointer bg-white transition-all"
            >
              Delete
            </button>
            <button 
              onClick={handleResumeSession} 
              className="h-10 px-6 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-full cursor-pointer border-none shadow-sm transition-all"
            >
              Resume
            </button>
          </div>
        </div>
      )}

      {/* 1. SETUP SCREENS */}
      {gameState === "setup" && activeTab === "quiz" && (
        <QuizSetup 
          selectedFormats={selectedFormats}
          setSelectedFormats={setSelectedFormats}
          sessionLength={sessionLength}
          setSessionLength={setSessionLength}
          focusArea={focusArea}
          setFocusArea={setFocusArea}
          potentialXp={potentialXp}
          onStartQuiz={generateQuizSession}
        />
      )}
 
      {gameState === "setup" && activeTab === "exam" && (
        <ExamSetup maxQuestions={lesson.quizzes?.length || 0} onStartExam={handleStartExam} />
      )}
 
      {/* 2. PLAYING WORKSPACE */}
      {gameState === "playing" && questions[currentIdx] && (
        mode === "quiz" ? (
          <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto flex flex-col min-h-[100dvh] w-full select-none text-left font-poppins">
            {/* PERFECTLY CENTERED CARD CONTAINER */}
            <div className="flex-1 flex items-center justify-center w-full p-4 pt-6 pb-[env(safe-area-inset-bottom)]">
              <div className="w-full max-w-2xl bg-white border border-gray-100 rounded-[32px] shadow-sm p-6 space-y-6 relative">
                {/* Header with End Session */}
                <div className="flex justify-between items-center select-none pb-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Practice Quiz</span>
                  <button 
                    onClick={() => {
                      setShowAbortModal(true);
                    }}
                    className="text-red-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-full text-xs font-bold flex items-center transition-all border-none cursor-pointer"
                  >
                    ✖ End Session
                  </button>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-50 rounded-[15px] p-3 flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#6949a8] h-full w-full rounded-full transition-transform duration-300 transform-gpu origin-left" style={{ transform: `scaleX(${(currentIdx + 1) / questions.length})` }} />
                  </div>
                  <div className="flex items-center">
                    {userAnswers[currentIdx] ? <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" /> : <span className="w-2 h-2 rounded-full bg-gray-300 mr-2" />}
                    <span className="text-[10px] font-extrabold text-gray-555">Q{currentIdx + 1}/{questions.length}</span>
                  </div>
                </div>
 
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 bg-purple-50 border border-purple-100 rounded text-[9px] font-bold text-[#6949a8] uppercase tracking-widest select-none">
                        {(() => {
                          const hasOptions = questions[currentIdx].options && questions[currentIdx].options.length > 0;
                          return (questions[currentIdx].type || (hasOptions ? "Multiple Choice" : "Identification"))?.replace("-", " ");
                        })()}
                      </span>
                      <span className="px-2.5 py-0.5 bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 rounded text-[9px] font-semibold text-slate-600 uppercase tracking-wider select-none truncate max-w-[220px]">
                        {questions[currentIdx].lesson_topic || (questions[currentIdx] as any).topic || "General Concept"}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug pt-2 select-text text-left">
                      {questions[currentIdx].question}
                    </h3>
                  </div>
                </div>
                <div className="space-y-3.5 pt-2">
                  {(() => {
                    const hasOptions = questions[currentIdx].options && questions[currentIdx].options.length > 0;
                    if (hasOptions) {
                      return (questions[currentIdx].options || []).map((opt, i) => {
                        const isSel = userAnswers[currentIdx] === opt;
                        const isQuizRevealed = quizChecked[currentIdx] === true;
                        const isCor = opt === questions[currentIdx].correctAnswer;
                        let btnStyle = "bg-white border-2 border-gray-200 shadow-sm hover:border-[#6949a8]/50 rounded-[20px] text-gray-800 font-semibold py-4 px-5 w-full text-left transition-all";
                        if (isSel) btnStyle = "bg-[#6949a8]/10 border-2 border-[#6949a8] text-[#6949a8] font-semibold transition-all py-4 px-5 rounded-[20px] text-left w-full";
                        if (isQuizRevealed) {
                          if (isCor) btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold py-4 px-5 rounded-[20px] text-left w-full";
                          else if (isSel) btnStyle = "border-red-500 bg-red-50 text-red-700 font-semibold py-4 px-5 rounded-[20px] text-left w-full";
                          else btnStyle = "border-gray-100 bg-gray-55/30 opacity-40 text-gray-405 py-4 px-5 rounded-[20px] text-left w-full";
                        }

                        return (
                          <button
                            key={i}
                            disabled={isQuizRevealed}
                            onClick={() => handleSelectAnswer(opt)}
                            className={`cursor-pointer flex items-center justify-between active:scale-[0.98] duration-100 text-sm ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {isSel && <CheckCircle2 size={16} className={isQuizRevealed && !isCor ? "text-red-500" : "text-white fill-[#6949a8]"} />}
                          </button>
                        );
                      });
                    } else {
                      return (
                        <IdentificationInput
                          disabled={quizChecked[currentIdx] === true}
                          value={userAnswers[currentIdx] || ""}
                          onChange={handleSelectAnswer}
                          className="w-full h-14 px-5 bg-gray-50 border border-gray-200 rounded-[15px] text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#6949a8] focus:ring-1 focus:ring-[#6949a8] disabled:opacity-50 transition-colors"
                        />
                      );
                    }
                  })()}
                </div>
 
                {quizChecked[currentIdx] && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={`p-5 rounded-xl border text-xs leading-relaxed mt-6 text-left ${
                      (userAnswers[currentIdx]?.trim().toLowerCase() === questions[currentIdx].correctAnswer.trim().toLowerCase())
                        ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                        : "bg-red-50 border-red-100 text-red-700"
                    }`}
                  >
                    <span className="font-bold uppercase tracking-wider block mb-1.5 font-poppins">
                      {(userAnswers[currentIdx]?.trim().toLowerCase() === questions[currentIdx].correctAnswer.trim().toLowerCase()) ? "✓ Correct" : "✕ Incorrect"}
                    </span>
                    <p className="font-medium text-gray-600 select-text font-poppins">{questions[currentIdx].explanation}</p>
                  </motion.div>
                )}
 
                <div className="flex justify-between items-center pt-6 border-t border-gray-100 mt-6">
                  <button
                    onClick={handlePrev} disabled={currentIdx === 0}
                    className="h-11 px-6 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all duration-100 border-none"
                  >
                    Previous
                  </button>
 
                  {!quizChecked[currentIdx] && (
                    <button
                      onClick={checkQuizAnswer} disabled={!userAnswers[currentIdx]}
                      className="bg-[#6949a8] text-white font-bold shadow-md active:scale-95 transition-all px-6 h-11 rounded-full border-none cursor-pointer disabled:opacity-50 text-xs duration-100"
                    >
                      Check Answer
                    </button>
                  )}
 
                  {currentIdx === questions.length - 1 ? (
                    <button
                      onClick={triggerGrading}
                      className="h-11 px-8 text-white text-xs font-bold rounded-full border-none bg-emerald-600 hover:bg-emerald-700 cursor-pointer active:scale-95 transition-all duration-100"
                    >
                      Finish Quiz
                    </button>
                  ) : (
                    <button onClick={handleNext} className="h-11 px-6 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full text-xs font-semibold cursor-pointer active:scale-95 transition-all duration-100 border-none">
                      Next
                    </button>
                  )}
                </div>
              </div>
            </div>
 
            <AnimatePresence>
              {showAbortModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm pointer-events-auto">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white border border-gray-100 p-6 rounded-[32px] shadow-xl max-w-sm w-full text-left"
                  >
                    <h3 className="text-lg font-bold text-gray-900 font-poppins">Pause Practice Session?</h3>
                    <p className="text-xs text-gray-500 mt-2 font-medium leading-relaxed font-poppins">
                      You can safely leave and resume this session later from the setup screen.
                    </p>
                    <div className="mt-6 flex justify-end gap-3 font-poppins">
                      <button 
                        onClick={() => setShowAbortModal(false)}
                        className="px-4 py-2 border-none bg-transparent hover:bg-gray-50 text-gray-500 rounded-full text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => {
                          setShowAbortModal(false);
                          setIsAssessmentActive(false);
                          setGameState("setup");
                        }}
                        className="px-5 py-2 bg-[#6949a8] hover:bg-[#6949a8]/90 text-white rounded-full text-xs font-bold border-none cursor-pointer shadow-sm active:scale-95"
                      >
                        Save & Pause
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div key="playing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="w-full max-w-2xl mx-auto mt-2 p-6 sm:p-8 space-y-6 relative bg-transparent">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 bg-purple-50 border border-purple-100 rounded text-[9px] font-bold text-[#6949a8] uppercase tracking-widest select-none">
                      {(() => {
                        const hasOptions = questions[currentIdx].options && questions[currentIdx].options.length > 0;
                        return (questions[currentIdx].type || (hasOptions ? "Multiple Choice" : "Identification"))?.replace("-", " ");
                      })()}
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 rounded text-[9px] font-semibold text-slate-600 uppercase tracking-wider select-none truncate max-w-[220px]">
                      {questions[currentIdx].lesson_topic || (questions[currentIdx] as any).topic || "General Concept"}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug mt-2 select-text text-left">
                    {questions[currentIdx].question}
                  </h3>
                </div>
 
                <button
                  onClick={toggleFlag}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border cursor-pointer active:scale-[0.95] transition-all duration-100 ${
                    flaggedQuestions[currentIdx] ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-400 hover:text-gray-600 bg-white"
                  }`}
                >
                  <Flag size={16} className={flaggedQuestions[currentIdx] ? "fill-amber-500" : ""} />
                </button>
              </div>
 
              <div className="space-y-3.5 pt-2">
                {(() => {
                  const hasOptions = questions[currentIdx].options && questions[currentIdx].options.length > 0;
                  if (hasOptions) {
                    return (questions[currentIdx].options || []).map((opt, i) => {
                      const isSel = userAnswers[currentIdx] === opt;
                      const btnStyle = isSel 
                         ? "bg-[#6949a8]/10 border-2 border-[#6949a8] text-[#6949a8] font-semibold transition-all py-4 px-5 rounded-[20px] text-left w-full"
                         : "bg-white border-2 border-gray-200 shadow-sm hover:border-[#6949a8]/50 rounded-[20px] text-gray-800 font-semibold py-4 px-5 w-full text-left transition-all";

                      return (
                        <button
                          key={i}
                          onClick={() => handleSelectAnswer(opt)}
                          className={`cursor-pointer flex items-center justify-between active:scale-[0.98] duration-100 text-sm ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isSel && <CheckCircle2 size={16} className="text-white fill-[#6949a8]" />}
                        </button>
                      );
                    });
                  } else {
                    return (
                      <IdentificationInput
                        value={userAnswers[currentIdx] || ""}
                        onChange={handleSelectAnswer}
                        className="w-full h-14 px-5 bg-gray-50 border border-gray-200 rounded-[15px] text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#6949a8] focus:ring-1 focus:ring-[#6949a8] transition-colors mt-6"
                      />
                    );
                  }
                })()}
              </div>
 
              <div className="flex justify-between items-center pt-6 border-t border-gray-100 mt-6">
                <button
                  onClick={handlePrev} disabled={currentIdx === 0}
                  className="h-11 px-6 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all duration-100 border-none"
                >
                  Previous
                </button>
 
                {currentIdx === questions.length - 1 ? (
                  <button
                    onClick={() => setGameState("review-screen")}
                    className="h-11 px-8 text-white text-xs font-bold rounded-full border-none bg-amber-600 hover:bg-amber-700 cursor-pointer active:scale-95 transition-all duration-100"
                  >
                    Review Exam
                  </button>
                ) : (
                  <button onClick={handleNext} className="h-11 px-6 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full text-xs font-semibold cursor-pointer active:scale-95 transition-all duration-100 border-none">
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
        <motion.div key="review-screen" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 md:p-10 space-y-6 text-left max-w-2xl mx-auto mt-2 bg-transparent">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-base font-bold text-gray-900">Review Assessment</h2>
            <button onClick={() => setGameState("playing")} className="text-xs font-bold text-gray-500 hover:text-gray-700 cursor-pointer bg-transparent border-none">Return to Exam</button>
          </div>
          
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
            {questions.map((q, idx) => {
              const isAns = !!userAnswers[idx];
              const isFlag = flaggedQuestions[idx];
              return (
                <button
                  key={idx}
                  onClick={() => { setCurrentIdx(idx); setGameState("playing"); }}
                  className={`relative h-12 rounded-xl flex items-center justify-center font-bold text-sm border cursor-pointer active:scale-[0.95] transition-all duration-100 ${
                    isFlag ? "border-amber-500 bg-amber-50 text-amber-700" :
                    isAns ? "border-gray-200 bg-gray-50 text-gray-800" : "border-gray-100 bg-transparent text-gray-400"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
 
          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button onClick={triggerGrading} className="h-14 px-10 bg-amber-600 hover:bg-amber-700 text-white border-none text-sm font-bold rounded-[15px] cursor-pointer active:scale-[0.97] transition-all shadow-[0_4px_12px_rgba(217,119,6,0.15)]">
              Submit Final Exam
            </button>
          </div>
        </motion.div>
      )}
 
      {/* 4. GRADING LOADER */}
      {gameState === "grading" && (
        <motion.div key="grading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-gray-100 rounded-[24px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] p-10 text-center space-y-6 max-w-md mx-auto py-16 mt-10">
          <div className="w-1.5 h-1.5 rounded-full bg-[#6949a8] animate-ping mx-auto" />
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">AI Grading Engine</h3>
            <p className="text-xs text-gray-500 font-medium">{gradingText}</p>
          </div>
        </motion.div>
      )}
 
      {/* 5. RESULTS SCREEN */}
      {gameState === "results" && (
        <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 font-poppins">
          {mode === "quiz" ? (
            <div className="p-8 md:p-12 text-center space-y-8 bg-transparent">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-black shadow-sm">
                <Trophy size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">Quiz Complete!</h2>
                <p className="text-sm text-gray-500 font-medium">You successfully finished the formative assessment block.</p>
              </div>
 
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="p-6 bg-gray-50 border border-gray-100 rounded-[15px]">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Accuracy</span>
                  <span className="text-3xl font-black text-gray-900">{Math.round((score / questions.length) * 100)}%</span>
                </div>
                <div className="p-6 bg-gray-50 border border-gray-100 rounded-[15px]">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">XP Earned</span>
                  <span className="text-3xl font-black text-[#6949a8]">+{xpAwarded}</span>
                </div>
              </div>
 
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setGameState("setup")}
                  className="h-14 px-8 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-full cursor-pointer transition-all border-none"
                >
                  Back to Settings
                </button>
                <button
                  onClick={handleRestart}
                  className="h-14 px-8 bg-[#6949a8] hover:bg-[#6949a8]/95 text-white border-none text-sm font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95"
                >
                  <RotateCcw size={16} /> Restart Quiz
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 md:p-12 space-y-8 max-w-3xl mx-auto bg-transparent">
              <div className="border-b border-gray-100 pb-6 flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-2">Official Simulation Report</span>
                  <h2 className="text-2xl font-black text-gray-900">Mock Examination</h2>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-gray-900 block">{score} / {questions.length}</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Final Score</span>
                </div>
              </div>
 
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-[15px] p-5 border border-gray-100">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Grade</span>
                  <span className="text-xl font-black text-gray-900">{gradeLetter}</span>
                </div>
                <div className="bg-gray-50 rounded-[15px] p-5 border border-gray-100">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Time Spent</span>
                  <span className="text-xl font-black text-gray-900">{formatTime(completedTime)}</span>
                </div>
                <div className="bg-amber-50 rounded-[15px] p-5 border border-amber-100">
                  <span className="text-[10px] text-amber-700/60 font-bold uppercase block mb-1">XP Reward</span>
                  <span className="text-xl font-black text-amber-700">+{xpAwarded}</span>
                </div>
              </div>
 
              <div className="flex gap-4">
                <button 
                  onClick={() => setGameState("setup")} 
                  className="flex-1 h-14 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-full transition-all cursor-pointer border-none"
                >
                  Close Report
                </button>
                <button 
                  onClick={handleRestart} 
                  className="flex-1 h-14 bg-amber-600 hover:bg-amber-700 text-white border-none text-sm font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
                >
                  <RotateCcw size={16} /> Restart Exam
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
 
    </div>
  );
 
  if (isZenMode) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto flex flex-col font-poppins">
        <style dangerouslySetInnerHTML={{ __html: `
          #global-lesson-header { display: none !important; }
        `}} />
        {/* EXAM HUD HEADER */}
        <div className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4 bg-white/95 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between">
           <div 
             className="absolute top-0 left-0 w-full h-[2px] bg-[#6949a8] transition-transform duration-300 transform-gpu origin-left" 
             style={{ transform: `scaleX(${(currentIdx + 1) / questions.length})` }}
           />
 
           {/* Left: Leave / Abort Action */}
           <button 
             onClick={() => setShowAbortModal(true)}
             className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-100 text-red-650 hover:bg-red-100 hover:text-red-700 transition-colors active:scale-95 cursor-pointer"
             aria-label="Leave Exam"
           >
             <span className="text-sm font-bold tracking-wide">Leave Exam</span>
           </button>
 
           {/* Center: Progress */}
           <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
              <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Question {currentIdx + 1} of {questions.length}
              </span>
           </div>
 
           {/* Right: Timer */}
           <div className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-sm font-mono font-medium text-gray-800">
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
                className="bg-white border border-gray-100 p-6 rounded-[24px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] max-w-md w-full text-left"
              >
                <h3 className="text-lg font-black text-gray-900 mb-2">Abort Examination?</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                  Leaving now will automatically submit your current progress, resulting in a score of 0 for unanswered questions.
                </p>
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setShowAbortModal(false)}
                    className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 bg-transparent border-none transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      setShowAbortModal(false);
                      submitGrading();
                    }}
                    className="px-5 py-2 text-sm font-black text-white bg-red-650 hover:bg-red-700 rounded-[15px] border-none transition-all shadow-sm cursor-pointer"
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