// agents/lib/fantasypros-injuries.js
// Pure mapping logic for the FantasyPros injuries ingest (F-26c §4).
// No I/O — see scripts/build-player-availability.js for the fetch wrapper that
// calls this (extends the existing ESPN-based pipeline rather than a parallel one).
// Spec: docs/FANTASYPROS_API_INTEGRATION_SCOPE_2026-08-09.md §4
//
// UNCONFIRMED FIELD NAMES — read before changing without a live run.
// Unlike agents/lib/fantasypros-adp.js and fantasypros-rankings.js (both built
// against real live responses, confirmed 2026-08-09), this file was built
// without a successful live call: the Cowork sandbox cannot make outbound
// fetch() calls at all (confirmed live this session — same root cause as
// TASK_BOARD F-31, "Node's fetch/dns don't route through the sandbox's
// mandatory proxy"). The scope doc only gives the mapping *arrows*
// (injury_status ← status, short_comment ← comment, reported_at ←
// injury_update_date) plus the two genuinely new fields (probability_of_playing,
// practice_1/2/3) — it does not give exact raw player/team/position field names
// for this endpoint specifically, and every other FantasyPros endpoint in this
// repo uses DIFFERENT field names for the same concepts (players: player_name/
// position_id/team_id; consensus-rankings: player_name/player_position_id/
// player_team_id) — so guessing one shape and hardcoding it is exactly the kind
// of mistake this repo's own lessons-learned warns about. mapFantasyProsInjury()
// below checks several plausible field-name variants per value defensively
// instead. RUN THIS LIVE ON ANDY'S MACHINE FIRST (node scripts/build-player-
// availability.js --live-fantasypros-injuries --dry-run, or a one-off script
// that dumps the raw response) and correct the field list below against the
// real payload before trusting this in production — same "verify before done"
// standard §1-§3 were held to.

function firstDefined(obj, keys) {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return null;
}

// Maps one raw player-injury row from GET /nfl/injuries onto the generic
// injury-record shape agents/lib/player-availability.js's
// availabilityEventFromInjuryRecord() already accepts (same shape ESPN's
// flattenEspnInjuryGroups() produces in scripts/build-player-availability.js).
export function mapFantasyProsInjury(raw, { capturedAt } = {}) {
  const playerName = firstDefined(raw, ['player_name', 'name', 'player']);
  if (!playerName) return null;

  const status = firstDefined(raw, ['status', 'injury_status', 'status_short']);
  const comment = firstDefined(raw, ['comment', 'short_comment', 'notes']);
  const updateDate = firstDefined(raw, ['injury_update_date', 'update_date', 'reported_at', 'date']);
  const probability = firstDefined(raw, ['probability_of_playing', 'probability']);

  return {
    player_name: playerName,
    team_abbr: firstDefined(raw, ['team_id', 'team_abbr', 'team']),
    position: firstDefined(raw, ['position_id', 'position']),
    injury_status: status,
    injury_type: firstDefined(raw, ['injury_type', 'body_part', 'injury']),
    short_comment: comment,
    long_comment: firstDefined(raw, ['long_comment', 'notes']),
    // TIMEZONE CAVEAT (confirmed live 2026-08-10, not yet resolved): the real
    // API returns injury_update_date as a naive "YYYY-MM-DD HH:MM:SS" string
    // with no timezone marker (e.g. "2026-08-10 09:00:01") — unlike ESPN's
    // reported_at, which is a proper ISO string with an explicit "Z". new
    // Date(naiveString) parses it in the RUNNING MACHINE's local timezone, so
    // this value's absolute instant shifts depending on where the ingest runs
    // (Andy's machine vs. a future CI runner) — confirmed live: "09:00:01"
    // came back as "16:00:01Z" when run from a Pacific-time machine in August
    // (PDT, UTC-7), which is consistent with FantasyPros meaning Eastern time
    // (09:00 ET on a summer/DST day = 13:00 UTC, NOT 16:00 UTC — so this may
    // actually be off by several hours even under that guess; the *local*
    // interpretation and an Eastern interpretation don't obviously agree
    // either). Left as-is rather than guessing a specific offset — this field
    // is informational only (not part of any unique constraint, join key, or
    // dedupe key), so a several-hour skew doesn't corrupt data, only display
    // precision. Fix properly once FantasyPros' actual source timezone is
    // confirmed (their docs page doesn't state it).
    reported_at: updateDate ? new Date(updateDate).toISOString() : null,
    captured_at: capturedAt || new Date().toISOString(),
    source: 'FantasyPros injuries API',
    source_type: 'structured_injury',
    source_url: 'https://api.fantasypros.com/public/v2/json/nfl/injuries',
    // Genuinely new fields (see file header) — carried through raw, not
    // reshaped, since availabilityEventFromInjuryRecord() just passes them
    // along onto the event object.
    probability_of_playing: probability != null ? Number(probability) : null,
    practice_1: firstDefined(raw, ['practice_1']),
    practice_2: firstDefined(raw, ['practice_2']),
    practice_3: firstDefined(raw, ['practice_3']),
  };
}

// Top-level response shape is also unconfirmed — tries the two most likely
// container keys (`players`, `injuries`) before falling back to "response IS
// the array" in case the endpoint returns a bare list like /nfl/news does.
export function flattenFantasyProsInjuries(data, { capturedAt } = {}) {
  const list = Array.isArray(data) ? data
    : Array.isArray(data?.players) ? data.players
    : Array.isArray(data?.injuries) ? data.injuries
    : [];
  return list
    .map((raw) => mapFantasyProsInjury(raw, { capturedAt }))
    .filter(Boolean);
}
