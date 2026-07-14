export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col relative overflow-x-hidden w-full max-w-full">
      
      {/* Background - Standardized Hero Focus */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_35%,#000_20%,transparent_100%)]" />
        <div className="absolute top-[15%] md:top-[25%] left-1/2 -translate-x-1/2 w-[600px] md:w-[900px] h-[400px] md:h-[600px] bg-omnave-primary/20 blur-[120px] rounded-full" />
      </div>

      {/* Main Content */}
      <main className="w-full flex-1 relative z-10 pb-40 md:pb-16">
        {children}
      </main>

      {/* Bottom Gradient Fade Mask */}
      <div className="fixed bottom-0 left-0 right-0 h-[120px] bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none z-30" />
      
    </div>
  );
}