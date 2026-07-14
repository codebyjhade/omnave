"use client";

export interface Learner {
  id: string;
  name: string;
  avatar: string; // Initials
  level: number;
  xp: number;
  streak: number;
  badges: number;
  longestStreak: number;
  lessonsCompleted: number;
  averageQuizScore: number;
  studyMinutes: number;
}

export interface ActivityItem {
  id: string;
  userName: string;
  userAvatar: string;
  activity: string;
  timestamp: string;
}

export const MOCK_LEARNERS: Learner[] = [
  {
    id: "learner-sophia",
    name: "Sophia Chen",
    avatar: "SC",
    level: 8,
    xp: 3850,
    streak: 14,
    badges: 8,
    longestStreak: 18,
    lessonsCompleted: 12,
    averageQuizScore: 88,
    studyMinutes: 180,
  },
  {
    id: "learner-liam",
    name: "Liam Johnson",
    avatar: "LJ",
    level: 5,
    xp: 2400,
    streak: 7,
    badges: 4,
    longestStreak: 10,
    lessonsCompleted: 7,
    averageQuizScore: 78,
    studyMinutes: 105,
  },
  {
    id: "learner-emma",
    name: "Emma Garcia",
    avatar: "EG",
    level: 12,
    xp: 5900,
    streak: 21,
    badges: 11,
    longestStreak: 25,
    lessonsCompleted: 19,
    averageQuizScore: 92,
    studyMinutes: 285,
  },
  {
    id: "learner-noah",
    name: "Noah Patel",
    avatar: "NP",
    level: 3,
    xp: 1250,
    streak: 2,
    badges: 2,
    longestStreak: 4,
    lessonsCompleted: 4,
    averageQuizScore: 72,
    studyMinutes: 60,
  },
  {
    id: "learner-isabella",
    name: "Isabella Vance",
    avatar: "IV",
    level: 9,
    xp: 4300,
    streak: 9,
    badges: 9,
    longestStreak: 12,
    lessonsCompleted: 14,
    averageQuizScore: 85,
    studyMinutes: 210,
  },
];

export class CommunityService {
  static getFollowing(userId: string): string[] {
    if (typeof window === "undefined") return ["learner-sophia", "learner-liam"];
    const saved = localStorage.getItem(`omnilearn:following:${userId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    const defaultFollowing = ["learner-sophia", "learner-liam"];
    localStorage.setItem(`omnilearn:following:${userId}`, JSON.stringify(defaultFollowing));
    return defaultFollowing;
  }

  static saveFollowing(userId: string, following: string[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(`omnilearn:following:${userId}`, JSON.stringify(following));
  }

  static getFollowers(userId: string): string[] {
    return ["learner-sophia", "learner-emma"];
  }

  static followUser(userId: string, targetId: string): void {
    const following = this.getFollowing(userId);
    if (!following.includes(targetId)) {
      following.push(targetId);
      this.saveFollowing(userId, following);
    }
  }

  static unfollowUser(userId: string, targetId: string): void {
    const following = this.getFollowing(userId);
    const updated = following.filter((id) => id !== targetId);
    this.saveFollowing(userId, updated);
  }

  static getLeaderboard(
    userXp: number,
    userStreak: number,
    userLevel: number,
    username: string,
    followingOnly: boolean,
    userId: string
  ): { rank: number; name: string; avatar: string; xp: number; streak: number; level: number; isSelf: boolean; id: string }[] {
    let hideLeaderboard = false;
    try {
      const privacy = localStorage.getItem("omnilearn:settings:privacy");
      if (privacy) {
        hideLeaderboard = JSON.parse(privacy).hideLeaderboards === true;
      }
    } catch {}

    const selfRow = {
      id: userId,
      name: `${username} (You)`,
      avatar: username.substring(0, 2).toUpperCase() || "ME",
      xp: userXp,
      streak: userStreak,
      level: userLevel,
      isSelf: true,
    };

    const followingIds = this.getFollowing(userId);

    const list = MOCK_LEARNERS.filter((l) => {
      try {
        const privacy = localStorage.getItem(`omnilearn:settings:privacy`);
        if (privacy && JSON.parse(privacy).publicProfile === false && l.id === userId) {
          return false;
        }
      } catch {}

      if (followingOnly) return followingIds.includes(l.id);
      return true;
    }).map((l) => ({
      id: l.id,
      name: l.name,
      avatar: l.avatar,
      xp: l.xp,
      streak: l.streak,
      level: l.level,
      isSelf: false,
    }));

    if (!hideLeaderboard) {
      list.push(selfRow);
    }

    const sorted = list.sort((a, b) => b.xp - a.xp);

    return sorted.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }

  static getActivityFeed(userId: string): ActivityItem[] {
    const today = new Date();
    const following = this.getFollowing(userId);

    const allEvents: ActivityItem[] = [
      {
        id: "feed-1",
        userName: "Sophia Chen",
        userAvatar: "SC",
        activity: "completed today's daily goals (+50 XP) 🎯",
        timestamp: new Date(today.getTime() - 15 * 60 * 1000).toISOString(),
      },
      {
        id: "feed-2",
        userName: "Liam Johnson",
        userAvatar: "LJ",
        activity: "reached Level 6! ⭐",
        timestamp: new Date(today.getTime() - 2 * 3600 * 1000).toISOString(),
      },
      {
        id: "feed-3",
        userName: "Emma Garcia",
        userAvatar: "EG",
        activity: "unlocked the 'Perfect Quiz' epic badge! 🏆",
        timestamp: new Date(today.getTime() - 4 * 3600 * 1000).toISOString(),
      },
      {
        id: "feed-4",
        userName: "Noah Patel",
        userAvatar: "NP",
        activity: "maintained a study streak of 3 days! 🔥",
        timestamp: new Date(today.getTime() - 9 * 3600 * 1000).toISOString(),
      },
      {
        id: "feed-5",
        userName: "Isabella Vance",
        userAvatar: "IV",
        activity: "completed a lesson module (+25 XP) 📄",
        timestamp: new Date(today.getTime() - 18 * 3600 * 1000).toISOString(),
      },
    ];

    return allEvents.filter((item) => {
      const learner = MOCK_LEARNERS.find((l) => l.name === item.userName);
      return learner ? following.includes(learner.id) : false;
    });
  }
}
