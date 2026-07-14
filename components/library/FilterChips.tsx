"use client";

import React from "react";
import { motion } from "framer-motion";

export type FilterId = "all" | "recent" | "in-progress" | "completed" | "favorites" | "ready";

interface FilterChipsProps {
  activeFilter: FilterId;
  onFilterChange: (id: FilterId) => void;
}

const CHIPS: { id: FilterId; label: string }[] = [
  { id: "all",         label: "All" },
  { id: "recent",      label: "Recent" },
  { id: "ready",       label: "Ready" },
  { id: "in-progress", label: "In Progress" },
  { id: "completed",   label: "Completed" },
  { id: "favorites",   label: "Favorites" },
];

export function FilterChips({ activeFilter, onFilterChange }: FilterChipsProps) {
  return (
    <div 
      className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-1.5 -my-1.5 w-full max-w-full select-none px-4 sm:px-0 scroll-smooth snap-x snap-mandatory"
      aria-label="Filter study materials"
    >
      {CHIPS.map(({ id, label }) => {
        const isActive = activeFilter === id;
        return (
          <button
            key={id}
            onClick={() => onFilterChange(id)}
            className={
              isActive
                ? "relative px-4 py-2.5 rounded-full text-xs font-black whitespace-nowrap text-white transition-colors duration-200 focus:outline-none min-h-[44px] snap-start shrink-0 cursor-pointer"
                : "relative px-4 py-2.5 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 focus:outline-none min-h-[44px] snap-start shrink-0 cursor-pointer"
            }
          >
            {/* Animated Active Background pill */}
            {isActive && (
              <motion.div
                layoutId="activeFilterPill"
                className="absolute inset-0 bg-omnave-primary rounded-full -z-10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}

            {label}
          </button>
        );
      })}
    </div>
  );
}
