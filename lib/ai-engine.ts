import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import OpenAI from "openai";
import { supabaseServer } from "@/utils/supabase/server-backend";
import type { Json } from "@/types/database";

export const AI_PROMPT_VERSION = "study-kit-v4";
export const AI_SCHEMA_VERSION = "study-kit-schema-v3";

const MODELS = {
  gemini: "gemini-3.7-flash",
  groq: "openai/gpt-oss-20b",
  openai: "gpt-6-luna",
} as const;

type ProviderName = keyof typeof MODELS;
type Stage = "overview" | "assessments" | "chat";
type Plan = "free" | "pro";

export type Flashcard = { front: string; back: string };
export type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "moderate" | "hard";
  topic: string;
  cognitiveLevel: "recall" | "understanding" | "application" | "analysis";
};
export type AssessmentBatch = { flashcards: Flashcard[]; quizzes: QuizQuestion[] };
export type Overview = { title: string; summary: string };

type EngineContext = {
  userId: string;
  materialId: string;
  attemptId: string;
  planType: Plan;
  stage: Stage;
  correlationId?: string;
};

type GenerateRequest<T> = EngineContext & {
  prompt: string;
  schemaName: string;
  schema: Record<string, unknown>;
  validate: (value: unknown) => { value: T; quality: Record<string, Json> };
};

type ProviderResult = {
  text: string;
  inputTokens: number | null;
  outputTokens: number | null;
};

const overviewSchema = {
  type: "object",
  properties: {
    title: { type: "string", minLength: 4, maxLength: 100 },
    summary: { type: "string", minLength: 80 },
  },
  required: ["title", "summary"],
  additionalProperties: false,
};

const assessmentSchema = {
  type: "object",
  properties: {
    flashcards: {
      type: "array",
      items: {
        type: "object",
        properties: { front: { type: "string" }, back: { type: "string" } },
        required: ["front", "back"],
        additionalProperties: false,
      },
    },
    quizzes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
          correctAnswer: { type: "string" },
          explanation: { type: "string" },
          difficulty: { type: "string", enum: ["easy", "moderate", "hard"] },
          topic: { type: "string" },
          cognitiveLevel: { type: "string", enum: ["recall", "understanding", "application", "analysis"] },
        },
        required: ["question", "options", "correctAnswer", "explanation", "difficulty", "topic", "cognitiveLevel"],
        additionalProperties: false,
      },
    },
  },
  required: ["flashcards", "quizzes"],
  additionalProperties: false,
};

const PLACEHOLDER_PATTERN = /placeholder|option [abcd]|description not generated|correct answer explanation/i;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function ensureUseful(value: string, label: string, minimum = 3): string {
  if (value.length < minimum || PLACEHOLDER_PATTERN.test(value)) {
    throw new Error(`QUALITY_INVALID_${label.toUpperCase()}`);
  }
  return value;
}

export function validateOverview(value: unknown): { value: Overview; quality: Record<string, Json> } {
  if (!value || typeof value !== "object") throw new Error("SCHEMA_INVALID_OVERVIEW");
  const data = value as Record<string, unknown>;
  const title = ensureUseful(clean(data.title), "title", 4);
  const summary = ensureUseful(clean(data.summary), "summary", 80);
  return { value: { title, summary }, quality: { valid: true, summaryCharacters: summary.length } };
}

