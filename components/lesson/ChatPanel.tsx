"use client";

import React, { memo, RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageSquare, ChevronRight, Copy, RotateCcw, ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { TypewriterText } from "./TypewriterText";

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

interface ChatPanelProps {
  chatHistory: ChatMessage[];
  chatInput: string;
  isChatLoading: boolean;
  chatError: string | null;
  selectedText: string;
  onSend: (text?: string) => void;
  onInputChange: (value: string) => void;
  onClearSelectedText: () => void;
  scrollRef: RefObject<HTMLDivElement | null>;
}

const suggestionChips = [
  { icon: <Sparkles size={12} />, text: "Explain like I'm 12" },
  { icon: <MessageSquare size={12} />, text: "Give an example" },
  { icon: <MessageSquare size={12} />, text: "Summarize" },
  { icon: <Sparkles size={12} />, text: "Create mnemonic" },
  { icon: <MessageSquare size={12} />, text: "Quiz me" },
  { icon: <Sparkles size={12} />, text: "Real-world application" },
  { icon: <MessageSquare size={12} />, text: "Compare concepts" },
];

const smartSuggestions = [
  "Explain key formula",
  "List real-world examples",
  "Create a memory hook",
];

export const ChatPanel = memo(function ChatPanel({
  chatHistory,
  chatInput,
  isChatLoading,
  chatError,
  selectedText,
  onSend,
  onInputChange,
  onClearSelectedText,
  scrollRef,
}: ChatPanelProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleRetry = () => {
    const lastUserMsg = [...chatHistory].reverse().find((msg) => msg.role === "user");
    if (lastUserMsg) {
      onSend(lastUserMsg.text);
    }
  };

  return (
    <div className="bg-black/[0.4] border border-white/[0.1] backdrop-blur-2xl rounded-[24px] overflow-hidden shadow-premium-glass flex flex-col h-auto lg:h-[calc(100vh-140px)] lg:sticky lg:top-[100px] w-full">
      {/* Chat Header */}
      <div className="flex items-center space-x-2 px-5 py-4 border-b border-white/[0.08] bg-white/[0.02] shrink-0">
        <div className="w-8 h-8 rounded-full bg-omnave-primary/20 border border-omnave-primary/30 flex items-center justify-center">
          <Sparkles size={14} className="text-omnave-primary" />
        </div>
        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-white leading-none">omnave. AI</h3>
          <span className="text-[10px] font-medium text-omnave-primary uppercase tracking-wider mt-1">Online</span>
        </div>
      </div>

      {/* Chat History Area */}
      <div ref={scrollRef} className="p-5 flex-1 overflow-y-auto flex flex-col space-y-6 scroll-smooth select-text">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-8 space-y-5 select-none">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-omnave-primary shadow-sm">
              <MessageSquare size={22} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-white">Socratic Study Companion</h4>
              <p className="text-xs text-white/50 leading-normal">
                Ask anything about this lesson.
              </p>
            </div>
            <div className="w-full max-w-xs text-left bg-white/[0.01] p-4 rounded-2xl border border-white/5 space-y-2">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Try asking:</p>
              <ul className="space-y-2 text-xs font-semibold text-white/70">
                {["Explain this topic", "Give examples", "Make a quiz", "Simplify this paragraph"].map((exampleText, eIdx) => (
                  <li
                    key={eIdx}
                    onClick={() => onInputChange(exampleText)}
                    className="flex items-center space-x-1.5 cursor-pointer hover:text-omnave-primary transition-colors duration-150"
                  >
                    <ChevronRight size={12} className="text-omnave-primary shrink-0" />
                    <span>&ldquo;{exampleText}&rdquo;</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <>
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`
                    p-5 max-w-[85%] text-sm leading-relaxed shadow-sm group relative
                    ${msg.role === "user"
                      ? "bg-omnave-primary text-white rounded-3xl rounded-tr-sm border border-omnave-primary/30"
                      : "bg-white/5 text-white rounded-3xl rounded-tl-sm border border-white/5"
                    }
                  `}
                >
                  <div className="leading-relaxed whitespace-pre-wrap">
                    {msg.role === "ai" && idx === chatHistory.length - 1 && !isChatLoading ? (
                      <TypewriterText text={msg.text} variant="chat" />
                    ) : (
                      <MarkdownRenderer text={msg.text} variant="chat" />
                    )}

                    {/* Message actions bar for AI responses */}
                    {msg.role === "ai" && (
                      <div className="flex items-center space-x-3 mt-3 pt-2 border-t border-white/5 opacity-60 group-hover:opacity-100 transition-opacity duration-150">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopy(msg.text); }}
                          className="p-1 hover:bg-white/5 rounded transition-colors text-white/40 hover:text-white"
                          title="Copy response"
                          aria-label="Copy response"
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRetry(); }}
                          className="p-1 hover:bg-white/5 rounded transition-colors text-white/40 hover:text-white"
                          title="Regenerate"
                          aria-label="Regenerate response"
                        >
                          <RotateCcw size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); }}
                          className="p-1 hover:bg-white/5 rounded transition-colors text-white/40 hover:text-white"
                          title="Thumbs up"
                          aria-label="Thumbs up"
                        >
                          <ThumbsUp size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); }}
                          className="p-1 hover:bg-white/5 rounded transition-colors text-white/40 hover:text-white"
                          title="Thumbs down"
                          aria-label="Thumbs down"
                        >
                          <ThumbsDown size={12} />
                        </button>
                      </div>
                    )}

                    {/* Contextual Smart Suggestion Chips */}
                    {msg.role === "ai" && idx === chatHistory.length - 1 && !isChatLoading && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {smartSuggestions.map((suggestion, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => onSend(suggestion)}
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[9px] font-bold transition-all duration-150 active:scale-[0.97]"
                          >
                            💡 {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isChatLoading && (
              <div className="flex w-full justify-start animate-pulse">
                <div className="bg-white/5 text-white p-5 rounded-3xl rounded-tl-sm border border-white/5 shadow-sm flex items-center space-x-2">
                  <span className="font-semibold text-xs text-white/40">Thinking</span>
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-white/45 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-white/45 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-white/45 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}

            <AnimatePresence>
              {chatError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex w-full justify-start"
                >
                  <div className="bg-red-950/40 text-red-300 p-4 rounded-3xl rounded-tl-sm border border-red-800 shadow-sm flex flex-col space-y-2 max-w-[85%] text-xs font-semibold">
                    <span>⚠️ {chatError}</span>
                    <button
                      onClick={handleRetry}
                      className="px-3 py-1.5 bg-red-650 text-white rounded-xl font-bold hover:brightness-110 transition-all duration-150 w-max active:scale-95"
                    >
                      Retry
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Input & Smart Chips Area */}
      <div className="p-4 pb-28 lg:pb-4 bg-[#0A0A0A]/90 border-t border-white/[0.08] shrink-0">
        {/* Highlight Selection Chip */}
        <AnimatePresence>
          {selectedText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              className="p-3 mb-3 bg-omnave-primary/20 border border-omnave-primary/30 rounded-2xl flex items-center justify-between text-xs"
            >
              <div className="truncate flex-1 pr-2">
                <span className="font-bold text-omnave-primary">Selected text: </span>
                <span className="text-white/60 italic">&ldquo;{selectedText}&rdquo;</span>
              </div>
              <button
                onClick={() => {
                  onSend(`Regarding this segment: "${selectedText}". Can you explain this concept in more detail?`);
                  onClearSelectedText();
                  window.getSelection()?.removeAllRanges();
                }}
                className="px-3 py-1.5 bg-omnave-primary text-white rounded-xl font-bold hover:brightness-110 transition-all shrink-0 active:scale-95"
              >
                Ask Tutor
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Smart Suggestion Chips */}
        <div className="flex space-x-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-3 mb-1">
          {suggestionChips.map((chip, i) => (
            <button
              key={i}
              onClick={() => onSend(chip.text)}
              className="flex items-center space-x-1.5 h-11 px-4 bg-white/5 border border-white/10 rounded-full text-[11px] font-bold text-white/70 hover:bg-omnave-primary/20 hover:text-omnave-primary hover:border-omnave-primary transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {chip.icon} <span>{chip.text}</span>
            </button>
          ))}
        </div>

        {/* Character Count */}
        {chatInput.length >= 800 && (
          <div className="flex justify-end text-[10px] font-bold text-amber-400 mb-1.5 mr-2">
            {chatInput.length}/1000 characters
          </div>
        )}

        {/* Input Bar */}
        <div className="flex space-x-2 items-end">
          <textarea
            value={chatInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={1000}
            placeholder="Ask a question..."
            className="flex-1 bg-white/5 text-white text-sm rounded-2xl px-5 py-4 h-14 outline-none focus:ring-2 focus:ring-omnave-primary/50 transition-all duration-150 border border-white/10 resize-none overflow-y-auto scrollbar-hide"
            aria-label="Ask the AI tutor a question"
          />
          <button
            onClick={() => onSend()}
            disabled={isChatLoading || !chatInput.trim()}
            className="bg-omnave-primary text-white px-6 h-14 rounded-2xl font-bold hover:brightness-110 transition-all duration-150 disabled:opacity-50 active:scale-95 shadow-sm flex items-center justify-center shrink-0"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
});
