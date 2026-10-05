import Groq from "groq-sdk";
import { supabaseServer } from "@/utils/supabase/server-backend";
import { GeminiServiceProvider } from "./gemini.service";
import { AILogger } from "./logger";
import { PromptService } from "./prompt.service";
import { RetryService } from "./retry.service";
import { AI_CONFIG } from "./config";
import type { AIServiceProvider, GenerateChatParams } from "./types";

const GROQ_CHAT_MODEL = "openai/gpt-oss-20b";

export class OrchestratorServiceProvider implements AIServiceProvider {
  private geminiProvider = new GeminiServiceProvider();

  async askQuestion(params: GenerateChatParams, reqId: string): Promise<string> {
    try {
      return await this.geminiProvider.askQuestion(params, reqId);
    } catch (geminiError) {
      AILogger.log("ORCHESTRATOR", reqId, "Using bounded Groq chat fallback", {
        error: geminiError instanceof Error ? geminiError.message : String(geminiError),
      });
    }

    if (process.env.AI_ENGINE_ENABLED === "false" || process.env.AI_DISABLE_GROQ === "true") {
      throw new Error("AI chat providers are disabled");
    }
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) throw new Error("No free chat fallback is configured");
    const prompt = PromptService.getChatPrompt(params.message, params.summary, params.history);
    const startedAt = performance.now();
    try {
      const response = await RetryService.withTimeout(
        new Groq({ apiKey }).chat.completions.create({
          model: GROQ_CHAT_MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          max_tokens: AI_CONFIG.chat.maxOutputTokens,
        }),
        AI_CONFIG.chat.requestTimeoutMs,
      );
      const reply = response.choices[0]?.message?.content?.trim();
      if (!reply) throw new Error("EMPTY_PROVIDER_RESPONSE");

      if (params.userId) {
        const inputTokens = response.usage?.prompt_tokens ?? null;
        const outputTokens = response.usage?.completion_tokens ?? null;
        await supabaseServer.from("ai_generation_runs").insert({
          correlation_id: reqId,
          user_id: params.userId,
          stage: "chat",
          prompt_version: "tutor-chat-v2",
          schema_version: "chat-text-v1",
          provider: "groq",
          model: GROQ_CHAT_MODEL,
          provider_attempt: 2,
          status: "SUCCEEDED",
          input_characters: prompt.length,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          duration_ms: Math.round(performance.now() - startedAt),
          estimated_cost_usd: inputTokens === null || outputTokens === null
            ? null
            : (inputTokens * 0.075 + outputTokens * 0.30) / 1_000_000,
          quality: { nonEmpty: true },
        });
      }
      return reply;
    } catch (error) {
      if (params.userId) {
        await supabaseServer.from("ai_generation_runs").insert({
          correlation_id: reqId,
          user_id: params.userId,
          stage: "chat",
          prompt_version: "tutor-chat-v2",
          schema_version: "chat-text-v1",
          provider: "groq",
          model: GROQ_CHAT_MODEL,
          provider_attempt: 2,
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
