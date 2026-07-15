'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { GlassInput } from '@/components/ui/GlassInput';
import Image from 'next/image';
import { X } from 'lucide-react';
import { createBrowserClient } from "@supabase/ssr";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, initialView = 'login' }: AuthModalProps) {
  const [view, setView] = useState<'login' | 'signup'>(initialView);
  const [mounted, setMounted] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    setView(initialView);
    setError(null);
  }, [initialView, isOpen]);

  // Keyboard accessibility (Escape to close) - Scroll lock removed to allow background scrolling
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

 const handleAuthSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use createBrowserClient directly as we stabilized earlier
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      if (view === 'signup') {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });

        if (authError) throw authError;
        
        setView('login');
        setPassword('');
        setError('Account created! Please sign in to continue.');
        
        // Stop the loading spinner ONLY because they still need to click "Sign In"
        setIsLoading(false); 
        
      } else {
        const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        
        if (authError) throw authError;
        
        const onboardingComplete = !!user?.user_metadata?.onboarding_complete;
        
        // SUCCESS: Use a hard redirect to force the browser to send the new auth cookies to the Next.js server
        if (onboardingComplete) {
          window.location.href = '/home';
        } else {
          window.location.href = '/welcome';
        }
      }
    } catch (err: any) {
      // We only stop the loading spinner if something went wrong
      setError(err.message || 'Authentication failed. Please try again.');
      setIsLoading(false); 
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/home`,
        },
      });

      if (authError) throw authError;
    } catch (err: any) {
      setError(err.message || 'Google SSO authentication failed.');
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    // pointer-events-none allows the background scroll, overriding the portal blocking
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 pointer-events-none">
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        onClick={onClose}
        // pointer-events-auto placed here so clicks outside the modal still close it
        className="absolute inset-0 bg-omnave-canvas/80 backdrop-blur-[3px] cursor-pointer pointer-events-auto"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        aria-describedby="auth-modal-description"
        layout
        initial={{ opacity: 0, y: 20, scale: 0.98, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: 12, scale: 0.98, filter: 'blur(8px)' }}
        transition={{ type: 'spring', bounce: 0, duration: 0.45 }}
        // pointer-events-auto allows interacting with the form inside the card
        className="relative z-10 w-full max-w-[560px] overflow-hidden rounded-[28px] border border-white/10 bg-[#120F20]/96 shadow-[0_30px_80px_rgba(0,0,0,0.72),0_0_40px_rgba(127,34,254,0.12)] backdrop-blur-2xl p-6 sm:p-8 pointer-events-auto"
      >
        <div className="absolute inset-0 shadow-premium-inner pointer-events-none rounded-[28px]" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
          aria-label="Close authentication dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6 flex flex-col items-center text-center">
          <Image alt="Omnave Logo" className="drop-shadow-2xl" height={48} src="/omnave.png" width={48} />
          <h2 id="auth-modal-title" className="mt-3 text-2xl font-extrabold tracking-tight text-white">
            {view === 'login' ? 'Welcome back.' : 'Create workspace.'}
          </h2>
          <p id="auth-modal-description" className="mt-2 text-sm text-white/45 max-w-[420px]">
            {view === 'login' ? 'Pick up your learning flow exactly where you left off.' : 'Start a workspace that feels as premium as your study experience.'}
          </p>
        </div>

        <div className="mb-4 h-1 w-full rounded-full bg-progress-gradient/80" />

        <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {view === 'signup' && (
              <motion.div
                key="full-name"
                initial={{ opacity: 0, height: 0, filter: 'blur(6px)' }}
                animate={{ opacity: 1, height: 'auto', filter: 'blur(0px)' }}
                exit={{ opacity: 0, height: 0, filter: 'blur(6px)' }}
                transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              >
                <GlassInput
                  label="Full Name"
                  placeholder="Jane Doe"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <GlassInput
            label="Email Address"
            placeholder="jane@example.com"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <GlassInput
            label="Password"
            placeholder="••••••••"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {error && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-red-900/50 bg-red-950/40 px-3 py-2.5 text-center text-xs font-medium text-red-400"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-1 w-full rounded-2xl bg-button-gradient py-4 font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_20px_rgba(127,34,254,0.4)] transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Authenticating...' : view === 'login' ? 'Sign In' : 'Get Started'}
          </button>

          <div className="my-1 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/35">Or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] py-3.5 font-semibold text-white shadow-premium-glass transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <div className="mt-6 text-center text-xs text-white/40">
            <span>{view === 'login' ? "Don't have an account? " : 'Already have an account? '}</span>
            <button
              type="button"
              onClick={() => {
                setView((currentView) => (currentView === 'login' ? 'signup' : 'login'));
                setError(null);
              }}
              className="ml-1 font-bold text-omnave-primary transition-colors hover:text-omnave-primaryHover"
            >
              {view === 'login' ? 'Create workspace' : 'Sign In'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
}