export function validateAssessmentBatch(value: unknown): { value: AssessmentBatch; quality: Record<string, Json> } {
  if (!value || typeof value !== "object") throw new Error("SCHEMA_INVALID_ASSESSMENTS");
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.flashcards) || !Array.isArray(data.quizzes)) {
    throw new Error("SCHEMA_INVALID_ASSESSMENTS");
  }

  const seenCards = new Set<string>();
  const flashcards = data.flashcards.map((raw, index) => {
    if (!raw || typeof raw !== "object") throw new Error(`SCHEMA_INVALID_FLASHCARD_${index}`);
    const card = raw as Record<string, unknown>;
    const front = ensureUseful(clean(card.front), `flashcard_front_${index}`);
    const back = ensureUseful(clean(card.back), `flashcard_back_${index}`);
    const key = front.toLowerCase();
    if (seenCards.has(key)) throw new Error(`QUALITY_DUPLICATE_FLASHCARD_${index}`);
    seenCards.add(key);
    return { front, back };
  });

  const seenQuestions = new Set<string>();
  const quizzes = data.quizzes.map((raw, index) => {
    if (!raw || typeof raw !== "object") throw new Error(`SCHEMA_INVALID_QUIZ_${index}`);
    const quiz = raw as Record<string, unknown>;
    const question = ensureUseful(clean(quiz.question), `quiz_question_${index}`, 8);
    const key = question.toLowerCase();
    if (seenQuestions.has(key)) throw new Error(`QUALITY_DUPLICATE_QUIZ_${index}`);
    seenQuestions.add(key);
    if (!Array.isArray(quiz.options) || quiz.options.length !== 4) {
      throw new Error(`QUALITY_INVALID_OPTIONS_${index}`);
    }
    const options = quiz.options.map((option, optionIndex) =>
      ensureUseful(clean(option), `quiz_${index}_option_${optionIndex}`),
    );
    if (new Set(options.map((option) => option.toLowerCase())).size !== 4) {
      throw new Error(`QUALITY_DUPLICATE_OPTIONS_${index}`);
    }
    const correctAnswer = ensureUseful(clean(quiz.correctAnswer), `quiz_answer_${index}`);
    if (!options.includes(correctAnswer)) throw new Error(`QUALITY_ANSWER_NOT_IN_OPTIONS_${index}`);
    const explanation = ensureUseful(clean(quiz.explanation), `quiz_explanation_${index}`, 8);
    const difficulty = clean(quiz.difficulty);
    const topic = ensureUseful(clean(quiz.topic), `quiz_topic_${index}`, 3);
    const cognitiveLevel = clean(quiz.cognitiveLevel);
    if (!["easy", "moderate", "hard"].includes(difficulty)) throw new Error(`QUALITY_INVALID_DIFFICULTY_${index}`);
    if (!["recall", "understanding", "application", "analysis"].includes(cognitiveLevel)) throw new Error(`QUALITY_INVALID_COGNITIVE_LEVEL_${index}`);
    return {
      question,
      options,
      correctAnswer,
      explanation,
      difficulty: difficulty as QuizQuestion["difficulty"],
      topic,
      cognitiveLevel: cognitiveLevel as QuizQuestion["cognitiveLevel"],
    };
  });

  if (flashcards.length === 0 || quizzes.length === 0) throw new Error("QUALITY_EMPTY_ASSESSMENTS");
  return {
    value: { flashcards, quizzes },
    quality: { valid: true, flashcardCount: flashcards.length, quizCount: quizzes.length },
  };
}

function providerPolicy(planType: Plan): ProviderName[] {
  if (process.env.AI_ENGINE_ENABLED === "false") return [];
  const freePolicy: ProviderName[] = ["gemini", "groq"];
  if (planType === "pro" && process.env.AI_ALLOW_PAID_FALLBACK === "true") freePolicy.push("openai");
  return freePolicy;
}

function isConfigured(provider: ProviderName): boolean {
  if (process.env[`AI_DISABLE_${provider.toUpperCase()}`] === "true") return false;
  if (provider === "gemini") return Boolean(process.env.GEMINI_API_KEY?.trim());
  if (provider === "groq") return Boolean(process.env.GROQ_API_KEY?.trim());
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function errorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/429|rate.?limit|quota/i.test(message)) return "PROVIDER_RATE_LIMIT";
  if (/timeout|timed out/i.test(message)) return "PROVIDER_TIMEOUT";
  if (/schema|json|quality/i.test(message)) return "OUTPUT_VALIDATION_FAILED";
  return "PROVIDER_REQUEST_FAILED";
}

function withTimeout<T>(operation: Promise<T>, timeoutMs = 35_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("PROVIDER_TIMEOUT")), timeoutMs);
    operation.then((result) => { clearTimeout(timer); resolve(result); })
      .catch((error) => { clearTimeout(timer); reject(error); });
  });
}

