import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import TopRightActions from "@/components/TopRightActions";
import { UserProvider } from "@/context/UserContext";
import { AssessmentProvider } from "@/context/AssessmentContext";
import { UploadProvider } from "@/context/UploadContext";
import OnboardingGuard from "@/components/OnboardingGuard";
import { PWAProvider } from "@/components/PWAProvider";

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
      {/* Removed the destructive 'grayscale' class so your colors return! */}
      <body className="bg-omnave-canvas text-white antialiased min-h-screen relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        {/* Global Immersive Background Grid & Ambient Glows */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_20%,transparent_100%)]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] md:w-[1200px] h-[500px] md:h-[700px] bg-omnave-primary/15 blur-[120px] md:blur-[150px] rounded-full" />
        </div>

        <PWAProvider>
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
                </AssessmentProvider>
              </UploadProvider>
            </OnboardingGuard>
          </UserProvider>
        </PWAProvider>
      </body>
    </html>
  );
}