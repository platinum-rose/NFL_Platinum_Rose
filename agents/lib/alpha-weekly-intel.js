// Alpha packet — weekly intel section.
//
// WHY THIS EXISTS (2026-09-19): build-alpha-data-packet.js had no inputs from the Friday
// cadence at all. Steps 1-4 (player availability, projected starters, secondary matchup
// matrix, player-props intel) wrote their files and step 5 ignored them, shipping a static
// preseason injury list (src/lib/expertInjuries.js), Aug sportsbook context and a Sep 13
// recommendation file. It "completed successfully" every week, so nobody noticed — this
// happened in Week 1 and again in Week 2.
//
// The permanent fix is two-part:
//   1. The packet is built FROM the Friday outputs (this module shapes them).
//   2. The build FAILS LOUDLY if any Friday input is missing, stale, or for the wrong week,
//      instead of silently packaging old data. `--allow-stale` exists for deliberate offline
//      rebuilds and stamps every stale input into packet.weekly_intel.freshness.
//
// Pure functions only — no fs, no network — so the gate is unit-testable.

export const WEEKLY_INTEL_SCHEMA = 'alpha_weekly_intel_v1';
export const DEFAULT_MAX_INPUT_AGE_HOURS = 36;

// Repo paths of every Friday-cadence output the packet must consume. Keep in sync with
// scripts/toolbox.mjs `case 'friday'`. A unit test asserts the build script reads each one.
export const WEEKLY_INTEL_INPUTS = Object.freeze({
  player_availability: 'data/player-availability/latest.json',
  projected_starters: 'data/projected-starters/2026/latest.json',
  secondary_matchups: 'data/secondary-matchups/latest.json',
  player_props_intel: 'data/research-intel/review/player-props-intel-latest.json',
});

const GAME_STATUS_EVENT_TYPES = new Set(['out', 'doubtful', 'ir', 'pup', 'suspension', 'setback', 'limited', 'limited_return', 'return_to_practice']);
const GAME_STATUS_RAW = /^(out|doubtful|questionable|probable|ir|injured reserve|pup|suspended)$/i;

function generatedAtOf(json) {
  return json?.meta?.generated_at || json?.generated_at || null;
}

function weekOf(json) {
  const week = json?.meta?.week ?? json?.week;
  return week == null ? null : Number(week);
}

// Evaluate one input. `requiresWeek` inputs must carry a week field equal to currentWeek.
export function checkInputFreshness({ key, json, now, currentWeek, maxAgeHours = DEFAULT_MAX_INPUT_AGE_HOURS, requiresWeek = false }) {
  const problems = [];
  if (!json) {
    return { key, ok: false, generated_at: null, age_hours: null, week: null, problems: ['missing'] };
  }
  const generatedAt = generatedAtOf(json);
  const nowMs = new Date(now).getTime();
  let ageHours = null;
  if (!generatedAt || Number.isNaN(Date.parse(generatedAt))) {
    problems.push('no generated_at timestamp');
  } else {
    ageHours = Number(((nowMs - Date.parse(generatedAt)) / 36e5).toFixed(2));
    if (ageHours > maxAgeHours) problems.push(`stale: ${ageHours}h old (max ${maxAgeHours}h)`);
    if (ageHours < -1) problems.push(`generated_at is ${Math.abs(ageHours)}h in the future`);
  }
  const week = weekOf(json);
  if (requiresWeek) {
    if (week == null) problems.push('no week field');
    else if (currentWeek != null && week !== Number(currentWeek)) problems.push(`week ${week} != current week ${currentWeek}`);
  }
  return { key, ok: problems.length === 0, generated_at: generatedAt, age_hours: ageHours, week, problems };
}

export function evaluateWeeklyIntelFreshness({ inputs = {}, now = new Date().toISOString(), currentWeek, maxAgeHours = DEFAULT_MAX_INPUT_AGE_HOURS } = {}) {
  const checks = [
    checkInputFreshness({ key: 'player_availability', json: inputs.player_availability, now, currentWeek, maxAgeHours }),
    checkInputFreshness({ key: 'projected_starters', json: inputs.projected_starters, now, currentWeek, maxAgeHours }),
    checkInputFreshness({ key: 'secondary_matchups', json: inputs.secondary_matchups, now, currentWeek, maxAgeHours, requiresWeek: true }),
    checkInputFreshness({ key: 'player_props_intel', json: inputs.player_props_intel, now, currentWeek, maxAgeHours, requiresWeek: true }),
  ];
  return {
    ok: checks.every((c) => c.ok),
    checked_at: now,
    current_week: currentWeek ?? null,
    max_age_hours: maxAgeHours,
    inputs: checks,
    errors: checks.filter((c) => !c.ok).map((c) => `${c.key} (${WEEKLY_INTEL_INPUTS[c.key]}): ${c.problems.join('; ')}`),
  };
}

