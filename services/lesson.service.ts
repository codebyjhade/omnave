'use client';

import { createClient } from '@/lib/supabase/client';
import { type Lesson } from '@/context/UserContext';

// ─── DB row shape ─────────────────────────────────────────────────────────────

interface MaterialRow {
  id: string;
  user_id: string;
  title: string;
  material_type: string;
  content_url: string | null;
  is_processed: boolean;
  summary?: string | null;
  flashcards: Array<{ front: string; back: string }> | null;
  quizzes: Array<{ question: string; options: string[]; correctAnswerIndex: number; explanation: string }> | null;
  created_at: string;
}

// Maps a public.materials row to the Lesson interface used throughout the app.
function toLesson(row: MaterialRow): Lesson {
  return {
    id: row.id,
    file_path: row.content_url ?? row.title,
    title: row.title,
    summary: row.summary ?? undefined,
    flashcards: row.flashcards ?? undefined,
    quizzes: row.quizzes ?? undefined,
    created_at: row.created_at,
    is_processed: row.is_processed,
  };
}

/**
 * LessonService — backed by the public.materials Supabase table.
 * All interfaces are preserved so UserContext and components need zero changes.
 */
export class LessonService {
  static async getLessons(userId: string): Promise<Lesson[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('materials')
      .select('id, user_id, title, material_type, content_url, is_processed, flashcards, quizzes, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .returns<MaterialRow[]>();

    if (error) {
      console.error('[LessonService] getLessons error:', error.message);
      return [];
    }

    return (data ?? []).map(toLesson);
  }

  static async addLesson(userId: string, lesson: Lesson): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('materials').insert({
      user_id: userId,
      title: lesson.title ?? lesson.file_path,
      material_type: lesson.file_path?.endsWith('.pdf') ? 'pdf' : 'text',
      content_url: lesson.file_path ?? null,
      is_processed: false,
    });

    if (error) {
      console.error('[LessonService] addLesson error:', error.message);
    }
  }

  static async deleteLesson(userId: string, lessonId: string): Promise<void> {
    const supabase = createClient();

    const { data: lessonRow, error: fetchError } = await supabase
      .from('materials')
      .select('content_url')
      .eq('id', lessonId)
      .eq('is_processed', true)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('[LessonService] deleteLesson fetch error:', fetchError.message);
      throw fetchError;
    }

    if (lessonRow?.content_url) {
      const { error: storageError } = await supabase.storage
        .from('study_materials')
        .remove([lessonRow.content_url]);

      if (storageError) {
        console.error('[LessonService] deleteLesson storage error:', storageError.message);
        throw storageError;
      }
    }

    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', lessonId)
      .eq('user_id', userId); // RLS double-check

    if (error) {
      console.error('[LessonService] deleteLesson error:', error.message);
      throw error;
    }
  }

  // Retained for callers that bulk-save lessons (e.g. import pipeline).
  // Performs an upsert so existing rows are updated, not duplicated.
  static async saveLessons(userId: string, lessons: Lesson[]): Promise<void> {
    const supabase = createClient();
    const rows = lessons.map((lesson) => ({
      id: lesson.id,
      user_id: userId,
      title: lesson.title ?? lesson.file_path,
      material_type: lesson.file_path?.endsWith('.pdf') ? 'pdf' : 'text',
      content_url: lesson.file_path ?? null,
      is_processed: false,
    }));

    const { error } = await supabase
      .from('materials')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('[LessonService] saveLessons error:', error.message);
    }
  }
}
