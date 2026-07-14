"use client";

import { useState } from "react";
import { useUserContext } from "@/context/UserContext";

export function useLessons() {
  const context = useUserContext();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteLesson = async (id: string) => {
    setDeletingId(id);
    try {
      await context.deleteLesson(id);
    } catch (err) {
      console.error("Failed to delete lesson in hook:", err);
      throw err;
    } finally {
      setDeletingId(null);
    }
  };

  return {
    lessons: context.lessons,
    docCount: context.docCount,
    loading: context.loading,
    refreshLessons: context.refreshUser,
    deleteLesson,
    isDeletingId: deletingId,
  };
}
