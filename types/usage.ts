export interface UsageBucket {
  limit: number;
  consumed: number;
  reserved: number;
  remaining: number;
  resetsAt: string;
}

export interface UsageSummary {
  planType: 'free' | 'pro';
  timezone: string;
  maxFileBytes: number;
  maxPagesPerDocument: number;
  generation: UsageBucket;
  pages: UsageBucket;
  chatMessages: UsageBucket;
}
