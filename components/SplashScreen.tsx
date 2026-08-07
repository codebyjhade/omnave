"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Hold static logo for exactly 1.5 seconds (1500ms), then start fade-out
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 1500);

    // After 1500ms display + 500ms CSS fade-out transition, completely unmount component
    const unmountTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-500 ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      <div className="relative w-36 h-36 sm:w-44 sm:h-44">
        <Image
          src="/omnave.png"
          alt="Omnave Logo"
          fill
          priority
          sizes="(max-width: 640px) 144px, 176px"
          className="object-contain"
        />
      </div>
    </div>
  );
}
