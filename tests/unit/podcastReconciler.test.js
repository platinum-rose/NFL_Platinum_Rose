import { describe, it, expect, beforeAll } from 'vitest';
import {
  reconcilePodcastPicks, normalizeShowName, normalizeHostName, normalizeTeamKey,
  normalizeBetType, confidenceTier, DUAL_SOURCE_BADGE, summarizeReconciliation, normalizeFuturesSubMarket, normalizePropSubMarket,
} from '../../src/lib/podcastReconciler.js';

const EP = 'ep-1';
const audioRow = (pick, ctx = {}) => ({
  episode_id: EP, episode_title: 'Week 7 Picks', pub_date: '2026-10-21T12:00:00Z',
  expert: 'Bill Simmons', feed_name: 'The Bill Simmons Podcast', ...ctx,
  pick: { category: 'spread', selection: 'KC', team1: 'KC', team2: 'LV', line: -3.5,
    summary: 'Chiefs cover', quality_score: 0.7, week: 7, season: 2026, ...pick },
});
const videoItem = (over = {}) => ({
  item_type: 'pick', episode_id: EP, feed_name: 'Bill Simmons Podcast', pub_date: '2026-10-21T13:00:00Z',
  team: 'KC', market: 'spread', side: 'KC', line: -3.5, week: 7, speaker: 'Bill Simmons',
  supporting_quote: 'I just think Kansas City handles Vegas easily at home, they are rolling right now.',
  promoted_at: '2026-10-21T15:00:00Z', ...over,
});

describe('normalizers', () => {
  it('show names', () => {
    expect(normalizeShowName('The Bill Simmons Podcast')).toBe('bill simmons');
    expect(normalizeShowName('Bill Simmons Podcast')).toBe('bill simmons');
    expect(normalizeShowName('The Herd Show!')).toBe('herd');
  });
  it('host names', () => {
    expect(normalizeHostName('Cousin Sal')).toBe('cousin_sal');
    expect(normalizeHostName('Simmons')).toBe('bill_simmons');
    expect(normalizeHostName('SPEAKER A')).toBeNull();
  });
  it('teams', () => {
    expect(normalizeTeamKey('Chiefs')).toBe('KC');
    expect(normalizeTeamKey('Kansas City Chiefs')).toBe('KC');
    expect(normalizeTeamKey('OVER')).toBeNull();
  });
  it('bet types', () => {
    expect(normalizeBetType('ATS')).toBe('spread');
    expect(normalizeBetType('total', 'UNDER')).toBe('total_under');
    expect(normalizeBetType('o/u', 'over')).toBe('total_over');
    expect(normalizeBetType('ML')).toBe('moneyline');
    expect(normalizeBetType('player_prop')).toBe('prop');
    expect(normalizeBetType('win_total')).toBe('futures');
  });
  it('confidence tiers', () => {
    expect(confidenceTier(0.5)).toBe('Low');
    expect(confidenceTier(0.75)).toBe('Medium');
    expect(confidenceTier(0.9)).toBe('High');
  });
});

