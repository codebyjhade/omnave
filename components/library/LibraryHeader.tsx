"use client";

interface LibraryHeaderProps {
  totalLessons: number;
}

export function LibraryHeader({ totalLessons }: LibraryHeaderProps) {
  return (
    <div className="h-10 px-4 bg-[#151C2C]/60 border border-white/5 backdrop-blur-md rounded-xl flex items-center justify-center text-xs font-black text-white/70 shadow-xs leading-none shrink-0">
      {totalLessons} {totalLessons === 1 ? "Lesson" : "Lessons"}
    </div>
  );
}
