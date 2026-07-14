"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Circle, CheckCircle2 } from "lucide-react";
import { useUserContext } from "@/context/UserContext";

interface UpcomingGoalsProps {
  title?: string;
}

export const UpcomingGoals = memo(function UpcomingGoals({
  title = "Upcoming Goals",
}: UpcomingGoalsProps) {
  const { tasks } = useUserContext();
  const goals = tasks.dailyGoals;

  return (
    <section aria-labelledby="upcoming-goals-heading">
      <div className="space-y-3">
        <h2
          id="upcoming-goals-heading"
          className="text-[10px] md:text-xs font-black tracking-[0.3em] uppercase text-white/40 px-1"
        >
          {title}
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-omnave-surface border border-white/10 rounded-[24px] shadow-premium-glass backdrop-blur-md p-4 md:p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
        >
          <ul className="space-y-2.5" role="list">
            {goals.map((goal, i) => (
              <motion.li
                key={goal.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: i * 0.05 }}
              >
                <div
                  className="w-full flex items-center gap-3 p-2.5 -mx-1 rounded-xl text-left hover:bg-white/5 transition-colors duration-150 min-h-[44px]"
                  aria-label={`Goal: ${goal.title}`}
                >
                  {goal.completed ? (
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" aria-hidden="true" />
                  ) : (
                    <Circle size={18} className="text-white/40 shrink-0" aria-hidden="true" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm font-bold block ${
                        goal.completed ? "text-white/40 line-through" : "text-white"
                      }`}
                    >
                      {goal.title}
                    </span>
                    <span className="text-[10px] font-semibold text-white/60 block mt-0.5">
                      {goal.description}
                    </span>
                  </div>
                  <span className="text-xs font-black text-white/60 shrink-0">
                    {goal.progress} / {goal.target}
                  </span>
                </div>
              </motion.li>
            ))}
          </ul>

          <p className="text-[10px] text-white/40 font-bold mt-3 pt-3 border-t border-white/5">
            Goals adapt dynamically based on your daily learning activity.
          </p>
        </motion.div>
      </div>
    </section>
  );
});
