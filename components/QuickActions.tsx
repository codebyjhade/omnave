"use client";

import Link from "next/link";

export default function QuickActions() {
  const actions = [
    {
      title: "Import Material",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>,
      href: "/import"
    },
    {
      title: "Flashcards",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-0-5H20"/></svg>,
      href: "#"
    },
    {
      title: "Quiz Tools",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
      href: "#"
    },
    {
      title: "Exam Prep",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
      href: "#"
    },
    {
      title: "Mind Map",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 1-4-4V9"/><circle cx="9" cy="5" r="4"/><circle cx="20" cy="20" r="4"/></svg>,
      href: "#"
    },
    {
      title: "Smart Notes",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
      href: "#"
    }
  ];

  return (
    <div className="w-full flex flex-col">
      {/* Section Header */}
      <span className="text-[10px] font-extrabold tracking-[0.2em] text-white/40 uppercase mb-4 pl-2">
        Quick Actions
      </span>

      {/* Compact Bento Grid */}
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <ActionCard key={index} {...action} />
        ))}
      </div>
    </div>
  );
}

function ActionCard({ title, icon, href }: { title: string, icon: React.ReactNode, href: string }) {
  return (
    <Link
      href={href}
      className="relative group flex items-center gap-3.5 px-4 h-16 bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl rounded-2xl overflow-hidden hover:bg-white/[0.05] hover:border-omnave-primary/20 transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-lg outline-none focus-visible:ring-1 focus-visible:ring-omnave-primary/50"
    >
      {/* Subtle ambient glow orb on hover */}
      <div className="absolute -top-8 -right-8 w-20 h-20 bg-omnave-primary/10 blur-[30px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Icon Container */}
      <div className="relative z-10 flex items-center justify-center size-9 rounded-lg bg-white/5 border border-white/10 text-white/60 group-hover:text-white group-hover:bg-button-gradient group-hover:border-transparent group-hover:shadow-[0_2px_10px_rgba(127,34,254,0.4)] transition-all duration-300 shrink-0">
        {icon}
      </div>

      {/* Typography */}
      <span className="relative z-10 text-sm font-bold text-white/90 group-hover:text-white transition-colors duration-300 leading-tight truncate">
        {title}
      </span>
    </Link>
  );
}