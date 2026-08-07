"use client";
 
import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { FileText, Zap, Target, MessageCircle } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { useUserContext } from "@/context/UserContext";
import { useProgress } from "@/hooks/useProgress";
import { calculateKitProgress } from "@/hooks/useProgressStats";
import { MarkdownRenderer } from "@/components/lesson";
import { useAssessmentGuard } from "@/context/AssessmentContext";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
 
const AssessmentEngine = dynamic(
  () => import("@/components/assessment/AssessmentEngine").then((mod) => mod.AssessmentEngine),
  { ssr: false }
);
 
const FlashcardEngine = dynamic(
  () => import("@/components/assessment/FlashcardEngine").then((mod) => mod.FlashcardEngine),
  { ssr: false }
);
 
const ChatPanel = dynamic(
  () => import("@/components/lesson/ChatPanel").then((mod) => mod.ChatPanel),
  { ssr: false }
);

const SummaryTab = dynamic(
  () => import("@/components/assessment/SummaryTab").then((mod) => mod.SummaryTab),
  { ssr: false }
);
 
import { Skeleton } from "@/components/Skeleton";

export default function LessonView() {
  const router = useRouter();
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useUserContext();
  const planType = user?.plan_type || 'free';
  const { quizScores } = useProgress();
  const { isAssessmentActive, setIsAssessmentActive } = useAssessmentGuard();
 
  const [activeMode, setActiveMode] = useState<'summary' | 'flashcards' | 'quiz' | 'chat'>('summary');
  const [assessmentType, setAssessmentType] = useState<'quiz' | 'exam'>('quiz');
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "ai"; text: string }>>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
 
  // Restore Active Tab parameter if coming back from redirect
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#quiz") {
      setActiveMode("quiz");
    } else if (hash === "#flashcards") {
      setActiveMode("flashcards");
    }
  }, []);
 
  // Safe Guard: Reset active assessment state to false if user switches tabs to prevent header/nav disappearance
  useEffect(() => {
    if (activeMode !== 'quiz' && isAssessmentActive) {
      setIsAssessmentActive(false);
    }
  }, [activeMode, isAssessmentActive, setIsAssessmentActive]);
 
  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        setLoading(true);
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: material, error } = await supabase
          .from("materials")
          .select("*")
          .eq("id", id)
          .single();
 
        if (error) throw error;
        setData(material);
      } catch (err) {
        console.error("Error fetching material:", err);
        toast("Failed to load study kit.", "error");
      } finally {
        setLoading(false);
      }
    };
 
    if (id) fetchMaterial();
  }, [id, toast]);
 
  const handleAskQuestion = async (overrideText?: string) => {
    const finalInput = overrideText || chatInput;
    if (!finalInput.trim() || isChatLoading) return;

    const prompt = selectedText
      ? `Regarding this context:\n"${selectedText}"\n\nQuestion: ${finalInput}`
      : finalInput;

    const newUserMsg: { role: "user" | "ai"; text: string } = { role: "user", text: finalInput };
    setChatHistory(prev => [...prev, newUserMsg]);
    setChatInput("");
    setIsChatLoading(true);
    setChatError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          summary: data?.summary || "",
          materialId: id,
          messages: [...chatHistory, newUserMsg].map(m => ({
            role: m.role === 'ai' ? 'model' : 'user',
            content: m.text
          }))
        })
      });

      if (!response.ok) throw new Error("Tutor chat failed to respond");

      const resData = await response.json();
      console.log("API Response:", resData);
      const finalAiText =
        resData.reply ||
        resData.text ||
        resData.message ||
        resData.response ||
        resData.answer ||
        JSON.stringify(resData);
      setChatHistory(prev => [...prev, { role: "ai", text: finalAiText }]);
    } catch (err: any) {
      console.error(err);
      setChatError("Failed to get response from AI Tutor. Try again.");
    } finally {
      setIsChatLoading(false);
    }
  };
 
  const handleClearChat = () => {
    setChatHistory([]);
    setChatInput("");
    setSelectedText("");
    setChatError(null);
  };
 
  const handleNavigateToQuiz = () => {
    setActiveMode("quiz");
  };
 
  const handleNavigateToSummary = () => {
    setActiveMode("summary");
  };
 
  const memoizedFlashcards = useMemo(() => {
    return data ? data.flashcards || [] : [];
  }, [data]);
 
  const getCleanTitle = (path?: string | null) => {
    if (!path) return "Study Material";
    const base = path.split("/").pop() || "";
    const name = base.replace(/^\d+_/, "");
    return name.replace(".pdf", "") || "Study Material";
  };
 
  const displayTitle = data?.title || getCleanTitle(data?.file_path);
  const progress = data ? calculateKitProgress(data, quizScores) : 0;
 
  if (loading) {
    return (
      <div className="w-full flex-1 flex flex-col max-w-3xl mx-auto pt-4 px-3 text-left" aria-hidden="true">
        {activeMode === 'summary' && (
          <div className="flex-1 w-full bg-white border border-gray-100 rounded-[24px] shadow-[0_8px_40px_rgba(0,0,0,0.08)] flex flex-col p-6 min-h-[450px] mb-6">
            <div className="flex flex-col gap-6 text-left">
              {/* Title / Heading Skeleton */}
              <div className="flex flex-col gap-2">
                <Skeleton className="h-7 w-2/3 rounded-md animate-pulse" />
                <Skeleton className="h-4 w-1/3 rounded-md" />
              </div>
              {/* Paragraph 1 */}
              <div className="flex flex-col gap-2.5 mt-2">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-11/12 rounded-md" />
                <Skeleton className="h-4 w-4/5 rounded-md" />
              </div>
              {/* Paragraph 2 */}
              <div className="flex flex-col gap-2.5 mt-4">
                <Skeleton className="h-5 w-40 rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
              </div>
            </div>
          </div>
        )}

        {activeMode === 'chat' && (
          <div className="flex-1 w-full bg-white border border-gray-100 rounded-[24px] shadow-[0_8px_40px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden mb-6 min-h-[450px]">
            {/* Chat Header Skeleton (Tutor Chat with integrated assistant strictly named OmnaveAI) */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center space-x-2">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex flex-col gap-1.5 text-left">
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                  <Skeleton className="h-2 w-10 rounded-md" />
                </div>
              </div>
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            </div>
            {/* Message bubbles list */}
            <div className="p-5 flex-1 flex flex-col gap-6 bg-white overflow-hidden">
              <Skeleton className="h-12 w-[180px] rounded-2xl rounded-tr-none self-end" />
              <div className="flex gap-2.5 items-start self-start max-w-[80%]">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <Skeleton className="h-24 w-[280px] rounded-2xl rounded-tl-none animate-pulse" />
              </div>
              <Skeleton className="h-10 w-[140px] rounded-2xl rounded-tr-none self-end" />
            </div>
            {/* Input area */}
            <div className="p-4 border-t border-gray-100 shrink-0 bg-white">
              <Skeleton className="h-[48px] w-full rounded-full" />
            </div>
          </div>
        )}

        {activeMode === 'flashcards' && (
          <div className="flex-1 w-full bg-white border border-gray-100 rounded-[24px] shadow-[0_8px_40px_rgba(0,0,0,0.08)] flex flex-col p-5 min-h-[450px] mb-6 justify-between">
            <div className="flex justify-between items-center mb-6">
              <Skeleton className="h-6 w-20 rounded-md" />
              <Skeleton className="h-6 w-28 rounded-md" />
            </div>
            {/* Slide Frame */}
            <div className="flex-1 border border-gray-100 rounded-[20px] flex flex-col items-center justify-center p-6 mb-6 min-h-[220px]">
              <Skeleton className="h-4 w-3/4 rounded-md mb-2 animate-pulse" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
            </div>
            {/* Leitner rating buttons */}
            <div className="flex justify-center gap-2">
              <Skeleton className="h-10 w-20 rounded-xl" />
              <Skeleton className="h-10 w-20 rounded-xl" />
              <Skeleton className="h-10 w-20 rounded-xl" />
            </div>
          </div>
        )}

        {activeMode === 'quiz' && (
          <div className="flex-1 w-full bg-white border border-gray-100 rounded-[24px] shadow-[0_8px_40px_rgba(0,0,0,0.08)] flex flex-col p-5 min-h-[450px] mb-6">
            {/* Sub-Header toggle */}
            <div className="flex justify-center mb-6">
              <Skeleton className="h-[36px] w-[220px] rounded-full" />
            </div>
            {/* Question Card */}
            <div className="border border-gray-100 rounded-2xl p-5 mb-4 flex flex-col gap-2 min-h-[100px]">
              <Skeleton className="h-4 w-full rounded-md animate-pulse" />
              <Skeleton className="h-4 w-2/3 rounded-md" />
            </div>
            {/* Option blocks */}
            <div className="flex flex-col gap-3">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        )}

        {/* Floating Context Switcher (Bottom Nav Pill) Skeleton */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-[320px] bg-white rounded-full shadow-[0px_10px_30px_rgba(0,0,0,0.15)] border border-gray-100 flex items-center justify-between p-1.5">
          <Skeleton className="h-[36px] flex-1 rounded-full mx-1" />
          <Skeleton className="h-[36px] flex-1 rounded-full mx-1" />
          <Skeleton className="h-[36px] flex-1 rounded-full mx-1" />
          <Skeleton className="h-[36px] flex-1 rounded-full mx-1" />
        </div>
      </div>
    );
  }
 
  if (!data) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center min-h-[300px] text-gray-500 font-poppins p-6 text-center">
        <p className="text-sm font-semibold">Study Kit not found.</p>
        <button 
          onClick={() => router.push('/library')}
          className="mt-4 px-4 py-2 bg-[#6949a8] hover:bg-[#563b8c] text-white text-xs font-semibold rounded-full border-none cursor-pointer active:scale-95 transition-all shadow-sm"
        >
          Return to Library
        </button>
      </div>
    );
  }
 
  return (
    <div className={`w-full flex-1 flex flex-col relative transition-all duration-200 ${
      isAssessmentActive ? 'pb-8' : 'pb-32'
    }`}>
      {/* Main Stage (Conditional Mode Render) - Expanded to max-w-3xl for spaciousness */}
      <div className="w-full flex-1 flex flex-col max-w-3xl mx-auto pt-4 px-3 text-left">
        <div className="flex-1 w-full bg-white border border-gray-100 rounded-[24px] shadow-[0_8px_40px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden mb-6">
          
          <AnimatePresence mode="wait">
            {activeMode === 'summary' && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex-1 w-full overflow-y-auto p-5 font-poppins"
              >
                <SummaryTab summary={data?.summary || ""} lessonId={id as string} />
              </motion.div>
            )}
 
            {activeMode === 'flashcards' && (
              <motion.div
                key="flashcards"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full flex-1 min-h-[450px] p-5"
              >
                <FlashcardEngine 
                  lessonId={id as string} 
                  flashcards={memoizedFlashcards} 
                  onNavigateToQuiz={handleNavigateToQuiz} 
                  onNavigateToSummary={handleNavigateToSummary}
                />
              </motion.div>
            )}
 
            {activeMode === 'quiz' && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full flex-1 flex flex-col overflow-y-auto p-5"
              >
                {/* Sticky Sub-Header Toggle */}
                <div className="flex justify-center mb-6">
                  <div className="bg-gray-50 p-1 rounded-full border border-gray-100 shadow-[0px_4px_10px_rgba(0,0,0,0.02)] flex gap-1 font-poppins text-xs font-semibold select-none">
                    <button
                      onClick={() => setAssessmentType('quiz')}
                      className={`px-4 py-2 rounded-full transition-all border-none cursor-pointer duration-200 ${
                        assessmentType === 'quiz'
                          ? 'bg-[#6949a8] text-white shadow-sm'
                          : 'text-gray-500 bg-transparent hover:text-gray-700'
                      }`}
                    >
                      Practice Quiz
                    </button>
                    <button
                      onClick={() => {
                        toast("Mock Exam mode is coming soon!", "info");
                      }}
                      className={`px-4 py-2 rounded-full transition-all border-none cursor-pointer duration-200 flex items-center gap-1 ${
                        assessmentType === 'exam'
                          ? 'bg-[#6949a8] text-white shadow-sm'
                          : 'text-gray-555 bg-transparent hover:text-gray-700'
                      }`}
                    >
                      Mock Exam {planType === 'free' && '🔒'}
                    </button>
                  </div>
                </div>
 
                <AssessmentEngine 
                  lesson={data} 
                  activeTab={assessmentType} 
                />
              </motion.div>
            )}
 
            {activeMode === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full flex-1 overflow-hidden flex flex-col"
              >
                <ChatPanel
                  chatHistory={chatHistory}
                  chatInput={chatInput}
                  isChatLoading={isChatLoading}
                  chatError={chatError}
                  selectedText={selectedText}
                  onSend={handleAskQuestion}
                  onInputChange={setChatInput}
                  onClearSelectedText={() => setSelectedText("")}
                  scrollRef={chatScrollRef}
                  onClearChat={handleClearChat}
                />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
 
      {/* Floating Context Switcher (Bottom Nav Pill) - Hidden during active quiz takeover */}
      {!isAssessmentActive && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-[320px] bg-white rounded-full shadow-[0px_10px_30px_rgba(0,0,0,0.15)] border border-gray-100 flex items-center justify-between p-1.5 font-poppins select-none">
          <button 
            onClick={() => setActiveMode('summary')}
            className={`flex-1 py-2.5 flex items-center justify-center transition-all duration-200 border-none cursor-pointer ${
              activeMode === 'summary' 
                ? 'bg-[#6949a8] text-white rounded-full shadow-md' 
                : 'text-gray-400 bg-transparent hover:text-gray-600'
            }`}
            title="Summary"
          >
            <FileText size={18} />
          </button>
          <button 
            onClick={() => setActiveMode('flashcards')}
            className={`flex-1 py-2.5 flex items-center justify-center transition-all duration-200 border-none cursor-pointer ${
              activeMode === 'flashcards' 
                ? 'bg-[#6949a8] text-white rounded-full shadow-md' 
                : 'text-gray-400 bg-transparent hover:text-gray-600'
            }`}
            title="Flashcards"
          >
            <Zap size={18} />
          </button>
          <button 
            onClick={() => setActiveMode('quiz')}
            className={`flex-1 py-2.5 flex items-center justify-center transition-all duration-200 border-none cursor-pointer ${
              activeMode === 'quiz' 
                ? 'bg-[#6949a8] text-white rounded-full shadow-md' 
                : 'text-gray-400 bg-transparent hover:text-gray-600'
            }`}
            title="Quiz"
          >
            <Target size={18} />
          </button>
          <button 
            onClick={() => setActiveMode('chat')}
            className={`flex-1 py-2.5 flex items-center justify-center transition-all duration-200 border-none cursor-pointer ${
              activeMode === 'chat' 
                ? 'bg-[#6949a8] text-white rounded-full shadow-md' 
                : 'text-gray-400 bg-transparent hover:text-gray-600'
            }`}
            title="Tutor Chat"
          >
            <MessageCircle size={18} />
          </button>
        </div>
      )}
    </div>
  );
}