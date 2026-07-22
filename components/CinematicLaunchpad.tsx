"use client";

import React, { memo } from "react";
import Link from "next/link";
import { FileUp, ArrowRight } from "lucide-react";

const CinematicLaunchpad = memo(function CinematicLaunchpad() {
  return (
    <div className="w-full p-6 sm:p-8 bg-[#111111] border border-white/[0.06] border-t-white/[0.12] rounded-3xl flex flex-col items-center justify-center text-center gap-6 shadow-lg shadow-black/40 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-900/10 hover:border-white/10">
      <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-400">
        <FileUp size={20} strokeWidth={1.5} />
      </div>

      <div className="flex flex-col gap-2 max-w-md">
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
          Your workspace is ready
        </h2>
        <p className="text-sm font-normal text-zinc-500 leading-relaxed">
          Upload your first PDF or study document to initialize your personalized AI learning workspace.
        </p>
      </div>

      <Link
        href="/upload"
        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium text-white transition-all active:scale-[0.98]"
      >
        <span>Upload First Document</span>
        <ArrowRight size={20} strokeWidth={1.5} />
      </Link>
    </div>
  );
});

export default CinematicLaunchpad;
