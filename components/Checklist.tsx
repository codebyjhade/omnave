"use client";

import { useUserContext } from "@/context/UserContext";

export default function Checklist() {
  const { tasks } = useUserContext();
  const goals = tasks.dailyGoals;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pl-2 mb-1">
        <span className="text-[10px] font-extrabold tracking-[0.2em] text-neutral-500 uppercase">Upcoming Goals</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
      </div>

      {/* Checklist Card */}
      <div className="w-full p-6 bg-black/[0.4] border border-white/[0.1] backdrop-blur-2xl rounded-3xl flex flex-col gap-5 relative overflow-hidden shadow-2xl">
        {/* Ambient Inner Glow */}
        <div className="absolute -bottom-[20%] -left-[10%] w-[250px] h-[250px] bg-omnave-primary/15 blur-[90px] rounded-full pointer-events-none" aria-hidden="true" />
        
        {goals.map((goal, idx) => (
          <div key={goal.id || idx} className={`flex gap-4 items-start ${goal.completed ? "opacity-50" : "group cursor-pointer"}`}>
            {goal.completed ? (
              <div className="mt-1 flex items-center justify-center size-5 rounded-full bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/50 shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            ) : (
              <div className="mt-1 size-5 rounded-full border-2 border-white/20 group-hover:border-omnave-primary transition-colors shrink-0" />
            )}
            <div className="flex flex-col gap-0.5">
              <span className={`text-sm font-bold text-white ${goal.completed ? "line-through" : "group-hover:text-omnave-primary transition-colors"}`}>
                {goal.title}
              </span>
              <span className="text-[10px] text-white/40">
                {goal.description} {goal.rewardXp ? `(+${goal.rewardXp} XP)` : ""}
              </span>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
