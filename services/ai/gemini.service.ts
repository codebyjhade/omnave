import { GoogleGenAI } from "@google/genai";
import { supabaseServer } from "@/utils/supabase/server-backend";
import { AI_CONFIG } from "./config";
import { AILogger } from "./logger";
import { PromptService } from "./prompt.service";
import { RetryService } from "./retry.service";
import type { AIServiceProvider, GenerateChatParams } from "./types";

export class GeminiServiceProvider implements AIServiceProvider {
  private client: GoogleGenAI | null = null;

  private getClient(): GoogleGenAI {
    if (this.client) return this.client;
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing");
    this.client = new GoogleGenAI({ apiKey });
    return this.client;
  }

  async askQuestion(params: GenerateChatParams, reqId: string): Promise<string> {
    if (process.env.AI_ENGINE_ENABLED === "false" || process.env.AI_DISABLE_GEMINI === "true") {
      throw new Error("Gemini provider is disabled");
    }
    const prompt = PromptService.getChatPrompt(params.message, params.summary, params.history);
    const startedAt = performance.now();
    try {
      const response = await RetryService.runWithRetry(
        () => RetryService.withTimeout(
          this.getClient().models.generateContent({
            model: AI_CONFIG.chat.model,
            contents: prompt,
            config: {
              temperature: AI_CONFIG.chat.temperature,
              maxOutputTokens: AI_CONFIG.chat.maxOutputTokens,
            },
          }),
          AI_CONFIG.chat.requestTimeoutMs,
        ),
        reqId,
        AI_CONFIG.retry.maxAttempts,
        AI_CONFIG.retry.initialDelayMs,
        AI_CONFIG.retry.backoffFactor,
      );
      const reply = response.text?.trim();
      if (!reply) throw new Error("EMPTY_PROVIDER_RESPONSE");

      if (params.userId) {
        await supabaseServer.from("ai_generation_runs").insert({
          correlation_id: reqId,
          user_id: params.userId,
          stage: "chat",
          prompt_version: AI_CONFIG.chat.promptVersion,
          schema_version: "chat-text-v1",
          provider: "gemini",
          model: AI_CONFIG.chat.model,
          provider_attempt: 1,
          status: "SUCCEEDED",
          input_characters: prompt.length,
          input_tokens: response.usageMetadata?.promptTokenCount ?? null,
          output_tokens: response.usageMetadata?.candidatesTokenCount ?? null,
          duration_ms: Math.round(performance.now() - startedAt),
          estimated_cost_usd: 0,
          quality: { nonEmpty: true },
        });
      }
      return reply;
    } catch (error) {
      AILogger.log("GEMINI_ERROR", reqId, "Gemini chat request failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      if (params.userId) {
        await supabaseServer.from("ai_generation_runs").insert({
          correlation_id: reqId,
          user_id: params.userId,
          stage: "chat",
          prompt_version: AI_CONFIG.chat.promptVersion,
          schema_version: "chat-text-v1",
          provider: "gemini",
          model: AI_CONFIG.chat.model,
          provider_attempt: 1,
          status: "FAILED",
          input_characters: prompt.length,
          duration_ms: Math.round(performance.now() - startedAt),
          error_code: "PROVIDER_REQUEST_FAILED",
          error_message: (error instanceof Error ? error.message : String(error)).slice(0, 1000),
        });
      }
      throw error;
    }
  }
}
