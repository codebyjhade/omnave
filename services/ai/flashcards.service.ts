import { generateWithGemini } from "./gemini.service";
import { generateWithGroq } from "./groq.service";

export async function generateFlashcards(text: string, provider: "groq" | "gemini", planType: string = "free") {
  if (provider === "gemini") {
    return await generateWithGemini(text, "flashcards", planType);
  } else if (provider === "groq") {
    return await generateWithGroq(text, "flashcards", planType);
  }
  
  throw new Error(`Unsupported AI provider: ${provider}`);
}
