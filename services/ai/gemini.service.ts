import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { AIServiceProvider, GenerateChatParams, GenerateNotesParams, StudyKitResponse } from "./types";
import { PromptService } from "./prompt.service";
import { ParserService } from "./parser.service";
import { ValidationService } from "./validation.service";
import { RetryService } from "./retry.service";
import { AILogger } from "./logger";
import { AI_CONFIG } from "./config";

export class GeminiServiceProvider implements AIServiceProvider {
  private genAI: GoogleGenerativeAI | null = null;

  private getClient(): GoogleGenerativeAI {
    if (this.genAI) return this.genAI;
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    return this.genAI;
  }

  // In services/ai/gemini.service.ts
  async askQuestion(params: GenerateChatParams, reqId: string): Promise<string> {
    // Pass the history array into our new Script Injection prompt
    const prompt = PromptService.getChatPrompt(params.message, params.summary, params.history);
    
    AILogger.log("GEMINI_REQUEST", reqId, "Starting Gemini chat request with Injected Memory Script");

    const reply = await RetryService.runWithRetry(async () => {
      const client = this.getClient();
      
      const safetySettings = AI_CONFIG.safetySettings.map((s) => ({
        category: s.category as HarmCategory,
        threshold: s.threshold as HarmBlockThreshold,
      }));

      // We go back to standard generateContent, which is highly stable
      const model = client.getGenerativeModel({
        model: AI_CONFIG.models.chat.name,
        generationConfig: {
          temperature: AI_CONFIG.models.chat.temperature, // Make sure this is 0.7 in config for a natural tone
          maxOutputTokens: AI_CONFIG.models.chat.maxOutputTokens,
        },
        safetySettings,
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      if (!text) throw new Error("Empty response from Gemini AI");
      return text;
    }, reqId, AI_CONFIG.retry.maxRetries, AI_CONFIG.retry.initialDelayMs, AI_CONFIG.retry.backoffFactor);

    AILogger.log("GEMINI_RESPONSE", reqId, "Successfully received Gemini chat response");
    return reply;
  }

  async generateStudyKit(params: GenerateNotesParams, reqId: string): Promise<StudyKitResponse> {
    AILogger.log("GEMINI_REQUEST", reqId, "Starting SEQUENTIAL Gemini study kit JSON request");

    const client = this.getClient();
    const safetySettings = AI_CONFIG.safetySettings.map((s) => ({
      category: s.category as HarmCategory,
      threshold: s.threshold as HarmBlockThreshold,
    }));

    // 1. Schema for the Main Study Kit (Summary, Flashcards, Quizzes)
    const mainSchema = {
      type: "OBJECT" as any,
      properties: {
        summary: { type: "STRING" as any },
        flashcards: {
          type: "ARRAY" as any,
          items: {
            type: "OBJECT" as any,
            properties: {
              front: { type: "STRING" as any },
              back: { type: "STRING" as any }
            },
            required: ["front", "back"]
          }
        },
        quizzes: {
          type: "ARRAY" as any,
          items: {
            type: "OBJECT" as any,
            properties: {
              type: { type: "STRING" as any },
              question: { type: "STRING" as any },
              options: { type: "ARRAY" as any, items: { type: "STRING" as any } },
              correctAnswer: { type: "STRING" as any },
              correctAnswerIndex: { type: "INTEGER" as any },
              explanation: { type: "STRING" as any }
            },
            required: ["type", "question", "options", "correctAnswer", "correctAnswerIndex", "explanation"]
          }
        }
      },
      required: ["summary", "flashcards", "quizzes"]
    };

    // 2. Schema for the Supplemental Batches (JSON object with a "quizzes" key)
    const suppSchema = {
      type: "OBJECT" as any,
      properties: {
        quizzes: {
          type: "ARRAY" as any,
          items: {
            type: "OBJECT" as any,
            properties: {
              type: { type: "STRING" as any },
              question: { type: "STRING" as any },
              options: { type: "ARRAY" as any, items: { type: "STRING" as any } },
              correctAnswer: { type: "STRING" as any },
              correctAnswerIndex: { type: "INTEGER" as any },
              explanation: { type: "STRING" as any }
            },
            required: ["type", "question", "options", "correctAnswer", "correctAnswerIndex", "explanation"]
          }
        }
      },
      required: ["quizzes"]
    };

    // Create models
    const mainModel = client.getGenerativeModel({
      model: AI_CONFIG.models.notes.name,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: mainSchema,
        temperature: AI_CONFIG.models.notes.temperature,
        maxOutputTokens: AI_CONFIG.models.notes.maxOutputTokens,
      },
      safetySettings,
    });

    const suppModel = client.getGenerativeModel({
      model: AI_CONFIG.models.notes.name,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: suppSchema,
        temperature: AI_CONFIG.models.notes.temperature,
        maxOutputTokens: AI_CONFIG.models.notes.maxOutputTokens,
      },
      safetySettings,
    });

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    // Step A: Await the generation of the Main Kit
    AILogger.log("GEMINI_REQUEST", reqId, "Generating Main Kit (Summary, Flashcards, 20 Quizzes)");
    const mainData = await RetryService.runWithRetry(async () => {
      const prompt = PromptService.getStudyKitPrompt(false);
      const result = await mainModel.generateContent([
        { inlineData: { data: params.pdfBase64, mimeType: "application/pdf" } },
        prompt
      ]);
      const text = result.response.text();
      if (!text) throw new Error("Empty response from main task");
      return ParserService.parseJson(text);
    }, reqId, AI_CONFIG.retry.maxRetries, AI_CONFIG.retry.initialDelayMs, AI_CONFIG.retry.backoffFactor);

    let allQuizzes = Array.isArray(mainData.quizzes) ? mainData.quizzes : [];

    // Step B: Await a 2000ms timeout
    AILogger.log("GEMINI_REQUEST", reqId, "Waiting 2000ms before Supplemental Batch 1");
    await delay(2000);

    // Step C: Await the generation of Supplemental Batch 1 (20 Quizzes)
    let supp1: any[] = [];
    try {
      AILogger.log("GEMINI_REQUEST", reqId, "Generating Supplemental Batch 1 (20 Quizzes)");
      const suppPrompt1 = PromptService.getStudyKitPrompt(true);
      const rawText = await RetryService.runWithRetry(async () => {
        const result = await suppModel.generateContent([
          { inlineData: { data: params.pdfBase64, mimeType: "application/pdf" } },
          suppPrompt1
        ]);
        const text = result.response.text();
        if (!text) throw new Error("Empty response from supplemental batch 1");
        return text;
      }, reqId, 2, 1000, 2);
      
      const parsed = ParserService.parseJson(rawText);
      if (parsed && Array.isArray(parsed.quizzes)) {
        supp1 = parsed.quizzes;
      }
    } catch (e) {
      console.error("Supplemental Batch 1 Failed (graceful fallback to empty):", e);
    }

    // Step D: Await a 2000ms timeout
    AILogger.log("GEMINI_REQUEST", reqId, "Waiting 2000ms before Supplemental Batch 2");
    await delay(2000);

    // Step E: Await the generation of Supplemental Batch 2 (20 Quizzes)
    let supp2: any[] = [];
    try {
      AILogger.log("GEMINI_REQUEST", reqId, "Generating Supplemental Batch 2 (20 Quizzes)");
      const suppPrompt2 = PromptService.getStudyKitPrompt(true);
      const rawText = await RetryService.runWithRetry(async () => {
        const result = await suppModel.generateContent([
          { inlineData: { data: params.pdfBase64, mimeType: "application/pdf" } },
          suppPrompt2
        ]);
        const text = result.response.text();
        if (!text) throw new Error("Empty response from supplemental batch 2");
        return text;
      }, reqId, 2, 1000, 2);
      
      const parsed = ParserService.parseJson(rawText);
      if (parsed && Array.isArray(parsed.quizzes)) {
        supp2 = parsed.quizzes;
      }
    } catch (e) {
      console.error("Supplemental Batch 2 Failed (graceful fallback to empty):", e);
    }

    // Step F: Merge all quiz arrays together (20 + 20 + 20 = 60 Quizzes)
    allQuizzes = [...allQuizzes, ...supp1, ...supp2];
    mainData.quizzes = allQuizzes;

    AILogger.log("GEMINI_RESPONSE", reqId, `Merged quiz lists successfully. Total questions: ${allQuizzes.length}`);

    return ValidationService.validateStudyKit(mainData);
  }
}