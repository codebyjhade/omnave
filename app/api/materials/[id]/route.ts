import { NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabase/server-backend";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Missing material ID" }, { status: 400 });
    }

    // 1. Fetch the material to retrieve its content_url
    const { data: material, error: fetchError } = await supabaseServer
      .from("materials")
      .select("content_url, user_id")
      .eq("id", id)
      .single();

    if (fetchError || !material) {
      console.error("[DELETE API] Fetch material error:", fetchError);
      return NextResponse.json(
        { error: "Material not found or database error" },
        { status: 404 }
      );
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
      .eq("id", id);

    if (deleteError) {
      console.error("[DELETE API] Database deletion error:", deleteError);
      return NextResponse.json(
        { error: `Database deletion failed: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Material and associated storage assets deleted successfully"
    });

  } catch (error: any) {
    console.error("[DELETE API] Catch error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
