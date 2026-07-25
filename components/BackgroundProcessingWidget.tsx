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
          // Fallback coords
          setOffsets({
            x: window.innerWidth / 2 - 40,
            y: -window.innerHeight / 2 + 40,
          });
        }
        setIsFlying(true);
      }, 2800);

      return () => clearTimeout(timer);
    } else {
      setShowCenterLoader(false);
      setIsFlying(false);
    }
  }, [uploadStatus]);

  if (uploadStatus === "idle") return null;

  // Shared trace transition for the letters to trace continuously
  const pathTransition = (delay: number) => ({
    duration: 1.2,
    ease: "easeInOut" as const,
    delay,
    repeat: Infinity,
    repeatType: "loop" as const,
    repeatDelay: 1.5,
  });

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
                  // Pulse the bell icon to signal handoff completion
                  window.dispatchEvent(new CustomEvent("pulse-bell-icon"));
                  setShowCenterLoader(false);
                }
              }}
              className="flex flex-col items-center gap-6"
            >
              {/* Brand Logo Wordmark SVG Trace drawing paths with glow */}
              <motion.div
                animate={{ 
                  scale: [1, 1.02, 0.98, 1.01, 1],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="flex items-center justify-center px-4 filter drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]"
              >
                <>
                  <style>{`
                    @keyframes svg-trace-anim {
                      0% {
                        stroke-dasharray: 400;
                        stroke-dashoffset: 400;
                        fill: transparent;
                      }
                      40% {
                        stroke-dasharray: 400;
                        stroke-dashoffset: 0;
                        fill: transparent;
                      }
                      60% {
                        stroke-dasharray: 400;
                        stroke-dashoffset: 0;
                        fill: rgba(168, 85, 247, 0.15);
                      }
                      100% {
                        stroke-dasharray: 400;
                        stroke-dashoffset: 400;
                        fill: transparent;
                      }
                    }
                    .animate-svg-trace {
                      stroke-dasharray: 400;
                      stroke-dashoffset: 400;
                      animation: svg-trace-anim 4s ease-in-out infinite;
                    }
                  `}</style>
                  <svg width="200" height="60" viewBox="0 0 200 60" className="w-48 h-auto">
                    <text 
                      x="50%" 
                      y="50%" 
                      dominantBaseline="middle" 
                      textAnchor="middle" 
                      fill="transparent" 
                      stroke="#a855f7" 
                      strokeWidth="1.5"
                      className="animate-svg-trace font-brand tracking-widest text-4xl lowercase"
                    >
                      omnave
                    </text>
                  </svg>
                </>
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
