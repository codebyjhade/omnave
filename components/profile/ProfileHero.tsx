"use client";

import { memo } from "react";
import { Flame, Calendar, Award, Settings } from "lucide-react";
import Link from "next/link";
import { calculateLevel } from "@/lib/gamification";

interface ProfileHeroProps {
  profileName: string;
  email: string;
  initial: string;
  joinDate: string;
  userTags: string[];
  xp: number;
  streak: number;
  onEditProfile: () => void;
}

export const ProfileHero = memo(function ProfileHero({ profileName, email, initial, joinDate, userTags, xp, streak, onEditProfile }: ProfileHeroProps) {
  const levelInfo = calculateLevel(xp);
  const level = levelInfo.level;
  const xpInCurrentLevel = levelInfo.xpInLevel;
  const progressToNextLevel = levelInfo.progressPercentage;

  return (
    <div
      className="bg-omnave-surface border border-white/5 shadow-2xl rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden"
    >

      {/* Top Section: Split into Left and Right Columns */}
      <div className="flex flex-row justify-between gap-6 relative z-10 select-none">
        
        {/* LEFT COLUMN: Centered Identity Stack */}
        <div className="flex flex-col items-center text-center shrink-0 w-32">
          {/* Avatar */}
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full bg-[#3b0764] border border-white/10 flex items-center justify-center text-3xl font-black text-purple-400 ring-2 ring-black/20 shadow-inner">
              {initial}
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#0A0A0A] rounded-full border border-white/10 flex items-center justify-center shadow-lg">
              <Award className="text-omnave-primary" size={12}/>
            </div>
          </div>
          {/* Centered Typography */}
          <h2 className="text-lg font-black text-white tracking-tight leading-none mb-1 truncate w-full">{profileName}</h2>
          <p className="text-[10px] text-white/50 mb-2 truncate w-full">{email}</p>
          <div className="flex items-center gap-1 text-white/30">
            <Calendar size={10}/>
            <span className="text-[9px] font-medium tracking-wide uppercase">{joinDate}</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Stats & Action Fill */}
        <div className="flex-1 flex flex-col justify-center">
          
          {/* Stats Row */}
          <div className="flex justify-around items-center text-center mb-4">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white leading-tight">{level}</span>
              <span className="text-[10px] text-white/50 tracking-wide uppercase mt-0.5">Level</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white leading-tight">{streak}</span>
              <span className="text-[10px] text-white/50 tracking-wide uppercase mt-0.5">Streak</span>
            </div>
          </div>

          {/* Fill the Void: Role Badges & Edit Button */}
          <div className="flex flex-col gap-3 px-2 mt-1">
            {/* Compact Badges instead of wrapping text */}
            <div className="flex flex-wrap justify-center gap-1.5">
              {userTags.map((tag, idx) => {
                const isPrimary = idx === 0;
                return (
                  <span
                    key={tag}
                    className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider whitespace-nowrap border ${
                      isPrimary
                        ? "bg-omnave-primary/10 border-omnave-primary/20 text-omnave-primary font-black"
                        : "bg-white/5 border-white/10 text-white/70"
                    }`}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>

            <button 
              onClick={onEditProfile}
              className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white cursor-pointer active:scale-[0.97] active:opacity-80 transition-[background-color,border-color,opacity] duration-100"
            >
              Edit Profile
            </button>
          </div>

        </div>
      </div>

      {/* Bottom Row: Minimal XP Bar */}
      <div className="w-full mt-1 pt-4 border-t border-white/5 relative z-10 select-none">
        <div className="flex justify-between text-[10px] font-bold text-white/40 mb-2 uppercase tracking-wider">
          <span>XP TO LEVEL {level + 1}</span>
          <span>{xpInCurrentLevel} / 500 XP</span>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-omnave-primary rounded-full shadow-[0_0_10px_rgba(127,34,254,0.8)] transform-gpu"
            style={{ width: `${progressToNextLevel}%` }}
          />
        </div>
      </div>
    </div>
  );
});
