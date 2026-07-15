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
      className="bg-gradient-to-br from-[#2e1a5e] to-[#130E24] border border-purple-500/20 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-[0_8px_30px_rgba(88,28,135,0.15)] flex flex-col w-full"
    >
      {/* Decorative Radial Glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 blur-[50px] rounded-full pointer-events-none" aria-hidden="true"></div>

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-purple-500/20 text-purple-300 p-2.5 rounded-xl flex items-center justify-center shrink-0">
            <Crown size={20} className="text-purple-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{config.label} Plan</h3>
            <p className="text-xs text-white/50 mt-0.5">{config.description}</p>
          </div>
        </div>
        <span className="bg-white/10 border border-white/10 text-xs font-bold px-3 py-1 rounded-full text-purple-200 tracking-wider">
          FREE
        </span>
      </div>

      <div className="space-y-3 relative z-10">
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
          className="w-full py-3 mt-6 rounded-xl bg-white/5 border border-white/10 text-white/80 font-medium hover:bg-white/10 hover:text-white transition-all cursor-pointer relative z-10"
        >
          Upgrade Plan — Coming Soon
        </button>
      )}
    </motion.div>
  );
});
