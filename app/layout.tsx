import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-poppins",
});
import BottomNav from "@/components/BottomNav";
import TabScrollRestorer from "@/components/TabScrollRestorer";
import { UserProvider } from "@/context/UserContext";
import { AssessmentProvider } from "@/context/AssessmentContext";
import { UploadProvider } from "@/context/UploadContext";
import OnboardingGuard from "@/components/OnboardingGuard";
import { PWAProvider } from "@/components/PWAProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NavigationProvider } from "@/context/NavigationContext";
import WorkspaceShell from "@/components/layout/WorkspaceShell";
import SplashScreen from "@/components/SplashScreen";

export const metadata: Metadata = {
  title: "Omnave",
  description: "AI-Powered Study Platform",
  manifest: "/manifest.json",
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Omnave',
    startupImage: [
      {
        url: '/omnave.png',
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
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
    <html lang="en" suppressHydrationWarning className={`${poppins.variable} bg-white`}>
      <head>
        {/* Preload logo image on frame 0 to eliminate initial render delay */}
        <link rel="preload" href="/omnave.png" as="image" />
      </head>
      <body className={`${poppins.className} bg-white text-omnave-primary-text antialiased min-h-screen relative overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
        <SplashScreen />
        <ThemeProvider>
          <PWAProvider>
            <ToastProvider>
              <UserProvider>
                <OnboardingGuard>
                  <UploadProvider>
                    <AssessmentProvider>
                      <NavigationProvider>
                        <WorkspaceShell>
                          {children}
                        </WorkspaceShell>
                        <TabScrollRestorer />
                      </NavigationProvider>
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