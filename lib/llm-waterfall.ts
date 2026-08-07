import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import OpenAI from "openai";

export interface WaterfallFlashcard {
  front: string;
  back: string;
}

export interface WaterfallQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

/**
 * Timeout wrapper utility that cleanly rejects if execution takes longer than specified ms.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number = 45000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Execution timed out after ${ms}ms`));
    }, ms);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Helper to parse and standardize JSON response from various models
function parseAndStandardizeJson(text: string, isFlashcard: boolean): WaterfallFlashcard[] | WaterfallQuizQuestion[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Try to find a JSON block in the markdown (e.g. ```json ... ```)
    const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/i;
    const match = text.match(jsonBlockRegex);
    if (match && match[1]) {
      try {
        parsed = JSON.parse(match[1].trim());
      } catch {
        throw new Error("Failed to parse JSON content from markdown block.");
      }
    } else {
      // Try to find first [ and last ] or first { and last }
      const firstBracket = text.indexOf("[");
      const lastBracket = text.lastIndexOf("]");
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        try {
          parsed = JSON.parse(text.slice(firstBracket, lastBracket + 1));
        } catch {
          throw new Error("Could not parse JSON array from text bounds.");
        }
      } else {
        throw new Error("No valid JSON structure found in AI response.");
      }
    }
  }

  let arrayData: unknown[] = [];
  if (Array.isArray(parsed)) {
    arrayData = parsed;
  } else if (parsed && typeof parsed === "object") {
    // If it's wrapped in an object (e.g., {"data": [...]}), look for an array key
    const obj = parsed as Record<string, unknown>;
    const possibleKeys = ["data", "flashcards", "quizzes", "questions", "items"];
    for (const key of possibleKeys) {
      if (Array.isArray(obj[key])) {
        arrayData = obj[key] as unknown[];
        break;
      }
    }
    // If still empty, check any key containing an array
    if (arrayData.length === 0) {
      for (const key of Object.keys(obj)) {
        if (Array.isArray(obj[key])) {
          arrayData = obj[key] as unknown[];
          break;
        }
      }
    }
  }

  if (arrayData.length === 0) {
    throw new Error("Parsed JSON structure contains no arrays.");
  }

  if (isFlashcard) {
    return arrayData.map((item, idx) => {
      const fallbackItem = item as Record<string, unknown> | null;
      const front = fallbackItem?.front || fallbackItem?.question || fallbackItem?.term || `Concept ${idx + 1}`;
      const back = fallbackItem?.back || fallbackItem?.answer || fallbackItem?.definition || "Description not generated.";
      return {
        front: String(front),
        back: String(back)
      } as WaterfallFlashcard;
    });
  } else {
    return arrayData.map((item, idx) => {
      const fallbackItem = item as Record<string, unknown> | null;
      const question = fallbackItem?.question || `Question ${idx + 1}`;
      
      let options: string[] = [];
      if (Array.isArray(fallbackItem?.options)) {
        options = (fallbackItem.options as unknown[]).map(String);
      } else if (Array.isArray(fallbackItem?.choices)) {
        options = (fallbackItem.choices as unknown[]).map(String);
      } else {
        options = ["Option A", "Option B", "Option C", "Option D"];
      }

      while (options.length < 4) {
        options.push(`Placeholder Option ${options.length + 1}`);
      }
      if (options.length > 4) {
        options = options.slice(0, 4);
      }

      const correctAnswerVal = fallbackItem?.correctAnswer || fallbackItem?.correct_answer || fallbackItem?.answer || "";
      let correctAnswer = "";
      if (typeof correctAnswerVal === "number") {
        correctAnswer = options[correctAnswerVal] || options[0];
      } else {
        correctAnswer = String(correctAnswerVal || "");
      }

      if (!options.includes(correctAnswer)) {
        options[0] = correctAnswer;
      }

      const explanation = fallbackItem?.explanation || fallbackItem?.reason || "Correct answer explanation.";

      return {
        question: String(question),
        options,
        correctAnswer,
        explanation: String(explanation)
      } as WaterfallQuizQuestion;
    });
  }
}

interface TierConfig {
  name: string;
  key: string;
  execute: (prompt: string, systemInstruction: string, isJson: boolean) => Promise<string>;
}

const TIERS: TierConfig[] = [
  {
    name: "OpenAI GPT-4o",
    key: "OPENAI_API_KEY",
    execute: async (prompt, systemInstruction, isJson) => {
      const key = (process.env.OPENAI_API_KEY || "").trim();
      if (!key) throw new Error("OPENAI_API_KEY not configured.");

      const openai = new OpenAI({ apiKey: key });
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        response_format: isJson ? { type: "json_object" } : undefined,
      });

      const responseText = response.choices[0]?.message?.content;
      if (!responseText) throw new Error("OpenAI returned empty response.");
      return responseText;
    }
  },
  {
    name: "Anthropic Claude 3.5 Sonnet",
    key: "CLAUDEAI_API_KEY",
    execute: async (prompt, systemInstruction, isJson) => {
      const key = (
        process.env.CLAUDEAI_API_KEY ||
        process.env.CLAUDE_API_KEY ||
        process.env.ANTHROPIC_API_KEY ||
        ""
      ).trim();
      if (!key) throw new Error("Anthropic API key not configured.");

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: 4096,
          system: systemInstruction,
          messages: [
            { role: "user", content: prompt }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Anthropic API failed status ${response.status}: ${errText}`);
      }

      const data = (await response.json()) as { content?: Array<{ text?: string }> };
      const responseText = data.content?.[0]?.text;
      if (!responseText) throw new Error("Anthropic returned empty response.");
      return responseText;
    }
  },
  {
    name: "Google Gemini",
    key: "GEMINI_API_KEY",
    execute: async (prompt, systemInstruction, isJson) => {
      const key = (process.env.GEMINI_API_KEY || "").trim();
      if (!key) throw new Error("GEMINI_API_KEY not configured.");
      
      const gemini = new GoogleGenAI({ apiKey: key });
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: isJson ? "application/json" : "text/plain",
        }
      });
      const responseText = response.text;
      if (!responseText) throw new Error("Gemini returned empty response.");
      return responseText;
    }
  },
  {
    name: "Groq",
    key: "GROQ_API_KEY",
    execute: async (prompt, systemInstruction, isJson) => {
      const key = (process.env.GROQ_API_KEY || "").trim();
      if (!key) throw new Error("GROQ_API_KEY not configured.");

      const groq = new Groq({ apiKey: key });
      const response = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ],
        model: "llama3-8b-8192",
        temperature: 0.2,
        response_format: isJson ? { type: "json_object" } : undefined,
      });
      const responseText = response.choices[0]?.message?.content;
      if (!responseText) throw new Error("Groq returned empty response.");
      return responseText;
    }
  },
  {
    name: "Cerebras",
    key: "CEREBRAS_API_KEY",
    execute: async (prompt, systemInstruction, isJson) => {
      const key = (process.env.CEREBRAS_API_KEY || "").trim();
      if (!key) throw new Error("CEREBRAS_API_KEY not configured.");

      const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3.1-70b",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ],
          temperature: 0.2,
          response_format: isJson ? { type: "json_object" } : undefined
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Cerebras API failed status ${response.status}: ${errText}`);
      }
      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const responseText = data.choices?.[0]?.message?.content;
      if (!responseText) throw new Error("Cerebras returned empty response.");
      return responseText;
    }
  },
  {
    name: "Mistral",
    key: "MISTRAL_API_KEY",
    execute: async (prompt, systemInstruction, isJson) => {
      const key = (process.env.MISTRAL_API_KEY || "").trim();
      if (!key) throw new Error("MISTRAL_API_KEY not configured.");

      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "mistral-small-latest",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ],
          temperature: 0.2,
          response_format: isJson ? { type: "json_object" } : undefined
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Mistral API failed status ${response.status}: ${errText}`);
      }
      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const responseText = data.choices?.[0]?.message?.content;
      if (!responseText) throw new Error("Mistral returned empty response.");
      return responseText;
    }
  },
  {
    name: "OpenRouter",
    key: "OPENROUTER_API_KEY",
    execute: async (prompt, systemInstruction, isJson) => {
      const key = (process.env.OPENROUTER_API_KEY || "").trim();
      if (!key) throw new Error("OPENROUTER_API_KEY not configured.");

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://omnave.com",
          "X-Title": "Omnave"
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3-8b-instruct:free",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ],
          temperature: 0.2,
          response_format: isJson ? { type: "json_object" } : undefined
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter API failed status ${response.status}: ${errText}`);
      }
      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const responseText = data.choices?.[0]?.message?.content;
      if (!responseText) throw new Error("OpenRouter returned empty response.");
      return responseText;
    }
  },
  {
    name: "Pollinations AI",
    key: "POLLINATIONS_API_KEY",
    execute: async (prompt, systemInstruction, isJson) => {
      const key = (process.env.POLLINATIONS_API_KEY || "").trim();
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (key) {
        headers["Authorization"] = `Bearer ${key}`;
      }

      const response = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "openai",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ],
          temperature: 0.2,
          response_format: isJson ? { type: "json_object" } : undefined
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Pollinations AI API failed status ${response.status}: ${errText}`);
      }
      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const responseText = data.choices?.[0]?.message?.content;
      if (!responseText) throw new Error("Pollinations AI returned empty response.");
      return responseText;
    }
  }
];

export async function generateWithWaterfall(
  prompt: string,
  systemInstruction?: string,
  isJson: boolean = false
): Promise<WaterfallFlashcard[] | WaterfallQuizQuestion[] | string> {
  const instruction = systemInstruction || "You are a helpful study tutor.";
  
  let lastError: Error | null = null;

  for (let i = 0; i < TIERS.length; i++) {
    const tier = TIERS[i];
    const keyVal = process.env[tier.key];
    
    if (!keyVal && tier.name !== "Pollinations AI") {
      console.warn(`[Waterfall] Skipping Tier ${i + 1} (${tier.name}) - API key missing.`);
      continue;
    }

    try {
      console.log(`[Waterfall] Attempting Tier ${i + 1} (${tier.name})...`);
      
      // Wrap execution in strict 45-second timeout
      const rawOutput = await withTimeout(
        tier.execute(prompt, instruction, isJson),
        45000
      );
      
      if (isJson) {
        const isFlashcard = instruction.toLowerCase().includes("flashcard");
        return parseAndStandardizeJson(rawOutput, isFlashcard);
      }
      
      return rawOutput;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[Waterfall] Tier ${i + 1} (${tier.name}) failed: ${errorMsg}`);
      lastError = err instanceof Error ? err : new Error(errorMsg);
    }
  }

  throw new Error(`All ${TIERS.length} Waterfall Tiers failed. Last error: ${lastError ? lastError.message : "unknown"}`);
}

/**
 * Fast-scan utility using Groq (Tier 3) directly for ultra-low latency multi-lesson / topic detection.
 */
