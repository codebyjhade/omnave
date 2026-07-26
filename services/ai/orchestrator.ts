import { generateSummary } from "./summary.service";
import { generateFlashcards } from "./flashcards.service";
import { generateQuiz } from "./quiz.service";
import { generateTitle } from "./title.service";

export async function generateStudyKit(text: string, provider: "groq" | "gemini", planType: "free" | "paid" = "paid") {
  // Execute all four AI generation tasks at the exact same time
  const [summary, flashcards, quizzes, smartTitle] = await Promise.all([
    generateSummary(text, provider),
    generateFlashcards(text, provider),
    generateQuiz(text, provider, planType),
    generateTitle(text, provider)
  ]);

  return { summary, flashcards, quizzes, smartTitle };
}
