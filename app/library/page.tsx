"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Search, RefreshCw, Play, FileText, MoreVertical } from "lucide-react";
import { useLessons } from "@/hooks/useLessons";
import { useProgress } from "@/hooks/useProgress";
import { calculateKitProgress } from "@/hooks/useProgressStats";
import dynamic from "next/dynamic";
import { useToast } from "@/components/ToastProvider";
import { useUploadContext } from "@/context/UploadContext";
import { useRouter } from "next/navigation";

const DeleteLessonDialog = dynamic(
  () => import("@/components/library/DeleteLessonDialog").then((mod) => mod.DeleteLessonDialog),
  { ssr: false }
);

export default function LibraryPage() {
  const router = useRouter();
  const { lessons: notes, loading, refreshLessons, deleteLesson } = useLessons();
  const { quizScores } = useProgress();
  const { toast } = useToast();
  const { activeQueue } = useUploadContext();

  const [localNotes, setLocalNotes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "recent" | "ready">("all");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshLessons();
      toast("Library synced successfully", "success");
    } catch (err) {
      toast("Failed to sync library", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (notes) {
      setLocalNotes(notes);
    }
  }, [notes]);

  const visibleNotes = useMemo(() => {
    return localNotes.filter((note) => {
      if (note.is_processed === false && !activeQueue.includes(note.id)) {
        return false;
      }
      return true;
    });
  }, [localNotes, activeQueue]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const getNoteProgress = useCallback((note: any) => {
    return calculateKitProgress(note, quizScores);
  }, [quizScores]);

  const getNoteStudyTime = useCallback((summaryText: string) => {
    if (!summaryText) return "5 mins";
    const wordCount = summaryText.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); 
    return `${readingTime + 4} mins remaining`;
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);

    const target = localNotes.find((note) => note.id === deleteTargetId);
    if (!target) {
      setDeleteTargetId(null);
      setIsDeleting(false);
      return;
    }

    setLocalNotes((prev) => prev.filter((note) => note.id !== deleteTargetId));
    setDeleteTargetId(null);

    try {
      await deleteLesson(target.id);
      toast("Study kit deleted successfully", "success");
    } catch (err) {
      console.error("Failed to delete lesson:", err);
      toast("Failed to delete the study lesson. Please try again.", "error");
      setLocalNotes(notes);
    } finally {
      setIsDeleting(false);
    }
  };

  const getCleanTitle = (path: string) => {
    const parts = path.split("_");
    return parts.slice(1).join("_").replace(".pdf", "") || "Study Material";
  };

  const getNoteRawFilename = (path: string) => {
    const base = path.split("/").pop() || "";
    return base.replace(/^\d+_/, "") || "document.pdf";
  };

  const filteredNotes = useMemo(() => {
    return visibleNotes.filter((note) => {
      const cleanTitle = getCleanTitle(note.file_path).toLowerCase();
      const subject = cleanTitle.split(/[\s\-_]+/)[0] || "";
      const matchesSearch = cleanTitle.includes(debouncedSearchTerm.toLowerCase()) || subject.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      if (!matchesSearch) return false;

      const progress = getNoteProgress(note);
      switch (activeFilter) {
        case "recent":
          return true;
        case "ready":
          return note.is_processed !== false;
        default:
          return true;
      }
    });
  }, [visibleNotes, debouncedSearchTerm, activeFilter, getNoteProgress]);

  const continueLearningNote = useMemo(() => {
    if (!notes || notes.length === 0) return null;
    return [...notes]
      .filter((note) => note.is_processed !== false)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];
  }, [notes]);

  if (loading) {
    return (
      <main className="w-full h-[100dvh] flex flex-col bg-[#6949a8] overflow-hidden relative touch-none">
        <div className="absolute inset-0 top-[140px] z-10 bg-white rounded-t-[40px] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#6949a8] border-t-transparent rounded-full" />
        </div>
      </main>
    );
  }

  return (
    <main className="w-full h-[100dvh] flex flex-col bg-[#6949a8] overflow-hidden relative touch-none pt-[env(safe-area-inset-top)]">
      {/* 1. FIXED PURPLE HEADER */}
      <header className="w-full bg-[#6949a8] pt-7 pb-23 relative">
        <div className="max-w-5xl mx-auto px-[25px] flex items-center gap-3 relative z-30">
          {/* Pill-shaped white Search Bar */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search study kits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white text-black pl-11 pr-4 py-3 rounded-full text-sm outline-none border-none shadow-[0px_4px_10px_rgba(0,0,0,0.05)] font-poppins"
            />
          </div>
          {/* Circular white Filter Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-11 h-11 bg-white rounded-full flex items-center justify-center shrink-0 border-none cursor-pointer shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:bg-gray-50 active:scale-95 transition-all"
            title="Refresh Library"
          >
            <RefreshCw size={18} className={`text-[#6949a8] ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* 2. THE SCROLLABLE WHITE CANVAS */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-[25px] pt-8 pb-[120px] rounded-t-[40px] flex flex-col gap-[20px] bg-[#FFFFFF] -mt-12 relative z-20 overflow-y-auto">
        {visibleNotes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-[#6949a8]">
              <FileText size={28} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-[#1c1c1c] font-poppins">Your Vault is Empty</h3>
              <p className="text-xs text-gray-400 font-poppins max-w-xs leading-relaxed">
                Upload study materials in the Upload tab, and they will appear here as processed kits.
              </p>
            </div>
            <button 
              onClick={() => router.push("/upload")}
              className="mt-2 bg-[#6949a8] text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-sm hover:bg-[#563b8c] active:scale-95 transition-all border-none cursor-pointer font-poppins"
            >
              Upload PDF
            </button>
          </div>
        ) : (
          <>
            {/* Horizontal Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
              {(["all", "recent", "ready"] as const).map((filter) => {
                const isActive = activeFilter === filter;
                const label = filter === "all" ? "All" : filter === "recent" ? "Recent" : "Ready";
                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide font-poppins transition-colors border-none cursor-pointer shrink-0 ${
                      isActive 
                        ? "bg-[#6949a8] text-white" 
                        : "bg-[#F3F4F6] text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Continue Learning Section */}
            {continueLearningNote && activeFilter === "all" && !searchTerm && (
              <div className="flex flex-col gap-2.5">
                <h2 className="text-[16px] font-bold text-gray-800 font-poppins m-0 text-left">
                  Continue Learning
                </h2>
                <div 
                  onClick={() => router.push(`/lesson/${continueLearningNote.id}`)}
                  className="w-full bg-white rounded-[20px] p-5 shadow-[0px_10px_10px_rgba(0,0,0,0.09)] border border-gray-100 flex flex-col gap-4 cursor-pointer hover:border-gray-200 transition-colors relative font-poppins"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Premium Glow Play Button */}
                      <div className="w-14 h-14 rounded-full bg-[#6949a8] flex items-center justify-center text-white shrink-0 shadow-[0_4px_15px_rgba(105,73,168,0.4)]">
                        <Play size={20} fill="white" className="ml-1" />
                      </div>
                      <div className="flex flex-col min-w-0 text-left">
                        <span className="font-bold text-[16px] text-gray-900 leading-snug line-clamp-2 font-poppins">
                          {continueLearningNote.is_processed ? continueLearningNote.title : getNoteRawFilename(continueLearningNote.file_path)}
                        </span>
                        <span className="text-[11px] text-gray-400 font-poppins mt-1">
                          Ready to study • {getNoteStudyTime(continueLearningNote.summary || "")}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Purple Progress Bar */}
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="flex justify-between items-center text-xs font-medium text-gray-500 font-poppins">
                      <span>{getNoteProgress(continueLearningNote)}% completed</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#6949a8] rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, getNoteProgress(continueLearningNote))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* All Study Kits Section */}
            <div className="flex flex-col gap-3">
              {filteredNotes.length > 0 && (
                <h2 className="text-[16px] font-bold text-gray-800 font-poppins m-0 text-left">
                  All Study Kits
                </h2>
              )}
              
              {filteredNotes.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-[32px] bg-gray-50/50">
                  <p className="text-sm font-semibold text-gray-500 font-poppins">No study materials found.</p>
                  {(searchTerm || activeFilter !== "all") && (
                    <button 
                      onClick={() => { setSearchTerm(""); setActiveFilter("all"); }} 
                      className="mt-3 text-xs font-bold text-[#6949a8] bg-transparent border-none cursor-pointer hover:underline font-poppins"
                    >
                      Clear search and filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3 w-full">
                  {filteredNotes.map((note) => {
                    const cleanTitle = note.is_processed && note.title ? note.title : getCleanTitle(note.file_path);
                    const filename = getNoteRawFilename(note.file_path);
                    const progress = getNoteProgress(note);
                    const flashcardsCount = Array.isArray(note.flashcards) ? note.flashcards.length : 0;
                    return (
                      <div 
                        key={note.id}
                        onClick={() => router.push(`/lesson/${note.id}`)}
                        className="bg-white rounded-[15px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] border-none flex flex-row items-center p-4 cursor-pointer hover:bg-gray-50/50 transition-colors relative"
                      >
                        {/* Left: Document/PDF Icon with dynamic color highlight */}
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          progress > 0 
                            ? "bg-[#6949a8]/10 text-[#6949a8]" 
                            : "bg-gray-50 text-gray-500"
                        }`}>
                          <FileText size={20} strokeWidth={1.5} />
                        </div>

                        {/* Middle: Text Container (Flex-1) */}
                        <div className="flex-1 flex flex-col min-w-0 text-left pl-3.5 pr-2">
                          <h3 className="font-semibold text-[#1c1c1c] text-sm truncate w-full font-poppins block">
                            {cleanTitle}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 min-w-0">
                            {progress === 0 && (
                              <span className="bg-purple-50 text-[#6949a8] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                                READY
                              </span>
                            )}
                            <span className="text-[11px] text-gray-400 font-poppins truncate block flex-1">
                              {progress}% done • {flashcardsCount} cards
                            </span>
                          </div>
                          {/* Reintegrated Sleek Progress Indicator */}
                          <div className="w-full h-1 bg-gray-100 rounded-full mt-2 overflow-hidden shrink-0">
                            <div 
                              className="h-full bg-[#6949a8] rounded-full transition-all duration-350"
                              style={{ width: `${Math.max(5, progress)}%` }}
                            />
                          </div>
                        </div>

                        {/* Right: 3-dot vertical menu */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTargetId(note.id);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-655 rounded-full hover:bg-gray-100 transition-all border-none bg-transparent cursor-pointer z-20 shrink-0"
                          title="Delete study kit"
                        >
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <DeleteLessonDialog isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)} onConfirm={handleDeleteConfirm} isDeleting={isDeleting} />
    </main>
  );
}
