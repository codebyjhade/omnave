"use client";

import { useState, useEffect } from "react";
import { useUserContext } from "@/context/UserContext";

export default function Header() {
  const { user } = useUserContext();
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState("Good evening");
  const [firstName, setFirstName] = useState("Jhade");
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    setMounted(true);

    const localHour = new Date().getHours();
    let currentGreeting = "Good morning";
    if (localHour >= 12 && localHour < 18) {
      currentGreeting = "Good afternoon";
    } else if (localHour >= 18) {
      currentGreeting = "Good evening";
    }
    setGreeting(currentGreeting);

    const fullName = user?.user_metadata?.full_name || user?.user_metadata?.nickname || user?.email?.split('@')[0] || "Jhade";
    let nameFirst = fullName.split(' ')[0] || "Jhade";
    if (nameFirst === "Learner" || nameFirst === "Bryan" || nameFirst === "Aven") {
      nameFirst = "Jhade";
    }
    setFirstName(nameFirst);

    // Format current date: e.g. "Wednesday, July 22"
    const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    setFormattedDate(new Date().toLocaleDateString("en-US", dateOptions));
  }, [user]);

  if (!mounted) {
    return (
      <header className="flex flex-col items-start w-full mb-4 animate-pulse">
        <div className="h-4 w-32 bg-white/[0.06] rounded mb-1" />
        <div className="h-8 w-64 bg-white/[0.06] rounded" />
      </header>
    );
  }

  return (
    <header className="flex flex-col items-start w-full mb-4">
      <span className="text-[11px] font-bold tracking-[0.15em] text-zinc-500 uppercase mb-1">
        {formattedDate}
      </span>
      <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">
        {greeting}, {firstName} 👋
      </h1>
    </header>
  );
}