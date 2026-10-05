export const AI_CONFIG = {
  chat: {
    model: "gemini-3.7-flash",
    promptVersion: "tutor-chat-v2",
    temperature: 0.35,
    maxOutputTokens: 1200,
    requestTimeoutMs: 15_000,
  },
  retry: { maxAttempts: 1, initialDelayMs: 750, backoffFactor: 2 },
} as const;
