import { generateWithGemini } from "./gemini.service";
import { generateWithGroq } from "./groq.service";

export async function generateFlashcards(text: string, provider: "groq" | "gemini") {
  if (provider === "gemini") {
    return await generateWithGemini(text, "flashcards");
  } else if (provider === "groq") {
    return await generateWithGroq(text, "flashcards");
  }
  
  throw new Error(`Unsupported AI provider: ${provider}`);
}
