/**
 * Unit tests for scripts/podcast-diarize-backfill.js's pure selection logic.
 * No network/Supabase calls -- those only happen in main(), never invoked here.
 */
import { describe, it, expect } from 'vitest';
import { selectBackfillTargets, estimateAudioHours } from '../../scripts/podcast-diarize-backfill.js';

const FEEDS = [
  { id: 'f-sos', name: 'Sharp or Square', needs_diarization: true },
  { id: 'f-em',  name: 'Even Money',      needs_diarization: true },
  { id: 'f-ws',  name: 'Sharp Football Analysis', needs_diarization: false },
];

function ep(id, feedId, pubDate, durationSecs = 1800) {
  return { id, feed_id: feedId, title: `Episode ${id}`, pub_date: pubDate, audio_url: `https://cdn/${id}.mp3`, duration_secs: durationSecs };
}

describe('selectBackfillTargets', () => {
  it('only considers feeds with needs_diarization=true', () => {
    const episodes = [ep('e1', 'f-sos', '2026-07-10'), ep('e2', 'f-ws', '2026-07-10')];
    const out = selectBackfillTargets({ feeds: FEEDS, episodes, transcripts: [], limitPerShow: 5 });
    expect(out.map(t => t.episode.id)).toEqual(['e1']);
  });

  it('skips episodes that already have non-empty speaker_segments', () => {
    const episodes = [ep('e1', 'f-sos', '2026-07-10'), ep('e2', 'f-sos', '2026-07-09')];
    const transcripts = [{ episode_id: 'e1', speaker_segments: [{ speaker: 'A', text: 'hi', start: 0, end: 1 }] }];
    const out = selectBackfillTargets({ feeds: FEEDS, episodes, transcripts, limitPerShow: 5 });
    expect(out.map(t => t.episode.id)).toEqual(['e2']);
  });

  it('treats null, undefined, and empty-array speaker_segments as not-yet-diarized', () => {
    const episodes = [ep('e1', 'f-sos', '2026-07-10'), ep('e2', 'f-sos', '2026-07-09'), ep('e3', 'f-sos', '2026-07-08')];
    const transcripts = [
      { episode_id: 'e1', speaker_segments: null },
      { episode_id: 'e2', speaker_segments: undefined },
      { episode_id: 'e3', speaker_segments: [] },
    ];
    const out = selectBackfillTargets({ feeds: FEEDS, episodes, transcripts, limitPerShow: 5 });
    expect(out.map(t => t.episode.id).sort()).toEqual(['e1', 'e2', 'e3']);
  });

  it('sorts newest-first within a show and caps at limitPerShow', () => {
    const episodes = [
      ep('old', 'f-sos', '2026-07-01'),
      ep('mid', 'f-sos', '2026-07-10'),
      ep('new', 'f-sos', '2026-07-15'),
    ];
    const out = selectBackfillTargets({ feeds: FEEDS, episodes, transcripts: [], limitPerShow: 2 });
    expect(out.map(t => t.episode.id)).toEqual(['new', 'mid']);
  });

  it('limitPerShow=0 means no cap', () => {
    const episodes = [ep('a', 'f-sos', '2026-07-01'), ep('b', 'f-sos', '2026-07-02'), ep('c', 'f-sos', '2026-07-03')];
    const out = selectBackfillTargets({ feeds: FEEDS, episodes, transcripts: [], limitPerShow: 0 });
    expect(out.length).toBe(3);
  });

  it('applies the cap independently per show', () => {
    const episodes = [
      ep('sos1', 'f-sos', '2026-07-10'), ep('sos2', 'f-sos', '2026-07-09'), ep('sos3', 'f-sos', '2026-07-08'),
      ep('em1', 'f-em', '2026-07-10'), ep('em2', 'f-em', '2026-07-09'),
    ];
    const out = selectBackfillTargets({ feeds: FEEDS, episodes, transcripts: [], limitPerShow: 1 });
    expect(out.map(t => t.episode.id).sort()).toEqual(['em1', 'sos1']);
  });

  it('showFilter is a case-insensitive substring match on feed name', () => {
    const episodes = [ep('e1', 'f-sos', '2026-07-10'), ep('e2', 'f-em', '2026-07-10')];
    const out = selectBackfillTargets({ feeds: FEEDS, episodes, transcripts: [], limitPerShow: 5, showFilter: 'sharp or' });
    expect(out.map(t => t.episode.id)).toEqual(['e1']);
  });

  it('episodeId overrides everything -- returns just that episode even if single-host or already diarized', () => {
    const episodes = [ep('e1', 'f-ws', '2026-07-10')]; // f-ws needs_diarization: false
    const transcripts = [{ episode_id: 'e1', speaker_segments: [{ speaker: 'A', text: 'hi', start: 0, end: 1 }] }];
    const out = selectBackfillTargets({ feeds: FEEDS, episodes, transcripts, limitPerShow: 5, episodeId: 'e1' });
    expect(out.length).toBe(1);
    expect(out[0].episode.id).toBe('e1');
    expect(out[0].feed.id).toBe('f-ws');
  });

  it('episodeId for an unknown episode returns empty', () => {
    const out = selectBackfillTargets({ feeds: FEEDS, episodes: [], transcripts: [], limitPerShow: 5, episodeId: 'nope' });
    expect(out).toEqual([]);
  });

  it('excludes episodes with a clear non-NFL title signal', () => {
    const episodes = [
      { ...ep('nfl1', 'f-sos', '2026-07-10'), title: 'NFL Week 1 Best Bets' },
      { ...ep('wc1', 'f-sos', '2026-07-11'), title: 'WORLD CUP FINAL BETTING PREVIEW: Spain vs. Argentina' },
    ];
    const out = selectBackfillTargets({ feeds: FEEDS, episodes, transcripts: [], limitPerShow: 5 });
    expect(out.map(t => t.episode.id)).toEqual(['nfl1']);
  });

  it('keeps generically-titled episodes with no explicit sport signal (permissive default)', () => {
    const episodes = [{ ...ep('gen1', 'f-sos', '2026-07-10'), title: 'Best Bets of the Week' }];
    const out = selectBackfillTargets({ feeds: FEEDS, episodes, transcripts: [], limitPerShow: 5 });
    expect(out.map(t => t.episode.id)).toEqual(['gen1']);
  });

  it('a non-NFL episode does not count against the per-show cap -- the next NFL one still gets picked', () => {
    const episodes = [
      { ...ep('wc1', 'f-sos', '2026-07-15'), title: 'World Cup Final Preview' },
      { ...ep('nfl1', 'f-sos', '2026-07-14'), title: 'NFL Week 1 Best Bets' },
    ];
    const out = selectBackfillTargets({ feeds: FEEDS, episodes, transcripts: [], limitPerShow: 1 });
    expect(out.map(t => t.episode.id)).toEqual(['nfl1']);
  });

  it('episodeId override bypasses the NFL-relevance filter -- explicit ask always honored', () => {
    const episodes = [{ ...ep('wc1', 'f-sos', '2026-07-10'), title: 'World Cup Final Preview' }];
    const out = selectBackfillTargets({ feeds: FEEDS, episodes, transcripts: [], limitPerShow: 5, episodeId: 'wc1' });
    expect(out.map(t => t.episode.id)).toEqual(['wc1']);
  });

  it('returns empty when nothing matches', () => {
    const out = selectBackfillTargets({ feeds: FEEDS, episodes: [], transcripts: [], limitPerShow: 5 });
    expect(out).toEqual([]);
  });
});

describe('estimateAudioHours', () => {
  it('sums duration_secs across targets and converts to hours', () => {
    const targets = [
      { episode: { duration_secs: 3600 } },
      { episode: { duration_secs: 1800 } },
    ];
    expect(estimateAudioHours(targets)).toBeCloseTo(1.5, 5);
  });

  it('treats missing/null duration_secs as 0', () => {
    const targets = [{ episode: { duration_secs: null } }, { episode: {} }];
    expect(estimateAudioHours(targets)).toBe(0);
  });

  it('returns 0 for an empty target list', () => {
    expect(estimateAudioHours([])).toBe(0);
  });
});
