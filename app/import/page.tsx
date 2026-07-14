'use client';

import { motion } from "framer-motion";
import FileUploadArea from "@/components/FileUploadArea";

export default function ImportPage() {
  return (
    <div className="min-h-screen bg-omnave-canvas flex flex-col relative w-full overflow-x-hidden pb-40">
 
      {/* Main Content - Synced with Home layout margins */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[1200px] mx-auto pt-4 pb-40 md:pb-24 lg:px-10 xl:px-12 flex flex-col gap-8 md:gap-12 bg-transparent"
      >
        <div className="w-full max-w-3xl mx-auto px-6 md:px-10 lg:px-0 flex flex-col gap-10">
          {/* Header Section */}
          <div className="flex flex-col items-center text-center gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-omnave-primary/10 border border-omnave-primary/30 text-omnave-primary shadow-[0_0_15px_rgba(127,34,254,0.2)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] mt-0.5">AI Engine Ready</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-lg">
              Upload your material.
            </h1>
            <p className="text-sm md:text-base text-white/50 max-w-md mx-auto">
              Drop your PDFs, lecture slides, or paste a video link. Our AI will instantly convert them into a structured lesson hub.
            </p>
          </div>

          {/* The Drag & Drop Component */}
          <FileUploadArea/>
        </div>

      </motion.div>
    </div>
  );
}