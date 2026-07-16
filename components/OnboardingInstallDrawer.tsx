"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ViewState = "main" | "ios" | "android" | "desktop";

export default function OnboardingInstallDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<ViewState>("main");

  const closeDrawer = () => {
    setIsOpen(false);
    setTimeout(() => setView("main"), 300); 
  };

  return (
    <>
      {/* Massive Onboarding Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-4 mt-8 bg-white text-black font-bold text-lg rounded-2xl hover:bg-gray-200 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Install App to Continue
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
              onClick={closeDrawer}
            />

            {/* Bottom Drawer */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A] border-t border-white/10 rounded-t-3xl p-6 transform-gpu"
            >
              <div className="w-full max-w-md mx-auto">
                {/* Drawer Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
                  <h2 className="text-xl font-bold text-white mt-4">
                    {view === "main" ? "Install Omnave" : "Installation Steps"}
                  </h2>
                  <button 
                    onClick={closeDrawer} 
                    className="mt-4 w-11 h-11 flex items-center justify-center bg-white/5 rounded-full text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-omnave-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#130E24]"
                    aria-label="Close installation helper"
                  >
                     ✕
                  </button>
                </div>

                {/* MAIN VIEW: Device Selection */}
                {view === "main" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                    <p className="text-white/60 text-sm mb-4">
                      Omnave is a Progressive Web App. For the best experience, add it directly to your device.
                    </p>
                    
                    <DeviceButton onClick={() => setView("ios")} subtitle="Using Safari browser" title="iPhone or iPad" />
                    <DeviceButton onClick={() => setView("android")} subtitle="Using Chrome browser" title="Android" />
                    <DeviceButton onClick={() => setView("desktop")} subtitle="Mac or Windows PC" title="Desktop" />
                  </div>
                )}

                {/* DETAIL VIEWS */}
                {view !== "main" && (
                  <div className="animate-in fade-in slide-in-from-right-4">
                    <button 
                      onClick={() => setView("main")}
                      className="text-sm text-blue-400 mb-6 flex items-center gap-1 hover:text-blue-300"
                    >
                      ← Back to choices
                    </button>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                      <h3 className="font-bold text-white mb-4 text-center">
                        {view === "ios" && "Install on iPhone/iPad"}
                        {view === "android" && "Install on Android"}
                        {view === "desktop" && "Install on Desktop"}
                      </h3>

                      <div className="space-y-6">
                        {/* Step 1 */}
                        <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold shrink-0">1</div>
                          <div>
                            <p className="font-medium text-white">
                              {view === "ios" && "Tap the Share button"}
                              {view === "android" && "Tap the Menu button"}
                              {view === "desktop" && "Look at the address bar"}
                            </p>
                            <p className="text-sm text-white/60 mt-1">
                              {view === "ios" && "Find the square icon with an arrow pointing up at the bottom of Safari."}
                              {view === "android" && "Find the three dots icon in the top right corner of Chrome."}
                              {view === "desktop" && "Find the install icon on the right side of the URL bar."}
                            </p>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold shrink-0">2</div>
                          <div>
                            <p className="font-medium text-white">
                              {view === "ios" && 'Select "Add to Home Screen"'}
                              {view === "android" && 'Select "Install App"'}
                              {view === "desktop" && "Click Install"}
                            </p>
                            <p className="text-sm text-white/60 mt-1">
                              {view === "ios" && "Scroll down the list of actions and tap it to install Omnave."}
                              {view === "android" && "Tap it and confirm to install Omnave to your home screen."}
                              {view === "desktop" && "Click it and confirm to install."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={closeDrawer}
                      className="w-full mt-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      I've installed it!
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function DeviceButton({ title, subtitle, onClick }: { title: string, subtitle: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-colors text-left"
    >
      <div>
        <p className="font-bold text-white">{title}</p>
        <p className="text-sm text-white/60">{subtitle}</p>
      </div>
      <span className="text-white/40">→</span>
    </button>
  );
}
