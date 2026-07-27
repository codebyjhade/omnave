import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { supabaseServer } from "@/utils/supabase/server-backend";
import { parsePdfFromUrl } from "@/services/pdf.service";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { materialId, text, fileUrl } = body;

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

    // Ensure user owns this material
    if (user.id !== currentMaterial.user_id) {
      return NextResponse.json(
        { error: "Unauthorized: Material owner mismatch" },
        { status: 403 }
      );
    }

    // Fetch user profile to check plan and quota limits
    const { data: profile, error: profileErr } = await supabaseServer
      .from("profiles")
      .select("plan_type, generation_count")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      console.error("Failed to fetch user profile in route.ts:", profileErr);
      return NextResponse.json(
        { error: "Unable to retrieve user subscription tier details." },
        { status: 500 }
      );
    }

    const planType = profile.plan_type || "free";
    const generationCount = profile.generation_count || 0;

    // Helper: cleanup on failed checks
    const cleanUpFailedUpload = async () => {
      // Delete from Supabase Storage
      if (currentMaterial.content_url) {
        const { error: storageDelErr } = await supabaseServer.storage
          .from("study_materials")
          .remove([currentMaterial.content_url]);
        if (storageDelErr) {
          console.error("Failed to delete orphaned storage file:", storageDelErr);
        }
      }
      // Delete database draft row
      const { error: dbDelErr } = await supabaseServer
        .from("materials")
        .delete()
        .eq("id", materialId);
      if (dbDelErr) {
        console.error("Failed to delete orphaned database row:", dbDelErr);
      }
    };

    // Check 1 (Quota)
    if (planType === "free" && generationCount >= 3) {
      await cleanUpFailedUpload();
      return NextResponse.json(
        { error: "Monthly free quota reached." },
        { status: 403 }
      );
    }

    // 2. Parse PDF and extract page count
    let extractedText = text;
    let pageCount = 0;

    if (fileUrl) {
      try {
        const parsed = await parsePdfFromUrl(fileUrl);
        extractedText = parsed.text;
        pageCount = parsed.pages;
      } catch (parseError: unknown) {
        console.error("PDF parsing failure in route.ts:", parseError);
        const errMsg = parseError instanceof Error ? parseError.message : String(parseError);
        return NextResponse.json(
          { error: `Failed to parse PDF: ${errMsg}` },
          { status: 422 }
        );
      }
    }

    // Check 2 (Pages)
    if (planType === "free" && pageCount > 30) {
      await cleanUpFailedUpload();
      return NextResponse.json(
        { error: "Free tier page limit exceeded (max 30 pages)." },
        { status: 403 }
      );
    }

    if (planType === "pro" && pageCount > 200) {
      await cleanUpFailedUpload();
      return NextResponse.json(
        { error: "Pro tier page limit exceeded (max 200 pages)." },
        { status: 403 }
      );
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

        // Increment quota
        await supabaseServer
          .from("profiles")
          .update({ generation_count: generationCount + 1 })
          .eq("id", user.id);

        await inngest.send({
          name: "ai/process.material",
          data: {
            materialId: existingMaterial.id,
            text: extractedText,
            planType: planType
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

    // Increment quota for new uploads
    await supabaseServer
      .from("profiles")
      .update({ generation_count: generationCount + 1 })
      .eq("id", user.id);

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
        planType: planType
      },
    });

    return NextResponse.json({
      success: true,
      materialId,
      message: "Material queued for background processing",
      status: "PROCESSING"
    });

  } catch (error: unknown) {
    console.error("Failed to trigger AI processing:", error);
    const errMsg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}