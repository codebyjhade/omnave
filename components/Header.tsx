"use client";

import { useUserContext } from "@/context/UserContext";

export default function Header() {
  const { quizScores } = useUserContext();

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

  return (
    <header className="flex flex-row justify-between items-end w-full mb-2">
      {/* Left Side: Typography */}
      <div className="flex flex-col">
        <h2 className="text-[10px] md:text-xs font-extrabold tracking-[0.2em] text-neutral-500 uppercase">
          Good Morning,
        </h2>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mt-1">
          Bryan.
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