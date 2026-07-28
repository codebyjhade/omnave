"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface TodaysGoalProps {
  completed: number;
  total: number;
}

export default function TodaysGoal({ completed, total }: TodaysGoalProps) {
  // Guard against zero total to avoid NaN — default to 3 (standard daily goal count)
  const safeTotal = total > 0 ? total : 3;
  const percentage = Math.min(100, Math.round((completed / safeTotal) * 100));

  // SVG circular progress ring math — sized for 60×60 container (cx/cy=30, r=25)
  const radius = 25;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full h-[100px] bg-[#FFFFFF] rounded-[15px] p-[20px] shadow-[0px_10px_20px_rgba(0,0,0,0.09)] flex flex-row items-center justify-between"
    >
      {/* Left: Target Icon PNG + Text Stack */}
      <div className="flex items-center gap-3 min-w-0">
        <Image 
          src="/target-icon.png" 
          alt="Today's Goal" 
          width={40} 
          height={40} 
          className="shrink-0" 
        />

        <div className="flex flex-col gap-0.5 min-w-0">
          {/* Figma: font-medium text-[18px] leading-[27px] */}
          <span className="text-[#000000] font-poppins font-medium text-[18px] leading-[27px]">
            Today&apos;s Goal
          </span>
          {/* Figma: font-normal text-[13px] leading-[20px] */}
          <span className="text-[#525252] font-poppins font-normal text-[13px] leading-[20px]">
            Complete 3 lessons + 1 quiz
          </span>
        </div>
      </div>

      {/*
        Right: SVG Circular Progress Ring
        shrink-0 + min-w/min-h strictly prevents flexbox from squishing into an oval.
        Figma: w-[60px] h-[60px] flex-none isolate.
      */}
      <div
        className="relative flex-none shrink-0 w-[60px] h-[60px] min-w-[60px] min-h-[60px] isolate"
        role="img"
        aria-label={`${percentage}% of today's goal completed`}
      >
        {/* Rotated -90° so arc starts at 12 o'clock position */}
        <svg
          width="60"
          height="60"
          viewBox="0 0 60 60"
          className="-rotate-90"
        >
          {/* Track ring */}
          <circle
            cx="30"
            cy="30"
            r={radius}
            fill="none"
            stroke="#EBEBEB"
            strokeWidth="4"
          />
          {/* Progress arc */}
          <circle
            cx="30"
            cy="30"
            r={radius}
            fill="none"
            stroke="#6949a8"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        {/*
          Percentage label — absolute inset-0 + flex centering guarantees
          the text stays perfectly centred regardless of content length.
          Figma: text-[#6949A8] font-medium text-[14px] text-center.
        */}
        <span className="absolute inset-0 flex items-center justify-center text-[14px] font-poppins font-medium text-[#6949a8] leading-none">
          {percentage}%
        </span>
      </div>
    </motion.div>
  );
}
