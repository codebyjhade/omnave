"use client";

import { useEffect } from "react";

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  useEffect(() => {
    // Simulate background Session Check
    const timer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-gray-50 relative select-none">
      <div className="flex flex-col items-center animate-pulse">
        {/* The "◎" Logo Outer Ring */}
        <div className="w-16 h-16 rounded-full border-[3.5px] border-[#6949a8] flex items-center justify-center mb-6">
          {/* Inner Core */}
          <div className="w-6 h-6 bg-[#6949a8] rounded-full"></div>
        </div>

        {/* Brand Name */}
        <h1 className="text-3xl font-black text-gray-900 tracking-[0.2em] uppercase font-poppins">
          Omnave
        </h1>
        
        {/* Tagline */}
        <p className="text-[11px] text-gray-400 font-bold tracking-[0.15em] mt-3 uppercase font-poppins">
          AI Learning Workspace
        </p>
      </div>
    </div>
  );
}
