"use client";

import React, { useState, useRef, useEffect, memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export const LessonCard = memo(function LessonCard({
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
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handlePrefetch = () => {
    router.prefetch(`/lesson/${id}`);
  };
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
    ? `relative flex flex-col p-4 pb-5 bg-[#111111]/40 border border-dashed border-white/10 rounded-2xl opacity-70 w-full select-none min-h-[140px] ${showMenu ? 'z-50' : 'z-10'}`
    : `relative flex flex-col p-4 pb-5 rounded-2xl select-none group w-full min-h-[140px] ${showMenu ? 'z-50' : 'z-10'} bg-[#111111] border border-white/[0.06] border-t-white/[0.12] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-900/10 hover:border-white/[0.15] cursor-pointer`;

  const displayTitle = ai_title || (isGhostLesson ? "Analyzing topic..." : getCleanTitle(filename));

  const cardContent = (
    <>
      {/* Top Row: Icon & Action Menu */}
      <div className="flex justify-between items-start w-full mb-3">
        <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-500 flex items-center justify-center">
          <FileText className="w-5 h-5 text-zinc-500" />
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
              className="text-zinc-500 hover:text-zinc-300 transition-colors -mt-1 -mr-2 p-2 focus:outline-none"
              aria-label="More study options"
              aria-expanded={showMenu}
            >
              <MoreVertical className="w-4 h-4 text-zinc-500" />
            </button>
          )}

          {showMenu && (
            <div className="absolute right-0 top-10 w-40 bg-[#1A1528] border border-white/10 rounded-xl shadow-xl py-1 z-20 backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150">
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
                className="w-full text-left px-3 py-3 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 transition-colors min-h-[44px]"
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
          className={`text-[14px] font-semibold text-white leading-snug line-clamp-2 text-left`} 
          title={displayTitle}
        >
          {renderHighlightedTitle(displayTitle, highlightText)}
        </h3>
        <p className="text-xs text-zinc-500 truncate mt-1 flex items-center gap-1.5 text-left" title={filename}>
          <FileText className="w-3.5 h-3.5 shrink-0 text-zinc-500" /> 
          {filename}
        </p>
      </div>

      {/* Meta Row (Anchored at bottom) */}
      <div className="mt-auto pb-1 text-left">
        {isGhostLesson ? (
          <p className="text-xs text-zinc-500 font-medium tracking-wide animate-pulse">
            Generating study kit...
          </p>
        ) : (
          <p className="text-xs text-zinc-500 font-medium tracking-wide">
            {flashcardsCount} {flashcardsCount === 1 ? "Card" : "Cards"} • {quizzesCount} {quizzesCount === 1 ? "Quiz" : "Quizzes"}
          </p>
        )}
      </div>

      {/* Progress Bar (Absolute to OUTER container) */}
      {!isGhostLesson && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 pointer-events-none">
          <div 
            className="h-full w-full bg-gradient-to-r from-purple-600 to-omnave-primary transition-transform duration-500 transform-gpu origin-left" 
            style={{ transform: `scaleX(${progress / 100})` }}
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
      onMouseEnter={handlePrefetch}
      onTouchStart={handlePrefetch}
    >
      {cardContent}
    </Link>
  );
});