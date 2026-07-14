"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Flame, Star, Target, Zap } from "lucide-react";

interface SnapshotMetricProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  delay?: number;
}

const SnapshotMetric = memo(function SnapshotMetric({
  icon,
  value,
  label,
  delay = 0,
}: SnapshotMetricProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay }}
      className="flex items-center gap-3 min-w-0"
    >
      <div
        className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white/80"
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-black text-white leading-none truncate">
          {value}
        </p>
        <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mt-0.5">
          {label}
        </p>
      </div>
    </motion.div>
  );
});

interface LearningSnapshotProps {
  currentLevel: number;
  xp: number;
  streak: number;
  completionRate: number;
}

export const LearningSnapshot = memo(function LearningSnapshot({
  currentLevel,
  xp,
  streak,
  completionRate,
}: LearningSnapshotProps) {
  return (
    <section aria-label="Learning snapshot">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-omnave-surface border border-white/10 rounded-[24px] shadow-premium-glass backdrop-blur-md p-4 sm:p-5 transition-colors duration-150"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SnapshotMetric
            icon={<Star size={16} className="text-amber-400" />}
            value={`Lv. ${currentLevel}`}
            label="Current Level"
            delay={0}
          />
          <SnapshotMetric
            icon={<Zap size={16} className="text-emerald-400" />}
            value={xp.toLocaleString()}
            label="Study Points"
            delay={0.05}
          />
          <SnapshotMetric
            icon={<Flame size={16} className="text-orange-400" />}
            value={`${streak}d`}
            label="Current Streak"
            delay={0.1}
          />
          <SnapshotMetric
            icon={<Target size={16} className="text-blue-400" />}
            value={`${completionRate}%`}
            label="Completion Rate"
            delay={0.15}
          />
        </div>
      </motion.div>
    </section>
  );
});
