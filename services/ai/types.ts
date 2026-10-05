export interface GenerateChatParams {
  message: string;
  summary: string;
  userId?: string;
  planType?: "free" | "pro";
  history?: { role: "user" | "assistant"; content: string }[];
}

export interface AIServiceProvider {
  askQuestion(params: GenerateChatParams, reqId: string): Promise<string>;
}
