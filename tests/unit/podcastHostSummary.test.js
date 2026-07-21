/**
 * Unit tests for agents/podcast-host-summary.js's pure/exported functions.
 * No Supabase/OpenAI/Obsidian network calls -- those only happen inside main(),
 * which this suite never invokes (see the import.meta.url guard in the source).
 */
import { describe, it, expect } from 'vitest';
import {
  planEpisodeProcessing,
  resolveHost,
  mergeFutures,
  parseExtractionResponse,
  buildHostVaultNote,
} from '../../agents/podcast-host-summary.js';

// ─── planEpisodeProcessing ──────────────────────────────────────────────────────

describe('planEpisodeProcessing', () => {
  it('single-host show: uses feed.expert, whole transcript_text, no diarization needed', () => {
    const feed = { name: 'Sharp Football Analysis', expert: 'Warren Sharp', needs_diarization: false };
    const transcript = { transcript_text: 'plain flat transcript text here' };
    const plan = planEpisodeProcessing({ feed, transcript });
    expect(plan.mode).toBe('single_host');
    expect(plan.host).toBe('Warren Sharp');
    expect(plan.text).toBe('plain flat transcript text here');
  });

  it('falls back to feed.name if expert is missing on a single-host feed', () => {
    const feed = { name: 'Some Show', needs_diarization: false };
    const plan = planEpisodeProcessing({ feed, transcript: { transcript_text: 'x' } });
    expect(plan.host).toBe('Some Show');
  });

  it('multi-host show with diarization data: resolves hosts and builds labeled transcript', () => {
    const feed = { name: 'Sharp or Square', expert: 'Sharp or Square', needs_diarization: true };
    const transcript = {
      speaker_segments: [
        { speaker: 'A', text: "I'm Chad Millman.", start: 0, end: 3 },
        { speaker: 'B', text: "And I'm Simon Hunter.", start: 4, end: 7 },
      ],
    };
    const plan = planEpisodeProcessing({ feed, transcript });
    expect(plan.mode).toBe('multi_host');
    expect(plan.hostNames.sort()).toEqual(['Chad Millman', 'Simon Hunter']);
    expect(plan.text).toContain('Chad Millman:');
    expect(plan.text).toContain('Simon Hunter:');
  });

  it('multi-host show with NO speaker_segments yet: skips rather than guessing', () => {
    const feed = { name: 'Sharp or Square', needs_diarization: true };
    const transcript = { transcript_text: 'flat text, no diarization', speaker_segments: [] };
    const plan = planEpisodeProcessing({ feed, transcript });
    expect(plan.mode).toBe('skip');
    expect(plan.reason).toMatch(/no speaker_segments/i);
    expect(plan.reason).toMatch(/backfill/i);
  });

  it('multi-host show missing speaker_segments field entirely: skips', () => {
    const feed = { name: 'Sharp or Square', needs_diarization: true };
    const plan = planEpisodeProcessing({ feed, transcript: { transcript_text: 'x' } });
    expect(plan.mode).toBe('skip');
  });

  it('skips if the show is not in SHOW_CONFIG despite needs_diarization=true (defensive)', () => {
    const feed = { name: 'Totally Unknown Show', needs_diarization: true };
    const transcript = { speaker_segments: [{ speaker: 'A', text: 'hi', start: 0, end: 1 }] };
    const plan = planEpisodeProcessing({ feed, transcript });
    expect(plan.mode).toBe('skip');
  });

  it('attributionMethodFor returns host_map for a real name and unknown for Guest', () => {
    const feed = { name: 'Even Money', needs_diarization: true };
    const transcript = {
      speaker_segments: [
        { speaker: 'A', text: 'This is Ross Tucker.', start: 0, end: 2 },
        { speaker: 'B', text: 'Some rando nobody can place.', start: 3, end: 5 },
      ],
    };
    const plan = planEpisodeProcessing({ feed, transcript });
    expect(plan.attributionMethodFor('Ross Tucker')).toBe('host_map');
    expect(plan.attributionMethodFor('Guest')).toBe('unknown');
  });
});

// ─── resolveHost ────────────────────────────────────────────────────────────────

describe('resolveHost', () => {
  const known = ['Chad Millman', 'Simon Hunter', 'Guest'];

  it('matches a known host case-insensitively', () => {
    expect(resolveHost('chad millman', known)).toBe('Chad Millman');
    expect(resolveHost('SIMON HUNTER', known)).toBe('Simon Hunter');
  });

  it('returns Unclear for an empty/missing host', () => {
    expect(resolveHost('', known)).toBe('Unclear');
    expect(resolveHost(null, known)).toBe('Unclear');
    expect(resolveHost(undefined, known)).toBe('Unclear');
  });

  it('returns Unclear (not a false match) for a hallucinated host not in the known list', () => {
    expect(resolveHost('Some Made Up Person', known)).toBe('Unclear');
  });
});

