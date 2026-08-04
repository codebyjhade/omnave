"use client";

import { useUserContext } from "@/context/UserContext";
import { useProgressStats } from "@/hooks/useProgressStats";
import { calculateKitProgress } from "@/hooks/useProgressStats";
import { 
  BookOpen,
  Clock,
  Target,
  Flame
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import StaggerContainer from "@/components/ui/animation/StaggerContainer";
import StaggerItem from "@/components/ui/animation/StaggerItem";

import { Skeleton } from "@/components/Skeleton";

export default function ProgressPage() {
  const router = useRouter();
  const { 
    xp, 
    streak, 
    lessons: notes, 
    quizScores, 
    quizzesCount, 
    loading, 
    gamificationStats
  } = useUserContext();

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
      <div className="w-full flex-1 flex flex-col pt-2" aria-hidden="true">
        {/* Overview Widgets Grid Skeleton */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-[24px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] p-5 border border-gray-50 flex flex-col justify-center items-start relative h-[88px]"
            >
              <Skeleton className="absolute top-4 right-4 w-5 h-5 rounded-md" />
              <Skeleton className="h-8 w-12 rounded-md mb-1.5 animate-pulse" />
              <Skeleton className="h-3 w-24 rounded-md" />
            </div>
          ))}
        </div>

        {/* Learning Consistency (Compact Heatmap) Card Skeleton */}
        <div className="bg-white rounded-[24px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] p-6 border border-gray-50 mb-6 flex flex-col gap-4">
          <Skeleton className="h-6 w-48 rounded-md" />
          <div className="flex gap-1 overflow-hidden h-[96px] w-full">
            {/* Mock heatmap columns */}
            {Array.from({ length: 24 }).map((_, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, rowIdx) => (
                  <Skeleton key={rowIdx} className="w-3 h-3 rounded-sm shrink-0" />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 justify-end mt-1">
            <Skeleton className="h-3 w-8 rounded-md" />
            <Skeleton className="w-2.5 h-2.5 rounded-sm" />
            <Skeleton className="w-2.5 h-2.5 rounded-sm" />
            <Skeleton className="w-2.5 h-2.5 rounded-sm" />
            <Skeleton className="w-2.5 h-2.5 rounded-sm" />
            <Skeleton className="h-3 w-8 rounded-md" />
          </div>
        </div>

        {/* Lessons Learned Card Skeleton */}
        <div className="bg-white rounded-[24px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] p-6 border border-gray-50 mb-6 flex flex-col gap-4">
          <Skeleton className="h-6 w-36 rounded-md" />
          <div className="flex flex-row items-stretch h-24 w-full gap-3">
            <div className="flex flex-col justify-between w-6 h-full pb-4">
              <Skeleton className="h-2.5 w-4 rounded-md" />
              <Skeleton className="h-2.5 w-4 rounded-md" />
              <Skeleton className="h-2.5 w-4 rounded-md" />
            </div>
            <div className="flex-1 flex flex-row items-end justify-between h-full border-b border-gray-100 pb-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                  <div className="w-5 bg-purple-50 rounded-full h-full flex items-end overflow-hidden">
                    <Skeleton className="w-full h-1/2 rounded-full" />
                  </div>
                  <Skeleton className="h-2.5 w-3 rounded-md mt-1" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Study Kit Mastery Card Skeleton */}
        <div className="bg-white rounded-[24px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] p-6 border border-gray-50 flex flex-col gap-4">
          <Skeleton className="h-6 w-40 rounded-md" />
          <div className="flex flex-col gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4">
                  <Skeleton className="h-4 w-1/2 rounded-md animate-pulse" />
                  <Skeleton className="h-4 w-10 rounded-md" />
                </div>
                <Skeleton className="w-full h-2 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const avgScore = stats.overallAvg || 0;

  return (
    <div className="w-full flex-1 flex flex-col pt-2">
      <StaggerContainer staggerChildren={0.08} className="w-full flex flex-col gap-6">
        
        {/* Overview Widgets Grid */}
        <StaggerItem className="grid grid-cols-2 gap-4 mb-6">
          
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
        </StaggerItem>

        {/* Learning Consistency (Compact Heatmap) Card */}
        <StaggerItem className="bg-white rounded-[24px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] p-6 border border-gray-50 mb-6 text-left select-none">
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
        </StaggerItem>

        {/* Lessons Learned Card */}
        <StaggerItem className="bg-white rounded-[24px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] p-6 border border-gray-50 mb-6 text-left select-none">
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
        </StaggerItem>

        {/* Study Kit Mastery Card */}
        <StaggerItem className="bg-white rounded-[24px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] p-6 border border-gray-50 text-left select-none">
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
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
