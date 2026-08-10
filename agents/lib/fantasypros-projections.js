// agents/lib/fantasypros-projections.js
// Pure mapping logic for the FantasyPros consensus projections ingest (F-26c §3).
// No I/O — see agents/fantasypros-projections-ingest.js for the CLI/fetch/Supabase
// wrapper. Spec: docs/FANTASYPROS_API_INTEGRATION_SCOPE_2026-08-09.md §3
// Tested: tests/unit/fantasyProsProjections.test.js
//
// Field-name confidence — read before editing:
// CONFIRMED LIVE 2026-08-10 (Andy, raw-vs-mapped diagnostic dump against
// /nfl/2026/projections?position=QB — see tests/unit/fantasyProsProjections.test.js's
// REAL_JOSH_ALLEN_RESPONSE fixture for the exact captured payload): `fpid`,
// `name`, `position_id`, `team_id` are flat on the player object. ALL stat/
// points fields (`points`, `points_ppr`, `points_half`, `pass_att`,
// `pass_cmp`, `pass_yds`, `pass_tds`, `pass_ints`, `rush_att`, `rush_yds`,
// `rush_tds`, `rec_rec`, `rec_yds`, `rec_tds`, `fumbles`) live NESTED under a
// `stats` sub-object (`player.stats.points`, not `player.points`) — this was
// wrong in the first version of this file (assumed everything was flat, same
// as the confirmed §0/§1/§2 endpoints) and caused a real live dry-run to
// silently map 0/84 rows before being caught. `pass_ints` (not `pass_int`)
// and `fumbles` (not `fumbles_lost`) are the real field names — kept as
// fallback candidates below in case a different position's response varies,
// but the primary/first-checked name in each list is now the confirmed one.

export const PROJECTION_POSITIONS = ['QB', 'RB', 'WR', 'TE'];

function firstDefined(obj, keys) {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return null;
}

// Number(null) is 0, not NaN (see agents/lib/fantasypros-adp.js's regression
// note) — every numeric field pulled off the API response goes through this.
function toNum(v) {
  return v !== null && v !== undefined && v !== '' ? Number(v) : null;
}

// Maps one /nfl/{season}/projections response (already scoped to a single
// position by the caller) onto the fantasy_projections table shape (migration
// 047). Unlike mapConsensusRankings (fantasypros-rankings.js), no rank_ecr-style
// required field exists here — proj_ppr (or whichever scoring format matters
// to the caller) is the one field a row can't be useful without.
export function mapProjections(data, { season, week = 0, ros = false, position } = {}) {
  const players = Array.isArray(data?.players) ? data.players : [];

  return players
    .map((p) => {
      // BUG FOUND LIVE 2026-08-10 (Andy, raw-vs-mapped diagnostic dump against
      // /nfl/2026/projections?position=QB): every stat/points field lives
      // under a nested `stats` sub-object (p.stats.points, p.stats.rush_att,
      // ...), NOT flat on the player object the way §0's confirmed-field list
      // implied. fpid/name/position_id/team_id ARE flat and were correct.
      // `pass_ints` (not `pass_int`) is the real interceptions field. This is
      // exactly the "different endpoint, different shape" pattern already
      // documented for /nfl/players vs /consensus-rankings — read from `s`
      // below, not `p`, for every stat.
      const s = p.stats || {};
      return {
        fpid: p.fpid != null ? String(p.fpid) : null,
        player_id: null,
        player: p.name,
        position: firstDefined(p, ['position_id', 'position']) || position || null,
        team: firstDefined(p, ['team_id', 'team']),
        season,
        week,
        ros: !!ros,
        rec: toNum(s.rec_rec),
        rec_yds: toNum(s.rec_yds),
        rec_td: toNum(s.rec_tds),
        rush_att: toNum(s.rush_att),
        rush_yds: toNum(s.rush_yds),
        rush_td: toNum(s.rush_tds),
        pass_att: toNum(firstDefined(s, ['pass_att'])),
        pass_cmp: toNum(firstDefined(s, ['pass_cmp', 'pass_comp'])),
        pass_yds: toNum(firstDefined(s, ['pass_yds'])),
        pass_td: toNum(firstDefined(s, ['pass_tds', 'pass_td'])),
        interceptions: toNum(firstDefined(s, ['pass_ints', 'pass_int', 'interceptions', 'ints'])),
        fumbles_lost: toNum(firstDefined(s, ['fumbles', 'fumbles_lost', 'fl'])),
        proj_std: toNum(s.points),
        proj_ppr: toNum(s.points_ppr),
        proj_half: toNum(s.points_half),
        source: 'fantasypros',
        as_of_date: null, // stamped by the caller
      };
    })
    .filter((r) => r.player && (r.proj_std !== null || r.proj_ppr !== null || r.proj_half !== null));
}

// Same defensive dedupe as agents/lib/fantasypros-rankings.js's dedupeRankings
// — the §2 build found FantasyPros' API can return two entries for the same
// player within one position call (Postgres surfaces it as an "ON CONFLICT DO
// UPDATE command cannot affect row a second time" error on upsert). Applying
// the same guard here preemptively rather than waiting to hit it live.
// Keeps the row with the higher proj_ppr (better = more projected points);
// falls back to proj_std, then first-seen, if proj_ppr is null on both.
export function dedupeProjections(records, { onDuplicate } = {}) {
  const byKey = new Map();
  const score = (r) => r.proj_ppr ?? r.proj_std ?? r.proj_half ?? -Infinity;
  for (const r of records) {
    const key = [r.player, r.position, r.season, r.week, r.ros, r.source, r.as_of_date].join('|');
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, r);
    } else if (score(r) > score(existing)) {
      byKey.set(key, r);
      if (onDuplicate) onDuplicate(key, [existing, r]);
    } else if (onDuplicate) {
      onDuplicate(key, [existing, r]);
    }
  }
  return [...byKey.values()];
}
