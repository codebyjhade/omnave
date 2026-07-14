export interface NormalizedError {
  success: false;
  code: string;
  stage: "auth" | "validation" | "supabase" | "gemini" | "internal";
  message: string;
  requestId: string;
  debug?: {
    apiKeyExists: boolean;
    apiKeyLength: number;
    apiKeyMasked: string;
    stage: string;
  };
}

export function handleAIError(
  error: any,
  reqId: string,
  stage: NormalizedError["stage"]
): NormalizedError {
  const message = error?.message || "An unexpected error occurred.";
  let code = "INTERNAL_SERVER_ERROR";
  let userFriendlyMsg = message || "An unexpected server error occurred.";

  if (stage === "auth") {
    code = "UNAUTHORIZED";
    userFriendlyMsg = message || "Please sign in again.";
  } else if (stage === "validation") {
    code = "BAD_REQUEST";
    userFriendlyMsg = message || "Invalid request payload.";
  } else if (stage === "supabase") {
    code = "DATABASE_ERROR";
    userFriendlyMsg = message || "Database operation failed.";
  } else if (stage === "gemini") {
    code = "AI_GENERATION_FAILED";
    const lowerMessage = message.toLowerCase();
    if (
      lowerMessage.includes("api_key") ||
      lowerMessage.includes("api key") ||
      lowerMessage.includes("401") ||
      lowerMessage.includes("403")
    ) {
      code = "AI_AUTH_FAILED";
      userFriendlyMsg = "AI service authentication failed. The API key may be invalid.";
    } else if (lowerMessage.includes("safety") || lowerMessage.includes("blocked")) {
      code = "AI_SAFETY_BLOCKED";
      userFriendlyMsg = "Content block triggered by safety guidelines. Try another question or document.";
    } else if (
      lowerMessage.includes("quota") ||
      lowerMessage.includes("limit") ||
      lowerMessage.includes("429") ||
      lowerMessage.includes("exhausted")
    ) {
      code = "AI_QUOTA_EXCEEDED";
      userFriendlyMsg = "AI API quota exceeded or rate limit hit. Please retry in a few seconds.";
    } else if (
      lowerMessage.includes("not found") ||
      lowerMessage.includes("404")
    ) {
      code = "AI_MODEL_NOT_FOUND";
      userFriendlyMsg = "The configured Gemini model was not found.";
    } else {
      userFriendlyMsg = message || "AI generation failed. Please try again.";
    }
  }

  // Construct masked API key info for diagnostics
  const rawKey = process.env.GEMINI_API_KEY || "";
  const keyLength = rawKey.length;
  const maskedKey = keyLength > 10 
    ? `${rawKey.slice(0, 5)}...${rawKey.slice(-5)}`
    : "invalid-length";

  return {
    success: false,
    code,
    stage,
    message: userFriendlyMsg,
    requestId: reqId,
    debug: {
      apiKeyExists: !!rawKey,
      apiKeyLength: keyLength,
      apiKeyMasked: maskedKey,
      stage,
    }
  };
}