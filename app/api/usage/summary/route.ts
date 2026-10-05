import { NextResponse } from 'next/server';
import { AuthenticationError, requireAuthenticatedUser } from '@/utils/supabase/server';
import { supabaseServer } from '@/utils/supabase/server-backend';

export async function GET() {
  try {
    const { user } = await requireAuthenticatedUser();
    const { data, error } = await supabaseServer.rpc('get_usage_summary', {
      p_user_id: user.id,
    });
    if (error) throw error;
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status = error instanceof AuthenticationError ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Authentication required' : 'Unable to load usage' }, { status });
  }
}
