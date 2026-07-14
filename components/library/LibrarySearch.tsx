"use client";

import React, { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface LibrarySearchProps {
  value: string;
  onChange: (val: string) => void;
}

export function LibrarySearch({ value, onChange }: LibrarySearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-md rounded-full px-4 py-2 w-full flex items-center gap-3">
      <Search className="w-4 h-4 text-white/40 shrink-0" aria-hidden="true" />
      
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search lessons..."
        className="flex-1 bg-transparent text-white text-xs placeholder:text-white/30 focus:outline-none"
        aria-label="Search lessons"
      />

      <div className="flex items-center gap-2 shrink-0">
        {value && (
          <button
            onClick={() => onChange("")}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all active:scale-90"
            aria-label="Clear search query"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}

        <kbd 
          className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[9px] font-medium text-white/40 transition-colors pointer-events-none"
          title="Press '/' to search"
        >
          /
        </kbd>
      </div>
    </div>
  );
}
