"use client";

import React, { memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileUp, Sparkles } from "lucide-react";

const CinematicLaunchpad = memo(function CinematicLaunchpad() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full relative"
    >
      {/* Container Style with glowing glassmorphism */}
      <div className="bg-[#0f0a1c]/80 backdrop-blur-md border border-purple-500/30 rounded-2xl p-8 relative overflow-hidden shadow-[0_0_30px_rgba(127,34,254,0.15)] flex flex-col items-center justify-center text-center min-h-[300px] md:min-h-[340px] z-10">
        
        {/* Ambient Lighting - absolute radial blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-omnave-primary/20 blur-[80px] pointer-events-none rounded-full" />

        {/* Glowing glass circle icon wrapper */}
        <div className="relative w-16 h-16 bg-white/[0.03] border border-white/10 rounded-full flex items-center justify-center mb-6 shadow-inner z-10 hover:scale-105 transition-all duration-300">
          <FileUp size={28} className="text-omnave-primary animate-pulse" />
          <Sparkles size={16} className="absolute -top-1 -right-1 text-purple-400 animate-bounce" />
        </div>

        {/* Content */}
        <h2 className="text-2xl font-black text-white tracking-tight z-10">
          Your workspace is ready.
        </h2>
        <p className="text-sm text-white/60 max-w-sm mx-auto text-center mt-2 leading-relaxed z-10">
          Drop a PDF, lecture, or note here to let the AI instantly generate your first interactive flashcard deck and quiz.
        </p>

        {/* Call to Action pulsing button */}
        <Link href="/upload" className="inline-block z-10 mt-6">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(127,34,254,0.8)" }}
            whileTap={{ scale: 0.98 }}
            animate={{
              boxShadow: ["0 0 15px rgba(127,34,254,0.4)", "0 0 25px rgba(127,34,254,0.7)", "0 0 15px rgba(127,34,254,0.4)"]
            }}
            transition={{
              boxShadow: {
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut"
              }
            }}
            className="bg-omnave-primary hover:bg-purple-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_15px_rgba(127,34,254,0.5)] cursor-pointer"
          >
            Upload First Document
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
});

export default CinematicLaunchpad;
