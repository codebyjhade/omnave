'use client';

import { useEffect, useState, useTransition, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { GlassInput } from '@/components/ui/GlassInput';
import Image from 'next/image';
import { X, Eye, EyeOff } from 'lucide-react';
import { createBrowserClient } from "@supabase/ssr";
import { useToast } from '@/components/ToastProvider';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'signup';
}

type AuthStep = 'signup' | 'signin' | 'verify' | 'success';

// Helper to safely parse and format Supabase/gotrue auth errors
function getErrorMessage(err: any, fallback: string): string {
  if (!err) return fallback;

  // Extract message from potential sources
  let rawMessage: any = null;

  if (typeof err === 'string') {
    rawMessage = err;
  } else if (err && typeof err === 'object') {
    rawMessage = err.message || err.error_description || err.error || err.msg;
  }

  // If rawMessage is still not found, try to stringify the err if it's not a generic Error/object
  if (!rawMessage && err && typeof err === 'object') {
    try {
      const stringified = JSON.stringify(err);
      if (stringified && stringified !== '{}') {
        rawMessage = stringified;
      }
    } catch {
      // Ignore stringification errors
    }
  }

  if (!rawMessage) return fallback;

  // If the extracted message is an object
  if (typeof rawMessage === 'object') {
    try {
      const msg = rawMessage.message || rawMessage.msg || rawMessage.error || rawMessage.error_description;
      if (msg && typeof msg === 'string') return msg;
      
      const stringified = JSON.stringify(rawMessage);
      if (stringified && stringified !== '{}') return stringified;
    } catch {
      // Ignore
    }
    return fallback;
  }

  // If it's a string, it might be stringified JSON
  if (typeof rawMessage === 'string') {
    const trimmed = rawMessage.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          const msg = parsed.message || parsed.msg || parsed.error || parsed.error_description;
          if (msg && typeof msg === 'string') return msg;
          
          const stringified = JSON.stringify(parsed);
          if (stringified && stringified !== '{}') return stringified;
        }
      } catch {
        // Not valid JSON, treat as standard string
      }
    }
    
    if (trimmed === '{}' || trimmed === '[object Object]') {
      return fallback;
    }
    
    return rawMessage;
  }

  return fallback;
}

