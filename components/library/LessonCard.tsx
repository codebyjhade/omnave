"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { FileText, MoreVertical, Trash2, Clock, Star, Edit3, Share2, BrainCircuit } from "lucide-react";

interface LessonCardProps {
  id: string;
  filename: string;
  ai_title?: string | null;
  createdAt: string;
  flashcardsCount: number;
  quizzesCount: number;
  progress: number;
  onDeleteClick: (id: string) => void;
  highlightText?: string;
  isProcessed?: boolean;
}

export function LessonCard({
  id,
  filename,
  ai_title,
  createdAt,
  flashcardsCount,
  quizzesCount,
  progress,
  onDeleteClick,
  highlightText = "",
  isProcessed = true,
}: LessonCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isGhostLesson = !isProcessed;

  const getCleanTitle = (name: string) => {
    // Strip timestamp or leading index if present (e.g. 1715202600_Lesson_9 -> Lesson_9)
    const parts = name.split("_");
    if (parts.length > 1 && /^\d+$/.test(parts[0])) {
      return parts.slice(1).join("_").replace(".pdf", "") || "Study Material";
    }
    return name.replace(".pdf", "") || "Study Material";
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, { 
        month: "short", 
        day: "numeric", 
        year: "numeric" 
      });
    } catch {
      return "Recently";
    }
  };

  const renderHighlightedTitle = (title: string, highlight: string) => {
    if (!highlight.trim()) return <span>{title}</span>;
    const regex = new RegExp(`(${highlight.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")})`, "gi");
    const parts = title.split(regex);
    return (
      <span>
        {parts.map((part, index) => 
          regex.test(part) ? (
            <mark key={index} className="bg-omnave-primary/20 text-omnave-primary font-extrabold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showMenu]);

  const cardClasses = isGhostLesson
    ? "relative flex flex-col p-4 pb-5 bg-[#130E24]/30 border border-dashed border-white/10 backdrop-blur-sm rounded-2xl overflow-hidden opacity-70 w-full select-none min-h-[140px]"
    : "relative flex flex-col p-4 pb-5 bg-[#130E24]/60 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden hover:bg-white/[0.02] transition-all duration-200 active:scale-[0.97] cursor-pointer select-none group w-full min-h-[140px]";

  const displayTitle = ai_title || (isGhostLesson ? "Analyzing topic..." : getCleanTitle(filename));

  const cardContent = (
    <>
      {/* Top Row: Icon & Action Menu */}
      <div className="flex justify-between items-start w-full mb-3">
        <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-omnave-primary/10 border border-omnave-primary/20 text-omnave-primary flex items-center justify-center">
          <FileText className="w-5 h-5" />
        </div>
        <div className="relative shrink-0 flex items-center" ref={menuRef}>
          {isGhostLesson ? (
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 bg-white/5 px-2.5 py-1 rounded-md border border-white/10 shrink-0">
              Processing
            </span>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="text-white/40 hover:text-white transition-colors -mt-1 -mr-2 p-2 focus:outline-none"
              aria-label="More study options"
              aria-expanded={showMenu}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}

          {showMenu && (
            <div className="absolute right-0 top-10 w-40 bg-[#121212]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 z-20 animate-in fade-in slide-in-from-top-1 duration-150">
              {/* Rename */}
              <button
                disabled
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className="w-full text-left px-3 py-3 text-xs font-semibold text-white/45 flex items-center gap-2 cursor-not-allowed hover:bg-white/[0.01] min-h-[44px]"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Rename (Soon)
              </button>

              {/* Favorite */}
              <button
                disabled
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className="w-full text-left px-3 py-3 text-xs font-semibold text-white/45 flex items-center gap-2 cursor-not-allowed hover:bg-white/[0.01] min-h-[44px]"
              >
                <Star className="w-3.5 h-3.5" />
                Favorite (Soon)
              </button>

              {/* Share */}
              <button
                disabled
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className="w-full text-left px-3 py-3 text-xs font-semibold text-white/45 flex items-center gap-2 cursor-not-allowed hover:bg-white/[0.01] min-h-[44px]"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share (Soon)
              </button>

              <div className="border-t border-white/5 my-1" />

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMenu(false);
                  onDeleteClick(id);
                }}
                className="w-full text-left px-3 py-3 text-xs font-bold text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors min-h-[44px]"
                aria-label="Delete this study kit"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Lesson
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Text Group (Pushes bottom content down) */}
      <div className="flex flex-col flex-1 mt-3 mb-4 min-w-0">
        <h3 
          className={`text-[14px] font-bold text-white leading-snug line-clamp-2 text-left ${isGhostLesson ? "text-white/60" : "text-white group-hover:text-omnave-primary transition-colors"}`} 
          title={displayTitle}
        >
          {renderHighlightedTitle(displayTitle, highlightText)}
        </h3>
        <p className="text-[12px] text-white/40 truncate mt-1 flex items-center gap-1.5 text-left" title={filename}>
          <FileText className="w-3.5 h-3.5 shrink-0 text-white/40" /> 
          {filename}
        </p>
      </div>

      {/* Meta Row (Anchored at bottom) */}
      <div className="mt-auto pb-1 text-left">
        {isGhostLesson ? (
          <p className="text-[11px] text-white/40 font-medium tracking-wide animate-pulse">
            Generating study kit...
          </p>
        ) : (
          <p className="text-[11px] text-white/40 font-medium tracking-wide">
            {flashcardsCount} {flashcardsCount === 1 ? "Card" : "Cards"} • {quizzesCount} {quizzesCount === 1 ? "Quiz" : "Quizzes"}
          </p>
        )}
      </div>

      {/* Progress Bar (Absolute to OUTER container) */}
      {!isGhostLesson && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/5 pointer-events-none">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 to-omnave-primary transition-all duration-500" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </>
  );

  if (isGhostLesson) {
    return (
      <div className={cardClasses} aria-label={`Processing study kit: ${getCleanTitle(filename)}`} aria-disabled="true">
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      href={`/lesson/${id}`}
      className={cardClasses}
      aria-label={`Open study kit: ${getCleanTitle(filename)}`}
    >
      {cardContent}
    </Link>
  );
}