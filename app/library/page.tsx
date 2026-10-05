"use client";

import { useUserContext } from "@/context/UserContext";
import { 
  FileText, 
  Search, 
  Plus, 
  SlidersHorizontal,
  ChevronRight,
  MoreVertical,
  Play
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { DeleteLessonDialog } from "@/components/library/DeleteLessonDialog";
import { calculateKitProgress } from "@/hooks/useProgressStats";
import { useToast } from "@/components/ToastProvider";
import StaggerContainer from "@/components/ui/animation/StaggerContainer";
import StaggerItem from "@/components/ui/animation/StaggerItem";

import { Skeleton } from "@/components/Skeleton";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { getCachedLessonIds } from "@/lib/offlineStorage";

export default function LibraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const isOnline = useNetworkStatus();
  
  const { 
    lessons: notes, 
    quizScores, 
    loading,
    refreshUser
  } = useUserContext();

  const [activeFilterState, setActiveFilter] = useState<"all" | "recent" | "ready">("all");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cachedLessonIds, setCachedLessonIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    getCachedLessonIds().then((ids) => {
      if (active) setCachedLessonIds(ids);
    });
    return () => { active = false; };
  }, [notes]);

  // Sync Search state with URL query parameter
  const searchTerm = searchParams.get('q') || '';
  const activeSort = searchParams.get('sort') || 'newest';

  const getNoteProgress = useMemo(() => {
    return (note: any) => calculateKitProgress(note, quizScores);
  }, [quizScores]);

  const getNoteRawFilename = (path?: string | null) => {
    if (!path) return "Study Material.pdf";
    const base = path.split("/").pop() || "";
    return base.replace(/^\d+_/, "") || "Study Material.pdf";
  };

  const getNoteStudyTime = (summary: string) => {
    if (!summary) return "5 min read";
    const wordCount = summary.split(/\s+/).length;
    const readingTime = Math.max(3, Math.ceil(wordCount / 180));
    return `${readingTime} min read`;
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      const response = await fetch("/api/process-material/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId: deleteTargetId }),
      });
      if (!response.ok) throw new Error("Delete failed");
      toast("Study Kit deleted successfully", "success");
      await refreshUser();
    } catch (err) {
      console.error(err);
      toast("Error deleting Study Kit", "error");
    } finally {
      setIsDeleting(false);
      setDeleteTargetId(null);
    }
  };

  const getCleanTitle = (path: string) => {
    const parts = path.split("_");
    return parts.slice(1).join("_").replace(".pdf", "") || "Study Material";
  };

  // 1. FILTERING
  const visibleNotes = useMemo(() => {
    if (!notes) return [];

    let filtered = [...notes];

    // If search active
    if (searchTerm.trim() !== "") {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((note) => {
        const titleMatch = (note.title || "").toLowerCase().includes(lower);
        const fileMatch = (note.file_path || "").toLowerCase().includes(lower);
        return titleMatch || fileMatch;
      });
    }

    // Horizontal filters
    if (activeFilterState === "recent") {
      filtered = filtered.sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    } else if (activeFilterState === "ready") {
      filtered = filtered.filter((n) => n.is_processed !== false);
    }

    // Sort order from global header parameter
    if (activeSort === "newest") {
      filtered = filtered.sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    } else if (activeSort === "oldest") {
      filtered = filtered.sort(
        (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      );
    } else if (activeSort === "a-z") {
      filtered = filtered.sort((a, b) => {
        const titleA = (a.title || getCleanTitle(a.file_path)).toLowerCase();
        const titleB = (b.title || getCleanTitle(b.file_path)).toLowerCase();
        return titleA.localeCompare(titleB);
      });
    } else if (activeSort === "progress") {
      filtered = filtered.sort((a, b) => getNoteProgress(b) - getNoteProgress(a));
    }

    return filtered;
  }, [notes, searchTerm, activeFilterState, activeSort, getNoteProgress]);

  const continueLearningNote = useMemo(() => {
    if (!notes || notes.length === 0) return null;
    return [...notes]
      .filter((note) => note.is_processed !== false)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];
  }, [notes]);

  const browseNotes = useMemo(() => {
    if (activeFilterState === 'all' && !searchTerm && continueLearningNote) {
      return visibleNotes.filter((note) => note.id !== continueLearningNote.id);
    }
    return visibleNotes;
  }, [activeFilterState, searchTerm, continueLearningNote, visibleNotes]);

  if (loading) {
    return (
      <div className="w-full flex-1 flex flex-col gap-[20px]" aria-hidden="true">
        {/* Horizontal Filter Pills Skeleton */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
          <Skeleton className="w-16 h-8 rounded-full" />
          <Skeleton className="w-20 h-8 rounded-full" />
          <Skeleton className="w-20 h-8 rounded-full" />
        </div>

        {/* Continue Learning Section Skeleton */}
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-5 w-36 rounded-md text-left" />
          <div className="w-full bg-white rounded-[20px] p-5 shadow-[0px_10px_10px_rgba(0,0,0,0.09)] border border-gray-100 flex flex-col gap-4">
            <div className="flex items-center gap-3.5">
              <Skeleton className="w-14 h-14 rounded-full shrink-0" />
              <div className="flex flex-col gap-2 flex-1 text-left">
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <Skeleton className="h-3.5 w-1/3 rounded-md" />
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <Skeleton className="h-3 w-24 rounded-md" />
              <Skeleton className="w-full h-1.5 rounded-full" />
            </div>
          </div>
        </div>

        {/* All Study Kits Section Skeleton */}
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-28 rounded-md text-left" />
          <div className="flex flex-col gap-3 w-full">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-[15px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] border-none flex flex-row items-center p-4"
              >
                <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
                <div className="flex-1 flex flex-col gap-2 ml-4 mr-2 text-left">
                  <Skeleton className="h-4 w-1/2 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <Skeleton className="w-full h-1 rounded-full mt-1" />
                </div>
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col gap-[20px]">
      <StaggerContainer staggerChildren={0.06} className="w-full flex flex-col gap-6">
        {visibleNotes.length === 0 ? (
          <StaggerItem className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-4">
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
              disabled={!isOnline}
              className="mt-2 bg-[#6949a8] text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-sm hover:bg-[#563b8c] active:scale-95 transition-all border-none cursor-pointer font-poppins disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
            >
              {isOnline ? "Upload PDF" : "Upload Unavailable Offline"}
            </button>
          </StaggerItem>
        ) : (
          <>
            {/* Horizontal Filter Pills */}
            <StaggerItem className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
              {(["all", "recent", "ready"] as const).map((filter) => {
                const isActive = activeFilterState === filter;
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
            </StaggerItem>

            {/* Continue Learning Section */}
            {continueLearningNote && activeFilterState === "all" && !searchTerm && (
              <StaggerItem className="flex flex-col gap-2.5">
                <h2 className="text-[16px] font-bold text-gray-800 font-poppins m-0 text-left">
                  Continue Learning
                </h2>
                <Link className="block w-full outline-none" href={`/lesson/${continueLearningNote.id}`} prefetch={true}>
                  <div 
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
                </Link>
              </StaggerItem>
            )}

            {/* All Study Kits Section */}
            <div className="flex flex-col gap-3">
              {browseNotes.length > 0 && (
                <h2 className="text-[16px] font-bold text-gray-800 font-poppins m-0 text-left">
                  {continueLearningNote && activeFilterState === 'all' && !searchTerm ? 'More Study Kits' : 'All Study Kits'}
                </h2>
              )}
              
              {browseNotes.length === 0 ? (
                continueLearningNote && activeFilterState === 'all' && !searchTerm ? null : (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-[32px] bg-gray-50/50">
                  <p className="text-sm font-semibold text-gray-500 font-poppins">No study materials found.</p>
                  {(searchTerm || activeFilterState !== "all") && (
                    <button 
                      onClick={() => { router.replace('/library'); setActiveFilter("all"); }} 
                      className="mt-3 text-xs font-bold text-[#6949a8] bg-transparent border-none cursor-pointer hover:underline font-poppins"
                    >
                      Clear search and filters
                    </button>
                  )}
                </div>
                )
              ) : (
                <div className="flex flex-col gap-3 w-full">
                  {browseNotes.map((note) => {
                    const cleanTitle = note.is_processed && note.title ? note.title : getCleanTitle(note.file_path);
                    const progress = getNoteProgress(note);
                    const flashcardsCount = Array.isArray(note.flashcards) ? note.flashcards.length : 0;
                    return (
                      <Link key={note.id} className="block w-full outline-none" href={`/lesson/${note.id}`} prefetch={true}>
                        <StaggerItem 
                          className="bg-white rounded-[20px] shadow-[0px_10px_20px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-row items-center p-4 cursor-pointer hover:bg-gray-50/50 hover:border-gray-200 transition-colors relative"
                        >
                          {/* Left: Document/PDF Icon with dynamic color highlight */}
                          <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 transition-colors shadow-inner border border-white ${
                            progress > 0 
                              ? "bg-gradient-to-br from-[#6949a8]/10 to-[#86d1ff]/20 text-[#6949a8]" 
                              : "bg-gray-50 text-gray-500"
                          }`}>
                            <FileText size={20} strokeWidth={1.5} />
                          </div>

                          {/* Middle: Text Container (Flex-1) */}
                          <div className="flex-1 flex flex-col min-w-0 ml-4 mr-2 text-left">
                            <h3 className="text-[15px] font-bold text-gray-900 truncate font-poppins leading-tight pr-2">
                              {cleanTitle}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {note.is_processed !== false ? (
                                <>
                                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-poppins">
                                    Ready
                                  </span>
                                  {flashcardsCount > 0 && (
                                    <span className="text-[10px] text-gray-500 font-medium font-poppins px-1.5 py-0.5 bg-gray-100 rounded-md">
                                      {flashcardsCount} Cards
                                    </span>
                                  )}
                                  {Array.isArray(note.quizzes) && note.quizzes.length > 0 && (
                                    <span className="text-[10px] text-gray-500 font-medium font-poppins px-1.5 py-0.5 bg-gray-100 rounded-md">
                                      {note.quizzes.length} Quizzes
                                    </span>
                                  )}
                                  {cachedLessonIds.has(note.id) ? <span className="text-[10px] text-[#6949a8] font-bold font-poppins px-1.5 py-0.5 bg-[#6949a8]/5 rounded-md flex items-center gap-1">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                    Offline
                                  </span> : <span className="text-[10px] text-amber-700 font-semibold font-poppins px-1.5 py-0.5 bg-amber-50 rounded-md">Online only</span>}
                                </>
                              ) : (
                                <span className="text-[11px] font-semibold text-[#6949a8] bg-purple-50 px-2 py-0.5 rounded-md font-poppins animate-pulse">
                                  Processing...
                                </span>
                              )}
                            </div>

                            {/* Reintegrated Sleek Progress Indicator */}
                            <div className="w-full flex items-center gap-2 mt-2.5">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0 shadow-inner">
                                <div 
                                  className="h-full bg-gradient-to-r from-[#6949a8] to-[#86d1ff] rounded-full transition-all duration-350"
                                  style={{ width: `${Math.max(5, progress)}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-gray-400 font-poppins w-6 text-right">
                                {progress}%
                              </span>
                            </div>
                          </div>

                          {/* Right: 3-dot vertical menu */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeleteTargetId(note.id);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200 bg-transparent cursor-pointer z-20 shrink-0"
                            title="Delete study kit"
                          >
                            <MoreVertical size={18} />
                          </button>
                        </StaggerItem>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </StaggerContainer>
      <DeleteLessonDialog isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)} onConfirm={handleDeleteConfirm} isDeleting={isDeleting} />
    </div>
  );
}
