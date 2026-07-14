"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteLessonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteLessonDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteLessonDialogProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isDeleting]);

  useEffect(() => {
    if (isOpen) {
      const cancelButton = modalRef.current?.querySelector('button[aria-label="Cancel deletion"]') as HTMLButtonElement;
      cancelButton?.focus();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isDeleting) onClose();
            }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            ref={modalRef}
            className="relative w-full max-w-md bg-[#151C2C] border border-white/10 rounded-[24px] p-6 text-white z-10 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Alert icon wrapper */}
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h3 id="delete-dialog-title" className="text-lg font-black tracking-tight text-white">
                  Delete Lesson?
                </h3>
                <p id="delete-dialog-description" className="text-xs text-white/50 font-medium leading-relaxed max-w-xs">
                  This action cannot be undone. It will permanently remove all generated materials for this study session:
                </p>
              </div>

              {/* Checklist details */}
              <div className="w-full text-left bg-white/[0.01] border border-white/5 rounded-2xl p-4 space-y-2">
                {[
                  "Study Summaries",
                  "3D Leitner Flashcards",
                  "Exam Practice Quizzes",
                  "AI Tutor Chat History",
                  "Personal Mastery Progress"
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs font-semibold text-white/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" aria-hidden="true" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 w-full pt-2">
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  aria-label="Cancel deletion"
                  className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-extrabold rounded-xl border border-white/10 transition-colors disabled:opacity-50 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isDeleting}
                  aria-label="Confirm delete lesson"
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm focus:outline-none active:scale-98 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
