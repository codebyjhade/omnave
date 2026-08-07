import { inngest } from "./client";
import { supabaseServer } from "@/utils/supabase/server-backend";
import { generateWithWaterfall } from "../llm-waterfall";
import { chunkText } from "@/utils/text-chunker";

export const processMaterial = inngest.createFunction(
  { 
    id: "process-study-material", 
    triggers: [{ event: "ai/process.material" }],
    cancelOn: [
      {
        event: "ai/process.cancel",
        match: "data.materialId"
      }
    ],
    retries: 0
  },
  async ({ event, step }) => {
    const { materialId, text, planType = "free", pageCount = 0, userId } = event.data;

    try {
      // Granular Status 1: PARSING_DOCUMENT (10% progress)
      await step.run("status-parsing-document", async () => {
        const { error } = await supabaseServer
          .from("materials")
          .update({ status: "PARSING_DOCUMENT" })
          .eq("id", materialId);
        if (error) throw new Error(`Parsing update failed: ${error.message}`);
      });

      // Granular Status 2: GENERATING_SUMMARY (40% progress)
      const summary = await step.run("generate-summary", async () => {
        const { error } = await supabaseServer
          .from("materials")
          .update({ status: "GENERATING_SUMMARY" })
          .eq("id", materialId);
        if (error) throw new Error(`Summary status update failed: ${error.message}`);

        const systemInstruction = "You are an expert tutor. Summarize the provided text into a clear, comprehensive, and highly structured overview. Format the output as clean markdown.";
        return await generateWithWaterfall(text, systemInstruction, false);
      });

      // Granular Status 3: BUILDING_ASSESSMENTS (75% progress)
      const assessments = await step.run("generate-assessments", async () => {
        const { error } = await supabaseServer
          .from("materials")
          .update({ status: "BUILDING_ASSESSMENTS" })
          .eq("id", materialId);
        if (error) throw new Error(`Assessments status update failed: ${error.message}`);

        const isPro = planType === "pro" || planType === "paid";
        const chunks = chunkText(text, 3000);
        const numChunks = Math.max(1, chunks.length);

        const targetCardsTotal = isPro ? 80 : 25;
        const targetQuizTotal = isPro ? 80 : 25;
        const cardsPerChunk = Math.max(5, Math.ceil(targetCardsTotal / numChunks));
        const quizPerChunk = Math.max(5, Math.ceil(targetQuizTotal / numChunks));

        // MAP PHASE: Generate flashcards and quizzes concurrently for EACH chunk
        const chunkResults = await Promise.all(
          chunks.map(async (chunkContent, idx) => {
            const chunkLabel = numChunks > 1 ? ` (Part ${idx + 1} of ${numChunks})` : "";

            const flashcardsSystemInstruction = isPro
              ? `You are an expert university professor. Act as a strict professor, analyze the core topics in this text section${chunkLabel}, and incorporate related external knowledge/research to make highly challenging, comprehensive flashcards covering concepts, vocabulary, and facts. Generate exactly ${cardsPerChunk} flashcards.`
              : `You are an expert tutor. Create highly effective flashcards covering the core concepts, vocabulary, and facts from this text section${chunkLabel}. Generate exactly ${cardsPerChunk} flashcards.`;

            const quizSystemInstruction = isPro
              ? `You are an expert university professor. Act as a strict professor, analyze the core topics in this text section${chunkLabel}, and incorporate related external knowledge/research to make the questions highly challenging and unique. Generate exactly ${quizPerChunk} questions.`
              : `You are an expert tutor. Generate a standard multiple-choice quiz based strictly on this text section${chunkLabel}. The quiz must contain exactly ${quizPerChunk} questions.`;

            const [cards, quizzes] = await Promise.all([
              generateWithWaterfall(chunkContent, flashcardsSystemInstruction, true),
              generateWithWaterfall(chunkContent, quizSystemInstruction, true)
            ]);

            return {
              flashcards: Array.isArray(cards) ? (cards as any[]) : [],
              quizzes: Array.isArray(quizzes) ? (quizzes as any[]) : []
            };
          })
        );

        // REDUCE PHASE: Flatten JSON arrays returned from all chunks
        const flashcards = chunkResults.flatMap(r => r.flashcards);
        const quizzes = chunkResults.flatMap(r => r.quizzes);

        return { flashcards, quizzes };
      });

      // Granular Status 4: GENERATING_TITLE & SAVING (100% progress / COMPLETED)
      const smartTitle = await step.run("generate-title", async () => {
        const systemInstruction = "You are an expert tutor. Generate a short, academic, human-readable title for the provided text. Limit it to 4-6 words. Do not use quotes, prefixes like 'Title:', or markdown formatting, just return the title.";
        return await generateWithWaterfall(text, systemInstruction, false);
      });

      await step.run("save-to-database", async () => {
        const { error } = await supabaseServer
          .from("materials")
          .update({
            is_processed: true,
            status: "COMPLETED",
            title: smartTitle,
            summary,
            flashcards: assessments.flashcards,
            quizzes: assessments.quizzes
          })
          .eq("id", materialId);

        if (error) {
          throw new Error(`Database final update failed: ${error.message}`);
        }
      });

      // Usage Increment: Update user's weekly_pages_used upon successful processing
      await step.run("increment-user-usage", async () => {
        if (!pageCount || pageCount <= 0) return;

        const targetUserId = userId || (
          await supabaseServer
            .from("materials")
            .select("user_id")
            .eq("id", materialId)
            .single()
        ).data?.user_id;

        if (targetUserId) {
          const { data: usage } = await supabaseServer
            .from("user_usage")
            .select("weekly_pages_used")
            .eq("user_id", targetUserId)
            .single();

          const currentUsed = usage?.weekly_pages_used ?? 0;
          const { error: usageUpdateErr } = await supabaseServer
            .from("user_usage")
            .upsert(
              {
                user_id: targetUserId,
                weekly_pages_used: currentUsed + pageCount,
              },
              { onConflict: "user_id" }
            );

          if (usageUpdateErr) {
            console.error("Failed to increment user_usage weekly_pages_used:", usageUpdateErr);
          }
        }
      });

      return { success: true, materialId, provider: "waterfall" };
    } catch (err) {
      console.error("AI Generation failed inside Inngest, running recovery safety net:", err);

      await step.run("handle-failure-recovery", async () => {
        // Fetch the material to find the owner's user_id and verify current status
        const { data: material } = await supabaseServer
          .from("materials")
          .select("user_id, status")
          .eq("id", materialId)
          .single();

        if (material && material.status !== "failed") {
          // Update status in Supabase to `failed`
          const { error: updateErr } = await supabaseServer
            .from("materials")
            .update({ status: "failed" })
            .eq("id", materialId);

          if (updateErr) {
            console.error("Failed to update material status to failed:", updateErr);
          }

          // Decrement user's generation_count in profiles table by 1
          if (material.user_id) {
            const { data: profile } = await supabaseServer
              .from("profiles")
              .select("generation_count")
              .eq("id", material.user_id)
              .single();

            if (profile) {
              const currentCount = profile.generation_count || 0;
              const newCount = Math.max(0, currentCount - 1);
              
              const { error: profileUpdateErr } = await supabaseServer
                .from("profiles")
                .update({ generation_count: newCount })
                .eq("id", material.user_id);

              if (profileUpdateErr) {
                console.error("Failed to decrement user profile generation_count:", profileUpdateErr);
              }
            }
          }
        }
      });

      // Rethrow to let Inngest know the run failed
      throw err;
    }
  }
);
