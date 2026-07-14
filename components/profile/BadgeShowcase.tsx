"use client";

import { memo, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Lock, Sparkles, Trophy, Calendar, Zap, X } from "lucide-react";
import { useUserContext } from "@/context/UserContext";

const rarityStyles = {
  common: {
    border: "border-white/5",
    glow: "shadow-none",
    badgeBg: "bg-white/5",
    badgeBorder: "border-white/10",
    text: "text-white/50",
    accent: "bg-white/5 text-white/50",
  },
  rare: {
    border: "border-purple-500/20",
    glow: "shadow-[0_0_12px_rgba(147,51,234,0.1)]",
    badgeBg: "bg-purple-500/10",
    badgeBorder: "border-purple-500/20",
    text: "text-purple-400",
    accent: "bg-purple-500/10 text-purple-400",
  },
  epic: {
    border: "border-blue-500/20",
    glow: "shadow-[0_0_12px_rgba(59,130,246,0.1)]",
    badgeBg: "bg-blue-500/10",
    badgeBorder: "border-blue-500/20",
    text: "text-blue-400",
    accent: "bg-blue-500/10 text-blue-400",
  },
  legendary: {
    border: "border-amber-500/20",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.12)]",
    badgeBg: "bg-amber-500/10",
    badgeBorder: "border-amber-500/20",
    text: "text-amber-400",
    accent: "bg-amber-500/10 text-amber-400",
  },
};

const getIcon = (iconName: string) => {
  if (iconName === "Upload") return Zap;
  if (iconName === "BookOpen") return Calendar;
  if (iconName === "BrainCircuit") return Trophy;
  if (iconName === "Flame") return Sparkles;
  return Award;
};

