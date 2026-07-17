"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Bell, Search, Settings, X } from "lucide-react";
import Link from "next/link";
import { useUserContext } from "@/context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { CommandPalette } from "@/components/CommandPalette";

export default function TopRightActions() {
  const pathname = usePathname();
  const { streak, lessons, loading } = useUserContext();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const popoverRef = useRef<HTMLDivElement>(null);
  // Ref for the hamburger button so the outside-click listener never swallows it
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Close notifications dropdown when clicking outside.
  // Uses 'click' (not 'mousedown') and explicitly excludes the hamburger button
  // so its onClick is never swallowed by this listener.
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

  // Calculate dynamic notification list based on current user stats
  const generatedNotifications = useMemo(() => {
    const list = [];
    if (streak > 0) {
      list.push({
        id: "streak",
        icon: "🔥",
        title: "Streak Active!",
        desc: `You are on a ${streak}-day study streak. Keep the momentum going!`,
        time: "Just now"
      });
    }
    if (lessons.length > 0) {
      list.push({
        id: "lesson",
        icon: "📚",
        title: "Material Processed",
        desc: `"${lessons[0].title || 'Study document'}" has been successfully analyzed by AI.`,
        time: "10m ago"
      });
    } else {
      list.push({
        id: "welcome",
        icon: "✨",
        title: "Welcome to Omnave",
        desc: "Upload a PDF or paste a link to generate flashcards and practice quizzes instantly.",
        time: "1h ago"
      });
    }
    list.push({
      id: "ai",
      icon: "💡",
      title: "AI Study Tip",
      desc: "Practice with quizzes after reviewing flashcards to reinforce retention.",
      time: "2h ago"
    });
    return list;
  }, [streak, lessons]);

  // Sync initial generated notifications exactly once upon user data loading completion
  useEffect(() => {
    if (!loading && !hasInitialized && generatedNotifications.length > 0) {
      setNotifications(generatedNotifications);
      setHasInitialized(true);
    }
  }, [loading, hasInitialized, generatedNotifications]);

  // Hide on landing/welcome/lesson focus screen (shifted below all Hooks)
  if (pathname === '/' || pathname === '/welcome' || pathname?.startsWith('/lesson/')) return null;

  return (
    <header className="relative w-full max-w-[1200px] mx-auto flex items-center px-6 md:px-10 lg:px-12 pt-4 pb-2 bg-transparent border-none shadow-none z-50 pointer-events-auto">
      
      {/* LEFT COLUMN: Dynamic Icon */}
      <div className="flex-1 flex justify-start">
        {pathname === "/profile" ? (
          <button 
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
            aria-label="View notifications"
          >
            <Bell size={20}/>
          </button>
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
          omnave.
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
          <button 
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
            aria-label="View notifications"
          >
            <Bell size={20}/>
            {/* Optional Notification Dot */}
            {!loading && notifications.length > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-omnave-primary rounded-full border border-[#0A0A0A]" />
            )}
          </button>
        )}
      </div>

      {/* macOS Notification Popover dropdown (Design unified with Command Palette) */}
      <AnimatePresence>
        {isNotificationOpen && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={`absolute top-16 w-[calc(100vw-2rem)] sm:w-80 rounded-2xl bg-[#140F26]/95 border border-white/10 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.6)] overflow-hidden z-[9999] ${
              pathname === "/profile" 
                ? "left-6 md:left-10 lg:left-12" 
                : "right-6 md:right-10 lg:right-12"
            }`}
          >
            {/* Popover Header — X mirrors the bell icon side; title always centered */}
            {(() => {
              const isLeft = pathname === "/profile";
              return (
                <div className="relative flex items-center justify-center px-4 pt-3.5 pb-3 border-b border-white/5 bg-white/[0.02]">
                  <button
                    onClick={() => setIsNotificationOpen(false)}
                    className={`absolute ${isLeft ? "left-4" : "right-4"} p-1 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#140F26]`}
                    aria-label="Close notifications"
                  >
                    <X size={14} />
                  </button>

                  <span className="text-xs font-bold text-white">Notifications</span>

                  {notifications.length > 0 && (
                    <button
                      onClick={() => setNotifications([])}
                      className={`absolute ${isLeft ? "right-4" : "left-4"} text-[10px] font-bold text-white/40 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#140F26] rounded-md px-1.5 py-0.5`}
                    >
                      Clear All
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Popover List */}
            <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-white/40 select-none">
                  🧹 You're all caught up!
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="p-4 flex gap-3 hover:bg-white/[0.02] transition-colors text-left">
                    <span className="text-xl shrink-0 mt-0.5 select-none">{n.icon}</span>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-bold text-white truncate">{n.title}</span>
                      <p className="text-[11px] text-white/60 leading-normal">{n.desc}</p>
                      <span className="text-[9px] text-white/30 font-medium mt-1">{n.time}</span>
                    </div>
                  </div>
                ))
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