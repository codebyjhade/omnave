import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { supabaseServer } from "@/utils/supabase/server-backend";
import { parsePdfBuffer } from "@/services/document.service";
import { AuthenticationError, requireAuthenticatedUser } from "@/utils/supabase/server";
import { apiError } from "@/lib/api-response";
import { correlationHeaders, getCorrelationId, recordOperationalEvent } from '@/lib/observability';

type StartRequest = {
  idempotencyKey?: string;
  storagePath?: string;
  title?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
};

function databaseMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) return String(error.message);
  return "Unknown database error";
}

async function failAttempt(attemptId: string, code: string, message: string, retryable = false) {
  await supabaseServer.rpc("set_processing_attempt_state", {
    p_attempt_id: attemptId,
    p_status: "FAILED",
    p_failure_code: code,
    p_failure_message: message,
    p_retryable: retryable,
  });
}

export async function POST(req: Request) {
  let attemptId: string | null = null;
  let userId: string | undefined;
  let materialId: string | undefined;
  const requestId = getCorrelationId(req);
  const startedAt = performance.now();
  const fail = (status: number, code: string, message: string) => apiError(status, code, message, requestId);

  try {
    const body = (await req.json().catch(() => ({}))) as StartRequest;
    const idempotencyKey = body.idempotencyKey?.trim();
    const storagePath = body.storagePath?.trim();
    const title = body.title?.trim();
    const fileName = body.fileName?.trim();
    const fileSize = Number(body.fileSize);
    const mimeType = body.mimeType?.trim().toLowerCase();

    if (!idempotencyKey || idempotencyKey.length < 8) {
      return fail(400, "INVALID_IDEMPOTENCY_KEY", "A valid upload request key is required");
    }
    if (!storagePath || !title || !fileName || !Number.isSafeInteger(fileSize) || fileSize <= 0) {
      return fail(400, "INVALID_UPLOAD_METADATA", "Complete file metadata is required");
    }
    if (mimeType !== "application/pdf" || !fileName.toLowerCase().endsWith(".pdf")) {
      return fail(415, "UNSUPPORTED_FILE_TYPE", "Only PDF files are supported");
    }

    const { user } = await requireAuthenticatedUser();
    userId = user.id;
    if (!storagePath.startsWith(`${user.id}/`) || storagePath.includes("..")) {
      return fail(403, "INVALID_STORAGE_PATH", "The uploaded file does not belong to this user");
    }

    const { data: profile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("plan_type")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) return fail(500, "PROFILE_UNAVAILABLE", "Unable to load plan limits");
    const { data: usageSummaryData, error: entitlementError } = await supabaseServer
      .rpc('get_usage_summary', { p_user_id: user.id });
    const usageSummary = usageSummaryData as {
      maxFileBytes: number;
      maxPagesPerDocument: number;
      pages: { limit: number };
    } | null;
    if (entitlementError || !usageSummary) return fail(500, 'ENTITLEMENT_UNAVAILABLE', 'Unable to load plan limits');
    const maxBytes = Number(usageSummary.maxFileBytes);
    if (fileSize > maxBytes) {
      return fail(413, "FILE_SIZE_LIMIT", `Your plan allows files up to ${maxBytes / 1024 / 1024} MB`);
    }

    const { data: registrationRows, error: registrationError } = await supabaseServer.rpc(
      "register_material_attempt",
      {
        p_user_id: user.id,
        p_idempotency_key: idempotencyKey,
        p_title: title,
        p_storage_path: storagePath,
        p_file_name: fileName,
        p_file_size_bytes: fileSize,
        p_mime_type: mimeType,
      },
    );

    if (registrationError || !registrationRows?.[0]) {
      console.error("Material registration failed:", registrationError);
      return fail(500, "REGISTRATION_FAILED", "Unable to register this upload");
    }

    const registration = registrationRows[0];
    attemptId = registration.attempt_id;
    materialId = registration.material_id;
    await recordOperationalEvent({ correlationId: requestId, source: 'api', eventName: 'material.ingestion', status: 'started', userId, materialId, attemptId, metadata: { plan: profile.plan_type === 'pro' ? 'pro' : 'free', fileSize } });

    if (["QUEUED", "RUNNING", "COMPLETED"].includes(registration.attempt_status)) {
      return NextResponse.json({
        success: true,
        materialId: registration.material_id,
        attemptId,
        status: registration.attempt_status,
        duplicate: true,
      }, { headers: correlationHeaders(requestId) });
    }
    if (["FAILED", "CANCELLED", "DEAD_LETTER"].includes(registration.attempt_status)) {
      return fail(409, "IDEMPOTENCY_KEY_CLOSED", "This upload request has already finished unsuccessfully");
    }

    const { data: fileData, error: downloadError } = await supabaseServer.storage
      .from("study_materials")
      .download(storagePath);

    if (downloadError || !fileData) {
      await failAttempt(attemptId, "STORAGE_DOWNLOAD_FAILED", "The uploaded PDF could not be read", true);
      return fail(422, "STORAGE_DOWNLOAD_FAILED", "The uploaded PDF could not be read");
    }
    if (fileData.size !== fileSize || fileData.size > maxBytes) {
      await failAttempt(attemptId, "FILE_METADATA_MISMATCH", "The uploaded file size did not match the request");
      return fail(422, "FILE_METADATA_MISMATCH", "Uploaded file validation failed");
    }

    let parsed: { text: string; pages: number };
    try {
      parsed = await parsePdfBuffer(Buffer.from(await fileData.arrayBuffer()));
      if (!parsed.text.trim() || parsed.pages < 1) throw new Error("No readable PDF text was found");
    } catch (error) {
      const message = error instanceof Error ? error.message : "PDF parsing failed";
      await failAttempt(attemptId, "DOCUMENT_PARSE_FAILED", message);
      return fail(422, "DOCUMENT_PARSE_FAILED", "This PDF could not be parsed");
    }

    const { data: queueRows, error: queueError } = await supabaseServer.rpc(
      "reserve_and_queue_material",
      { p_user_id: user.id, p_attempt_id: attemptId, p_page_count: parsed.pages },
    );

    if (queueError || !queueRows?.[0]) {
      const message = databaseMessage(queueError);
      const code = message.includes("DOCUMENT_PAGE_LIMIT")
        ? "DOCUMENT_PAGE_LIMIT"
        : message.includes('USAGE_LIMIT_EXCEEDED:pages')
          ? "WEEKLY_PAGE_LIMIT"
          : message.includes('USAGE_LIMIT_EXCEEDED:generation')
            ? 'GENERATION_LIMIT'
          : "QUOTA_RESERVATION_FAILED";
      await failAttempt(attemptId, code, message, code === "QUOTA_RESERVATION_FAILED");
      const status = code === "QUOTA_RESERVATION_FAILED" ? 500 : 429;
      return fail(status, code, code === "DOCUMENT_PAGE_LIMIT"
        ? `Your plan supports up to ${usageSummary.maxPagesPerDocument} pages per document`
        : code === "WEEKLY_PAGE_LIMIT"
          ? `Your weekly ${usageSummary.pages.limit}-page allowance has been reached`
          : code === 'GENERATION_LIMIT'
            ? 'Your monthly study-kit allowance has been reached'
          : "Unable to reserve usage for this upload");
    }

    try {
      const event = await inngest.send({
        name: "ai/process.material",
        data: {
          materialId: registration.material_id,
          attemptId,
          text: parsed.text,
          planType: queueRows[0].plan_type,
          pageCount: parsed.pages,
          userId: user.id,
          correlationId: requestId,
        },
      });

      await supabaseServer
        .from("processing_attempts")
        .update({ event_id: event.ids[0] ?? null, heartbeat_at: new Date().toISOString() })
        .eq("id", attemptId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Queue dispatch failed";
      await failAttempt(attemptId, "QUEUE_DISPATCH_FAILED", message, true);
      await recordOperationalEvent({ correlationId: requestId, source: 'api', eventName: 'material.ingestion', severity: 'error', status: 'refunded', userId, materialId, attemptId: attemptId || undefined, durationMs: Math.round(performance.now() - startedAt), errorCode: 'QUEUE_DISPATCH_FAILED' });
      return fail(503, "QUEUE_DISPATCH_FAILED", "The job could not be queued. Your quota was refunded");
    }

    await recordOperationalEvent({ correlationId: requestId, source: 'api', eventName: 'material.ingestion', status: 'succeeded', userId, materialId, attemptId: attemptId || undefined, durationMs: Math.round(performance.now() - startedAt), metadata: { pageCount: parsed.pages } });
    return NextResponse.json({
      success: true,
      materialId: registration.material_id,
      attemptId,
      status: "QUEUED",
    }, { headers: correlationHeaders(requestId) });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError) return fail(401, "UNAUTHENTICATED", error.message);
    if (attemptId) {
      await failAttempt(
        attemptId,
        "INGESTION_FAILED",
        error instanceof Error ? error.message : "Unexpected ingestion failure",
        true,
      );
    }
    await recordOperationalEvent({ correlationId: requestId, source: 'api', eventName: 'material.ingestion', severity: 'error', status: 'failed', userId, materialId, attemptId: attemptId || undefined, durationMs: Math.round(performance.now() - startedAt), errorCode: 'INGESTION_FAILED' });
    return fail(500, "INGESTION_FAILED", "Unable to start document processing");
  }
}
