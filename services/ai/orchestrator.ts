import { generateSummary } from "./summary.service";
import { generateFlashcards } from "./flashcards.service";
import { generateQuiz } from "./quiz.service";
import { generateTitle } from "./title.service";
import { AIServiceProvider, GenerateChatParams, GenerateNotesParams, StudyKitResponse } from "./types";
import { GeminiServiceProvider } from "./gemini.service";
import { AILogger } from "./logger";
import Groq from "groq-sdk";
import { PromptService } from "./prompt.service";
 
export async function generateStudyKit(text: string, provider: "groq" | "gemini", planType: "free" | "paid" = "paid") {
  // Execute all four AI generation tasks at the exact same time
  const [summary, flashcards, quizzes, smartTitle] = await Promise.all([
    generateSummary(text, provider),
    generateFlashcards(text, provider),
    generateQuiz(text, provider, planType),
    generateTitle(text, provider)
  ]);
 
  return { summary, flashcards, quizzes, smartTitle };
}
 
export class OrchestratorServiceProvider implements AIServiceProvider {
  private geminiProvider = new GeminiServiceProvider();
  private groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
 
  async askQuestion(params: GenerateChatParams, reqId: string): Promise<string> {
    try {
      AILogger.log("ORCHESTRATOR", reqId, "Attempting Gemini chat");
      return await this.geminiProvider.askQuestion(params, reqId);
    } catch (error: any) {
      AILogger.log("ORCHESTRATOR_ERROR", reqId, `Gemini chat failed, falling back to Groq Llama. Error: ${error?.message || error}`);
      try {
        const prompt = PromptService.getChatPrompt(params.message, params.summary, params.history);
        const response = await this.groqClient.chat.completions.create({
          messages: [
            { role: "system", content: "You are OmnaveAI, a helpful context-locked study assistant." },
            { role: "user", content: prompt }
          ],
          model: "llama-3.1-8b-instant",
          temperature: 0.2,
        });
        const text = response.choices[0]?.message?.content;
        if (!text) throw new Error("Empty response from Groq Llama");
        return text;
      } catch (groqError: any) {
        AILogger.log("ORCHESTRATOR_ERROR", reqId, `Groq chat fallback also failed: ${groqError?.message || groqError}`);
        throw groqError;
      }
    }
  }
 
  async generateStudyKit(params: GenerateNotesParams, reqId: string): Promise<StudyKitResponse> {
    try {
      AILogger.log("ORCHESTRATOR", reqId, "Attempting Gemini study kit generation");
      return await this.geminiProvider.generateStudyKit(params, reqId);
    } catch (error: any) {
      AILogger.log("ORCHESTRATOR_ERROR", reqId, `Gemini study kit generation failed, falling back to Groq Orchestrator. Error: ${error?.message || error}`);
      try {
        const pdfBuffer = Buffer.from(params.pdfBase64, "base64");
        const pdfParse = require("pdf-parse");
        const parsedData = await pdfParse(pdfBuffer);
        const textContent = parsedData.text || "";
        
        AILogger.log("ORCHESTRATOR", reqId, `Successfully extracted ${textContent.length} characters from PDF for Groq`);
        
        const kit = await generateStudyKit(textContent, "groq", "paid");
        return {
          ai_title: kit.smartTitle,
          summary: kit.summary,
          flashcards: kit.flashcards,
          quizzes: kit.quizzes
        };
      } catch (fallbackError: any) {
        AILogger.log("ORCHESTRATOR_ERROR", reqId, `Groq study kit fallback failed: ${fallbackError?.message || fallbackError}`);
        throw fallbackError;
      }
    }
  }
}
