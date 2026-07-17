"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, FileText, ChevronRight } from "lucide-react";
import { useUserContext } from "@/context/UserContext";
import Link from "next/link";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const { lessons } = useUserContext();
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
              className="w-full max-w-lg bg-[#140F26]/95 border border-white/10 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.6)] flex flex-col pointer-events-auto relative"
            >
              {/* Inner ambient glow */}
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-omnave-primary/20 blur-[80px] pointer-events-none" />

              {/* Input Area */}
              <div className="flex items-center space-x-3 px-5 py-4 border-b border-white/5 relative z-10">
                <Search className="text-white/40 shrink-0" size={20} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search your lessons and materials..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent text-white text-sm outline-none placeholder:text-white/30"
                />
                <button
                  onClick={onClose}
                  className="p-1 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label="Close search"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Results Area */}
              <div className="max-h-[320px] overflow-y-auto p-3 space-y-1 relative z-10">
                <div className="px-3 py-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                  {query.trim() === "" ? "Recent Lessons" : "Search Results"}
                </div>

                {filteredLessons.length === 0 ? (
                  <div className="text-center py-8 text-white/40 text-xs">
                    No study materials found for &ldquo;{query}&rdquo;
                  </div>
                ) : (
                  filteredLessons.map((lesson) => {
                    const displayTitle = getCleanTitle(lesson.file_path, lesson.title);
                    return (
                      <Link
                        key={lesson.id}
                        href={`/lesson/${lesson.id}`}
                        onClick={onClose}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.01] hover:bg-white/[0.05] border border-transparent hover:border-white/5 transition-all duration-150 group cursor-pointer"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-omnave-primary shrink-0">
                            <FileText size={16} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-white truncate group-hover:text-omnave-primary transition-colors">
                              {displayTitle}
                            </span>
                            <span className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">
                              {lesson.is_processed ? "Processed" : "Processing"}
                            </span>
                          </div>
                        </div>
                        <ChevronRight
                          size={14}
                          className="text-white/20 group-hover:text-white/60 transition-colors shrink-0"
                        />
                      </Link>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-white/5 bg-black/20 text-[10px] text-white/40 flex justify-between items-center relative z-10 select-none">
                <span>Search through your study vault</span>
                <span className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[8px]">ESC</span> to close
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
