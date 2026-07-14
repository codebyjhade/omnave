import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAIProvider } from '@/services/ai';
import { AILogger } from '@/services/ai/logger';
import { handleAIError } from '@/services/ai/error';
import crypto from 'crypto';

export async function POST(req: Request) {
  const reqId = crypto.randomUUID();
  const startTime = performance.now();

  AILogger.log('API_CHAT', reqId, 'Incoming workspace chat request received');

  try {
    // 🔥 THE FIX: We are now extracting 'history' from the frontend payload!
    const { message, summary, history } = await req.json();

    if (!message || !summary) {
      return NextResponse.json(
        handleAIError(new Error('Missing message or content summary payload'), reqId, 'validation'), 
        { status: 400 }
      );
    }

    // 1. Auth Validation
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {}
        }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        handleAIError(new Error('Unauthorized chat access attempt'), reqId, 'auth'), 
        { status: 401 }
      );
    }

    // 2. Query the active AI service provider
    const provider = getAIProvider();
    
    // 🔥 THE FIX: We are now passing the 'history' down to the Gemini service!
    const reply = await provider.askQuestion({ message, summary, history }, reqId);

    const totalDuration = Math.round(performance.now() - startTime);
    AILogger.log('API_CHAT', reqId, 'Chat response generated successfully', { totalDurationMs: totalDuration });

    return NextResponse.json({ success: true, reply });

  } catch (error: any) {
    console.error("CRITICAL CHAT API ERROR:", error);
    
    // Determine the error stage
    let stage: 'auth' | 'validation' | 'supabase' | 'gemini' | 'internal' = 'internal';
    const msg = String(error?.message || '').toLowerCase();
    if (msg.includes('auth') || msg.includes('sign in')) {
      stage = 'auth';
    } else if (msg.includes('supabase') || msg.includes('database')) {
      stage = 'supabase';
    } else if (
      msg.includes('google') ||
      msg.includes('generative') ||
      msg.includes('gemini') ||
      msg.includes('model') ||
      msg.includes('api key') ||
      msg.includes('api_key')
    ) {
      stage = 'gemini';
    }

    return NextResponse.json(handleAIError(error, reqId, stage), { status: 500 });
  }
}