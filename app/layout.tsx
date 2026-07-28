import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-poppins",
});
import BottomNav from "@/components/BottomNav";
import TopRightActions from "@/components/TopRightActions";
import TabScrollRestorer from "@/components/TabScrollRestorer";
import { UserProvider } from "@/context/UserContext";
import { AssessmentProvider } from "@/context/AssessmentContext";
import { UploadProvider } from "@/context/UploadContext";
import OnboardingGuard from "@/components/OnboardingGuard";
import { PWAProvider } from "@/components/PWAProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

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

export const viewport = {
  themeColor: '#6949a8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: next-themes sets data-theme on <html> before
    // React hydrates, which would cause a mismatch. This tells React to accept
    // the DOM as-is for this element (per Next.js preventing-flash docs).
    <html lang="en" suppressHydrationWarning className={poppins.variable}>
      <body className={`${poppins.className} bg-omnave-canvas text-omnave-primary-text antialiased min-h-screen relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
        <ThemeProvider>
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
        </ThemeProvider>
      </body>
    </html>
  );
}