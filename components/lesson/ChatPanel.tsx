"use client";
 
import React, { memo, RefObject, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageSquare, ChevronRight, Copy, RotateCcw, ThumbsUp, ThumbsDown, Send, Trash2 } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { TypewriterText } from "./TypewriterText";
import { useUserContext } from "@/context/UserContext";
 
export interface ChatMessage {
  role: "user" | "ai";
  text: string;
  isAnimated?: boolean;
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
  onClearChat?: () => void;
  onMessageAnimationComplete?: (idx: number) => void;
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
  onClearChat,
  onMessageAnimationComplete,
}: ChatPanelProps) {
  const { user } = useUserContext();
  const planType = user?.plan_type || 'free';
 
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showClearModal, setShowClearModal] = useState(false);
 
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to recalculate on deletion
      textareaRef.current.style.height = "24px"; 
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [chatInput]);
  
  const isLimitReached = planType === 'free' && (
    (user?.agent_message_count !== undefined && user.agent_message_count >= 15) ||
    (chatError !== null && chatError.toLowerCase().includes("limit reached"))
  );
 
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
    <div className="flex-1 w-full h-full flex flex-col font-poppins text-left bg-transparent">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100 shrink-0 select-none">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center">
            <Sparkles size={14} className="text-[#6949a8]" />
          </div>
          <div className="flex flex-col text-left">
            <h3 className="text-sm font-bold text-gray-900 leading-none">OmnaveAI</h3>
            <span className="text-[10px] font-bold text-[#6949a8] uppercase tracking-wider mt-1">Online</span>
          </div>
        </div>
        
        {onClearChat && (
          <button 
            onClick={() => setShowClearModal(true)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all border-none bg-transparent cursor-pointer flex items-center justify-center active:scale-95"
            title="Clear Chat History"
            aria-label="Clear Chat History"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
 
      {/* Chat History Area */}
      <div ref={scrollRef} className="p-5 flex-1 overflow-y-auto flex flex-col space-y-6 scroll-smooth select-text bg-white">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-8 space-y-5 select-none bg-white">
            <div className="bg-purple-50 text-[#6949a8] p-3 rounded-2xl flex items-center justify-center">
              <MessageSquare size={22} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-gray-900">Socratic Study Companion</h4>
              <p className="text-xs text-gray-500 leading-normal font-medium">
                Ask anything about this lesson.
              </p>
            </div>
            <div className="w-full max-w-xs text-left bg-gray-50 p-4 rounded-[15px] border border-gray-100 space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Try asking:</p>
              <ul className="space-y-2 text-xs font-semibold text-gray-650">
                {["Explain this topic", "Give examples", "Make a quiz", "Simplify this paragraph"].map((exampleText, eIdx) => (
                  <li
                    key={eIdx}
                    onClick={() => onInputChange(exampleText)}
                    className="flex items-center space-x-1.5 cursor-pointer hover:bg-purple-50 hover:text-[#6949a8] p-1.5 rounded-lg transition-all"
                  >
                    <ChevronRight size={12} className="text-[#6949a8] shrink-0" />
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
                  className={msg.role === "user"
                    ? "bg-[#6949a8] text-white font-medium rounded-3xl rounded-tr-sm px-5 py-3.5 max-w-[85%] text-[15px] leading-relaxed shadow-sm group relative [&_*]:!text-white [&_*]:!fill-white"
                    : "bg-slate-50 border border-slate-100 text-slate-800 rounded-3xl rounded-tl-sm px-5 py-4 max-w-[85%] text-[15px] leading-relaxed shadow-sm group relative [&_*]:!text-slate-800 [&_*]:!fill-slate-800"
                  }
                >
                  <div className="leading-relaxed whitespace-pre-wrap">
                    <div className={msg.role === "ai" ? "text-slate-800" : "text-white"}>
                      {msg.role === "ai" && idx === chatHistory.length - 1 && !isChatLoading && !msg.isAnimated ? (
                        <TypewriterText 
                          text={msg.text} 
                          variant="chat" 
                          onComplete={() => {
                            if (onMessageAnimationComplete) {
                              onMessageAnimationComplete(idx);
                            }
                          }}
                        />
                      ) : (
                        <MarkdownRenderer text={msg.text} variant="chat" theme="light" />
                      )}
                    </div>
 
                    {/* Message actions bar for AI responses */}
                    {msg.role === "ai" && (
                      <div className="flex items-center space-x-3 mt-4 pt-3 border-t border-slate-200/60 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopy(msg.text); }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600 bg-transparent border-none"
                          title="Copy response"
                          aria-label="Copy response"
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRetry(); }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600 bg-transparent border-none"
                          title="Regenerate"
                          aria-label="Regenerate response"
                        >
                          <RotateCcw size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600 bg-transparent border-none"
                          title="Thumbs up"
                          aria-label="Thumbs up"
                        >
                          <ThumbsUp size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600 bg-transparent border-none"
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
                            className="px-3 py-1.5 bg-white hover:bg-[#6949a8]/5 text-slate-600 hover:text-[#6949a8] border border-slate-200 hover:border-[#6949a8]/30 rounded-full text-xs font-semibold transition-all duration-150 active:scale-95 cursor-pointer shadow-sm"
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
              <div className="flex w-full justify-start animate-pulse bg-white">
                <div className="bg-white text-gray-800 p-5 rounded-3xl rounded-tl-sm border border-gray-100 shadow-sm flex items-center space-x-2">
                  <span className="font-semibold text-xs text-gray-400">Thinking</span>
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-[#6949a8] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-[#6949a8] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-[#6949a8] rounded-full animate-bounce"></div>
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
                  className="flex w-full justify-start bg-white"
                >
                  <div className="bg-red-50 text-red-700 p-4 rounded-[15px] border border-red-200 shadow-sm flex flex-col space-y-2 max-w-[85%] text-xs font-semibold">
                    <span>⚠️ {chatError}</span>
                    <button
                      onClick={handleRetry}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 border-none transition-all duration-150 w-max active:scale-95 cursor-pointer"
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
      <div className="p-4 bg-white border-t border-gray-100 shrink-0">
        {/* Highlight Selection Chip */}
        <AnimatePresence>
          {selectedText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              className="p-3 mb-3 bg-[#6949a8]/5 border border-[#6949a8]/20 rounded-2xl flex items-center justify-between text-xs"
            >
              <div className="truncate flex-1 pr-2">
                <span className="font-bold text-[#6949a8]">Selected text: </span>
                <span className="text-gray-500 italic">&ldquo;{selectedText}&rdquo;</span>
              </div>
              <button
                onClick={() => {
                  onSend(`Regarding this segment: "${selectedText}". Can you explain this concept in more detail?`);
                  onClearSelectedText();
                  window.getSelection()?.removeAllRanges();
                }}
                className="px-3 py-1.5 bg-[#6949a8] text-white rounded-xl font-bold border-none hover:bg-[#6949a8]/90 transition-all shrink-0 active:scale-95 cursor-pointer shadow-sm"
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
              onClick={() => {
                if (isLimitReached) {
                  console.log("Trigger Paywall: Chat Limit");
                  return;
                }
                onSend(chip.text);
              }}
              className="flex items-center space-x-1.5 h-11 px-4 bg-gray-50 border border-gray-200 rounded-full text-[11px] font-bold text-gray-600 hover:bg-[#6949a8]/10 hover:text-[#6949a8] hover:border-[#6949a8] transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {chip.icon} <span>{chip.text}</span>
            </button>
          ))}
        </div>
 
        {/* Warning subtext */}
        {planType === 'free' && user?.agent_message_count !== undefined && user.agent_message_count >= 12 && user.agent_message_count < 15 && (
          <div className="text-[11px] font-bold text-amber-600 mb-2 pl-2">
            Only {15 - user.agent_message_count} free messages remaining today.
          </div>
        )}
 
        {/* Character Count */}
        {!isLimitReached && chatInput.length >= 800 && (
          <div className="flex justify-end text-[10px] font-bold text-amber-500 mb-1.5 mr-2">
            {chatInput.length}/1000 characters
          </div>
        )}
 
        {/* Input Bar or Paywall CTA */}
        {isLimitReached ? (
          <button
            onClick={() => {
              console.log("Trigger Paywall: Chat Limit");
            }}
            className="w-full py-4 bg-red-50 border border-red-200 text-red-700 font-bold rounded-2xl text-center text-sm cursor-pointer active:scale-[0.98] transition-all"
          >
            Daily message limit reached. Upgrade to Pro for unlimited chat.
          </button>
        ) : (
          <div className="flex space-x-2 items-end">
            <div className="bg-gray-50 border border-gray-200 p-1.5 pl-5 rounded-3xl flex items-end gap-2 flex-1">
              <textarea
                ref={textareaRef}
                value={chatInput}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={1000}
                placeholder="Ask a question..."
                className="bg-transparent border-none flex-1 outline-none resize-none min-h-[24px] max-h-[120px] py-0.5 overflow-y-auto scrollbar-hide text-sm text-gray-900"
                aria-label="Ask the AI tutor a question"
              />
            </div>
            <button
              onClick={() => onSend()}
              disabled={isChatLoading || !chatInput.trim()}
              className="w-10 h-10 shrink-0 rounded-full bg-[#6949a8] flex items-center justify-center text-white border-none hover:bg-[#6949a8]/90 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        )}
      </div>
 
      <AnimatePresence>
        {showClearModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm pointer-events-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-100 p-6 rounded-[32px] shadow-xl max-w-sm w-full text-left"
            >
              <h3 className="text-lg font-bold text-gray-900 font-poppins">Clear Conversation?</h3>
              <p className="text-xs text-gray-500 mt-2 font-medium leading-relaxed font-poppins">
                Are you sure you want to delete this chat history? This action cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-3 font-poppins">
                <button 
                  onClick={() => setShowClearModal(false)}
                  className="px-4 py-2 border-none bg-transparent hover:bg-gray-50 text-gray-500 rounded-full text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (onClearChat) onClearChat();
                    setShowClearModal(false);
                  }}
                  className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold border-none cursor-pointer shadow-sm active:scale-95"
                >
                  Clear Chat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
 
ChatPanel.displayName = "ChatPanel";
