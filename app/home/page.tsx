'use client';

import { motion } from "framer-motion";
import Header from "@/components/Header";
import CurrentLessonCard from "@/components/CurrentLessonCard";
import QuickActions from "@/components/QuickActions";
import ContinueLearning from "@/components/ContinueLearning";
import ProgressOverview from "@/components/ProgressOverview";
import Checklist from "@/components/Checklist";
import AIRecommendation from "@/components/AIRecommendation";

export default function HomePage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} 
      className="w-full max-w-[1200px] mx-auto pt-28 md:pt-24 pb-40 md:pb-24 lg:px-10 xl:px-12 flex flex-col gap-8 md:gap-12"
    >
      {/* Header stays full-width at the very top */}
      <div className="px-6 md:px-10 lg:px-0">
        <Header/>
      </div>
      
      {/* The Magic Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        
        {/* Main Stage (Left Column on Desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-10">
          <div className="px-6 md:px-10 lg:px-0">
            <CurrentLessonCard/>
          </div>
          <div className="px-6 md:px-10 lg:px-0">
            <QuickActions/>
          </div>
          <ContinueLearning/>
        </div>
        
        {/* Context Sidebar (Right Column on Desktop) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-10">
          <div className="px-6 md:px-10 lg:px-0">
            <ProgressOverview/>
          </div>
          <div className="px-6 md:px-10 lg:px-0">
            <Checklist/>
          </div>
          <div className="px-6 md:px-10 lg:px-0">
            <AIRecommendation/>
          </div>
        </div>

      </div>
    </motion.div>
  );
}