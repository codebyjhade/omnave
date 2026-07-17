"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useUserContext } from "@/context/UserContext";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, refreshUser } = useUserContext();
  const [displayName, setDisplayName] = useState("");
  const [major, setMajor] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen && user) {
      const currentName = user.user_metadata?.nickname || user.user_metadata?.full_name || user.email?.split("@")[0] || "";
      setDisplayName(currentName);
      
      let currentTag = "";
      if (user.user_metadata?.tags && Array.isArray(user.user_metadata.tags) && user.user_metadata.tags.length > 0) {
        currentTag = user.user_metadata.tags[0];
      } else if (user.user_metadata?.major) {
        currentTag = user.user_metadata.major;
      }
      setMajor(currentTag || "Learner");
      setErrorMessage("");
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMessage("Display name cannot be empty.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase.auth.updateUser({
        data: {
          nickname: displayName.trim(),
          tags: [major.trim() || "Learner"]
        }
      });

      if (error) throw error;

      await refreshUser();
      onClose();
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setErrorMessage(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const initial = displayName ? displayName.charAt(0).toUpperCase() : "L";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 cursor-pointer"
          />

          {/* Modal Center Wrapper */}
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-md bg-[#130E24] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 md:p-8 pointer-events-auto relative text-left"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Edit Profile</h3>
                  <p className="text-xs text-white/40 mt-0.5">Customize your public identity</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-white/40 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label="Close edit profile"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-medium">
                    ⚠️ {errorMessage}
                  </div>
                )}

                {/* Avatar Display (Visual Only) */}
                <div className="relative w-20 h-20 rounded-full bg-omnave-primary/20 flex items-center justify-center mx-auto mb-6 border border-omnave-primary/50 text-2xl font-black text-purple-400 select-none">
                  {initial}
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-omnave-primary rounded-full border border-[#130E24] flex items-center justify-center shadow-lg text-white">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  </div>
                </div>

                {/* Display Name Field */}
                <div>
                  <label htmlFor="displayName" className="text-xs font-semibold text-white/50 tracking-wider mb-2 block uppercase">
                    Display Name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-omnave-primary/70 transition-all"
                  />
                </div>

                {/* Major/Tag Field */}
                <div>
                  <label htmlFor="major" className="text-xs font-semibold text-white/50 tracking-wider mb-2 block uppercase">
                    Field of Study / Role
                  </label>
                  <input
                    id="major"
                    type="text"
                    placeholder="e.g. Biology Student, Developer"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-omnave-primary/70 transition-all"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-6 border-t border-white/10 mt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-3 rounded-xl bg-omnave-primary text-white font-medium shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
