"use client";

import { memo } from "react";
import { useUserContext } from "@/context/UserContext";
import { Calendar, Sparkles } from "lucide-react";

export const XpHistoryWidget = memo(function XpHistoryWidget() {
  const { xpHistory } = useUserContext();

  return (
    <section aria-labelledby="xp-history-heading" className="space-y-3">
      <h2 id="xp-history-heading" className="text-[10px] md:text-xs font-black tracking-[0.3em] uppercase text-white/40 px-1">
        XP Log History
      </h2>
      <div className="bg-omnave-surface border border-white/10 rounded-[24px] shadow-premium-glass backdrop-blur-md p-5">
        {xpHistory.length === 0 ? (
          <p className="text-xs text-white/40 font-medium py-6 text-center">No XP actions recorded yet.</p>
        ) : (
          <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-hide" role="log">
            {xpHistory.slice(0, 10).map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-white">{item.activity}</span>
                  <span className="text-[9px] font-semibold text-white/60 flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                </div>
                <span className="text-[9px] font-black text-amber-600 dark:text-amber-450 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 px-2 py-0.5 rounded-lg shrink-0">
                  +{item.xp} XP
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
});
