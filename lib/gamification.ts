/**
 * CENTRALIZED GAMIFICATION ENGINE
 * Defines XP rewards, level progression, streak validity, and statistics derivations.
 */

// 1. Configurable XP Values
export const XP_CONFIG = {
  UPLOAD_PDF: 10,
  COMPLETE_SUMMARY: 15,
  FINISH_FLASHCARDS: 20,
  COMPLETE_QUIZ: 25,
  PERFECT_QUIZ_BONUS: 15, // Extra XP for 100% score
  DAILY_LOGIN: 10,
  STREAK_MILESTONE_3: 15,
  STREAK_MILESTONE_7: 30,
  STREAK_MILESTONE_14: 50,
};

// 2. Reusable Level Calculator
// Unlimited levels, standard constant 500 XP increments for progress bar stability
export interface LevelInfo {
  level: number;
  xpInLevel: number;
  xpNeeded: number;
  progressPercentage: number;
}

export function calculateLevel(xp: number): LevelInfo {
  const XP_PER_LEVEL = 500;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpInLevel = xp % XP_PER_LEVEL;
  const xpNeeded = XP_PER_LEVEL - xpInLevel;
  const progressPercentage = (xpInLevel / XP_PER_LEVEL) * 100;

  return { level, xpInLevel, xpNeeded, progressPercentage };
}

// 3. Timezone-Safe Date Utility
// Strictly formats Date using local browser calendar values
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 4. Streak Expiry Validator
// Returns active streak, or 0 if user missed yesterday's study window
export function validateStreak(lastStudyDate: string | null, currentStreak: number): number {
  if (!lastStudyDate) return 0;

  const todayStr = getLocalDateString(new Date());
  if (lastStudyDate === todayStr) {
    return currentStreak;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  if (lastStudyDate === yesterdayStr) {
    return currentStreak;
  }

  return 0; // Streak reset!
}

// 5. Centralized Statistics Compiler
export interface CentralStats {
  currentLevel: number;
  currentXp: number;
  xpInLevel: number;
  xpNeeded: number;
  xpProgress: number;

  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  totalStudyDays: number;

  lessonsCompleted: number;
  flashcardsReviewed: number;
  quizAttempts: number;
  perfectScores: number;
  studySessions: number;
  studyMinutes: number;
  documentsUploaded: number;
  averageQuizScore: number;
}

interface CompileParams {
  xp: number;
  currentStreak: number;
  highestStreak: number;
  lastStudyDate: string | null;
  lessons: any[];
  quizScores: any[];
}

export function compileCentralStats({
  xp,
  currentStreak,
  highestStreak,
  lastStudyDate,
  lessons,
  quizScores
}: CompileParams): CentralStats {
  // A. Level and progression
  const levelInfo = calculateLevel(xp);

  // B. Streak status (validate if active streak is broken)
  const activeStreak = validateStreak(lastStudyDate, currentStreak);

  // C. Quiz statistics
  const quizAttempts = quizScores.length;
  const perfectScores = quizScores.filter((q) => q.percentage === 100).length;
  
  let averageQuizScore = 0;
  if (quizAttempts > 0) {
    const sum = quizScores.reduce((acc, curr) => acc + curr.percentage, 0);
    averageQuizScore = Math.round(sum / quizAttempts);
  }

  // D. Derived study stats
  const documentsUploaded = lessons.length;
  
  // Calculate unique days studied
  const studiedDates = new Set<string>();
  quizScores.forEach((q) => {
    if (q.created_at) {
      studiedDates.add(q.created_at.split("T")[0]);
    }
  });
  const totalStudyDays = studiedDates.size;

  // Study minutes: assume 15 minutes per session / attempt
  const studySessions = quizAttempts;
  const studyMinutes = studySessions * 15;
  const lessonsCompleted = lessons.filter((l) => {
    // Derive completion if the user took at least one quiz for this lesson
    return quizScores.some((q) => q.lesson_id === l.id);
  }).length;

  // Calculate longest streak
  const longestStreak = Math.max(highestStreak, activeStreak);

  return {
    currentLevel: levelInfo.level,
    currentXp: xp,
    xpInLevel: levelInfo.xpInLevel,
    xpNeeded: levelInfo.xpNeeded,
    xpProgress: levelInfo.progressPercentage,

    currentStreak: activeStreak,
    longestStreak,
    lastStudyDate,
    totalStudyDays,

    lessonsCompleted,
    flashcardsReviewed: studySessions * 5, // Mocked derived metric (5 per study session)
    quizAttempts,
    perfectScores,
    studySessions,
    studyMinutes,
    documentsUploaded,
    averageQuizScore,
  };
}

// 6. Achievement Engine
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "learning" | "quiz" | "flashcard" | "consistency" | "upload" | "milestone";
  rarity: "common" | "rare" | "epic" | "legendary";
  progress: number;
  target: number;
  completed: boolean;
  rewardXp: number;
  unlockedAt: string | null;
}