// ─── mergeFutures ───────────────────────────────────────────────────────────────

describe('mergeFutures', () => {
  it('dedupes by subject_market+subject+prediction, keeping higher confidence', () => {
    const futures = [
      { subject_market: 'AFC_North', subject: 'Ravens', prediction: 'win the division', confidence: 60 },
      { subject_market: 'AFC_North', subject: 'Ravens', prediction: 'win the division', confidence: 80 },
    ];
    const merged = mergeFutures(futures);
    expect(merged).toHaveLength(1);
    expect(merged[0].confidence).toBe(80);
  });

  it('keeps distinct futures separate', () => {
    const futures = [
      { subject_market: 'AFC_North', subject: 'Ravens', prediction: 'win it', confidence: 70 },
      { subject_market: 'MVP', subject: 'Josh Allen', prediction: 'wins MVP', confidence: 70 },
    ];
    expect(mergeFutures(futures)).toHaveLength(2);
  });

  it('caps output at MAX_FUTURES_PER_HOST (40)', () => {
    const futures = Array.from({ length: 60 }, (_, i) => ({
      subject_market: 'Super_Bowl', subject: `Team${i}`, prediction: `pick ${i}`, confidence: 70,
    }));
    expect(mergeFutures(futures)).toHaveLength(40);
  });

  it('handles an empty list', () => {
    expect(mergeFutures([])).toEqual([]);
  });
});

// ─── parseExtractionResponse ────────────────────────────────────────────────────

describe('parseExtractionResponse', () => {
  it('parses a clean JSON object with a futures array', () => {
    const raw = JSON.stringify({ futures: [{ subject: 'Ravens' }] });
    expect(parseExtractionResponse(raw)).toEqual([{ subject: 'Ravens' }]);
  });

  it('strips markdown code fences', () => {
    const raw = '```json\n' + JSON.stringify({ futures: [{ subject: 'Bills' }] }) + '\n```';
    expect(parseExtractionResponse(raw)).toEqual([{ subject: 'Bills' }]);
  });

  it('returns empty array on malformed JSON rather than throwing', () => {
    expect(parseExtractionResponse('not json at all {{{')).toEqual([]);
  });

  it('returns empty array when futures key is missing', () => {
    expect(parseExtractionResponse(JSON.stringify({ other: 'thing' }))).toEqual([]);
  });

  it('returns empty array for null/undefined input', () => {
    expect(parseExtractionResponse(null)).toEqual([]);
    expect(parseExtractionResponse(undefined)).toEqual([]);
  });
});

// ─── buildHostVaultNote ─────────────────────────────────────────────────────────

describe('buildHostVaultNote', () => {
  const baseArgs = {
    show: 'Sharp or Square',
    host: 'Chad Millman',
    title: 'Week 5 Reactions',
    pubDate: '2026-07-14T00:00:00Z',
    model: 'gpt-4o',
    attributionMethod: 'host_map',
    chunkCount: 3,
    futures: [
      { subject_market: 'AFC_North', subject: 'Ravens', prediction: 'win the division', lean: 'favor', confidence: 75, stats_cited: ['5-0 vs division since 2023'], quote: 'The Ravens are the class of that division.' },
    ],
  };

  it('includes frontmatter fields', () => {
    const md = buildHostVaultNote(baseArgs);
    expect(md).toContain('show: Sharp or Square');
    expect(md).toContain('host: Chad Millman');
    expect(md).toContain('attribution_method: host_map');
    expect(md).toContain('futures_count: 1');
    expect(md).toContain('pub_date: 2026-07-14');
  });

  it('renders a table row per future', () => {
    const md = buildHostVaultNote(baseArgs);
    expect(md).toContain('AFC_North');
    expect(md).toContain('Ravens');
    expect(md).toContain('win the division');
  });

  it('renders the quote section', () => {
    const md = buildHostVaultNote(baseArgs);
    expect(md).toContain('The Ravens are the class of that division.');
  });

  it('handles zero futures gracefully', () => {
    const md = buildHostVaultNote({ ...baseArgs, futures: [] });
    expect(md).toContain('futures_count: 0');
    expect(md).toContain('(no futures discussed)');
    expect(md).toContain('(none)'); // quotes section fallback
  });

  it('escapes pipe characters so the markdown table doesn’t break', () => {
    const md = buildHostVaultNote({
      ...baseArgs,
      futures: [{ subject_market: 'MVP', subject: 'A|B Player', prediction: 'wins it | probably', confidence: 60, stats_cited: [] }],
    });
    expect(md).toContain('A\\|B Player');
  });

  it('falls back to "undated" when pubDate is missing', () => {
    const md = buildHostVaultNote({ ...baseArgs, pubDate: null });
    expect(md).toContain('pub_date: undated');
  });
});
