"use client";

/**
 * ProfileMenuSheet — Premium Bottom Sheet Settings Menu
 *
 * Self-contained navigation stack. All secondary actions render INSIDE
 * this sheet as nested views — no external modals are spawned.
 *
 * View state machine:
 *   main → editProfile | badges | history | notifications | appearance
 *
 * Built on `vaul` for native swipe-to-dismiss physics.
 */

import React, { useEffect, useRef, useState } from "react";
import { Drawer } from "vaul";
import {
  User,
  Crown,
  Award,
  Palette,
  Globe,
  Bell,
  Accessibility,
  Download,
  HardDrive,
  RefreshCw,
  Lock,
  Link,
  Monitor,
  Shield,
  LifeBuoy,
  Bug,
  Lightbulb,
  MessageSquare,
  Sparkles,
  FileText,
  Info,
  ScrollText,
  LogOut,
  ChevronRight,
  ChevronLeft,
  History,
  ChevronDown,
  ChevronUp,
  X,
  Flame,
  BookOpen,
  BrainCircuit
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import { useUserContext } from "@/context/UserContext";
import { useUploadContext } from "@/context/UploadContext";
import { useRouter } from "next/navigation";
import { BadgeShowcase, BadgeArchiveModal } from "@/components/profile";
import { useToast } from "@/components/ToastProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveView =
  | "main"
  | "editProfile"
  | "badges"
  | "history"
  | "notifications"
  | "appearance";

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

interface ProfileMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  quizScores: QuizScore[];
  lessons: Lesson[];
  isSigningOut: boolean;
  onSignOut: () => void;
  plan?: string;
  appVersion?: string;
}

// ─── View meta ────────────────────────────────────────────────────────────────

const VIEW_TITLES: Record<ActiveView, string> = {
  main: "Settings",
  editProfile: "Edit Profile",
  badges: "Achievements",
  history: "Study History",
  notifications: "Notifications",
  appearance: "Appearance",
};

// ─── Primitive Sub-Components ─────────────────────────────────────────────────

function SheetHandle() {
  return (
    <div className="mx-auto mb-1 mt-3 h-1 w-10 rounded-full bg-white/20 shrink-0" />
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="px-1 pt-2 mb-3 text-[11px] font-bold tracking-[0.2em] text-zinc-500 uppercase select-none">
      {label}
    </p>
  );
}

function MenuDivider() {
  return <div className="my-4 border-t border-white/[0.04]" />;
}

function TrailingValue({ value }: { value: string }) {
  return (
    <span className="text-xs font-semibold text-zinc-500 mr-1 shrink-0 px-2 py-0.5 rounded-md bg-white/[0.02] border border-white/[0.04] select-none">
      {value}
    </span>
  );
}

function MenuSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[#111111] border border-white/[0.06] overflow-hidden divide-y divide-white/[0.06]">
      {children}
    </div>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

function MenuItem({ icon, label, trailing, onClick, disabled }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center w-full min-h-[48px] px-4 py-4 gap-3.5 text-sm text-zinc-100 hover:bg-white/[0.01] active:bg-white/[0.03] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70 focus-visible:ring-inset group"
    >
      <span className="text-zinc-400 shrink-0 group-hover:text-zinc-200 transition-colors">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 16 }) : icon}
      </span>
      <span className="flex-1 text-left font-medium leading-snug">{label}</span>
      {trailing ?? <ChevronRight size={14} className="text-zinc-600 shrink-0 transition-transform group-hover:translate-x-0.5" />}
    </button>
  );
}

function DangerMenuItem({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center w-full min-h-[48px] px-4 py-4 gap-3.5 text-sm text-red-400 hover:bg-red-500/10 active:bg-red-500/15 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:ring-inset"
    >
      <span className="text-red-400 shrink-0">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 16 }) : icon}
      </span>
      <span className="flex-1 text-left font-semibold leading-snug">{label}</span>
    </button>
  );
}

// ─── Dynamic Sheet Header ──────────────────────────────────────────────────────

