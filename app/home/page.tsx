'use client';

import Header from "@/components/Header";
import CurrentLessonCard from "@/components/CurrentLessonCard";
import ProgressOverview from "@/components/ProgressOverview";
import Checklist from "@/components/Checklist";
import AIRecommendation from "@/components/AIRecommendation";
import { useLessons } from "@/hooks/useLessons";
import CinematicLaunchpad from "@/components/CinematicLaunchpad";

export default function HomePage() {
  const { lessons, loading } = useLessons();
  const showLaunchpad = !loading && lessons.length === 0;

  return (
    <main className="flex flex-col gap-6 w-full max-w-3xl mx-auto mt-4 bg-transparent pb-40 md:pb-24">
      {/* 1. Greeting Block */}
      <div className="px-6 md:px-10 lg:px-0">
        <Header/>
      </div>
      
      {/* Primary Action & Stats Group (With Backlight Glow) */}
      <div className="relative w-full max-w-4xl mx-auto flex flex-col gap-6 z-10">
        
        {/* Ambient Practical Backlight */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[120%] bg-omnave-primary/15 blur-[120px] rounded-[100%] pointer-events-none z-[-1]" 
          aria-hidden="true" 
        />

        {/* 2. Primary Active Action */}
        <div className="px-6 md:px-10 lg:px-0">
          {showLaunchpad ? <CinematicLaunchpad /> : <CurrentLessonCard />}
        </div>

        {/* 3. Compact Quick Stats */}
        <div className="px-6 md:px-10 lg:px-0">
          <ProgressOverview/>
        </div>
      </div>
      
      {/* 4. Secondary Action (Checklist) */}
      <div className="px-6 md:px-10 lg:px-0">
        <Checklist/>
      </div>
      
      {/* 5. Tertiary Action (AI Recommendation) */}
      <div className="px-6 md:px-10 lg:px-0">
        <AIRecommendation/>
      </div>
    </main>
  );
}