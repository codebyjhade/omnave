"use client";

import { useState, useEffect } from "react";
import { useUserContext } from "@/context/UserContext";

export default function Header() {
  const { quizScores, user } = useUserContext();
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState("GOOD MORNING,");
  const [firstName, setFirstName] = useState("Learner");

  useEffect(() => {
    setMounted(true);

    const localHour = new Date().getHours();
    let currentGreeting = "GOOD MORNING,";
    if (localHour >= 12 && localHour < 18) {
      currentGreeting = "GOOD AFTERNOON,";
    } else if (localHour >= 18) {
      currentGreeting = "GOOD EVENING,";
    }
    setGreeting(currentGreeting);

    const fullName = user?.user_metadata?.full_name || user?.user_metadata?.nickname || user?.email?.split('@')[0] || "Learner";
    const nameFirst = fullName.split(' ')[0] || "Learner";
    setFirstName(nameFirst);
  }, [user]);

  // Calculate dynamic study minutes for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const quizzesToday = quizScores.filter((score) => {
    if (!score.created_at) return false;
    const scoreDate = new Date(score.created_at);
    scoreDate.setHours(0, 0, 0, 0);
    return scoreDate.getTime() === today.getTime();
  }).length;

  const todayStudyMinutes = quizzesToday * 15;
  const hours = Math.floor(todayStudyMinutes / 60);
  const mins = todayStudyMinutes % 60;

  if (!mounted) {
    return null;
  }

  return (
    <header className="flex flex-row justify-between items-end w-full mb-2">
      {/* Left Side: Typography */}
      <div className="flex flex-col">
        <h2 className="text-[10px] md:text-xs font-extrabold tracking-[0.2em] text-neutral-500 uppercase">
          {greeting}
        </h2>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mt-1">
          {firstName}.
        </h1>
      </div>
      
      {/* Right Side: Live Study Time Pill */}
      <div className="mb-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-1.5 shadow-sm select-none">
        <span className="text-omnave-primary text-xs">⚡</span>
        <span className="text-xs text-white/80 font-medium tracking-wide">
          {hours}h {mins}m today
        </span>
      </div>
    </header>
  );
}