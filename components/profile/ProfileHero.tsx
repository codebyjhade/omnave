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
      className="bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-lg flex flex-col w-full transition-all duration-500 ease-out hover:bg-[#151515] hover:border-white/[0.15] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
    >

      {/* Top Section: Split into Left and Right Columns */}
      <div className="flex flex-row justify-between gap-6 relative z-10 select-none">
        
        {/* LEFT COLUMN: Centered Identity Stack */}
        <div className="flex flex-col items-center text-center shrink-0 w-32">
          {/* Avatar */}
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-transparent border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)] flex items-center justify-center text-3xl font-semibold text-white">
              {initial}
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#0A0A0A] rounded-full border border-white/10 flex items-center justify-center shadow-lg">
              <Award className="text-zinc-500" size={12}/>
            </div>
          </div>
          {/* Centered Typography */}
          <h2 className="text-lg font-semibold text-white tracking-tight leading-none mb-1 truncate w-full">{profileName}</h2>
          <p className="text-[10px] text-zinc-500 mb-2 truncate w-full">{email}</p>
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
              <span className="text-3xl font-semibold tracking-tight text-white leading-none">{level}</span>
              <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mt-1">Level</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-semibold tracking-tight text-white leading-none">{streak}</span>
              <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mt-1">Streak</span>
            </div>
          </div>

          {/* Fill the Void: Role Badges & Edit Button */}
          <div className="flex flex-col gap-3 px-2 mt-1">
            {/* Compact Badges instead of wrapping text */}
            <div className="flex flex-wrap justify-center gap-1.5">
              {userTags.map((tag) => {
                return (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider whitespace-nowrap bg-white/[0.03] backdrop-blur-md border border-white/[0.08] shadow-inner text-white"
                  >
                    {tag}
                  </span>
                );
              })}
            </div>

            <button 
              onClick={onEditProfile}
              className="w-full py-2 bg-white/[0.08] border border-white/[0.12] hover:bg-white/[0.12] rounded-xl text-xs font-semibold text-white cursor-pointer active:scale-[0.97] transition-all"
            >
              Edit Profile
            </button>
          </div>

        </div>
      </div>

      {/* Bottom Row: Minimal XP Bar */}
      <div className="w-full mt-1 pt-4 border-t border-white/5 relative z-10 select-none">
        <div className="flex justify-between text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-wider">
          <span>XP TO LEVEL {level + 1}</span>
          <span>{xpInCurrentLevel} / 500 XP</span>
        </div>
        <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 rounded-full transition-all duration-300"
            style={{ width: `${progressToNextLevel}%` }}
          />
        </div>
      </div>
    </div>
  );
});
