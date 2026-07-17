"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { BrainCircuit, ArrowLeft, MoreHorizontal, FileText, Play, Layers, Target, Sparkles, Edit3, RefreshCw, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";

// UI Components
import { Skeleton } from "@/components/Skeleton";
import { LessonHeader, LessonNav, type TabId, StudySessionBanner, GamificationToast } from "@/components/lesson";

// Context & Hooks
import { useAssessmentGuard } from "@/context/AssessmentContext";
import { useUserContext } from "@/context/UserContext";
import { useProgress } from "@/hooks/useProgress";
import { calculateKitProgress } from "@/hooks/useProgressStats";
import dynamic from "next/dynamic";

const SummaryTab = dynamic(
  () => import("@/components/assessment/SummaryTab").then((mod) => mod.SummaryTab),
  { ssr: false }
);
const AssessmentEngine = dynamic(
  () => import("@/components/assessment/AssessmentEngine").then((mod) => mod.AssessmentEngine),
  { ssr: false }
);
const FlashcardEngine = dynamic(
  () => import("@/components/assessment/FlashcardEngine").then((mod) => mod.FlashcardEngine),
  { ssr: false }
);

export default function LessonView() {
  const router = useRouter();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const { isAssessmentActive, triggerNavAttempt } = useAssessmentGuard();
  const { loading: contextLoading } = useUserContext();
  const { quizScores, refreshProgress } = useProgress();

  // Data State
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Layout State
  const [activeTab, setActiveTab] = useState<TabId>("summary");
  const [viewMode, setViewMode] = useState<"hub" | "study">("hub");

  // Sync active tab from query params
  useEffect(() => {
    if (tabParam) {
      setViewMode("study");
      if (tabParam === "flashcards" || tabParam === "slides") {
        setActiveTab("slides");
      } else if (tabParam === "quiz" || tabParam === "exam" || tabParam === "summary") {
        setActiveTab(tabParam as TabId);
      }
    }
  }, [tabParam]);

  const [studyDuration, setStudyDuration] = useState(0);
  const studyIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [xpReward, setXpReward] = useState<{ xp: number, streakBonus: boolean } | null>(null);

  // Header menu and actions state
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleNavigateToQuiz = useCallback(() => {
    setActiveTab("quiz");
  }, []);

  const handleNavigateToSummary = useCallback(() => {
    setActiveTab("summary");
  }, []);

  const memoizedFlashcards = useMemo(() => {
    return data?.flashcards || [];
  }, [data?.flashcards]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) {
        setShowHeaderMenu(false);
      }
    };
    if (showHeaderMenu) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showHeaderMenu]);

  const handleResetMastery = async () => {
    const confirmReset = window.confirm("Are you sure you want to reset your mastery progress for this kit? This will delete all quiz scores.");
    if (!confirmReset) return;

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase
        .from('quiz_scores')
        .delete()
        .eq('lesson_id', id);

      if (error) throw error;

      toast("Mastery progress reset to 0%", "success");
      refreshProgress();
    } catch (err) {
      toast("Failed to reset progress", "error");
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempTitle.trim()) return;

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase
        .from('materials')
        .update({ title: tempTitle.trim() })
        .eq('id', id);

      if (error) throw error;

      setData((prev: any) => prev ? { ...prev, title: tempTitle.trim() } : null);
      toast("Study kit renamed successfully", "success");
      setShowEditModal(false);
    } catch (err) {
      toast("Failed to rename study kit", "error");
    }
  };

  const handleDeleteKit = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this study kit? This action cannot be undone.");
    if (!confirmDelete) return;

    setIsActionLoading(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      if (data.content_url) {
        await supabase.storage.from("study_materials").remove([data.content_url]);
      }

      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast("Study kit deleted successfully", "success");
      router.push("/library");
    } catch (err) {
      toast("Failed to delete study kit", "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Tab Navigation Guard
  const handleTabChange = (tab: TabId) => {
    if (isAssessmentActive) {
      triggerNavAttempt(`/lesson/${id}`);
    } else {
      setActiveTab(tab);
    }
  };

  // DIRECT DATABASE FETCHING & POLLING LOGIC
  useEffect(() => {
    let isMounted = true;
    let pollInterval: NodeJS.Timeout;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchLesson = async () => {
      const { data: lessonData } = await supabase
        .from('materials')
        .select('*')
        .eq('id', id)
        .single();

      if (isMounted) {
        if (lessonData) {
          setData(lessonData);
          if (lessonData.is_processed) {
            clearInterval(pollInterval);
          }
        }
        setLoading(false);
      }
    };

    if (id) {
      fetchLesson();
      pollInterval = setInterval(fetchLesson, 3000);
    }

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [id]);

  // Study session timer
  useEffect(() => {
    if (!loading && data?.is_processed && viewMode === "study") {
      studyIntervalRef.current = setInterval(() => {
        setStudyDuration((d) => d + 1);
      }, 1000);
    }
    return () => {
      if (studyIntervalRef.current) {
        clearInterval(studyIntervalRef.current);
        studyIntervalRef.current = null;
      }
    };
  }, [loading, data, viewMode]);

  // 1. Initial Loading State
  if (loading || contextLoading) {
    return (
      <div className="relative min-h-screen bg-[#0A0710] pb-32 px-4 md:px-8 overflow-hidden flex flex-col items-center">
        <main className="relative z-10 w-full max-w-3xl pt-4 pb-40 md:pb-24 animate-pulse">
          <div className="flex flex-col w-full">
            <Skeleton className="w-24 h-4 mb-6 rounded-md" />
            <Skeleton className="w-3/4 h-8 mb-4" />
            <div className="flex gap-2 mb-8">
              <Skeleton className="w-16 h-6 rounded-full" />
              <Skeleton className="w-20 h-6 rounded-full" />
            </div>
            <div className="flex space-x-2 mb-6">
              <Skeleton className="w-24 h-10 rounded-full" />
              <Skeleton className="w-20 h-10 rounded-full" />
              <Skeleton className="w-20 h-10 rounded-full" />
            </div>
            <Skeleton className="w-full h-[300px] rounded-3xl" />
          </div>
        </main>
      </div>
    );
  }

  // 2. Data Not Found State
  if (!data) return <div className="p-6 text-white text-center mt-20">Study Kit not found.</div>;

  // 3. AI STILL GENERATING STATE (The Polling Lock Screen)
  if (!data.is_processed) {
    return (
      <div className="relative min-h-screen bg-[#0A0710] pb-32 px-4 flex flex-col items-center justify-center overflow-hidden">
        <div className="relative z-10 flex flex-col items-center text-center p-8 md:p-12 bg-black/[0.4] backdrop-blur-2xl border border-white/[0.1] rounded-[24px] shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 rounded-2xl bg-omnave-primary/20 border border-omnave-primary/30 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(127,34,254,0.3)]">
            <BrainCircuit className="w-10 h-10 text-omnave-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">AI is analyzing your document</h2>
          <p className="text-white/50 text-sm mb-8 leading-relaxed">
            Extracting key concepts, generating flashcards, and building your quizzes. This usually takes about 15-20 seconds.
          </p>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/10">
            <motion.div
              className="h-full w-full bg-gradient-to-r from-omnave-primary/50 to-omnave-primary rounded-full relative origin-left transform-gpu"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 18, ease: "linear" }}
            >
               <div className="absolute top-0 right-0 bottom-0 w-10 bg-white/20 blur-[5px] animate-pulse" />
            </motion.div>
          </div>
          <div className="mt-6 text-[10px] font-bold tracking-widest text-white/30 uppercase animate-pulse">
            Generating Lesson...
          </div>
        </div>
      </div>
    );
  }

  // Formatting variables
  const getCleanTitle = (path?: string | null) => {
    if (!path) return "Study Material";
    const base = path.split("/").pop() || "";
    const name = base.replace(/^\d+_/, "");
    return name.replace(".pdf", "") || "Study Material";
  };

  const getRawFilename = (path?: string | null) => {
    if (!path) return "document.pdf";
    const base = path.split("/").pop() || "";
    return base.replace(/^\d+_/, "") || "document.pdf";
  };

  const filename = getRawFilename(data?.file_path);
  const displayTitle = data?.title || getCleanTitle(data?.file_path);

  const flashcardCount = data.flashcards?.length || 0;
  const quizCount = data.quizzes?.length || 0;
  const progress = calculateKitProgress(data, quizScores);

  const pdfUrl = data.content_url 
    ? `https://htfdclxtioyucnppcxns.supabase.co/storage/v1/object/public/study_materials/${data.content_url}`
    : "#";

  return (
    <div className="relative min-h-screen bg-[#0A0710] pb-32 overflow-hidden flex flex-col items-center w-full">
      {/* Ambient Spotlight Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-omnave-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" aria-hidden="true" />
      {/* Dynamic Focus Header */}
      {!isAssessmentActive && (
        <header id="global-lesson-header" className="w-full flex items-center justify-between px-6 py-4 bg-[#0A0710]/40 backdrop-blur-md border-b border-white/5 sticky top-0 z-50 select-none">
          {viewMode === "hub" ? (
            <button
              onClick={() => router.push('/library')}
              className="flex items-center gap-2 px-3 py-1.5 -ml-3 text-white/70 hover:text-white hover:bg-white/5 rounded-lg active:scale-95 transition-all duration-200 select-none cursor-pointer"
              aria-label="Go back to Library"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium text-sm">Back</span>
            </button>
          ) : (
            <button 
              onClick={() => setViewMode("hub")} 
              className="flex items-center gap-2 px-3 py-1.5 -ml-3 text-white/70 hover:text-white hover:bg-white/5 rounded-lg active:scale-95 transition-all duration-200 select-none cursor-pointer"
              aria-label="Go back to Lesson Hub"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium text-sm">Lesson Hub</span>
            </button>
          )}
          
          <div className="text-sm font-bold text-white/80 select-none">
            {viewMode === "hub" ? "Focus Mode" : "Active Session"}
          </div>
          
          <div className="relative shrink-0 flex items-center" ref={headerMenuRef}>
            <button 
              onClick={() => setShowHeaderMenu(!showHeaderMenu)}
              className="p-2 text-white/40 hover:text-white transition-colors rounded-full hover:bg-white/5 cursor-pointer"
              aria-label="More options"
              aria-expanded={showHeaderMenu}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {showHeaderMenu && (
              <div className="absolute right-0 top-10 w-44 bg-[#1A1528] border border-white/10 rounded-xl shadow-xl py-1 z-20 backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  onClick={() => {
                    setShowHeaderMenu(false);
                    setTempTitle(displayTitle);
                    setShowEditModal(true);
                  }}
                  className="w-full text-left px-3 py-3 text-xs font-semibold text-white/80 hover:bg-white/[0.05] transition-colors flex items-center gap-2 min-h-[44px] cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-white/60" />
                  Edit Details
                </button>

                <div className="border-t border-white/5 my-1" />

                <button
                  disabled={isActionLoading}
                  onClick={() => {
                    setShowHeaderMenu(false);
                    handleDeleteKit();
                  }}
                  className="w-full text-left px-3 py-3 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 transition-colors min-h-[44px] cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Study Kit
                </button>
              </div>
            )}
          </div>
        </header>
      )}

      <main className="relative z-10 w-full max-w-3xl pt-4 pb-40 md:pb-24 px-6">
        <div className="flex flex-col w-full">

          <AnimatePresence mode="wait">
            {viewMode === "hub" ? (
              <motion.div
                key="hub"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full flex flex-col"
              >
                {/* Hero Card */}
                <div className="relative flex flex-col p-6 pb-7 bg-[#130E24]/80 backdrop-blur-xl border border-omnave-primary/20 rounded-3xl overflow-hidden w-full min-h-[220px] shadow-[0_0_40px_rgba(127,34,254,0.05)] select-none">
                  {/* Ambient Glow */}
                  <div className="absolute top-0 left-0 w-64 h-64 bg-omnave-primary/10 rounded-full blur-[80px] pointer-events-none translate-x-[-20%] translate-y-[-20%]" aria-hidden="true" />

                  {/* Title Stack */}
                  <div className="flex flex-col mb-6 relative z-10 text-left">
                    <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight line-clamp-2 drop-shadow-sm">
                      {displayTitle}
                    </h1>
                    <p className="text-sm text-white/40 mt-2 flex items-center gap-1.5 truncate" title={filename}>
                      <FileText className="w-4 h-4 shrink-0 text-white/30" />
                      {filename}
                    </p>
                  </div>

                  {/* Mastery Visual & CTA */}
                  <div className="mt-auto flex flex-col gap-4 relative z-10">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-semibold text-white/80">{progress}% Mastery Completed</span>
                      <span className="text-sm font-bold text-omnave-primary">Focus Level 1</span>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setViewMode("study");
                        setActiveTab("slides");
                      }}
                      className="w-full py-4 rounded-2xl bg-omnave-primary hover:bg-omnave-primary/95 text-white font-bold text-base transition-all duration-300 shadow-[0_0_25px_rgba(127,34,254,0.3)] hover:shadow-[0_0_35px_rgba(127,34,254,0.5)] active:scale-[0.99] flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white text-white" />
                      Resume Study Session
                    </button>
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
                </div>

                {/* The "Study Modules" Bento Grid */}
                <div className="grid grid-cols-2 gap-4 w-full mt-6 select-none">
                  {/* Module 1: Flashcards */}
                  <button 
                    onClick={() => {
                      setViewMode("study");
                      setActiveTab("slides");
                    }}
                    className="flex flex-col p-5 bg-[#130E24]/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden hover:bg-white/[0.02] hover:border-omnave-primary/20 transition-all text-left min-h-[140px] cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-omnave-primary mb-4 group-hover:border-omnave-primary/50 group-hover:shadow-[0_0_15px_rgba(127,34,254,0.3)] transition-all flex items-center justify-center">
                      <Layers className="w-5 h-5 text-omnave-primary brightness-125" />
                    </div>
                    <div className="mt-auto">
                      <h3 className="text-sm font-bold text-white group-hover:text-omnave-primary transition-colors">Flashcards</h3>
                      <p className="text-[11px] text-white/40 font-medium mt-0.5">{flashcardCount} items</p>
                    </div>
                  </button>

                  {/* Module 2: Practice Quiz */}
                  <button 
                    onClick={() => {
                      setViewMode("study");
                      setActiveTab("quiz");
                    }}
                    className="flex flex-col p-5 bg-[#130E24]/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden hover:bg-white/[0.02] hover:border-omnave-primary/20 transition-all text-left min-h-[140px] cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-yellow-500 mb-4 group-hover:border-omnave-primary/50 group-hover:shadow-[0_0_15px_rgba(127,34,254,0.3)] transition-all flex items-center justify-center">
                      <Target className="w-5 h-5 text-yellow-500 brightness-125" />
                    </div>
                    <div className="mt-auto">
                      <h3 className="text-sm font-bold text-white group-hover:text-yellow-500 transition-colors">Practice Quiz</h3>
                      <p className="text-[11px] text-white/40 font-medium mt-0.5">{quizCount} questions</p>
                    </div>
                  </button>

                  {/* Module 3: Source Document */}
                  <a 
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col p-5 bg-[#130E24]/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden hover:bg-white/[0.02] hover:border-omnave-primary/20 transition-all text-left min-h-[140px] block cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-blue-500 mb-4 group-hover:border-omnave-primary/50 group-hover:shadow-[0_0_15px_rgba(127,34,254,0.3)] transition-all flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-500 brightness-125" />
                    </div>
                    <div className="mt-auto">
                      <h3 className="text-sm font-bold text-white group-hover:text-blue-500 transition-colors">Original PDF</h3>
                      <p className="text-[11px] text-white/40 font-medium mt-0.5">View source</p>
                    </div>
                  </a>

                  {/* Module 4: AI Summary */}
                  <button 
                    onClick={() => {
                      setViewMode("study");
                      setActiveTab("summary");
                    }}
                    className="flex flex-col p-5 bg-[#130E24]/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden hover:bg-white/[0.02] hover:border-omnave-primary/20 transition-all text-left min-h-[140px] cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-purple-500 mb-4 group-hover:border-omnave-primary/50 group-hover:shadow-[0_0_15px_rgba(127,34,254,0.3)] transition-all flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-purple-500 brightness-125" />
                    </div>
                    <div className="mt-auto">
                      <h3 className="text-sm font-bold text-white group-hover:text-purple-500 transition-colors">Lesson Summary</h3>
                      <p className="text-[11px] text-white/40 font-medium mt-0.5">TL;DR Summary</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="study"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="w-full flex flex-col"
              >
                {!isAssessmentActive && (
                  <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 z-50 flex flex-col gap-4">
                    <LessonNav activeTab={activeTab} onTabChange={handleTabChange} />

                    <StudySessionBanner
                      activeTab={activeTab}
                      flashcardCount={flashcardCount}
                      quizCount={quizCount}
                      studyDuration={studyDuration}
                    />
                  </div>
                )}

                <div className="mt-4 md:mt-6 min-h-[450px]">
                  {/* 1. SUMMARY TAB */}
                  {activeTab === "summary" && (
                    <SummaryTab summary={data.summary || ""} />
                  )}

                  {/* 2. FLASHCARDS TAB */}
                  {activeTab === "slides" && (
                    <div className="pt-4 flex flex-col max-w-2xl mx-auto w-full pb-28 md:pb-16">
                      <FlashcardEngine 
                        lessonId={id as string} 
                        flashcards={memoizedFlashcards} 
                        onNavigateToQuiz={handleNavigateToQuiz} 
                        onNavigateToSummary={handleNavigateToSummary}
                      />
                    </div>
                  )}

                  {/* 3. QUIZ & EXAM TAB */}
                  {(activeTab === "quiz" || activeTab === "exam") && (
                    <div className="flex flex-col w-full pb-20 pt-4">
                      <AssessmentEngine 
                        lesson={data} 
                        activeTab={activeTab as "quiz" | "exam"} 
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <GamificationToast xpReward={xpReward} />
        </div>
      </main>

      {/* Rename Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-[#0A0710]/80 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="relative w-full max-w-md bg-[#120F20]/96 border border-white/10 rounded-2xl p-6 shadow-2xl z-10"
            >
              <h3 className="text-lg font-bold text-white mb-4">Edit Details</h3>
              <form onSubmit={handleRename} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">
                    Study Kit Title
                  </label>
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    placeholder="Enter study kit title"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-omnave-primary/40 transition-colors"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-omnave-primary hover:bg-omnave-primaryHover transition-colors shadow-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}