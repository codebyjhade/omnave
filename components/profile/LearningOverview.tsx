"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { BookOpen, BrainCircuit, Target, Clock, Flame } from "lucide-react";

interface StatItemProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  delay: number;
}

const StatItem = memo(function StatItem({ icon, value, label, delay }: StatItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay }}
      className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 flex flex-col items-center justify-center transition-all hover:bg-white/[0.05] shadow-lg"
    >
      <div className="mb-2.5 text-omnave-primary">{icon}</div>
      <span className="text-2xl font-black text-white">{value}</span>
      <span className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase mt-1 text-center">{label}</span>
    </motion.div>
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
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
      {stats.map((stat, i) => (
        <StatItem key={stat.label} icon={stat.icon} value={stat.value} label={stat.label} delay={i * 0.05} />
      ))}
    </div>
  );
});
