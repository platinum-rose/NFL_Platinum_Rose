import { describe, it, expect } from 'vitest';
import {
  detectSteamAndReverseLineMoves, detectAndCorrelateSteamMoves, crossedKeyNumber, correlateMoveCatalysts,
} from '../../src/lib/steamMoveCorrelator.js';

const T0 = Date.parse('2026-10-21T20:00:00Z');
const at = (min) => new Date(T0 + min * 60000).toISOString();
const HOME = 'Kansas City Chiefs';
const AWAY = 'Las Vegas Raiders';
const mv = (over) => ({ home_team: HOME, away_team: AWAY, book: 'draftkings', type: 'spread', ...over });

describe('crossedKeyNumber', () => {
  it('detects -2.5 → -3.5 through 3', () => expect(crossedKeyNumber(-2.5, -3.5)).toBe(3));
  it('detects landing on 7', () => expect(crossedKeyNumber(-6.5, -7)).toBe(7));
  it('ignores small non-key moves', () => expect(crossedKeyNumber(-4, -4.5)).toBeNull());
});

describe('detectSteamAndReverseLineMoves', () => {
  it('flags a 1-pt spread steam move with key-number cross', () => {
    const ev = detectSteamAndReverseLineMoves([mv({ from_line: -2.5, to_line: -3.5, detected_at: at(0) })], []);
    expect(ev).toHaveLength(1);
    expect(ev[0].flags).toEqual(expect.arrayContaining(['STEAM', 'KEY_NUMBER_CROSS']));
    expect(ev[0].crossed_key_number).toBe(3);
  });

  it('accumulates small ticks inside the 120-min window but not outside', () => {
    const inside = detectSteamAndReverseLineMoves([
      mv({ type: 'total', from_line: 47, to_line: 46.5, detected_at: at(0) }),
      mv({ type: 'total', from_line: 46.5, to_line: 46, detected_at: at(40) }),
      mv({ type: 'total', from_line: 46, to_line: 45.5, detected_at: at(100) }),
    ], []);
    expect(inside).toHaveLength(1);
    expect(inside[0].delta).toBe(-1.5);
    const outside = detectSteamAndReverseLineMoves([
      mv({ type: 'total', from_line: 47, to_line: 46.5, detected_at: at(0) }),
      mv({ type: 'total', from_line: 46.5, to_line: 46, detected_at: at(100) }),
      mv({ type: 'total', from_line: 46, to_line: 45.5, detected_at: at(200) }),
    ], []);
    expect(outside).toHaveLength(0);
  });

  it('flags RLM: 25-pt money/ticket divergence with the line moving toward the money', () => {
    // Home line -4 → -4.5 (toward home). Only 40% of tickets on home but 65% of money.
    const splits = [{ captured_at: at(-30), spread_home_bettors: 40, spread_home_money: 65 }];
    const ev = detectSteamAndReverseLineMoves([mv({ from_line: -4, to_line: -4.5, detected_at: at(0) })], splits);
    expect(ev).toHaveLength(1);
    expect(ev[0].move_type).toBe('REVERSE_LINE_MOVEMENT');
    expect(ev[0].splits_snapshot.divergence).toBe(25);
  });

  it('does not flag RLM when the public and the move agree', () => {
    const splits = [{ captured_at: at(-30), spread_home_bettors: 70, spread_home_money: 75 }];
    const ev = detectSteamAndReverseLineMoves([mv({ from_line: -4, to_line: -4.5, detected_at: at(0) })], splits);
    expect(ev).toHaveLength(0);
  });

  it('collapses same-direction moves across books into confirming_books', () => {
    const ev = detectSteamAndReverseLineMoves([
      mv({ from_line: -2.5, to_line: -3.5, detected_at: at(0) }),
      mv({ book: 'fanduel', from_line: -2.5, to_line: -3.5, detected_at: at(5) }),
    ], []);
    expect(ev).toHaveLength(1);
    expect(ev[0].confirming_books.sort()).toEqual(['draftkings', 'fanduel']);
  });
});

