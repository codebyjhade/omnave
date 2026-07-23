"use client";

import { memo } from "react";
import type { SubjectScore } from "@/hooks/useProgressStats";

interface SubjectPerformanceProps {
  subjects: SubjectScore[];
}

export const SubjectPerformance = memo(function SubjectPerformance({
  subjects,
}: SubjectPerformanceProps) {
  if (subjects.length === 0) return null;

  return (
    <div
      className="bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-lg flex flex-col w-full"
    >
      <ul className="space-y-1" role="list">
        {subjects.map((subject) => (
          <li
            key={subject.subject}
            className="relative py-4 border-b border-white/[0.04] last:border-b-0"
          >
            <div className="flex items-center justify-between gap-3 px-1">
              <span className="text-sm font-bold text-white truncate">
                {subject.subject}
              </span>
              <span className="text-xs font-bold text-white/55 shrink-0">
                {subject.score}%
              </span>
            </div>
            
            {/* Razor-Thin Progress Bar */}
            <div 
              className="w-full h-[2px] bg-white/5 mt-3 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={subject.score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${subject.subject} mastery: ${subject.score}%`}
            >
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${subject.score}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
});
