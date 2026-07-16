import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAIProvider } from '@/services/ai';
import { handleAIError } from '@/services/ai/error';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  const reqId = crypto.randomUUID();
  
  // API Key load diagnostics logging
  const rawKey = process.env.GEMINI_API_KEY || "";
  const keyLength = rawKey.length;
  const maskedKey = keyLength > 10 
    ? `${rawKey.slice(0, 5)}...${rawKey.slice(-5)}`
    : "invalid-length";
  
  console.log(`[POST /api/process-material] Request received (ID: ${reqId})`);
  console.log(`[POST /api/process-material] GEMINI_API_KEY load check: exists=${!!rawKey}, len=${keyLength}, masked=${maskedKey}`);

  try {
    const body = await req.json();
    const { materialId, filePath } = body;

    if (!materialId || !filePath) {
      return NextResponse.json({ error: 'Missing materialId or filePath payload' }, { status: 400 });
    }

    // 1. Secure Auth Initialization
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
      return NextResponse.json({ error: 'Authentication failed. Please sign in.' }, { status: 401 });
    }

    // 2. Download PDF
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('study_materials')
      .download(filePath);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: `Storage download failed: ${downloadError?.message}` }, { status: 500 });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const base64Pdf = Buffer.from(arrayBuffer).toString('base64');

    // 3. Gemini AI Processing
    const provider = getAIProvider();
    const studyData = await provider.generateStudyKit({ pdfBase64: base64Pdf }, reqId);

    // 4. Single, Clean Database Update
    const { data: updateData, error: updateError } = await supabase
      .from('materials')
      .update({
        is_processed: true,
        title: studyData.ai_title || undefined,
        summary: studyData.summary,
        flashcards: studyData.flashcards,
        quizzes: studyData.quizzes
      })
      .eq('id', materialId)
      .eq('user_id', user.id)
      .select(); 

    if (updateError) {
      console.error("Database Update Error:", updateError);
      return NextResponse.json({ error: `Database update failed: ${updateError.message}` }, { status: 500 });
    }

    // 5. RLS Policy Safety Check
    if (!updateData || updateData.length === 0) {
      return NextResponse.json({ error: 'Supabase blocked the save. Please add the UPDATE policy to the public.materials table.' }, { status: 500 });
    }

    // 6. FORCE NEXT.JS TO CLEAR THE CACHE FOR THESE PAGES
    // This guarantees the Library and Home pages instantly update!
    revalidatePath('/library');
    revalidatePath('/home');

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("CRITICAL API ERROR:", error);
    
    // Determine the error stage
    let stage: 'auth' | 'validation' | 'supabase' | 'gemini' | 'internal' = 'internal';
    const msg = String(error?.message || '').toLowerCase();
    if (msg.includes('auth') || msg.includes('sign in')) {
      stage = 'auth';
    } else if (msg.includes('storage') || msg.includes('database') || msg.includes('supabase') || msg.includes('rls')) {
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