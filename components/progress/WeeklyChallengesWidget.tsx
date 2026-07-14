"use client";

import { memo } from "react";
import { useUserContext } from "@/context/UserContext";
import { CheckCircle2, Circle } from "lucide-react";

export const WeeklyChallengesWidget = memo(function WeeklyChallengesWidget() {
  const { tasks } = useUserContext();

  return (
    <section aria-labelledby="weekly-challenges-heading" className="space-y-3">
      <h2 id="weekly-challenges-heading" className="text-[10px] md:text-xs font-black tracking-[0.3em] uppercase text-white/40 px-1">
        Weekly Challenges
      </h2>
      <div className="bg-omnave-surface border border-white/10 rounded-[24px] shadow-premium-glass backdrop-blur-md p-5">
        <ul className="space-y-3.5" role="list">
          {tasks.weeklyChallenges.map((item) => {
            const pct = Math.round((item.progress / item.target) * 100);
            return (
              <li key={item.id} className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    {item.completed ? (
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <Circle size={16} className="text-white/40 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <span className={`text-xs font-bold block leading-none ${item.completed ? "text-white/40 line-through" : "text-white"}`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] text-white/60 block mt-1.5 leading-normal">
                        {item.description}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 px-1.5 py-0.5 rounded-md shrink-0">
                    +{item.rewardXp} XP
                  </span>
                </div>

                <div className="flex items-center justify-between text-[9px] font-bold text-white/60 pt-1">
                  <div className="w-2/3 bg-white/5 h-1 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span>{item.progress} / {item.target}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
});
