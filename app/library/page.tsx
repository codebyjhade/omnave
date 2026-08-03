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
import { useState, useMemo, useEffect } from "react";
import { DeleteLessonDialog } from "@/components/library/DeleteLessonDialog";
import { calculateKitProgress } from "@/hooks/useProgressStats";
import { useToast } from "@/components/ToastProvider";
import StaggerContainer from "@/components/ui/animation/StaggerContainer";
import StaggerItem from "@/components/ui/animation/StaggerItem";

export default function LibraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const { 
    lessons: notes, 
    quizScores, 
    loading,
    refreshUser
  } = useUserContext();

  const [activeFilterState, setActiveFilter] = useState<"all" | "recent" | "ready">("all");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  if (loading) {
    return (
      <div className="flex-1 w-full flex items-center justify-center min-h-[300px]">
        <div className="animate-spin w-8 h-8 border-4 border-[#6949a8] border-t-transparent rounded-full" />
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
              className="mt-2 bg-[#6949a8] text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-sm hover:bg-[#563b8c] active:scale-95 transition-all border-none cursor-pointer font-poppins"
            >
              Upload PDF
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
              </StaggerItem>
            )}

            {/* All Study Kits Section */}
            <div className="flex flex-col gap-3">
              {visibleNotes.length > 0 && (
                <h2 className="text-[16px] font-bold text-gray-800 font-poppins m-0 text-left">
                  All Study Kits
                </h2>
              )}
              
              {visibleNotes.length === 0 ? (
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
              ) : (
                <div className="flex flex-col gap-3 w-full">
                  {visibleNotes.map((note) => {
                    const cleanTitle = note.is_processed && note.title ? note.title : getCleanTitle(note.file_path);
                    const progress = getNoteProgress(note);
                    const flashcardsCount = Array.isArray(note.flashcards) ? note.flashcards.length : 0;
                    return (
                      <StaggerItem 
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
                        <div className="flex-1 flex flex-col min-w-0 ml-4 mr-2 text-left">
                          <h3 className="text-sm font-bold text-gray-800 truncate font-poppins leading-tight">
                            {cleanTitle}
                          </h3>
                          <span className="text-[10px] text-gray-400 font-medium font-poppins mt-0.5">
                            {flashcardsCount > 0 ? `${flashcardsCount} flashcards` : "Generating..."}
                          </span>

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
                      </StaggerItem>
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
