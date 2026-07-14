"use client";

import React from "react";
import { Skeleton } from "@/components/Skeleton";

export function LoadingSkeleton() {
  return (
    <div className="w-full flex flex-col space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-48 sm:w-64 rounded-lg" />
          <Skeleton className="h-4 w-full max-w-[24rem] rounded-lg" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
      </div>

      {/* Search Input Skeleton */}
      <Skeleton className="h-12 w-full rounded-xl" />

      {/* Filter Chips Skeleton */}
      <div className="flex gap-2 overflow-x-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-xl shrink-0" />
        ))}
      </div>

      {/* Continue Learning Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-36 w-full rounded-3xl" />
      </div>

      {/* Grid of Lesson Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-white/5 rounded-3xl p-5 h-[280px] flex flex-col justify-between bg-white/[0.02]">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-14 rounded" />
                <Skeleton className="h-4 w-6 rounded" />
              </div>
              <Skeleton className="h-5 w-4/5 rounded" />
              <div className="space-y-1.5 pt-1">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-5/6 rounded" />
              </div>
            </div>
            
            <div className="space-y-3 pt-3 border-t border-white/5">
              <Skeleton className="h-1.5 w-full rounded" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-7 w-20 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
