'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { WifiOff, BookOpen, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export default function OfflineFallbackPage() {
  const router = useRouter();

  const handleReturnToLibrary = () => {
    router.push('/library');
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6 font-poppins relative overflow-hidden text-center">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl -z-10" />

      <div className="bg-white border border-gray-100/80 rounded-[32px] shadow-2xl p-8 max-w-md w-full flex flex-col items-center gap-6 relative z-10">
        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-[#6949a8] shadow-sm">
          <WifiOff size={28} />
        </div>

        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-xl font-bold text-gray-900 leading-snug">
            Page Unavailable Offline
          </h1>
          <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-xs mx-auto">
            This section hasn&apos;t been cached for offline access yet. Connect to the internet or return to your cached Offline Library.
          </p>
        </div>

        <button
          onClick={handleReturnToLibrary}
          className="w-full bg-[#6949a8] hover:bg-[#563b8c] text-white font-semibold py-3.5 px-6 rounded-full text-xs transition-all shadow-[0_4px_15px_rgba(105,73,168,0.3)] active:scale-95 cursor-pointer border-none flex items-center justify-center gap-2"
        >
          <BookOpen size={16} />
          <span>Return to Offline Library</span>
        </button>
      </div>
    </div>
  );
}
