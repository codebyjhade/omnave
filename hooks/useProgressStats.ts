"use client";

import { useMemo } from "react";
import type { QuizScore, Lesson } from "@/context/UserContext";
import { calculateLevel, validateStreak } from "../lib/gamification";

export interface SubjectScore {
  subject: string;
  score: number;
}

export interface WeeklyDay {
  day: string;
  sessions: number;
}

export interface HeatmapDay {
  date: Date;
  count: number;
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  unlocked: boolean;
}

export interface ProgressInsight {
  id: string;
  text: string;
  type: "positive" | "neutral" | "action";
}

export interface ProgressStats {
  strongest: SubjectScore | null;
  weakest: SubjectScore | null;
  subjectScores: SubjectScore[];
  overallAvg: number;
  overallBest: number;
  weeklyData: WeeklyDay[];
  daysStudiedThisWeek: number;
  quizzesThisWeek: number;
  estimatedStudyMinutes: number;
  heatmapDays: HeatmapDay[];
  currentLevel: number;
  currentLevelXp: number;
  xpProgress: number;
  xpNeeded: number;
  achievements: Achievement[];
  notesMap: Map<string, string>;
  completionRate: number;
  longestStreak: number;
  daysStudiedThisMonth: number;
  insights: ProgressInsight[];
}

export function getCleanTitle(path: string): string {
  const parts = path.split("_");
  return parts.slice(1).join("_").replace(".pdf", "") || "Study Material";
}

export function getSubject(path: string): string {
  const name = getCleanTitle(path);
  return name.split(/[\s\-_]+/)[0] || "General";
}

function computeLongestStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  const uniqueDays = [...new Set(dates.map((d) => d.toISOString().split("T")[0]))].sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

function countDaysStudiedThisMonth(dates: Date[]): number {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const uniqueDays = new Set(
    dates
      .filter((d) => d.getMonth() === month && d.getFullYear() === year)
      .map((d) => d.toISOString().split("T")[0])
  );

  return uniqueDays.size;
}

function buildInsights(
  daysStudiedThisWeek: number,
  strongest: SubjectScore | null,
  weakest: SubjectScore | null,
  streak: number,
  completionRate: number
): ProgressInsight[] {
  const insights: ProgressInsight[] = [];

  if (daysStudiedThisWeek > 0) {
    insights.push({
      id: "weekly-days",
      text: `You've studied ${daysStudiedThisWeek} day${daysStudiedThisWeek === 1 ? "" : "s"} this week.`,
      type: "positive",
    });
  } else {
    insights.push({
      id: "weekly-start",
      text: "Start a study session today to build momentum.",
      type: "action",
    });
  }

  if (strongest) {
    insights.push({
      id: "strongest",
      text: `You're strongest in ${strongest.subject} (${strongest.score}% avg).`,
      type: "positive",
    });
  }

  if (weakest && strongest && weakest.subject !== strongest.subject) {
    insights.push({
      id: "review",
      text: `Review ${weakest.subject} to maintain retention.`,
      type: "action",
    });
  }

  if (streak >= 3) {
    insights.push({
      id: "streak",
      text: `${streak}-day streak — keep the momentum going.`,
      type: "positive",
    });
  }

  if (completionRate < 50) {
    insights.push({
      id: "completion",
      text: "Complete practice quizzes on more lessons to boost your completion rate.",
      type: "neutral",
    });
  }

  return insights.slice(0, 3);
}

