"use client";

import { memo } from "react";
import { Flame, Calendar, Award } from "lucide-react";
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

export const ProfileHero = memo(function ProfileHero({ 
  profileName, 
  email, 
  initial, 
  joinDate, 
  userTags, 
  xp, 
  streak, 
  onEditProfile 
}: ProfileHeroProps) {
  const levelInfo = calculateLevel(xp);
  const level = levelInfo.level;
  const xpInCurrentLevel = levelInfo.xpInLevel;
  const progressToNextLevel = levelInfo.progressPercentage;

  return (
    <div
      className="bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-lg flex flex-col gap-6 w-full transition-all duration-500 ease-out hover:bg-[#151515] hover:border-white/[0.15] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 select-none">
        
        {/* LEFT GROUP: Identity Stack (Left Aligned) */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-transparent border border-purple-500/30 flex items-center justify-center text-2xl font-semibold text-white">
              {initial}
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#0A0A0A] rounded-full border border-white/10 flex items-center justify-center shadow-lg">
              <Award className="text-zinc-500" size={10}/>
            </div>
          </div>
          
          {/* Left-aligned text info */}
          <div className="flex flex-col text-left min-w-0">
            <h2 className="text-xl font-semibold text-white tracking-tight leading-tight truncate mb-0.5">{profileName}</h2>
            <p className="text-xs text-zinc-500 truncate mb-1.5">{email}</p>
            <div className="flex items-center gap-1 text-white/30">
              <Calendar size={10}/>
              <span className="text-[9px] font-medium tracking-wide uppercase">{joinDate}</span>
            </div>
          </div>
        </div>

        {/* RIGHT GROUP: Stats, Tags & Edit Profile */}
        <div className="flex flex-wrap items-center gap-4 md:gap-8 justify-between md:justify-end">
          {/* Level */}
          <div className="flex flex-col text-center">
            <span className="text-3xl font-bold tracking-tight text-white leading-none">Lv. {level}</span>
            <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase mt-1">Level</span>
          </div>
          
          {/* Streak */}
          <div className="flex flex-col text-center">
            <div className="flex items-center gap-1 leading-none justify-center">
              <span className="text-3xl font-bold tracking-tight text-white leading-none">{streak}</span>
              <Flame size={16} className="text-purple-400 fill-purple-400/20 animate-pulse" />
            </div>
            <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase mt-1">Streak</span>
          </div>

          {/* Role Tag & Edit Button */}
          <div className="flex items-center gap-3">
            {userTags.length > 0 && (
              <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-white/[0.03] border border-white/[0.08] text-white">
                {userTags[0]}
              </span>
            )}
            <button 
              onClick={onEditProfile}
              className="px-4 py-2 bg-white/[0.08] border border-white/[0.12] hover:bg-white/[0.12] rounded-xl text-xs font-semibold text-white cursor-pointer active:scale-[0.97] transition-all"
            >
              Edit Profile
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Row: Minimal XP Bar (spanning cleanly across the bottom) */}
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
