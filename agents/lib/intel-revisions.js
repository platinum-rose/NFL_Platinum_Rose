// Evergreen-URL revision handling for research-intel-ingest.
//
// 2026-09-23: Action Network rewrites some pages IN PLACE every week under a
// fixed URL (NFL Betting Primer, Live QB Power Rankings, Anytime TD Machine).
// The feed republishes them with a fresh pubDate, but the ingest deduped on
// url_hash (sha256 of the canonical URL) alone, so only the first capture
// (Week 1, 9/07-9/08) was ever stored and every weekly rewrite was skipped.
//
// Fix: when a feed item's URL is already stored but the feed's published_at
// is at least `minHours` newer than the stored copy, store it as a new
// revision row whose url_hash = sha256(`${canonical}#rev=${YYYY-MM-DD}`).
// Same-day republishes collapse onto one revision (the date key), so a
// "live" page that bumps its pubDate every few hours adds at most one row a
// day. The original row is left untouched (history is kept for grading).

export const REVISION_MIN_HOURS = 20;

export function revisionKey(publishedAt) {
  return String(publishedAt).slice(0, 10);
}

export function revisionHash(sha256, canonical, publishedAt) {
  return sha256(`${canonical}#rev=${revisionKey(publishedAt)}`);
}

/**
 * @param {Array<object>} notes       candidate notes (url_hash = base hash)
 * @param {Map<string,string|null>} storedPublishedByHash  base url_hash -> stored published_at
 * @param {(s:string)=>string} sha256
 * @param {{minHours?:number}} [opts]
 * @returns {{ revisions: Array<object>, revisionHashByBase: Map<string,string> }}
 *   revisions = copies of notes that qualify, with url_hash replaced
 */
export function planRevisions(notes, storedPublishedByHash, sha256, opts = {}) {
  const minMs = (opts.minHours ?? REVISION_MIN_HOURS) * 3600 * 1000;
  const revisions = [];
  const revisionHashByBase = new Map();
  for (const note of notes) {
    if (!storedPublishedByHash.has(note.url_hash)) continue; // brand new: normal insert path
    const stored = storedPublishedByHash.get(note.url_hash);
    if (!note.published_at || !stored) continue;
    const delta = Date.parse(note.published_at) - Date.parse(stored);
    if (!Number.isFinite(delta) || delta < minMs) continue;
    const revHash = revisionHash(sha256, note.canonical_url, note.published_at);
    revisions.push({ ...note, url_hash: revHash });
    revisionHashByBase.set(note.url_hash, revHash);
  }
  return { revisions, revisionHashByBase };
}