export function compileAchievements(stats: CentralStats): Achievement[] {
  const list: Omit<Achievement, "progress" | "completed" | "unlockedAt">[] = [
    {
      id: "first-upload",
      title: "First Step",
      description: "Upload your first study document.",
      icon: "Upload",
      category: "upload",
      rarity: "common",
      target: 1,
      rewardXp: 50,
    },
    {
      id: "upload-10",
      title: "Content Curator",
      description: "Upload 10 study documents.",
      icon: "FolderOpen",
      category: "upload",
      rarity: "rare",
      target: 10,
      rewardXp: 150,
    },
    {
      id: "first-lesson",
      title: "First Lesson Done",
      description: "Complete your first lesson.",
      icon: "BookOpen",
      category: "learning",
      rarity: "common",
      target: 1,
      rewardXp: 50,
    },
    {
      id: "lessons-10",
      title: "Scholar",
      description: "Complete 10 lessons.",
      icon: "GraduationCap",
      category: "learning",
      rarity: "rare",
      target: 10,
      rewardXp: 200,
    },
    {
      id: "quiz-master",
      title: "Quiz Master",
      description: "Complete 5 quizzes.",
      icon: "BrainCircuit",
      category: "quiz",
      rarity: "common",
      target: 5,
      rewardXp: 100,
    },
    {
      id: "perfect-score",
      title: "Flawless",
      description: "Achieve a perfect 100% score on a quiz.",
      icon: "Award",
      category: "quiz",
      rarity: "epic",
      target: 1,
      rewardXp: 150,
    },
    {
      id: "flashcard-explorer",
      title: "Memory Builder",
      description: "Review 10 flashcards.",
      icon: "Layers",
      category: "flashcard",
      rarity: "common",
      target: 10,
      rewardXp: 50,
    },
    {
      id: "flashcards-100",
      title: "Hyper-Focus",
      description: "Review 100 flashcards.",
      icon: "ListCollapse",
      category: "flashcard",
      rarity: "rare",
      target: 100,
      rewardXp: 200,
    },
    {
      id: "streak-3",
      title: "Flame Keeper",
      description: "Maintain a study streak of 3 days.",
      icon: "Flame",
      category: "consistency",
      rarity: "common",
      target: 3,
      rewardXp: 75,
    },
    {
      id: "streak-7",
      title: "Week Warrior",
      description: "Maintain a study streak of 7 days.",
      icon: "CalendarDays",
      category: "consistency",
      rarity: "rare",
      target: 7,
      rewardXp: 150,
    },
    {
      id: "streak-30",
      title: "Monolithic Habit",
      description: "Maintain a study streak of 30 days.",
      icon: "Infinity",
      category: "consistency",
      rarity: "legendary",
      target: 30,
      rewardXp: 500,
    },
    {
      id: "level-5",
      title: "Level 5 Achiever",
      description: "Reach level 5.",
      icon: "Sparkles",
      category: "milestone",
      rarity: "rare",
      target: 5,
      rewardXp: 250,
    },
    {
      id: "level-10",
      title: "Omnipresent Sage",
      description: "Reach level 10.",
      icon: "Crown",
      category: "milestone",
      rarity: "legendary",
      target: 10,
      rewardXp: 500,
    },
  ];

  return list.map((a) => {
    let progress = 0;
    switch (a.id) {
      case "first-upload":
      case "upload-10":
        progress = stats.documentsUploaded;
        break;
      case "first-lesson":
      case "lessons-10":
        progress = stats.lessonsCompleted;
        break;
      case "quiz-master":
        progress = stats.quizAttempts;
        break;
      case "perfect-score":
        progress = stats.perfectScores;
        break;
      case "flashcard-explorer":
      case "flashcards-100":
        progress = stats.flashcardsReviewed;
        break;
      case "streak-3":
      case "streak-7":
      case "streak-30":
        progress = stats.longestStreak;
        break;
      case "level-5":
      case "level-10":
        progress = stats.currentLevel;
        break;
    }

    const completed = progress >= a.target;
    return {
      ...a,
      progress: Math.min(progress, a.target),
      completed,
      unlockedAt: completed ? (stats.lastStudyDate || "Recently") : null,
    };
  });
}

