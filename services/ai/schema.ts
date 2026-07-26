// 1. TypeScript Interfaces for Frontend & DB
export interface Flashcard {
  front: string;
  back: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

// 2. JSON Schemas for AI SDKs
export const flashcardArraySchema = {
  type: "array",
  description: "An array of flashcards extracted from the text.",
  items: {
    type: "object",
    properties: {
      front: { type: "string", description: "The front of the flashcard." },
      back: { type: "string", description: "The back of the flashcard." }
    },
    required: ["front", "back"],
    additionalProperties: false
  }
} as const;

export const quizArraySchema = {
  type: "array",
  description: "A multiple-choice quiz based on the core concepts of the text.",
  items: {
    type: "object",
    properties: {
      question: { type: "string" },
      options: { 
        type: "array", 
        items: { type: "string" },
        description: "Exactly 4 plausible multiple choice options."
      },
      correctAnswer: { type: "string", description: "The exact string of the correct option." },
      explanation: { type: "string", description: "A brief explanation of why the answer is correct." }
    },
    required: ["question", "options", "correctAnswer", "explanation"],
    additionalProperties: false
  }
} as const;