function SheetHeader({
  activeView,
  onBack,
  onClose,
}: {
  activeView: ActiveView;
  onBack: () => void;
  onClose: () => void;
}) {
  const isMain = activeView === "main";

  return (
    <div className="relative flex items-center justify-center px-4 py-4 border-b border-white/[0.07] shrink-0">
      <AnimatePresence mode="wait" initial={false}>
        {!isMain && (
          <motion.button
            key="back"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            onClick={onBack}
            className="absolute left-4 flex items-center gap-0.5 text-sm text-white/60 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70 rounded-lg px-1 py-1"
            aria-label="Back"
          >
            <ChevronLeft size={18} />
            <span className="font-medium">Back</span>
          </motion.button>
        )}
      </AnimatePresence>

      <motion.span
        key={activeView}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15 }}
        className="text-sm font-black text-white tracking-tight"
      >
        {VIEW_TITLES[activeView]}
      </motion.span>

      <AnimatePresence mode="wait" initial={false}>
        {isMain && (
          <motion.button
            key="close"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70"
            aria-label="Close settings"
          >
            <X size={16} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-View: Sign Out Confirm ───────────────────────────────────────────────

function SignOutConfirm({
  isSigningOut,
  onConfirm,
  onCancel,
}: {
  isSigningOut: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] overflow-hidden">
      <p className="px-4 pt-4 pb-2 text-sm text-white/80 leading-relaxed">
        Are you sure you want to sign out of{" "}
        <span className="font-bold text-white">Omnave</span>?
      </p>
      <div className="flex gap-2 px-4 pb-4">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isSigningOut}
          className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-sm font-semibold text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
        >
          {isSigningOut ? "Signing out…" : "Sign Out"}
        </button>
      </div>
    </div>
  );
}

// ─── Sub-View: Main Settings List ────────────────────────────────────────────

function MainView({
  plan,
  appVersion,
  isSigningOut,
  onSignOut,
  isStandalone,
  go,
  cs,
}: {
  plan: string;
  appVersion: string;
  isSigningOut: boolean;
  onSignOut: () => void;
  isStandalone: boolean;
  go: (view: ActiveView) => void;
  cs: (label: string) => void;
}) {
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-10 overscroll-contain space-y-1">
      <SectionHeader label="Account" />
      <MenuSection>
        <MenuItem icon={<User size={17} />} label="Edit Profile" onClick={() => go("editProfile")} />
        <MenuItem icon={<Monitor size={17} />} label="Manage Account" onClick={() => cs("Manage Account")} />
        <MenuItem
          icon={<Crown size={17} />}
          label="Subscription"
          trailing={<span className="flex items-center gap-1.5"><TrailingValue value={plan} /><ChevronRight size={15} className="text-white/20" /></span>}
          onClick={() => cs("Subscription")}
        />
        <MenuItem icon={<Award size={17} />} label="Achievements & Badges" onClick={() => go("badges")} />
      </MenuSection>

      <MenuDivider />

      <SectionHeader label="Preferences" />
      <MenuSection>
        <MenuItem
          icon={<Palette size={17} />}
          label="Appearance"
          trailing={<span className="flex items-center gap-1.5"><TrailingValue value="System" /><ChevronRight size={15} className="text-white/20" /></span>}
          onClick={() => go("appearance")}
        />
        <MenuItem
          icon={<Globe size={17} />}
          label="Language"
          trailing={<span className="flex items-center gap-1.5"><TrailingValue value="English" /><ChevronRight size={15} className="text-white/20" /></span>}
          onClick={() => cs("Language")}
        />
        <MenuItem icon={<Bell size={17} />} label="Notifications" onClick={() => go("notifications")} />
        <MenuItem icon={<Accessibility size={17} />} label="Accessibility" onClick={() => cs("Accessibility")} />
      </MenuSection>

      <MenuDivider />

      <SectionHeader label="App" />
      <MenuSection>
        {!isStandalone && (
          <MenuItem icon={<Download size={17} />} label="Install Omnave" onClick={() => cs("Install")} />
        )}
        <MenuItem icon={<History size={17} />} label="Study History" onClick={() => go("history")} />
        <MenuItem
          icon={<HardDrive size={17} />}
          label="Storage Usage"
          trailing={<span className="flex items-center gap-1.5"><TrailingValue value="—" /><ChevronRight size={15} className="text-white/20" /></span>}
          onClick={() => cs("Storage Usage")}
        />
        <MenuItem
          icon={<RefreshCw size={17} />}
          label="Sync Status"
          trailing={<span className="flex items-center gap-1.5"><TrailingValue value="Synced" /><ChevronRight size={15} className="text-white/20" /></span>}
          onClick={() => cs("Sync Status")}
        />
      </MenuSection>

      <MenuDivider />

      <SectionHeader label="Privacy & Security" />
      <MenuSection>
        <MenuItem icon={<Lock size={17} />} label="Change Password" onClick={() => cs("Change Password")} />
        <MenuItem icon={<Link size={17} />} label="Connected Accounts" onClick={() => cs("Connected Accounts")} />
        <MenuItem icon={<Monitor size={17} />} label="Sessions & Devices" onClick={() => cs("Sessions & Devices")} />
        <MenuItem icon={<Shield size={17} />} label="Privacy Settings" onClick={() => cs("Privacy Settings")} />
      </MenuSection>

      <MenuDivider />

      <SectionHeader label="Help & Support" />
      <MenuSection>
        <MenuItem icon={<LifeBuoy size={17} />} label="Help Center" onClick={() => cs("Help Center")} />
        <MenuItem icon={<Bug size={17} />} label="Report a Bug" onClick={() => cs("Report a Bug")} />
        <MenuItem icon={<Lightbulb size={17} />} label="Request a Feature" onClick={() => cs("Request a Feature")} />
        <MenuItem icon={<MessageSquare size={17} />} label="Send Feedback" onClick={() => cs("Send Feedback")} />
      </MenuSection>

      <MenuDivider />

      <SectionHeader label="About" />
      <MenuSection>
        <MenuItem icon={<Sparkles size={17} />} label="What's New" onClick={() => cs("What's New")} />
        <MenuItem icon={<FileText size={17} />} label="Release Notes" onClick={() => cs("Release Notes")} />
        <MenuItem
          icon={<Info size={17} />}
          label="Version"
          trailing={<TrailingValue value={`v${appVersion}`} />}
        />
        <MenuItem icon={<ScrollText size={17} />} label="Terms & Privacy Policy" onClick={() => cs("Terms & Privacy Policy")} />
      </MenuSection>

      <MenuDivider />

      <SectionHeader label="Session" />
      {confirmSignOut ? (
        <SignOutConfirm
          isSigningOut={isSigningOut}
          onConfirm={onSignOut}
          onCancel={() => setConfirmSignOut(false)}
        />
      ) : (
        <MenuSection>
          <DangerMenuItem icon={<LogOut size={17} />} label="Sign Out" onClick={() => setConfirmSignOut(true)} />
        </MenuSection>
      )}

      <div className="h-6" />
    </div>
  );
}

