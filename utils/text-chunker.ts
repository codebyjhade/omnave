/**
 * Splits massive text strings into an array of smaller chunks based on a word limit
 * (default: 3000 words, roughly 10-12 pages of text per chunk) cleanly at sentence boundaries.
 */
export function chunkText(text: string, maxWords: number = 3000): string[] {
  if (!text || !text.trim()) return [];

  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return [text.trim()];
  }

  // Split into sentence blocks using regex matching sentence terminators (. ! ?)
  const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [text];
  const chunks: string[] = [];
  let currentChunkSentences: string[] = [];
  let currentWordCount = 0;

  for (const sentence of sentences) {
    const sentenceWordCount = sentence.trim().split(/\s+/).filter(Boolean).length;

    if (currentWordCount + sentenceWordCount > maxWords && currentChunkSentences.length > 0) {
      chunks.push(currentChunkSentences.join("").trim());
      currentChunkSentences = [sentence];
      currentWordCount = sentenceWordCount;
    } else {
      currentChunkSentences.push(sentence);
      currentWordCount += sentenceWordCount;
    }
  }

  if (currentChunkSentences.length > 0) {
    chunks.push(currentChunkSentences.join("").trim());
  }

  return chunks;
}
