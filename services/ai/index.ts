import { AIServiceProvider } from "./types";
import { OrchestratorServiceProvider } from "./orchestrator";
 
let activeProvider: AIServiceProvider | null = null;
 
export function getAIProvider(): AIServiceProvider {
  if (activeProvider) return activeProvider;
  
  // One primary and one bounded free-tier fallback.
  activeProvider = new OrchestratorServiceProvider(); 
  return activeProvider;
}
 
export * from "./types";
export * from "./logger";
export * from "./config";
export * from "./prompt.service";
export * from "./retry.service";
export * from "./error";
