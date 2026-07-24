'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  compileCentralStats,
  type CentralStats,
  compileAchievements,
  type Achievement,
  compileTasks,
  type Task,
  compileXpHistory,
  type XpHistoryItem,
  compileLearningInsights,
} from '../lib/gamification';
import { createClient } from '@/lib/supabase/client';
import { LessonService } from '@/services/lesson.service';
import { ProgressService } from '@/services/progress.service';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface QuizScore {
  id: string;
  lesson_id: string;
  percentage: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  file_path: string;
  title?: string;
  summary?: string;
  flashcards?: any;
  quizzes?: any;
  created_at?: string;
  is_processed?: boolean;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  desc: string;
  time: string;
  isRead: boolean;
}

interface UserContextType {
  user: any;
  xp: number;
  streak: number;
  docCount: number;
  quizzesCount: number;
  avgScore: number;
  bestScore: number;
  quizScores: QuizScore[];
  lessons: Lesson[];
  loading: boolean;
  refreshUser: () => Promise<void>;
  updateStatsAfterQuiz: (percentage: number, xpGained: number) => Promise<void>;
  deleteLesson: (id: string) => Promise<void>;
  gamificationStats: CentralStats;
  achievements: Achievement[];
  tasks: { dailyGoals: Task[]; dailyMissions: Task[]; weeklyChallenges: Task[] };
  xpHistory: XpHistoryItem[];
  insights: string[];
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
  notifications: Notification[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notification: Omit<Notification, 'isRead'>) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  // Auth state
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Onboarding state
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(true);

