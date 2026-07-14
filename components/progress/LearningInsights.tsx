"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import type { ProgressInsight } from "@/hooks/useProgressStats";

interface LearningInsightsProps {
  insights: ProgressInsight[];
}

const insightIcon = {
  positive: <TrendingUp size={14} className="text-emerald-400" />,
  neutral: <Sparkles size={14} className="text-blue-400" />,
  action: <ArrowRight size={14} className="text-amber-400" />,
};

export const LearningInsights = memo(function LearningInsights({
  insights,
}: LearningInsightsProps) {
  if (insights.length === 0) return null;

  return (
    <section aria-labelledby="learning-insights-heading">
      <div className="space-y-3">
        <h2
          id="learning-insights-heading"
          className="text-[10px] md:text-xs font-black tracking-[0.3em] uppercase text-white/40 px-1"
        >
          Learning Insights
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="bg-omnave-surface border border-white/10 rounded-[24px] shadow-premium-glass backdrop-blur-md p-4 hover:border-white/20 transition-colors duration-150"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-violet-400" aria-hidden="true" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
              Personalized for you
            </span>
          </div>

          <ul className="space-y-2.5" role="list">
            {insights.map((insight, i) => (
              <motion.li
                key={insight.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: i * 0.05 }}
                className="flex items-start gap-2.5 text-sm text-white/80 leading-snug"
              >
                <span className="mt-0.5 shrink-0" aria-hidden="true">
                  {insightIcon[insight.type]}
                </span>
                <span>{insight.text}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
});
