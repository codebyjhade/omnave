import { NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabase/server-backend";
import { AuthenticationError, requireAuthenticatedUser } from "@/utils/supabase/server";
import { apiError } from "@/lib/api-response";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { materialId } = body;

    if (!materialId) {
      return apiError(400, "MISSING_MATERIAL_ID", "Missing materialId");
    }

    const { user } = await requireAuthenticatedUser();

    // 1. Fetch material to confirm ownership
    const { data: material, error: fetchErr } = await supabaseServer
      .from("materials")
      .select("user_id, content_url")
      .eq("id", materialId)
      .single();

    if (fetchErr || !material) {
      return apiError(404, "MATERIAL_NOT_FOUND", "Material not found");
    }

    if (material.user_id !== user.id) {
      return apiError(403, "MATERIAL_FORBIDDEN", "You do not own this material");
    }

    const { data: attempt } = await supabaseServer
      .from("processing_attempts")
      .select("id, status")
      .eq("material_id", materialId)
      .eq("user_id", user.id)
      .order("attempt_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (attempt && ["REGISTERED", "QUEUED", "RUNNING"].includes(attempt.status)) {
      const { error: releaseError } = await supabaseServer.rpc("set_processing_attempt_state", {
        p_attempt_id: attempt.id,
        p_status: "CANCELLED",
        p_failure_code: "MATERIAL_DELETED",
        p_failure_message: "The material was deleted while processing",
        p_retryable: false,
      });
      if (releaseError) {
        console.error("Failed to release quota before material deletion:", releaseError);
        return apiError(500, "MATERIAL_DELETE_FAILED", "Unable to safely delete this material");
      }
    }

    if (material.content_url) {
      const { error: storageError } = await supabaseServer.storage
        .from("study_materials")
        .remove([material.content_url]);
      if (storageError) {
        console.error("Failed to delete material file:", storageError);
        return apiError(500, "MATERIAL_FILE_DELETE_FAILED", "Unable to delete the stored file");
      }
    }

    // Processing attempts cascade with the material row.
    const { error: deleteErr } = await supabaseServer
      .from("materials")
      .delete()
      .eq("id", materialId)
      .eq("user_id", user.id);

    if (deleteErr) {
      console.error("Failed to delete material:", deleteErr);
      return apiError(500, "MATERIAL_DELETE_FAILED", "Unable to delete material");
    }

    return NextResponse.json({ success: true, message: "Material deleted successfully" });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError) {
      return apiError(401, "UNAUTHENTICATED", error.message);
    }
    console.error("Delete API failure:", error);
    return apiError(500, "MATERIAL_DELETE_FAILED", "Unable to delete material");
  }
}
