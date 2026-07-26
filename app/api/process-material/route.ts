import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { supabaseServer } from "@/utils/supabase/server-backend";
import { extractTextFromPdfUrl } from "@/services/pdf.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { materialId, text, fileUrl, planType = "paid" } = body;

    // Require materialId, and EITHER pre-extracted text OR a fileUrl
    if (!materialId || (!text && !fileUrl)) {
      return NextResponse.json(
        { error: "Missing materialId, and either text or fileUrl payload" },
        { status: 400 }
      );
    }

    // 1. Fetch current material to get title, user_id, and content_url
    const { data: currentMaterial, error: fetchErr } = await supabaseServer
      .from("materials")
      .select("title, user_id, content_url")
      .eq("id", materialId)
      .single();

    if (fetchErr || !currentMaterial) {
      console.error("Failed to fetch current material:", fetchErr);
      return NextResponse.json(
        { error: "Failed to locate registered material" },
        { status: 404 }
      );
    }

    // 2. Extract text if a URL was provided
    let extractedText = text;
    if (!extractedText && fileUrl) {
      extractedText = await extractTextFromPdfUrl(fileUrl);
    }

    // 3. Quality-Gated Deduplication check
    const getFilenameFromUrl = (url: string | null | undefined): string | null => {
      if (!url) return null;
      const parts = url.split("/");
      const lastPart = parts[parts.length - 1];
      const underscoreIdx = lastPart.indexOf("_");
      if (underscoreIdx !== -1) {
        return lastPart.slice(underscoreIdx + 1);
      }
      return lastPart;
    };

    const currentFilename = getFilenameFromUrl(currentMaterial.content_url);

    // Fetch all processed materials for this user to check for duplicates
    const { data: processedMaterials } = await supabaseServer
      .from("materials")
      .select("id, title, content_url, quizzes, flashcards")
      .eq("user_id", currentMaterial.user_id)
      .eq("is_processed", true)
      .neq("id", materialId);

    const existingMaterial = (processedMaterials || []).find(m => {
      const mFilename = getFilenameFromUrl(m.content_url);
      const isFilenameMatch = currentFilename && mFilename && currentFilename.toLowerCase() === mFilename.toLowerCase();
      const isTitleMatch = currentMaterial.title && m.title && currentMaterial.title.toLowerCase() === m.title.toLowerCase();
      return isFilenameMatch || isTitleMatch;
    });

    if (existingMaterial) {
      const quizCount = Array.isArray(existingMaterial.quizzes) ? existingMaterial.quizzes.length : 0;
      const cardCount = Array.isArray(existingMaterial.flashcards) ? existingMaterial.flashcards.length : 0;

      if (quizCount >= 50 && cardCount >= 15) {
        // Cache Hit! Delete duplicate draft row and return existing ID
        await supabaseServer.from("materials").delete().eq("id", materialId);
        
        return NextResponse.json({
          success: true,
          materialId: existingMaterial.id,
          status: "COMPLETED",
          message: "Cache hit: reusing existing high-quality study material"
        });
      } else {
        // Cache Miss / Upgrade! Overwrite existing DB entry and trigger queue
        await supabaseServer.from("materials").delete().eq("id", materialId);
        
        await supabaseServer
          .from("materials")
          .update({ is_processed: false, status: "PROCESSING" })
          .eq("id", existingMaterial.id);

        await inngest.send({
          name: "ai/process.material",
          data: {
            materialId: existingMaterial.id,
            text: extractedText,
            planType: "paid" // Force paid tier regeneration for upgrading
          },
        });

        return NextResponse.json({
          success: true,
          materialId: existingMaterial.id,
          status: "PROCESSING",
          message: "Cache miss: upgrading existing material to high-quality paid tier"
        });
      }
    }

    // 4. Update Supabase to mark the material as 'PROCESSING' for new uploads
    const { error: dbError } = await supabaseServer
      .from("materials")
      .update({ is_processed: false, status: "PROCESSING" })
      .eq("id", materialId);

    if (dbError) {
      console.error("Supabase update error:", dbError);
      return NextResponse.json(
        { error: `Database Error: ${dbError.message} (Code: ${dbError.code})` },
        { status: 500 }
      );
    }

    // 5. Dispatch the event to the Inngest background queue
    await inngest.send({
      name: "ai/process.material",
      data: {
        materialId,
        text: extractedText,
        planType
      },
    });

    return NextResponse.json({
      success: true,
      materialId,
      message: "Material queued for background processing",
      status: "PROCESSING"
    });

  } catch (error: any) {
    console.error("Failed to trigger AI processing:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}