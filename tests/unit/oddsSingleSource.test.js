// tests/unit/oddsSingleSource.test.js
// ─────────────────────────────────────────────────────────────────────────────
// game-odds-ingest is the single scheduled TheOddsAPI caller (2026-09-24):
//   - detectMovements() derives line_movements rows (replacing odds-ingest.js)
//   - sync-live-market-lines rowsToEvents() rebuilds TheOddsAPI-shaped events
//     from game_odds_snapshots rows so the SuperContest comparison costs 0 credits.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const row = (o) => ({
  game_id: '2026_03_GB_ATL', home_team: 'GB', away_team: 'ATL',
  commence_time: '2026-09-25T00:15:00Z', book: 'draftkings',
  home_price: null, away_price: null, spread: null, total: null, ...o,
});

describe('game-odds-ingest — detectMovements', () => {
  let detectMovements;
  let readQuota;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('ODDS_API_KEY', '');
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    vi.stubEnv('DRY_RUN', 'true');
    const mod = await import('../../agents/game-odds-ingest.js');
    detectMovements = mod.detectMovements;
    readQuota = mod.readQuota;
  });
  afterEach(() => vi.unstubAllEnvs());

  const names = new Map([['2026_03_GB_ATL', { home: 'Green Bay Packers', away: 'Atlanta Falcons' }]]);

  it('emits spread / total / moneyline moves in the legacy line_movements shape', () => {
    const prev = [
      row({ market: 'spread', spread: -5.5, home_price: -110, away_price: -110 }),
      row({ market: 'total', total: 43, home_price: -110, away_price: -110 }),
      row({ market: 'moneyline', home_price: -240, away_price: 195 }),
    ];
    const curr = [
      row({ market: 'spread', spread: -4.5, home_price: -115, away_price: -105 }),
      row({ market: 'total', total: 42.5, home_price: -118, away_price: -102 }),
      row({ market: 'moneyline', home_price: -245, away_price: 200 }),
    ];
    const out = detectMovements(prev, curr, names, '2026-09-24T18:30:00.000Z');
    expect(out).toHaveLength(3);
    const spread = out.find(m => m.type === 'spread');
    expect(spread).toEqual({
      detected_at: '2026-09-24T18:30:00.000Z',
      game_key: 'Atlanta Falcons_Green Bay Packers',
      home_team: 'Green Bay Packers', away_team: 'Atlanta Falcons',
      book: 'draftkings', type: 'spread', from_line: -5.5, to_line: -4.5, movement: 1,
    });
    expect(out.find(m => m.type === 'total').movement).toBe(-0.5);
    expect(out.find(m => m.type === 'moneyline')).toMatchObject({ from_line: -240, to_line: -245, movement: -5 });
  });

  it('ignores unchanged lines, price-only spread changes, missing values and new games', () => {
    const prev = [row({ market: 'spread', spread: -5.5, home_price: -110 }), row({ market: 'total', total: null })];
    const curr = [
      row({ market: 'spread', spread: -5.5, home_price: -120 }),
      row({ market: 'total', total: 43 }),
      row({ game_id: '2026_03_NYG_TEN', market: 'spread', spread: -2.5 }),
    ];
    expect(detectMovements(prev, curr, names, 'x')).toEqual([]);
  });

  it('falls back to abbreviations when no full-name map entry exists', () => {
    const out = detectMovements([row({ market: 'spread', spread: -7 })], [row({ market: 'spread', spread: -6.5 })], new Map(), 'x');
    expect(out[0].game_key).toBe('ATL_GB');
  });

  it('readQuota parses the x-requests-* headers', () => {
    const res = { headers: new Map([['x-requests-remaining', '12'], ['x-requests-used', '488']]) };
    expect(readQuota(res)).toEqual({ remaining: 12, used: 488 });
    expect(readQuota({ headers: new Map() })).toEqual({ remaining: null, used: null });
  });
});

describe('sync-live-market-lines — rowsToEvents', () => {
  it('rebuilds TheOddsAPI event shape (home spread sign, over/under, WSH → Commanders)', async () => {
    const { rowsToEvents } = await import('../../scripts/sync-live-market-lines.mjs');
    const events = rowsToEvents([
      row({ market: 'spread', spread: -4.5, home_price: -115, away_price: -105 }),
      row({ market: 'total', total: 42.5, home_price: -118, away_price: -102 }),
      row({ market: 'moneyline', home_price: -245, away_price: 200 }),
      row({ game_id: '2026_03_WSH_SEA', home_team: 'WSH', away_team: 'SEA', market: 'spread', spread: 7, book: 'fanduel' }),
    ]);
    expect(events).toHaveLength(2);
    const gb = events.find(e => e.id === '2026_03_GB_ATL');
    expect(gb.home_team).toBe('Green Bay Packers');
    const dk = gb.bookmakers.find(b => b.key === 'draftkings');
    const spreads = dk.markets.find(m => m.key === 'spreads').outcomes;
    expect(spreads).toEqual([
      { name: 'Green Bay Packers', point: -4.5, price: -115 },
      { name: 'Atlanta Falcons', point: 4.5, price: -105 },
    ]);
    expect(dk.markets.find(m => m.key === 'totals').outcomes[0]).toEqual({ name: 'Over', point: 42.5, price: -118 });
    expect(dk.markets.find(m => m.key === 'h2h').outcomes[1]).toEqual({ name: 'Atlanta Falcons', price: 200 });
    expect(events.find(e => e.id === '2026_03_WSH_SEA').home_team).toBe('Washington Commanders');
  });
});
