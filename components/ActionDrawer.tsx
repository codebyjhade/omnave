"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/context/UserContext";

interface ActionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ActionDrawer({ isOpen, onClose }: ActionDrawerProps) {
  const router = useRouter();
  const { lessons } = useUserContext();
  const [view, setView] = useState<'main' | 'lessons'>('main');
  const [activeTab, setActiveTab] = useState<string>('');

  // Reset view when drawer closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setView('main'), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleActionClick = (actionId: string) => {
    if (actionId === 'import') {
      router.push('/upload');
      onClose();
    } else {
      setActiveTab(actionId);
      setView('lessons');
    }
  };

  const handleLessonClick = (lessonId: string) => {
    router.push(`/lesson/${lessonId}?tab=${activeTab}`);
    onClose();
  };

  const actions = [
    { id: "import", name: "Import", icon: "↑", desc: "Upload PDF or Link" },
    { id: "flashcards", name: "Flashcards", icon: "📄", desc: "Spaced Repetition" },
    { id: "quiz", name: "Quiz Tools", icon: "✓", desc: "Practice Tests" },
    { id: "exam", name: "Exam Prep", icon: "📈", desc: "Master Topics" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Cinematic Blur Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[40]"
            onClick={onClose}
          />

          {/* Floating macOS-Style Island */}
          <div className="fixed inset-x-0 bottom-[100px] z-[50] flex justify-center pointer-events-none px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              // TIER 2: Premium Matte Solid Glass
              className="relative w-full max-w-sm p-6 bg-black/[0.4] border border-white/[0.1] backdrop-blur-2xl rounded-[32px] shadow-[0_25px_70px_rgba(0,0,0,0.7)] pointer-events-auto overflow-hidden min-h-[300px] flex flex-col"
            >
              {/* Ambient Inner Radial Glow (Mirrors Progress/Profile pages) */}
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-omnave-primary/20 blur-[100px] pointer-events-none" aria-hidden="true" />
              
              <AnimatePresence mode="wait">
                {view === 'main' ? (
                  <motion.div 
                    key="main"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10 flex-1 flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-extrabold text-white tracking-tight">Create New</h2>
                      <button 
                        onClick={onClose} 
                        className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white cursor-pointer active:scale-[0.97] active:opacity-80 transition-[background-color,color,opacity] duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
                        aria-label="Close menu"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {actions.map((action) => (
                        <button 
                          key={action.id}
                          onClick={() => handleActionClick(action.id)}
                          // TIER 1: Light Glass
                          className="flex flex-col items-start justify-center p-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] backdrop-blur-xl rounded-2xl shadow-lg active:scale-[0.97] active:opacity-80 transition-[background-color,border-color,opacity] duration-100 group relative overflow-hidden text-left cursor-pointer"
                        >
                          {/* Subtle Hover Glow */}
                          <div className="absolute inset-0 bg-gradient-to-br from-omnave-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          
                          <div className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.05] flex items-center justify-center text-white mb-3 shadow-inner group-hover:border-white/[0.1] transition-colors">
                            {action.icon}
                          </div>
                          <span className="font-bold text-white text-sm mb-0.5 relative z-10">{action.name}</span>
                          <span className="text-[10px] text-white/40 font-medium relative z-10 group-hover:text-white/60 transition-colors">{action.desc}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="lessons"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10 flex flex-col h-full flex-1"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <button 
                        onClick={() => setView('main')} 
                        className="text-white/60 hover:text-white flex items-center gap-1 text-sm font-medium cursor-pointer active:scale-[0.97] active:opacity-80 transition-[color,opacity] duration-100"
                      >
                        ← Back
                      </button>
                      <h2 className="text-sm font-extrabold text-white tracking-tight uppercase text-center absolute left-1/2 -translate-x-1/2">Select Material</h2>
                      <div className="w-8" /> {/* Spacer for centering */}
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-2 max-h-[220px] [&::-webkit-scrollbar]:hidden">
                      {lessons && lessons.length > 0 ? (
                        lessons.map((lesson) => (
                          <button 
                            key={lesson.id}
                            onClick={() => handleLessonClick(lesson.id)}
                            className="w-full text-left p-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] rounded-xl group flex items-center justify-between cursor-pointer active:scale-[0.97] active:opacity-80 transition-[background-color,border-color,opacity] duration-100"
                          >
                            <span className="font-medium text-white truncate pr-4">{lesson.title}</span>
                            <span className="text-white/20 group-hover:text-omnave-primary transition-colors">→</span>
                          </button>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-32 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                          <span className="text-white/40 text-sm mb-2">No materials found.</span>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => { router.push('/upload'); onClose(); }}
                      className="w-full mt-4 py-3 rounded-xl bg-omnave-primary/20 text-omnave-primary font-bold text-sm border border-omnave-primary/30 hover:bg-omnave-primary/30 cursor-pointer active:scale-[0.97] active:opacity-80 transition-[background-color,border-color,opacity] duration-100"
                    >
                      + Import New Material
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
