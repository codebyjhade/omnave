"use client";
 
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { ChevronLeft, FileText, Zap, Target, MessageCircle } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { useUserContext } from "@/context/UserContext";
import { useProgress } from "@/hooks/useProgress";
import { calculateKitProgress } from "@/hooks/useProgressStats";
import { MarkdownRenderer } from "@/components/lesson";
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
 
export default function LessonView() {
  const router = useRouter();
  const { id } = useParams();
  const { user, loading: contextLoading } = useUserContext();
  const { quizScores } = useProgress();
  const { toast } = useToast();
  const planType = user?.plan_type || 'free';
 
  // Data State
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
 
  // Active workspace mode
  const [activeMode, setActiveMode] = useState<'summary' | 'flashcards' | 'quiz' | 'chat'>('summary');
  
  // Assessment View State
  const [assessmentType, setAssessmentType] = useState<'quiz' | 'exam'>('quiz');
 
  // Chat Panel states
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState("");
  
  const chatScrollRef = useRef<HTMLDivElement>(null);
 
  // Hydrate Chat History from LocalStorage on mount
  useEffect(() => {
    if (id) {
      try {
        const saved = localStorage.getItem(`omnilearn:chat:${id}`);
        if (saved) {
          setChatHistory(JSON.parse(saved));
        }
      } catch (err) {
        console.error("Failed to hydrate chat history:", err);
      }
    }
  }, [id]);
 
  // Persist Chat History to LocalStorage on changes
  useEffect(() => {
    if (id) {
      try {
        localStorage.setItem(`omnilearn:chat:${id}`, JSON.stringify(chatHistory));
      } catch (err) {
        console.error("Failed to persist chat history:", err);
      }
    }
  }, [id, chatHistory]);
 
  // Auto-scroll to bottom when chat updates
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, isChatLoading]);
 
  // Clear Chat Logic
  const handleClearChat = useCallback(() => {
    setChatHistory([]);
    try {
      localStorage.removeItem(`omnilearn:chat:${id}`);
    } catch (err) {
      console.error("Failed to clear chat history:", err);
    }
  }, [id]);
 
  // Handle AI Chat Logic
  const handleAskQuestion = async (customText?: string) => {
    const promptText = (customText || chatInput).trim();
    if (!promptText) return;
 
    setChatHistory((prev) => [...prev, { role: "user", text: promptText }]);
    setChatInput("");
    setIsChatLoading(true);
    setChatError(null);
 
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: promptText,
          summary: data?.summary || "",
          history: chatHistory.slice(-10).map(msg => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.text
          }))
        }),
      });
 
      if (!response.ok) {
        let errMsg = "AI tutor failed to respond.";
        try {
          const json = await response.json();
          if (json?.message) errMsg = json.message;
          else if (json?.error) errMsg = json.error;
        } catch {}
        throw new Error(errMsg);
      }
 
      const resData = await response.json();
      if (!resData.success || !resData.reply) {
        throw new Error(resData.message || "Failed to generate AI response.");
      }
 
      setChatHistory((prev) => [
        ...prev,
        {
          role: "ai",
          text: resData.reply,
        },
      ]);
    } catch (err: unknown) {
      console.error("AI chat error:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setChatError(errMsg || "Something went wrong. Please try again.");
    } finally {
      setIsChatLoading(false);
    }
  };
 
  // Supabase Fetching and Polling
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
 
  // AI Generation processing redirect
  useEffect(() => {
    if (!loading && data && (!data.is_processed || data.status === "PROCESSING")) {
      toast("Your material is still processing in the background.", "info");
      router.replace('/library');
    }
  }, [loading, data, router, toast]);
 
  const memoizedFlashcards = useMemo(() => {
    return data?.flashcards || [];
  }, [data?.flashcards]);
 
  const handleNavigateToQuiz = () => {
    setActiveMode("quiz");
  };
 
  const handleNavigateToSummary = () => {
    setActiveMode("summary");
  };
 
  if (loading || contextLoading) {
    return (
      <main className="min-h-[100dvh] bg-slate-50 flex flex-col items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#6949a8] border-t-transparent rounded-full" />
      </main>
    );
  }
 
  if (!data) {
    return (
      <main className="min-h-[100dvh] bg-slate-50 flex flex-col items-center justify-center p-6 text-gray-500 font-poppins">
        Study Kit not found.
      </main>
    );
  }
 
  if (!data.is_processed || data.status === "PROCESSING") {
    return null; // Return null while redirecting
  }
 
  const getCleanTitle = (path?: string | null) => {
    if (!path) return "Study Material";
    const base = path.split("/").pop() || "";
    const name = base.replace(/^\d+_/, "");
    return name.replace(".pdf", "") || "Study Material";
  };
 
  const displayTitle = data?.title || getCleanTitle(data?.file_path);
  const progress = data ? calculateKitProgress(data, quizScores) : 0;
 
  return (
    <main className="min-h-[100dvh] bg-slate-50 flex flex-col pb-[calc(env(safe-area-inset-bottom)+100px)] relative w-full">
      {/* Focused Sticky Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-5 py-4 flex items-center justify-between shadow-sm select-none">
        <button
          onClick={() => router.push('/library')}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer text-gray-600 hover:text-gray-900 focus:outline-none border-none bg-transparent"
          aria-label="Go back to Library"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="font-bold text-gray-900 font-poppins truncate max-w-[200px]">
          {displayTitle}
        </span>
        <div className="w-8 h-8 rounded-full border-2 border-purple-100 flex items-center justify-center text-[9px] font-bold text-[#6949a8]">
          {progress}%
        </div>
      </header>
 
      {/* Main Stage (Conditional Mode Render) */}
      <div className="flex-1 w-full max-w-2xl mx-auto p-5 text-left flex flex-col">
        <div className="flex-1 w-full bg-white rounded-[32px] shadow-[0px_10px_40px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden flex flex-col mb-4 mt-2">
          {activeMode === 'summary' && (
            <div className="flex-1 w-full overflow-y-auto p-6 md:p-8 font-poppins">
              <MarkdownRenderer text={data.summary || "No summary content."} variant="summary" theme="light" />
            </div>
          )}
 
          {activeMode === 'flashcards' && (
            <div className="w-full flex-1 min-h-[450px] p-6">
              <FlashcardEngine 
                lessonId={id as string} 
                flashcards={memoizedFlashcards} 
                onNavigateToQuiz={handleNavigateToQuiz} 
                onNavigateToSummary={handleNavigateToSummary}
              />
            </div>
          )}
 
          {activeMode === 'quiz' && (
            <div className="w-full flex-1 flex flex-col overflow-y-auto p-6">
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
            </div>
          )}
 
          {activeMode === 'chat' && (
            <div className="w-full flex-1 overflow-hidden flex flex-col">
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
            </div>
          )}
        </div>
      </div>
 
      {/* Floating Context Switcher (Bottom Nav Pill) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[320px] bg-white rounded-full shadow-[0px_10px_30px_rgba(0,0,0,0.15)] border border-gray-100 flex items-center justify-between p-1.5 font-poppins select-none">
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
    </main>
  );
}