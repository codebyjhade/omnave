'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  X, 
  ChevronLeft, 
  Apple, 
  Smartphone, 
  Monitor, 
  Share, 
  PlusSquare, 
  Download 
} from 'lucide-react';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewState = 'selection' | 'ios' | 'android' | 'desktop';

export default function InstallGuideModal({ isOpen, onClose }: InstallGuideModalProps) {
  const [activeView, setActiveView] = useState<ViewState>('selection');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      setActiveView('selection');
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleBack = () => setActiveView('selection');

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer pointer-events-auto"
      />

      {/* Modal Dialog Card */}
      <motion.div
        role="dialog"
        aria-modal="true"
        layout
        initial={{ opacity: 0, y: 20, scale: 0.98, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: 12, scale: 0.98, filter: 'blur(8px)' }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className="relative z-10 w-full max-w-[480px] overflow-hidden rounded-[32px] border border-white/20 bg-white/95 backdrop-blur-2xl shadow-[0_24px_60px_-15px_rgba(105,73,168,0.2)] p-6 sm:p-7 pointer-events-auto font-sans text-gray-900"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 border border-gray-100 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <AnimatePresence mode="wait">
          {activeView === 'selection' ? (
            <motion.div
              key="selection"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col text-left"
            >
              <h2 className="text-xl font-black tracking-tight text-gray-900 mb-2 font-poppins mt-2">
                Install Omnave
              </h2>
              <p className="text-sm text-gray-550 font-medium mb-6 leading-relaxed">
                Omnave works best when installed as an app. Which device are you using right now?
              </p>

              <div className="flex flex-col gap-3">
                {/* iOS Option */}
                <button
                  onClick={() => setActiveView('ios')}
                  className="w-full bg-white border border-gray-100 hover:border-[#6949a8]/40 hover:bg-purple-50/50 hover:shadow-md transition-all duration-300 rounded-2xl p-4 flex items-center gap-4 cursor-pointer group text-left"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-[#6949a8] shrink-0 transition-colors group-hover:bg-[#6949a8] group-hover:text-white">
                    <Apple size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-[14px] font-poppins group-hover:text-[#6949a8] transition-colors">iPhone or iPad</h3>
                    <p className="text-xs text-gray-450 mt-0.5">Using Safari browser</p>
                  </div>
                </button>

                {/* Android Option */}
                <button
                  onClick={() => setActiveView('android')}
                  className="w-full bg-white border border-gray-100 hover:border-[#6949a8]/40 hover:bg-purple-50/50 hover:shadow-md transition-all duration-300 rounded-2xl p-4 flex items-center gap-4 cursor-pointer group text-left"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-[#6949a8] shrink-0 transition-colors group-hover:bg-[#6949a8] group-hover:text-white">
                    <Smartphone size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-[14px] font-poppins group-hover:text-[#6949a8] transition-colors">Android</h3>
                    <p className="text-xs text-gray-450 mt-0.5">Using Chrome browser</p>
                  </div>
                </button>

                {/* Desktop Option */}
                <button
                  onClick={() => setActiveView('desktop')}
                  className="w-full bg-white border border-gray-100 hover:border-[#6949a8]/40 hover:bg-purple-50/50 hover:shadow-md transition-all duration-300 rounded-2xl p-4 flex items-center gap-4 cursor-pointer group text-left"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-[#6949a8] shrink-0 transition-colors group-hover:bg-[#6949a8] group-hover:text-white">
                    <Monitor size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-[14px] font-poppins group-hover:text-[#6949a8] transition-colors">Desktop PC or Mac</h3>
                    <p className="text-xs text-gray-450 mt-0.5">Using Chrome or Edge</p>
                  </div>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={activeView}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col text-left"
            >
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#6949a8] hover:text-[#5a3d94] transition-colors mb-4 mt-2 cursor-pointer bg-transparent border-none p-0 outline-none font-poppins"
              >
                <ChevronLeft size={14} /> Back to choices
              </button>

              {activeView === 'ios' && (
                <>
                  <h2 className="text-xl font-black tracking-tight text-gray-900 mb-4 font-poppins">
                    Install on iOS
                  </h2>
                  <div className="flex flex-col gap-4 mb-6">
                    <div className="flex gap-3.5 items-start">
                      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6949a8] to-[#8a63d2] text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">1</span>
                      <p className="text-sm text-gray-600 leading-relaxed font-medium mt-0.5">
                        Open <span className="font-bold text-gray-900">Safari</span>. You must use Safari; Chrome or in-app social browsers cannot install PWAs on iOS.
                      </p>
                    </div>
                    <div className="flex gap-3.5 items-start">
                      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6949a8] to-[#8a63d2] text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">2</span>
                      <p className="text-sm text-gray-600 leading-relaxed font-medium flex flex-wrap items-center gap-1.5 mt-0.5">
                        Tap the <span className="font-bold text-gray-900">Share</span> button <span className="inline-flex p-1 bg-gray-50 rounded border border-gray-100"><Share size={14} className="text-gray-500" /></span> (located at the bottom or top of your screen).
                      </p>
                    </div>
                    <div className="flex gap-3.5 items-start">
                      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6949a8] to-[#8a63d2] text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">3</span>
                      <p className="text-sm text-gray-600 leading-relaxed font-medium flex flex-wrap items-center gap-1.5 mt-0.5">
                        Scroll down the menu list and tap <span className="font-bold text-gray-900">Add to Home Screen</span> <span className="inline-flex p-1 bg-gray-50 rounded border border-gray-100"><PlusSquare size={14} className="text-gray-500" /></span>.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {activeView === 'android' && (
                <>
                  <h2 className="text-xl font-black tracking-tight text-gray-900 mb-4 font-poppins">
                    Install on Android
                  </h2>
                  <div className="flex flex-col gap-4 mb-6">
                    <div className="flex gap-3.5 items-start">
                      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6949a8] to-[#8a63d2] text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">1</span>
                      <p className="text-sm text-gray-600 leading-relaxed font-medium mt-0.5">
                        Open <span className="font-bold text-gray-900">Google Chrome</span>.
                      </p>
                    </div>
                    <div className="flex gap-3.5 items-start">
                      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6949a8] to-[#8a63d2] text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">2</span>
                      <p className="text-sm text-gray-600 leading-relaxed font-medium mt-0.5">
                        Tap the menu icon (the <span className="font-bold text-gray-900">three dots</span> in the top-right corner).
                      </p>
                    </div>
                    <div className="flex gap-3.5 items-start">
                      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6949a8] to-[#8a63d2] text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">3</span>
                      <p className="text-sm text-gray-600 leading-relaxed font-medium flex flex-wrap items-center gap-1.5 mt-0.5">
                        Tap <span className="font-bold text-gray-900">Install app</span> or <span className="font-bold text-gray-900">Add to Home Screen</span> <span className="inline-flex p-1 bg-gray-50 rounded border border-gray-100"><Download size={14} className="text-gray-500" /></span>.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {activeView === 'desktop' && (
                <>
                  <h2 className="text-xl font-black tracking-tight text-gray-900 mb-4 font-poppins">
                    Install on Desktop
                  </h2>
                  <div className="flex flex-col gap-4 mb-6">
                    <div className="flex gap-3.5 items-start">
                      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6949a8] to-[#8a63d2] text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">1</span>
                      <p className="text-sm text-gray-600 leading-relaxed font-medium mt-0.5">
                        Open in <span className="font-bold text-gray-900">Chrome or Edge</span>.
                      </p>
                    </div>
                    <div className="flex gap-3.5 items-start">
                      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6949a8] to-[#8a63d2] text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">2</span>
                      <p className="text-sm text-gray-600 leading-relaxed font-medium mt-0.5">
                        Look at the <span className="font-bold text-gray-900">address bar</span> at the top of the browser.
                      </p>
                    </div>
                    <div className="flex gap-3.5 items-start">
                      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6949a8] to-[#8a63d2] text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">3</span>
                      <p className="text-sm text-gray-600 leading-relaxed font-medium flex flex-wrap items-center gap-1.5 mt-0.5">
                        Click the <span className="font-bold text-gray-900">Install icon</span> <span className="inline-flex p-1 bg-gray-50 rounded border border-gray-100"><Download size={14} className="text-gray-500" /></span> located on the far right side of the address bar.
                      </p>
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={onClose}
                className="w-full py-4 mt-6 rounded-full font-bold text-white text-[16px] bg-gradient-to-r from-[#6949a8] to-indigo-600 hover:from-[#5a3d94] hover:to-indigo-700 shadow-[0px_8px_16px_rgba(105,73,168,0.25)] active:scale-[0.98] transition-all cursor-pointer font-poppins border-none outline-none text-center"
              >
                Got it!
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
