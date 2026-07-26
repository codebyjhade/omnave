import { inngest } from "./client";
import { supabaseServer } from "@/utils/supabase/server-backend";
import { generateSummary } from "@/services/ai/summary.service";
import { generateFlashcards } from "@/services/ai/flashcards.service";
import { generateQuiz } from "@/services/ai/quiz.service";
import { generateTitle } from "@/services/ai/title.service";

export const processMaterial = inngest.createFunction(
  { id: "process-study-material", triggers: [{ event: "ai/process.material" }] },
  async ({ event, step }) => {
    const { materialId, text, planType = "paid" } = event.data;

    // STEP 1: Provider Routing Logic
    // Using 4000 characters as a safe threshold for Groq's fast tier.
    // Anything larger routes to Gemini's massive context window.
    const provider = text.length < 4000 ? "groq" : "gemini";

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

      return await generateSummary(text, provider);
    });

    // Granular Status 3: BUILDING_ASSESSMENTS (75% progress)
    const assessments = await step.run("generate-assessments", async () => {
      const { error } = await supabaseServer
        .from("materials")
        .update({ status: "BUILDING_ASSESSMENTS" })
        .eq("id", materialId);
      if (error) throw new Error(`Assessments status update failed: ${error.message}`);

      const [flashcards, quizzes] = await Promise.all([
        generateFlashcards(text, provider),
        generateQuiz(text, provider, planType)
      ]);
      return { flashcards, quizzes };
    });

    // Granular Status 4: GENERATING_TITLE & SAVING (100% progress / COMPLETED)
    const smartTitle = await step.run("generate-title", async () => {
      return await generateTitle(text, provider);
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

    return { success: true, materialId, provider };
  }
);
