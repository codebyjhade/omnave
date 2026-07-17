"use client";

import { useEffect, useState } from "react";
import {
  X,
  LogOut,
  ArrowLeft,
  ChevronRight,
  User,
  Clock,
  Bell,
  Moon,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type DrawerView = "main" | "history" | "notifications";

interface QuizScore {
  id?: string;
  lesson_id: string;
  percentage: number;
  created_at?: string;
}

interface Lesson {
  id: string;
  file_path: string;
  title?: string;
}

interface Notification {
  id: string;
  icon: string;
  title: string;
  desc: string;
  time: string;
}

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  quizScores: QuizScore[];
  lessons: Lesson[];
  isSigningOut: boolean;
  onSignOut: () => void;
  onOpenEditProfile: () => void;
}

// ─── Shared sub-header ────────────────────────────────────────────────────────

function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 shrink-0">
      <button
        onClick={onBack}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70"
        aria-label={`Back to settings`}
      >
        <ArrowLeft size={17} />
      </button>
      <h2 className="flex-1 text-center text-sm font-black text-white tracking-tight pr-9">
        {title}
      </h2>
    </div>
  );
}

// ─── Sub-view: History ────────────────────────────────────────────────────────

function HistoryView({
  quizScores,
  lessons,
  onBack,
}: {
  quizScores: QuizScore[];
  lessons: Lesson[];
  onBack: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCleanTitle = (path: string, title?: string) => {
    if (title) return title;
    const base = path.split("/").pop() || "";
    return base.replace(/^\d+_/, "").replace(".pdf", "") || "Study Material";
  };

  const displayed = isExpanded ? quizScores : quizScores.slice(0, 6);

  return (
    <motion.div
      key="history-view"
      initial={{ x: 48, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 48, opacity: 0 }}
      transition={{ type: "spring", stiffness: 340, damping: 36 }}
      className="absolute inset-0 flex flex-col bg-[#0A0710]"
    >
      <SubHeader title="Study History" onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3">
        {quizScores.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 text-center">
            <span className="text-4xl select-none">📝</span>
            <p className="text-xs text-white/40 max-w-[180px] leading-relaxed">
              No quiz history yet. Take a quiz from a lesson to start tracking!
            </p>
          </div>
        ) : (
          <>
            <motion.div layout className="flex flex-col gap-2.5">
              {displayed.map((q, idx) => {
                const lesson = lessons.find((l) => l.id === q.lesson_id);
                const title = lesson
                  ? getCleanTitle(lesson.file_path, lesson.title)
                  : "Study Lesson";
                const date = q.created_at
                  ? new Date(q.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Recently";

                return (
                  <motion.div
                    layout
                    key={q.id || idx}
                    className="flex justify-between items-center p-4 bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors rounded-2xl"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-sm font-bold text-white truncate pr-4">
                        {title}
                      </span>
                      <span className="text-[10px] text-white/40">{date}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-sm font-black ${
                          q.percentage >= 80
                            ? "text-[#1db954]"
                            : q.percentage >= 50
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {q.percentage}%
                      </span>
                      <p className="text-[10px] text-white/30 mt-0.5">
                        Practice Quiz
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {quizScores.length > 6 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full mt-1 py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70 flex items-center justify-center gap-2"
              >
                {isExpanded ? (
                  <><ChevronUp size={14} /> Show Less</>
                ) : (
                  <><ChevronDown size={14} /> View All ({quizScores.length})</>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Sub-view: Notifications ──────────────────────────────────────────────────

const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: "streak",
    icon: "🔥",
    title: "Streak Active!",
    desc: "You have an active study streak. Keep the momentum going!",
    time: "Just now",
  },
  {
    id: "ai",
    icon: "💡",
    title: "AI Study Tip",
    desc: "Practice with quizzes after reviewing flashcards to reinforce retention.",
    time: "2h ago",
  },
  {
    id: "welcome",
    icon: "✨",
    title: "Welcome to Omnave",
    desc: "Upload a PDF or paste a link to generate flashcards and quizzes instantly.",
    time: "1d ago",
  },
];

function NotificationsView({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<Notification[]>(SAMPLE_NOTIFICATIONS);

  return (
    <motion.div
      key="notifications-view"
      initial={{ x: 48, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 48, opacity: 0 }}
      transition={{ type: "spring", stiffness: 340, damping: 36 }}
      className="absolute inset-0 flex flex-col bg-[#0A0710]"
    >
      {/* Header */}
      <div className="relative flex items-center justify-center px-4 py-5 border-b border-white/10 shrink-0">
        <button
          onClick={onBack}
          className="absolute left-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70"
          aria-label="Back to settings"
        >
          <ArrowLeft size={17} />
        </button>
        <h2 className="text-sm font-black text-white tracking-tight">
          Notifications
        </h2>
        {items.length > 0 && (
          <button
            onClick={() => setItems([])}
            className="absolute right-4 text-[10px] font-bold text-white/40 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70 rounded-md px-1.5 py-0.5"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <span className="text-4xl select-none">🧹</span>
            <p className="text-xs text-white/40">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {items.map((n) => (
              <div
                key={n.id}
                className="flex gap-3 p-4 hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-xl shrink-0 mt-0.5 select-none">{n.icon}</span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-xs font-bold text-white">{n.title}</span>
                  <p className="text-[11px] text-white/60 leading-relaxed">{n.desc}</p>
                  <span className="text-[9px] text-white/30 mt-1">{n.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Sub-view: Main Settings Menu ─────────────────────────────────────────────

function MainMenuView({
  onClose,
  onNavigate,
  onOpenEditProfile,
  isSigningOut,
  onSignOut,
}: {
  onClose: () => void;
  onNavigate: (view: DrawerView) => void;
  onOpenEditProfile: () => void;
  isSigningOut: boolean;
  onSignOut: () => void;
}) {
  const menuItemClass =
    "flex items-center justify-between w-full px-5 py-4 text-sm text-white hover:bg-white/5 border-b border-white/[0.06] transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-omnave-primary/70";
  const iconClass = "text-white/50 shrink-0";

  const comingSoon = (feature: string) =>
    window.alert(`${feature} — Coming soon!`);

  return (
    <motion.div
      key="main-view"
      initial={{ x: -48, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -48, opacity: 0 }}
      transition={{ type: "spring", stiffness: 340, damping: 36 }}
      className="absolute inset-0 flex flex-col bg-[#0A0710]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10 shrink-0">
        <h2 className="text-base font-black text-white tracking-tight">
          Settings
        </h2>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70"
          aria-label="Close settings"
        >
          <X size={18} />
        </button>
      </div>

      {/* Menu — scrollable middle */}
      <div className="flex-1 overflow-y-auto">
        {/* Group 1 — Account */}
        <p className="px-5 pt-5 pb-2 text-[10px] font-extrabold tracking-[0.18em] text-white/30 uppercase">
          Account
        </p>
        <div className="rounded-xl overflow-hidden mx-3 border border-white/[0.06] bg-white/[0.02]">
          {/* Account Details → opens EditProfileModal */}
          <button
            className={menuItemClass}
            onClick={() => {
              onClose();          // close drawer first so modal renders on top
              onOpenEditProfile();
            }}
          >
            <span className="flex items-center gap-3">
              <User size={16} className={iconClass} />
              Account Details
            </span>
            <ChevronRight size={15} className="text-white/25" />
          </button>

          {/* Study History → nested view */}
          <button
            className={menuItemClass}
            onClick={() => onNavigate("history")}
          >
            <span className="flex items-center gap-3">
              <Clock size={16} className={iconClass} />
              Study History
            </span>
            <ChevronRight size={15} className="text-white/25" />
          </button>

          {/* Notifications → nested view */}
          <button
            className={`${menuItemClass} border-b-0`}
            onClick={() => onNavigate("notifications")}
          >
            <span className="flex items-center gap-3">
              <Bell size={16} className={iconClass} />
              Notifications
            </span>
            <ChevronRight size={15} className="text-white/25" />
          </button>
        </div>

        {/* Group 2 — Preferences */}
        <p className="px-5 pt-6 pb-2 text-[10px] font-extrabold tracking-[0.18em] text-white/30 uppercase">
          Preferences
        </p>
        <div className="rounded-xl overflow-hidden mx-3 border border-white/[0.06] bg-white/[0.02]">
          <button
            className={menuItemClass}
            onClick={() => comingSoon("Appearance")}
          >
            <span className="flex items-center gap-3">
              <Moon size={16} className={iconClass} />
              Appearance
            </span>
            <ChevronRight size={15} className="text-white/25" />
          </button>

          <button
            className={`${menuItemClass} border-b-0`}
            onClick={() => comingSoon("Help & Support")}
          >
            <span className="flex items-center gap-3">
              <HelpCircle size={16} className={iconClass} />
              Help &amp; Support
            </span>
            <ChevronRight size={15} className="text-white/25" />
          </button>
        </div>
      </div>

      {/* Sign Out — pinned to bottom */}
      <div className="px-5 py-5 border-t border-white/[0.06] shrink-0">
        <button
          onClick={onSignOut}
          disabled={isSigningOut}
          className="flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-semibold text-sm tracking-wide">
            {isSigningOut ? "Signing out…" : "Sign Out"}
          </span>
        </button>
      </div>
    </motion.div>
  );
}

// ─── Root Drawer ──────────────────────────────────────────────────────────────

export function SettingsDrawer({
  isOpen,
  onClose,
  quizScores,
  lessons,
  isSigningOut,
  onSignOut,
  onOpenEditProfile,
}: SettingsDrawerProps) {
  const [drawerView, setDrawerView] = useState<DrawerView>("main");

  // Reset to main view every time drawer opens
  useEffect(() => {
    if (isOpen) setDrawerView("main");
  }, [isOpen]);

  // Escape: go back one level, or close if already at main
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (drawerView !== "main") {
          setDrawerView("main");
        } else {
          onClose();
        }
      }
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, drawerView, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — z-[9999] covers BottomNav (z-[9999]) by painting over it */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sliding panel — z-[10000] sits above the backdrop */}
          <motion.aside
            key="drawer-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
            className="fixed inset-y-0 right-0 z-[10000] w-full sm:w-96 overflow-hidden shadow-2xl border-l border-white/10"
            aria-label="Settings drawer"
          >
            {/* Inner view switcher */}
            <div className="relative w-full h-full">
              <AnimatePresence mode="wait">
                {drawerView === "main" && (
                  <MainMenuView
                    key="main"
                    onClose={onClose}
                    onNavigate={setDrawerView}
                    onOpenEditProfile={onOpenEditProfile}
                    isSigningOut={isSigningOut}
                    onSignOut={onSignOut}
                  />
                )}
                {drawerView === "history" && (
                  <HistoryView
                    key="history"
                    quizScores={quizScores}
                    lessons={lessons}
                    onBack={() => setDrawerView("main")}
                  />
                )}
                {drawerView === "notifications" && (
                  <NotificationsView
                    key="notifications"
                    onBack={() => setDrawerView("main")}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
