"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";

export default function EmptyLessonCard() {
  const router = useRouter();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full relative group"
    >
      {/* Ambient hover glow */}
      <div className="absolute inset-0 bg-omnave-primary/20 rounded-[24px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" aria-hidden="true" />
      
      {/* Dashed Glassmorphism Container */}
      <div className="relative w-full bg-black/[0.4] border-2 border-dashed border-white/10 hover:border-omnave-primary/50 hover:bg-black/[0.5] transition-all duration-500 rounded-[24px] p-8 md:p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
        
        {/* Icon Container */}
        <div className="w-16 h-16 bg-white/[0.05] border border-white/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-omnave-primary/20 transition-all duration-500">
          <UploadCloud size={24} className="text-white/50" />
        </div>

        {/* Copy */}
        <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
          Welcome to Omnave.
        </h2>
        <p className="text-sm text-white/50 max-w-sm mx-auto mb-8 leading-relaxed">
          Your study hub is currently empty. Upload your first document or paste a link to initialize the AI engine.
        </p>

        {/* Action Button */}
        <button 
          onClick={() => router.push('/upload')}
          className="bg-omnave-primary text-white font-bold px-8 py-3 rounded-xl shadow-[0_0_20px_rgba(127,34,254,0.4)] hover:bg-omnave-primary/90 transition-all active:scale-95 cursor-pointer"
        >
          Import Material
        </button>

      </div>
    </motion.div>
  );
}
