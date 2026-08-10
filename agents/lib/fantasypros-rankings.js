// agents/lib/fantasypros-rankings.js
// Pure mapping logic for the FantasyPros weekly/draft rankings ingest (F-26c part 2).
// No I/O — see agents/fantasypros-rankings-ingest.js for the CLI/fetch/Supabase wrapper.
// Spec: docs/FANTASYPROS_API_INTEGRATION_SCOPE_2026-08-09.md §2
// Tested: tests/unit/fantasyProsRankings.test.js

export const RANKING_POSITIONS = ['QB', 'RB', 'WR', 'TE'];

// Real query values for consensus-rankings' `type` param, confirmed live 2026-08-09
// (the docs page for this endpoint doesn't spell out the enum — these were found by
// testing, not read from documentation): ST = season-long/draft ECR, WEEKLY = weekly.
export const RANKING_TYPE_DRAFT = 'ST';
export const RANKING_TYPE_WEEKLY = 'WEEKLY';

const SCORING_PARAM = { ppr: 'PPR', half: 'HALF', standard: 'STD' };
export function scoringParam(scoring) {
  return SCORING_PARAM[scoring] || 'PPR';
}

// Number(null) is 0, not NaN (see agents/lib/fantasypros-adp.js's regression note) —
// every numeric field pulled off the API response goes through this so a missing value
// becomes null, never a silently-wrong 0.
function toNum(v) {
  return v !== null && v !== undefined && v !== '' ? Number(v) : null;
}

// Maps one /nfl/{season}/consensus-rankings response (already scoped to a single
// position by the caller — this endpoint requires one position per call, `ALL` is
// rejected) onto the fantasy_rankings table shape (migration 046).
export function mapConsensusRankings(data, { season, week = 0, scoring = 'ppr' } = {}) {
  const players = Array.isArray(data?.players) ? data.players : [];
  const totalExperts = toNum(data?.total_experts);

  return players
    .map((p) => ({
      player: p.player_name,
      player_id: null,
      position: p.player_position_id,
      team: p.player_team_id || null,
      season,
      week,
      scoring,
      rank_ecr: toNum(p.rank_ecr),
      pos_rank: p.pos_rank || null,
      rank_min: toNum(p.rank_min),
      rank_max: toNum(p.rank_max),
      rank_std: toNum(p.rank_std),
      tier: toNum(p.tier),
      total_experts: totalExperts,
      opponent: p.player_opponent || null,
      owned_avg: toNum(p.player_owned_avg),
      source: 'fantasypros',
      as_of_date: null, // stamped by the caller
    }))
    // rank_ecr is the one field this table can't function without — everything else
    // (min/max/std/tier/opponent/owned_avg) is optional context.
    .filter((r) => r.rank_ecr !== null);
}

// FantasyPros' consensus-rankings response can contain two entries for the same player
// within one position call (found live 2026-08-09 — Postgres' `ON CONFLICT DO UPDATE`
// can't affect the same target row twice in one statement, which surfaced this as an
// upsert error rather than silently double-writing). Root cause on FantasyPros' side is
// unconfirmed (possibly a trade-transition artifact); this dedupes defensively rather
// than assuming it won't happen again. Keeps the row with the lower (better) rank_ecr;
// ties broken by first-seen. Logs what it collapsed so a real data problem stays visible
// instead of being silently swallowed.
export function dedupeRankings(records, { onDuplicate } = {}) {
  const byKey = new Map();
  for (const r of records) {
    const key = [r.player, r.position, r.season, r.week, r.scoring, r.source, r.as_of_date].join('|');
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, r);
    } else if (r.rank_ecr < existing.rank_ecr) {
      byKey.set(key, r);
      if (onDuplicate) onDuplicate(key, [existing, r]);
    } else if (onDuplicate) {
      onDuplicate(key, [existing, r]);
    }
  }
  return [...byKey.values()];
}
