import Groq from "groq-sdk";
import { flashcardArraySchema, quizArraySchema } from "./schema";

// Initialize the Groq SDK
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateWithGroq(
  text: string, 
  taskType: "summary" | "flashcards" | "quiz" | "title",
  planType: string = "free"
) {
  let systemInstruction = "";
  let requireJson = false;

  const isPro = planType === "pro" || planType === "paid";

  // Configure prompt and schema injection for JSON mode
  if (taskType === "summary") {
    systemInstruction = "You are an expert tutor. Summarize the provided text into a clear, comprehensive, and highly structured overview. Format the output as clean markdown.";
  } else if (taskType === "title") {
    systemInstruction = "You are an expert tutor. Generate a short, academic, human-readable title for the provided text. Limit it to 4-6 words. Do not use quotes, prefixes like 'Title:', or markdown formatting, just return the title.";
  } else if (taskType === "flashcards") {
    if (isPro) {
      systemInstruction = `You are an expert university professor. Act as a strict professor, analyze the core topics, and incorporate related external knowledge/research to make highly challenging, comprehensive flashcards covering concepts, vocabulary, and facts. Generate exactly 80 flashcards.
      You MUST output a valid JSON object containing a single key "data", which maps to an array of flashcards matching this exact schema: ${JSON.stringify(flashcardArraySchema)}`;
    } else {
      systemInstruction = `You are an expert tutor. Create highly effective flashcards covering the core concepts from the text. Generate exactly 25 flashcards.
      You MUST output a valid JSON object containing a single key "data", which maps to an array of flashcards matching this exact schema: ${JSON.stringify(flashcardArraySchema)}`;
    }
    requireJson = true;
  } else if (taskType === "quiz") {
    if (isPro) {
      systemInstruction = `You are an expert university professor. Act as a strict professor, analyze the core topics, and incorporate related external knowledge/research to make the questions highly challenging and unique.
      Generate exactly 80 questions (suitable for a mix of practice quizzes and comprehensive exams).
      You MUST output a valid JSON object containing a single key "data", which maps to an array of quiz questions matching this exact schema: ${JSON.stringify(quizArraySchema)}`;
    } else {
      systemInstruction = `You are an expert tutor. Generate a standard multiple-choice quiz based strictly on the provided text.
      The quiz must contain exactly 25 questions.
      You MUST output a valid JSON object containing a single key "data", which maps to an array of quiz questions matching this exact schema: ${JSON.stringify(quizArraySchema)}`;
    }
    requireJson = true;
  }

  // Execute the request to Groq's Llama 3.1 8B model for maximum speed
  const response = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: text }
    ],
    model: "llama-3.1-8b-instant",
    temperature: 0.2,
    response_format: requireJson ? { type: "json_object" } : undefined,
  });

  const responseText = response.choices[0]?.message?.content;
  if (!responseText) throw new Error("Groq returned an empty response.");

  // Parse JSON and extract the array from the 'data' key, or return raw markdown
  if (requireJson) {
    const parsed = JSON.parse(responseText);
    return parsed.data;
  }
  return responseText;
}