export async function detectLessons(text: string): Promise<string[]> {
  const key = (process.env.GROQ_API_KEY || "").trim();
  if (!key) {
    return ["General Study Material"];
  }

  try {
    const groq = new Groq({ apiKey: key });
    const prompt = `Scan this text and return a JSON array of the distinct lesson or topic titles found. If it is all one topic, return an array with one title.\n\nText:\n${text.slice(0, 8000)}`;
    const systemInstruction = "You are an expert curriculum structure detector. Return ONLY a JSON object containing a 'lessons' array of string topic titles, e.g. {\"lessons\": [\"Topic 1\", \"Topic 2\"]}.";

    const response = await withTimeout(
      groq.chat.completions.create({
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ],
        model: "llama3-8b-8192",
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
      10000
    );

    const responseText = response.choices[0]?.message?.content;
    if (!responseText) return ["General Study Material"];

    const parsed = JSON.parse(responseText);
    let lessons: string[] = [];
    if (Array.isArray(parsed)) {
      lessons = parsed.map(String);
    } else if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      if (Array.isArray(obj.lessons)) {
        lessons = obj.lessons.map(String);
      } else if (Array.isArray(obj.topics)) {
        lessons = obj.topics.map(String);
      }
    }

    return lessons.length > 0 ? lessons : ["General Study Material"];
  } catch (err) {
    console.warn("[detectLessons] Groq detection fallback:", err);
    return ["General Study Material"];
  }
}