// ─── Sub-View: Edit Profile Form ──────────────────────────────────────────────

function EditProfileView({ onBack }: { onBack: () => void }) {
  const { user, refreshUser } = useUserContext();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [major, setMajor] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (user) {
      setDisplayName(
        user.user_metadata?.nickname ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          ""
      );
      const tag =
        Array.isArray(user.user_metadata?.tags) && user.user_metadata.tags.length > 0
          ? user.user_metadata.tags[0]
          : user.user_metadata?.major || "Learner";
      setMajor(tag);
      setErrorMessage("");
    }
  }, [user]);

  const initial = displayName ? displayName.charAt(0).toUpperCase() : "L";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) { setErrorMessage("Display name cannot be empty."); return; }
    try {
      setIsSaving(true);
      setErrorMessage("");
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error } = await supabase.auth.updateUser({
        data: { nickname: displayName.trim(), tags: [major.trim() || "Learner"] },
      });
      if (error) throw error;
      await refreshUser();
      toast("Profile updated!", "success");
      onBack();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-10 overscroll-contain">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-4">
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-medium">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Avatar */}
        <div className="relative w-20 h-20 rounded-full bg-omnave-primary/20 flex items-center justify-center mx-auto border border-omnave-primary/50 text-2xl font-black text-purple-400 select-none">
          {initial}
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-omnave-primary rounded-full border-2 border-[#0D0A1A] flex items-center justify-center shadow-lg text-white">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
        </div>

        <div>
          <label htmlFor="sheet-displayName" className="text-xs font-semibold text-white/50 tracking-wider mb-2 block uppercase">
            Display Name
          </label>
          <input
            id="sheet-displayName"
            type="text"
            placeholder="Your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-omnave-primary/70 transition-all"
          />
        </div>

        <div>
          <label htmlFor="sheet-major" className="text-xs font-semibold text-white/50 tracking-wider mb-2 block uppercase">
            Field of Study / Role
          </label>
          <input
            id="sheet-major"
            type="text"
            placeholder="e.g. Biology Student, Developer"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-omnave-primary/70 transition-all"
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 py-3 rounded-xl bg-omnave-primary text-white font-semibold shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Sub-View: Badges ─────────────────────────────────────────────────────────

function BadgesView() {
  const [showAll, setShowAll] = useState(false);
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-10 overscroll-contain pt-2">
      <BadgeShowcase onViewAll={() => setShowAll(true)} />
      <BadgeArchiveModal isOpen={showAll} onClose={() => setShowAll(false)} />
    </div>
  );
}

