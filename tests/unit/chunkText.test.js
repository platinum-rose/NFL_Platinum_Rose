import { describe, it, expect } from 'vitest';
import { chunkTranscript } from '../../agents/lib/chunk-text.js';

describe('chunkTranscript', () => {
  it('returns empty array for empty/falsy input', () => {
    expect(chunkTranscript('')).toEqual([]);
    expect(chunkTranscript(null)).toEqual([]);
    expect(chunkTranscript(undefined)).toEqual([]);
  });

  it('returns a single chunk when text is shorter than chunkChars', () => {
    const text = 'short transcript';
    expect(chunkTranscript(text, 12_000, 1_000)).toEqual([text]);
  });

  it('returns a single chunk when text exactly equals chunkChars', () => {
    const text = 'x'.repeat(100);
    const chunks = chunkTranscript(text, 100, 10);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });

  it('splits into multiple overlapping chunks for long text', () => {
    const text = 'x'.repeat(250);
    const chunks = chunkTranscript(text, 100, 10);
    // 0-100, 90-190, 180-250
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(100);
    expect(chunks[1]).toHaveLength(100);
    expect(chunks[2]).toHaveLength(70);
  });

  it('overlap actually repeats the tail of the previous chunk at the start of the next', () => {
    const text = 'abcdefghijklmnopqrstuvwxyz'; // 26 chars
    const chunks = chunkTranscript(text, 10, 3);
    // chunk0 = 0-10 ("abcdefghij"), chunk1 starts at 10-3=7 ("hijklmnopq")
    expect(chunks[0]).toBe('abcdefghij');
    expect(chunks[1].slice(0, 3)).toBe('hij'); // overlap region
  });

  it('covers the entire input with no gaps', () => {
    const text = 'y'.repeat(537);
    const chunks = chunkTranscript(text, 200, 25);
    expect(chunks[chunks.length - 1].length).toBeGreaterThan(0);
    // reconstruct coverage by checking every char index 0..536 falls within at least one chunk's span
    let coveredEnd = 0;
    let pos = 0;
    for (const c of chunks) {
      expect(pos).toBeLessThanOrEqual(coveredEnd + 1e-9);
      coveredEnd = pos + c.length;
      pos = coveredEnd - 25 >= 0 ? coveredEnd - 25 : coveredEnd;
    }
    expect(coveredEnd).toBe(537);
  });

  it('defaults to 12000/1000 when not specified', () => {
    const text = 'z'.repeat(13_000);
    const chunks = chunkTranscript(text);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(12_000);
  });
});
