"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { SubjectScore } from "@/hooks/useProgressStats";

interface SubjectPerformanceProps {
  subjects: SubjectScore[];
}

export const SubjectPerformance = memo(function SubjectPerformance({
  subjects,
}: SubjectPerformanceProps) {
  if (subjects.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-black/[0.4] border border-white/[0.1] backdrop-blur-2xl rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl flex flex-col w-full"
    >
      {/* Ambient Inner Glow */}
      <div className="absolute -top-[50%] -right-[20%] w-[500px] h-[500px] bg-omnave-primary/20 blur-[120px] rounded-full pointer-events-none" aria-hidden="true" />
      <ul className="space-y-2.5" role="list">
        {subjects.map((subject, i) => (
          <motion.li
            key={subject.subject}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: i * 0.04 }}
            className="relative overflow-hidden bg-white/[0.02] border border-white/5 rounded-xl py-3 px-4"
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-sm font-bold text-white truncate">
                {subject.subject}
              </span>
              <span className="text-xs font-bold text-white/55 shrink-0">
                {subject.score}%
              </span>
            </div>
            
            {/* Absolute Bottom-Edge Progress Bar */}
            <div 
              className="absolute bottom-0 left-0 w-full h-[3px] bg-white/10"
              role="progressbar"
              aria-valuenow={subject.score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${subject.subject} mastery: ${subject.score}%`}
            >
              <div
                className="h-full bg-gradient-to-r from-omnave-primary to-purple-400 shadow-[0_0_10px_rgba(127,34,254,0.5)] transition-all duration-300"
                style={{ width: `${subject.score}%` }}
              />
            </div>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
});