describe('reconcilePodcastPicks', () => {
  it('merges the same pick from audio + YouTube into ONE pick with no confidence boost', () => {
    const out = reconcilePodcastPicks([audioRow()], [videoItem()]);
    expect(out).toHaveLength(1);
    const p = out[0];
    expect(p.dual_extraction).toBe(true);
    expect(p.sources).toEqual(['audio_rss', 'youtube_gemini']);
    expect(p.sourceBadge).toBe(DUAL_SOURCE_BADGE);
    // Same host, same episode, heard twice = one opinion. No boost:
    // audio's real 0.70 — the YouTube pick has no confidence of its own, so
    // its 0.75 placeholder must not replace it.
    expect(p.confidence).toBeCloseTo(0.7, 5);
    expect(p.confidence_tier).toBe('Medium');         // NOT promoted
    expect(p.pick.quality_score).toBeCloseTo(0.7, 5);
    expect(p.reasoning_summary).toMatch(/Kansas City handles Vegas/); // longer kept
    expect(p.alternate_quote).toBeTruthy();
    expect(p.pick.dual_extraction).toBe(true);           // legacy shape carries flags
    expect(summarizeReconciliation(out).duplicates_removed).toBe(1);
  });

  it('keeps two different markets from the same host as two picks', () => {
    const audio = [audioRow(), audioRow({ category: 'total', selection: 'OVER', line: 47.5, summary: 'over' })];
    const video = [videoItem(), videoItem({ market: 'total', side: 'OVER', team: 'KC', line: 47.5 })];
    const out = reconcilePodcastPicks(audio, video);
    expect(out).toHaveLength(2);
    expect(out.every(p => p.dual_extraction)).toBe(true);
    expect(out.map(p => p.bet_type).sort()).toEqual(['spread', 'total_over']);
  });

  it('does not merge opposite totals', () => {
    const out = reconcilePodcastPicks(
      [audioRow({ category: 'total', selection: 'OVER', line: 47.5 })],
      [videoItem({ market: 'total', side: 'UNDER', line: 47.5 })],
    );
    expect(out).toHaveLength(2);
    expect(out.some(p => p.dual_extraction)).toBe(false);
  });

  it('records line variants when lines differ slightly', () => {
    const out = reconcilePodcastPicks([audioRow({ line: -3 })], [videoItem({ line: -3.5 })]);
    expect(out).toHaveLength(1);
    expect([...out[0].line_variants].sort((a, b) => a - b)).toEqual([-3.5, -3]);
  });

  it('excludes unpromoted YouTube rows unless includeUnpromoted', () => {
    const v = videoItem({ promoted_at: null });
    expect(reconcilePodcastPicks([], [v])).toHaveLength(0);
    expect(reconcilePodcastPicks([], [v], { includeUnpromoted: true })).toHaveLength(1);
  });

  it('single-source picks pass through with dual_extraction:false', () => {
    const out = reconcilePodcastPicks([audioRow()], [videoItem({ team: 'LV', side: 'LV' })]);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ dual_extraction: false, sources: ['audio_rss'] });
    expect(out[1]).toMatchObject({ dual_extraction: false, sources: ['youtube_gemini'] });
    expect(out[1].pick.selection).toBe('LV');
  });

  it('matches across different episode ids via show + 48h window when week is missing', () => {
    const out = reconcilePodcastPicks(
      [audioRow({ week: null }, { episode_id: 'rss-ep' })],
      [videoItem({ week: null, episode_id: 'yt-ep', pub_date: '2026-10-22T20:00:00Z' })],
    );
    expect(out).toHaveLength(1);
    const far = reconcilePodcastPicks(
      [audioRow({ week: null }, { episode_id: 'rss-ep' })],
      [videoItem({ week: null, episode_id: 'yt-ep', pub_date: '2026-10-25T20:00:00Z' })],
    );
    expect(far).toHaveLength(2);
  });

  it('does not merge picks from different named hosts', () => {
    const out = reconcilePodcastPicks([audioRow({ speaker: 'Cousin Sal' })], [videoItem({ speaker: 'Bill Simmons' })]);
    expect(out).toHaveLength(2);
  });
});

describe('consensus counting', () => {
  it('a pick heard on audio + video contributes exactly 1, same as a single-pipeline pick', () => {
    const merged = reconcilePodcastPicks([audioRow()], [videoItem()]);
    const single = reconcilePodcastPicks([audioRow({ selection: 'LV', subject: 'LV' }, { episode_id: 'ep-2', feed_name: 'Other Show' })], []);
    const all = [...merged, ...single];
    expect(all).toHaveLength(2);
    const bySel = {};
    for (const p of all) bySel[p.pick.selection] = (bySel[p.pick.selection] || 0) + 1;
    expect(bySel).toEqual({ KC: 1, LV: 1 });
    expect(merged[0].confidence).toBeCloseTo(0.7, 5);
  });
});


