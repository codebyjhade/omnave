"use client";

import { useUserContext } from "@/context/UserContext";
import { Flame, Zap, Award, Sparkles } from "lucide-react";

export default function ProgressOverview() {
  const { gamificationStats, lessons, loading } = useUserContext();

  if (loading) {
    return (
      <div className="bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 shadow-lg shadow-black/40 flex flex-col gap-5 animate-pulse h-full">
        <div className="h-4 w-32 bg-white/[0.06] rounded" />
        <div className="grid grid-cols-2 gap-4 mt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white/[0.04] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const isZeroState = lessons.length === 0;

  const stats = [
    {
      label: "Streak",
      value: isZeroState ? "0 days" : `${gamificationStats?.currentStreak || 0} days`,
      icon: <Flame size={20} strokeWidth={1.5} className="text-zinc-500" />,
    },
    {
      label: "Total XP",
      value: isZeroState
        ? "0 XP"
        : `${(gamificationStats?.currentXp || 0) >= 1000 ? ((gamificationStats?.currentXp || 0) / 1000).toFixed(1) + "k" : (gamificationStats?.currentXp || 0)} XP`,
      icon: <Zap size={20} strokeWidth={1.5} className="text-zinc-500" />,
    },
    {
      label: "Level",
      value: `Lvl ${gamificationStats?.currentLevel || 1}`,
      icon: <Award size={20} strokeWidth={1.5} className="text-zinc-500" />,
    },
    {
      label: "Next Lvl",
      value: isZeroState ? "100 XP" : `${gamificationStats?.xpNeeded || 100} XP`,
      icon: <Sparkles size={20} strokeWidth={1.5} className="text-zinc-500" />,
    },
  ];

  return (
    <div className="bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 shadow-lg shadow-black/40 flex flex-col gap-5 h-full transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-900/10 hover:border-white/10">
      {/* Internal Section Header */}
      <span className="text-[11px] font-bold tracking-[0.15em] text-zinc-500 uppercase">
        Your Progress
      </span>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl flex flex-col items-start text-left"
          >
            <div className="flex w-full justify-between items-center text-zinc-500">
              <span className="text-[10px] font-medium tracking-wide uppercase">
                {stat.label}
              </span>
              {stat.icon}
            </div>
            <span className="text-lg font-semibold text-white mt-2">
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}