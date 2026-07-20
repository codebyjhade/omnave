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
      className={`bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl rounded-2xl px-4 py-4 flex flex-col items-center justify-center text-center transition-colors hover:bg-white/[0.05] shadow-lg ${colSpan}`}
    >
      <div className="mb-2 text-omnave-primary shrink-0">{icon}</div>
      <span className="text-2xl font-black text-white leading-none mb-1">{value}</span>
      <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase text-center">{label}</span>
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
