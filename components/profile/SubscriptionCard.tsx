"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Crown, Check } from "lucide-react";

interface SubscriptionCardProps {
  plan?: "free" | "pro" | "enterprise";
}

const planConfig = {
  free: {
    label: "Free",
    color: "text-white/50",
    badge: "bg-white/5 border-white/10 text-white/50",
    description: "Access to core learning features. Upgrade anytime for advanced tools.",
    features: ["AI summaries", "Flashcards", "Quizzes", "AI Tutor"],
  },
  pro: {
    label: "Pro",
    color: "text-amber-400",
    badge: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    description: "Unlock advanced features and unlimited study sessions.",
    features: ["Everything in Free", "Unlimited uploads", "Advanced analytics", "Priority AI Tutor"],
  },
  enterprise: {
    label: "Enterprise",
    color: "text-omnave-primary",
    badge: "bg-omnave-primary/10 border-omnave-primary/20 text-omnave-primary",
    description: "For teams and institutions with custom needs.",
    features: ["Everything in Pro", "Team management", "Custom AI models", "Dedicated support"],
  },
};

export const SubscriptionCard = memo(function SubscriptionCard({ plan = "free" }: SubscriptionCardProps) {
  const config = planConfig[plan];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-black/[0.4] border border-white/[0.1] backdrop-blur-2xl rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl flex flex-col w-full"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Crown size={20} className={config.color} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{config.label} Plan</h3>
            <p className="text-xs text-white/50 mt-0.5">{config.description}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-widest ${config.badge}`}>
          {config.label}
        </span>
      </div>

      <div className="space-y-3">
        {config.features.map((feature) => (
          <div key={feature} className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Check size={10} className="text-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-white/70">{feature}</span>
          </div>
        ))}
      </div>

      {plan === "free" && (
        <button
          disabled
          className="w-full mt-6 py-2.5 bg-white/5 text-white/40 text-sm font-bold rounded-xl border border-white/10 cursor-not-allowed"
        >
          Upgrade Plan — Coming Soon
        </button>
      )}
    </motion.div>
  );
});
