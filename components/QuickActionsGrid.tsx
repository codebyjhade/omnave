"use client";

import Link from "next/link";
import { UploadCloud, Sparkles, BrainCircuit, HeartCrack } from "lucide-react";

export default function QuickActionsGrid() {
  const actions = [
    {
      title: "Upload Document",
      desc: "Import PDF to process",
      href: "/upload",
      icon: <UploadCloud size={20} className="text-omnave-primary" />,
    },
    {
      title: "Generate Quiz",
      desc: "Test your understanding",
      href: "/library",
      icon: <Sparkles size={20} className="text-amber-500" />,
    },
    {
      title: "Review Weak Spots",
      desc: "Practice difficult cards",
      href: "/progress",
      icon: <HeartCrack size={20} className="text-rose-500" />,
    },
    {
      title: "Blank Flashcards",
      desc: "Start typing manual cards",
      href: "/upload",
      icon: <BrainCircuit size={20} className="text-emerald-500" />,
    },
  ];

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header Label */}
      <div className="flex items-center pl-2">
        <span className="text-[10px] md:text-xs font-extrabold tracking-[0.2em] text-purple-200/50 uppercase">
          Quick Actions
        </span>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-2 gap-4 w-full">
        {actions.map((act, index) => (
          <Link
            key={index}
            href={act.href}
            className="flex flex-col gap-3 p-4 bg-[#1A1433]/80 backdrop-blur-xl border border-white/10 rounded-2xl text-left hover:bg-[#251D4A]/90 transition-[background-color,transform] active:scale-[0.95] duration-100 cursor-pointer shadow-2xl shadow-black/50 group"
          >
            {/* Action Icon */}
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-100">
              {act.icon}
            </div>

            {/* Label Titles */}
            <div className="flex flex-col gap-0.5 min-w-0">
              <h4 className="text-xs font-bold text-white leading-tight truncate">
                {act.title}
              </h4>
              <span className="text-[10px] text-purple-200/40 font-medium leading-normal truncate">
                {act.desc}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
