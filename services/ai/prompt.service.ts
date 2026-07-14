import { AI_CONFIG } from "./config";

export class PromptService {
 static getChatPrompt(message: string, summary: string, history: { role: string; content: string }[] = []): string {
    // Format the memory so it reads like a chat log
    const formattedHistory = history.length > 0 
      ? history.map(h => `${h.role === 'assistant' ? 'You' : 'Student'}: ${h.content}`).join("\n") + "\n\n"
      : "[No previous conversation yet]\n\n";

    return `
      CONTEXT: You are a friendly, highly intelligent human tutor chatting with a student.
      STUDY MATERIAL SUMMARY: "${summary}"
      
      CONVERSATION SO FAR:
      ${formattedHistory}
      
      STUDENT JUST SAID: "${message}"
      
      YOUR INSTRUCTIONS:
      1. Act like a real human texting or chatting. Be warm, natural, and conversational.
      2. NEVER use rigid templates, bullet points, bold text, or phrases like "Here is some tailored detail". 
      3. Talk directly to the student. Start your answers naturally (e.g., "Sure! Think of it like...", or "A great example of this would be...").
      4. If the student says "Give an example" or "Explain like I'm 12", look at the CONVERSATION SO FAR, figure out what topic you were just talking about, and give a natural, easy-to-understand response based on that exact topic.
      5. Keep it brief (2-3 short sentences).
    `;
  }

  // Notice the two new parameters that map to our gemini.service.ts parallel threads!
  static getStudyKitPrompt(isSupplemental: boolean = false): string {
    
    // THE SUPPLEMENTAL BATCH PROMPT (Returns ONLY an array of 20 Quizzes inside a JSON object)
    if (isSupplemental) {
      return `
        You are an expert university professor. Read the attached document and generate a supplemental batch of quiz questions to expand the MASTER QUESTION BANK.
        
        Return ONLY a valid JSON object containing exactly 20 questions in a "quizzes" array:
        {
          "quizzes": [
            {
              "type": "multiple-choice", // MUST BE "multiple-choice", "true-false", OR "identification"
              "question": "The question text here",
              "options": ["Option A", "Option B", "Option C", "Option D"], // Provide 4 options for multiple-choice, ["True", "False"] for true-false, or an empty array [] for identification.
              "correctAnswer": "The exact string of the correct answer from the options, or the exact term for identification.",
              "correctAnswerIndex": 0, // The 0-based index of the correct answer in the options array. For identification, use -1.
              "explanation": "A short explanation."
            }
          ]
        }

        STRICT REQUIREMENTS:
        1. Generate exactly 20 questions in the "quizzes" array.
        2. The questions MUST be a highly difficult, randomized mix of "multiple-choice", "true-false", and "identification" types.
        3. Keep the "explanation" extremely short (Maximum 10 words).
        4. CRITICAL JSON SAFETY: Do NOT use unescaped quotation marks inside your strings. Use single quotes (') instead.
      `;
    }

    // THE MAIN BATCH PROMPT (Returns Summary, 15 Flashcards, and 20 Baseline Quizzes)
    return `
      You are an expert university professor. Read the attached document and extract the core concepts. 
      
      CRITICAL INSTRUCTION: You must expand upon these concepts using your vast global knowledge of the subject matter to create a massive MASTER QUESTION BANK. Do not limit yourself strictly to the provided text; if the document is short, generate related questions that fall under the exact same academic topic.

      Return ONLY a valid JSON object matching this exact structure:
      {
        "summary": "A beautifully formatted summary in Markdown. Start with a '### 📌 TL;DR' section (2-3 sentences summarizing the absolute core message). Next, add a '### 💡 Key Takeaways' section with bullet points of important concepts using bold words for crucial terms. Finally, write a '### 📖 Detailed Analysis' section summarizing details in 2 paragraphs. The summary must be exhaustive but extremely easy to understand, using basic analogies.",
        "flashcards": [
          { "front": "Key Term or Concept", "back": "Detailed definition or explanation" }
        ],
        "quizzes": [
          {
            "type": "multiple-choice", // MUST BE "multiple-choice", "true-false", OR "identification"
            "question": "The question text here",
            "options": ["Option A", "Option B", "Option C", "Option D"], // Provide 4 options for multiple-choice, ["True", "False"] for true-false, or an empty array [] for identification.
            "correctAnswer": "The exact string of the correct answer from the options, or the exact term for identification.",
            "correctAnswerIndex": 0, // The 0-based index of the correct answer in the options array. For identification, use -1.
            "explanation": "A short explanation of why this answer is correct."
          }
        ]
      }
      
      STRICT REQUIREMENTS:
      1. Generate exactly 15 flashcards in the "flashcards" array. Keep definitions under 15 words.
      2. Generate exactly 20 questions in the "quizzes" array.
      3. The "explanation" for each question MUST BE EXTREMELY SHORT (Maximum 10 words).
      4. The questions MUST be a randomized mix of "multiple-choice", "true-false", and "identification" types.
      5. CRITICAL JSON SAFETY: Do NOT use unescaped quotation marks inside your strings. Use single quotes (') instead.
    `;
  }
}