"use client";

import React from "react";
import { Target, Brain, BarChart3 } from "lucide-react";

export default function FeatureCarousel() {
  const features = [
    {
      title: "Interactive Quizzes",
      description: "Instantly generate dynamic quizzes from your uploaded PDFs and lectures.",
      icon: <Target className="w-6 h-6 text-omnave-primary" />
    },
    {
      title: "Spaced Repetition",
      description: "Master concepts faster with 3D flashcards that adapt to your memory.",
      icon: <Brain className="w-6 h-6 text-indigo-400" />
    },
    {
      title: "Deep-Dive Analytics",
      description: "Track your study progress and pinpoint exactly where you need to improve.",
      icon: <BarChart3 className="w-6 h-6 text-emerald-400" />
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto mt-16 mb-24 select-none">
      {/* Hide scrollbar using utility classes but keep functionality */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-6 pb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        {/* Empty div for starting padding so the first card doesn't stick to the edge */}
        <div className="min-w-[1px] md:hidden"></div>

        {features.map((feature, idx) => (
          <div 
            key={idx} 
            className="min-w-[280px] md:min-w-[320px] snap-center flex flex-col items-start p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl shrink-0"
          >
            <div className="text-3xl mb-4 bg-white/10 p-3 rounded-2xl">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
        
        {/* Empty div for ending padding */}
        <div className="min-w-[1px] md:hidden"></div>
      </div>
    </div>
  );
}
