"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { ChatPanel, MarkdownRenderer } from "@/components/lesson";
import { ChatMessage } from "@/components/lesson/ChatPanel";
import { useUserContext } from "@/context/UserContext";

interface SummaryTabProps {
  summary: string;
  lessonId?: string;
}

export const SummaryTab = React.memo(function SummaryTab({ summary, lessonId }: SummaryTabProps) {
  const { refreshUser } = useUserContext();
  // Highlight Selection State
  const [selectedText, setSelectedText] = useState("");
  
  // Chat State
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Restore chat history from localStorage on mount
  useEffect(() => {
    if (!lessonId) return;
    try {
      const saved = localStorage.getItem(`omnave_chat_${lessonId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Force all messages restored from localStorage to have isAnimated: true
          const restored: ChatMessage[] = parsed.map((m: any) => ({
            ...m,
            isAnimated: true,
          }));
          setChatHistory(restored);
        }
      }
    } catch (e) {
      console.error("Error loading chat memory from localStorage:", e);
    }
  }, [lessonId]);

  // Persist chat history to localStorage
  useEffect(() => {
    if (!lessonId || chatHistory.length === 0) return;
    try {
      localStorage.setItem(`omnave_chat_${lessonId}`, JSON.stringify(chatHistory));
    } catch (e) {
      console.error("Error saving chat memory to localStorage:", e);
    }
  }, [chatHistory, lessonId]);

  // Auto-scroll to bottom when chat updates
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, isChatLoading]);

  // Listen for user highlighting text in the summary
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        const summaryTextElement = document.getElementById("summary-text");
        if (summaryTextElement && summaryTextElement.contains(selection.anchorNode as Node)) {
          setSelectedText(selection.toString().trim());
          return;
        }
      }
      setSelectedText("");
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  const handleMessageAnimationComplete = (idx: number) => {
    setChatHistory((prev) =>
      prev.map((msg, i) => (i === idx ? { ...msg, isAnimated: true } : msg))
    );
  };

  // Handle AI Chat Logic
  const handleAskQuestion = async (customText?: string) => {
    const promptText = (customText || chatInput).trim();
    if (!promptText) return;

    setChatHistory((prev) => [...prev, { role: "user", text: promptText, isAnimated: true }]);
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
          summary: summary,
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

      const data = await response.json();
      if (!data.success || !data.reply) {
        throw new Error(data.message || "Failed to generate AI response.");
      }

      setChatHistory((prev) => [
        ...prev,
        {
          role: "ai",
          text: data.reply,
          isAnimated: false, // Brand new message plays typewriter animation once
        },
      ]);
      await refreshUser();
    } catch (err: unknown) {
      console.error("AI chat error:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setChatError(errMsg || "Something went wrong. Please try again.");
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 pb-8 items-start animate-in fade-in duration-300">
      
      {/* Left Column: Summary Text */}
      <div className="max-w-2xl lg:max-w-3xl mx-auto space-y-8 lg:sticky lg:top-[190px] w-full">
        
        <button
          onClick={() => handleAskQuestion("Explain this entire summary to me like I am 5 years old using a fun, easy analogy.")}
          className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full shadow-sm text-xs font-bold text-white/90 hover:bg-white/10 hover:text-white active:scale-95 transition-all duration-150 w-max cursor-pointer"
        >
          <Sparkles size={14} className="text-omnave-primary" />
          <span>Explain Like I'm 5</span>
        </button>

        <div className="bg-[#130E24]/60 backdrop-blur-xl border border-white/5 p-6 md:p-8 rounded-[24px] shadow-premium-glass transition-colors duration-150 relative group">
          <div className="absolute top-4 right-4 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[9px] font-bold text-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
            Highlight text to ask tutor
          </div>
          <div className="select-text prose prose-invert max-w-none prose-p:text-white/70 prose-p:leading-relaxed prose-headings:text-white prose-headings:font-bold prose-li:text-white/70 marker:text-omnave-primary" id="summary-text">
            <MarkdownRenderer text={summary || "No summary content."} variant="summary" />
          </div>
        </div>
      </div>

      {/* Right Column: AI Tutor Chat */}
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
        onMessageAnimationComplete={handleMessageAnimationComplete}
      />
      
    </div>
  );
});

SummaryTab.displayName = "SummaryTab";