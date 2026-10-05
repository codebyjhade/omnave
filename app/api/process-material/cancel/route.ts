import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { supabaseServer } from "@/utils/supabase/server-backend";
import { AuthenticationError, requireAuthenticatedUser } from "@/utils/supabase/server";
import { apiError } from "@/lib/api-response";

export async function POST(req: Request) {
  try {
    const { materialId } = (await req.json().catch(() => ({}))) as { materialId?: string };
    if (!materialId) return apiError(400, "MISSING_MATERIAL_ID", "Missing materialId");

    const { user } = await requireAuthenticatedUser();
    const { data: material, error: materialError } = await supabaseServer
      .from("materials")
      .select("user_id, status, content_url")
      .eq("id", materialId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (materialError || !material) return apiError(404, "MATERIAL_NOT_FOUND", "Material not found");
    if (material.status === "COMPLETED") {
      return apiError(409, "INVALID_MATERIAL_STATE", "A completed job cannot be cancelled");
    }

    const { data: attempt, error: attemptError } = await supabaseServer
      .from("processing_attempts")
      .select("id, status")
      .eq("material_id", materialId)
      .eq("user_id", user.id)
      .order("attempt_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (attemptError || !attempt) return apiError(404, "ATTEMPT_NOT_FOUND", "Processing attempt not found");
    if (["FAILED", "CANCELLED", "DEAD_LETTER"].includes(attempt.status)) {
      return NextResponse.json({ success: true, status: attempt.status, message: "Job is already inactive" });
    }

    await inngest.send({ name: "ai/process.cancel", data: { materialId, attemptId: attempt.id } });

    const { error: cancelError } = await supabaseServer.rpc("set_processing_attempt_state", {
      p_attempt_id: attempt.id,
      p_status: "CANCELLED",
      p_failure_code: "USER_CANCELLED",
      p_failure_message: "Processing was cancelled by the user",
      p_retryable: false,
    });

    if (cancelError) {
      console.error("Atomic cancellation failed:", cancelError);
      return apiError(500, "CANCELLATION_FAILED", "Unable to cancel processing");
    }

    if (material.content_url) {
      const { error: storageError } = await supabaseServer.storage
        .from("study_materials")
        .remove([material.content_url]);
      if (!storageError) {
        await supabaseServer.from("materials").update({ content_url: null }).eq("id", materialId);
      }
    }

    return NextResponse.json({ success: true, status: "CANCELLED", message: "Job cancelled and quota refunded" });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError) return apiError(401, "UNAUTHENTICATED", error.message);
    console.error("Cancellation API failure:", error);
    return apiError(500, "CANCELLATION_FAILED", "Unable to cancel processing");
  }
}
