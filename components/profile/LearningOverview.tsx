"use client";

import { memo } from "react";
import { BookOpen, BrainCircuit, Target, Clock, Flame } from "lucide-react";

interface StatItemProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  colSpan?: string;
}

const StatItem = memo(function StatItem({ icon, value, label, colSpan = "" }: StatItemProps) {
  return (
    <div
      className={`bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-lg transition-all duration-500 ease-out hover:bg-[#151515] hover:border-white/[0.15] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] ${colSpan}`}
    >
      <div className="mb-2 text-zinc-500 shrink-0">{icon}</div>
      <span className="text-3xl font-semibold tracking-tight text-white leading-none mb-1">{value}</span>
      <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase text-center">{label}</span>
    </div>
  );
});

interface LearningOverviewProps {
  docCount: number;
  quizzesCount: number;
  avgScore: number;
  bestScore: number;
  streak: number;
  totalStudyHours?: number;
}

export const LearningOverview = memo(function LearningOverview({
  docCount,
  quizzesCount,
  avgScore,
  streak,
  totalStudyHours = 0,
}: LearningOverviewProps) {
  const stats = [
    { icon: <BookOpen size={18} />, value: docCount, label: "Lessons" },
    { icon: <BrainCircuit size={18} />, value: quizzesCount, label: "Quizzes" },
    { icon: <Target size={18} />, value: `${avgScore}%`, label: "Avg Score" },
    { icon: <Flame size={18} />, value: streak, label: "Day Streak" },
    { icon: <Clock size={18} />, value: totalStudyHours > 0 ? `${Math.round(totalStudyHours)}h` : "--", label: "Study Hours" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      {stats.map((stat, i) => (
        <StatItem 
          key={stat.label} 
          icon={stat.icon} 
          value={stat.value} 
          label={stat.label} 
          colSpan={i === 4 ? "col-span-2" : ""}
        />
      ))}
    </div>
  );
});
