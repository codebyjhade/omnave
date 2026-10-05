import { NextResponse } from 'next/server';
import { getAIProvider } from '@/services/ai';
import { AILogger } from '@/services/ai/logger';
import { handleAIError } from '@/services/ai/error';
import { supabaseServer } from "@/utils/supabase/server-backend";
import crypto from 'crypto';
import { AuthenticationError, requireAuthenticatedUser } from '@/utils/supabase/server';
import { correlationHeaders, recordOperationalEvent } from '@/lib/observability';

export async function POST(req: Request) {
  const reqId = crypto.randomUUID();
  const startTime = performance.now();
  let reservedUserId: string | null = null;

  AILogger.log('API_CHAT', reqId, 'Incoming workspace chat request received');

  try {
    const { message, summary, history } = await req.json();

    if (!message || !summary) {
      return NextResponse.json(
        handleAIError(new Error('Missing message or content summary payload'), reqId, 'validation'), 
        { status: 400 }
      );
    }

    const { user } = await requireAuthenticatedUser();

    // Plan selection is server-owned; quota reservation is atomic in Postgres.
    const { data: profile, error: profileErr } = await supabaseServer
      .from('profiles')
      .select('plan_type')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile) {
      console.error('Failed to fetch user profile in chat API:', profileErr);
      return NextResponse.json(
        handleAIError(new Error('Unable to retrieve user subscription tier details.'), reqId, 'supabase'),
        { status: 500 }
      );
    }

    const planType = profile.plan_type || 'free';
    const { error: reserveError } = await supabaseServer.rpc('reserve_usage', {
      p_user_id: user.id,
      p_resource: 'chat_message',
      p_units: 1,
      p_mutation_key: reqId,
      p_metadata: { endpoint: '/api/chat' },
    });
    if (reserveError) {
      const limitReached = String(reserveError.message).includes('USAGE_LIMIT_EXCEEDED');
      await recordOperationalEvent({ correlationId: reqId, source: 'api', eventName: 'chat.request', severity: limitReached ? 'warning' : 'error', status: 'failed', userId: user.id, durationMs: Math.round(performance.now() - startTime), errorCode: limitReached ? 'CHAT_LIMIT_REACHED' : 'CHAT_RESERVATION_FAILED' });
      return NextResponse.json(
        { error: limitReached ? 'Daily AI message limit reached.' : 'Unable to reserve AI usage.' },
        { status: limitReached ? 429 : 500, headers: correlationHeaders(reqId) }
      );
    }
    reservedUserId = user.id;

    // 2. Query the active AI service provider
    const provider = getAIProvider();
    
    // Pass the 'history' down to the Gemini service
    const reply = await provider.askQuestion({
      message,
      summary,
      history,
      userId: user.id,
      planType: planType === "pro" ? "pro" : "free",
    }, reqId);

    const { error: settleError } = await supabaseServer.rpc('settle_usage', {
      p_user_id: user.id,
      p_resource: 'chat_message',
      p_mutation_key: reqId,
      p_state: 'CONSUMED',
    });
    if (settleError) throw settleError;
    reservedUserId = null;

    const totalDuration = Math.round(performance.now() - startTime);
    AILogger.log('API_CHAT', reqId, 'Chat response generated successfully', { totalDurationMs: totalDuration });
    await recordOperationalEvent({ correlationId: reqId, source: 'api', eventName: 'chat.request', status: 'succeeded', userId: user.id, durationMs: totalDuration, metadata: { plan: planType === 'pro' ? 'pro' : 'free' } });

    return NextResponse.json({ success: true, reply }, { headers: correlationHeaders(reqId) });

  } catch (error: unknown) {
    if (reservedUserId) {
      const { error: refundError } = await supabaseServer.rpc('settle_usage', {
        p_user_id: reservedUserId,
        p_resource: 'chat_message',
        p_mutation_key: reqId,
        p_state: 'REFUNDED',
      });
      if (refundError) console.error('Failed to refund chat reservation:', refundError);
    }
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        handleAIError(error, reqId, 'auth'),
        { status: 401, headers: correlationHeaders(reqId) },
      );
    }
    console.error("CRITICAL CHAT API ERROR:", error);
    
    // Determine the error stage
    let stage: 'auth' | 'validation' | 'supabase' | 'ai' | 'internal' = 'internal';
    const msg = String(error instanceof Error ? error.message : error).toLowerCase();
    if (msg.includes('auth') || msg.includes('sign in')) {
      stage = 'auth';
    } else if (msg.includes('supabase') || msg.includes('database')) {
      stage = 'supabase';
    } else if (
      msg.includes('google') ||
      msg.includes('generative') ||
      msg.includes('gemini') ||
      msg.includes('groq') ||
      msg.includes('openai') ||
      msg.includes('model') ||
      msg.includes('api key') ||
      msg.includes('api_key')
    ) {
      stage = 'ai';
    }

    const typedError = error instanceof Error ? error : new Error(String(error));
    await recordOperationalEvent({ correlationId: reqId, source: 'api', eventName: 'chat.request', severity: 'error', status: 'failed', durationMs: Math.round(performance.now() - startTime), errorCode: 'CHAT_REQUEST_FAILED' });
    return NextResponse.json(handleAIError(typedError, reqId, stage), { status: 500, headers: correlationHeaders(reqId) });
  }
}
