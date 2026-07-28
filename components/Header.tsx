"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useUserContext, Notification } from "@/context/UserContext";
import { useUploadContext } from "@/context/UploadContext";
import { Bell, Settings, X, FileText, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const { user, notifications, clearAllNotifications, markNotificationAsRead, loading } = useUserContext();
  const { uploadStatus, uploadProgress, cancelUpload } = useUploadContext();

  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState("Good evening");
  const [firstName, setFirstName] = useState("Jhade");
  const [formattedDate, setFormattedDate] = useState("");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Listen for the spatial flying toast completion event to pulse the bell
  useEffect(() => {
    const handlePulse = () => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 1000);
    };
    window.addEventListener("pulse-bell-icon", handlePulse);
    return () => window.removeEventListener("pulse-bell-icon", handlePulse);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    const localHour = new Date().getHours();
    let currentGreeting = "Good morning";
    if (localHour >= 12 && localHour < 18) {
      currentGreeting = "Good afternoon";
    } else if (localHour >= 18) {
      currentGreeting = "Good evening";
    }
    setGreeting(currentGreeting);

    const fullName = user?.user_metadata?.full_name || user?.user_metadata?.nickname || user?.email?.split('@')[0] || "Jhade";
    let nameFirst = fullName.split(' ')[0] || "Jhade";
    if (nameFirst === "Learner" || nameFirst === "Bryan" || nameFirst === "Aven") {
      nameFirst = "Jhade";
    }
    // Capitalize first letter
    const capitalizedName = nameFirst.charAt(0).toUpperCase() + nameFirst.slice(1);
    setFirstName(capitalizedName);

    // Format current date: e.g. "Monday, July 27"
    const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    setFormattedDate(new Date().toLocaleDateString("en-US", dateOptions).toUpperCase());
  }, [user]);

  // Click outside to close notification popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadNotifications = useMemo(() => {
    return notifications.filter((n) => !n.isRead);
  }, [notifications]);

  const hasUnread = unreadNotifications.length > 0 || uploadStatus === "uploading";

  const getNotificationIcon = (type: string, isRead: boolean) => {
    const colorClass = isRead ? "text-[#525252]" : "text-[#6949a8]";
    switch (type) {
      case "quiz":
        return <Check size={18} className={colorClass} />;
      default:
        return <FileText size={18} className={colorClass} />;
    }
  };

  const handleNotificationClick = (n: Notification) => {
    markNotificationAsRead(n.id);
    setIsNotificationOpen(false);
    if (n.id.startsWith("processed-")) {
      const lessonId = n.id.replace("processed-", "");
      router.push(`/lesson/${lessonId}`);
    }
  };

  if (!mounted) {
    return (
      <header className="w-full bg-[#6949a8] pt-12 pb-20 animate-pulse">
        <div className="max-w-5xl mx-auto px-[25px] flex justify-between items-center gap-4 select-none">
          <div>
            <div className="h-6 w-48 bg-white/20 rounded mb-2" />
            <div className="h-3 w-32 bg-white/20 rounded" />
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20" />
            <div className="w-10 h-10 rounded-full bg-white/20" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full bg-[#6949a8] pt-12 pb-20 relative">
      <div className="max-w-5xl mx-auto px-[25px] flex justify-between items-center gap-4 select-none relative z-30">
        
        {/* Left Column: Greeting & Date */}
        <div className="flex flex-col items-start text-left min-w-0">
          <h1 className="text-[22px] leading-[33px] font-poppins font-semibold text-white truncate w-full">
            {greeting}, {firstName}
          </h1>
          <span className="text-[13px] font-medium text-white/80 mt-2 font-poppins uppercase tracking-wider">
            {formattedDate}
          </span>
        </div>

        {/* Right Column: Actions (White Circle Buttons) */}
        <div className="flex items-center gap-3 relative">
          
          {/* Bell button */}
          <motion.button 
            id="notification-bell-btn"
            animate={isPulsing ? { scale: [1, 1.25, 0.95, 1.1, 1] } : { scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            whileTap={{ scale: 0.90 }}
            className="bg-white text-[#6949a8] p-2 rounded-full h-10 w-10 flex items-center justify-center cursor-pointer shadow-premium-glass border-none relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label="View notifications"
          >
            <Bell size={20}/>
            {!loading && hasUnread && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#00d047] rounded-full border border-white" />
            )}
          </motion.button>

          {/* Settings gear button */}
          <motion.button 
            onClick={() => window.dispatchEvent(new CustomEvent("open-settings-drawer"))}
            whileTap={{ scale: 0.90 }}
            className="bg-white text-[#6949a8] p-2 rounded-full h-10 w-10 flex items-center justify-center cursor-pointer shadow-premium-glass border-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label="Open settings menu"
          >
            <Settings size={20}/>
          </motion.button>

          {/* macOS Notification Popover dropdown (ODL design) */}
          <AnimatePresence>
            {isNotificationOpen && (
              <motion.div
                ref={popoverRef}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="absolute top-12 right-0 w-[calc(100vw-2rem)] sm:w-80 rounded-[15px] bg-white border-none shadow-[0px_10px_10px_rgba(0,0,0,0.09)] overflow-hidden z-[9999]"
              >
                {/* Popover Header */}
                <div className="relative flex items-center justify-center px-4 pt-3.5 pb-3 border-b border-[#EBEBEB] bg-black/[0.01]">
                  <button
                    onClick={() => setIsNotificationOpen(false)}
                    className="absolute right-4 p-1 text-[#525252] hover:text-black rounded-lg hover:bg-black/5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white border-none bg-transparent"
                    aria-label="Close notifications"
                  >
                    <X size={14} />
                  </button>

                  <span className="text-xs font-bold text-black font-poppins">Notifications</span>

                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="absolute left-4 text-[10px] font-bold text-[#525252] hover:text-black uppercase tracking-widest transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-md px-1.5 py-0.5 border-none bg-transparent"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Active Task (AI Uploading Progress in Background) */}
                {uploadStatus === "uploading" && (
                  <div className="p-4 bg-[#6949a8]/5 border-b border-[#EBEBEB] flex flex-row items-center gap-4 relative text-left">
                    {/* 1. Micro-Engine container (left side) */}
                    <div className="w-12 h-12 flex items-center justify-center bg-white rounded-xl border border-[#EBEBEB] shadow-inner shrink-0">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.05, 0.96, 1.03, 1],
                          filter: [
                            "drop-shadow(0 0 4px rgba(105,73,168,0.4))",
                            "drop-shadow(0 0 8px rgba(105,73,168,0.7))",
                            "drop-shadow(0 0 4px rgba(105,73,168,0.4))"
                          ]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-full h-full flex items-center justify-center px-1"
                      >
                        <svg viewBox="0 0 200 60" width="34" className="overflow-visible select-none">
                          <text 
                            x="50%" 
                            y="50%" 
                            dominantBaseline="middle" 
                            textAnchor="middle" 
                            fill="transparent" 
                            stroke="#6949a8" 
                            strokeWidth="4"
                            className="animate-svg-trace font-brand tracking-widest text-4xl lowercase"
                          >
                            omnave
                          </text>
                        </svg>
                      </motion.div>
                    </div>

                    {/* 2. Task info & Controls (right side) */}
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold tracking-widest text-[#6949a8] uppercase">Active Task</span>
                        <button
                          onClick={cancelUpload}
                          className="text-[#525252] hover:text-red-500 text-[10px] font-extrabold uppercase tracking-widest transition-colors cursor-pointer select-none border-none bg-transparent"
                        >
                          [x] Cancel
                        </button>
                      </div>
                      
                      <p className="text-xs font-semibold text-black truncate pr-4 mt-0.5">AI is analyzing your material...</p>
                      
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex-1 bg-[#EBEBEB] h-1.5 rounded-full overflow-hidden border border-[#EBEBEB]">
                          <div 
                            className="bg-gradient-to-r from-[#6949a8] to-[#86d1ff] h-full rounded-full transition-all duration-300 ease-out" 
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-black shrink-0">{uploadProgress}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Popover List */}
                <div className="divide-y divide-[#EBEBEB] max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 && uploadStatus !== "uploading" ? (
                    <div className="p-8 text-center text-xs text-[#525252] select-none">
                      You&apos;re all caught up!
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const isProcessed = n.id.startsWith("processed-");
                      return (
                        <div 
                          key={n.id} 
                          onClick={() => handleNotificationClick(n)}
                          className={`p-4 flex gap-3.5 hover:bg-black/[0.01] transition-colors text-left cursor-pointer ${!n.isRead ? "bg-[#6949a8]/[0.02]" : ""}`}
                        >
                          <div className="mt-0.5 shrink-0 select-none">
                            {getNotificationIcon(n.type, n.isRead)}
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-xs font-bold text-black truncate">{n.title}</span>
                            <p className="text-[11px] text-[#525252] leading-normal">{n.desc}</p>
                            {isProcessed && (
                              <span className="text-[10px] text-[#6949a8] font-semibold mt-1 flex items-center gap-1 group-hover:underline">
                                View Lesson ➔
                              </span>
                            )}
                            <span className="text-[9px] text-[#525252]/60 font-medium mt-1">{n.time}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </header>
  );
}