describe('remediation 2026-10-21 (A1–A3)', () => {
  it('A1: a defaulted YouTube confidence never lifts a real Low audio confidence', () => {
    const out = reconcilePodcastPicks(
      [audioRow({ quality_score: 0.55, confidence: undefined })],
      [videoItem({ confidence: null })],
    );
    expect(out).toHaveLength(1);
    expect(out[0].dual_extraction).toBe(true);
    expect(out[0].confidence).toBeCloseTo(0.55, 5);
    expect(out[0].confidence_tier).toBe('Low');
    expect(out[0].pick.quality_score).toBeCloseTo(0.55, 5);
  });

  it('A3: audio "superbowl" and Gemini "super_bowl_winner" futures for the same team merge', () => {
    const out = reconcilePodcastPicks(
      [audioRow({ category: 'future', subject_market: 'superbowl', selection: 'BAL', subject: 'BAL', team1: 'BAL', team2: null, line: null })],
      [videoItem({ market: 'super_bowl_winner', team: 'BAL', side: 'YES', line: null })],
    );
    expect(out).toHaveLength(1);
    expect(out[0].dual_extraction).toBe(true);
  });

  it('A3: audio "AFC_North" and Gemini "division_winner" normalize to the same futures market', () => {
    expect(normalizeFuturesSubMarket('AFC_North')).toBe('division_winner');
    expect(normalizeFuturesSubMarket('NFC_West_Win_Total')).toBe('win_total');
    expect(normalizeFuturesSubMarket('Offensive_ROY')).toBe('oroy');
    expect(normalizeFuturesSubMarket('Super_Bowl')).toBe('super_bowl_winner');
  });

  it('A3: player-award futures merge on the player, not the team', () => {
    const audio = audioRow({ category: 'future', subject_market: 'MVP', subject: 'Josh Allen', selection: 'Josh Allen', team1: null, team2: null, line: null });
    expect(reconcilePodcastPicks([audio], [videoItem({ market: 'mvp', player: 'Josh Allen', team: 'BUF', side: 'YES', line: null })])).toHaveLength(1);
    expect(reconcilePodcastPicks([audio], [videoItem({ market: 'mvp', player: 'Joe Burrow', team: 'CIN', side: 'YES', line: null })])).toHaveLength(2);
  });

  it('A3: props for two different players on the same team do NOT merge', () => {
    const out = reconcilePodcastPicks(
      [audioRow({ category: 'prop', player: 'Patrick Mahomes', selection: 'OVER', subject: 'Patrick Mahomes', line: 274.5 })],
      [videoItem({ market: 'player_prop', team: 'KC', player: 'Travis Kelce', side: 'OVER', line: 64.5 })],
    );
    expect(out).toHaveLength(2);
    expect(out.some(p => p.dual_extraction)).toBe(false);
  });

  it('A3: the same player prop from both pipelines does merge', () => {
    const out = reconcilePodcastPicks(
      [audioRow({ category: 'prop', player: 'Patrick Mahomes', selection: 'OVER', subject: 'Patrick Mahomes', line: 274.5 })],
      [videoItem({ market: 'player_prop', team: 'KC', player: 'Patrick Mahomes', side: 'OVER', line: 274.5 })],
    );
    expect(out).toHaveLength(1);
  });

  it('A3: a prop with no named player on one side never merges by team alone', () => {
    const out = reconcilePodcastPicks(
      [audioRow({ category: 'prop', player: 'Patrick Mahomes', selection: 'OVER', subject: 'Patrick Mahomes' })],
      [videoItem({ market: 'player_prop', team: 'KC', side: 'OVER' })],
    );
    expect(out).toHaveLength(2);
  });

  it('A2: a YouTube-only win_total pick gets selection OVER, not the team', () => {
    const out = reconcilePodcastPicks([], [videoItem({ market: 'win_total', team: 'BAL', side: undefined, lean: 'Over 10.5', line: undefined })]);
    expect(out).toHaveLength(1);
    expect(out[0].pick.selection).toBe('OVER');
    expect(out[0].pick.subject).toBe('BAL');
    expect(out[0].line).toBe(10.5);
  });

  it('A2: merged picks backfill team2 from the combined teams', () => {
    const out = reconcilePodcastPicks([audioRow({ team2: null })], [videoItem({ teams: ['LV'] })]);
    expect(out[0].pick.team1).toBe('KC');
    expect(out[0].pick.team2).toBe('LV');
  });
});

