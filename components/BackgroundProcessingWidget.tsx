"use client";

import React from "react";
import { Sparkles, CheckCircle, AlertCircle, X } from "lucide-react";

interface BackgroundProcessingWidgetProps {
  uploadStatus: "idle" | "uploading" | "success" | "error";
  uploadMessage: string | null;
  uploadProgress: number;
  onDismiss: () => void;
}

export default function BackgroundProcessingWidget({
  uploadStatus,
  uploadMessage,
  uploadProgress,
  onDismiss,
}: BackgroundProcessingWidgetProps) {
  if (uploadStatus === "idle") return null;

  return (
    <div className="fixed bottom-24 right-4 sm:right-8 z-50 bg-[#0f0a1c]/90 backdrop-blur-xl border border-omnave-primary/40 rounded-2xl p-4 shadow-[0_0_30px_rgba(127,34,254,0.2)] flex items-center gap-4 min-w-[300px] max-w-[360px] animate-in slide-in-from-bottom-5 pointer-events-auto">
      {/* Left side: A mini pulsing AI icon inside a glowing ring */}
      <div className="relative flex items-center justify-center size-10 rounded-full bg-omnave-primary/10 border border-omnave-primary/30 shrink-0 shadow-[0_0_10px_rgba(127,34,254,0.2)]">
        {uploadStatus === "uploading" && (
          <Sparkles className="text-omnave-primary animate-pulse" size={18} />
        )}
        {uploadStatus === "success" && (
          <CheckCircle className="text-emerald-400" size={18} />
        )}
        {uploadStatus === "error" && (
          <AlertCircle className="text-red-400" size={18} />
        )}
      </div>

      {/* Middle: The status text stacked above a miniature progress bar */}
      <div className="flex-1 flex flex-col min-w-0 text-left">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-white/40">
            {uploadStatus === "uploading" ? "AI Engine" : 
             uploadStatus === "success" ? "Complete" : "Failed"}
          </span>
          {uploadStatus !== "uploading" && (
            <button 
              onClick={onDismiss}
              className="text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <p className="text-xs font-semibold text-white/80 truncate pr-2">
          {uploadMessage || "Processing material..."}
        </p>

        {/* Progress Bar */}
        {(uploadStatus === "uploading" || uploadStatus === "success") && (
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden mt-2 border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-omnave-primary rounded-full relative transition-all duration-300 ease-out shadow-[0_0_8px_rgba(127,34,254,0.6)]"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Right side: The percentage number */}
      {uploadStatus === "uploading" && (
        <div className="text-sm font-black text-white shrink-0 pl-1">
          {uploadProgress}%
        </div>
      )}
    </div>
  );
}
