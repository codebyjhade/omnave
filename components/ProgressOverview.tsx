"use client";

import { useUserContext } from "@/context/UserContext";
import { Flame, Zap, Award, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function ProgressOverview() {
  const { gamificationStats, lessons, loading } = useUserContext();

  if (loading) {
    return (
      <div className="bg-omnave-surface border-none rounded-[15px] p-[20px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] flex flex-col gap-5 animate-pulse h-full">
        <div className="h-4 w-32 bg-omnave-border rounded" />
        <div className="grid grid-cols-2 gap-4 mt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-omnave-border/60 rounded-[15px]" />
          ))}
        </div>
      </div>
    );
  }

  const isZeroState = lessons.length === 0;
  const springTransition = { type: "spring" as const, stiffness: 400, damping: 25 };

  const stats = [
    {
      label: "Streak",
      value: isZeroState ? "0 days" : `${gamificationStats?.currentStreak || 0} days`,
      icon: <Flame size={20} strokeWidth={1.5} className="text-[#6949a8]" />,
      accent: "text-[#6949a8]",
    },
    {
      label: "Total XP",
      value: isZeroState
        ? "0 XP"
        : `${(gamificationStats?.currentXp || 0) >= 1000 ? ((gamificationStats?.currentXp || 0) / 1000).toFixed(1) + "k" : (gamificationStats?.currentXp || 0)} XP`,
      icon: <Zap size={20} strokeWidth={1.5} className="text-[#6949a8]" />,
      accent: "text-[#6949a8]",
    },
    {
      label: "Level",
      value: `Lvl ${gamificationStats?.currentLevel || 1}`,
      icon: <Award size={20} strokeWidth={1.5} className="text-omnave-secondary-text" />,
      accent: "text-omnave-primary-text",
    },
    {
      label: "Next Lvl",
      value: isZeroState ? "100 XP" : `${gamificationStats?.xpNeeded || 100} XP`,
      icon: <Sparkles size={20} strokeWidth={1.5} className="text-omnave-secondary-text" />,
      accent: "text-omnave-primary-text",
    },
  ];

  return (
    <motion.div 
      whileTap={{ scale: 0.95 }}
      transition={springTransition}
      className="bg-omnave-surface border-none rounded-[15px] p-[20px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] flex flex-col gap-5 h-full cursor-pointer select-none"
    >
      {/* Internal Section Header */}
      <span className="text-[11px] font-bold tracking-[0.2em] text-omnave-secondary-text uppercase font-poppins">
        Your Progress
      </span>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="p-4 bg-black/[0.01] border border-omnave-border rounded-[15px] flex flex-col items-start text-left"
          >
            <div className="flex w-full justify-between items-center text-omnave-secondary-text">
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-omnave-secondary-text font-poppins">
                {stat.label}
              </span>
              {stat.icon}
            </div>
            <span className={`text-lg font-semibold tracking-tight mt-2 font-poppins ${stat.accent}`}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}