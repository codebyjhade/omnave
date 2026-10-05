import { NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabase/server-backend";
import { AuthenticationError, requireAuthenticatedUser } from "@/utils/supabase/server";
import { apiError } from "@/lib/api-response";

export async function GET(_req: Request, context: RouteContext<"/api/process-material/[id]">) {
  try {
    const { id } = await context.params;
    const { user } = await requireAuthenticatedUser();

    const { data: material, error: materialError } = await supabaseServer
      .from("materials")
      .select("id, title, status, is_processed, page_count, failure_code, failure_message, updated_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (materialError || !material) return apiError(404, "MATERIAL_NOT_FOUND", "Material not found");

    const { data: attempt, error: attemptError } = await supabaseServer
      .from("processing_attempts")
      .select("id, status, attempt_number, retryable, heartbeat_at, started_at, finished_at, failure_code, failure_message")
      .eq("material_id", id)
      .eq("user_id", user.id)
      .order("attempt_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (attemptError) return apiError(500, "JOB_STATUS_FAILED", "Unable to load job status");

    return NextResponse.json({ material, attempt });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError) return apiError(401, "UNAUTHENTICATED", error.message);
    console.error("Job status API failure:", error);
    return apiError(500, "JOB_STATUS_FAILED", "Unable to load job status");
  }
}
