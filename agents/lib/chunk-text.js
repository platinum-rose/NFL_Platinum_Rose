// agents/lib/chunk-text.js
// Shared transcript-chunking helper. Extracted out of agents/podcast-reextract.js
// (which had this as an unexported local function) so agents/podcast-host-summary.js
// can reuse the exact same chunking behavior rather than duplicating it, and so
// it's independently unit-testable.

/**
 * Split text into overlapping chunks. Overlap exists so a pick/insight/quote
 * straddling a chunk boundary is still seen whole by at least one chunk.
 *
 * @param {string} text
 * @param {number} [chunkChars=12000]
 * @param {number} [overlapChars=1000]
 * @returns {string[]}
 */
export function chunkTranscript(text, chunkChars = 12_000, overlapChars = 1_000) {
  if (!text) return [];
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkChars, text.length);
    chunks.push(text.slice(start, end));
    if (end >= text.length) break;
    start = end - overlapChars;
  }
  return chunks;
}
