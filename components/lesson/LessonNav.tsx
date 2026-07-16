"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { BookOpen, BrainCircuit, Presentation, FileQuestion } from "lucide-react";

export type TabId = "summary" | "quiz" | "slides" | "exam";

interface LessonNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: "summary", label: "Summary", icon: <BookOpen size={14} /> },
  { id: "quiz", label: "Quiz", icon: <BrainCircuit size={14} /> },
  { id: "slides", label: "Flashcards", icon: <Presentation size={14} /> },
  { id: "exam", label: "Exam", icon: <FileQuestion size={14} /> },
];

export const LessonNav = memo(function LessonNav({ activeTab, onTabChange }: LessonNavProps) {
  return (
    <div className="sticky top-[88px] z-30 bg-transparent transition-colors duration-150 w-full mb-2">
      <div className="flex items-center gap-1 overflow-x-auto w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-1 py-1 bg-white/5 border border-white/5 rounded-2xl" role="tablist" aria-label="Study modes">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            id={`tab-${item.id}`}
            role="tab"
            aria-selected={activeTab === item.id}
            aria-controls={`panel-${item.id}`}
            className={`
              relative flex items-center justify-center space-x-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap min-h-[40px] flex-shrink-0 active:scale-95 transition-all duration-200 cursor-pointer
              ${activeTab === item.id ? "text-white" : "text-white/60 hover:text-white"}
            `}
          >
            {activeTab === item.id && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 bg-omnave-primary/15 border border-omnave-primary/30 rounded-xl shadow-[0_0_15px_rgba(127,34,254,0.15)]"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center space-x-2">
              {item.icon}
              <span>{item.label}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});
