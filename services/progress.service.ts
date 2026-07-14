'use client';

import { createClient } from '@/lib/supabase/client';

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
}

// ─── DB row shapes ────────────────────────────────────────────────────────────

interface ProfileRow {
  id: string;
  total_xp: number;
  current_streak: number;
  last_active_date: string | null;
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
    const supabase = createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('id, total_xp, current_streak, last_active_date')
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
          current_streak: 0 
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
        highest_streak: newProfile.current_streak,
        last_study_date: newProfile.last_active_date ?? undefined,
      };
    }

    return {
      user_id: data.id,
      xp: data.total_xp,
      current_streak: data.current_streak,
      highest_streak: data.current_streak,
      last_study_date: data.last_active_date ?? undefined,
    };
  }

  /**
   * Increments the user's total_xp and updates last_active_date.
   * Also recalculates the streak: if last_active_date was yesterday,
   * increment streak; if it was today, leave it; otherwise reset to 1.
   */
  static async awardXP(userId: string, xpAmount: number): Promise<UserStats> {
    const supabase = createClient();

    // Fetch current state first
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('total_xp, current_streak, last_active_date')
      .eq('id', userId)
      .single<ProfileRow>();

    if (fetchError || !profile) {
      console.error('[ProgressService] awardXP fetch error:', fetchError?.message);
      return { user_id: userId, xp: xpAmount, current_streak: 1 };
    }

    const today = new Date().toISOString().split('T')[0];
    const lastActive = profile.last_active_date;

    let newStreak = profile.current_streak;
    if (lastActive === today) {
      // Already studied today — keep streak
    } else if (lastActive) {
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
      newStreak = lastActive === yesterday ? profile.current_streak + 1 : 1;
    } else {
      newStreak = 1;
    }

    const newXp = profile.total_xp + xpAmount;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        total_xp: newXp,
        current_streak: newStreak,
        last_active_date: today,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[ProgressService] awardXP update error:', updateError.message);
    }

    return {
      user_id: userId,
      xp: newXp,
      current_streak: newStreak,
      last_study_date: today,
    };
  }

  // ── Quiz Scores ─────────────────────────────────────────────────────────────

  static async getQuizScores(userId: string): Promise<QuizScore[]> {
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
  }

  static async insertQuizScore(userId: string, score: QuizScore): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('quiz_scores').insert({
      user_id: userId,
      lesson_id: score.lesson_id,
      score: score.score,
      total_questions: score.total_questions,
      percentage: score.percentage,
    });

    if (error) {
      console.error('[ProgressService] insertQuizScore error:', error.message);
    }
  }
}
