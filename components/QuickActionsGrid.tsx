"use client";

import Link from "next/link";
import { UploadCloud, Sparkles, BrainCircuit, HeartCrack } from "lucide-react";
import { motion } from "framer-motion";

const MotionLink = motion(Link);

export default function QuickActionsGrid() {
  const springTransition = { type: "spring" as const, stiffness: 400, damping: 25 };

  const actions = [
    {
      title: "Upload Document",
      desc: "Import PDF to process",
      href: "/upload",
      icon: <UploadCloud size={20} className="text-[#6949a8]" />,
    },
    {
      title: "Generate Quiz",
      desc: "Test your understanding",
      href: "/library",
      icon: <Sparkles size={20} className="text-[#525252]" />,
    },
    {
      title: "Review Weak Spots",
      desc: "Practice difficult cards",
      href: "/progress",
      icon: <HeartCrack size={20} className="text-[#525252]" />,
    },
    {
      title: "Blank Flashcards",
      desc: "Start typing manual cards",
      href: "/upload",
      icon: <BrainCircuit size={20} className="text-[#525252]" />,
    },
  ];

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header Label */}
      <div className="flex items-center">
        <span className="text-[11px] font-bold tracking-[0.2em] text-omnave-secondary-text uppercase font-poppins">
          Quick Actions
        </span>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-2 gap-4 w-full">
        {actions.map((act, index) => (
          <MotionLink
            key={index}
            href={act.href}
            whileTap={{ scale: 0.95 }}
            transition={springTransition}
            className="flex flex-col gap-3 p-4 bg-omnave-surface border-none rounded-[15px] text-left cursor-pointer shadow-[0px_10px_10px_rgba(0,0,0,0.09)] group"
          >
            {/* Action Icon */}
            <div className="w-10 h-10 rounded-xl bg-black/[0.01] border border-omnave-border flex items-center justify-center shrink-0 transition-colors duration-200">
              {act.icon}
            </div>

            {/* Label Titles */}
            <div className="flex flex-col gap-0.5 min-w-0">
              <h4 className="text-xs font-semibold text-omnave-primary-text tracking-tight leading-tight truncate font-poppins">
                {act.title}
              </h4>
              <span className="text-[10px] text-omnave-secondary-text font-medium leading-normal truncate font-poppins">
                {act.desc}
              </span>
            </div>
          </MotionLink>
        ))}
      </div>
    </div>
  );
}
