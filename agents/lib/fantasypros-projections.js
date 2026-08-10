// agents/lib/fantasypros-projections.js
// Pure mapping logic for the FantasyPros consensus projections ingest (F-26c §3).
// No I/O — see agents/fantasypros-projections-ingest.js for the CLI/fetch/Supabase
// wrapper. Spec: docs/FANTASYPROS_API_INTEGRATION_SCOPE_2026-08-09.md §3
// Tested: tests/unit/fantasyProsProjections.test.js
//
// Field-name confidence, mixed on purpose — read before editing:
// CONFIRMED LIVE 2026-08-09 (docs/FANTASYPROS_API_INTEGRATION_SCOPE_2026-08-09.md
// §0/§3): `fpid`, `name`, `points`, `points_ppr`, `points_half`, `rush_att`,
// `rush_yds`, `rush_tds`, `rec_rec`, `rec_yds`, `rec_tds` — read directly, no
// fallback needed. UNCONFIRMED (the scope doc's "...etc." — passing stats
// weren't enumerated, and `position`/`team` weren't spelled out for this
// specific endpoint either, unlike /nfl/players and /consensus-rankings which
// each got their own confirmed field list): `position`/`team`, and every
// pass_* field. These go through firstDefined() fallback chains, same
// defensive pattern as agents/lib/fantasypros-injuries.js, and the same
// "verify before done" rule applies — dry-run this live on Andy's machine
// (Cowork sandbox can't make outbound fetch calls at all, see TASK_BOARD F-31)
// and correct the fallback list below against the real payload if it differs.

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
    .map((p) => ({
      fpid: p.fpid != null ? String(p.fpid) : null,
      player_id: null,
      player: p.name,
      position: firstDefined(p, ['position_id', 'position']) || position || null,
      team: firstDefined(p, ['team_id', 'team']),
      season,
      week,
      ros: !!ros,
      rec: toNum(p.rec_rec),
      rec_yds: toNum(p.rec_yds),
      rec_td: toNum(p.rec_tds),
      rush_att: toNum(p.rush_att),
      rush_yds: toNum(p.rush_yds),
      rush_td: toNum(p.rush_tds),
      pass_att: toNum(firstDefined(p, ['pass_att'])),
      pass_cmp: toNum(firstDefined(p, ['pass_cmp', 'pass_comp'])),
      pass_yds: toNum(firstDefined(p, ['pass_yds'])),
      pass_td: toNum(firstDefined(p, ['pass_tds', 'pass_td'])),
      interceptions: toNum(firstDefined(p, ['pass_int', 'interceptions', 'ints'])),
      fumbles_lost: toNum(firstDefined(p, ['fumbles_lost', 'fl'])),
      proj_std: toNum(p.points),
      proj_ppr: toNum(p.points_ppr),
      proj_half: toNum(p.points_half),
      source: 'fantasypros',
      as_of_date: null, // stamped by the caller
    }))
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
