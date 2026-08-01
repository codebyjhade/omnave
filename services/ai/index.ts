import { AIServiceProvider } from "./types";
import { OrchestratorServiceProvider } from "./orchestrator";
 
let activeProvider: AIServiceProvider | null = null;
 
export function getAIProvider(): AIServiceProvider {
  if (activeProvider) return activeProvider;
  
  // Route all traffic through the multi-API waterfall orchestrator
  activeProvider = new OrchestratorServiceProvider(); 
  return activeProvider;
}
 
export * from "./types";
export * from "./logger";
export * from "./config";
export * from "./prompt.service";
export * from "./parser.service";
export * from "./validation.service";
export * from "./retry.service";
export * from "./error";