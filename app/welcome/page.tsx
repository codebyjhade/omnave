'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import { User } from "@supabase/supabase-js";
import Image from "next/image";
import { UploadCloud, Sparkles, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function WelcomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Form State
  const [studyFocus, setStudyFocus] = useState<string | null>(null);
  const [learningStyles, setLearningStyles] = useState<string[]>([]);
  const [goal, setGoal] = useState<string | null>(null);
  const [studyTime, setStudyTime] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          setUser(currentUser);
          const name = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || '';
          const firstName = name ? name.trim().split(/\s+/)[0] : '';
          setUserName(firstName);
        } else {
          router.replace('/');
        }
      } catch (err) {
        console.error("Error checking session:", err);
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);

  const toggleLearningStyle = (style: string) => {
    setLearningStyles(prev =>
      prev.includes(style)
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  const isStepValid = () => {
    if (step === 1) return studyFocus !== null && learningStyles.length > 0;
    if (step === 2) return goal !== null && studyTime !== null;
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          study_focus: studyFocus,
          learning_styles: learningStyles,
          goal: goal,
          study_time: studyTime,
          onboarding_complete: true,
        },
      });
      if (error) {
        console.error("Supabase update error:", error);
        alert(error.message || "An error occurred while saving your preferences.");
        setIsSubmitting(false);
      } else {
        setIsAnimating(true);
      }
    } catch (err) {
      console.error("Unexpected error updating user:", err);
      alert("A system error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#6949a8] border-t-transparent rounded-full" />
      </main>
    );
  }

  const studyFocusOptions = ["Computer Science", "IT", "Engineering", "Business", "Medicine", "Law", "Senior High", "Other"];
  const learningStyleOptions = ["Flashcards", "Practice quizzes", "AI Chat", "Summaries", "Mind Maps"];
  const goalOptions = ["Pass exams", "Improve grades", "Learn new skills", "Prepare for interviews", "Professional certification"];
  const studyTimeOptions = ["15 min", "30 min", "1 hour", "2+ hours"];

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans antialiased">
      <div className="absolute inset-0 bg-slate-50 -z-20" />
      <div
        className="absolute inset-0 -z-10 animate-pulse pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 50% 50%, rgba(105, 73, 168, 0.1) 0%, rgba(255, 255, 255, 0) 70%)",
          animationDuration: "6s",
        }}
      />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-200/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '10s' }} />

      <AnimatePresence mode="wait">
        {!isAnimating ? (
          <motion.div
            key="onboarding-form"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="bg-white/80 backdrop-blur-xl border border-gray-100/50 rounded-3xl shadow-2xl p-8 max-w-md w-full relative z-10 flex flex-col justify-between"
          >
            <div>
              {step > 0 && (
                <div className="flex justify-center gap-1.5 mb-6">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        step === s ? "w-6 bg-[#6949a8]" : "w-1.5 bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              )}

              {step === 0 && (
                <div className="text-center py-4">
                  <Image src="/icon.png" alt="Omnave Logo" width={64} height={64} className="mx-auto mb-6 drop-shadow-md" priority />
                  <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">
                    Welcome, {userName || 'Explorer'}.
                  </h1>
                  <p className="text-gray-500 text-[15px] leading-relaxed mb-8 max-w-sm mx-auto font-medium">
                    Your AI learning workspace for turning study materials into understanding.
                  </p>
                  <button onClick={() => setStep(1)} className="w-full bg-gradient-to-r from-[#6949a8] to-indigo-600 hover:from-[#5a3d94] hover:to-indigo-700 text-white py-4 rounded-full text-[16px] font-bold shadow-[0px_8px_16px_rgba(105,73,168,0.25)] transition-all">
                    Get Started
                  </button>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 tracking-tight mb-2">Personalize your experience</h2>
                  <p className="text-gray-500 text-sm font-medium mb-6">Help us customize the AI study aids for your specific focus area.</p>
                  <div className="space-y-5">
                    <div>
                      <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider block mb-2.5">What are you studying?</label>
                      <div className="flex flex-wrap gap-2">
                        {studyFocusOptions.map((option) => (
                          <button key={option} onClick={() => setStudyFocus(option)} className={`py-2 px-4 rounded-full text-xs font-semibold border transition-all ${studyFocus === option ? "bg-gradient-to-r from-[#6949a8] to-[#8a63d2] text-white border-transparent shadow-[0_4px_20px_rgba(105,73,168,0.4)]" : "bg-white text-gray-700 border-gray-200 hover:border-[#6949a8] hover:shadow-sm"}`}>
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider block mb-2.5">How do you like to learn?</label>
                      <div className="flex flex-wrap gap-2">
                        {learningStyleOptions.map((option) => (
                          <button key={option} onClick={() => toggleLearningStyle(option)} className={`py-2 px-4 rounded-full text-xs font-semibold border transition-all ${learningStyles.includes(option) ? "bg-gradient-to-r from-[#6949a8] to-[#8a63d2] text-white border-transparent shadow-[0_4px_20px_rgba(105,73,168,0.4)]" : "bg-white text-gray-700 border-gray-200 hover:border-[#6949a8] hover:shadow-sm"}`}>
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 tracking-tight mb-2">Define your learning goals</h2>
                  <p className="text-gray-500 text-sm font-medium mb-6">Set clear objectives to help the AI align with your pacing and goals.</p>
                  <div className="space-y-5">
                    <div>
                      <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider block mb-2.5">What's your primary goal?</label>
                      <div className="flex flex-wrap gap-2">
                        {goalOptions.map((option) => (
                          <button key={option} onClick={() => setGoal(option)} className={`py-2.5 px-4 rounded-full text-xs font-semibold border transition-all ${goal === option ? "bg-gradient-to-r from-[#6949a8] to-[#8a63d2] text-white border-transparent shadow-[0_4px_20px_rgba(105,73,168,0.4)]" : "bg-white text-gray-700 border-gray-200 hover:border-[#6949a8]"}`}>
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider block mb-2.5">Study time commitment per day</label>
                      <div className="flex flex-wrap gap-2">
                        {studyTimeOptions.map((option) => (
                          <button key={option} onClick={() => setStudyTime(option)} className={`py-2.5 px-5 rounded-full text-xs font-semibold border transition-all ${studyTime === option ? "bg-gradient-to-r from-[#6949a8] to-[#8a63d2] text-white border-transparent shadow-[0_4px_20px_rgba(105,73,168,0.4)]" : "bg-white text-gray-700 border-gray-200 hover:border-[#6949a8]"}`}>
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 tracking-tight text-center mb-1">How it works</h2>
                  <p className="text-gray-500 text-center text-sm font-medium mb-6">Master any subject in three simple steps.</p>
                  <div className="flex flex-col gap-4 my-6">
                    <div className="flex gap-4 p-4 rounded-2xl border border-gray-100 bg-slate-50/50">
                      <div className="p-3 bg-purple-100 rounded-xl text-[#6949a8] self-start shrink-0"><UploadCloud size={20} /></div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-[14px]">1. Upload Materials</h3>
                        <p className="text-gray-500 text-xs mt-1 leading-relaxed">Drop any PDF, document, slides, or paste references directly.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 rounded-2xl border border-gray-100 bg-slate-50/50">
                      <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600 self-start shrink-0"><Sparkles size={20} /></div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-[14px]">2. AI Generates</h3>
                        <p className="text-gray-500 text-xs mt-1 leading-relaxed">Omnave automatically compiles custom quizzes, flashcards, and notes.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 rounded-2xl border border-gray-100 bg-slate-50/50">
                      <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600 self-start shrink-0"><BookOpen size={20} /></div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-[14px]">3. Learn & Retain</h3>
                        <p className="text-gray-500 text-xs mt-1 leading-relaxed">Track your progress metrics and study dynamically over time.</p>
                      </div>
                    </div>
                  </div>
                  <motion.button whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }} disabled={isSubmitting} onClick={handleSubmit} className="w-full mt-2 py-4 rounded-full font-bold text-white text-[16px] bg-[#6949a8] hover:bg-[#5a3d94] shadow-[0px_8px_16px_rgba(105,73,168,0.25)] flex items-center justify-center gap-2 cursor-pointer">
                    {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Start Learning"}
                  </motion.button>
                </div>
              )}
            </div>

            {step > 0 && step < 3 && (
              <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-100/50">
                <button onClick={() => setStep(prev => prev - 1)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"><ChevronLeft size={16} /> Back</button>
                <button disabled={!isStepValid()} onClick={() => setStep(prev => prev + 1)} className={`flex items-center gap-1.5 px-6 py-2.5 rounded-full font-bold text-white text-sm transition-all cursor-pointer ${isStepValid() ? "bg-[#6949a8] hover:bg-[#5a3d94] shadow-md shadow-[#6949a8]/20" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>Next <ChevronRight size={16} /></button>
              </div>
            )}
            {step === 3 && (
              <div className="flex justify-start items-center mt-2 pt-4 border-t border-gray-100/50">
                <button disabled={isSubmitting} onClick={() => setStep(prev => prev - 1)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"><ChevronLeft size={16} /> Back</button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="handoff-animation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white select-none pointer-events-auto"
          >
            <div className="relative w-full max-w-lg px-6 flex flex-col items-center justify-center">
              <svg viewBox="0 0 450 120" className="w-full overflow-visible">
                <defs>
                  <linearGradient id="neon-purple" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8a63d2" />
                    <stop offset="50%" stopColor="#9d7fe0" />
                    <stop offset="100%" stopColor="#6949a8" />
                  </linearGradient>
                </defs>
                <motion.text
                  x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
                  className="text-6xl md:text-8xl tracking-tighter font-extrabold"
                  stroke="url(#neon-purple)"
                  strokeWidth="2.5"
                  fill="#6949a8"
                  strokeDasharray="1500"
                  initial={{ strokeDashoffset: 1500, fillOpacity: 0 }}
                  animate={{ strokeDashoffset: 0, fillOpacity: 1 }}
                  transition={{
                    strokeDashoffset: { duration: 5.0, ease: "linear" },
                    fillOpacity: { duration: 1.0, delay: 3.5, ease: "easeIn" }
                  }}
                  onAnimationComplete={() => {
                    setTimeout(() => {
                      window.location.href = '/home';
                    }, 2500);
                  }}
                  style={{ filter: "drop-shadow(0px 0px 18px rgba(105,73,168,0.9))" }}
                >
                  omnave
                </motion.text>
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}