describe('remediation round 2 (R2-A2 / R2-A5)', () => {
  it('miss_playoffs and super_bowl_mvp get their own markets', () => {
    expect(normalizeFuturesSubMarket('miss_playoffs')).toBe('miss_playoffs');
    expect(normalizeFuturesSubMarket('To_Miss_Playoffs')).toBe('miss_playoffs');
    expect(normalizeFuturesSubMarket('Playoffs')).toBe('make_playoffs');
    expect(normalizeFuturesSubMarket('super_bowl_mvp')).toBe('sb_mvp');
    expect(normalizeFuturesSubMarket('Super_Bowl')).toBe('super_bowl_winner');
  });

  it('make-playoffs YES and NO on the same team do not merge', () => {
    const out = reconcilePodcastPicks(
      [audioRow({ category: 'future', subject_market: 'Playoffs', selection: 'YES', subject: 'DAL', team1: 'DAL', team2: null, line: null })],
      [videoItem({ market: 'make_playoffs', team: 'DAL', side: 'NO', line: null })],
    );
    expect(out).toHaveLength(2);
  });

  it('a Saints futures pick ("NO" = team code) still merges with Gemini YES', () => {
    const out = reconcilePodcastPicks(
      [audioRow({ category: 'future', subject_market: 'NFC_South', selection: 'NO', subject: 'NO', team1: 'NO', team2: null, line: null })],
      [videoItem({ market: 'division_winner', team: 'NO', side: 'YES', line: null })],
    );
    expect(out).toHaveLength(1);
  });

  it('same player, different prop stats (pass yds vs rush yds) do not merge', () => {
    const out = reconcilePodcastPicks(
      [audioRow({ category: 'prop', player: 'Patrick Mahomes', subject: 'Patrick Mahomes', market: 'pass_yds', selection: 'OVER', line: 275.5 })],
      [videoItem({ market: 'player_rushing_yards', player: 'Patrick Mahomes', team: 'KC', side: 'OVER', line: 19.5 })],
    );
    expect(out).toHaveLength(2);
  });

  it('same player, same stat in two taxonomies does merge', () => {
    expect(normalizePropSubMarket('Passing Yards')).toBe(normalizePropSubMarket('player_pass_yds'));
    const out = reconcilePodcastPicks(
      [audioRow({ category: 'prop', player: 'Patrick Mahomes', subject: 'Patrick Mahomes', market: 'Passing Yards', selection: 'OVER', line: 275.5 })],
      [videoItem({ market: 'player_passing_yds', player: 'Patrick Mahomes', team: 'KC', side: 'OVER', line: 275.5 })],
    );
    expect(out).toHaveLength(1);
  });

  it('YouTube-only prop keeps OVER/UNDER as selection and the player as subject', () => {
    const [p] = reconcilePodcastPicks([], [videoItem({ market: 'player_rec_yds', player: 'Travis Kelce', team: 'KC', side: 'UNDER', line: 64.5 })]);
    expect(p.pick.selection).toBe('UNDER');
    expect(p.pick.subject).toBe('Travis Kelce');
  });

  it('YouTube-only player-award future keeps the player as subject, not the team', () => {
    const [p] = reconcilePodcastPicks([], [videoItem({ market: 'mvp', player: 'Josh Allen', team: 'BUF', side: 'YES', line: null })]);
    expect(p.pick.subject).toBe('Josh Allen');
  });
});

describe('_futuresMarketMatches (R2-A3)', () => {
  let match;
  beforeAll(async () => { ({ _futuresMarketMatches: match } = await import('../../src/lib/supabase.js')); });
  it('canonical query matches audio and merged picks with audio labels', () => {
    expect(match('super_bowl_winner', { subject_market: 'Super_Bowl' })).toBe(true);
    expect(match('Offensive Rookie of the Year', { subject_market: 'Offensive_ROY' })).toBe(true);
    expect(match('Most Valuable Player', { subject_market: 'MVP' })).toBe(true);
    expect(match('make_playoffs', { subject_market: 'Playoffs' })).toBe(true);
  });
  it('make vs miss playoffs never cross-match', () => {
    expect(match('make_playoffs', { market: 'miss_playoffs', subject: 'DAL' })).toBe(false);
  });
  it('conference queries are scoped by conference', () => {
    expect(match('AFC', { market: 'conference_winner', subject: 'PHI' })).toBe(false);
    expect(match('AFC', { market: 'conference_winner', subject: 'BUF' })).toBe(true);
    expect(match('conference_winner', { subject_market: 'AFC' })).toBe(true);
  });
  it('division queries are scoped by division (incl. division win totals)', () => {
    expect(match('AFC_North', { market: 'division_winner', subject: 'BAL' })).toBe(true);
    expect(match('AFC_North', { market: 'division_winner', subject: 'KC' })).toBe(false);
    expect(match('AFC_North', { subject_market: 'AFC_South' })).toBe(false);
    expect(match('division_winner', { subject_market: 'AFC_North' })).toBe(true);
    expect(match('NFC_West_Win_Total', { market: 'win_total', subject: 'SEA' })).toBe(true);
    expect(match('NFC_West_Win_Total', { market: 'win_total', subject: 'KC' })).toBe(false);
  });
});

describe('Saints "NO" team code (round 2 follow-up)', () => {
  it('a Saints spread pick keeps its team and merges across pipelines', () => {
    const out = reconcilePodcastPicks(
      [audioRow({ selection: 'NO', subject: 'NO', team1: 'NO', team2: 'ATL', line: -3 })],
      [videoItem({ team: 'NO', side: 'NO', market: 'spread', line: -3 })],
    );
    expect(out).toHaveLength(1);
    expect(out[0].team).toBe('NO');
    expect(out[0].teams).toEqual(expect.arrayContaining(['NO', 'ATL']));
  });

  it('"NO" as an answer on a non-Saints Yes/No future still conflicts with YES', () => {
    const out = reconcilePodcastPicks(
      [audioRow({ category: 'future', subject_market: 'make_playoffs', selection: 'NO', subject: 'DAL', team1: 'DAL', team2: null, line: null })],
      [videoItem({ market: 'make_playoffs', team: 'DAL', side: 'YES', line: null })],
    );
    expect(out).toHaveLength(2);
  });
});

