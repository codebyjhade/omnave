"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useUserContext, Notification } from "@/context/UserContext";
import { useUploadContext } from "@/context/UploadContext";
import { Bell, Settings, X, FileText, Check, Share2, SlidersHorizontal, Search, ArrowLeft, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname, useParams, useSearchParams } from "next/navigation";
import { calculateKitProgress } from "@/hooks/useProgressStats";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const params = useParams();
  const searchParams = useSearchParams();
  
  const { 
    user, 
    notifications, 
    clearAllNotifications, 
    markNotificationAsRead, 
    loading, 
    lessons, 
    quizScores,
    streak 
  } = useUserContext();
  
  const { uploadStatus, uploadProgress, cancelUpload } = useUploadContext();

  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState("Good evening");
  const [firstName, setFirstName] = useState("Jhade");
  const [formattedDate, setFormattedDate] = useState("");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // ─── Motion Master Timing Contract ───────────────────────────────────────────
  // Single source of truth for ALL header icon entry/exit/layout animations.
  // Crisp custom cubic-bezier gives a premium, snappy feel on a shared clock.
  const motionMasterTiming = { type: "tween" as const, duration: 0.22, ease: [0.32, 0.72, 0, 1] as const };

  // Kept for non-icon elements (left column cross-fade) — same clock, explicit type
  const sharedTransition = useMemo(() => ({
    type: "tween" as const,
    duration: 0.22,
    ease: [0.32, 0.72, 0, 1] as const,
  }), []);

  // Sync Search state with URL query parameters for /library
  const qParam = searchParams.get('q') || '';
  const [localSearch, setLocalSearch] = useState(qParam);

  useEffect(() => {
    setLocalSearch(qParam);
  }, [qParam]);

  useEffect(() => {
    if (pathname === '/library') {
      const handler = setTimeout(() => {
        const paramsObj = new URLSearchParams(window.location.search);
        if (localSearch) {
          paramsObj.set('q', localSearch);
        } else {
          paramsObj.delete('q');
        }
        router.replace(`/library?${paramsObj.toString()}`);
      }, 250);
      return () => clearTimeout(handler);
    }
  }, [localSearch, pathname, router]);

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
    setMounted(true);

    const localHour = new Date().getHours();
    let currentGreeting = "Good Morning";
    if (localHour >= 12 && localHour < 18) {
      currentGreeting = "Good Afternoon";
    } else if (localHour >= 18) {
      currentGreeting = "Good Evening";
    }
    setGreeting(currentGreeting);

    const fullName = user?.user_metadata?.full_name || user?.user_metadata?.nickname || user?.email?.split('@')[0] || "Learner";
    const nameFirst = fullName.split(' ')[0] || "Learner";
    const capitalizedName = nameFirst.charAt(0).toUpperCase() + nameFirst.slice(1);
    setFirstName(capitalizedName);

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
    return notifications ? notifications.filter((n) => !n.isRead) : [];
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

  const activeSort = searchParams.get('sort') || 'newest';
  const handleSortChange = (sortType: string) => {
    const paramsObj = new URLSearchParams(window.location.search);
    paramsObj.set('sort', sortType);
    router.replace(`/library?${paramsObj.toString()}`);
    setIsSortMenuOpen(false);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          text: `I'm currently on a ${streak || 0}-day study streak on Omnave! 🚀`
        });
      }
    } catch {}
  };

  // Find dynamic lesson progress and title on lesson/[id]
  const currentLessonData = useMemo(() => {
    if (pathname.startsWith('/lesson/')) {
      const id = params?.id as string;
      const lesson = lessons?.find((l) => l.id === id);
      if (lesson) {
        const progress = calculateKitProgress(lesson, quizScores);
        const getCleanTitle = (path?: string | null) => {
          if (!path) return "Study Material";
          const base = path.split("/").pop() || "";
          const name = base.replace(/^\d+_/, "");
          return name.replace(".pdf", "") || "Study Material";
        };
        const title = lesson.title || getCleanTitle(lesson.file_path);
        return { title, progress };
      }
    }
    return null;
  }, [pathname, params, lessons, quizScores]);

  // Route styling checks
  const isFlatWhiteRoute = pathname === '/progress' || pathname === '/profile' || pathname.startsWith('/lesson/');

  // Determine which page content should show in the Left column of Header
  const renderLeftSection = () => {
    if (pathname === '/library') {
      return (
        <div className="w-full relative flex items-center pr-2">
          <motion.div 
            layoutId="search-icon-layout" 
            transition={sharedTransition} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          >
            <Search size={18} />
          </motion.div>
          <input
            type="text"
            placeholder="Search study kits..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full bg-white text-black pl-11 pr-4 py-3 rounded-full text-sm outline-none border-none shadow-[0px_4px_10px_rgba(0,0,0,0.05)] font-poppins"
          />
        </div>
      );
    }

    if (pathname === '/settings') {
      return (
        <div className="flex items-center gap-3 min-w-0">
          <motion.button
            layoutId="back-button-layout"
            transition={sharedTransition}
            onClick={() => router.back()}
            className="bg-white/15 text-white p-2 rounded-full h-10 w-10 flex items-center justify-center cursor-pointer hover:bg-white/25 active:scale-95 transition-all border-none focus-visible:outline-none"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <h1 className="text-[18px] leading-[27px] font-poppins font-semibold text-white truncate">
            Settings
          </h1>
        </div>
      );
    }

    if (pathname.startsWith('/lesson/')) {
      return (
        <div className="flex items-center gap-3 min-w-0">
          <motion.button
            layoutId="back-button-layout"
            transition={sharedTransition}
            onClick={() => router.push('/library')}
            className={`p-2 rounded-full h-10 w-10 flex items-center justify-center cursor-pointer active:scale-95 transition-all focus-visible:outline-none ${
              isFlatWhiteRoute
                ? 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 shadow-sm'
                : 'bg-white/15 text-white hover:bg-white/25 border-none'
            }`}
            aria-label="Go back to Library"
          >
            <ChevronLeft size={20} />
          </motion.button>
          <h1 className={`text-[15px] leading-[22px] font-poppins font-semibold truncate ${
            isFlatWhiteRoute ? 'text-gray-900' : 'text-white'
          }`}>
            {currentLessonData?.title || "Study Material"}
          </h1>
        </div>
      );
    }

    if (pathname === '/progress') {
      return (
        <h1 className={`text-[24px] font-poppins font-bold ${isFlatWhiteRoute ? 'text-gray-900' : 'text-white'}`}>
          Progress
        </h1>
      );
    }

    if (pathname === '/profile') {
      return (
        <h1 className={`text-[24px] font-poppins font-bold ${isFlatWhiteRoute ? 'text-gray-900' : 'text-white'}`}>
          Profile
        </h1>
      );
    }

    if (pathname === '/upload') {
      return (
        <h1 className="text-[18px] leading-[27px] font-poppins font-semibold text-white">
          Upload Study Kit
        </h1>
      );
    }

    // Default: Home Page Greeting
    return (
      <div className="flex-1 min-w-0">
        <h1 className={`text-[18px] leading-[27px] font-poppins font-semibold truncate ${isFlatWhiteRoute ? 'text-gray-900' : 'text-white'}`}>
          {greeting}, {firstName}
        </h1>
        <p className={`font-poppins text-[12px] uppercase tracking-wider mt-1 ${isFlatWhiteRoute ? 'text-gray-500' : 'text-white/80'}`}>
          {formattedDate}
        </p>
      </div>
    );
  };

  const showBell = pathname === '/home' || pathname === '/progress' || pathname === '/profile' || pathname === '/upload';
  const showSettings = pathname === '/home' || pathname === '/progress' || pathname === '/profile' || pathname === '/upload';

  if (!mounted) {
    return (
      <header
        className="w-full bg-[#6949a8]/80 backdrop-blur-xl relative z-10 flex-none pb-20 animate-pulse"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 48px)' }}
      >
        <div className="max-w-5xl mx-auto px-[25px] flex justify-between items-center gap-4 select-none">
          <div className="h-6 w-48 bg-white/20 rounded mb-2" />
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20" />
            <div className="w-10 h-10 rounded-full bg-white/20" />
          </div>
        </div>
      </header>
    );
  }

  // Adaptive button classes for dark/light headers — locked to exact px dimensions to prevent Flexbox compression
  // No `transition-all` or `active:scale-95` here — CSS transitions fight Framer Motion's
  // layout projection and cause the border-radius / transform snap on shared-layout handoff.
  const iconBtnClass = `p-2 rounded-full w-[40px] h-[40px] min-w-[40px] min-h-[40px] max-w-[40px] max-h-[40px] flex items-center justify-center cursor-pointer shadow-premium-glass border z-40 shrink-0 block overflow-hidden ${
    isFlatWhiteRoute 
      ? 'bg-white text-gray-900 border-gray-100 hover:bg-gray-50' 
      : 'bg-white text-[#6949a8] border-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70'
  }`;

  return (
    <header
      className={`w-full relative z-10 flex-none transition-all duration-200 ${
        isFlatWhiteRoute
          ? 'bg-white/75 backdrop-blur-xl pb-4 border-b border-gray-100 shadow-sm'
          : 'bg-[#6949a8]/80 backdrop-blur-xl pb-23'
      }`}
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 28px)',
      }}
    >
      <div className="max-w-5xl mx-auto px-[25px] flex justify-between items-center gap-4 select-none relative z-30">
        
        {/* Left Column: Title, search or navigation with dynamic cross-fade */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={pathname.startsWith('/lesson/') ? '/lesson' : pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={sharedTransition}
              className="w-full flex items-center"
            >
              {renderLeftSection()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Column: Dynamic Action Buttons — layout tweens parent width, locked children prevent icon distortion */}
        <motion.div layout="position" transition={motionMasterTiming} className="flex items-center gap-3 relative shrink-0">
          <AnimatePresence mode="popLayout">
            
            {/* Bell Button (Shared layout) */}
            {/* NOTE: scale-pulse keyframe removed — the 40px overflow-hidden container clips any
                scale > 1, producing a visible snap-back on handoff. The isPulsing state is kept
                to drive the green-dot indicator only; no secondary animation clock is injected. */}
            {showBell && (
              <motion.button 
                id="notification-bell-btn"
                key="bell-btn"
                layoutId="bell-button-layout"
                layout="position"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={motionMasterTiming}
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                whileTap={{ scale: 0.90 }}
                className={iconBtnClass}
                style={{ borderRadius: '50%' }}
                aria-label="View notifications"
              >
                <Bell size={20}/>
                {!loading && hasUnread && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#00d047] rounded-full border border-white" />
                )}
              </motion.button>
            )}

            {/* Settings Button (Shared layout) */}
            {showSettings && (
              <motion.button 
                key="settings-btn"
                layoutId="settings-button-layout"
                layout="position"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={motionMasterTiming}
                onClick={() => router.push('/settings')}
                whileTap={{ scale: 0.90 }}
                className={iconBtnClass}
                style={{ borderRadius: '50%' }}
                aria-label="Open settings menu"
              >
                <Settings size={20}/>
              </motion.button>
            )}

            {/* Share Button (Progress Page only - Exiting right) */}
            {pathname === '/progress' && (
              <motion.button 
                key="share-btn"
                layout="position"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={motionMasterTiming}
                onClick={handleShare}
                whileTap={{ scale: 0.90 }}
                className={iconBtnClass}
                style={{ borderRadius: '50%' }}
                aria-label="Share stats"
              >
                <Share2 size={18} />
              </motion.button>
            )}

            {/* Filter/Sort Button (Library Page only - Exiting right) */}
            {pathname === '/library' && (
              <motion.div
                key="sort-btn-wrapper"
                layout="position"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={motionMasterTiming}
                className="relative shrink-0"
              >
                <button
                  onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                  className="w-[40px] h-[40px] min-w-[40px] min-h-[40px] max-w-[40px] max-h-[40px] bg-white rounded-full flex items-center justify-center border-none cursor-pointer shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:bg-gray-50 shrink-0 block overflow-hidden"
                  style={{ borderRadius: '50%' }}
                  title="Sort Library"
                >
                  <SlidersHorizontal size={18} className="text-[#6949a8]" />
                </button>
                {isSortMenuOpen && (
                  <div className="absolute top-14 right-0 w-40 bg-white rounded-2xl shadow-[0px_8px_20px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden z-50 py-1 flex flex-col font-poppins">
                    {(['newest', 'oldest', 'a-z', 'progress'] as const).map((sortType) => (
                      <button
                        key={sortType}
                        onClick={() => handleSortChange(sortType)}
                        className={`px-4 py-2.5 text-left text-xs font-semibold hover:bg-gray-50 transition-colors border-none cursor-pointer ${activeSort === sortType ? 'text-[#6949a8] bg-[#6949a8]/5' : 'text-gray-600'}`}
                      >
                        {sortType === 'newest' ? 'Newest First' : sortType === 'oldest' ? 'Oldest First' : sortType === 'a-z' ? 'A-Z' : 'Highest Progress'}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Search circular button (Settings Page only - Exiting right, shared search icon) */}
            {pathname === '/settings' && (
              <motion.button 
                key="search-circular-btn"
                layout="position"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={motionMasterTiming}
                className="bg-white text-[#6949a8] p-2 rounded-full w-[40px] h-[40px] min-w-[40px] min-h-[40px] max-w-[40px] max-h-[40px] flex items-center justify-center cursor-pointer shadow-premium-glass border-none focus-visible:outline-none z-40 shrink-0 block overflow-hidden"
                style={{ borderRadius: '50%' }}
                aria-label="Search settings"
              >
                <motion.div layoutId="search-icon-layout" layout="position" transition={motionMasterTiming}>
                  <Search size={20} />
                </motion.div>
              </motion.button>
            )}

            {/* Progress Circle percentage (Lesson Page only - Exiting right) */}
            {pathname.startsWith('/lesson/') && currentLessonData && (
              <motion.div 
                key="lesson-progress-circle"
                layout="position"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={motionMasterTiming}
                className={`w-[40px] h-[40px] min-w-[40px] min-h-[40px] max-w-[40px] max-h-[40px] rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 z-40 block overflow-hidden ${
                  isFlatWhiteRoute
                    ? 'border-2 border-gray-200 bg-white text-gray-900 shadow-sm'
                    : 'border-2 border-white/20 bg-white/10 text-white'
                }`}
                style={{ borderRadius: '50%' }}
              >
                {currentLessonData.progress}%
              </motion.div>
            )}

          </AnimatePresence>

          {/* macOS Notification Popover dropdown (positioned absolutely outside normal flow) */}
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
                    className="absolute right-4 p-1 text-[#525252] hover:text-black rounded-lg hover:bg-black/5 transition-colors cursor-pointer border-none bg-transparent"
                    aria-label="Close notifications"
                  >
                    <X size={14} />
                  </button>

                  <span className="text-xs font-bold text-black font-poppins">Notifications</span>

                  {notifications && notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="absolute left-4 text-[10px] font-bold text-[#525252] hover:text-black uppercase tracking-widest transition-colors cursor-pointer border-none bg-transparent"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Active Task (AI Uploading Progress in Background) */}
                {uploadStatus === "uploading" && (
                  <div className="p-4 bg-[#6949a8]/5 border-b border-[#EBEBEB] flex flex-row items-center gap-4 relative text-left">
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
                  {(!notifications || notifications.length === 0) && uploadStatus !== "uploading" ? (
                    <div className="p-8 text-center text-xs text-[#525252] select-none">
                      You&apos;re all caught up!
                    </div>
                  ) : (
                    notifications && notifications.map((n) => {
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

        </motion.div>
      </div>
    </header>
  );
}