// ─── Sub-View: History ────────────────────────────────────────────────────────

function HistoryView({
  quizScores,
  lessons,
}: {
  quizScores: QuizScore[];
  lessons: Lesson[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCleanTitle = (path: string, title?: string) => {
    if (title) return title;
    const base = path.split("/").pop() || "";
    return base.replace(/^\d+_/, "").replace(".pdf", "") || "Study Material";
  };

  const displayed = isExpanded ? quizScores : quizScores.slice(0, 8);

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-10 overscroll-contain pt-2">
      {quizScores.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <span className="text-5xl select-none">📝</span>
          <p className="text-sm text-white/40 max-w-[200px] leading-relaxed">
            No quiz history yet. Take a quiz from a lesson to start tracking!
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-white/40 mb-3">
            {quizScores.length} attempt{quizScores.length !== 1 ? "s" : ""}
          </p>
          <motion.div layout className="flex flex-col gap-2.5">
            {displayed.map((q, idx) => {
              const lesson = lessons.find((l) => l.id === q.lesson_id);
              const title = lesson ? getCleanTitle(lesson.file_path, lesson.title) : "Study Lesson";
              const date = q.created_at
                ? new Date(q.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                : "Recently";
              return (
                <motion.div
                  layout
                  key={q.id || idx}
                  className="flex justify-between items-center p-4 bg-white/[0.04] border border-white/[0.06] hover:border-white/10 transition-colors rounded-2xl"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-sm font-bold text-white truncate pr-4">{title}</span>
                    <span className="text-[10px] text-white/40">{date}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-sm font-black ${q.percentage >= 80 ? "text-[#1db954]" : q.percentage >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                      {q.percentage}%
                    </span>
                    <p className="text-[10px] text-white/30 mt-0.5">Practice Quiz</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {quizScores.length > 8 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full mt-3 py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70 flex items-center justify-center gap-2"
            >
              {isExpanded ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> View All ({quizScores.length})</>}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ─── Sub-View: Notifications ──────────────────────────────────────────────────

function NotificationsView({ onClose }: { onClose: () => void }) {
  const { notifications, markNotificationAsRead, clearAllNotifications } = useUserContext();
  const { uploadStatus, uploadMessage, uploadProgress, cancelUpload } = useUploadContext();
  const router = useRouter();

  const getNotificationIcon = (type: string, isRead: boolean) => {
    const colorClass = isRead ? "text-zinc-500" : "text-[#a855f7]";
    switch (type) {
      case "streak":
        return <Flame size={16} className={`${colorClass} shrink-0`} />;
      case "lesson":
        return <BookOpen size={16} className={`${colorClass} shrink-0`} />;
      case "welcome":
        return <Sparkles size={16} className={`${colorClass} shrink-0`} />;
      case "ai":
        return <BrainCircuit size={16} className={`${colorClass} shrink-0`} />;
      default:
        return <Bell size={16} className={`${colorClass} shrink-0`} />;
    }
  };

  const handleNotificationClick = (n: any) => {
    markNotificationAsRead(n.id);
    if (n.id.startsWith("processed-")) {
      const lessonId = n.id.replace("processed-", "");
      onClose();
      router.push(`/lesson/${lessonId}`);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain pb-10">
      {uploadStatus === "uploading" && (
        <div className="p-4 bg-[#a855f7]/5 border-b border-white/[0.06] flex flex-row items-center gap-4 relative text-left">
          {/* 1. Micro-Engine container (left side) */}
          <div className="w-12 h-12 flex items-center justify-center bg-[#0a0a0a] rounded-xl border border-white/[0.04] shadow-inner shrink-0">
            <motion.div
              animate={{ 
                scale: [1, 1.05, 0.96, 1.03, 1],
                filter: [
                  "drop-shadow(0 0 4px rgba(168,85,247,0.4))",
                  "drop-shadow(0 0 8px rgba(168,85,247,0.7))",
                  "drop-shadow(0 0 4px rgba(168,85,247,0.4))"
                ]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-full h-full flex items-center justify-center px-1"
            >
              <svg viewBox="0 0 320 80" width="34" className="overflow-visible select-none">
                {/* Letter 'o' */}
                <path d="M 30,40 A 15,15 0 1,1 29.9,40 Z" fill="none" stroke="#a855f7" strokeWidth="8" strokeLinecap="round" />
                {/* Letter 'm' */}
                <path d="M 60,55 V 30 A 8,8 0 0,1 76,30 V 55 M 76,30 A 8,8 0 0,1 92,30 V 55" fill="none" stroke="#a855f7" strokeWidth="8" strokeLinecap="round" />
                {/* Letter 'n' */}
                <path d="M 110,55 V 30 A 8,8 0 0,1 126,30 V 55" fill="none" stroke="#a855f7" strokeWidth="8" strokeLinecap="round" />
                {/* Letter 'a' */}
                <path d="M 155,42.5 A 12.5,12.5 0 1,1 154.9,42.5 Z M 167.5,30 V 55" fill="none" stroke="#a855f7" strokeWidth="8" strokeLinecap="round" />
                {/* Letter 'v' */}
                <path d="M 185,30 L 195,55 L 205,30" fill="none" stroke="#a855f7" strokeWidth="8" strokeLinecap="round" />
                {/* Letter 'e' */}
                <path d="M 235,42.5 H 215 A 12.5,12.5 0 1,1 235,40" fill="none" stroke="#a855f7" strokeWidth="8" strokeLinecap="round" />
              </svg>
            </motion.div>
          </div>

          {/* 2. Task info & Controls (right side) */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold tracking-widest text-[#a855f7] uppercase">Active Task</span>
              <button
                onClick={cancelUpload}
                className="text-zinc-500 hover:text-red-400 text-[10px] font-extrabold uppercase tracking-widest transition-colors cursor-pointer select-none"
              >
                [x] Cancel
              </button>
            </div>
            
            <p className="text-xs font-semibold text-zinc-100 truncate pr-4 mt-0.5">AI is analyzing your material...</p>
            
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex-1 bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-[#a855f7] h-full rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-white shrink-0">{uploadProgress}%</span>
            </div>
          </div>
        </div>
      )}

      {notifications.length === 0 && uploadStatus !== "uploading" ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center select-none">
          <p className="text-sm text-zinc-500">You're all caught up!</p>
        </div>
      ) : (
        <>
          {notifications.length > 0 && (
            <div className="flex justify-end px-4 py-2">
              <button 
                onClick={clearAllNotifications} 
                className="text-[11px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors cursor-pointer select-none"
              >
                Clear All
              </button>
            </div>
          )}
          <div className="divide-y divide-white/[0.06]">
            {notifications.map((n) => {
              const isProcessed = n.id.startsWith("processed-");
              return (
                <div 
                  key={n.id} 
                  onClick={() => handleNotificationClick(n)}
                  className={`flex gap-3.5 px-4 py-4 hover:bg-white/[0.01] transition-colors cursor-pointer text-left ${!n.isRead ? "bg-purple-500/[0.01]" : ""}`}
                >
                  <div className="shrink-0 mt-0.5 select-none">
                    {getNotificationIcon(n.type, n.isRead)}
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs font-bold text-zinc-100">{n.title}</span>
                    <p className="text-[11px] text-zinc-400 leading-normal">{n.desc}</p>
                    {isProcessed && (
                      <span className="text-[10px] text-[#a855f7] font-semibold mt-1 flex items-center gap-1 hover:underline">
                        View Lesson ➔
                      </span>
                    )}
                    <span className="text-[9px] text-zinc-600 font-medium mt-1">{n.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sub-View: Appearance ─────────────────────────────────────────────────────

function AppearanceView() {
  const [selected, setSelected] = useState<"system" | "dark" | "light">("system");
  const options = [
    { key: "system" as const, label: "System Default", desc: "Follows your device setting" },
    { key: "dark" as const, label: "Dark", desc: "Always use dark mode" },
    { key: "light" as const, label: "Light", desc: "Always use light mode" },
  ];
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-10 overscroll-contain pt-4 space-y-2">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => setSelected(o.key)}
          className="flex items-center justify-between w-full p-4 rounded-2xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70"
          style={{
            background: selected === o.key ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.02)",
            borderColor: selected === o.key ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.07)",
          }}
        >
          <div className="text-left">
            <p className={`text-sm font-semibold ${selected === o.key ? "text-omnave-primary" : "text-white"}`}>{o.label}</p>
            <p className="text-xs text-white/40 mt-0.5">{o.desc}</p>
          </div>
          {selected === o.key && (
            <div className="w-5 h-5 rounded-full bg-omnave-primary flex items-center justify-center shrink-0">
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </button>
      ))}
      <p className="text-[10px] text-white/25 text-center pt-2">Appearance changes are coming soon.</p>
    </div>
  );
}

// ─── Slide animation helpers ──────────────────────────────────────────────────

const slideVariants = {
  enterFromRight: { x: 40, opacity: 0 },
  enterFromLeft: { x: -40, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exitToLeft: { x: -40, opacity: 0 },
  exitToRight: { x: 40, opacity: 0 },
};

// ─── Root Sheet ───────────────────────────────────────────────────────────────

export function ProfileMenuSheet({
  isOpen,
  onClose,
  quizScores,
  lessons,
  isSigningOut,
  onSignOut,
  plan = "Free",
  appVersion = "1.0.0",
}: ProfileMenuSheetProps) {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<ActiveView>("main");
  const [isStandalone, setIsStandalone] = useState(false);
  // Track slide direction synchronously BEFORE state update to avoid stale render-time values
  const directionRef = useRef<"forward" | "back">("forward");

  useEffect(() => {
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as any).standalone === true
    );
  }, []);

  // Reset to main every time the sheet opens
  useEffect(() => {
    if (isOpen) {
      directionRef.current = "back";
      setActiveView("main");
    }
  }, [isOpen]);

  const go = (view: ActiveView) => {
    directionRef.current = "forward";
    setActiveView(view);
  };

  const goBack = () => {
    directionRef.current = "back";
    setActiveView("main");
  };

  const cs = (label: string) => toast(`${label} — Coming soon!`, "info");

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      shouldScaleBackground={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md" />

        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-[10000] flex flex-col rounded-t-[28px] bg-[#09090b]/95 backdrop-blur-md border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.6)] outline-none"
          style={{ height: "85dvh", maxHeight: "92dvh" }}
          aria-label="Profile settings"
        >
          <SheetHandle />

          {/* Dynamic header */}
          <SheetHeader activeView={activeView} onBack={goBack} onClose={onClose} />

          {/* Animated view switcher — flex-1 + overflow-hidden contains the slide */}
          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence
              mode="wait"
              initial={false}
              custom={directionRef.current}
            >
              <motion.div
                key={activeView}
                custom={directionRef.current}
                variants={{
                  enter: (dir: "forward" | "back") => ({
                    x: dir === "forward" ? 40 : -40,
                    opacity: 0,
                  }),
                  center: { x: 0, opacity: 1 },
                  exit: (dir: "forward" | "back") => ({
                    x: dir === "forward" ? -40 : 40,
                    opacity: 0,
                  }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 380, damping: 36 }}
                className="absolute inset-0 flex flex-col overflow-hidden"
              >
                {activeView === "main" && (
                  <MainView
                    plan={plan}
                    appVersion={appVersion}
                    isSigningOut={isSigningOut}
                    onSignOut={onSignOut}
                    isStandalone={isStandalone}
                    go={go}
                    cs={cs}
                  />
                )}
                {activeView === "editProfile" && <EditProfileView onBack={goBack} />}
                {activeView === "badges" && <BadgesView />}
                {activeView === "history" && <HistoryView quizScores={quizScores} lessons={lessons} />}
                {activeView === "notifications" && <NotificationsView onClose={onClose} />}
                {activeView === "appearance" && <AppearanceView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
