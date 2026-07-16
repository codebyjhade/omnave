"use client";

import { useUserContext } from "@/context/UserContext";
import { Skeleton } from "@/components/Skeleton";

export default function AIRecommendation() {
  const { insights, loading } = useUserContext();

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-4">
        <div className="flex items-center gap-2 pl-2">
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>
        <Skeleton className="h-[140px] w-full rounded-3xl" />
      </div>
    );
  }
  
  const recommendationText = insights && insights.length > 0 
    ? insights[0] 
    : "You're only one lesson away from completing Biology.";

  return (
    <div className="w-full relative overflow-hidden bg-gradient-to-br from-omnave-primary/40 to-omnave-primary/10 border border-omnave-primary/30 backdrop-blur-xl rounded-[24px] p-6 md:p-8 flex flex-col items-start gap-4 shadow-[0_10px_40px_rgba(127,34,254,0.15)] group">
      
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-white/10 transition-colors duration-700" />

      <div className="flex items-center gap-2 text-white mb-2 pl-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
        <span className="text-[10px] font-extrabold tracking-[0.2em] text-neutral-500 uppercase">AI Recommendation</span>
      </div>

      <h3 className="text-lg md:text-2xl font-bold text-white leading-tight max-w-[90%] drop-shadow-md">
        {recommendationText}
      </h3>

      <button className="mt-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm transition-all active:scale-95 shadow-premium-glass cursor-pointer">
        View Details
      </button>
    </div>
  );
}