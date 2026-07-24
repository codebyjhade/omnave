"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, FileText, ChevronRight } from "lucide-react";
import { useUserContext } from "@/context/UserContext";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const { lessons } = useUserContext();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      timer = setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      if (timer) clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const filteredLessons = query.trim() === ""
    ? lessons.slice(0, 5) // Show top 5 recent lessons by default
    : lessons.filter((lesson) =>
        lesson.title?.toLowerCase().includes(query.toLowerCase()) ||
        lesson.file_path?.toLowerCase().includes(query.toLowerCase())
      );

  const getCleanTitle = (path: string, title?: string) => {
    if (title) return title;
    const base = path.split("/").pop() || "";
    const name = base.replace(/^\d+_/, "");
    return name.replace(".pdf", "") || "Study Material";
  };

  // Determine active lesson based on current route or most recent
  const activeLessonId = pathname?.startsWith("/lesson/")
    ? pathname.split("/").pop()
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] cursor-pointer"
          />

          {/* Modal Container */}
          <div className="fixed inset-x-4 top-[15%] md:top-[20%] z-[100000] flex justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-lg bg-[#111111]/95 border border-white/[0.08] backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl flex flex-col pointer-events-auto relative"
            >
              {/* Input Area */}
              <div className="flex items-center space-x-3 px-5 py-4 border-b border-white/[0.06] relative z-10">
                <Search className="text-zinc-400 shrink-0" size={20} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search your lessons and materials..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent text-white text-lg font-medium outline-none placeholder:text-zinc-500"
                />
                <button
                  onClick={onClose}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label="Close search"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Results Area */}
              <div className="max-h-[320px] overflow-y-auto py-3 relative z-10">
                <div className="px-5 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  {query.trim() === "" ? "Recent Lessons" : "Search Results"}
                </div>

                {filteredLessons.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-xs">
                    No study materials found for &ldquo;{query}&rdquo;
                  </div>
                ) : (
                  filteredLessons.map((lesson, idx) => {
                    const displayTitle = getCleanTitle(lesson.file_path, lesson.title);
                    
                    // Determine if this row is currently the active study context
                    const isActive = activeLessonId 
                      ? lesson.id === activeLessonId 
                      : idx === 0;

                    return (
                      <Link
                        key={lesson.id}
                        href={`/lesson/${lesson.id}`}
                        onClick={onClose}
                        className={`flex items-center justify-between py-3.5 border-l-[2px] transition-colors group cursor-pointer w-full text-left hover:bg-white/[0.04] active:bg-white/[0.06] ${
                          isActive 
                            ? "pl-[18px] border-[#a855f7]" 
                            : "pl-5 border-transparent"
                        }`}
                      >
                        <div className="flex items-center space-x-3.5 min-w-0 flex-1 mr-4">
                          <FileText size={16} className="text-[#a855f7] shrink-0" />
                          <span className={`text-sm truncate transition-colors ${
                            isActive 
                              ? "text-white font-semibold" 
                              : "text-zinc-300 font-medium group-hover:text-white"
                          }`}>
                            {displayTitle}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 shrink-0">
                          {lesson.is_processed ? (
                            <span className={`text-[10px] tracking-widest px-2 py-0.5 rounded-full uppercase shrink-0 ${
                              isActive 
                                ? "text-[#a855f7] bg-[#a855f7]/20 font-semibold border border-[#a855f7]/20" 
                                : "text-[#a855f7] bg-[#a855f7]/10 border border-[#a855f7]/10"
                            }`}>
                              {isActive ? "Resume" : "Processed"}
                            </span>
                          ) : (
                            <span className={`text-[10px] tracking-widest px-2 py-0.5 rounded-full uppercase shrink-0 ${
                              isActive
                                ? "text-zinc-300 bg-zinc-300/20 font-semibold border border-zinc-300/20"
                                : "text-zinc-500 bg-zinc-500/10 border border-zinc-500/10"
                            }`}>
                              Processing
                            </span>
                          )}
                          <ChevronRight
                            size={14}
                            className="text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0"
                          />
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-white/[0.06] bg-black/20 text-xs text-zinc-500 flex justify-between items-center relative z-10 select-none">
                <span>Search through your study vault</span>
                <span className="flex items-center gap-1">
                  <span className="bg-white/[0.05] border border-white/[0.1] rounded text-[10px] px-1.5 py-0.5 text-zinc-400 font-mono">ESC</span> to close
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
