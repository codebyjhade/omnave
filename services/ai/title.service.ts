import { generateWithGemini } from "./gemini.service";
import { generateWithGroq } from "./groq.service";

export async function generateTitle(text: string, provider: "groq" | "gemini"): Promise<string> {
  let title = "";
  if (provider === "gemini") {
    title = await generateWithGemini(text, "title");
  } else if (provider === "groq") {
    title = await generateWithGroq(text, "title");
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }
  return cleanTitle(title);
}

export function cleanTitle(title: string): string {
  let clean = title.trim();
  // Strip starting/ending quotes
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1).trim();
  }
  // Strip "Title:" or "Smart Title:" prefixes case-insensitively
  clean = clean.replace(/^(title|smart\s*title):\s*/i, "").trim();
  // Strip starting/ending quotes again in case they were inside the prefix
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1).trim();
  }
  return clean;
}
