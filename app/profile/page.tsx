"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useUserContext } from "@/context/UserContext";
import { ProfileMenuSheet } from "@/components/profile/ProfileMenuSheet";
import { 
  Bell, 
  User, 
  Mail, 
  Lock, 
  ChevronRight,
  FileText,
  Zap,
  Calendar,
  ShieldCheck,
  Moon,
  BellRing,
  Globe,
  GitBranch,
  LogOut
} from "lucide-react";

export default function ProfilePage() {
  const {
    user,
    bestScore,
    loading: isAuthLoading,
    gamificationStats,
    quizScores,
    lessons: notes,
  } = useUserContext();

  const [mounted, setMounted] = useState(false);
  const [profileName, setProfileName] = useState("Bryan");
  const [email, setEmail] = useState("");
  const [initial, setInitial] = useState("B");
  const [userTags, setUserTags] = useState<string[]>([]);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Modal / bottom sheet triggers
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Listen for trigger dispatched by external navigations
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
        "Bryan";
      setProfileName(name.charAt(0).toUpperCase() + name.slice(1));
      setEmail(user.email || "");
      setInitial(name.charAt(0).toUpperCase() || "B");

      let tags: string[] = [];
      if (user.user_metadata?.tags) {
        tags = Array.isArray(user.user_metadata.tags)
          ? user.user_metadata.tags
          : [user.user_metadata.tags];
      } else if (user.user_metadata?.major) {
        tags = [user.user_metadata.major];
      }
      if (tags.length === 0) tags = ["BS Computer Science"];
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

  // Calculate dynamic stats or fallbacks
  const pdfsCount = useMemo(() => {
    if (gamificationStats?.documentsUploaded !== undefined && gamificationStats.documentsUploaded > 0) {
      return gamificationStats.documentsUploaded;
    }
    return notes?.length || 14;
  }, [gamificationStats, notes]);

  const flashcardsCount = useMemo(() => {
    if (!notes || notes.length === 0) return 850;
    const count = notes.reduce(
      (acc, l) => acc + (Array.isArray(l.flashcards) ? l.flashcards.length : 0),
      0
    );
    return count > 0 ? count : 850;
  }, [notes]);

  const joinedDateString = useMemo(() => {
    if (user?.created_at) {
      try {
        const date = new Date(user.created_at);
        const formatter = new Intl.DateTimeFormat("en-US", {
          month: "long",
          year: "numeric",
        });
        return `Member since ${formatter.format(date)}`;
      } catch {
        return "Member since July 2026";
      }
    }
    return "Member since July 2026";
  }, [user]);

  const dynamicMb = useMemo(() => {
    const count = notes?.length || 0;
    const computed = Math.min(95, Math.max(15, count * 1.5));
    return parseFloat(computed.toFixed(1));
  }, [notes]);

  const handleRowClick = (label: string) => {
    setIsMenuOpen(true);
  };

  if (!mounted || isAuthLoading) {
    return (
      <main className="min-h-[100dvh] bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#6949a8] border-t-transparent rounded-full" />
      </main>
    );
  }

  // Helper row component for settings items inside card
  const SettingsRow = ({ 
    icon: Icon, 
    label, 
    onClick 
  }: { 
    icon: any; 
    label: string; 
    onClick: () => void;
  }) => (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between py-4 px-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors duration-150 text-left outline-none cursor-pointer rounded-xl"
    >
      <div className="flex items-center">
        <div className="bg-purple-50 text-[#6949a8] p-2.5 rounded-xl mr-4 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-semibold text-gray-700 font-poppins">{label}</span>
      </div>
      <ChevronRight className="text-gray-300 w-4 h-4" />
    </button>
  );

  return (
    <main className="min-h-[100dvh] bg-white overflow-y-auto pb-[120px] px-[25px] pt-[calc(env(safe-area-inset-top)+30px)]">
      
      {/* Header Row */}
      <div className="flex items-center justify-between select-none max-w-md mx-auto mb-6">
        <h1 className="text-3xl font-bold text-gray-900 font-poppins">
          Profile
        </h1>
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="w-10 h-10 rounded-full border border-gray-100 bg-white flex items-center justify-center text-[#6949a8] hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
        >
          <Bell size={18} />
        </button>
      </div>

      <div className="w-full max-w-md mx-auto flex flex-col">
        
        {/* Hero Identity Card */}
        <div className="bg-white rounded-[24px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] p-6 border border-gray-50 flex items-center justify-between gap-4 mb-6 select-none text-left">
          
          {/* Left Group (Avatar + Fluid Text) */}
          <div className="flex items-start gap-4 flex-1">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full bg-[#6949a8] flex items-center justify-center text-white text-2xl font-bold font-poppins">
                B
              </div>
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            
            {/* Text Container */}
            <div className="flex flex-col mt-0.5">
              <h2 className="text-[22px] font-bold text-gray-900 leading-tight font-poppins">
                Bryan
              </h2>
              <p className="text-[14px] text-gray-500 font-medium leading-snug mt-0.5 font-poppins">
                Upcoming College Student
              </p>
              <div className="flex items-center gap-1.5 text-[12px] text-gray-400 font-medium mt-2 font-poppins">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>{joinedDateString}</span>
              </div>
            </div>
          </div>

        </div>

        {/* App Utility Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6 select-none">
          <div className="bg-white rounded-[24px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] p-5 border border-gray-50 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <FileText className="w-5 h-5 text-[#6949a8] mb-2" />
            <span className="text-3xl font-black text-[#6949a8] mb-1 font-poppins leading-none">
              {pdfsCount}
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-poppins">
              PDFs Uploaded
            </span>
          </div>

          <div className="bg-white rounded-[24px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] p-5 border border-gray-50 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <Zap className="w-5 h-5 text-[#6949a8] mb-2" />
            <span className="text-3xl font-black text-[#6949a8] mb-1 font-poppins leading-none">
              {flashcardsCount}
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-poppins">
              AI Flashcards
            </span>
          </div>
        </div>

        {/* Workspace Storage Indicator */}
        <div className="bg-white rounded-[24px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] p-5 border border-gray-50 mb-8 select-none text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-poppins">
              Workspace Storage
            </span>
            <span className="text-xs font-bold text-gray-700 font-poppins">
              {dynamicMb}MB / 100MB
            </span>
          </div>
          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mt-2">
            <div 
              className="bg-[#6949a8] h-full rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${dynamicMb}%` }}
            />
          </div>
        </div>

        {/* Section 1: Account Information */}
        <div className="text-left mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-2 px-1 font-poppins">
            Account Information
          </h2>
          <div className="bg-white rounded-[20px] shadow-[0px_6px_15px_rgba(0,0,0,0.04)] border border-gray-100 p-2">
            <SettingsRow icon={User} label="Edit Profile" onClick={() => handleRowClick("Edit Profile")} />
            <SettingsRow icon={Mail} label="Change Email" onClick={() => handleRowClick("Change Email")} />
          </div>
        </div>

        {/* Section 2: Security */}
        <div className="text-left mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-2 px-1 font-poppins">
            Security
          </h2>
          <div className="bg-white rounded-[20px] shadow-[0px_6px_15px_rgba(0,0,0,0.04)] border border-gray-100 p-2">
            <SettingsRow icon={Lock} label="Change Password" onClick={() => handleRowClick("Change Password")} />
            <SettingsRow icon={ShieldCheck} label="Two-Factor Authentication" onClick={() => handleRowClick("Two-Factor")} />
          </div>
        </div>

        {/* Section 3: Preferences */}
        <div className="text-left mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-2 px-1 font-poppins">
            Preferences
          </h2>
          <div className="bg-white rounded-[20px] shadow-[0px_6px_15px_rgba(0,0,0,0.04)] border border-gray-100 p-2">
            <SettingsRow icon={Moon} label="App Theme" onClick={() => handleRowClick("App Theme")} />
            <SettingsRow icon={BellRing} label="Notifications" onClick={() => handleRowClick("Notifications")} />
          </div>
        </div>

        {/* Section 4: Connected Services */}
        <div className="text-left mb-8">
          <h2 className="text-sm font-bold text-gray-900 mb-2 px-1 font-poppins">
            Connected Services
          </h2>
          <div className="bg-white rounded-[20px] shadow-[0px_6px_15px_rgba(0,0,0,0.04)] border border-gray-100 p-2">
            {/* Google Service Row */}
            <div className="w-full flex items-center justify-between py-4 px-2 border-b border-gray-50 last:border-0 select-none">
              <div className="flex items-center">
                <div className="bg-purple-50 text-[#6949a8] p-2.5 rounded-xl mr-4 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-gray-700 font-poppins">Google</span>
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md font-poppins">
                Connected
              </span>
            </div>

            {/* GitHub Service Row */}
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="w-full flex items-center justify-between py-4 px-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors duration-150 text-left outline-none cursor-pointer rounded-xl"
            >
              <div className="flex items-center">
                <div className="bg-purple-50 text-[#6949a8] p-2.5 rounded-xl mr-4 flex items-center justify-center">
                  <GitBranch className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-gray-700 font-poppins">GitHub</span>
              </div>
              <span className="text-xs font-bold text-[#6949a8] bg-purple-50 px-3 py-1 rounded-md font-poppins">
                Connect
              </span>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="text-left mb-8">
          <h2 className="text-sm font-bold text-red-500 mb-2 px-1 font-poppins">
            Danger Zone
          </h2>
          <div className="bg-white rounded-[20px] shadow-[0px_6px_15px_rgba(0,0,0,0.04)] border border-red-100 p-2">
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-between py-4 px-2 hover:bg-red-50/50 transition-colors duration-150 text-left outline-none cursor-pointer rounded-xl"
            >
              <div className="flex items-center">
                <div className="bg-red-50 text-red-500 p-2.5 rounded-xl mr-4 flex items-center justify-center">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-red-600 font-poppins">Logout</span>
              </div>
              <ChevronRight className="text-red-300 w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Settings Bottom Sheet — self-contained navigation stack */}
      <ProfileMenuSheet
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        quizScores={quizScores}
        lessons={notes}
        isSigningOut={isSigningOut}
        onSignOut={handleSignOut}
        plan="Free"
        appVersion="1.0.0"
      />
    </main>
  );
}
