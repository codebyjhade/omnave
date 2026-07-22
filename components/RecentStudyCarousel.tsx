"use client";

import { useLessons } from "@/hooks/useLessons";
import { useProgress } from "@/hooks/useProgress";
import { calculateKitProgress } from "@/hooks/useProgressStats";
import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";

export default function RecentStudyCarousel() {
  const { lessons, loading } = useLessons();
  const { quizScores } = useProgress();

  if (loading) {
    return (
      <div className="bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 shadow-lg shadow-black/40 flex flex-col gap-5 animate-pulse h-full">
        <div className="h-4 w-32 bg-white/[0.06] rounded" />
        <div className="flex overflow-x-auto gap-4 mt-2 hide-scrollbar">
          {[1, 2].map((i) => (
            <div key={i} className="min-w-[200px] h-32 bg-white/[0.04] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const mockMaterials = [
    {
      id: "demo-welcome",
      title: "Welcome & Study Guide",
      cardCount: 12,
      progress: 100,
      isDemo: true,
    },
    {
      id: "demo-recall",
      title: "Active Recall Techniques",
      cardCount: 8,
      progress: 60,
      isDemo: true,
    },
  ];

  const displayMaterials = [
    ...lessons.map((l) => {
      const base = l.file_path.split("/").pop() || "";
      const cleanName = base.replace(/^\d+_/, "").replace(".pdf", "") || "Study Material";
      const title = l.is_processed && l.title ? l.title : cleanName;
      const progress = calculateKitProgress(l, quizScores);
      return {
        id: l.id,
        title,
        cardCount: Array.isArray(l.flashcards) ? l.flashcards.length : 0,
        progress,
        isDemo: false,
      };
    }),
    ...mockMaterials,
  ].slice(0, 4);

  return (
    <div className="bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl p-6 shadow-lg shadow-black/40 flex flex-col gap-5 h-full transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-900/10 hover:border-white/10">
      {/* Internal Section Header with View All Link */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-[0.15em] text-zinc-500 uppercase">
          Recent Materials
        </span>
        <Link
          href="/library"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-[0.05em]"
        >
          <span>View All</span>
          <ArrowRight size={12} strokeWidth={2} />
        </Link>
      </div>

      {/* Horizontal Scroll Area */}
      <div className="flex overflow-x-auto gap-4 snap-x hide-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {displayMaterials.map((item) => (
          <Link
            key={item.id}
            href={item.isDemo ? "/library" : `/lesson/${item.id}`}
            className="min-w-[200px] snap-start p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl flex flex-col justify-between gap-4 hover:border-white/10 transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.04] flex items-center justify-center shrink-0 text-zinc-400">
                <FileText size={16} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0 text-left">
                <h3 className="text-sm font-medium text-zinc-100 truncate group-hover:text-white">
                  {item.title}
                </h3>
                <p className="text-[10px] text-zinc-500 font-normal">
                  {item.cardCount} cards
                </p>
              </div>
            </div>

            {/* Micro Progress Track */}
            <div className="w-full flex flex-col gap-1.5">
              <div className="w-full h-[2px] bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(item.progress, 5)}%` }}
                />
              </div>
              <span className="text-[9px] text-zinc-500 text-left font-medium">
                {item.progress}% completed
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
