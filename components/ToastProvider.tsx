"use client";

/**
 * Lightweight toast system built on Framer Motion.
 * Zero extra dependencies — uses the framer-motion already in the project.
 *
 * Usage:
 *   const { toast } = useToast();
 *   toast("Coming soon!");
 *   toast("Signed out", "success");
 *   toast("Something went wrong", "error");
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Info, AlertCircle, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastKind = "info" | "success" | "error";

interface ToastItem {
  id: string;
  message: string;
  kind: ToastKind;
}

interface ToastCtx {
  toast: (message: string, kind?: ToastKind) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastCtx>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = crypto.randomUUID();
    setItems((prev) => [...prev, { id, message, kind }]);
    setTimeout(
      () => setItems((prev) => prev.filter((t) => t.id !== id)),
      3200
    );
  }, []);

  const dismiss = (id: string) =>
    setItems((prev) => prev.filter((t) => t.id !== id));

  const iconMap: Record<ToastKind, React.ReactNode> = {
    info: <Info size={15} className="text-omnave-primary shrink-0" />,
    success: <CheckCircle size={15} className="text-[#1db954] shrink-0" />,
    error: <AlertCircle size={15} className="text-red-400 shrink-0" />,
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast Stack — bottom-center, above everything */}
      <div
        className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[99999] flex flex-col items-center gap-2 pointer-events-none w-max max-w-[calc(100vw-2rem)]"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#1A1530]/90 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-sm text-white font-medium select-none"
              role="status"
            >
              {iconMap[t.kind]}
              <span className="leading-snug">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="ml-1 text-white/40 hover:text-white transition-colors cursor-pointer"
                aria-label="Dismiss"
              >
                <X size={13} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