// 7. Task Engine
export interface Task {
  id: string;
  type: "daily" | "mission" | "weekly";
  title: string;
  description: string;
  progress: number;
  target: number;
  rewardXp: number;
  completed: boolean;
}

function isDateInCurrentWeek(dateStr: string): boolean {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    
    const currentDay = now.getDay();
    const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    const time = d.getTime();
    return time >= startOfWeek.getTime() && time < endOfWeek.getTime();
  } catch {
    return false;
  }
}

export function compileTasks(lessons: any[], quizScores: any[], stats: CentralStats): {
  dailyGoals: Task[];
  dailyMissions: Task[];
  weeklyChallenges: Task[];
} {
  const todayStr = getLocalDateString(new Date());

  // A. Daily Progress
  const uploadsToday = lessons.filter(l => l.created_at && l.created_at.split("T")[0] === todayStr).length;
  const quizzesToday = quizScores.filter(q => q.created_at && q.created_at.split("T")[0] === todayStr).length;
  const studiedToday = stats.lastStudyDate === todayStr ? 1 : 0;

  // B. Weekly Progress
  const uploadsThisWeek = lessons.filter(l => l.created_at && isDateInCurrentWeek(l.created_at)).length;
  const quizzesThisWeek = quizScores.filter(q => q.created_at && isDateInCurrentWeek(q.created_at)).length;
  
  const weeklyStudyDates = new Set<string>();
  quizScores.forEach((q) => {
    if (q.created_at && isDateInCurrentWeek(q.created_at)) {
      weeklyStudyDates.add(q.created_at.split("T")[0]);
    }
  });
  const studyDaysThisWeek = weeklyStudyDates.size;

  // C. Daily Goals
  const dailyGoals: Task[] = [
    {
      id: "daily-upload",
      type: "daily",
      title: "Upload a PDF",
      description: "Import a new study document.",
      progress: Math.min(uploadsToday, 1),
      target: 1,
      rewardXp: 15,
      completed: uploadsToday >= 1,
    },
    {
      id: "daily-quiz",
      type: "daily",
      title: "Complete a Quiz",
      description: "Complete one practice quiz on any lesson.",
      progress: Math.min(quizzesToday, 1),
      target: 1,
      rewardXp: 20,
      completed: quizzesToday >= 1,
    },
    {
      id: "daily-streak",
      type: "daily",
      title: "Maintain Streak",
      description: "Keep your daily study momentum going.",
      progress: studiedToday,
      target: 1,
      rewardXp: 10,
      completed: studiedToday >= 1,
    },
  ];

  // D. Daily Missions (Featured challenges)
  const dailyMissions: Task[] = [
    {
      id: "mission-study-time",
      type: "mission",
      title: "Study Session Time",
      description: "Complete 15 minutes of dynamic practice quizzes.",
      progress: Math.min(quizzesToday * 15, 15),
      target: 15,
      rewardXp: 30,
      completed: quizzesToday * 15 >= 15,
    },
    {
      id: "mission-perfect-quiz",
      type: "mission",
      title: "Perfect Mastery",
      description: "Achieve a perfect 100% score on any quiz today.",
      progress: quizScores.some(q => q.created_at && q.created_at.split("T")[0] === todayStr && q.percentage === 100) ? 1 : 0,
      target: 1,
      rewardXp: 40,
      completed: quizScores.some(q => q.created_at && q.created_at.split("T")[0] === todayStr && q.percentage === 100),
    },
  ];

  // E. Weekly Challenges
  const weeklyChallenges: Task[] = [
    {
      id: "weekly-upload",
      type: "weekly",
      title: "Weekly Collector",
      description: "Upload 3 new PDF study documents.",
      progress: Math.min(uploadsThisWeek, 3),
      target: 3,
      rewardXp: 50,
      completed: uploadsThisWeek >= 3,
    },
    {
      id: "weekly-quiz",
      type: "weekly",
      title: "Quiz Marathoner",
      description: "Finish 5 practice quizzes this week.",
      progress: Math.min(quizzesThisWeek, 5),
      target: 5,
      rewardXp: 75,
      completed: quizzesThisWeek >= 5,
    },
    {
      id: "weekly-consistency",
      type: "weekly",
      title: "Consistent Learner",
      description: "Complete study actions on 3 distinct days this week.",
      progress: Math.min(studyDaysThisWeek, 3),
      target: 3,
      rewardXp: 60,
      completed: studyDaysThisWeek >= 3,
    },
  ];

  return { dailyGoals, dailyMissions, weeklyChallenges };
}

