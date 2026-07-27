import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAIProvider } from '@/services/ai';
import { AILogger } from '@/services/ai/logger';
import { handleAIError } from '@/services/ai/error';
import { supabaseServer } from "@/utils/supabase/server-backend";
import crypto from 'crypto';

export async function POST(req: Request) {
  const reqId = crypto.randomUUID();
  const startTime = performance.now();

  AILogger.log('API_CHAT', reqId, 'Incoming workspace chat request received');

  try {
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

    // Fetch user profile to check daily message limits
    const { data: profile, error: profileErr } = await supabaseServer
      .from('profiles')
      .select('plan_type, agent_message_count, last_message_date')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile) {
      console.error('Failed to fetch user profile in chat API:', profileErr);
      return NextResponse.json(
        handleAIError(new Error('Unable to retrieve user subscription tier details.'), reqId, 'supabase'),
        { status: 500 }
      );
    }

    const planType = profile.plan_type || "free";
    const lastDateStr = profile.last_message_date;
    const now = new Date();
    
    const getUTCDateString = (d: Date) => d.toISOString().split('T')[0];
    const currentDateStr = getUTCDateString(now);

    let currentMessageCount = profile.agent_message_count || 0;
    const isNewDay = !lastDateStr || getUTCDateString(new Date(lastDateStr)) !== currentDateStr;

    if (isNewDay) {
      currentMessageCount = 0;
    }

    // Limit Check for Free plan
    if (planType === "free" && currentMessageCount >= 15) {
      if (isNewDay) {
        const { error: resetErr } = await supabaseServer
          .from('profiles')
          .update({
            agent_message_count: 0,
            last_message_date: now.toISOString()
          })
          .eq('id', user.id);
        if (resetErr) {
          console.error("Failed to reset agent message count for new day:", resetErr);
        }
      }
      return NextResponse.json(
        { error: "Daily AI message limit reached. Upgrade to Pro." },
        { status: 403 }
      );
    }

    // 2. Query the active AI service provider
    const provider = getAIProvider();
    
    // Pass the 'history' down to the Gemini service
    const reply = await provider.askQuestion({ message, summary, history }, reqId);

    // Success Path: Increment count and update last message date
    const nextMessageCount = isNewDay ? 1 : currentMessageCount + 1;
    const { error: updateErr } = await supabaseServer
      .from('profiles')
      .update({
        agent_message_count: nextMessageCount,
        last_message_date: now.toISOString()
      })
      .eq('id', user.id);

    if (updateErr) {
      console.error("Failed to update profile agent message count:", updateErr);
    }

    const totalDuration = Math.round(performance.now() - startTime);
    AILogger.log('API_CHAT', reqId, 'Chat response generated successfully', { totalDurationMs: totalDuration });

    return NextResponse.json({ success: true, reply });

  } catch (error: unknown) {
    console.error("CRITICAL CHAT API ERROR:", error);
    
    // Determine the error stage
    let stage: 'auth' | 'validation' | 'supabase' | 'gemini' | 'internal' = 'internal';
    const msg = String(error instanceof Error ? error.message : error).toLowerCase();
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

    const typedError = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json(handleAIError(typedError, reqId, stage), { status: 500 });
  }
}