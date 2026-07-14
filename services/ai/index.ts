import { GeminiServiceProvider } from "./gemini.service";
import { AIServiceProvider } from "./types";
import { AI_CONFIG } from "./config";

let activeProvider: AIServiceProvider | null = null;

export function getAIProvider(): AIServiceProvider {
  if (activeProvider) return activeProvider;
  
  // Safely grab the provider from config, or force "gemini" as the ultimate fallback
  const providerType = (AI_CONFIG as any).activeProvider || (AI_CONFIG as any).provider || "gemini";
  
  if (providerType === "gemini" || String(providerType) === "undefined") {
    activeProvider = new GeminiServiceProvider();
    return activeProvider;
  }
  
  throw new Error(`Unsupported AI Provider: ${providerType}`);
}

export * from "./types";
export * from "./logger";
export * from "./config";
export * from "./prompt.service";
export * from "./parser.service";
export * from "./validation.service";
export * from "./retry.service";
export * from "./error";