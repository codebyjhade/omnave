"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useUserContext } from "@/context/UserContext";
import {
  ProfileHero,
  LearningOverview,
  BadgeShowcase,
  BadgeArchiveModal,
} from "@/components/profile";
import { ProfileMenuSheet } from "@/components/profile/ProfileMenuSheet";
import { ToastProvider } from "@/components/ToastProvider";

export default function ProfilePage() {
  const {
    user,
    bestScore,
    loading: isAuthLoading,
    gamificationStats,
    quizScores,
    lessons,
  } = useUserContext();

  const [mounted, setMounted] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [email, setEmail] = useState("");
  const [initial, setInitial] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [userTags, setUserTags] = useState<string[]>([]);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // The "Edit Profile" button on the ProfileHero still opens the external modal
  // for quick access without opening the full Settings sheet.
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);

  // Settings bottom sheet (hamburger ☰ in top-right)
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Listen for hamburger trigger dispatched by TopRightActions on /profile
  useEffect(() => {
    const handleOpen = () => setIsMenuOpen(true);
    window.addEventListener("open-settings-drawer", handleOpen);
    return () => window.removeEventListener("open-settings-drawer", handleOpen);
  }, []);

  useEffect(() => {
    setMounted(true);
    if (user) {
      const name =
        user.user_metadata?.nickname ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Learner";
      setProfileName(name);
      setEmail(user.email || "");
      setInitial(name.charAt(0).toUpperCase() || "L");

      if (user.created_at) {
        try {
          const formatter = new Intl.DateTimeFormat("en-US", {
            month: "short",
            year: "numeric",
          });
          setJoinDate(
            `JOINED ${formatter.format(new Date(user.created_at)).toUpperCase()}`
          );
        } catch {
          setJoinDate("JOINED RECENTLY");
        }
      } else {
        setJoinDate("JOINED RECENTLY");
      }

      let tags: string[] = [];
      if (user.user_metadata?.tags) {
        tags = Array.isArray(user.user_metadata.tags)
          ? user.user_metadata.tags
          : [user.user_metadata.tags];
      } else if (user.user_metadata?.major) {
        tags = [user.user_metadata.major];
      }
      if (tags.length === 0) tags = ["Learner"];
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
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
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
    <ToastProvider>
      <div className="relative min-h-screen">
        {/* Main scroll */}
        <main className="relative z-10 w-full max-w-[1200px] mx-auto pt-4 pb-40 md:pb-24 lg:px-10 xl:px-12 flex flex-col gap-8 md:gap-12">
          <header className="px-6 md:px-10 lg:px-0 text-left">
            <h2 className="text-[10px] font-extrabold tracking-[0.2em] text-neutral-500 uppercase mb-2">
              Account
            </h2>
            <h1 className="text-[clamp(1.75rem,6vw,2.5rem)] md:text-5xl font-black tracking-tighter text-white">
              Your Profile.
            </h1>
          </header>

          <div className="flex flex-col w-full space-y-8 pb-16 px-6 md:px-10 lg:px-0">
            {/* 1. Profile Hero */}
            <ProfileHero
              profileName={profileName}
              email={email}
              initial={initial}
              joinDate={joinDate}
              userTags={userTags}
              streak={gamificationStats.currentStreak}
              xp={gamificationStats.currentXp}
              onEditProfile={() => setIsEditModalOpen(true)}
            />

            {/* 2. Overview Stats */}
            <div>
              <h3 className="text-xs font-bold text-white/50 tracking-widest uppercase mb-4 mt-2">
                Overview
              </h3>
              <LearningOverview
                avgScore={gamificationStats.averageQuizScore}
                bestScore={bestScore}
                docCount={gamificationStats.documentsUploaded}
                quizzesCount={gamificationStats.quizAttempts}
                streak={gamificationStats.currentStreak}
                totalStudyHours={gamificationStats.studyMinutes / 60}
              />
            </div>

            {/* 3. Achievements */}
            <div>
              <h3 className="text-xs font-bold text-white/50 tracking-widest uppercase mb-4">
                Achievements
              </h3>
              <BadgeShowcase onViewAll={() => setShowBadgesModal(true)} />
            </div>
          </div>
        </main>

        {/* Badge Archive Modal (triggered by profile page's "View All" on badges) */}
        <BadgeArchiveModal
          isOpen={showBadgesModal}
          onClose={() => setShowBadgesModal(false)}
        />

        {/* Settings Bottom Sheet — self-contained navigation stack */}
        <ProfileMenuSheet
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          quizScores={quizScores}
          lessons={lessons}
          isSigningOut={isSigningOut}
          onSignOut={handleSignOut}
          plan="Free"
          appVersion="1.0.0"
        />
      </div>
    </ToastProvider>
  );
}
