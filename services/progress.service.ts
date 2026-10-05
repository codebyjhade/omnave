'use client';

import { createClient } from '@/lib/supabase/client';
import { replayQuizProgressQueue, submitQuizProgress } from '@/lib/offline-progress';

// ─── Public interfaces (same shape as before — UserContext needs zero changes) ──

export interface QuizScore {
  id?: string;
  lesson_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  created_at?: string;
}

export interface UserStats {
  id?: string;
  user_id: string;
  xp: number;
  current_streak: number;
  highest_streak?: number;
  last_study_date?: string;
  plan_type?: 'free' | 'pro' | string;
  generation_count?: number;
  agent_message_count?: number;
  last_message_date?: string | null;
}

// ─── DB row shapes ────────────────────────────────────────────────────────────

interface ProfileRow {
  id: string;
  total_xp: number;
  current_streak: number;
  highest_streak: number;
  last_active_date: string | null;
  plan_type: string;
  generation_count: number;
  agent_message_count: number;
  last_message_date: string | null;
}

interface QuizScoreRow {
  id: string;
  user_id: string;
  lesson_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  created_at: string;
}

/**
 * ProgressService — all reads/writes go to Supabase.
 * Maps the public.profiles and public.quiz_scores tables to the existing
 * UserStats / QuizScore interfaces so UserContext needs zero changes.
 */
export class ProgressService {
  // ── Profiles / Stats ────────────────────────────────────────────────────────

  static async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        return {
          user_id: userId,
          xp: 0,
          current_streak: 0,
          highest_streak: 0,
          plan_type: 'free',
          generation_count: 0,
          agent_message_count: 0,
          last_message_date: null,
        };
      }

      const supabase = createClient();

      const { data, error } = await supabase
        .from('profiles')
        .select('id, total_xp, current_streak, highest_streak, last_active_date, plan_type, generation_count, agent_message_count, last_message_date')
        .eq('id', userId)
        .maybeSingle<ProfileRow>();

      if (error) {
        console.error('[ProgressService] getUserStats error:', error.message);
        return null;
      }

      if (!data) {
        console.warn('[ProgressService] No profile found for user. Creating default profile...');
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{ 
            id: userId, 
            total_xp: 0, 
            current_streak: 0,
            plan_type: 'free',
            generation_count: 0,
            agent_message_count: 0,
            last_message_date: null
          }])
          .select()
          .single();

        if (insertError) {
          console.error('[ProgressService] Failed to create missing profile:', insertError.message);
          return null;
        }

        return {
          user_id: newProfile.id,
          xp: newProfile.total_xp,
          current_streak: newProfile.current_streak,
          highest_streak: newProfile.highest_streak ?? newProfile.current_streak,
          last_study_date: newProfile.last_active_date ?? undefined,
          plan_type: newProfile.plan_type ?? 'free',
          generation_count: newProfile.generation_count ?? 0,
          agent_message_count: newProfile.agent_message_count ?? 0,
          last_message_date: newProfile.last_message_date,
        };
      }

      return {
        user_id: data.id,
        xp: data.total_xp,
        current_streak: data.current_streak,
        highest_streak: data.highest_streak,
        last_study_date: data.last_active_date ?? undefined,
        plan_type: data.plan_type,
        generation_count: data.generation_count,
        agent_message_count: data.agent_message_count,
        last_message_date: data.last_message_date,
      };
    } catch (err) {
      console.error('[ProgressService] getUserStats offline/catch error:', err);
      return null;
    }
  }

  // ── Quiz Scores ─────────────────────────────────────────────────────────────

  static async getQuizScores(userId: string): Promise<QuizScore[]> {
    try {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        return [];
      }

      await replayQuizProgressQueue();

      const supabase = createClient();
      const { data, error } = await supabase
        .from('quiz_scores')
        .select('id, lesson_id, score, total_questions, percentage, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .returns<QuizScoreRow[]>();

      if (error) {
        console.error('[ProgressService] getQuizScores error:', error.message);
        return [];
      }

      return (data ?? []).map((row) => ({
        id: row.id,
        lesson_id: row.lesson_id,
        score: row.score,
        total_questions: row.total_questions,
        percentage: row.percentage,
        created_at: row.created_at,
      }));
    } catch (err) {
      console.error('[ProgressService] getQuizScores offline/catch error:', err);
      return [];
    }
  }

  static async recordQuizProgress(score: QuizScore, xpAwarded: number, mutationId = crypto.randomUUID()) {
    return submitQuizProgress({
      mutationId,
      lessonId: score.lesson_id,
      score: score.score,
      totalQuestions: score.total_questions,
      xpAwarded,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      createdAt: new Date().toISOString(),
    });
  }
}
