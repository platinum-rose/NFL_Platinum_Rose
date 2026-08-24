/**
 * Unit tests for src/lib/predictionMarketStore.js -- getContractForGame()
 *
 * Checkpoint 1 (2026-08-21 unified repair plan, AUDIT-CX-006 / item 4):
 * matchup-card prediction-market badges must only ever come from a contract
 * that explicitly names BOTH teams in the game -- never a single-team
 * award/win-totals/division/futures contract "attached" to whichever team
 * happens to be playing.
 *
 * The previous implementation used `text.includes(teamCode)` substring
 * matching, which produced false positives whenever a 2-3 letter team code
 * happened to appear inside an unrelated word (e.g. "NE" inside "ONE", "CAR"
 * inside "CARSON", "TB" inside "FOOTBALL"). A source-level audit against the
 * real prediction-markets snapshot (data/prediction-markets/latest.json)
 * found this misattributed a contract to 179 of 321 scheduled games (56%).
 * Each "false positive" test below reproduces one of those exact real
 * contracts from the snapshot and asserts the whole-token fix (lib/teams.js
 * normalizeTeam) no longer matches it to an unrelated game.
 *
 * Each test mocks its own fixture and dynamically imports the module under
 * test (via vi.resetModules + vi.doMock) so the two JSON data-source mocks
 * can vary per case without leaking between tests.
 *
 * Run: npx vitest run tests/unit/predictionMarketStore.test.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

async function loadWithContracts(contracts) {
  vi.doMock('../../data/prediction-markets/latest.json', () => ({
    default: { contracts },
  }));
  vi.doMock('../../data/prediction-markets/sample-nfl-contracts.json', () => ({ default: [] }));
  const mod = await import('../../src/lib/predictionMarketStore.js');
  return mod.getContractForGame;
}

describe('getContractForGame', () => {
  it('matches a contract that explicitly names both teams', async () => {
    const getContractForGame = await loadWithContracts([
      {
        title: 'Panthers vs. Cardinals',
        ticker: 'nfl-car-ari-2026-08-07',
        team: null,
        market_type: 'general',
        exchange: 'polymarket',
      },
    ]);
    const contract = getContractForGame('CAR', 'ARI');
    expect(contract).not.toBeNull();
    expect(contract.ticker).toBe('nfl-car-ari-2026-08-07');
  });

  it('does NOT misattribute a single-team QB-prop contract to CAR@ARI just because "Carson" contains "CAR" (real audit false positive)', async () => {
    const getContractForGame = await loadWithContracts([
      {
        title: 'Will Carson Beck be starting quarterback for Arizona in Week 1?',
        ticker: 'KXSTARTINGQBWEEK1-W1-26SEP15-ARI-CBEC',
        team: null,
        market_type: 'general',
        exchange: 'kalshi',
      },
    ]);
    expect(getContractForGame('CAR', 'ARI')).toBeNull();
  });

  it('does NOT misattribute a single-team playoff-odds contract to IND@NE just because "one" contains "NE" (real audit false positive)', async () => {
    const getContractForGame = await loadWithContracts([
      {
        title: 'Will Indianapolis be one of the 2026-27 Pro Football playoff qualifiers?',
        ticker: 'KXNFLPLAYOFF-27-IND',
        team: null,
        market_type: 'make_playoffs',
        exchange: 'kalshi',
      },
    ]);
    expect(getContractForGame('IND', 'NE')).toBeNull();
  });

  it('does NOT misattribute a single-team win-totals contract to TB@NYJ just because "football" contains "TB" (real audit false positive)', async () => {
    const getContractForGame = await loadWithContracts([
      {
        title: 'Will the New York J pro football team win at least 9 games this season?',
        ticker: 'KXNFLWINS-27NYJ-9',
        team: null,
        market_type: 'win_totals',
        exchange: 'kalshi',
      },
    ]);
    expect(getContractForGame('TB', 'NYJ')).toBeNull();
  });

  it('matches a real two-team contract even when market_type is mistagged as division/conference (source data is inconsistent, so market_type is not used as a filter)', async () => {
    const getContractForGame = await loadWithContracts([
      {
        title: 'NFL Saturday: Giants vs. Eagles',
        ticker: 'nfl-saturday-giants-vs-eagles',
        team: null,
        market_type: 'division', // mistagged in the real feed; this is genuinely a per-game contract
        exchange: 'polymarket',
      },
    ]);
    const contract = getContractForGame('NYG', 'PHI');
    expect(contract).not.toBeNull();
  });

  it('returns null for an unrecognized or missing team code instead of throwing', async () => {
    const getContractForGame = await loadWithContracts([]);
    expect(getContractForGame('ZZZ', 'ARI')).toBeNull();
    expect(getContractForGame('CAR', '')).toBeNull();
    expect(getContractForGame(null, undefined)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Checkpoint 1 fix pass #2 (2026-08-21, Codex review of Claude's first
// Checkpoint 1 pass): the team-only + wording match above still attached
// wrong-date contracts -- real preseason/prior-season/rematch contracts
// between the same two teams -- to unrelated regular-season games. These
// tests reproduce Codex's exact live-browser-audit examples and assert the
// new date-agreement logic (`getContractForGame`'s 3rd `gameDateStr` arg)
// fixes them.
// ─────────────────────────────────────────────────────────────────────────
describe('getContractForGame -- date agreement (Codex Checkpoint 1 review, P1 #1)', () => {
  it('rejects a contract dated for a different season/week than the scheduled game (real audit example: DEN@KC W1 2026-09-15 vs. a 2025-11-16 Chiefs/Broncos contract)', async () => {
    const getContractForGame = await loadWithContracts([
      {
        title: 'Chiefs vs. Broncos: 1H Moneyline',
        ticker: 'nfl-kc-den-2025-11-16-1h-moneyline-411',
        team: null,
        market_type: 'general',
        exchange: 'polymarket',
      },
    ]);
    expect(getContractForGame('DEN', 'KC', '2026-09-15T17:00:00Z')).toBeNull();
    // Without a game date to compare against, a single dated candidate is
    // still trusted (can't prove a mismatch) -- this is the pre-existing,
    // intentionally-permissive fallback for callers that don't pass one.
    expect(getContractForGame('DEN', 'KC')).not.toBeNull();
  });

  it('rejects a preseason-dated contract attached to the later regular-season rematch, but attaches it to the actual preseason game (real audit example: SEA/KC)', async () => {
    const getContractForGame = await loadWithContracts([
      {
        title: 'Seahawks vs. Chiefs',
        ticker: 'nfl-sea-kc-2026-08-29',
        team: null,
        market_type: 'general',
        exchange: 'polymarket',
      },
    ]);
    // Week 7 regular-season meeting (per the audit): wrong date -- no badge.
    expect(getContractForGame('KC', 'SEA', '2026-10-26T20:05:00Z')).toBeNull();
    // The actual preseason game this contract is about: correct date -- badge.
    expect(getContractForGame('KC', 'SEA', '2026-08-29T00:00:00Z')).not.toBeNull();
  });

  it('rejects a preseason-dated contract attached to a later regular-season game (real audit example: LAC/HOU)', async () => {
    const getContractForGame = await loadWithContracts([
      {
        title: 'Chargers vs. Texans',
        ticker: 'nfl-lac-hou-2026-08-14',
        team: null,
        market_type: 'general',
        exchange: 'polymarket',
      },
    ]);
    expect(getContractForGame('HOU', 'LAC', '2026-11-08T18:00:00Z')).toBeNull();
    expect(getContractForGame('HOU', 'LAC', '2026-08-14T00:00:00Z')).not.toBeNull();
  });

  it('does not attach a hypothetical "in their January 30 matchup" prop to a September game -- and rejects it on wording alone regardless of date (real audit example: SF@LAR)', async () => {
    const getContractForGame = await loadWithContracts([
      {
        title: 'NFL: Will the Rams beat the 49ers by more than 3.5 points in their January 30 matchup?',
        ticker: 'nfl-will-the-rams-beat-the-49ers-by-more-than-35-points-in-their-january-30-matchup',
        team: null,
        market_type: 'conference',
        exchange: 'polymarket',
      },
    ]);
    // No head-to-head connector ("vs."/"@"/"at"/"versus") in the title --
    // this is a prop about a hypothetical future matchup, not a per-game
    // matchup ticket, so it's rejected before date logic even runs.
    expect(getContractForGame('SF', 'LAR', '2026-09-11T00:00:00Z')).toBeNull();
    expect(getContractForGame('SF', 'LAR', '2027-01-30T00:00:00Z')).toBeNull();
  });

  it('allows a small tolerance for UTC-vs-local calendar-day rollover on late-kickoff games', async () => {
    const getContractForGame = await loadWithContracts([
      {
        title: 'Eagles vs. Cowboys',
        ticker: 'nfl-phi-dal-2026-09-14',
        team: null,
        market_type: 'general',
        exchange: 'polymarket',
      },
    ]);
    // Sunday Night Football kickoff local Sept 14, already rolled to Sept 15 in UTC.
    expect(getContractForGame('PHI', 'DAL', '2026-09-15T00:20:00Z')).not.toBeNull();
  });

  it('does not guess between two ambiguous undated contracts for the same rematch pair (division rivals playing twice)', async () => {
    const getContractForGame = await loadWithContracts([
      { title: 'Packers vs. Bears', ticker: 'nfl-gb-chi-a', team: null, market_type: 'general', exchange: 'polymarket' },
      { title: 'Packers vs. Bears', ticker: 'nfl-gb-chi-b', team: null, market_type: 'general', exchange: 'polymarket' },
    ]);
    expect(getContractForGame('CHI', 'GB')).toBeNull();
    expect(getContractForGame('CHI', 'GB', '2026-09-20T17:00:00Z')).toBeNull();
  });
});
