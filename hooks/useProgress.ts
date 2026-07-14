"use client";

import { useUserContext } from "@/context/UserContext";

export function useProgress() {
  const context = useUserContext();

  return {
    quizzesCount: context.quizzesCount,
    avgScore: context.avgScore,
    bestScore: context.bestScore,
    quizScores: context.quizScores,
    loading: context.loading,
    refreshProgress: context.refreshUser,
    updateStatsAfterQuiz: context.updateStatsAfterQuiz,
  };
}
