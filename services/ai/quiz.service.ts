import { generateWithGemini } from "./gemini.service";
import { generateWithGroq } from "./groq.service";

export async function generateQuiz(text: string, provider: "groq" | "gemini", planType: string = "free") {
  if (provider === "gemini") {
    return await generateWithGemini(text, "quiz", planType);
  } else if (provider === "groq") {
    return await generateWithGroq(text, "quiz", planType);
  }
  
  throw new Error(`Unsupported AI provider: ${provider}`);
}
