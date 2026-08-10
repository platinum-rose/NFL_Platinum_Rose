// agents/lib/fantasypros-adp.js
// Pure mapping/ranking logic for the FantasyPros ADP ingest (F-26c part 1).
// No I/O — see agents/fantasypros-adp-ingest.js for the CLI/fetch/Supabase wrapper.
// Spec: docs/FANTASYPROS_API_INTEGRATION_SCOPE_2026-08-09.md §1
// Tested: tests/unit/fantasyProsAdp.test.js

export const ADP_POSITIONS = ['QB', 'RB', 'WR', 'TE'];

// Assigns a 1-based positional rank per position, sorted by `field` ascending.
// Non-finite values (null/undefined/NaN) sort last and are left unranked (null).
export function rankPositions(records, field) {
  const byPos = {};
  for (const r of records) (byPos[r.position] ??= []).push(r);
  for (const pos of Object.keys(byPos)) {
    byPos[pos]
      .slice()
      .sort((a, b) => {
        const av = Number.isFinite(a[field]) ? a[field] : Infinity;
        const bv = Number.isFinite(b[field]) ? b[field] : Infinity;
        return av - bv;
      })
      .forEach((r, i) => {
        r[`${field}_pos_rank`] = Number.isFinite(r[field]) ? i + 1 : null;
      });
  }
  return records;
}

// Maps raw /nfl/players response rows onto the fantasy_adp table shape
// (migration 034_fantasy_adp.sql). Filters to QB/RB/WR/TE, drops rows with no
// numeric ADP for the requested scoring format, computes positional rank and
// draft round ourselves rather than trusting an unverified API field.
//
// No half-PPR ADP field exists on this key/tier (confirmed live 2026-08-09) —
// only `rank_adp` (standard) and `rank_adp_ppr`.
export function mapFantasyProsPlayers(players, { scoring = 'ppr', asOf, teams = 12 } = {}) {
  const field = scoring === 'standard' ? 'rank_adp' : 'rank_adp_ppr';

  const filtered = (players || [])
    .filter((p) => ADP_POSITIONS.includes(p.position_id))
    .map((p) => ({
      player: p.player_name,
      player_id: null,
      position: p.position_id,
      team: p.team_id || null,
      // Number(null) is 0, not NaN — must gate on null/undefined before converting,
      // otherwise a player with no ADP silently ranks #1 (found via unit test 2026-08-09).
      adp: p[field] != null ? Number(p[field]) : NaN,
      adp_pos_rank: null,
      adp_round: null,
      scoring,
      source: 'fantasypros',
      as_of_date: asOf,
    }))
    .filter((r) => Number.isFinite(r.adp));

  rankPositions(filtered, 'adp');
  for (const r of filtered) {
    r.adp_round = Math.max(1, Math.ceil(r.adp / teams));
  }
  return filtered;
}