describe('correlation', () => {
  const injuries = [
    { player_name: 'Maxx Crosby', team_abbr: 'LV', position: 'DE', injury_status: 'Out', reported_at: at(-22) },
    { player_name: 'Far Away', team_abbr: 'LV', position: 'QB', injury_status: 'Out', reported_at: at(-400) },
    { player_name: 'Other Team', team_abbr: 'NE', position: 'QB', injury_status: 'Out', reported_at: at(-10) },
  ];
  const tweets = [
    { author_handle: 'sharpguy', author_tier: 'sharp', text: 'Big bet on the Chiefs -3 just hit', published_at: at(-5), tweet_url: 'https://x.com/a/1' },
    { author_handle: 'random', author_tier: 'sharp', text: 'Patriots money pouring in', published_at: at(-5), tweet_url: 'https://x.com/a/2' },
    { author_handle: 'late', author_tier: 'media', text: 'Chiefs line moved', published_at: at(200), tweet_url: 'https://x.com/a/3' },
  ];

  it('keeps only matchup-team catalysts inside the window', () => {
    const c = correlateMoveCatalysts({ detected_at: at(0), home_team: HOME, away_team: AWAY }, { injuries, sharpTweets: tweets }, 90);
    expect(c.map(x => x.summary).join('|')).toMatch(/Crosby/);
    expect(c.find(x => /Far Away|Other Team|Patriots/.test(x.summary))).toBeUndefined();
    expect(c.filter(x => x.source === 'sharp_tweet')).toHaveLength(1);
  });

  it('detectAndCorrelateSteamMoves returns the structured packet', () => {
    const out = detectAndCorrelateSteamMoves({
      gameId: '2026_07_KC_LV',
      lineMovements: [mv({ from_line: -2.5, to_line: -3.5, detected_at: at(0) })],
      bettingSplits: [{ captured_at: at(-15), spread_home_bettors: 48, spread_home_money: 74 }],
      playerInjuries: injuries,
      sharpTweets: tweets,
    });
    expect(out).toHaveLength(1);
    const a = out[0];
    expect(a).toMatchObject({ moveType: 'REVERSE_LINE_MOVEMENT', delta: -1, matchup: 'LV @ KC', game_id: '2026_07_KC_LV' });
    expect(a.windowStart).toBe(at(-90));
    expect(a.windowEnd).toBe(at(90));
    expect(a.correlatedInjuries).toHaveLength(1);
    expect(a.correlatedTweets).toHaveLength(1);
    expect(a.causalHypothesis).toMatch(/KC -2.5 to KC -3.5/);
    expect(a.causalHypothesis).toMatch(/key number 3/);
    expect(a.causalHypothesis).toMatch(/74% of money vs 48% of tickets/);
  });
});

describe('remediation 2026-10-21 (B3)', () => {
  it('"NO INJURY DESIGNATION" does not match the Saints, but #NO / Saints do', async () => {
    const { teamTextMatchers } = await import('../../src/lib/steamMoveCorrelator.js');
    const hits = (text) => teamTextMatchers('NO').some(re => re.test(text));
    expect(hits('NO INJURY DESIGNATION for Patrick Mahomes')).toBe(false);
    expect(hits('Sharp money on #NO +3')).toBe(true);
    expect(hits('Saints getting steamed')).toBe(true);
  });

  it('bare "New York" / "Los Angeles" do not cross-match NYG/NYJ or LAR/LAC', async () => {
    const { teamTextMatchers } = await import('../../src/lib/steamMoveCorrelator.js');
    const hits = (abbr, text) => teamTextMatchers(abbr).some(re => re.test(text));
    expect(hits('NYG', 'New York Jets money pouring in')).toBe(false);
    expect(hits('NYJ', 'New York Jets money pouring in')).toBe(true);
    expect(hits('LAC', 'Los Angeles Rams -3')).toBe(false);
  });

  it('a "NO INJURY DESIGNATION" tweet is not correlated to a Saints game', () => {
    const c = correlateMoveCatalysts(
      { detected_at: at(0), home_team: 'New Orleans Saints', away_team: 'Atlanta Falcons' },
      { sharpTweets: [{ author_handle: 'x', author_tier: 'sharp', text: 'NO INJURY DESIGNATION for Patrick Mahomes', published_at: at(-5) }] },
      90,
    );
    expect(c).toHaveLength(0);
  });

  it('a catalyst 10 minutes AFTER the move is labelled "after"', () => {
    const out = detectAndCorrelateSteamMoves({
      lineMovements: [mv({ from_line: -2.5, to_line: -3.5, detected_at: at(0) })],
      sharpTweets: [{ author_handle: 'late', author_tier: 'sharp', text: 'Chiefs -3.5 now', published_at: at(10), tweet_url: 'https://x.com/a/9' }],
    });
    expect(out[0].causalHypothesis).toMatch(/10 min after the move/);
    expect(out[0].causalHypothesis).not.toMatch(/before the move/);
  });

  it('a catalyst BEFORE the move is labelled "before"', () => {
    const out = detectAndCorrelateSteamMoves({
      lineMovements: [mv({ from_line: -2.5, to_line: -3.5, detected_at: at(0) })],
      playerInjuries: [{ player_name: 'Maxx Crosby', team_abbr: 'LV', position: 'DE', injury_status: 'Out', reported_at: at(-22) }],
    });
    expect(out[0].causalHypothesis).toMatch(/22 min before the move/);
  });

  it('multi-book merge keeps splits_snapshot when the bigger confirming move has none', async () => {
    const { mergeConfirmingBooks } = await import('../../src/lib/steamMoveCorrelator.js');
    const snap = { move_side: 'home', ticket_pct: 40, money_pct: 65, divergence: 25 };
    const merged = mergeConfirmingBooks([
      { market: 'spread', book: 'draftkings', delta: -0.5, detected_at: at(0), flags: ['REVERSE_LINE_MOVEMENT'], move_type: 'REVERSE_LINE_MOVEMENT', splits_snapshot: snap },
      { market: 'spread', book: 'fanduel', delta: -1, detected_at: at(10), flags: ['STEAM'], move_type: 'STEAM', splits_snapshot: null },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].delta).toBe(-1);
    expect(merged[0].splits_snapshot).toEqual(snap);
    expect(merged[0].move_type).toBe('REVERSE_LINE_MOVEMENT');
    expect(merged[0].confirming_books.sort()).toEqual(['draftkings', 'fanduel']);
  });
});

