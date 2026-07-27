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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      <header className="flex items-center justify-between w-full mb-4 animate-pulse">
        <div>
          <div className="h-3 w-32 bg-omnave-border rounded mb-2" />
          <div className="h-8 w-64 bg-omnave-border rounded" />
        </div>
        {/* Toggle placeholder to prevent layout shift */}
        <div className="w-9 h-9 rounded-xl bg-omnave-border" />
      </header>
    );
  }

  return (
    <header className="w-full bg-[#6949a8]">
      <div className="max-w-5xl mx-auto px-[25px] pt-2 pb-16 flex flex-col items-start select-none">
        <span className="text-[11px] font-medium tracking-[0.2em] text-[#e9deff] uppercase mb-1.5 font-poppins">
          {formattedDate}
        </span>
        <h1 className="text-3xl font-semibold text-white tracking-tight leading-none font-poppins">
          {greeting}, {firstName}
        </h1>
      </div>
    </header>
  );
}