// Game-status availability rows only (Out/Doubtful/Questionable/IR/PUP/limited etc.). Generic
// ESPN "Active" recap rows are excluded — they are not availability news.
export function gameStatusRows(availability) {
  return (availability?.events || [])
    .filter((e) => e.synthesis_eligible !== false)
    .filter((e) => GAME_STATUS_EVENT_TYPES.has(e.event_type) || GAME_STATUS_RAW.test(String(e.status_raw || '').trim()))
    .map((e) => ({
      player_name: e.player_name,
      team: e.team_abbr,
      position: e.position || null,
      status: e.status_raw || e.normalized_status || null,
      event_type: e.event_type,
      trend: e.availability_trend,
      injury_type: e.injury_type || null,
      impact_bucket: e.impact_bucket,
      summary: e.short_summary || null,
      source: e.source,
      published_at: e.published_at || null,
      probability_of_playing: e.probability_of_playing ?? null,
    }));
}

function groupBy(rows, keyFn) {
  const map = {};
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    (map[key] ||= []).push(row);
  }
  return map;
}

export function buildWeeklyIntelSection({ inputs = {}, freshness, currentWeek }) {
  const availability = inputs.player_availability || {};
  const starters = inputs.projected_starters || {};
  const secondary = inputs.secondary_matchups || {};
  const props = inputs.player_props_intel || {};

  const statusRows = gameStatusRows(availability);
  const starterRows = (starters.players || []).map((p) => ({
    team: p.team,
    player_name: p.player_name,
    position: p.position || null,
    role: p.role || null,
    starter_confidence: p.starter_confidence ?? null,
    needs_human_review: p.needs_human_review === true,
    evidence: p.sources?.[0]?.evidence || null,
  }));
  const matchups = (secondary.matchups || []).map((m) => ({
    game_id: m.game_id,
    kickoff_utc: m.kickoff_utc,
    offense_team: m.offense_team,
    defense_team: m.defense_team,
    vulnerability_tier: m.vulnerability_tier,
    severity_score: m.severity_score,
    elite_absence_count: m.elite_absence_count,
    weakness_tags: m.weakness_tags || [],
    secondary_absences: (m.secondary_absences || []).map((a) => ({
      player_name: a.player_name, position: a.position, event_type: a.event_type, impact_tier: a.impact_tier,
    })),
    target_receivers: (m.target_receivers || []).map((r) => r.player_name).filter(Boolean),
  }));

  return {
    schema: WEEKLY_INTEL_SCHEMA,
    week: currentWeek ?? null,
    recommendation_status: 'research_context_only_not_picks',
    freshness,
    availability: {
      generated_at: generatedAtOf(availability),
      meta: {
        event_count: availability.meta?.event_count ?? null,
        major_count: availability.meta?.major_count ?? null,
        worsening_count: availability.meta?.worsening_count ?? null,
        improving_count: availability.meta?.improving_count ?? null,
      },
      game_status_count: statusRows.length,
      by_team: groupBy(statusRows, (r) => r.team),
    },
    projected_starters: {
      generated_at: generatedAtOf(starters),
      player_count: starterRows.length,
      needs_human_review_count: starterRows.filter((r) => r.needs_human_review).length,
      by_team: groupBy(starterRows, (r) => r.team),
    },
    secondary_matchups: {
      generated_at: generatedAtOf(secondary),
      week: weekOf(secondary),
      matchup_count: matchups.length,
      matchups,
    },
    player_props: {
      generated_at: generatedAtOf(props),
      week: weekOf(props),
      summary: props.summary || null,
      props: props.props || [],
      parlay_cards: props.parlayCards || [],
    },
  };
}

// Per-team slice for nfl_team_dashboards[].
export function weeklyIntelForTeam(section, teamAbbr) {
  return {
    week: section.week,
    availability: section.availability.by_team[teamAbbr] || [],
    projected_starters: section.projected_starters.by_team[teamAbbr] || [],
    secondary_matchups: section.secondary_matchups.matchups.filter((m) => m.offense_team === teamAbbr || m.defense_team === teamAbbr),
    player_props: section.player_props.props.filter((p) => p.team === teamAbbr),
  };
}
