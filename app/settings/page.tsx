'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import { createBrowserClient } from '@supabase/ssr';
import { 
  ChevronRight, 
  Globe, 
  Moon, 
  Bell, 
  Mail, 
  Lock, 
  HelpCircle, 
  ShieldCheck, 
  LogOut 
} from 'lucide-react';

import { useUserContext } from '@/context/UserContext';
import { Skeleton } from '@/components/Skeleton';

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { loading } = useUserContext();

  // Local state for toggle switches to make it feel responsive
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (loading) {
    return (
      <div className="w-full flex-1 flex flex-col pt-2 max-w-md mx-auto px-4 text-gray-900" aria-hidden="true">
        {/* PREFERENCES SECTION SKELETON */}
        <Skeleton className="h-4 w-28 ml-2 mb-2 mt-6 rounded-md text-left" />
        <div className="bg-white rounded-[20px] shadow-[0px_4px_10px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white border-b border-gray-50 last:border-none h-[72px]">
              <div className="flex items-center">
                <Skeleton className="w-10 h-10 rounded-xl mr-4 shrink-0 animate-pulse" />
                <Skeleton className="h-4 w-24 rounded-md animate-pulse" />
              </div>
              <Skeleton className="w-20 h-5 rounded-full shrink-0" />
            </div>
          ))}
        </div>

        {/* NOTIFICATIONS SECTION SKELETON */}
        <Skeleton className="h-4 w-32 ml-2 mb-2 mt-6 rounded-md text-left" />
        <div className="bg-white rounded-[20px] shadow-[0px_4px_10px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white border-b border-gray-50 last:border-none h-[72px]">
              <div className="flex items-center">
                <Skeleton className="w-10 h-10 rounded-xl mr-4 shrink-0" />
                <Skeleton className="h-4 w-28 rounded-md" />
              </div>
              <Skeleton className="w-12 h-7 rounded-full shrink-0" />
            </div>
          ))}
        </div>

        {/* MORE SECTION SKELETON */}
        <Skeleton className="h-4 w-20 ml-2 mb-2 mt-6 rounded-md text-left" />
        <div className="bg-white rounded-[20px] shadow-[0px_4px_10px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white border-b border-gray-50 last:border-none h-[72px]">
              <div className="flex items-center">
                <Skeleton className="w-10 h-10 rounded-xl mr-4 shrink-0" />
                <Skeleton className="h-4 w-36 rounded-md" />
              </div>
              <Skeleton className="w-4 h-4 rounded-md shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    if (isSigningOut) return;
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

  return (
    <div className="w-full flex-1 flex flex-col pt-2 max-w-md mx-auto px-4 text-gray-900">
        
        {/* PREFERENCES SECTION */}
        <h2 className="text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase font-poppins ml-2 mb-2 mt-6">
          Preferences
        </h2>
        <div className="bg-white rounded-[20px] shadow-[0px_4px_10px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden">
          {/* Language Row */}
          <div 
            onClick={() => toast("This feature is coming soon!", "info")}
            className="flex items-center justify-between p-4 bg-white border-b border-gray-50 last:border-none cursor-pointer hover:bg-gray-50/50 transition-colors group"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl bg-[#6949a8]/10 flex items-center justify-center shrink-0 mr-4">
                <Globe className="text-[#6949a8]" size={20} />
              </div>
              <span className="text-[14px] font-semibold text-gray-800 font-poppins group-hover:text-[#6949a8] transition-colors">
                Language
              </span>
            </div>
            <div className="flex items-center cursor-pointer select-none">
              <span className="text-[13px] text-gray-500 font-medium mr-2">
                English (US)
              </span>
              <ChevronRight className="text-gray-400" size={18} />
            </div>
          </div>

          {/* Dark Mode Row */}
          <div className="flex items-center justify-between p-4 bg-white border-b border-gray-50 last:border-none">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl bg-[#6949a8]/10 flex items-center justify-center shrink-0 mr-4">
                <Moon className="text-[#6949a8]" size={20} />
              </div>
              <span className="text-[14px] font-semibold text-gray-800 font-poppins">
                Dark Mode
              </span>
            </div>
            <button
              onClick={() => {
                setIsDarkMode(!isDarkMode);
                toast("Dark mode is arriving in v2.0!", "info");
              }}
              className={`w-12 h-7 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                isDarkMode ? "bg-[#6949a8]" : "bg-gray-200"
              }`}
              role="switch"
              aria-checked={isDarkMode}
              aria-label="Dark Mode Toggle"
            >
              <div
                className={`absolute top-[4px] left-[4px] w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  isDarkMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* NOTIFICATIONS SECTION */}
        <h2 className="text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase font-poppins ml-2 mb-2 mt-6">
          Notifications
        </h2>
        <div className="bg-white rounded-[20px] shadow-[0px_4px_10px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden">
          {/* Push Notification Row */}
          <div className="flex items-center justify-between p-4 bg-white border-b border-gray-50 last:border-none">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl bg-[#6949a8]/10 flex items-center justify-center shrink-0 mr-4">
                <Bell className="text-[#6949a8]" size={20} />
              </div>
              <span className="text-[14px] font-semibold text-gray-800 font-poppins">
                Push Notification
              </span>
            </div>
            <button
              onClick={() => {
                setPushNotif(!pushNotif);
                toast("Notification preferences updated locally.", "success");
              }}
              className={`w-12 h-7 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                pushNotif ? "bg-[#6949a8]" : "bg-gray-200"
              }`}
              role="switch"
              aria-checked={pushNotif}
              aria-label="Push Notifications Toggle"
            >
              <div
                className={`absolute top-[4px] left-[4px] w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  pushNotif ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Email Notifications Row */}
          <div className="flex items-center justify-between p-4 bg-white border-b border-gray-50 last:border-none">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl bg-[#6949a8]/10 flex items-center justify-center shrink-0 mr-4">
                <Mail className="text-[#6949a8]" size={20} />
              </div>
              <span className="text-[14px] font-semibold text-gray-800 font-poppins">
                Email Notifications
              </span>
            </div>
            <button
              onClick={() => {
                setEmailNotif(!emailNotif);
                toast("Notification preferences updated locally.", "success");
              }}
              className={`w-12 h-7 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                emailNotif ? "bg-[#6949a8]" : "bg-gray-200"
              }`}
              role="switch"
              aria-checked={emailNotif}
              aria-label="Email Notifications Toggle"
            >
              <div
                className={`absolute top-[4px] left-[4px] w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  emailNotif ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* MORE SECTION */}
        <h2 className="text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase font-poppins ml-2 mb-2 mt-6">
          More
        </h2>
        <div className="bg-white rounded-[20px] shadow-[0px_4px_10px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden">
          {/* Privacy & Security Row */}
          <div 
            onClick={() => toast("This feature is coming soon!", "info")}
            className="flex items-center justify-between p-4 bg-white border-b border-gray-50 last:border-none cursor-pointer hover:bg-gray-50/50 transition-colors group"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl bg-[#6949a8]/10 flex items-center justify-center shrink-0 mr-4">
                <Lock className="text-[#6949a8]" size={20} />
              </div>
              <span className="text-[14px] font-semibold text-gray-800 font-poppins group-hover:text-[#6949a8] transition-colors">
                Privacy & Security
              </span>
            </div>
            <ChevronRight className="text-gray-400" size={18} />
          </div>

          {/* Help & Support Row */}
          <div 
            onClick={() => toast("This feature is coming soon!", "info")}
            className="flex items-center justify-between p-4 bg-white border-b border-gray-50 last:border-none cursor-pointer hover:bg-gray-50/50 transition-colors group"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl bg-[#6949a8]/10 flex items-center justify-center shrink-0 mr-4">
                <HelpCircle className="text-[#6949a8]" size={20} />
              </div>
              <span className="text-[14px] font-semibold text-gray-800 font-poppins group-hover:text-[#6949a8] transition-colors">
                Help & Support
              </span>
            </div>
            <ChevronRight className="text-gray-400" size={18} />
          </div>

          {/* Legal Row */}
          <div 
            onClick={() => toast("This feature is coming soon!", "info")}
            className="flex items-center justify-between p-4 bg-white border-b border-gray-50 last:border-none cursor-pointer hover:bg-gray-50/50 transition-colors group"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl bg-[#6949a8]/10 flex items-center justify-center shrink-0 mr-4">
                <ShieldCheck className="text-[#6949a8]" size={20} />
              </div>
              <span className="text-[14px] font-semibold text-gray-800 font-poppins group-hover:text-[#6949a8] transition-colors">
                Legal
              </span>
            </div>
            <ChevronRight className="text-gray-400" size={18} />
          </div>

          {/* Logout / Delete Account Row */}
          <button 
            disabled={isSigningOut}
            onClick={handleSignOut}
            className="w-full flex items-center justify-between p-4 bg-white border-b border-gray-50 last:border-none cursor-pointer hover:bg-red-50/40 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed border-none text-left"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 mr-4">
                <LogOut className="text-red-500" size={20} />
              </div>
              <span className="text-[14px] font-semibold text-red-500 font-poppins group-hover:text-red-600 transition-colors">
                {isSigningOut ? "Logging out..." : "Logout / Delete Account"}
              </span>
            </div>
            <ChevronRight className="text-red-400" size={18} />
          </button>
        </div>
    </div>
  );
}
