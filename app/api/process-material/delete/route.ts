import { NextResponse } from "next/server";
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

    // 1. Fetch material to confirm ownership
    const { data: material, error: fetchErr } = await supabaseServer
      .from("materials")
      .select("user_id")
      .eq("id", materialId)
      .single();

    if (fetchErr || !material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    if (material.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized: Owner mismatch" }, { status: 403 });
    }

    // 2. Perform hard delete bypassing RLS
    const { error: deleteErr } = await supabaseServer
      .from("materials")
      .delete()
      .eq("id", materialId);

    if (deleteErr) {
      console.error("Failed to delete material:", deleteErr);
      return NextResponse.json({ error: "Failed to delete material" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Material deleted successfully" });
  } catch (error: any) {
    console.error("Delete API failure:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
