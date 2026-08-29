import { afterEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

function restoreEnv() {
  if (ORIGINAL_ENV.SUPABASE_URL == null) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = ORIGINAL_ENV.SUPABASE_URL;
  if (ORIGINAL_ENV.SUPABASE_SERVICE_ROLE_KEY == null) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = ORIGINAL_ENV.SUPABASE_SERVICE_ROLE_KEY;
}

function queryResult(data, error = null) {
  return {
    select: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data, error }),
  };
}

async function importWithSupabaseMock(tables) {
  vi.resetModules();
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key';

  const client = {
    from: vi.fn((table) => tables[table] || queryResult([])),
  };

  vi.doMock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => client),
  }));

  const mod = await import('../../agents/lib/live-market-fallback.js');
  return { mod, client };
}

afterEach(() => {
  vi.doUnmock('@supabase/supabase-js');
  vi.resetModules();
  restoreEnv();
});

describe('live market fallback validation', () => {
  it('formats current futures win-total market context from Supabase snapshots', async () => {
    const futuresQuery = queryResult([{
      line: 10.5,
      over_price: -140,
      under_price: 115,
      book: 'draftkings',
      snapshot_time: '2026-08-26T12:00:00.000Z',
    }]);
    const { mod } = await importWithSupabaseMock({
      futures_odds_snapshots: futuresQuery,
    });

    const result = await mod.getLiveMarketContextOdds({ team: 'Buffalo Bills', market: 'win_total' });

    expect(futuresQuery.ilike).toHaveBeenCalledWith('team', '%Buffalo Bills%');
    expect(futuresQuery.in).toHaveBeenCalledWith('market_type', ['wins', 'win_total']);
    expect(result).toMatchObject({
      source_type: 'live_market_context',
      market: 'win_total',
      current_price: '10.5 wins (Over -140 / Under +115)',
      sportsbook: 'DraftKings',
      as_of: '2026-08-26T12:00:00.000Z',
    });
  });

  it('uses the new team-code map for full-name game market fallback', async () => {
    const gameQuery = queryResult([{
      spread: -2.5,
      total: 39.5,
      book: 'betmgm',
      captured_at: '2026-08-27T01:00:00.000Z',
    }]);
    const { mod } = await importWithSupabaseMock({
      game_odds_snapshots: gameQuery,
    });

    const result = await mod.getLiveMarketContextOdds({ team: 'Buffalo Bills', market: 'spread' });

    expect(gameQuery.or).toHaveBeenCalledWith('home_team.eq.BUF,away_team.eq.BUF');
    expect(result).toMatchObject({
      source_type: 'live_market_context',
      market: 'spread',
      current_price: 'Spread -2.5',
      sportsbook: 'BetMGM',
      as_of: '2026-08-27T01:00:00.000Z',
    });
  });

  it('keeps abbreviation input working for game market fallback', async () => {
    const gameQuery = queryResult([{
      home_price: -125,
      away_price: 105,
      book: 'circa',
      captured_at: '2026-08-27T02:00:00.000Z',
    }]);
    const { mod } = await importWithSupabaseMock({
      game_odds_snapshots: gameQuery,
    });

    const result = await mod.getLiveMarketContextOdds({ team: 'BUF', market: 'moneyline' });

    expect(gameQuery.or).toHaveBeenCalledWith('home_team.eq.BUF,away_team.eq.BUF');
    expect(result).toMatchObject({
      source_type: 'live_market_context',
      market: 'moneyline',
      current_price: 'Home -125 / Away 105',
      sportsbook: 'Circa Sports',
    });
  });

  it('does not substitute static benchmark odds for unknown teams', async () => {
    vi.resetModules();
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { applyMarketContextOdds } = await import('../../agents/lib/live-market-fallback.js');
    const lines = await applyMarketContextOdds({ teamName: 'London Monarchs', rawOddsList: [] });

    expect(lines).toHaveLength(5);
    expect(lines.every((line) => line.source_type === 'live_market_unavailable')).toBe(true);
  });
});
