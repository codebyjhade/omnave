export class RetryService {
  static withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("AI provider timed out")), timeoutMs);
      operation.then((value) => {
        clearTimeout(timer);
        resolve(value);
      }).catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  static isTransient(error: unknown): boolean {
    const value = typeof error === 'object' && error !== null ? error as Record<string, unknown> : {};
    const errMsg = (error instanceof Error ? error.message : String(value.message ?? '')).toLowerCase();
    if (value.name === 'AbortError' || errMsg.includes("abort") || errMsg.includes("cancel")) {
      return false;
    }
    const response = typeof value.response === 'object' && value.response !== null
      ? value.response as Record<string, unknown>
      : {};
    const status = value.status || value.statusCode || response.status;
    if (status === 429 || status === 503 || status === 504) {
      return true;
    }
    if (
      errMsg.includes("rate limit") ||
      errMsg.includes("quota exceeded") ||
      errMsg.includes("overloaded") ||
      errMsg.includes("503") ||
      errMsg.includes("timeout") ||
      errMsg.includes("econnrefused") ||
      errMsg.includes("socket")
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
      } catch (err: unknown) {
        if (attempts >= maxRetries || !this.isTransient(err)) {
          throw err;
        }
        const delay = initialDelayMs * Math.pow(backoffFactor, attempts - 1);
        console.warn(
          `[RetryService] [${reqId}] Attempt ${attempts} failed with transient error: ${err instanceof Error ? err.message : String(err)}. Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
}
