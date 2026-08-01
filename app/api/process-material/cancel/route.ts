import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { supabaseServer } from "@/utils/supabase/server-backend";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
 
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { materialId } = body;
 
    if (!materialId) {
      return NextResponse.json(
        { error: "Missing materialId" },
        { status: 400 }
      );
    }
 
    // Authenticate the user session
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore if cookie store is read-only
            }
          },
        },
      }
    );
 
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
 
    // 1. Fetch material to confirm ownership and current status
    const { data: material, error: fetchErr } = await supabaseServer
      .from("materials")
      .select("user_id, status")
      .eq("id", materialId)
      .single();
 
    if (fetchErr || !material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }
 
    if (material.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized: Owner mismatch" }, { status: 403 });
    }
 
    // If already completed, do not allow cancellation
    if (material.status === "COMPLETED") {
      return NextResponse.json({ error: "Cannot cancel a completed job" }, { status: 400 });
    }
 
    // 2. Dispatch cancellation event to Inngest client
    await inngest.send({
      name: "ai/process.cancel",
      data: { materialId }
    });
 
    // 3. Update material status to failed (zombie cleanup)
    await supabaseServer
      .from("materials")
      .update({ status: "failed" })
      .eq("id", materialId);
 
    // 4. Refund / decrement monthly upload quota (generation_count)
    const { data: profile } = await supabaseServer
      .from("profiles")
      .select("generation_count")
      .eq("id", user.id)
      .single();
 
    if (profile) {
      const currentCount = profile.generation_count || 0;
      const newCount = Math.max(0, currentCount - 1);
      await supabaseServer
        .from("profiles")
        .update({ generation_count: newCount })
        .eq("id", user.id);
    }
 
    return NextResponse.json({ success: true, message: "Job cancelled and quota refunded successfully" });
  } catch (error: any) {
    console.error("Cancellation API failure:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
