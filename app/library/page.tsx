"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { LibraryHeader } from "@/components/library/LibraryHeader";
import { LibrarySearch } from "@/components/library/LibrarySearch";
import { FilterChips, FilterId } from "@/components/library/FilterChips";
import { ContinueLearning } from "@/components/library/ContinueLearning";
import { LessonCard } from "@/components/library/LessonCard";
import { DeleteLessonDialog } from "@/components/library/DeleteLessonDialog";
import { EmptyLibrary } from "@/components/library/EmptyLibrary";
import { LoadingSkeleton } from "@/components/library/LoadingSkeleton";
import { useLessons } from "@/hooks/useLessons";
import { useProgress } from "@/hooks/useProgress";
import { calculateKitProgress } from "@/hooks/useProgressStats";

export default function LibraryPage() {
  const { lessons: notes, loading, refreshLessons } = useLessons();
  const { quizScores } = useProgress();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getNoteProgress = useCallback((note: any) => {
    return calculateKitProgress(note, quizScores);
  }, [quizScores]);

  const stats = useMemo(() => {
    const total = notes.length;
    const ready = notes.filter((note) => note.is_processed !== false).length;
    let avgProgress = 0;
    if (total > 0) {
      const totalProgress = notes.reduce((acc, note) => {
        return acc + getNoteProgress(note);
      }, 0);
      avgProgress = Math.round(totalProgress / total);
    }
    return { total, ready, avgProgress };
  }, [notes, getNoteProgress]);

  const getNoteStudyTime = useCallback((summaryText: string) => {
    if (!summaryText) return "5 mins";
    const wordCount = summaryText.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); 
    return `${readingTime + 4} mins`;
  }, []);

  const handleDeleteLesson = async (material: { id: string; content_url?: string | null }) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this study material?");
    if (!confirmDelete) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
      if (material.content_url) {
        await supabase.storage.from("study_materials").remove([material.content_url]);
      }

      const { error } = await supabase.from("materials").delete().eq("id", material.id);
      if (error) throw error;

      await refreshLessons();
    } catch (err) {
      console.error("Failed to delete lesson:", err);
      alert("Failed to delete the study lesson. Please try again.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      const target = notes.find((note) => note.id === deleteTargetId);
      if (!target) return;
      await handleDeleteLesson(target);
      setDeleteTargetId(null);
    } catch (err) {
      console.error("Failed to delete lesson:", err);
      alert("Failed to delete the study lesson. Please try again.");
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
    return notes.filter((note) => {
      const cleanTitle = getCleanTitle(note.file_path).toLowerCase();
      const subject = cleanTitle.split(/[\s\-_]+/)[0] || "";
      const matchesSearch = cleanTitle.includes(searchTerm.toLowerCase()) || subject.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      const progress = getNoteProgress(note);
      switch (activeFilter) {
        case "recent": return true;
        case "ready": return true;
        case "in-progress": return progress > 0 && progress < 100;
        case "completed": return progress === 100;
        case "favorites": return false;
        default: return true;
      }
    });
  }, [notes, searchTerm, activeFilter, getNoteProgress]);

  const continueLearningNote = useMemo(() => {
    if (notes.length === 0) return null;
    return notes.find((note) => note.is_processed !== false) ?? notes[0];
  }, [notes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-omnave-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
 
      <main className="relative z-10 w-full max-w-[1200px] mx-auto pt-4 pb-40 md:pb-24 lg:px-10 xl:px-12 flex flex-col gap-8 md:gap-12">
        <header className="px-6 md:px-10 lg:px-0">
          <h2 className="text-[10px] font-extrabold tracking-[0.2em] text-neutral-500 uppercase mb-2">Knowledge Vault</h2>
          <div className="flex items-center flex-wrap gap-4">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white">Your Library.</h1>
            <LibraryHeader totalLessons={stats.total} />
          </div>
        </header>

        <div className="flex flex-col w-full animate-in fade-in duration-500 space-y-8 pb-16 px-6 md:px-10 lg:px-0">
          {notes.length === 0 ? (
            <EmptyLibrary onDemoClick={() => alert("Interactive demo triggered")} />
          ) : (
            <>
              <div className="flex flex-col gap-4 w-full">
                <LibrarySearch value={searchTerm} onChange={setSearchTerm} />
                <FilterChips activeFilter={activeFilter} onFilterChange={setActiveFilter} />
              </div>

              {continueLearningNote && activeFilter === "all" && !searchTerm && (
                <ContinueLearning noteId={continueLearningNote.id} filename={getNoteRawFilename(continueLearningNote.file_path)} ai_title={continueLearningNote.is_processed ? continueLearningNote.title : null} progress={getNoteProgress(continueLearningNote)} studyTimeRemaining="12 mins left" />
              )}

              {filteredNotes.length > 0 && (
                <h2 className="text-[10px] font-extrabold tracking-[0.2em] text-white/40 uppercase mt-4">All Study Kits</h2>
              )}

              {filteredNotes.length === 0 && (
                <div className="text-center py-16 border border-dashed border-white/10 rounded-[32px] bg-white/[0.02] backdrop-blur-md">
                  <p className="text-sm font-semibold text-white/60">No matching study materials found.</p>
                  <button onClick={() => { setSearchTerm(""); setActiveFilter("all"); }} className="mt-3 text-xs font-bold text-omnave-primary hover:text-white transition-colors">
                    Clear search and filter chips
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 w-full">
                {filteredNotes.map((note) => (
                  <LessonCard key={note.id} id={note.id} filename={getNoteRawFilename(note.file_path)} ai_title={note.is_processed ? note.title : null} createdAt={note.created_at || new Date().toISOString()} flashcardsCount={Array.isArray(note.flashcards) ? note.flashcards.length : 0} quizzesCount={Array.isArray(note.quizzes) ? note.quizzes.length : 0} progress={getNoteProgress(note)} onDeleteClick={setDeleteTargetId} highlightText={searchTerm} isProcessed={note.is_processed !== false} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <DeleteLessonDialog isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)} onConfirm={handleDeleteConfirm} isDeleting={isDeleting} />
    </div>
  );
}
