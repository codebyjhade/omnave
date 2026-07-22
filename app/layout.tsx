import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import TopRightActions from "@/components/TopRightActions";
import TabScrollRestorer from "@/components/TabScrollRestorer";
import { UserProvider } from "@/context/UserContext";
import { AssessmentProvider } from "@/context/AssessmentContext";
import { UploadProvider } from "@/context/UploadContext";
import OnboardingGuard from "@/components/OnboardingGuard";
import { PWAProvider } from "@/components/PWAProvider";
import { ToastProvider } from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "Omnave",
  description: "AI-Powered Study Platform",
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Omnave',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents mobile scaling
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-omnave-canvas text-white antialiased min-h-screen relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <PWAProvider>
          <ToastProvider>
            <UserProvider>
              <OnboardingGuard>
                <UploadProvider>
                  <AssessmentProvider>
                    {/* PAGE CONTENT */}
                    <div className="relative z-10 w-full min-h-screen flex flex-col">
                      <TopRightActions/>
                      <div className="flex-1 w-full">
                        {children}
                      </div>
                    </div>

                    {/* GLOBAL HUDS - Restored to fix the missing header */}
                    <BottomNav/>
                    <TabScrollRestorer />
                  </AssessmentProvider>
                </UploadProvider>
              </OnboardingGuard>
            </UserProvider>
          </ToastProvider>
        </PWAProvider>
      </body>
    </html>
  );
}