// 8. XP History Compiler
export interface XpHistoryItem {
  id: string;
  activity: string;
  xp: number;
  date: string;
}

export function compileXpHistory(lessons: any[], quizScores: any[]): XpHistoryItem[] {
  const items: XpHistoryItem[] = [];

  lessons.forEach((l, idx) => {
    if (!l.created_at) return;
    items.push({
      id: `l-${l.id || idx}`,
      activity: "Document Uploaded",
      xp: XP_CONFIG.UPLOAD_PDF,
      date: l.created_at,
    });
  });

  quizScores.forEach((q, idx) => {
    if (!q.created_at) return;
    items.push({
      id: `q-${q.id || idx}`,
      activity: "Quiz Completed",
      xp: XP_CONFIG.COMPLETE_QUIZ,
      date: q.created_at,
    });
    if (q.percentage === 100) {
      items.push({
        id: `qp-${q.id || idx}`,
        activity: "Perfect Quiz Bonus",
        xp: XP_CONFIG.PERFECT_QUIZ_BONUS,
        date: q.created_at,
      });
    }
  });

  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// 9. Learning Insights Compiler
export function compileLearningInsights(stats: CentralStats, quizScores: any[]): string[] {
  const insights: string[] = [];

  if (stats.currentStreak >= 3) {
    insights.push(`You maintained your streak for ${stats.currentStreak} days.`);
  } else {
    insights.push("Start studying daily to build your momentum streak!");
  }

  if (stats.averageQuizScore > 80) {
    insights.push(`Excellent quiz accuracy: averaging ${stats.averageQuizScore}% score!`);
  } else if (stats.quizAttempts > 0) {
    insights.push("Review your summary notes before starting a quiz to boost accuracy.");
  }

  if (stats.perfectScores > 0) {
    insights.push(`You achieved flawless mastery on ${stats.perfectScores} quiz${stats.perfectScores === 1 ? "" : "zes"}.`);
  }

  if (quizScores.length > 0) {
    let morningCount = 0;
    let afternoonCount = 0;
    let eveningCount = 0;

    quizScores.forEach((q) => {
      if (!q.created_at) return;
      const hour = new Date(q.created_at).getHours();
      if (hour >= 5 && hour < 12) morningCount++;
      else if (hour >= 12 && hour < 17) afternoonCount++;
      else eveningCount++;
    });

    if (morningCount >= afternoonCount && morningCount >= eveningCount) {
      insights.push("You study best in the morning.");
    } else if (afternoonCount >= morningCount && afternoonCount >= eveningCount) {
      insights.push("You study best in the afternoon.");
    } else {
      insights.push("You study best in the evening.");
    }
  }

  return insights.slice(0, 3);
}
