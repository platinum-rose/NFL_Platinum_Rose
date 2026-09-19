import { describe, expect, it } from 'vitest';
import { buildTextPickSignalRows, buildVisionGamePickRows, dedupeSignalRows } from '../../agents/lib/tweet-pick-signals.js';
import { linksFromResult } from '../../agents/lib/tweet-thread.js';

const ctx = { noteId: 7, eventRef: 'https://x.com/a/status/1', sourceLabel: 'Twitter/X Bookmarks (Personal)', author: 'A' };

describe('tweet pick signals', () => {
  it('keeps author picks, drops public-money stats, names the prop market', () => {
    const rows = buildTextPickSignalRows([
      { is_author_pick: true, bet_type: 'spread', team_or_market: 'Chicago Bears', selection: 'Chicago Bears', line: -4.5, odds: '-110', rationale: 'Wentz' },
      { is_author_pick: true, bet_type: 'player_prop', team_or_market: 'Justin Jefferson', market: 'receptions', selection: 'OVER', line: 6.5 },
      { is_author_pick: false, bet_type: 'spread', team_or_market: 'Dallas Cowboys', selection: 'Dallas Cowboys', line: -4 },
    ], ctx);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ note_id: 7, bet_type: 'spread', team_or_market: 'Chicago Bears', lean: 'Chicago Bears -4.5 (-110)', author: 'A' });
    expect(rows[1]).toMatchObject({ bet_type: 'player_prop', team_or_market: 'Justin Jefferson - receptions', lean: 'OVER 6.5' });
  });

  it('stores Vision game picks and dedupes overlaps', () => {
    const games = buildVisionGamePickRows([{ team: 'Chicago Bears', line: '-4.5' }, { team: 'Bears/Vikings', line: 'O48.5' }], ctx);
    expect(games.map((g) => g.bet_type)).toEqual(['spread_or_ml', 'total']);
    const dup = dedupeSignalRows([...games, ...games]);
    expect(dup).toHaveLength(2);
  });

  it('keeps outbound links but not links back to X', () => {
    const r = { legacy: { id_str: '1', entities: { urls: [
      { expanded_url: 'https://www.covers.com/nfl/week-2-ats-picks' },
      { expanded_url: 'https://x.com/Covers/status/2' },
    ] } } };
    expect(linksFromResult(r)).toEqual(['https://www.covers.com/nfl/week-2-ats-picks']);
  });
});
