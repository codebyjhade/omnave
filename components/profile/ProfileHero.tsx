"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Flame, Calendar, Award, Settings } from "lucide-react";
import Link from "next/link";
import { calculateLevel } from "@/lib/gamification";

interface ProfileHeroProps {
  username: string;
  email: string;
  xp: number;
  streak: number;
  joinDate: string;
}

function formatJoinDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return "Recently";
  }
}

export const ProfileHero = memo(function ProfileHero({ username, email, xp, streak, joinDate }: ProfileHeroProps) {
  const levelInfo = calculateLevel(xp);
  const level = levelInfo.level;
  const xpInCurrentLevel = levelInfo.xpInLevel;
  const progressToNextLevel = levelInfo.progressPercentage;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-black/[0.4] border border-white/[0.1] backdrop-blur-2xl rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl"
    >
      {/* Ambient Inner Glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-omnave-primary/15 blur-[100px] rounded-full pointer-events-none" aria-hidden="true" />

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-omnave-primary/20 border-2 border-omnave-primary/40 flex items-center justify-center text-2xl md:text-3xl font-black text-omnave-primary shadow-xs">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#151C2C] border border-white/10 flex items-center justify-center">
            <Award size={14} className="text-amber-400" />
          </div>
        </div>
 
        {/* Info */}
        <div className="flex-1 text-center sm:text-left min-w-0 w-full">
          <div className="flex items-center justify-between gap-3 w-full">
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight truncate text-left">{username}</h1>
            <Link
              href="/settings"
              className="h-11 w-11 sm:h-10 sm:w-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all shrink-0 active:scale-[0.96]"
              title="App Settings"
              aria-label="omnave. Settings"
            >
              <Settings size={16} className="text-white/70" />
            </Link>
          </div>
          <p className="text-sm text-white/50 mt-1 truncate text-left sm:text-left">{email}</p>
 
          {/* Level & Streak Row */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.02] border border-white/5 rounded-full text-xs font-semibold text-white/50">
              <Award size={12} className="text-amber-400" />
              Level {level}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.02] border border-white/5 rounded-full text-xs font-semibold text-white/50">
              <Flame size={12} className="text-orange-400" />
              {streak} day streak
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.02] border border-white/5 rounded-full text-xs font-semibold text-white/50">
              <Calendar size={12} className="text-white/40" />
              Joined {formatJoinDate(joinDate)}
            </span>
          </div>
 
          {/* XP Progress Bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">XP to Level {level + 1}</span>
              <span className="text-[10px] font-bold text-omnave-primary">{xpInCurrentLevel} / 500 XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Absolute Bottom-Edge Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5" role="progressbar" aria-valuenow={progressToNextLevel} aria-valuemin={0} aria-valuemax={100} aria-label="XP to next level">
        <motion.div
          className="h-full bg-omnave-primary shadow-[0_0_10px_rgba(var(--omnave-primary),0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${progressToNextLevel}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
});
