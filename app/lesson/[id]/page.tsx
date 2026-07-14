"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { BrainCircuit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// UI Components
import { Skeleton } from "@/components/Skeleton";
import { LessonHeader, LessonNav, type TabId, StudySessionBanner, GamificationToast } from "@/components/lesson";

// Our Newly Extracted Engines
import { SummaryTab } from "@/components/assessment/SummaryTab";
import { AssessmentEngine } from "@/components/assessment/AssessmentEngine";
import { FlashcardEngine } from "@/components/assessment/FlashcardEngine";

// Context
import { useAssessmentGuard } from "@/context/AssessmentContext";
import { useUserContext } from "@/context/UserContext";

export default function LessonView() {
  const { id } = useParams();
  const { isAssessmentActive, triggerNavAttempt } = useAssessmentGuard();
  const { loading: contextLoading } = useUserContext();

  // Data State
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Layout State
  const [activeTab, setActiveTab] = useState<TabId>("summary");
  const [studyDuration, setStudyDuration] = useState(0);
  const studyIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [xpReward, setXpReward] = useState<{ xp: number, streakBonus: boolean } | null>(null);

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
    if (!loading && data?.is_processed) {
      studyIntervalRef.current = setInterval(() => {
        setStudyDuration((d) => d + 1);
      }, 1000);
    }
    return () => {
      if (studyIntervalRef.current) clearInterval(studyIntervalRef.current);
    };
  }, [loading, data]);

  // 1. Initial Loading State
  if (loading || contextLoading) {
    return (
      <div className="relative min-h-screen pb-32 px-4 md:px-8 overflow-hidden flex flex-col items-center">
        <main className="relative z-10 w-full max-w-6xl pt-28 md:pt-24 pb-40 md:pb-24 animate-pulse">
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
      <div className="relative min-h-screen pb-32 px-4 flex flex-col items-center justify-center overflow-hidden">
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
              className="h-full bg-gradient-to-r from-omnave-primary/50 to-omnave-primary rounded-full relative"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
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
  const safePath = data.content_url || data.file_path || "";
  const title = safePath.split("_").slice(1).join("_").replace(".pdf", "") || data.title || "Study Session";
  const topics = data.flashcards?.slice(0, 4).map((f: any) => f.front) || ["Study"];

  const handleTopicClick = (topic: string) => {
    setActiveTab("summary");
  };

  return (
    <div className="relative min-h-screen pb-32 px-4 md:px-8 overflow-hidden flex flex-col items-center">
      <main className="relative z-10 w-full max-w-6xl pt-28 md:pt-24 pb-40 md:pb-24">
        <div className="flex flex-col w-full">

          {/* HEADER SECTION (Hidden if full-screen exam mode active) */}
          {!isAssessmentActive && (
            <>
              <LessonHeader
                title={title}
                subject={topics[0] || "Study Material"}
                flashcardCount={data.flashcards?.length || 0}
                quizCount={data.quizzes?.length || 0}
                completionPercentage={0}
                readingTime="5 min read"
                topics={topics}
                onTopicClick={handleTopicClick}
              />

              <LessonNav activeTab={activeTab} onTabChange={handleTabChange} />

              <StudySessionBanner
                activeTab={activeTab}
                flashcardCount={data.flashcards?.length || 0}
                quizCount={data.quizzes?.length || 0}
                studyDuration={studyDuration}
              />
            </>
          )}

          <div className="mt-4 md:mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* 1. SUMMARY TAB */}
                {activeTab === "summary" && (
                  <SummaryTab summary={data.summary || ""} />
                )}

                {/* 2. FLASHCARDS TAB */}
                {activeTab === "slides" && (
                  <div className="pt-4 flex flex-col max-w-2xl mx-auto w-full pb-28 md:pb-16">
                    <FlashcardEngine 
                      lessonId={id as string} 
                      flashcards={data.flashcards || []} 
                      onNavigateToQuiz={() => setActiveTab("quiz")}
                      onNavigateToSummary={() => setActiveTab("summary")}
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

              </motion.div>
            </AnimatePresence>
          </div>

          <GamificationToast xpReward={xpReward} />
        </div>
      </main>
    </div>
  );
}