// agents/lib/pick-signal-floor.js
// ═══════════════════════════════════════════════════════════════════════════════
// Round 9 v8 Finding 3 response (RULES.md date-threshold exception, Andy-
// authorized 2026-09-10, Code Quality section): TRAINING_CAMP_START_BY_SEASON
// is a static per-season configuration value, not wall-clock expiry logic --
// it never reads the current date at runtime, so it does NOT need a
// vi.useFakeTimers() test. The exception's requirements instead are: a named,
// season-keyed, fail-loud accessor (this file); a plain unit test on the
// accessor; and a wiring test at the call site proving the resolved value
// actually reaches the query. See buildPickSignalRequest() in
// agents/portfolio-dossier.js, which calls buildPickSignalFilters(SEASON)
// below and passes the result directly to fetchAllRows()'s `filters` param --
// tests/unit/pickSignalFloor.test.js asserts on that exact return value via
// the real exported fetchPickSignals()/fetchUserPicks() call sites, which is
// what makes it a wiring test rather than just a unit test on the accessor
// in isolation.
// ═══════════════════════════════════════════════════════════════════════════════

export const TRAINING_CAMP_START_BY_SEASON = {
  2026: '2026-08-10',
};

export function signalFloorForSeason(season) {
  const floor = TRAINING_CAMP_START_BY_SEASON[season];
  if (!floor) {
    throw new Error(`signalFloorForSeason: no TRAINING_CAMP_START_BY_SEASON entry for season ${season} -- add one (and confirm the real training-camp start date) before using this table's pick-signal floor filter`);
  }
  return floor;
}

// The exact filters array fetchPickSignals() (agents/portfolio-dossier.js)
// hands to fetchTopRows() -- pulled out here so a test can assert on it
// directly without executing that file's top-level script body.
export function buildPickSignalFilters(season) {
  return [{ column: 'captured_at', op: 'gte', value: signalFloorForSeason(season) }];
}