export const BadgeShowcase = memo(function BadgeShowcase() {
  const { achievements } = useUserContext();
  const [showAllModal, setShowAllModal] = useState(false);

  const unlockedList = useMemo(() => achievements.filter((a) => a.completed), [achievements]);
  const unlockedCount = unlockedList.length;
  const completionPercentage = Math.round((unlockedCount / achievements.length) * 100);

  const recentAchievement = useMemo(() => {
    return unlockedList.length > 0 ? unlockedList[unlockedList.length - 1] : null;
  }, [unlockedList]);

  const RecentIcon = recentAchievement ? getIcon(recentAchievement.icon) : null;

  return (
    <div className="bg-black/[0.4] border border-white/[0.1] backdrop-blur-2xl rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl space-y-6 flex flex-col w-full">
      {/* Summary Header */}
      <div className="flex items-center justify-between w-full">
        <div className="space-y-1">
          <h3 id="badge-showcase-heading" className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">
            Achievements & Badges
          </h3>
          <span className="text-[10px] text-white/50 font-bold block">
            {unlockedCount} of {achievements.length} badges unlocked
          </span>
        </div>
        <button
          onClick={() => setShowAllModal(true)}
          className="text-[10px] font-bold px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full text-white/70 uppercase tracking-widest transition-all cursor-pointer"
        >
          View All
        </button>
      </div>

      {/* Completion Slider */}
      <div className="space-y-1.5 w-full">
        <div className="flex justify-between text-[9px] font-bold text-white/40 uppercase tracking-widest">
          <span>Overall completion</span>
          <span>{completionPercentage}%</span>
        </div>
      </div>

      {/* Recent Unlock Banner */}
      {recentAchievement && RecentIcon && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-omnave-primary/10 to-transparent border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xs w-full"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-omnave-primary/20 text-omnave-primary flex items-center justify-center shrink-0 border border-omnave-primary/30">
              <RecentIcon size={20} />
            </div>
            <div className="min-w-0 leading-tight">
              <span className="text-[9px] font-black text-omnave-primary uppercase tracking-widest block">
                Recent Unlock
              </span>
              <h4 className="text-xs font-bold text-white block truncate mt-0.5">
                {recentAchievement.title}
              </h4>
              <p className="text-[10px] text-white/50 truncate block mt-0.5">
                {recentAchievement.description}
              </p>
            </div>
          </div>
          <span className="text-[9px] font-extrabold text-amber-500 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl shrink-0">
            +{recentAchievement.rewardXp} XP
          </span>
        </motion.div>
      )}

      {/* Carousel */}
      <div 
        className="flex overflow-x-auto gap-3 py-1.5 scrollbar-hide cursor-grab active:cursor-grabbing select-none w-full"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
        role="list"
        aria-label="Achievements list carousel"
      >
        {achievements.map((item) => {
          const style = rarityStyles[item.rarity] || rarityStyles.common;
          const IconComponent = getIcon(item.icon);
          const pct = Math.round((item.progress / item.target) * 100);

          return (
            <div
              key={item.id}
              className={`min-w-[140px] max-w-[140px] bg-white/[0.02] border ${style.border} ${style.glow} rounded-2xl p-3 flex flex-col justify-between items-center text-center scroll-snap-align-start shrink-0 relative transition-all duration-150 ${
                item.completed ? "opacity-100" : "opacity-40 grayscale"
              }`}
              role="listitem"
            >
              {!item.completed && (
                <div className="absolute top-2 right-2 text-white/40" aria-hidden="true">
                  <Lock size={10} />
                </div>
              )}

              <div
                className={`w-10 h-10 rounded-xl border ${style.badgeBorder} ${
                  item.completed
                    ? `${style.badgeBg} ${style.text}`
                    : "bg-white/5 border-white/10 text-white/40"
                } flex items-center justify-center mb-2`}
              >
                <IconComponent size={18} />
              </div>

              <div className="space-y-0.5 mb-2.5">
                <span className="text-[10px] font-black text-white block truncate w-[120px]">
                  {item.title}
                </span>
                <span className="text-[8px] font-bold text-white/50 block truncate w-[120px]">
                  {item.description}
                </span>
              </div>

              <div className="w-full space-y-1">
                <div className="flex justify-between text-[7px] font-bold text-white/40 uppercase">
                  <span>{item.rarity}</span>
                  <span>
                    {item.progress}/{item.target}
                  </span>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden border border-white/5">
                  <div
                    className={`h-full rounded-full ${item.completed ? "bg-gradient-to-r from-omnave-primary/50 to-omnave-primary" : "bg-white/10"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Archive */}
      <AnimatePresence>
        {showAllModal && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowAllModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-heading"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#151C2C] border border-white/10 rounded-[24px] p-6 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4 shrink-0">
                <div className="space-y-0.5">
                  <h3 id="modal-heading" className="text-sm font-black text-white">
                    Badge Archive Gallery
                  </h3>
                  <span className="text-[10px] font-bold text-white/40 block">
                    Check your full milestones progress ({unlockedCount} / {achievements.length})
                  </span>
                </div>
                <button
                  onClick={() => setShowAllModal(false)}
                  className="w-8 h-8 rounded-xl hover:bg-white/5 text-white/50 flex items-center justify-center cursor-pointer focus:outline-none"
                  aria-label="Close dialog"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scroll List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
                {achievements.map((item) => {
                  const style = rarityStyles[item.rarity] || rarityStyles.common;
                  const IconComp = getIcon(item.icon);
                  const pct = Math.round((item.progress / item.target) * 100);

                  return (
                    <div
                      key={item.id}
                      className={`p-3 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center justify-between gap-3 ${
                        item.completed ? "opacity-100" : "opacity-60 grayscale"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${style.badgeBorder} ${style.badgeBg} ${style.text}`}>
                          <IconComp size={16} />
                        </div>
                        <div className="leading-tight min-w-0">
                          <span className="text-xs font-black text-white block truncate">{item.title}</span>
                          <span className="text-[10px] text-white/50 block truncate mt-0.5">{item.description}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 text-right">
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold text-white/45 block uppercase">{item.rarity}</span>
                          <span className="text-[10px] font-black text-white block">{item.progress} / {item.target}</span>
                        </div>
                        <div className="w-1.5 h-6 bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <div className="bg-gradient-to-t from-omnave-primary/50 to-omnave-primary w-full rounded-full" style={{ height: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Absolute Bottom-Edge Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5" role="progressbar" aria-valuenow={completionPercentage} aria-valuemin={0} aria-valuemax={100} aria-label="Overall badges completion">
        <motion.div
          className="h-full bg-omnave-primary shadow-[0_0_10px_rgba(var(--omnave-primary),0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${completionPercentage}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
});
