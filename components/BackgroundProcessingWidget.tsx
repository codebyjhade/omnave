"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BackgroundProcessingWidgetProps {
  uploadStatus: "idle" | "uploading" | "success" | "error";
  uploadMessage: string | null;
  uploadProgress: number;
  onDismiss: () => void;
  onCancel?: () => void;
}

export default function BackgroundProcessingWidget({
  uploadStatus,
  uploadMessage,
  onDismiss,
}: BackgroundProcessingWidgetProps) {
  const [isFlying, setIsFlying] = useState(false);
  const [offsets, setOffsets] = useState({ x: 0, y: 0 });
  const [showCenterLoader, setShowCenterLoader] = useState(false);

  // Handle central load drawing and spatial flying transitions
  useEffect(() => {
    if (uploadStatus === "uploading") {
      setShowCenterLoader(true);
      setIsFlying(false);
      
      const timer = setTimeout(() => {
        const bell = document.getElementById("notification-bell-btn");
        const logo = document.getElementById("logo-loading-container");
        
        if (bell && logo) {
          const bellRect = bell.getBoundingClientRect();
          const logoRect = logo.getBoundingClientRect();
          setOffsets({
            x: bellRect.left + (bellRect.width / 2) - (logoRect.left + (logoRect.width / 2)),
            y: bellRect.top + (bellRect.height / 2) - (logoRect.top + (logoRect.height / 2)),
          });
        } else {
          setOffsets({
            x: window.innerWidth / 2 - 40,
            y: -window.innerHeight / 2 + 40,
          });
        }
        setIsFlying(true);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setShowCenterLoader(false);
      setIsFlying(false);
    }
  }, [uploadStatus]);

  if (uploadStatus === "idle") return null;

  return (
    <>
      {/* 1. CENTRAL LOGO DRAWING AND SPATIAL FLYING LOADER */}
      <AnimatePresence>
        {showCenterLoader && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10000] flex flex-col items-center justify-center pointer-events-none select-none">
            <motion.div
              id="logo-loading-container"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={
                isFlying
                  ? {
                      x: offsets.x,
                      y: offsets.y,
                      scale: 0.12,
                      opacity: 0,
                    }
                  : { opacity: 1, scale: 1 }
              }
              exit={{ opacity: 0, scale: 0.9 }}
              transition={
                isFlying
                  ? { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
                  : { type: "spring", damping: 25, stiffness: 280 }
              }
              onAnimationComplete={() => {
                if (isFlying) {
                  window.dispatchEvent(new CustomEvent("pulse-bell-icon"));
                  setShowCenterLoader(false);
                }
              }}
              className="flex flex-col items-center gap-6"
            >
              {/* Actual Omnave Logo Wordmark shape drawing paths with undulation */}
              <motion.div
                animate={{ 
                  scale: [1, 1.03, 0.98, 1.01, 1],
                  filter: [
                    "drop-shadow(0 0 10px rgba(168,85,247,0.5))",
                    "drop-shadow(0 0 20px rgba(168,85,247,0.8))",
                    "drop-shadow(0 0 10px rgba(168,85,247,0.5))"
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="flex items-center justify-center px-4"
              >
                <svg viewBox="0 0 320 80" width="220" className="overflow-visible select-none">
                  {/* Letter 'o' */}
                  <motion.path
                    d="M 30,40 A 15,15 0 1,1 29.9,40 Z"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                  />
                  {/* Letter 'm' */}
                  <motion.path
                    d="M 60,55 V 30 A 8,8 0 0,1 76,30 V 55 M 76,30 A 8,8 0 0,1 92,30 V 55"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.6, ease: "easeInOut", delay: 0.2 }}
                  />
                  {/* Letter 'n' */}
                  <motion.path
                    d="M 110,55 V 30 A 8,8 0 0,1 126,30 V 55"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, ease: "easeInOut", delay: 0.5 }}
                  />
                  {/* Letter 'a' */}
                  <motion.path
                    d="M 155,42.5 A 12.5,12.5 0 1,1 154.9,42.5 Z M 167.5,30 V 55"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.4, ease: "easeInOut", delay: 0.8 }}
                  />
                  {/* Letter 'v' */}
                  <motion.path
                    d="M 185,30 L 195,55 L 205,30"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.0, ease: "easeInOut", delay: 1.1 }}
                  />
                  {/* Letter 'e' */}
                  <motion.path
                    d="M 235,42.5 H 215 A 12.5,12.5 0 1,1 235,40"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.4, ease: "easeInOut", delay: 1.3 }}
                  />
                </svg>
              </motion.div>
              
              {!isFlying && (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[11px] font-bold text-zinc-100 uppercase tracking-[0.25em] animate-pulse">
                    AI is analyzing...
                  </span>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                    Generating Study Kit
                  </span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. COMPLETION OR ERROR TOAST (Bottom-right alert feedback) */}
      <AnimatePresence>
        {uploadStatus !== "uploading" && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-24 right-4 sm:right-8 z-[10000] bg-[#111111]/95 backdrop-blur-md border border-white/[0.08] rounded-2xl p-4 shadow-2xl flex items-center gap-4 min-w-[300px] max-w-[360px] pointer-events-auto"
          >
            <div className="relative flex items-center justify-center size-10 rounded-full shrink-0">
              {uploadStatus === "success" && (
                <CheckCircle className="text-emerald-400" size={24} />
              )}
              {uploadStatus === "error" && (
                <AlertCircle className="text-red-400" size={24} />
              )}
            </div>

            <div className="flex-1 flex flex-col min-w-0 text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                {uploadStatus === "success" ? "AI Engine Complete" : "Failed"}
              </span>
              <p className="text-xs font-semibold text-zinc-100 truncate pr-2 mt-0.5">
                {uploadMessage || "Processing completed."}
              </p>
            </div>

            <button 
              onClick={onDismiss}
              className="text-zinc-500 hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
