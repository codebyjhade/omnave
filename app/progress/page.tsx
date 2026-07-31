"use client";

import { useUserContext, Notification } from "@/context/UserContext";
import { useUploadContext } from "@/context/UploadContext";
import { useProgressStats } from "@/hooks/useProgressStats";
import { calculateKitProgress } from "@/hooks/useProgressStats";
import { 
  Check,
  Settings,
  Share2,
  Bell,
  BookOpen,
  Clock,
  Target,
  Flame,
  X,
  FileText
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getLocalDateString } from "@/lib/gamification";

export default function ProgressPage() {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { 
    xp, 
    streak, 
    lessons: notes, 
    quizScores, 
    quizzesCount, 
    loading, 
    gamificationStats,
    notifications = [],
    clearAllNotifications,
    markNotificationAsRead
  } = useUserContext();
  const { uploadStatus, uploadProgress, cancelUpload } = useUploadContext();

  const unreadNotifications = useMemo(() => {
    return notifications ? notifications.filter((n) => !n.isRead) : [];
  }, [notifications]);

  const hasUnread = unreadNotifications.length > 0 || uploadStatus === "uploading";

  // Click outside to close notification popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    setShowNotifications(false);
    if (n.id.startsWith("processed-")) {
      const lessonId = n.id.replace("processed-", "");
      router.push(`/lesson/${lessonId}`);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = useProgressStats(quizScores, notes, xp, streak, quizzesCount);

  // Map 7 days of the week starting from Sunday
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  
  const currentWeekDays = useMemo(() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    
    return daysOfWeek.map((dayName, index) => {
      const diff = index - currentDayOfWeek;
      const dayDate = new Date(today);
      dayDate.setDate(today.getDate() + diff);
      
      const weeklyDataItem = stats.weeklyData.find(
        (d) => d.day === dayName || (d.day === "SUN" && dayName === "SUN") || (d.day === "SAT" && dayName === "SAT")
      );
      const isCompleted = (weeklyDataItem?.sessions || 0) > 0;
      
      return {
        name: dayName,
        shortLabel: dayName.charAt(0) + dayName.slice(1).toLowerCase(),
        dateNum: dayDate.getDate(),
        isCompleted
      };
    });
  }, [stats.weeklyData]);

  // Dynamic Study Kit Mastery matching uploaded PDFs or fallback to mocks
  const studyKitsProgress = useMemo(() => {
    const getCleanTitle = (path: string) => {
      const parts = path.split("_");
      return parts.slice(1).join("_").replace(".pdf", "") || "Study Material.pdf";
    };

    if (!notes || notes.length === 0) {
      return [];
    }

    return notes.slice(0, 3).map((note) => {
      const progress = calculateKitProgress(note, quizScores);
      return {
        title: note.is_processed && note.title ? `${note.title}.pdf` : `${getCleanTitle(note.file_path)}.pdf`,
        score: progress
      };
    });
  }, [notes, quizScores]);

  if (loading) {
    return (
      <main className="min-h-[100dvh] bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#6949a8] border-t-transparent rounded-full" />
      </main>
    );
  }

  const avgScore = stats.overallAvg || 0;

  return (
    <main className="min-h-[100dvh] bg-white overflow-y-auto pb-[120px] px-[25px] pt-[calc(env(safe-area-inset-top)+30px)]">
      
      {/* Header Row */}
      <div className="flex items-center justify-between select-none max-w-md mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-poppins">
          Progress
        </h1>
        <div className="flex items-center gap-2 relative">
          <button 
            onClick={() => router.push('/settings')}
            className="w-10 h-10 rounded-full border border-gray-100 bg-white flex items-center justify-center text-[#6949a8] hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
          >
            <Settings size={18} />
          </button>
          <button 
            onClick={async () => {
              try {
                if (navigator.share) {
                  await navigator.share({
                    text: `I'm currently on a ${streak}-day study streak on BryanAI! 🚀`
                  });
                }
              } catch {}
            }}
            className="w-10 h-10 rounded-full border border-gray-100 bg-white flex items-center justify-center text-[#6949a8] hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
          >
            <Share2 size={18} />
          </button>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-full border border-gray-100 bg-white flex items-center justify-center text-[#6949a8] hover:bg-gray-50 active:scale-95 transition-all cursor-pointer relative"
          >
            <Bell size={18} />
            {!loading && hasUnread && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#00d047] rounded-full border border-white" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
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
                    onClick={() => setShowNotifications(false)}
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
                    <div className="p-8 text-center text-xs text-[#525252] select-none font-medium">
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
        </div>
      </div>

      <div className="w-full max-w-md mx-auto flex flex-col pt-2">
        
        {/* Overview Widgets Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          
          {/* Lessons Completed widget */}
          <div className="bg-white rounded-[24px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] p-5 border border-gray-50 flex flex-col justify-center items-start select-none relative">
            <div className="absolute top-4 right-4 text-purple-300 w-5 h-5 flex items-center justify-center">
              <BookOpen size={20} />
            </div>
            <span className="text-3xl font-black text-[#6949a8] mb-1 font-poppins leading-none">
              {gamificationStats.lessonsCompleted}
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-poppins">
              Lessons Completed
            </span>
          </div>

          {/* Study Hours widget */}
          <div className="bg-white rounded-[24px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] p-5 border border-gray-50 flex flex-col justify-center items-start select-none relative">
            <div className="absolute top-4 right-4 text-blue-300 w-5 h-5 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <span className="text-3xl font-black text-[#6949a8] mb-1 font-poppins leading-none">
              {(gamificationStats.studyMinutes / 60).toFixed(1)}h
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-poppins">
              Study Hours
            </span>
          </div>

          {/* Avg Score widget */}
          <div className="bg-white rounded-[24px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] p-5 border border-gray-50 flex flex-col justify-center items-start select-none relative">
            <div className="absolute top-4 right-4 text-green-300 w-5 h-5 flex items-center justify-center">
              <Target size={20} />
            </div>
            <span className="text-3xl font-black text-[#6949a8] mb-1 font-poppins leading-none">
              {avgScore.toFixed(0)}%
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-poppins">
              Avg. Score
            </span>
          </div>

          {/* Current Streak widget */}
          <div className="bg-white rounded-[24px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] p-5 border border-gray-50 flex flex-col justify-center items-start select-none relative">
            <div className="absolute top-4 right-4 text-orange-300 w-5 h-5 flex items-center justify-center">
              <Flame size={20} />
            </div>
            <span className="text-3xl font-black text-[#6949a8] mb-1 font-poppins leading-none">
              {streak}d
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-poppins">
              Current Streak
            </span>
          </div>
        </div>

        {/* Learning Consistency (Compact Heatmap) Card */}
        <div className="bg-white rounded-[24px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] p-6 border border-gray-50 mb-6 text-left select-none">
          <h2 className="text-lg font-bold text-gray-900 mb-4 font-poppins font-semibold">
            Learning Consistency
          </h2>
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-1 px-1 py-1">
            <div className="grid grid-flow-col grid-rows-7 gap-1 w-max">
              {stats.heatmapDays.map((day, idx) => {
                const opacityClass =
                  day.count === 0
                    ? "bg-gray-100"
                    : day.count === 1
                      ? "bg-[#6949a8]/30"
                      : "bg-[#6949a8]";

                return (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded-sm ${opacityClass} transition-colors duration-150`}
                    title={`${day.count} session${day.count === 1 ? "" : "s"} on ${day.date.toLocaleDateString()}`}
                  />
                );
              })}
            </div>
          </div>
          {/* Heatmap Legend */}
          <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1 justify-end mt-3 select-none">
            <span>Less</span>
            <div className="w-2 h-2 rounded-sm bg-gray-100" />
            <div className="w-2 h-2 rounded-sm bg-[#6949a8]/30" />
            <div className="w-2 h-2 rounded-sm bg-[#6949a8]/60" />
            <div className="w-2 h-2 rounded-sm bg-[#6949a8]" />
            <span>More</span>
          </div>
        </div>

        {/* Lessons Learned Card */}
        <div className="bg-white rounded-[24px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] p-6 border border-gray-50 mb-6 text-left select-none">
          <h2 className="text-lg font-bold text-gray-900 mb-4 font-poppins">
            Lessons Learned
          </h2>
          
          {/* Custom Bar Chart with Y Axis */}
          <div className="flex flex-row items-stretch h-24 w-full">
            {/* Y Axis Labels */}
            <div className="flex flex-col justify-between text-[10px] text-gray-400 font-semibold select-none pr-3 pb-4 text-right w-6">
              <span>8</span>
              <span>4</span>
              <span>0</span>
            </div>
            
            {/* Bars Container */}
            <div className="flex-1 flex flex-row items-end justify-between h-full border-b border-gray-100 pb-4">
              {currentWeekDays.map((day) => {
                const weeklyDataItem = stats.weeklyData.find((d) => d.day === day.name);
                const sessions = weeklyDataItem?.sessions || 0;
                const pct = Math.min(100, (sessions / 8) * 100);
                
                return (
                  <div key={day.name} className="flex-1 flex flex-col items-center justify-end h-full">
                    {/* Rounded Bar */}
                    <div className="w-5 bg-purple-50 rounded-full h-full flex items-end overflow-hidden">
                      <div 
                        className="w-full bg-[#6949a8] rounded-full transition-all duration-500"
                        style={{ height: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 font-semibold mt-1 select-none font-poppins">
                      {day.shortLabel.charAt(0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Study Kit Mastery Card */}
        <div className="bg-white rounded-[24px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] p-6 border border-gray-50 text-left select-none">
          <h2 className="text-lg font-bold text-gray-900 mb-4 font-poppins">
            Study Kit Mastery
          </h2>
          {studyKitsProgress.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-[15px] p-6 flex flex-col items-center justify-center text-center gap-3 font-poppins select-none text-gray-400">
              <div className="w-10 h-10 rounded-full bg-[#6949a8]/5 flex items-center justify-center text-[#6949a8]">
                <Target size={20} />
              </div>
              <p className="text-xs font-semibold text-gray-400 max-w-[280px] leading-relaxed">
                Upload a document and complete your first quiz to see your mastery metrics.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {studyKitsProgress.map((kit, index) => (
                <div key={index} className="flex flex-col">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-gray-800 font-poppins truncate flex-1 text-left">
                      {kit.title}
                    </span>
                    <span className="text-sm text-[#6949a8] font-bold font-poppins shrink-0">
                      {kit.score}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-purple-100 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-[#6949a8] rounded-full transition-all duration-1000 ease-out"
                      style={{ width: mounted ? `${kit.score}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