  // Gamification state
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highestStreak, setHighestStreak] = useState(0);
  const [lastStudyDate, setLastStudyDate] = useState<string | null>(null);

  // Content state
  const [docCount, setDocCount] = useState(0);
  const [quizzesCount, setQuizzesCount] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [quizScores, setQuizScores] = useState<QuizScore[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  // ── Data fetching ────────────────────────────────────────────────────────────

  const loadUserData = useCallback(async (activeUser: any) => {
    if (!activeUser) return;
    try {
      const [userStats, userLessons, scores] = await Promise.all([
        ProgressService.getUserStats(activeUser.id),
        LessonService.getLessons(activeUser.id),
        ProgressService.getQuizScores(activeUser.id),
      ]);

      if (userStats) {
        setXp(userStats.xp);
        setStreak(userStats.current_streak);
        setHighestStreak(userStats.highest_streak ?? userStats.current_streak);
        setLastStudyDate(userStats.last_study_date ?? null);
      }

      if (userLessons) {
        setLessons(userLessons);
        setDocCount(userLessons.length);
      }

      if (scores) {
        const transformed: QuizScore[] = scores.map((s) => ({
          id: s.id ?? `q-${Date.now()}`,
          lesson_id: s.lesson_id,
          percentage: s.percentage,
          created_at: s.created_at ?? new Date().toISOString(),
        }));
        setQuizScores(transformed);
        setQuizzesCount(transformed.length);
        const pcts = transformed.map((s) => s.percentage);
        if (pcts.length > 0) {
          setAvgScore(Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length));
          setBestScore(Math.max(...pcts));
        } else {
          setAvgScore(0);
          setBestScore(0);
        }
      }
    } catch (err) {
      console.error('[UserContext] loadUserData error:', err);
    }
  }, []);

  /**
   * Public refreshUser — re-fetches all data for the current session user.
   * Called after quiz completions, lesson uploads, etc.
   */
  const refreshUser = useCallback(async () => {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setUser(null);
      setLoading(false);
      return;
    }
    setUser(authUser);
    await loadUserData(authUser);
    setLoading(false);
  }, [loadUserData]);

  // ── Reactive auth subscription ───────────────────────────────────────────────
  // onAuthStateChange fires immediately with the current session state on mount,
  // then again whenever the user signs in, signs out, or the token refreshes.
  // This removes the need for any manual session reads and makes the UI update
  // correctly after OAuth redirects and cross-tab sign-outs.

  useEffect(() => {
    const supabase = createClient();

    // Kick off initial load
    setLoading(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const authUser = session?.user ?? null;
        setUser(authUser);
        if (authUser) {
          await loadUserData(authUser);
        } else {
          // Signed out — reset all state
          setXp(0);
          setStreak(0);
          setHighestStreak(0);
          setLastStudyDate(null);
          setLessons([]);
          setDocCount(0);
          setQuizScores([]);
          setQuizzesCount(0);
          setAvgScore(0);
          setBestScore(0);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  // ── Mutations ────────────────────────────────────────────────────────────────

  const updateStatsAfterQuiz = useCallback(
    async (percentage: number, xpGained: number) => {
      if (!user) return;
      try {
        await ProgressService.awardXP(user.id, xpGained);
        await ProgressService.insertQuizScore(user.id, {
          lesson_id: 'lesson-1', // TODO: pass real lesson ID from caller
          score: Math.round(percentage / 5),
          total_questions: 20,
          percentage,
        });
        await loadUserData(user);
      } catch (err) {
        console.error('[UserContext] updateStatsAfterQuiz error:', err);
      }
    },
    [user, loadUserData]
  );

  const deleteLesson = useCallback(
    async (id: string) => {
      if (!user) return;
      setLoading(true);
      try {
        await LessonService.deleteLesson(user.id, id);
        await loadUserData(user);
      } catch (err) {
        console.error('[UserContext] deleteLesson error:', err);
      } finally {
        setLoading(false);
      }
    },
    [user, loadUserData]
  );

  // ── Derived gamification state ───────────────────────────────────────────────

  const gamificationStats = useMemo(
    () =>
      compileCentralStats({
        xp,
        currentStreak: streak,
        highestStreak,
        lastStudyDate,
        lessons,
        quizScores,
      }),
    [xp, streak, highestStreak, lastStudyDate, lessons, quizScores]
  );

  const achievements = useMemo(
    () => compileAchievements(gamificationStats),
    [gamificationStats]
  );

  const tasks = useMemo(
    () => compileTasks(lessons, quizScores, gamificationStats),
    [lessons, quizScores, gamificationStats]
  );

  const xpHistory = useMemo(
    () => compileXpHistory(lessons, quizScores),
    [lessons, quizScores]
  );

  const insights = useMemo(
    () => compileLearningInsights(gamificationStats, quizScores),
    [gamificationStats, quizScores]
  );

  // Sync onboarding state on load / auth change
  useEffect(() => {
    if (loading) return;
    
    if (user) {
      setHasCompletedOnboarding(!!user.user_metadata?.onboarding_complete);
    } else {
      setHasCompletedOnboarding(false);
    }
  }, [user, loading]);

  const completeOnboarding = useCallback(async () => {
    setHasCompletedOnboarding(true);
    if (user) {
      try {
        const supabase = createClient();
        await supabase.auth.updateUser({
          data: { onboarding_complete: true }
        });
        await refreshUser();
      } catch (err) {
        console.error('[UserContext] Failed to sync onboarding completion:', err);
      }
    }
  }, [user, refreshUser]);

  // ── Notifications persistence ────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Helper to generate default initial notifications list
  const generateDefaultNotifications = useCallback((streakVal: number, lessonsVal: Lesson[]) => {
    const list: Notification[] = [];
    if (streakVal > 0) {
      list.push({
        id: "streak",
        type: "streak",
        title: "Streak Active!",
        desc: `You are on a ${streakVal}-day study streak. Keep the momentum going!`,
        time: "Just now",
        isRead: false,
      });
    }
    if (lessonsVal.length > 0) {
      const firstTitle = lessonsVal[0].title || "Study document";
      list.push({
        id: "lesson",
        type: "lesson",
        title: "Material Processed",
        desc: `"${firstTitle}" has been successfully analyzed by AI.`,
        time: "10m ago",
        isRead: false,
      });
    } else {
      list.push({
        id: "welcome",
        type: "welcome",
        title: "Welcome to Omnave",
        desc: "Upload a PDF or paste a link to generate flashcards and practice quizzes instantly.",
        time: "1h ago",
        isRead: false,
      });
    }
    list.push({
      id: "ai",
      type: "ai",
      title: "AI Study Tip",
      desc: "Practice with quizzes after reviewing flashcards to reinforce retention.",
      time: "2h ago",
      isRead: false,
    });
    return list;
  }, []);

  // Sync / load notifications state from localStorage when user, streak, or lessons load
  useEffect(() => {
    if (loading) return;
    const storageKey = user ? `omnave_notifications_${user.id}` : "omnave_notifications_guest";
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse notifications", e);
      }
    } else {
      const initialList = generateDefaultNotifications(streak, lessons);
      localStorage.setItem(storageKey, JSON.stringify(initialList));
      setNotifications(initialList);
    }
  }, [user, loading, streak, lessons, generateDefaultNotifications]);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      const storageKey = user ? `omnave_notifications_${user.id}` : "omnave_notifications_guest";
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  }, [user]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    const storageKey = user ? `omnave_notifications_${user.id}` : "omnave_notifications_guest";
    localStorage.setItem(storageKey, JSON.stringify([]));
  }, [user]);

  const addNotification = useCallback((newNotif: Omit<Notification, 'isRead'>) => {
    setNotifications((prev) => {
      const fullNotif = { ...newNotif, isRead: false };
      // Check if notification already exists to avoid duplicates
      if (prev.some((n) => n.id === newNotif.id)) return prev;
      const updated = [fullNotif, ...prev];
      const storageKey = user ? `omnave_notifications_${user.id}` : "omnave_notifications_guest";
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  }, [user]);

  // ── Context value ────────────────────────────────────────────────────────────

  const value: UserContextType = {
    user,
    xp,
    streak,
    docCount,
    quizzesCount,
    avgScore,
    bestScore,
    quizScores,
    lessons,
    loading,
    refreshUser,
    updateStatsAfterQuiz,
    deleteLesson,
    gamificationStats,
    achievements,
    tasks,
    xpHistory,
    insights,
    hasCompletedOnboarding,
    completeOnboarding,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    addNotification,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}
