"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { FileText, MoreVertical, Trash2, Clock, Star, Edit3, Share2, BrainCircuit } from "lucide-react";

interface LessonCardProps {
  id: string;
  filePath: string;
  summary: string;
  createdAt: string;
  flashcardsCount: number;
  quizzesCount: number;
  progress: number;
  studyTime: string;
  onDeleteClick: (id: string) => void;
  highlightText?: string;
  isProcessed?: boolean;
}

export function LessonCard({
  id,
  filePath,
  createdAt,
  progress,
  studyTime,
  onDeleteClick,
  highlightText = "",
  isProcessed = true,
}: LessonCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isGhostLesson = !isProcessed;

  const getCleanTitle = (path: string) => {
    const parts = path.split("_");
    return parts.slice(1).join("_").replace(".pdf", "") || "Study Material";
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
    ? "bg-black/[0.25] border border-dashed border-white/10 backdrop-blur-2xl rounded-2xl p-5 pb-8 relative shadow-xl opacity-70 flex flex-col justify-between h-[200px] w-full select-none"
    : "bg-black/[0.4] border border-white/[0.1] backdrop-blur-2xl rounded-2xl p-5 pb-8 relative shadow-xl transition-all hover:bg-black/[0.6] active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-omnave-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] outline-none flex flex-col justify-between h-[200px] w-full select-none";

  const cardContent = (
    <>
      {/* Top Section: PDF Icon, Title, and Context Menu */}
      <div className="flex items-start justify-between gap-3 w-full">
        <div className="flex items-center gap-3 min-w-0">
          {/* PDF Icon container */}
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0">
            <FileText size={18} />
          </div>
          <div className="min-w-0 flex flex-col leading-tight">
            <span className="text-[10px] font-semibold text-white/40">
              {formatDate(createdAt)}
            </span>
            <h3 
              className={`text-xs sm:text-sm font-bold truncate mt-0.5 ${isGhostLesson ? "text-white/60" : "text-white group-hover:text-omnave-primary transition-colors"}`}
              title={getCleanTitle(filePath)}
            >
              {renderHighlightedTitle(getCleanTitle(filePath), highlightText)}
            </h3>
          </div>
        </div>

        {/* Options Dropdown Menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="w-11 h-11 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center focus:outline-none"
            aria-label="More study options"
            aria-expanded={showMenu}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
 
          {showMenu && (
            <div className="absolute right-0 mt-1 w-40 bg-[#121212]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 z-20 animate-in fade-in slide-in-from-top-1 duration-150">
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

              {/* Delete Button (Now safely tucked inside the menu) */}
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

      {/* Bottom Section: Study Time Metadata */}
      <div className="flex items-center justify-between gap-2">
        {isGhostLesson ? (
          <div className="flex items-center gap-2 text-xs text-white/40 font-semibold animate-pulse">
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>AI is generating lesson...</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-white/50 font-semibold">
            <Clock className="w-3.5 h-3.5 text-white/40" />
            <span>{studyTime}</span>
            <span className="text-white/20 mx-1">·</span>
            <span className="text-white/40">{progress}%</span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          {isGhostLesson && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45 bg-white/5 px-2.5 py-1.5 rounded-full border border-white/10">
              Processing
            </span>
          )}
        </div>
      </div>

      {/* Absolute Bottom-Edge Progress Bar (Hide if generating) */}
      {!isGhostLesson && (
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5" role="progressbar">
          <div 
            className="h-full bg-omnave-primary rounded-r-full transition-all duration-500"
            style={{ width: `${progress}%` }} 
          />
        </div>
      )}
    </>
  );

  if (isGhostLesson) {
    return (
      <div className={cardClasses} aria-label={`Processing study kit: ${getCleanTitle(filePath)}`} aria-disabled="true">
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      href={`/lesson/${id}`}
      className={cardClasses}
      aria-label={`Open study kit: ${getCleanTitle(filePath)}`}
    >
      {cardContent}
    </Link>
  );
}