"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
  Bell, 
  Search, 
  Settings, 
  X, 
  Flame, 
  BookOpen, 
  Sparkles, 
  BrainCircuit 
} from "lucide-react";
import Link from "next/link";
import { useUserContext } from "@/context/UserContext";
import { useUploadContext } from "@/context/UploadContext";
import { motion, AnimatePresence } from "framer-motion";
import { CommandPalette } from "@/components/CommandPalette";

// Helper to resolve clean minimalist ODL icon based on notification type and read status
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

export default function TopRightActions() {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    loading, 
    notifications, 
    markNotificationAsRead, 
    clearAllNotifications 
  } = useUserContext();

  const {
    uploadStatus,
    uploadMessage,
    uploadProgress,
    cancelUpload,
  } = useUploadContext();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  
  const popoverRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Listen for the spatial flying toast completion event to pulse the bell
  useEffect(() => {
    const handlePulse = () => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 1000);
    };
    window.addEventListener("pulse-bell-icon", handlePulse);
    return () => window.removeEventListener("pulse-bell-icon", handlePulse);
  }, []);

  // Close notifications dropdown when clicking outside.
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        !hamburgerRef.current?.contains(target)
      ) {
        setIsNotificationOpen(false);
      }
    };
    if (isNotificationOpen) {
      document.addEventListener("click", handleOutsideClick, { capture: true });
    }
    return () => document.removeEventListener("click", handleOutsideClick, { capture: true });
  }, [isNotificationOpen]);

  const unreadNotifications = useMemo(() => {
    return notifications.filter((n) => !n.isRead);
  }, [notifications]);

  const hasUnread = unreadNotifications.length > 0 || uploadStatus === "uploading";

  const handleNotificationClick = (n: any) => {
    markNotificationAsRead(n.id);
    if (n.id.startsWith("processed-")) {
      const lessonId = n.id.replace("processed-", "");
      setIsNotificationOpen(false);
      router.push(`/lesson/${lessonId}`);
    }
  };

  // Hide on landing/welcome/lesson focus screen (shifted below all Hooks)
  if (pathname === '/' || pathname === '/welcome' || pathname?.startsWith('/lesson/')) return null;

  return (
    <header className="relative w-full max-w-[1200px] mx-auto flex items-center px-6 md:px-10 lg:px-12 pt-4 pb-2 bg-transparent border-none shadow-none z-50 pointer-events-auto">
      
      {/* LEFT COLUMN: Dynamic Icon */}
      <div className="flex-1 flex justify-start">
        {pathname === "/profile" ? (
          <motion.button 
            id="notification-bell-btn"
            animate={isPulsing ? { scale: [1, 1.25, 0.95, 1.1, 1] } : { scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
            aria-label="View notifications"
          >
            <Bell size={20}/>
            {!loading && hasUnread && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#a855f7] rounded-full border border-[#0A0A0A]" />
            )}
          </motion.button>
        ) : (
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
            aria-label="Search study materials"
          >
            <Search size={20}/>
          </button>
        )}
      </div>

      {/* CENTER COLUMN: Perfectly Centered Logo */}
      <div className="shrink-0 flex justify-center">
        <Link 
          className="text-2xl font-black text-white tracking-tighter hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] rounded-lg" 
          href="/home"
        >
          omnave
        </Link>
      </div>

      {/* RIGHT COLUMN: Dynamic Icon */}
      <div className="flex-1 flex justify-end">
        {pathname === "/profile" ? (
          <button 
            ref={hamburgerRef}
            onClick={() => window.dispatchEvent(new CustomEvent("open-settings-drawer"))}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
            aria-label="Open settings menu"
          >
            <Settings size={20}/>
          </button>
        ) : (
          <motion.button 
            id="notification-bell-btn"
            animate={isPulsing ? { scale: [1, 1.25, 0.95, 1.1, 1] } : { scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
            aria-label="View notifications"
          >
            <Bell size={20}/>
            {!loading && hasUnread && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#a855f7] rounded-full border border-[#0A0A0A]" />
            )}
          </motion.button>
        )}
      </div>

      {/* macOS Notification Popover dropdown (ODL design glassmorphism) */}
      <AnimatePresence>
        {isNotificationOpen && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={`absolute top-16 w-[calc(100vw-2rem)] sm:w-80 rounded-2xl bg-[#111111]/95 border border-white/[0.08] backdrop-blur-md shadow-[0_25px_60px_rgba(0,0,0,0.6)] overflow-hidden z-[9999] ${
              pathname === "/profile" 
                ? "left-6 md:left-10 lg:left-12" 
                : "right-6 md:right-10 lg:right-12"
            }`}
          >
            {/* Popover Header */}
            {(() => {
              const isLeft = pathname === "/profile";
              return (
                <div className="relative flex items-center justify-center px-4 pt-3.5 pb-3 border-b border-white/[0.06] bg-white/[0.01]">
                  <button
                    onClick={() => setIsNotificationOpen(false)}
                    className={`absolute ${isLeft ? "left-4" : "right-4"} p-1 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]`}
                    aria-label="Close notifications"
                  >
                    <X size={14} />
                  </button>

                  <span className="text-xs font-bold text-white">Notifications</span>

                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className={`absolute ${isLeft ? "right-4" : "left-4"} text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111] rounded-md px-1.5 py-0.5`}
                    >
                      Clear All
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Active Task (AI Uploading Progress in Background) */}
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

            {/* Popover List */}
            <div className="divide-y divide-white/[0.06] max-h-[300px] overflow-y-auto">
              {notifications.length === 0 && uploadStatus !== "uploading" ? (
                <div className="p-8 text-center text-xs text-zinc-500 select-none">
                  You're all caught up!
                </div>
              ) : (
                notifications.map((n) => {
                  const isProcessed = n.id.startsWith("processed-");
                  return (
                    <div 
                      key={n.id} 
                      onClick={() => handleNotificationClick(n)}
                      className={`p-4 flex gap-3.5 hover:bg-white/[0.01] transition-colors text-left cursor-pointer ${!n.isRead ? "bg-purple-500/[0.01]" : ""}`}
                    >
                      <div className="mt-0.5 shrink-0 select-none">
                        {getNotificationIcon(n.type, n.isRead)}
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs font-bold text-zinc-100 truncate">{n.title}</span>
                        <p className="text-[11px] text-zinc-400 leading-normal">{n.desc}</p>
                        {isProcessed && (
                          <span className="text-[10px] text-[#a855f7] font-semibold mt-1 flex items-center gap-1 group-hover:underline">
                            View Lesson ➔
                          </span>
                        )}
                        <span className="text-[9px] text-zinc-600 font-medium mt-1">{n.time}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Command Palette Search Modal */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

    </header>
  );
}