export class ParserService {
  static cleanJsonMarkdown(text: string): string {
    let clean = text.trim();
    if (clean.startsWith("```")) {
      const firstLineEnd = clean.indexOf("\n");
      const lastLineStart = clean.lastIndexOf("```");
      if (firstLineEnd !== -1 && lastLineStart !== -1 && lastLineStart > firstLineEnd) {
        clean = clean.substring(firstLineEnd + 1, lastLineStart).trim();
      }
    }
    return clean;
  }

  static parseJson(text: string): any {
    const cleaned = this.cleanJsonMarkdown(text);
    try {
      return JSON.parse(cleaned);
    } catch (err: any) {
      throw new Error(`Failed to parse response as JSON: ${err.message}`);
    }
  }
}