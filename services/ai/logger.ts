export class AILogger {
  static log(stage: string, reqId: string, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const sanitizedMeta = this.sanitize(meta);
    console.log(
      JSON.stringify({
        timestamp,
        requestId: reqId,
        stage,
        message,
        ...(sanitizedMeta ? { metadata: sanitizedMeta } : {}),
      })
    );
  }

  private static sanitize(obj: any): any {
    if (!obj) return obj;
    try {
      const json = JSON.stringify(obj);
      // Redact Bearer JWT tokens, cookies, secrets
      const sanitized = json
        .replace(
          /(Bearer\s+)[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g,
          "$1[REDACTED]"
        )
        .replace(
          /("key"|"apiKey"|"api_key"|"password"|"token"|"jwt"|"cookie"|"authorization")\s*:\s*"[^"]*"/gi,
          `$1:"[REDACTED]"`
        );
      return JSON.parse(sanitized);
    } catch {
      return "[REDACTION_FAILED]";
    }
  }
}

export class AITimer {
  private timings: Record<string, number> = {};

  start(label: string) {
    this.timings[label] = performance.now();
  }

  stop(label: string): number {
    const start = this.timings[label];
    if (start === undefined) return 0;
    const duration = performance.now() - start;
    return Math.round(duration); // duration in milliseconds
  }
}