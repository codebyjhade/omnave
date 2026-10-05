import { NextResponse } from 'next/server';
import { AuthenticationError, requireAuthenticatedUser } from '@/utils/supabase/server';
import { supabaseServer } from '@/utils/supabase/server-backend';
import { correlationHeaders, getCorrelationId, recordOperationalEvent } from '@/lib/observability';

interface QuizMutationBody {
  mutationId?: string;
  lessonId?: string;
  score?: number;
  totalQuestions?: number;
  xpAwarded?: number;
  timezone?: string;
}

export async function POST(request: Request) {
  const requestId = getCorrelationId(request);
  try {
    const { user } = await requireAuthenticatedUser();
    const body = await request.json() as QuizMutationBody;
    if (!body.mutationId || !body.lessonId || typeof body.score !== 'number' || !Number.isInteger(body.score)
      || typeof body.totalQuestions !== 'number' || !Number.isInteger(body.totalQuestions)
      || typeof body.xpAwarded !== 'number' || !Number.isInteger(body.xpAwarded)) {
      return NextResponse.json({ error: 'Invalid quiz progress payload' }, { status: 400, headers: correlationHeaders(requestId) });
    }
    const { data, error } = await supabaseServer.rpc('record_quiz_progress', {
      p_user_id: user.id,
      p_mutation_key: body.mutationId,
      p_lesson_id: body.lessonId,
      p_score: body.score,
      p_total_questions: body.totalQuestions,
      p_xp_awarded: body.xpAwarded,
      p_timezone: body.timezone || 'UTC',
    });
    if (error) {
      const conflict = String(error.message).includes('PROGRESS_MUTATION_CONFLICT');
      await recordOperationalEvent({ correlationId: requestId, source: 'sync', eventName: 'quiz.progress', severity: conflict ? 'warning' : 'error', status: conflict ? 'conflict' : 'failed', userId: user.id, errorCode: conflict ? 'PROGRESS_MUTATION_CONFLICT' : 'PROGRESS_MUTATION_FAILED' });
      return NextResponse.json({ error: conflict ? 'This offline result conflicts with an already synced attempt.' : error.message }, { status: conflict ? 409 : 400, headers: correlationHeaders(requestId) });
    }
    const result = data as { idempotent?: boolean } | null;
    await recordOperationalEvent({ correlationId: requestId, source: 'sync', eventName: 'quiz.progress', status: 'succeeded', userId: user.id, metadata: { idempotent: Boolean(result?.idempotent) } });
    return NextResponse.json(data, { headers: correlationHeaders(requestId) });
  } catch (error) {
    const status = error instanceof AuthenticationError ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Authentication required' : 'Unable to record quiz progress' }, { status, headers: correlationHeaders(requestId) });
  }
}
