"use client";

import Link from "next/link";
import { useUserContext } from "@/context/UserContext";
import { getSubject, getCleanTitle } from "@/hooks/useProgressStats";

export default function ContinueLearning() {
  const { lessons, quizScores } = useUserContext();

  const recentLessons = lessons.slice(0, 2).map((lesson) => {
    const subject = getSubject(lesson.file_path);
    const title = lesson.title || getCleanTitle(lesson.file_path);
    
    // Find the highest score for this specific lesson
    const lessonScores = quizScores.filter((q) => q.lesson_id === lesson.id);
    const progress = lessonScores.length > 0 ? Math.max(...lessonScores.map((s) => s.percentage)) : 0;

    return {
      id: lesson.id,
      subject,
      title,
      subtitle: lesson.created_at ? `Added ${new Date(lesson.created_at).toLocaleDateString()}` : "Added recently",
      progress,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    };
  });

  if (recentLessons.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-4">
      
      {/* Header */}
      <div className="flex flex-col gap-1 mb-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold tracking-[0.2em] text-neutral-500 uppercase">Continue Learning</span>
          <button className="text-xs font-bold text-neutral-500 hover:text-white transition-colors cursor-pointer">Swipe &rarr;</button>
        </div>
      </div>
 
      {/* Horizontal Scroll Container */}
      <div className="flex w-full overflow-x-auto gap-4 pt-2 pb-4 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {recentLessons.map((lesson, idx) => (
          <Link 
            key={idx}
            href={`/lesson/${lesson.id}`}
            className="snap-start shrink-0 w-[280px] md:w-[320px] p-5 pb-7 bg-black/[0.4] border border-white/[0.1] backdrop-blur-2xl rounded-3xl relative overflow-hidden shadow-2xl transition-all duration-300 group hover:bg-black/[0.5] hover:border-omnave-primary/20 hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <div className="flex items-center gap-2 mb-3 text-white/60 group-hover:text-omnave-primary transition-colors">
              {lesson.icon}
              <span className="text-xs font-bold">{lesson.subject}</span>
            </div>
            <h4 className="text-base font-bold text-white mb-1">{lesson.title}</h4>
            <p className="text-[10px] text-white/40 mb-3">{lesson.subtitle}</p>
            
            {/* Absolute Bottom-Edge Progress Bar */}
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/10" role="progressbar" aria-valuenow={lesson.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${lesson.subject} lesson progress`}>
              <div className="h-full bg-omnave-primary shadow-[0_0_10px_rgba(var(--omnave-primary),0.5)] transition-all" style={{ width: `${lesson.progress}%` }} />
            </div>
          </Link>
        ))}

      </div>
    </div>
  );
}