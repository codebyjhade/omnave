"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Instantly remove SSR inline splash placeholder once React hydrates
    const ssrElement = document.getElementById("ssr-splash-screen");
    if (ssrElement) {
      ssrElement.remove();
    }

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
      className={`fixed inset-0 z-[999999] flex items-center justify-center bg-white select-none transition-opacity duration-500 pointer-events-none ${
        isFadingOut ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28">
          <Image
            src="/omnave.png"
            alt="Omnave Logo"
            fill
            priority
            sizes="(max-width: 640px) 96px, 112px"
            className="object-contain drop-shadow-sm"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-poppins">
          Omnave
        </h1>
      </div>
    </div>
  );
}