export default function AuthModal({ isOpen, onClose, initialView = 'login' }: AuthModalProps) {
  const [authStep, setAuthStep] = useState<AuthStep>(initialView === 'login' ? 'signin' : 'signup');
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Real-time password criteria
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasNumber && hasSpecial;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    setAuthStep(initialView === 'login' ? 'signin' : 'signup');
    setOtpToken('');
    setError(null);
    setShowPassword(false);
  }, [initialView, isOpen]);

  // Keyboard accessibility (Escape to close)
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (authStep !== 'success') {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose, authStep]);

  // Cooldown countdown for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-submit OTP when length reaches 8 digits
  useEffect(() => {
    if (authStep === 'verify' && otpToken.length === 8 && !isLoading) {
      handleAuthSubmit({ preventDefault: () => {} } as React.FormEvent);
    }
  }, [otpToken, authStep, isLoading]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newToken = otpToken.split('');
    newToken[index] = value.slice(-1); 
    const updatedToken = newToken.join('');
    setOtpToken(updatedToken);
    if (value && index < 7) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpToken[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8);
    if (pastedData) {
      setOtpToken(pastedData);
      const focusIndex = Math.min(pastedData.length, 7);
      otpRefs.current[focusIndex]?.focus();
    }
  };

  const handleAuthSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    if (authStep === 'signup') {
      if (!email || !password || !fullName) {
        setError('Please fill in all fields.');
        return;
      }
      if (!isPasswordValid) {
        setError('Please satisfy all password criteria.');
        return;
      }
      setIsLoading(true);
      try {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });

        if (authError) throw authError;

        setAuthStep('verify');
        toast('Verification email sent! Please check your inbox.', 'success');
      } catch (err: any) {
        console.error("Supabase SignUp Error:", err);
        
        // Sanitize empty object strings
        let exactMessage = err?.message || err?.error_description || '';
        if (exactMessage === '{}' || exactMessage === '[object Object]') {
          exactMessage = '';
        }
        
        const msgLower = exactMessage.toLowerCase();
        
        // Handle specific network/fetch failures
        if (err?.name === 'AuthRetryableFetchError' || msgLower.includes('fetch') || !exactMessage) {
          setError('Network error: Cannot connect to server. Please check your connection.');
        } else if (msgLower.includes('already registered') || msgLower.includes('already in use') || msgLower.includes('exists')) {
          setError('This email is already in use. Please Sign In instead.');
        } else if (msgLower.includes('rate limit')) {
          setError('Too many requests. Please wait a moment and try again.');
        } else {
          setError(exactMessage);
        }
      } finally {
        setIsLoading(false);
      }
    } else if (authStep === 'verify') {
      if (!otpToken || otpToken.length < 8) {
        setError('Please enter the 8-digit verification code.');
        return;
      }
      setIsLoading(true);
      try {
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token: otpToken,
          type: 'signup',
        });

        if (verifyError) throw verifyError;

        toast('Account verified successfully!', 'success');
        setAuthStep('success');

        const onboardingComplete = !!data.user?.user_metadata?.onboarding_complete;
        const targetUrl = onboardingComplete ? '/home' : '/welcome';

        setTimeout(() => {
          onClose();
          window.location.href = targetUrl;
        }, 1500);
      } catch (err: any) {
        console.error("Supabase Verify Error:", err);
        
        // Sanitize empty object strings
        let exactMessage = err?.message || err?.error_description || '';
        if (exactMessage === '{}' || exactMessage === '[object Object]') {
          exactMessage = '';
        }
        
        const msgLower = exactMessage.toLowerCase();

        if (err?.name === 'AuthRetryableFetchError' || err instanceof TypeError || msgLower.includes('fetch') || !exactMessage) {
          setError('Network error: Cannot connect to server. Please check your connection.');
        } else {
          setError(exactMessage);
        }
      } finally {
        setIsLoading(false);
      }
    } else if (authStep === 'signin') {
      if (!email || !password) {
        setError('Please enter your email and password.');
        return;
      }

      setIsLoading(true);
      try {
        const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (authError) throw authError;

        const onboardingComplete = !!user?.user_metadata?.onboarding_complete;

        if (onboardingComplete) {
          window.location.href = '/home';
        } else {
          window.location.href = '/welcome';
        }
      } catch (err: any) {
        console.error("Supabase SignIn Error:", err);
        
        // Sanitize empty object strings
        let exactMessage = err?.message || err?.error_description || '';
        if (exactMessage === '{}' || exactMessage === '[object Object]') {
          exactMessage = '';
        }
        
        const msgLower = exactMessage.toLowerCase();

        if (err?.name === 'AuthRetryableFetchError' || msgLower.includes('fetch') || !exactMessage) {
          setError('Network error: Cannot connect to server. Please check your connection.');
        } else if (msgLower.includes('invalid login credentials')) {
          setError('Incorrect email or password. Please try again.');
        } else {
          setError(exactMessage);
        }
        setIsLoading(false);
      }
    }
  };

  const handleResendCode = async () => {
    if (isResending || resendCooldown > 0) return;
    setIsResending(true);
    setError(null);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (resendError) throw resendError;

      toast('Verification code resent!', 'success');
      setResendCooldown(60);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to resend code. Please try again.'));
    } finally {
      setIsResending(false);
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
      setError(getErrorMessage(err, 'Google SSO authentication failed.'));
    }
  };

  if (!isOpen || !mounted) return null;

  // Submit button disabled states
  const isSubmitDisabled = isLoading || (
    authStep === 'signup' && (
      !isPasswordValid || !email || !fullName
    )
  ) || (
    authStep === 'verify' && otpToken.length < 8
  );

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 pointer-events-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        onClick={authStep === 'success' ? undefined : onClose}
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm cursor-pointer pointer-events-auto"
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
        className="relative z-10 w-full max-w-[560px] overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-2xl p-6 sm:p-8 pointer-events-auto"
      >
        <div className="absolute inset-0 pointer-events-none rounded-[28px]" />

        {authStep !== 'success' && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-gray-55 text-gray-400 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 transition-colors"
            aria-label="Close authentication dialog"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <AnimatePresence mode="wait">
          {authStep === 'success' ? (
            <motion.div
              key="success-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="flex flex-col items-center justify-center text-center py-10 px-4"
            >
              {/* Glowing success checkmark */}
              <div className="relative w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mb-6 select-none animate-bounce">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-green-500">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-2">
                Workspace created.
              </h2>
              <p className="text-sm text-gray-550 max-w-[340px] leading-relaxed">
                Your premium study environment is ready. Redirecting you now...
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
            >
              <div className="mb-6 flex flex-col items-center text-center">
                <Image alt="Omnave Logo" className="drop-shadow-2xl" height={48} src="/omnave.png" width={48} />
                <h2 id="auth-modal-title" className="mt-3 text-2xl font-extrabold tracking-tight text-gray-900">
                  {authStep === 'signin'
                    ? 'Welcome back.'
                    : authStep === 'verify'
                      ? 'Confirm email.'
                      : 'Create workspace.'}
                </h2>
                <p id="auth-modal-description" className="mt-2 text-sm text-gray-500 max-w-[420px]">
                  {authStep === 'signin'
                    ? 'Pick up your learning flow exactly where you left off.'
                    : authStep === 'verify'
                      ? `Enter the 8-digit verification code sent to ${email}.`
                      : 'Start a workspace that feels as premium as your study experience.'}
                </p>
              </div>

              <div className="mb-4 h-1 w-full rounded-full bg-[#6949a8]/20" />

              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
                {authStep === 'signup' || authStep === 'signin' ? (
                  <>
                    <AnimatePresence mode="popLayout">
                      {authStep === 'signup' && (
                        <motion.div
                          key="full-name"
                          initial={{ opacity: 0, height: 0, filter: 'blur(6px)' }}
                          animate={{ opacity: 1, height: 'auto', filter: 'blur(0px)' }}
                          exit={{ opacity: 0, height: 0, filter: 'blur(6px)' }}
                          transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                        >
                          <GlassInput
                            label="Full Name"
                            placeholder="Omnave"
                            type="text"
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <GlassInput
                      label="Email Address"
                      placeholder="omnave@example.com"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                    <GlassInput
                      label="Password"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      suffix={
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="text-gray-400 hover:text-gray-900 transition-colors focus:outline-none cursor-pointer flex items-center justify-center p-1"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />

                    {/* Password Real-time Checklist */}
                    <AnimatePresence mode="popLayout">
                      {authStep === 'signup' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, filter: 'blur(4px)' }}
                          animate={{ opacity: 1, height: 'auto', filter: 'blur(0px)' }}
                          exit={{ opacity: 0, height: 0, filter: 'blur(4px)' }}
                          transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-400 select-none pb-1">
                            <div className={`flex items-center gap-1 transition-colors duration-200 ${hasMinLength ? 'text-green-600 font-semibold' : ''}`}>
                              {hasMinLength ? (
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0"><path d="M2.5 6L4.5 8L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-200 shrink-0" />
                              )}
                              8+ characters
                            </div>
                            <div className={`flex items-center gap-1 transition-colors duration-200 ${hasNumber ? 'text-green-600 font-semibold' : ''}`}>
                              {hasNumber ? (
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0"><path d="M2.5 6L4.5 8L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-200 shrink-0" />
                              )}
                              1 number
                            </div>
                            <div className={`flex items-center gap-1 transition-colors duration-200 ${hasSpecial ? 'text-green-600 font-semibold' : ''}`}>
                              {hasSpecial ? (
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0"><path d="M2.5 6L4.5 8L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-200 shrink-0" />
                              )}
                              1 special char
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {typeof error === 'string' && error.length > 0 && (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-center text-xs font-medium text-red-600"
                      >
                        {error}
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitDisabled}
                      className="mt-1 w-full rounded-2xl bg-[#6949a8] hover:bg-[#5a3d94] py-4 font-semibold text-white shadow-md transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoading
                        ? 'Authenticating...'
                        : authStep === 'signin'
                          ? 'Sign In'
                          : 'Get Started'}
                    </button>

                    <div className="my-1 flex items-center gap-3">
                      <div className="h-px flex-1 bg-gray-200" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">Or</span>
                      <div className="h-px flex-1 bg-gray-200" />
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white py-3.5 font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Continue with Google
                    </button>

                    {authStep === 'signup' && (
                      <div className="mt-6 text-center text-sm text-gray-500">
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setAuthStep('signin');
                            setOtpToken('');
                            setError(null);
                          }}
                          className="text-[#6949a8] hover:text-[#5a3d94] transition-colors font-medium cursor-pointer"
                        >
                          Sign In
                        </button>
                      </div>
                    )}

                    {authStep === 'signin' && (
                      <div className="mt-6 text-center text-sm text-gray-500">
                        Don't have an account?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setAuthStep('signup');
                            setOtpToken('');
                            setError(null);
                          }}
                          className="text-[#6949a8] hover:text-[#5a3d94] transition-colors font-medium cursor-pointer"
                        >
                          Create workspace
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <motion.div
                      key="otp-token-container"
                      initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ type: 'spring', duration: 0.35 }}
                    >
                      <div className="flex flex-col items-center gap-3 w-full">
                        <label className="text-sm font-bold text-gray-700 self-start">Verification Code</label>
                        <div className="flex justify-between w-full gap-1.5 sm:gap-2">
                          {[...Array(8)].map((_, index) => (
                            <input
                              key={index}
                              ref={(el) => { otpRefs.current[index] = el; }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={otpToken[index] || ''}
                              onChange={(e) => handleOtpChange(index, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(index, e)}
                              onPaste={handleOtpPaste}
                              disabled={isLoading}
                              className="w-full aspect-[4/5] text-center text-lg sm:text-xl font-black text-[#6949a8] bg-white border border-gray-200 rounded-xl focus:border-[#6949a8] focus:ring-2 focus:ring-purple-100 shadow-sm transition-all outline-none disabled:opacity-50 disabled:bg-gray-50"
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>

                    {typeof error === 'string' && error.length > 0 && (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-center text-xs font-medium text-red-600"
                      >
                        {error}
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitDisabled}
                      className="mt-1 w-full rounded-2xl bg-[#6949a8] hover:bg-[#5a3d94] py-4 font-semibold text-white shadow-md transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoading ? 'Authenticating...' : 'Verify Account'}
                    </button>

                    {authStep === 'verify' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-xs mt-2 text-gray-500"
                      >
                        <button
                          type="button"
                          disabled={isResending || resendCooldown > 0}
                          onClick={handleResendCode}
                          className="font-bold text-[#6949a8] transition-colors hover:text-[#5a3d94] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Didn't receive code? Resend"}
                        </button>
                      </motion.div>
                    )}
                  </>
                )}
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
}