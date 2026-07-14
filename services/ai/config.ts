import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export const AI_CONFIG = {
  activeProvider: "gemini", // Matches your index.ts perfectly
  
  models: {
    chat: {
      name: "gemini-2.5-pro",
      temperature: 0.7, 
      maxOutputTokens: 2048,
    },
    notes: {
      name: "gemini-2.5-flash", 
      temperature: 0.1, 
      maxOutputTokens: 8192, 
    }
  },
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    }
  ],
  retry: {
    maxRetries: 3,
    initialDelayMs: 1500,
    backoffFactor: 2,
  },
  limits: {
    flashcards: 15,
    quizzes: 60, 
  }
};