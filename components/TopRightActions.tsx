"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, Menu } from "lucide-react";
import Link from "next/link";

export default function TopRightActions() {
  const pathname = usePathname();

  // Hide on landing/welcome/lesson focus screen
  if (pathname === '/' || pathname === '/welcome' || pathname?.startsWith('/lesson/')) return null;

  return (
    <header className="w-full max-w-[1200px] mx-auto flex items-center px-6 md:px-10 lg:px-12 pt-4 pb-2 bg-transparent border-none shadow-none z-50 select-none pointer-events-auto">
      
      {/* LEFT COLUMN: Dynamic Icon */}
      <div className="flex-1 flex justify-start">
        {pathname === "/profile" ? (
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
            <Bell size={20}/>
          </button>
        ) : (
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
            <Search size={20}/>
          </button>
        )}
      </div>

      {/* CENTER COLUMN: Perfectly Centered Logo */}
      <div className="shrink-0 flex justify-center">
        <Link className="text-2xl font-black text-white tracking-tighter hover:opacity-80 transition-opacity" href="/home">
          omnave.
        </Link>
      </div>

      {/* RIGHT COLUMN: Dynamic Icon */}
      <div className="flex-1 flex justify-end">
        {pathname === "/profile" ? (
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
            <Menu size={20}/>
          </button>
        ) : (
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors relative cursor-pointer">
            <Bell size={20}/>
            {/* Optional Notification Dot */}
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-omnave-primary rounded-full border border-[#0A0A0A]" />
          </button>
        )}
      </div>

    </header>
  );
}