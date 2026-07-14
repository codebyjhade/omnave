'use client';

import { createClient } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  created_at?: string;
}

/**
 * AuthService — thin wrapper around supabase.auth.
 * All session state is owned by Supabase; we no longer touch localStorage
 * or manual cookies for auth.
 */
export class AuthService {
  /**
   * Returns the currently authenticated user, or null if not signed in.
   * Reads from the in-memory session cache — no network call.
   */
  static async getCurrentUser(): Promise<UserProfile | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return {
      id: user.id,
      email: user.email ?? '',
      name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Learner',
      created_at: user.created_at,
    };
  }

  /**
   * Signs the current user out and invalidates the Supabase session cookie.
   */
  static async logout(): Promise<void> {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  /** Alias kept for compatibility with existing call sites. */
  static async signOut(): Promise<void> {
    return this.logout();
  }
}
