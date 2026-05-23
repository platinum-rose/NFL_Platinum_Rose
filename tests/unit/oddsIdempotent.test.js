// tests/unit/oddsIdempotent.test.js
// ─────────────────────────────────────────────────────────────────────────────
// Verifies that both odds-ingest agents are idempotent within a one-hour
// window: captured_at / snapshot_time is pre-truncated to the UTC hour, and
// writeSnapshots calls upsert (not insert) with the correct onConflict key.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeSupa(mockUpsert) {
  return { from: vi.fn().mockReturnValue({ upsert: mockUpsert }) };
}

// ── game-odds-ingest ──────────────────────────────────────────────────────────

describe('game-odds-ingest — upsert idempotency', () => {
  let writeSnapshots;
  let truncateToHour;

  beforeEach(async () => {
    vi.resetModules();
    // Suppress main() from doing real work — ODDS_API_KEY absent → early return
    vi.stubEnv('ODDS_API_KEY', '');
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    vi.stubEnv('DRY_RUN', 'true');
    const mod = await import('../../agents/game-odds-ingest.js');
    writeSnapshots = mod.writeSnapshots;
    truncateToHour = mod.truncateToHour;
  });

  afterEach(() => vi.unstubAllEnvs());

  it('truncateToHour zeroes minutes, seconds, and milliseconds', () => {
    const result = truncateToHour(new Date('2026-05-23T14:37:22.456Z'));
    expect(result).toBe('2026-05-23T14:00:00.000Z');
  });

  it('truncateToHour preserves the date and hour', () => {
    expect(truncateToHour(new Date('2026-11-10T08:59:59.999Z')))
      .toBe('2026-11-10T08:00:00.000Z');
  });

  it('writeSnapshots calls upsert, not insert', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const supabase = makeSupa(upsert);

    await writeSnapshots(supabase, [
      { game_id: '2026_01_KC_BAL', book: 'draftkings', market: 'spread',
        captured_at: '2026-05-23T14:00:00.000Z', home_price: -110 },
    ]);

    expect(supabase.from).toHaveBeenCalledWith('game_odds_snapshots');
    expect(upsert).toHaveBeenCalledOnce();
    // must NOT be calling .insert — the mock chain only has .upsert
    const [, opts] = upsert.mock.calls[0];
    expect(opts).toBeDefined();
  });

  it('onConflict is game_id,book,market,captured_at', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const supabase = makeSupa(upsert);

    await writeSnapshots(supabase, [
      { game_id: '2026_01_KC_BAL', book: 'draftkings', market: 'moneyline',
        captured_at: '2026-05-23T14:00:00.000Z' },
    ]);

    const [, opts] = upsert.mock.calls[0];
    expect(opts.onConflict).toBe('game_id,book,market,captured_at');
  });

  it('second upsert call with identical rows does not grow the chunk list', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const supabase = makeSupa(upsert);
    const rows = [
      { game_id: '2026_01_KC_BAL', book: 'fanduel', market: 'total',
        captured_at: '2026-05-23T14:00:00.000Z' },
    ];

    await writeSnapshots(supabase, rows);
    await writeSnapshots(supabase, rows);

    // Both calls succeed (DB resolves duplicate via constraint); agent code
    // makes 2 calls which is correct — dedup happens inside Postgres.
    expect(upsert).toHaveBeenCalledTimes(2);
    const [chunk1] = upsert.mock.calls[0];
    const [chunk2] = upsert.mock.calls[1];
    expect(chunk1).toEqual(chunk2);
  });
});

// ── futures-odds-ingest ───────────────────────────────────────────────────────

describe('futures-odds-ingest — upsert idempotency', () => {
  let writeSnapshots;
  let truncateToHour;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('ODDS_API_KEY', '');
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    vi.stubEnv('DRY_RUN', 'true');
    const mod = await import('../../agents/futures-odds-ingest.js');
    writeSnapshots = mod.writeSnapshots;
    truncateToHour = mod.truncateToHour;
  });

  afterEach(() => vi.unstubAllEnvs());

  it('truncateToHour works the same as in game-odds-ingest', () => {
    expect(truncateToHour(new Date('2026-09-01T23:45:00.000Z')))
      .toBe('2026-09-01T23:00:00.000Z');
  });

  it('writeSnapshots calls upsert on futures_odds_snapshots (enhanced path)', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const supabase = makeSupa(upsert);

    await writeSnapshots(supabase, [
      { snapshot_time: '2026-05-23T14:00:00.000Z', market_type: 'superbowl',
        team: 'KC', book: 'draftkings', odds: -120, implied_prob: 0.5454,
        selection: 'KC', price: -120, captured_at: '2026-05-23T14:00:00.000Z',
        season: 2026 },
    ], true);

    expect(supabase.from).toHaveBeenCalledWith('futures_odds_snapshots');
    const [, opts] = upsert.mock.calls[0];
    expect(opts.onConflict).toBe('market_type,team,book,snapshot_time');
  });

  it('legacy-column path also uses upsert with same onConflict key', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const supabase = makeSupa(upsert);

    await writeSnapshots(supabase, [
      { snapshot_time: '2026-05-23T14:00:00.000Z', market_type: 'superbowl',
        team: 'PHI', book: 'fanduel', odds: 350, implied_prob: 0.2222,
        selection: 'PHI', price: 350, captured_at: '2026-05-23T14:00:00.000Z',
        season: 2026 },
    ], false);  // legacy path: strips enhanced columns before write

    const [, opts] = upsert.mock.calls[0];
    expect(opts.onConflict).toBe('market_type,team,book,snapshot_time');
  });

  it('empty row list returns 0 without calling supabase', async () => {
    const upsert = vi.fn();
    const supabase = makeSupa(upsert);

    const written = await writeSnapshots(supabase, [], true);

    expect(written).toBe(0);
    expect(upsert).not.toHaveBeenCalled();
  });
});
