import { StudyKitResponse } from "./types";

export class ValidationService {
  static validateStudyKit(data: any): StudyKitResponse {
    if (!data || typeof data !== "object") {
      throw new Error("AI output is not a valid JSON object");
    }

    if (!data.summary || typeof data.summary !== "string" || !data.summary.trim()) {
      throw new Error("AI response validation failed: missing or empty summary");
    }

    if (!Array.isArray(data.flashcards) || data.flashcards.length === 0) {
      throw new Error("AI response validation failed: missing or empty flashcards array");
    }

    data.flashcards.forEach((card: any, idx: number) => {
      if (!card || typeof card !== "object") {
        throw new Error(`Flashcard at index ${idx} is not an object`);
      }
      if (!card.front || typeof card.front !== "string" || !card.front.trim()) {
        throw new Error(`Flashcard at index ${idx} has a missing or empty 'front'`);
      }
      if (!card.back || typeof card.back !== "string" || !card.back.trim()) {
        throw new Error(`Flashcard at index ${idx} has a missing or empty 'back'`);
      }
    });

    if (!Array.isArray(data.quizzes) || data.quizzes.length === 0) {
      throw new Error("AI response validation failed: missing or empty quizzes array");
    }

    data.quizzes.forEach((quiz: any, idx: number) => {
      if (!quiz || typeof quiz !== "object") {
        throw new Error(`Quiz at index ${idx} is not an object`);
      }
      if (!quiz.question || typeof quiz.question !== "string" || !quiz.question.trim()) {
        throw new Error(`Quiz at index ${idx} has a missing or empty 'question'`);
      }

      const type = quiz.type || "multiple-choice";
      quiz.type = type;

      if (type === "multiple-choice" || type === "true-false") {
        if (!Array.isArray(quiz.options) || quiz.options.length < 2) {
          throw new Error(`Quiz at index ${idx} must contain an options array with at least 2 options for type ${type}`);
        }
        quiz.options.forEach((opt: any, optIdx: number) => {
          if (typeof opt !== "string" || !opt.trim()) {
            throw new Error(`Quiz option at index ${optIdx} for quiz ${idx} is empty or not a string`);
          }
        });

        // Compute / map correctAnswerIndex and correctAnswer string
        let finalIndex = -1;
        if (typeof quiz.correctAnswerIndex === "number") {
          finalIndex = quiz.correctAnswerIndex;
        } else if (typeof quiz.correctAnswer === "string") {
          finalIndex = quiz.options.findIndex((opt: string) => opt.toLowerCase() === quiz.correctAnswer.toLowerCase());
        }

        if (finalIndex < 0 || finalIndex >= quiz.options.length) {
          // Fallback to 0 if not matching
          finalIndex = 0;
        }
        quiz.correctAnswerIndex = finalIndex;
        quiz.correctAnswer = quiz.options[finalIndex];
      } else {
        // Identification / Fill-blank / matching
        quiz.options = quiz.options || [];
        quiz.correctAnswerIndex = -1;
        if (typeof quiz.correctAnswer !== "string" || !quiz.correctAnswer.trim()) {
          throw new Error(`Quiz at index ${idx} must have a correctAnswer string for type ${type}`);
        }
      }

      if (!quiz.explanation || typeof quiz.explanation !== "string" || !quiz.explanation.trim()) {
        throw new Error(`Quiz at index ${idx} has a missing or empty 'explanation'`);
      }
    });

    return data as StudyKitResponse;
  }
}