export function useProgressStats(
  quizScores: QuizScore[],
  notes: Lesson[],
  xp: number,
  streak: number,
  quizzesCount: number
): ProgressStats {
  return useMemo(() => {
    const notesMap = new Map(notes.map((n) => [n.id, n.file_path]));

    const subjectMap: Record<string, number[]> = {};
    quizScores.forEach((score) => {
      const filePath = notesMap.get(score.lesson_id) || "General";
      const subject = getSubject(filePath);
      if (!subjectMap[subject]) {
        subjectMap[subject] = [];
      }
      subjectMap[subject].push(score.percentage);
    });

    const subjectScores = Object.entries(subjectMap)
      .map(([subject, percentages]) => ({
        subject,
        score: Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length),
      }))
      .sort((a, b) => b.score - a.score);

    const strongest = subjectScores[0] || null;
    const weakest = subjectScores.length > 1 ? subjectScores[subjectScores.length - 1] : null;

    let overallAvg = 0;
    let overallBest = 0;
    if (quizScores.length > 0) {
      const percentages = quizScores.map((s) => s.percentage);
      overallAvg = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
      overallBest = Math.max(...percentages);
    }

    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weeklyData: WeeklyDay[] = daysOfWeek.map((day) => ({ day, sessions: 0 }));

    const today = new Date();
    const currentDay = today.getDay();
    const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    quizScores.forEach((score) => {
      if (!score.created_at) return;
      const scoreDate = new Date(score.created_at);
      const diffTime = scoreDate.getTime() - startOfWeek.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        weeklyData[diffDays].sessions += 1;
      }
    });

    const quizzesThisWeek = weeklyData.reduce((acc, curr) => acc + curr.sessions, 0);
    const daysStudiedThisWeek = weeklyData.filter((d) => d.sessions > 0).length;
    const estimatedStudyMinutes = quizzesThisWeek * 15;

    const heatmapDays: HeatmapDay[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      heatmapDays.push({ date: d, count: 0 });
    }

    const studyDates: Date[] = [];
    quizScores.forEach((score) => {
      if (!score.created_at) return;
      const scoreDate = new Date(score.created_at);
      scoreDate.setHours(0, 0, 0, 0);
      studyDates.push(scoreDate);
      const cell = heatmapDays.find((h) => h.date.getTime() === scoreDate.getTime());
      if (cell) {
        cell.count += 1;
      }
    });

    const levelInfo = calculateLevel(xp);
    const currentLevel = levelInfo.level;
    const currentLevelXp = levelInfo.xpInLevel;
    const xpProgress = levelInfo.progressPercentage;
    const xpNeeded = levelInfo.xpNeeded;

    const quizzedLessonIds = new Set(quizScores.map((s) => s.lesson_id));
    const completionRate =
      notes.length > 0 ? Math.round((quizzedLessonIds.size / notes.length) * 100) : 0;

    const longestStreak = Math.max(computeLongestStreak(studyDates), streak);
    const daysStudiedThisMonth = countDaysStudiedThisMonth(studyDates);

    const achievements: Achievement[] = [
      {
        id: "quick-starter",
        name: "First Step",
        desc: "Complete your first practice quiz.",
        unlocked: quizzesCount > 0,
      },
      {
        id: "perfect-score",
        name: "Flawless",
        desc: "Achieve 100% on any practice quiz.",
        unlocked: quizScores.some((s) => s.percentage === 100),
      },
      {
        id: "streak-pioneer",
        name: "Flamekeeper",
        desc: "Maintain a study streak of 3+ days.",
        unlocked: streak >= 3,
      },
      {
        id: "polymath",
        name: "Polymath",
        desc: "Studied 3+ distinct subject modules.",
        unlocked: subjectScores.length >= 3,
      },
    ];

    const insights = buildInsights(
      daysStudiedThisWeek,
      strongest,
      weakest,
      streak,
      completionRate
    );

    return {
      strongest,
      weakest,
      subjectScores,
      overallAvg,
      overallBest,
      weeklyData,
      daysStudiedThisWeek,
      quizzesThisWeek,
      estimatedStudyMinutes,
      heatmapDays,
      currentLevel,
      currentLevelXp,
      xpProgress,
      xpNeeded,
      achievements,
      notesMap,
      completionRate,
      longestStreak,
      daysStudiedThisMonth,
      insights,
    };
  }, [quizScores, notes, xp, streak, quizzesCount]);
}
