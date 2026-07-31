"use client";
 
import React, { memo, RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageSquare, ChevronRight, Copy, RotateCcw, ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { TypewriterText } from "./TypewriterText";
import { useUserContext } from "@/context/UserContext";
 
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
  const { user } = useUserContext();
  const planType = user?.plan_type || 'free';
  
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
    <div className="bg-white border border-gray-100 rounded-[24px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] overflow-hidden flex flex-col h-auto lg:h-[calc(100vh-140px)] lg:sticky lg:top-[100px] w-full font-poppins text-left">
      {/* Chat Header */}
      <div className="flex items-center space-x-2 px-5 py-4 border-b border-gray-100 bg-gray-50/20 shrink-0">
        <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center">
          <Sparkles size={14} className="text-[#6949a8]" />
        </div>
        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 leading-none">BryanAI</h3>
          <span className="text-[10px] font-bold text-[#6949a8] uppercase tracking-wider mt-1">Online</span>
        </div>
      </div>
 
      {/* Chat History Area */}
      <div ref={scrollRef} className="p-5 flex-1 overflow-y-auto flex flex-col space-y-6 scroll-smooth select-text bg-white">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-8 space-y-5 select-none bg-white">
            <div className="w-12 h-12 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-center text-[#6949a8] shadow-sm">
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
              <ul className="space-y-2 text-xs font-semibold text-gray-600">
                {["Explain this topic", "Give examples", "Make a quiz", "Simplify this paragraph"].map((exampleText, eIdx) => (
                  <li
                    key={eIdx}
                    onClick={() => onInputChange(exampleText)}
                    className="flex items-center space-x-1.5 cursor-pointer hover:text-[#6949a8] transition-colors duration-155"
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
                  className={`
                    p-5 max-w-[85%] text-sm leading-relaxed shadow-sm group relative
                    ${msg.role === "user"
                      ? "bg-[#6949a8] text-white rounded-3xl rounded-tr-sm border border-[#6949a8] shadow-sm"
                      : "bg-white text-gray-800 rounded-3xl rounded-tl-sm border border-gray-100 shadow-sm"
                    }
                  `}
                >
                  <div className="leading-relaxed whitespace-pre-wrap">
                    {msg.role === "ai" && idx === chatHistory.length - 1 && !isChatLoading ? (
                      <TypewriterText text={msg.text} variant="chat" />
                    ) : (
                      <MarkdownRenderer text={msg.text} variant="chat" theme="light" />
                    )}
 
                    {/* Message actions bar for AI responses */}
                    {msg.role === "ai" && (
                      <div className="flex items-center space-x-3 mt-3 pt-2 border-t border-gray-100 opacity-60 group-hover:opacity-100 transition-opacity duration-150">
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
                            className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-[15px] text-[9px] font-bold transition-all duration-150 active:scale-[0.97] cursor-pointer"
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
      <div className="p-4 pb-28 lg:pb-4 bg-white border-t border-gray-100 shrink-0">
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
            <textarea
              value={chatInput}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={1000}
              placeholder="Ask a question..."
              className="flex-1 bg-gray-50 text-gray-900 text-sm rounded-2xl px-5 py-4 h-14 outline-none focus:ring-2 focus:ring-[#6949a8]/30 transition-all duration-150 border border-gray-200 resize-none overflow-y-auto scrollbar-hide"
              aria-label="Ask the AI tutor a question"
            />
            <button
              onClick={() => onSend()}
              disabled={isChatLoading || !chatInput.trim()}
              className="bg-[#6949a8] text-white px-6 h-14 rounded-2xl font-bold border-none hover:bg-[#6949a8]/90 transition-all duration-150 disabled:opacity-50 active:scale-95 shadow-sm flex items-center justify-center shrink-0 cursor-pointer"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
 
ChatPanel.displayName = "ChatPanel";
