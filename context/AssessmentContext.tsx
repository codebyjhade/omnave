"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AssessmentContextType {
  isAssessmentActive: boolean;
  setIsAssessmentActive: (val: boolean) => void;
  triggerNavAttempt: (url: string) => void;
  saveAndExitHandler: (() => void) | null;
  setSaveAndExitHandler: (handler: (() => void) | null) => void;
  abandonHandler: (() => void) | null;
  setAbandonHandler: (handler: (() => void) | null) => void;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export function AssessmentProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAssessmentActive, setIsAssessmentActive] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [saveAndExitHandler, setSaveAndExitHandler] = useState<(() => void) | null>(null);
  const [abandonHandler, setAbandonHandler] = useState<(() => void) | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 1. Intercept Reload/Tab Close
  useEffect(() => {
    if (!isAssessmentActive) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Your assessment is currently in progress. Leaving now may result in losing progress.";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isAssessmentActive]);

  // 2. Intercept Browser Back/Forward buttons
  useEffect(() => {
    if (!isAssessmentActive) return;

    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      triggerNavAttempt("/home");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isAssessmentActive]);

  // 3. Global Click Interceptor
  useEffect(() => {
    if (!isAssessmentActive) return;

    const handleGlobalClick = (e: MouseEvent) => {
      let target = e.target as HTMLElement | null;
      while (target && target.tagName !== "A") {
        target = target.parentElement;
      }

      if (target && target.tagName === "A") {
        const href = target.getAttribute("href");
        if (href && (href.startsWith("/") || href.startsWith(window.location.origin))) {
          e.preventDefault();
          e.stopPropagation();
          const targetUrl = href.startsWith("/") ? href : href.slice(window.location.origin.length);
          triggerNavAttempt(targetUrl);
        }
      }
    };

    document.addEventListener("click", handleGlobalClick, true);
    return () => document.removeEventListener("click", handleGlobalClick, true);
  }, [isAssessmentActive]);

  const triggerNavAttempt = (url: string) => {
    setPendingUrl(url);
    setShowConfirmModal(true);
  };

  const handleContinue = () => {
    setShowConfirmModal(false);
    setPendingUrl(null);
  };

  const handleSaveAndExit = () => {
    if (saveAndExitHandler) {
      saveAndExitHandler();
    }
    const target = pendingUrl || "/home";
    setIsAssessmentActive(false);
    setShowConfirmModal(false);
    setPendingUrl(null);
    router.push(target);
  };

  const handleLeaveAnyway = () => {
    if (abandonHandler) {
      abandonHandler();
    }
    const target = pendingUrl || "/home";
    setIsAssessmentActive(false);
    setShowConfirmModal(false);
    setPendingUrl(null);
    router.push(target);
  };

  return (
    <AssessmentContext.Provider
      value={{
        isAssessmentActive,
        setIsAssessmentActive,
        triggerNavAttempt,
        saveAndExitHandler,
        setSaveAndExitHandler,
        abandonHandler,
        setAbandonHandler,
      }}
    >
      {children}

      {/* Leave Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleContinue}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#151C2C] rounded-[24px] border border-white/10 p-6 shadow-2xl space-y-5 text-left z-10"
            >
              <div className="flex items-center gap-3 text-red-500">
                <AlertTriangle size={24} />
                <h3 className="text-sm font-black text-white">Leave Assessment?</h3>
              </div>
              <p className="text-xs text-white/50 leading-relaxed font-medium">
                You currently have an assessment in progress. Leaving now may result in losing your progress. What would you like to do?
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleContinue}
                  className="w-full h-11 bg-omnave-primary hover:brightness-110 text-white text-xs font-black rounded-2xl cursor-pointer"
                >
                  🟣 Continue Assessment
                </button>
                <button
                  onClick={handleSaveAndExit}
                  className="w-full h-11 border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-1 cursor-pointer"
                >
                  💾 Save & Exit
                </button>
                <button
                  onClick={handleLeaveAnyway}
                  className="w-full h-11 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-2xl cursor-pointer"
                >
                  🔴 Leave Anyway
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AssessmentContext.Provider>
  );
}

export function useAssessmentGuard() {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error("useAssessmentGuard must be used within an AssessmentProvider");
  }
  return context;
}