describe('remediation round 2 (R2-B3)', () => {
  it('normal team codes match again (DAL, DEN, BUF/MIA) while NO / WAS still need betting context', async () => {
    const { teamTextMatchers } = await import('../../src/lib/steamMoveCorrelator.js');
    const hits = (abbr, text) => teamTextMatchers(abbr).some(re => re.test(text));
    expect(hits('DAL', 'DAL -3.5 steamed to -4.5 across books')).toBe(true);
    expect(hits('DEN', 'DEN +7 sharp')).toBe(true);
    expect(hits('BUF', 'BUF/MIA over 48.5')).toBe(true);
    expect(hits('NO', 'NO -3 getting hammered')).toBe(true);
    expect(hits('NO', 'NO/ATL under')).toBe(true);
    expect(hits('NO', 'NO INJURY DESIGNATION for Mahomes')).toBe(false);
    expect(hits('WAS', 'He WAS ruled out Friday')).toBe(false);
  });

  it('mergeConfirmingBooks keeps crossed_key_number from the first book', async () => {
    const { mergeConfirmingBooks } = await import('../../src/lib/steamMoveCorrelator.js');
    const merged = mergeConfirmingBooks([
      { market: 'spread', book: 'dk', delta: -1, detected_at: at(0), flags: ['STEAM', 'KEY_NUMBER_CROSS'], move_type: 'STEAM', crossed_key_number: 3, splits_snapshot: null },
      { market: 'spread', book: 'fd', delta: -1.5, detected_at: at(5), flags: ['STEAM'], move_type: 'STEAM', crossed_key_number: null, splits_snapshot: null },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].delta).toBe(-1.5);
    expect(merged[0].crossed_key_number).toBe(3);
    expect(merged[0].flags).toContain('KEY_NUMBER_CROSS');
  });
});

describe('round 3 (R3-B6 / B7)', () => {
  it('slash and uppercase opponent forms tag the Saints; plain "NO" words still do not', async () => {
    const { teamTextMatchers } = await import('../../src/lib/steamMoveCorrelator.js');
    const hits = (text) => teamTextMatchers('NO').some(re => re.test(text));
    expect(hits('ATL/NO under 44')).toBe(true);
    expect(hits('ATL VS NO')).toBe(true);
    expect(hits('ATL AT NO')).toBe(true);
    expect(hits('NO -3.5 steamed')).toBe(true);
    expect(hits('NO INJURY DESIGNATION')).toBe(false);
  });

  it('"LA" never tags the Rams (shared with the Chargers)', async () => {
    const { teamTextMatchers } = await import('../../src/lib/steamMoveCorrelator.js');
    const hits = (abbr, text) => teamTextMatchers(abbr).some(re => re.test(text));
    expect(hits('LAR', 'LA Chargers -3')).toBe(false);
    expect(hits('LAR', 'Rams -3')).toBe(true);
  });

  it('merged move keeps STEAM type when the bigger confirming book was only a key-number cross', async () => {
    const { mergeConfirmingBooks } = await import('../../src/lib/steamMoveCorrelator.js');
    const merged = mergeConfirmingBooks([
      { market: 'spread', book: 'dk', delta: -1, detected_at: at(0), flags: ['STEAM'], move_type: 'STEAM', crossed_key_number: null },
      { market: 'spread', book: 'fd', delta: -1.5, detected_at: at(5), flags: ['KEY_NUMBER_CROSS'], move_type: 'KEY_NUMBER_CROSS', crossed_key_number: 3 },
    ]);
    expect(merged[0].move_type).toBe('STEAM');
    expect(merged[0].crossed_key_number).toBe(3);
  });
});
