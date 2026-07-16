"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { LogOut } from "lucide-react";
import { useUserContext } from "@/context/UserContext";
import { ProfileHero, LearningOverview, BadgeShowcase, SubscriptionCard, BadgeArchiveModal } from "@/components/profile";

export default function ProfilePage() {
  const { user, bestScore, loading: isAuthLoading, gamificationStats } = useUserContext();

  const [mounted, setMounted] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [email, setEmail] = useState("");
  const [initial, setInitial] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [userTags, setUserTags] = useState<string[]>([]);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user) {
      const name = user.user_metadata?.full_name || user.user_metadata?.nickname || user.email?.split('@')[0] || "Learner";
      setProfileName(name);
      setEmail(user.email || "");
      setInitial(name.charAt(0).toUpperCase() || "L");

      if (user.created_at) {
        try {
          const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });
          const formattedDate = formatter.format(new Date(user.created_at)).toUpperCase();
          setJoinDate(`JOINED ${formattedDate}`);
        } catch (e) {
          setJoinDate("JOINED RECENTLY");
        }
      } else {
        setJoinDate("JOINED RECENTLY");
      }

      let tags: string[] = [];
      if (user.user_metadata?.tags) {
        if (Array.isArray(user.user_metadata.tags)) {
          tags = user.user_metadata.tags;
        } else if (typeof user.user_metadata.tags === 'string') {
          tags = [user.user_metadata.tags];
        }
      } else if (user.user_metadata?.major) {
        tags = [user.user_metadata.major];
      }
      if (tags.length === 0) {
        tags = ["Learner"];
      }
      setUserTags(tags);
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  };

  if (!mounted || isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-omnave-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
 
      {/* Main Container */}
      <main className="relative z-10 w-full max-w-[1200px] mx-auto pt-4 pb-40 md:pb-24 lg:px-10 xl:px-12 flex flex-col gap-8 md:gap-12">
        <header className="px-6 md:px-10 lg:px-0 text-left">
          <h2 className="text-[10px] font-extrabold tracking-[0.2em] text-neutral-500 uppercase mb-2">Account</h2>
          <h1 className="text-[clamp(1.75rem,6vw,2.5rem)] md:text-5xl font-black tracking-tighter text-white">Your Profile.</h1>
        </header>
 
        <div className="flex flex-col w-full animate-in fade-in duration-500 space-y-8 pb-16 px-6 md:px-10 lg:px-0">
          <ProfileHero 
            profileName={profileName} 
            email={email} 
            initial={initial} 
            joinDate={joinDate} 
            userTags={userTags} 
            streak={gamificationStats.currentStreak} 
            xp={gamificationStats.currentXp} 
          />
          <LearningOverview avgScore={gamificationStats.averageQuizScore} bestScore={bestScore} docCount={gamificationStats.documentsUploaded} quizzesCount={gamificationStats.quizAttempts} streak={gamificationStats.currentStreak} totalStudyHours={gamificationStats.studyMinutes / 60} />
          <BadgeShowcase onViewAll={() => setShowAllModal(true)} />
          <SubscriptionCard plan="free" />
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold tracking-wide">
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </span>
          </button>
        </div>
      </main>

      {/* UX/UI AUDIT RESOLUTION: ESCAPING STACKING CONTEXT */}
      <BadgeArchiveModal isOpen={showAllModal} onClose={() => setShowAllModal(false)} />
    </div>
  );
}
