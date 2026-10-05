import { NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabase/server-backend";
import { AuthenticationError, requireAuthenticatedUser } from "@/utils/supabase/server";
import { apiError } from "@/lib/api-response";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return apiError(400, "MISSING_MATERIAL_ID", "Missing material ID");
    }

    const { user } = await requireAuthenticatedUser();

    // The service-role client bypasses RLS, so ownership is part of the query.
    const { data: material, error: fetchError } = await supabaseServer
      .from("materials")
      .select("content_url, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError || !material) {
      console.error("[DELETE API] Fetch material error:", fetchError);
      return apiError(404, "MATERIAL_NOT_FOUND", "Material not found");
    }

    // 2. Remove the PDF file from the Supabase Storage Bucket
    if (material.content_url) {
      const { error: storageError } = await supabaseServer.storage
        .from("study_materials")
        .remove([material.content_url]);

      if (storageError) {
        console.error("[DELETE API] Storage cleanup error:", storageError.message);
      }
    }

    // 3. Delete the material row from the database
    const { error: deleteError } = await supabaseServer
      .from("materials")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("[DELETE API] Database deletion error:", deleteError);
      return apiError(500, "MATERIAL_DELETE_FAILED", "Unable to delete material");
    }

    return NextResponse.json({
      success: true,
      message: "Material and associated storage assets deleted successfully"
    });

  } catch (error: unknown) {
    if (error instanceof AuthenticationError) {
      return apiError(401, "UNAUTHENTICATED", error.message);
    }
    console.error("[DELETE API] Catch error:", error);
    return apiError(500, "INTERNAL_ERROR", "Internal server error");
  }
}
