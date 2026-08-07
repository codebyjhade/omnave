"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Hold static logo for 1500ms
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      // Wait for 500ms CSS fade-out transition to complete before unmounting
      const unmountTimer = setTimeout(() => {
        setIsVisible(false);
      }, 500);
      return () => clearTimeout(unmountTimer);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-[#0F0A21] select-none transition-opacity duration-500 pointer-events-none ${
        isFadingOut ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32">
          <Image
            src="/omnave.png"
            alt="Omnave Logo"
            fill
            priority
            sizes="(max-width: 640px) 112px, 128px"
            className="object-contain"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-poppins">
          Omnave
        </h1>
      </div>
    </div>
  );
}
