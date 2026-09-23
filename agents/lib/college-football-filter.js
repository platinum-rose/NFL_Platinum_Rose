// College-football rejection for research-intel-ingest (2026-09-23).
//
// BettingPros and VSiN mix CFB into the same RSS feed as their NFL content.
// research-intel-ingest's looksNflRelevant() had no college terms in its
// non-NFL list, and its escape hatch keeps any title containing "football",
// so "College Football Week 4 Picks: ..." passed straight through (12 CFB
// articles / 63 pick signals in two days, cleaned up 2026-09-23).
//
// Checks the TITLE and the URL PATH only (never the description, which can
// carry cross-sport sidebar links). A title that explicitly says NFL is kept
// (e.g. "2027 NFL Draft: stock up after Week 3 of college football").

const COLLEGE_TITLE = /\b(college football|cfb|ncaaf|ncaa football|ncaa|fbs|fcs|heisman|bowl projections|college gameday|cfp|college football playoff)\b/i;
const COLLEGE_PATH = /\/(college-football|ncaaf|ncaa-football|cfb|college)(\/|-|$)/i;
const NFL_TITLE = /\b(nfl|national football league|super bowl)\b/i;

export function isCollegeFootballItem({ title = '', link = '' } = {}) {
  const t = String(title);
  if (NFL_TITLE.test(t)) return false;
  if (COLLEGE_TITLE.test(t)) return true;
  let path = '';
  try { path = new URL(String(link)).pathname; } catch { path = ''; }
  return COLLEGE_PATH.test(path);
}
