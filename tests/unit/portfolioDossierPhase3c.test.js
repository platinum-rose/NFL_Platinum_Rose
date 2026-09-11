// tests/unit/portfolioDossierPhase3c.test.js
// Round 9 v8 step 5 / Phase 3c (Codex-approved at v5, 2026-09-11): wiring
// tests for the three sites migrated from raw, unpaginated Supabase reads
// onto fetchAllRows() -- fetchTeamStats() (nfl_team_season_stats),
// fetchSchedule() (games), fetchRefereeTendencies() (referee_tendencies).
// fetchAllRows() is mocked and the real, exported functions from
// portfolio-dossier.js are called directly, matching the wiring-test
// pattern established in tests/unit/pickSignalFloor.test.js for Phase 3b.
// portfolio-dossier.js's env validation + Supabase client creation are lazy
// (ensureEnv(), Phase 3b addendum) and only run from main(), so importing
// it here for these direct function calls never requires credentials or
// triggers a live dossier build.

import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../agents/lib/supabase-pagination.js', () => ({
  fetchAllRows: vi.fn(),
}));

describe('fetchTeamStats() wiring (Phase 3c site 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls fetchAllRows() with the widest column candidate first and the season 2023..SEASON filters', async () => {
    const { fetchAllRows } = await import('../../agents/lib/supabase-pagination.js');
    fetchAllRows.mockResolvedValueOnce([
      { team: 'Chiefs', season: 2025, wins: 10, losses: 5 },
      { team: 'Chiefs', season: 2024, wins: 8, losses: 9 },
    ]);
    const { fetchTeamStats, buildTeamStatsRequest } = await import('../../agents/portfolio-dossier.js');

    const byTeam = await fetchTeamStats();

    expect(fetchAllRows).toHaveBeenCalledTimes(1);
    const [label, request] = fetchAllRows.mock.calls[0];
    expect(label).toBe('fetchTeamStats');
    expect(request.table).toBe('nfl_team_season_stats');
    expect(request.select).toBe(
      'team, season, wins, losses, ats_wins, ats_losses, off_epa_per_play, def_epa_per_play, off_epa_rank, def_epa_rank, shotgun_rate, no_huddle_rate, pass_rate',
    );
    expect(request.filters).toEqual([
      { column: 'season', op: 'gte', value: 2023 },
      { column: 'season', op: 'lte', value: 2026 },
    ]);
    // buildTeamStatsRequest is exported standalone for exactly this assertion style.
    expect(buildTeamStatsRequest('team, season').select).toBe('team, season');

    // season-descending JS grouping preserved
    expect(byTeam.Chiefs.map((r) => r.season)).toEqual([2025, 2024]);
  });

  it('stops at the first candidate that succeeds and does not try narrower candidates', async () => {
    const { fetchAllRows } = await import('../../agents/lib/supabase-pagination.js');
    fetchAllRows.mockResolvedValueOnce([{ team: 'Bills', season: 2025, wins: 11, losses: 6 }]);
    const { fetchTeamStats } = await import('../../agents/portfolio-dossier.js');

    await fetchTeamStats();

    expect(fetchAllRows).toHaveBeenCalledTimes(1);
  });

  it('falls back to the second column candidate when the first candidate throws', async () => {
    const { fetchAllRows } = await import('../../agents/lib/supabase-pagination.js');
    fetchAllRows
      .mockRejectedValueOnce(new Error('column off_epa_per_play does not exist'))
      .mockResolvedValueOnce([{ team: 'Bills', season: 2025, wins: 11, losses: 6 }]);
    const { fetchTeamStats } = await import('../../agents/portfolio-dossier.js');

    const byTeam = await fetchTeamStats();

    expect(fetchAllRows).toHaveBeenCalledTimes(2);
    expect(fetchAllRows.mock.calls[1][1].select).toBe('team, season, wins, losses, ats_wins, ats_losses');
    expect(byTeam.Bills).toBeTruthy();
  });

  it('returns {} and emits the approved warning when all three candidates fail, without throwing', async () => {
    const { fetchAllRows } = await import('../../agents/lib/supabase-pagination.js');
    fetchAllRows.mockRejectedValue(new Error('relation does not exist'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { fetchTeamStats } = await import('../../agents/portfolio-dossier.js');

    const byTeam = await fetchTeamStats();

    expect(fetchAllRows).toHaveBeenCalledTimes(3);
    expect(byTeam).toEqual({});
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('all column-list candidates failed'));
    warnSpy.mockRestore();
  });
});

describe('fetchSchedule() wiring (Phase 3c site 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls fetchAllRows() with game_id already selected first and the season filter', async () => {
    const { fetchAllRows } = await import('../../agents/lib/supabase-pagination.js');
    fetchAllRows.mockResolvedValueOnce([{ game_id: 'g1', season: 2026 }]);
    const { fetchSchedule, buildScheduleRequest } = await import('../../agents/portfolio-dossier.js');

    const rows = await fetchSchedule();

    expect(fetchAllRows).toHaveBeenCalledWith(
      'fetchSchedule',
      expect.objectContaining({
        table: 'games',
        filters: [{ column: 'season', op: 'eq', value: 2026 }],
      }),
    );
    const request = buildScheduleRequest();
    expect(request.select.split(',')[0].trim()).toBe('game_id');
    expect(rows).toEqual([{ game_id: 'g1', season: 2026 }]);
  });

  it('degrades to [] and warns on a query error, without throwing', async () => {
    const { fetchAllRows } = await import('../../agents/lib/supabase-pagination.js');
    fetchAllRows.mockRejectedValueOnce(new Error('network down'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { fetchSchedule } = await import('../../agents/portfolio-dossier.js');

    const rows = await fetchSchedule();

    expect(rows).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('SoS disabled'));
    warnSpy.mockRestore();
  });
});

describe('fetchRefereeTendencies() wiring (Phase 3c site 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls fetchAllRows() against referee_tendencies with no filters and groups by referee', async () => {
    const { fetchAllRows } = await import('../../agents/lib/supabase-pagination.js');
    fetchAllRows.mockResolvedValueOnce([
      { referee: 'Ed Hochuli', games_officiated: 200, avg_total_points: 45.2, avg_total_penalties: 12.1, home_win_pct: 0.55 },
    ]);
    const { fetchRefereeTendencies, buildRefereeTendenciesRequest } = await import('../../agents/portfolio-dossier.js');

    const byRef = await fetchRefereeTendencies();

    expect(fetchAllRows).toHaveBeenCalledWith(
      'fetchRefereeTendencies',
      expect.objectContaining({ table: 'referee_tendencies' }),
    );
    expect(buildRefereeTendenciesRequest().filters).toBeUndefined();
    expect(byRef['Ed Hochuli'].games_officiated).toBe(200);
  });

  it('degrades to {} and warns on a query error, without throwing', async () => {
    const { fetchAllRows } = await import('../../agents/lib/supabase-pagination.js');
    fetchAllRows.mockRejectedValueOnce(new Error('timeout'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { fetchRefereeTendencies } = await import('../../agents/portfolio-dossier.js');

    const byRef = await fetchRefereeTendencies();

    expect(byRef).toEqual({});
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('officiating context disabled'));
    warnSpy.mockRestore();
  });
});
