export interface GenerateChatParams {
  message: string;
  summary: string;
}

export interface GenerateNotesParams {
  pdfBase64: string;
}

export interface StudyKitResponse {
  ai_title?: string;
  summary: string;
  flashcards: Array<{ front: string; back: string }>;
  quizzes: Array<{
    type?: string;
    question: string;
    options: string[];
    correctAnswerIndex: number;
    correctAnswer: string;
    explanation: string;
  }>;
}

export interface AIServiceProvider {
  askQuestion(params: GenerateChatParams, reqId: string): Promise<string>;
  generateStudyKit(params: GenerateNotesParams, reqId: string): Promise<StudyKitResponse>;
}

export interface GenerateChatParams {
  message: string;
  summary: string;
  // Add this line so TypeScript knows we are passing memory!
  history?: { role: "user" | "assistant"; content: string }[];
}