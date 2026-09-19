// Guards the 2026-09-19 fix: podcast extraction only saw transcript.slice(0, 12000). Extraction is
// now chunked over the full transcript; these helpers merge the chunk results.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { mergeIntel, mergePicks } from '../../agents/lib/extraction-merge.js';
import { chunkTranscript } from '../../agents/lib/chunk-text.js';

describe('mergePicks', () => {
  it('dedupes the same pick seen in overlapping chunks, keeping higher confidence', () => {
    const a = { type: 'spread', selection: 'Jets', team1: 'Packers', team2: 'Jets', line: 3.5, confidence: 60 };
    const b = { ...a, confidence: 75 };
    expect(mergePicks([a, b])).toEqual([b]);
  });
  it('keeps different player props on the same game and line', () => {
    const base = { type: 'player_prop', selection: 'OVER', team1: 'CLE', team2: 'TB', line: 49.5 };
    const out = mergePicks([{ ...base, player: 'Quinshon Judkins' }, { ...base, player: 'Bucky Irving' }]);
    expect(out).toHaveLength(2);
  });
});

describe('mergeIntel', () => {
  it('dedupes case/whitespace variants and caps the list', () => {
    const out = mergeIntel(['Ravens 53% pressure rate', 'ravens  53% pressure rate', ...Array.from({ length: 40 }, (_, i) => `note ${i}`)]);
    expect(out[0]).toBe('Ravens 53% pressure rate');
    expect(out).toHaveLength(30);
  });
});

describe('podcast-ingest full-transcript extraction', () => {
  const src = fs.readFileSync(path.resolve(__dirname, '../../agents/podcast-ingest.js'), 'utf8');
  it('no longer truncates the transcript to the first 12k chars', () => {
    expect(src).not.toMatch(/transcript\.slice\(0,\s*12000\)/);
    expect(src).toContain('chunkTranscript(');
  });
  it('a 100k-char transcript is fully covered by chunks', () => {
    const text = 'x'.repeat(100_000);
    const chunks = chunkTranscript(text, 30_000, 1_500);
    expect(chunks.length).toBe(4);
    expect(chunks.at(-1).endsWith('x')).toBe(true);
    expect(chunks.reduce((n, c) => n + c.length, 0)).toBeGreaterThanOrEqual(100_000);
  });
});
