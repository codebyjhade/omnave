import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { apiError } from "@/lib/api-response";
import { parsePdfBuffer } from "@/services/document.service";
import { AuthenticationError, requireAuthenticatedUser } from "@/utils/supabase/server";
import { supabaseServer } from "@/utils/supabase/server-backend";

export async function POST(req: Request) {
  let attemptId: string | null = null;
  try {
    const body = (await req.json().catch(() => ({}))) as { materialId?: string; idempotencyKey?: string };
    if (!body.materialId || !body.idempotencyKey || body.idempotencyKey.length < 8) {
      return apiError(400, "INVALID_RETRY_REQUEST", "Material ID and retry key are required");
    }

    const { user } = await requireAuthenticatedUser();
    const { data: material, error: materialError } = await supabaseServer
      .from("materials")
      .select("id, content_url, page_count")
      .eq("id", body.materialId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (materialError || !material?.content_url) {
      return apiError(404, "RETRY_SOURCE_NOT_FOUND", "The original PDF is unavailable");
    }

    const { data: retryRows, error: retryError } = await supabaseServer.rpc("create_material_retry_attempt", {
      p_user_id: user.id,
      p_material_id: material.id,
      p_idempotency_key: body.idempotencyKey,
    });
    if (retryError || !retryRows?.[0]) return apiError(409, "MATERIAL_NOT_RETRYABLE", "This job cannot be retried");

    attemptId = retryRows[0].attempt_id;
    if (["QUEUED", "RUNNING", "COMPLETED"].includes(retryRows[0].attempt_status)) {
      return NextResponse.json({ success: true, materialId: material.id, attemptId, status: retryRows[0].attempt_status });
    }

    const { data: file, error: downloadError } = await supabaseServer.storage
      .from("study_materials")
      .download(material.content_url);
    if (downloadError || !file) {
      await supabaseServer.rpc("set_processing_attempt_state", {
        p_attempt_id: attemptId,
        p_status: "FAILED",
        p_failure_code: "RETRY_SOURCE_NOT_FOUND",
        p_failure_message: "The original PDF is unavailable",
        p_retryable: false,
      });
      return apiError(422, "RETRY_SOURCE_NOT_FOUND", "The original PDF is unavailable");
    }

    const parsed = await parsePdfBuffer(Buffer.from(await file.arrayBuffer()));
    const { data: queueRows, error: queueError } = await supabaseServer.rpc("reserve_and_queue_material", {
      p_user_id: user.id,
      p_attempt_id: attemptId,
      p_page_count: parsed.pages,
    });
    if (queueError || !queueRows?.[0]) {
      await supabaseServer.rpc("set_processing_attempt_state", {
        p_attempt_id: attemptId,
        p_status: "FAILED",
        p_failure_code: "RETRY_QUOTA_FAILED",
        p_failure_message: queueError?.message ?? "Usage could not be reserved for this retry",
        p_retryable: true,
      });
      return apiError(403, "RETRY_QUOTA_FAILED", "Usage could not be reserved for this retry");
    }

    const event = await inngest.send({
      name: "ai/process.material",
      data: {
        materialId: material.id,
        attemptId,
        text: parsed.text,
        planType: queueRows[0].plan_type,
        pageCount: parsed.pages,
        userId: user.id,
      },
    });

    await supabaseServer
      .from("processing_attempts")
      .update({ event_id: event.ids[0] ?? null, heartbeat_at: new Date().toISOString() })
      .eq("id", attemptId);

    return NextResponse.json({ success: true, materialId: material.id, attemptId, status: "QUEUED" });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError) return apiError(401, "UNAUTHENTICATED", error.message);
    console.error("Retry API failure:", error);
    if (attemptId) {
      await supabaseServer.rpc("set_processing_attempt_state", {
        p_attempt_id: attemptId,
        p_status: "FAILED",
        p_failure_code: "RETRY_START_FAILED",
        p_failure_message: error instanceof Error ? error.message : "Retry could not start",
        p_retryable: true,
      });
    }
    return apiError(500, "RETRY_START_FAILED", "Unable to retry this job");
  }
}
