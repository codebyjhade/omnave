'use client';

import Header from "@/components/Header";
import CurrentLessonCard from "@/components/CurrentLessonCard";
import CinematicLaunchpad from "@/components/CinematicLaunchpad";
import Checklist from "@/components/Checklist";
import RecentStudyCarousel from "@/components/RecentStudyCarousel";
import ProgressOverview from "@/components/ProgressOverview";
import AIRecommendation from "@/components/AIRecommendation";
import { useLessons } from "@/hooks/useLessons";

export default function HomePage() {
  const { lessons, loading } = useLessons();
  const showLaunchpad = !loading && lessons.length === 0;

  return (
    <main className="w-full max-w-5xl mx-auto px-6 md:px-8 pt-6 pb-20 flex flex-col gap-6 bg-[#0A0A0A]">
      {/* 1. Header: Greeting Block */}
      <Header />

      {/* Bento Grid Layout */}
      <div className="flex flex-col gap-6 w-full">
        {/* Row 1: What to continue? (2/3 cols) & What to do today? (1/3 cols) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <div className="md:col-span-2 flex flex-col justify-stretch">
            {loading ? (
              <div className="relative overflow-hidden bg-[#111111] border border-white/[0.06] rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-lg shadow-black/40 animate-pulse h-full min-h-[220px]">
                <div className="h-6 w-32 bg-white/[0.06] rounded-md" />
                <div className="flex flex-col gap-2 mt-auto">
                  <div className="h-7 w-3/4 bg-white/[0.06] rounded" />
                  <div className="h-4 w-1/2 bg-white/[0.06] rounded" />
                </div>
              </div>
            ) : showLaunchpad ? (
              <CinematicLaunchpad />
            ) : (
              <CurrentLessonCard />
            )}
          </div>

          <div className="md:col-span-1 flex flex-col justify-stretch">
            <Checklist />
          </div>
        </div>

        {/* Row 2: How am I progressing? (1/3 cols) & Recent Study Materials (2/3 cols) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <div className="md:col-span-1 flex flex-col justify-stretch">
            <ProgressOverview />
          </div>

          <div className="md:col-span-2 flex flex-col justify-stretch">
            <RecentStudyCarousel />
          </div>
        </div>

        {/* Row 3: AI Insights / Advice (Full Width) */}
        <div className="w-full">
          <AIRecommendation />
        </div>
      </div>
    </main>
  );
}