import { inngest } from "./client";
import { supabaseServer } from "@/utils/supabase/server-backend";
import { generateWithWaterfall } from "../llm-waterfall";

export const processMaterial = inngest.createFunction(
  { 
    id: "process-study-material", 
    triggers: [{ event: "ai/process.material" }],
    retries: 0
  },
  async ({ event, step }) => {
    const { materialId, text, planType = "free" } = event.data;

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
        
        const flashcardsSystemInstruction = isPro
          ? "You are an expert university professor. Act as a strict professor, analyze the core topics, and incorporate related external knowledge/research to make highly challenging, comprehensive flashcards covering concepts, vocabulary, and facts. Generate exactly 80 flashcards."
          : "You are an expert tutor. Create highly effective flashcards covering the core concepts, vocabulary, and facts from the provided text. Generate exactly 25 flashcards.";

        const quizSystemInstruction = isPro
          ? "You are an expert university professor. Act as a strict professor, analyze the core topics, and incorporate related external knowledge/research to make the questions highly challenging and unique. Generate exactly 80 questions (suitable for a mix of practice quizzes and comprehensive exams)."
          : "You are an expert tutor. Generate a standard multiple-choice quiz based strictly on the provided text. The quiz must contain exactly 25 questions.";

        const [flashcards, quizzes] = await Promise.all([
          generateWithWaterfall(text, flashcardsSystemInstruction, true),
          generateWithWaterfall(text, quizSystemInstruction, true)
        ]);
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
