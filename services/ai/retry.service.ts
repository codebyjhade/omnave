export class RetryService {
  static isTransient(error: any): boolean {
    const status = error.status || error.statusCode || error.response?.status;
    if (status === 429 || status === 503 || status === 504) {
      return true;
    }
    const errMsg = (error.message || "").toLowerCase();
    if (
      errMsg.includes("rate limit") ||
      errMsg.includes("quota exceeded") ||
      errMsg.includes("overloaded") ||
      errMsg.includes("503") ||
      errMsg.includes("timeout") ||
      errMsg.includes("econnrefused") ||
      errMsg.includes("socket") ||
      errMsg.includes("aborted")
    ) {
      return true;
    }
    return false;
  }

  static async runWithRetry<T>(
    fn: () => Promise<T>,
    reqId: string,
    maxRetries = 3,
    initialDelayMs = 1000,
    backoffFactor = 2
  ): Promise<T> {
    let attempts = 0;
    while (true) {
      try {
        attempts++;
        return await fn();
      } catch (err: any) {
        if (attempts >= maxRetries || !this.isTransient(err)) {
          throw err;
        }
        const delay = initialDelayMs * Math.pow(backoffFactor, attempts - 1);
        console.warn(
          `[RetryService] [${reqId}] Attempt ${attempts} failed with transient error: ${err.message}. Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
}