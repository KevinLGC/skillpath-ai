export interface TextChunk {
  chunkIndex: number;
  content: string;
  /** Approximate token count (chars/4) used for budgeting, never for billing. */
  tokenCount: number;
}

export interface ChunkOptions {
  /** Target chunk size in characters (~800 tokens at 4 chars/token). */
  maxChars?: number;
  /** Overlap carried into the next chunk so a fact split across the boundary stays retrievable. */
  overlapChars?: number;
}

export const DEFAULT_CHUNK_OPTIONS: Required<ChunkOptions> = {
  maxChars: 3200,
  overlapChars: 400,
};

/**
 * Chunking is deterministic: the same document always produces the same
 * chunks, which matters because chunk ids are referenced by stored answers and
 * re-ingestion must not invalidate citations.
 */
export function chunkText(text: string, options: ChunkOptions = {}): TextChunk[] {
  const { maxChars, overlapChars } = { ...DEFAULT_CHUNK_OPTIONS, ...options };
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length === 0) return [];
  if (clean.length <= maxChars) {
    return [{ chunkIndex: 0, content: clean, tokenCount: approxTokens(clean) }];
  }

  const sentences = splitSentences(clean);
  const chunks: TextChunk[] = [];
  let current: string[] = [];
  let currentLength = 0;

  const flush = () => {
    if (current.length === 0) return;
    const content = current.join(" ").trim();
    chunks.push({ chunkIndex: chunks.length, content, tokenCount: approxTokens(content) });
  };

  for (const sentence of sentences) {
    if (currentLength + sentence.length + 1 > maxChars && current.length > 0) {
      flush();
      // Carry the tail of the previous chunk forward as overlap.
      const tail: string[] = [];
      let tailLength = 0;
      for (let i = current.length - 1; i >= 0 && tailLength < overlapChars; i -= 1) {
        const piece = current[i];
        if (piece === undefined) break;
        tail.unshift(piece);
        tailLength += piece.length + 1;
      }
      current = tail;
      currentLength = tailLength;
    }
    current.push(sentence);
    currentLength += sentence.length + 1;
  }
  flush();

  return chunks;
}

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

export function approxTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
