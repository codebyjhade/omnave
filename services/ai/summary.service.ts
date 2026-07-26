import { generateWithGemini } from "./gemini.service";
import { generateWithGroq } from "./groq.service";

export async function generateSummary(text: string, provider: "groq" | "gemini") {
  if (provider === "gemini") {
    return await generateWithGemini(text, "summary");
  } else if (provider === "groq") {
    return await generateWithGroq(text, "summary");
  }
  
  throw new Error(`Unsupported AI provider: ${provider}`);
}
