// agents/lib/scoped-dossier.js
//
// Frozen pre-kickoff Wins/Playoffs-only scope (rev 8-19 design, hardened
// rev-20-review and rev-21-review, Codex CHANGES REQUESTED findings
// addressed 2026-09-12). Builds a NEW dossier view containing ONLY the two
// in-scope markets' synthesis_input rows, the team-profile fields the
// scoped prompts (agents/lib/scoped-prompts.js) actually document, the
// wins/playoffs-only slice of the experts map, and roster_churn.
//
// rev-21-review P1 fix: the previous version was a `...dossier` spread with
// a handful of overrides -- every top-level dossier field NOT explicitly
// overridden (sos, injuries, player_availability, schedule, detail, and
// meta's full contents including local_futures_imports' prediction-market
// metadata) passed straight through unfiltered. That is backwards for a
// function whose entire job is to be the minimal, structurally-safe input
// surface for a scope-restricted run. This version is a strict ALLOWLIST:
// the returned object has exactly five top-level keys (meta, team_profiles,
// synthesis_input, experts, roster_churn), each independently rebuilt field-
// by-field or filtered from the real dossier. A dossier field this function
// doesn't know about -- present today or added in some future dossier
// rebuild -- is dropped by omission, not by name, so it never needs someone
// to remember to blocklist it here. `experts` is also now filtered to only
// wins/playoffs picks (rev-21-review P1 finding #1: the unscoped experts
// map, naming ~109 analysts' picks across all 12 market types, was being
// serialized whole into the live model prompt by
// agents/lib/scoped-prompts.js's buildScopedUserPrompt()).
//
// rev-21-review P1 fix (finding #2, fail-closed input validation): this
// run's entire scope-safety argument rests on this function actually
// producing a minimal, correctly-shaped artifact -- so a malformed or
// unexpected-shaped input dossier (missing team_profiles, a team count that
// isn't exactly the 32 real NFL teams, a non-object synthesis_input/meta)
// now throws rather than silently coping with whatever exists. The 32-team
// check validates against the actual canonical team-key set from
// src/lib/teams.js (NFL_TEAMS), not merely a team COUNT of 32 -- a data
// corruption that drops one real team and duplicates another under a wrong
// key would still pass a bare count check but fails this one.
//
// Pure -- never mutates the input dossier. This is a completely separate
// path from slimDossierForPrompt() in agents/portfolio-synthesize.js
// (--shadow-slim), which trims row COUNTS for prompt-size reasons across
// EVERY market; this instead restricts which MARKETS, team-profile FIELDS,
// and META fields exist at all, for scope reasons, independent of
// --shadow-slim.

import { NFL_TEAMS } from '../../src/lib/teams.js';

export const SCOPED_MARKETS = ['wins', 'playoffs'];

const CANONICAL_TEAM_KEYS = new Set(Object.keys(NFL_TEAMS));

const SCOPED_TEAM_PROFILE_KEYS = [
  'team', 'prior', 'sos', 'analytics', 'dvoa', 'coaching_profile',
  'schedule_context', 'officiating_context', 'clv_signal', 'injuries',
  'player_availability', 'named_player_sizing_gate',
];

// Only the meta fields buildScopedUserPrompt() actually reads (season,
// snapshot_count, books) -- NOT local_futures_imports (source-file
// metadata that names prediction-market lanes, per Codex's finding),
// signal_coverage, evidence_lane_versions, or anything else meta carries.
const SCOPED_META_KEYS = ['season', 'snapshot_count', 'books'];

function isPlainObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function assertDossierShape(dossier) {
  if (!isPlainObject(dossier)) {
    throw new Error('buildScopedDossier: dossier is not a plain object');
  }
  if (!isPlainObject(dossier.meta)) {
    throw new Error('buildScopedDossier: dossier.meta is missing or not a plain object');
  }
  if (!isPlainObject(dossier.synthesis_input)) {
    throw new Error('buildScopedDossier: dossier.synthesis_input is missing or not a plain object');
  }
  if (!isPlainObject(dossier.team_profiles)) {
    throw new Error('buildScopedDossier: dossier.team_profiles is missing or not a plain object');
  }
  const teamKeys = Object.keys(dossier.team_profiles);
  if (teamKeys.length !== CANONICAL_TEAM_KEYS.size) {
    throw new Error(`buildScopedDossier: dossier.team_profiles has ${teamKeys.length} team(s), expected exactly ${CANONICAL_TEAM_KEYS.size} (the canonical NFL_TEAMS set)`);
  }
  const missing = [...CANONICAL_TEAM_KEYS].filter((t) => !dossier.team_profiles[t]);
  if (missing.length) {
    throw new Error(`buildScopedDossier: dossier.team_profiles is missing canonical team(s): ${missing.join(', ')}`);
  }
  const unexpected = teamKeys.filter((t) => !CANONICAL_TEAM_KEYS.has(t));
  if (unexpected.length) {
    throw new Error(`buildScopedDossier: dossier.team_profiles has unexpected/non-canonical team key(s): ${unexpected.join(', ')}`);
  }
  for (const team of teamKeys) {
    if (!isPlainObject(dossier.team_profiles[team])) {
      throw new Error(`buildScopedDossier: dossier.team_profiles["${team}"] is not a plain object`);
    }
  }
  if (dossier.experts !== undefined && !isPlainObject(dossier.experts)) {
    throw new Error('buildScopedDossier: dossier.experts is present but not a plain object');
  }
  if (dossier.roster_churn !== undefined && !isPlainObject(dossier.roster_churn)) {
    throw new Error('buildScopedDossier: dossier.roster_churn is present but not a plain object');
  }

  // rev-22-review P1 fix: the team_profiles completeness check above said
  // nothing about synthesis_input -- a missing market, a non-array market,
  // a short/long row count, or duplicate/missing team_nick rows all passed
  // straight through untouched, because buildScopedDossier() only copied
  // whatever was present ("if (dossier.synthesis_input[market] !==
  // undefined) ..."). Both SCOPED_MARKETS are now required, each must be
  // an array of exactly 32 plain-object rows, and the 32 rows' `team_nick`
  // values must be exactly the canonical 32-team set with no duplicates
  // and none missing -- the same fail-closed standard already applied to
  // team_profiles.
  for (const market of SCOPED_MARKETS) {
    const rows = dossier.synthesis_input[market];
    if (!Array.isArray(rows)) {
      throw new Error(`buildScopedDossier: dossier.synthesis_input.${market} is missing or not an array`);
    }
    if (rows.length !== CANONICAL_TEAM_KEYS.size) {
      throw new Error(`buildScopedDossier: dossier.synthesis_input.${market} has ${rows.length} row(s), expected exactly ${CANONICAL_TEAM_KEYS.size}`);
    }
    const seen = new Set();
    rows.forEach((row, i) => {
      if (!isPlainObject(row)) {
        throw new Error(`buildScopedDossier: dossier.synthesis_input.${market}[${i}] is not a plain object`);
      }
      if (typeof row.team_nick !== 'string' || !CANONICAL_TEAM_KEYS.has(row.team_nick)) {
        throw new Error(`buildScopedDossier: dossier.synthesis_input.${market}[${i}].team_nick is missing or not a canonical team (got ${JSON.stringify(row.team_nick)})`);
      }
      if (seen.has(row.team_nick)) {
        throw new Error(`buildScopedDossier: dossier.synthesis_input.${market} has a duplicate team_nick "${row.team_nick}"`);
      }
      seen.add(row.team_nick);
    });
    if (seen.size !== CANONICAL_TEAM_KEYS.size) {
      const missing = [...CANONICAL_TEAM_KEYS].filter((t) => !seen.has(t));
      throw new Error(`buildScopedDossier: dossier.synthesis_input.${market} is missing canonical team(s): ${missing.join(', ')}`);
    }
  }
}

function scopedTeamProfile(profile) {
  const out = {};
  for (const key of SCOPED_TEAM_PROFILE_KEYS) {
    if (profile[key] !== undefined) out[key] = profile[key];
  }
  return out;
}

function scopedMeta(meta) {
  const out = {};
  for (const key of SCOPED_META_KEYS) {
    if (meta[key] !== undefined) out[key] = meta[key];
  }
  return out;
}

// rev-21-review P1 fix (finding #1): filter each named analyst's picks down
// to only wins/playoffs entries; drop the analyst entirely if none of their
// picks are in scope. A malformed (non-array) picks list for a given
// analyst is treated as "no in-scope picks" rather than thrown -- the
// experts map is supplementary corroboration (Tier 2), not the structural
// backbone this function's fail-closed checks above protect; a single
// analyst's malformed entry silently contributing nothing is the correct
// fail-safe behavior here, not a reason to reject the entire dossier.
function scopedExperts(experts) {
  const out = {};
  for (const [name, picks] of Object.entries(experts || {})) {
    if (!Array.isArray(picks)) continue;
    const inScope = picks.filter((p) => isPlainObject(p) && SCOPED_MARKETS.includes(p.market));
    if (inScope.length) out[name] = inScope;
  }
  return out;
}

export function buildScopedDossier(dossier) {
  assertDossierShape(dossier);

  const synthesis_input = {};
  for (const market of SCOPED_MARKETS) {
    if (dossier.synthesis_input[market] !== undefined) synthesis_input[market] = dossier.synthesis_input[market];
  }

  const team_profiles = {};
  for (const [team, profile] of Object.entries(dossier.team_profiles)) {
    team_profiles[team] = scopedTeamProfile(profile);
  }

  // Explicit allowlist -- ONLY these five keys exist on the returned
  // object. Everything else on the real dossier (adjacent_signals, sos,
  // injuries, player_availability, schedule, detail, and any future field)
  // is dropped by omission.
  return {
    meta: scopedMeta(dossier.meta),
    team_profiles,
    synthesis_input,
    experts: scopedExperts(dossier.experts),
    roster_churn: dossier.roster_churn || {},
  };
}