async function callProvider(
  provider: ProviderName,
  prompt: string,
  schemaName: string,
  schema: Record<string, unknown>,
): Promise<ProviderResult> {
  if (provider === "gemini") {
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const response = await withTimeout(client.models.generateContent({
      model: MODELS.gemini,
      contents: prompt,
      config: { responseMimeType: "application/json", responseJsonSchema: schema, temperature: 0.15 },
    }));
    if (!response.text) throw new Error("EMPTY_PROVIDER_RESPONSE");
    return {
      text: response.text,
      inputTokens: response.usageMetadata?.promptTokenCount ?? null,
      outputTokens: response.usageMetadata?.candidatesTokenCount ?? null,
    };
  }

  if (provider === "groq") {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const response = await withTimeout(client.chat.completions.create({
      model: MODELS.groq,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.15,
      response_format: { type: "json_schema", json_schema: { name: schemaName, strict: true, schema } },
    }));
    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error("EMPTY_PROVIDER_RESPONSE");
    return {
      text,
      inputTokens: response.usage?.prompt_tokens ?? null,
      outputTokens: response.usage?.completion_tokens ?? null,
    };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await withTimeout(client.responses.create({
    model: MODELS.openai,
    input: prompt,
    text: { format: { type: "json_schema", name: schemaName, strict: true, schema } },
  }));
  if (!response.output_text) throw new Error("EMPTY_PROVIDER_RESPONSE");
  return {
    text: response.output_text,
    inputTokens: response.usage?.input_tokens ?? null,
    outputTokens: response.usage?.output_tokens ?? null,
  };
}

function estimatedCost(provider: ProviderName, inputTokens: number | null, outputTokens: number | null): number | null {
  if (provider === "gemini") return 0;
  if (provider === "openai" || inputTokens === null || outputTokens === null) return null;
  return (inputTokens * 0.075 + outputTokens * 0.30) / 1_000_000;
}

export async function generateStructured<T>(request: GenerateRequest<T>): Promise<T> {
  const providers = providerPolicy(request.planType).filter(isConfigured);
  if (providers.length === 0) throw new Error("NO_AI_PROVIDER_CONFIGURED");

  let lastError: unknown;
  for (let index = 0; index < providers.length; index += 1) {
    const provider = providers[index];
    const startedAt = performance.now();
    try {
      const result = await callProvider(provider, request.prompt, request.schemaName, request.schema);
      const parsed = JSON.parse(result.text) as unknown;
      const validated = request.validate(parsed);
      const durationMs = Math.round(performance.now() - startedAt);
      await supabaseServer.from("ai_generation_runs").insert({
        correlation_id: request.correlationId ?? null,
        user_id: request.userId,
        material_id: request.materialId,
        attempt_id: request.attemptId,
        stage: request.stage,
        prompt_version: AI_PROMPT_VERSION,
        schema_version: AI_SCHEMA_VERSION,
        provider,
        model: MODELS[provider],
        provider_attempt: index + 1,
        status: "SUCCEEDED",
        input_characters: request.prompt.length,
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
        duration_ms: durationMs,
        estimated_cost_usd: estimatedCost(provider, result.inputTokens, result.outputTokens),
        quality: validated.quality,
      });
      return validated.value;
    } catch (error) {
      lastError = error;
      const durationMs = Math.round(performance.now() - startedAt);
      await supabaseServer.from("ai_generation_runs").insert({
        correlation_id: request.correlationId ?? null,
        user_id: request.userId,
        material_id: request.materialId,
        attempt_id: request.attemptId,
        stage: request.stage,
        prompt_version: AI_PROMPT_VERSION,
        schema_version: AI_SCHEMA_VERSION,
        provider,
        model: MODELS[provider],
        provider_attempt: index + 1,
        status: "FAILED",
        input_characters: request.prompt.length,
        duration_ms: durationMs,
        error_code: errorCode(error),
        error_message: (error instanceof Error ? error.message : String(error)).slice(0, 1000),
      });
    }
  }
  throw lastError instanceof Error ? lastError : new Error("ALL_CONFIGURED_PROVIDERS_FAILED");
}

export async function generateOverview(context: Omit<EngineContext, "stage">, source: string): Promise<Overview> {
  return generateStructured({
    ...context,
    stage: "overview",
    schemaName: "omnave_overview",
    schema: overviewSchema,
    validate: validateOverview,
    prompt: `Create a rigorous, student-friendly study overview from SOURCE only. Do not add outside facts. Return a concise 4-6 word title and a structured Markdown summary. Cover the central ideas, important definitions, relationships, processes, examples present in the source, and common distinctions. Use clear headings and concise explanations. Preserve qualifications and avoid oversimplifying claims.\n\nSOURCE:\n${source}`,
  });
}

export async function generateAssessments(
  context: Omit<EngineContext, "stage">,
  source: string,
  flashcardCount: number,
  quizCount: number,
): Promise<AssessmentBatch> {
  return generateStructured({
    ...context,
    stage: "assessments",
    schemaName: "omnave_assessments",
    schema: assessmentSchema,
    validate: validateAssessmentBatch,
    prompt: `Create exactly ${flashcardCount} flashcards and ${quizCount} multiple-choice questions using SOURCE only.

Quality rules:
- Cover different important concepts instead of repeating the same fact.
- Flashcard fronts must be specific prompts; backs must be concise but explanatory.
- Every quiz has exactly four distinct options and correctAnswer exactly matches one option.
- Distractors must be plausible within the same topic and must not use obvious filler, joke answers, or "all/none of the above".
- Explanations must state why the correct answer is supported by the source and, when helpful, why a tempting distractor is wrong.
- Use an intentional difficulty mix: about 25% easy recall, 50% moderate understanding/application, and 25% hard application/analysis.
- Hard questions must require connecting ideas, applying a rule to a source-grounded situation, ordering a process, or distinguishing closely related concepts. They must not become hard through vague wording or trivia.
- Label each question with difficulty, its concise topic, and cognitiveLevel.
- Avoid duplicate concepts, ambiguous questions, answer-length clues, and fabricated facts.

SOURCE:
${source}`,
  });
}