describe('round 3 (R3-A1 / A2 / A3)', () => {
  it('Saints as team2 keep their pick: selection "NO" resolves to the Saints', () => {
    const out = reconcilePodcastPicks(
      [audioRow({ selection: 'NO', subject: null, team1: 'ATL', team2: 'NO', line: 3 })],
      [videoItem({ team: 'NO', side: 'NO', market: 'spread', line: 3 })],
    );
    expect(out).toHaveLength(1);
    expect(out[0].team).toBe('NO');
  });

  it('Saints make-playoffs YES and NO never merge', () => {
    const out = reconcilePodcastPicks(
      [audioRow({ category: 'future', subject_market: 'make_playoffs', selection: 'NO', subject: 'NO', team1: 'NO', team2: null, line: null })],
      [videoItem({ market: 'make_playoffs', team: 'NO', side: 'YES', line: null })],
    );
    expect(out).toHaveLength(2);
  });

  it('YouTube make-playoffs pick keeps YES/NO as its selection', () => {
    const out = reconcilePodcastPicks([], [videoItem({ market: 'make_playoffs', team: 'DAL', side: 'NO', line: null })]);
    expect(out[0].pick.selection).toBe('NO');
    expect(out[0].pick.subject).toBe('DAL');
  });

  it('YouTube player-award future keeps the player as selection and subject', () => {
    const out = reconcilePodcastPicks([], [videoItem({ market: 'mvp', player: 'Josh Allen', team: 'BUF', side: 'YES', line: null })]);
    expect(out[0].pick.selection).toBe('Josh Allen');
    expect(out[0].pick.subject).toBe('Josh Allen');
  });

  it('seed markets are not playoff markets', () => {
    expect(normalizeFuturesSubMarket('playoff_no_1_seed')).toBe('conference_no_1_seed');
    expect(normalizeFuturesSubMarket('AFC_1_Seed')).toBe('conference_no_1_seed');
    expect(normalizeFuturesSubMarket('COY')).toBe('coach_of_the_year');
    expect(normalizeFuturesSubMarket('CPOY')).toBe('comeback_player_of_the_year');
  });

  it('prop stat names compare equal across singular/plural/alias forms', async () => {
    const { normalizePropSubMarket } = await import('../../src/lib/podcastReconciler.js');
    expect(normalizePropSubMarket('player_reception_yds')).toBe(normalizePropSubMarket('receiving_yards'));
    expect(normalizePropSubMarket('pass_td')).toBe(normalizePropSubMarket('passing_touchdowns'));
    expect(normalizePropSubMarket('pass_int')).toBe(normalizePropSubMarket('passing_interceptions'));
    expect(normalizePropSubMarket('rush_rec_yds')).not.toBe(normalizePropSubMarket('rec_yds'));
    expect(normalizePropSubMarket('receptions')).not.toBe(normalizePropSubMarket('receiving_yards'));
  });

  it('same player, same stat in different words still merges (pass_td vs passing_touchdowns)', () => {
    const out = reconcilePodcastPicks(
      [audioRow({ category: 'prop', player: 'Patrick Mahomes', subject: 'Patrick Mahomes', subject_market: 'pass_td', selection: 'OVER', line: 1.5 })],
      [videoItem({ market: 'player_passing_touchdowns', player: 'Patrick Mahomes', team: 'KC', side: 'OVER', line: 1.5 })],
    );
    expect(out).toHaveLength(1);
  });
});

describe('_futuresMarketMatches (R3-A2)', () => {
  let match;
  beforeAll(async () => { ({ _futuresMarketMatches: match } = await import('../../src/lib/supabase.js')); });

  it('division/conference tokens are found anywhere in the label', () => {
    expect(match('division_afc_north', { subject_market: 'AFC_North', subject: 'BAL' })).toBe(true);
    expect(match('division_afc_north', { subject_market: 'AFC_South', subject: 'HOU' })).toBe(false);
    expect(match('conference_afc', { market: 'conference_winner', subject: 'KC' })).toBe(true);
    expect(match('conference_afc', { market: 'conference_winner', subject: 'PHI' })).toBe(false);
  });

  it('falls through to team1/selection when subject is a label, not a team', () => {
    expect(match('NFC_North', { market: 'division_winner', subject: 'NFC North', selection: 'DET' })).toBe(true);
    expect(match('NFC_North', { market: 'division_winner', subject: 'NFC North', selection: 'DAL' })).toBe(false);
  });
});
