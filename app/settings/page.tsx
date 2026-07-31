'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Search, 
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

export default function SettingsPage() {
  const router = useRouter();

  // Local state for toggle switches to make it feel responsive
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  return (
    <main className="min-h-screen bg-slate-50 text-gray-900 pb-[100px] font-sans antialiased">
      {/* Sticky Header */}
      <header className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer text-gray-600 hover:text-gray-900 focus:outline-none"
            aria-label="Go back"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-bold text-gray-900 font-poppins">Settings</h1>
        </div>
        <button 
          className="p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer text-gray-600 hover:text-gray-900 focus:outline-none"
          aria-label="Search settings"
        >
          <Search size={22} />
        </button>
      </header>

      {/* Main Container */}
      <div className="max-w-md mx-auto px-4">
        
        {/* PREFERENCES SECTION */}
        <h2 className="text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase font-poppins ml-2 mb-2 mt-6">
          Preferences
        </h2>
        <div className="bg-white rounded-[20px] shadow-[0px_4px_10px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden">
          {/* Language Row */}
          <div className="flex items-center justify-between p-4 bg-white border-b border-gray-50 last:border-none">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl bg-[#6949a8]/10 flex items-center justify-center shrink-0 mr-4">
                <Globe className="text-[#6949a8]" size={20} />
              </div>
              <span className="text-[14px] font-semibold text-gray-800 font-poppins">
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
              onClick={() => setDarkMode(!darkMode)}
              className={`w-12 h-7 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                darkMode ? "bg-[#6949a8]" : "bg-gray-200"
              }`}
              role="switch"
              aria-checked={darkMode}
              aria-label="Dark Mode Toggle"
            >
              <div
                className={`absolute top-[4px] left-[4px] w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  darkMode ? "translate-x-5" : "translate-x-0"
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
              onClick={() => setPushNotifications(!pushNotifications)}
              className={`w-12 h-7 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                pushNotifications ? "bg-[#6949a8]" : "bg-gray-200"
              }`}
              role="switch"
              aria-checked={pushNotifications}
              aria-label="Push Notifications Toggle"
            >
              <div
                className={`absolute top-[4px] left-[4px] w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  pushNotifications ? "translate-x-5" : "translate-x-0"
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
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`w-12 h-7 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                emailNotifications ? "bg-[#6949a8]" : "bg-gray-200"
              }`}
              role="switch"
              aria-checked={emailNotifications}
              aria-label="Email Notifications Toggle"
            >
              <div
                className={`absolute top-[4px] left-[4px] w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  emailNotifications ? "translate-x-5" : "translate-x-0"
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
          <div className="flex items-center justify-between p-4 bg-white border-b border-gray-50 last:border-none cursor-pointer hover:bg-gray-50/50 transition-colors group">
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
          <div className="flex items-center justify-between p-4 bg-white border-b border-gray-50 last:border-none cursor-pointer hover:bg-gray-50/50 transition-colors group">
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
          <div className="flex items-center justify-between p-4 bg-white border-b border-gray-50 last:border-none cursor-pointer hover:bg-gray-50/50 transition-colors group">
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
          <div className="flex items-center justify-between p-4 bg-white border-b border-gray-50 last:border-none cursor-pointer hover:bg-red-50/40 transition-colors group">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 mr-4">
                <LogOut className="text-red-500" size={20} />
              </div>
              <span className="text-[14px] font-semibold text-red-500 font-poppins group-hover:text-red-600 transition-colors">
                Logout / Delete Account
              </span>
            </div>
            <ChevronRight className="text-red-400" size={18} />
          </div>
        </div>

      </div>
    </main>
  );
}
