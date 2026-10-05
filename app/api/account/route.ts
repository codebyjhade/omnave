import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { correlationHeaders, getCorrelationId, recordOperationalEvent } from '@/lib/observability';
import { AuthenticationError, requireAuthenticatedUser } from '@/utils/supabase/server';
import { supabaseServer } from '@/utils/supabase/server-backend';

export async function DELETE(request: Request) {
  const requestId = getCorrelationId(request);
  const startedAt = performance.now();
  try {
    const { user } = await requireAuthenticatedUser();
    const { data: materials, error: materialError } = await supabaseServer
      .from('materials')
      .select('content_url')
      .eq('user_id', user.id);
    if (materialError) throw materialError;

    const paths = (materials ?? []).map((item) => item.content_url)
      .filter((path): path is string => typeof path === 'string')
      .filter((path) => path.startsWith(`${user.id}/`) && !path.includes('..'));
    for (let index = 0; index < paths.length; index += 100) {
      const { error } = await supabaseServer.storage.from('study_materials').remove(paths.slice(index, index + 100));
      if (error) throw new Error(`STORAGE_ACCOUNT_CLEANUP_FAILED:${error.message}`);
    }

    await recordOperationalEvent({
      correlationId: requestId, source: 'api', eventName: 'account.deletion',
      status: 'started', userId: user.id, metadata: { sourceFiles: paths.length },
    });
    const { error: deletionError } = await supabaseServer.auth.admin.deleteUser(user.id, false);
    if (deletionError) throw deletionError;

    await recordOperationalEvent({
      correlationId: requestId, source: 'api', eventName: 'account.deletion',
      status: 'succeeded', durationMs: Math.round(performance.now() - startedAt),
      metadata: { sourceFiles: paths.length },
    });
    return new NextResponse(null, { status: 204, headers: correlationHeaders(requestId) });
  } catch (error) {
    if (error instanceof AuthenticationError) return apiError(401, 'UNAUTHENTICATED', error.message, requestId);
    await recordOperationalEvent({
      correlationId: requestId, source: 'api', eventName: 'account.deletion',
      severity: 'error', status: 'failed', durationMs: Math.round(performance.now() - startedAt),
      errorCode: 'ACCOUNT_DELETION_FAILED',
    });
    return apiError(500, 'ACCOUNT_DELETION_FAILED', 'The account could not be deleted completely', requestId);
  }
}
