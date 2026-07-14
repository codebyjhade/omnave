'use client';

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Returns a Supabase browser client that reads/writes auth cookies
 * automatically via @supabase/ssr. Safe to call multiple times per render —
 * each call creates a fresh client that shares the same underlying session.
 */
export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey);
