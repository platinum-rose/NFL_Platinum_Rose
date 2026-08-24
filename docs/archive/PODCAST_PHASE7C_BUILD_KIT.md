# Phase 7c — Build Kit (concrete starting point)

> **For:** the implementer starting 7c in a fresh session.
> **Read first:** `docs/PODCAST_PHASE7C_BRIEF_SPEC.md` (the *why*). This file is the *how* —
> an ordered, copy-paste patch sequence anchored to the live line numbers of
> `agents/nfl-daily-brief.js` as of HEAD `df020a4`.
> **Scope:** one file (`agents/nfl-daily-brief.js`) + one test file (new). Additive only.
> **Risk:** lowest of all Phase 7 items. Ships today. No new deps, no migration.

---

## 0. Pre-flight (2 min)

```powershell
cd d:\DEV\github\NFL_Platinum_Rose
git fetch origin && git status -sb          # expect clean, up to date with origin/main
node agents/nfl-daily-brief.js --dry-run     # baseline: confirm it runs, note current sections
```

> The dry-run prints text + writes `preview/newsletter_live_preview.html`. Open that file —
> this is your before/after visual gate. It needs `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
> in `.env` (already present locally). No Gmail creds needed for `--dry-run`.

If the dry-run can't reach Supabase, you can still build + unit-test (the new functions are
pure and tested with a fake client) — just skip the visual gate until you're on a box with `.env`.

---

## 1. Patch sequence (5 edits, in order)

All line numbers are the *current* positions in `agents/nfl-daily-brief.js`. Apply top-down;
later numbers shift as you insert, so re-find by anchor string rather than trusting the number
after the first edit.

### Edit 1 — config constant (after line 54, the `GAMES_DAYS` block)

Anchor: the `const GAMES_DAYS = ...` line.

```js
const GAMES_DAYS     = Number(process.env.GAMES_LOOKAHEAD_DAYS || 8);
const PODCAST_PICKS_HOURS = Number(process.env.PODCAST_PICKS_LOOKBACK_HOURS || 24);   // ← add
```

### Edit 2 — new fetcher (immediately after `fetchPodcastIntel`, ends line 256)

Anchor: the closing `}` of `fetchPodcastIntel` (the `return (data || []).filter(...)` block).
Paste the full `fetchTopPodcastPicks` from spec §4 right after it. Key points the spec covers:
- 24h `processed_at` window via `hoursAgo(PODCAST_PICKS_HOURS)`.
- `.limit(40)` on episodes (flattened to picks, then capped at 8).
- Drop `needs_review === true`.
- Episode-level `isNFLRelevant` guard (multi-sport feeds).
- Sort `confidence` desc, tiebreak `quality_score` desc, `.slice(0, 8)`.
- Read `pick.category` — **never** `pick.type`.

### Edit 3 — new renderer (immediately after `renderPodcastIntel`, ends line 637)

Anchor: the closing `}` of `renderPodcastIntel` (its `return` ends with `dashLink('picks', ...)`).
Paste `CATEGORY_LABEL`, `digestLinkFor`, and `renderTopPodcastPicks` from spec §5. Key points:
- Returns `''` when empty (section auto-hides, matches `renderInjuries`).
- Reuses `confClass` / `escapeHtml` / `dashLink` as-is.
- Section link = `dashLink('podcasts', 'Podcast Digest Tab →')` (the 7b tab; 404s harmlessly until 7b ships).
- `digestLinkFor` emits the direct M6 link **only** when `process.env.M6_DIGEST_BASE` is set.

### Edit 4 — wire into `main()` (lines 835, 860, 872, 878)

Four sub-edits inside `main()`:

**4a — add to the `Promise.all` (line 835) + destructure:**
```js
const [sbSnaps, sbMovers, tweets, notes, podcastEps, topPicks, injuries, gameRows] = await Promise.all([
  fetchFuturesSnapshot(supabase),
  fetchFuturesMovers(supabase),
  fetchSharpTweets(supabase),
  fetchIntelNotes(supabase),
  fetchPodcastIntel(supabase),
  fetchTopPodcastPicks(supabase),     // ← add (order matters: matches destructure)
  fetchInjuries(supabase),
  fetchUpcomingGames(supabase),
]);
```
> Note: `topPicks` is inserted **between** `podcastEps` and `injuries` in both the array
> and the destructure. Keep the two lists aligned or every downstream var shifts.

**4b — console count (after line 860, the `Podcast eps:` log):**
```js
console.log(`  Podcast picks: ${topPicks.length} rows`);
```

**4c — add to `sections` array (line 872), right after `renderPodcastIntel`:**
```js
  renderPodcastIntel(podcastEps),
  renderTopPodcastPicks(topPicks),    // ← add
```

**4d — thread into `buildPlainText` call (line 878):**
```js
const textBody = buildPlainText(sbTable, tweets, notes, podcastEps, topPicks, dedupedInjuries, gameRows);
```

### Edit 5 — plain-text mirror (`buildPlainText`, signature line 735 + body ~line 773)

**5a — add the param** (between `podcastEps` and `injuries`, to match the call site in 4d):
```js
function buildPlainText(sbTable, tweets, notes, podcastEps, topPicks, injuries, games) {
```

**5b — add the block** after the `PODCAST INTEL` block (ends line 773), before `INJURY REPORT`:
```js
if (topPicks.length) {
  lines.push(`TOP PODCAST PICKS (last ${PODCAST_PICKS_HOURS}h)`, '─'.repeat(40));
  topPicks.forEach(p => {
    const conf = p.confidence != null ? ` (${Math.round(p.confidence * 100)}%)` : '';
    lines.push(`• [${(p.category || '?').toUpperCase()}] ${p.selection || p.subject}${conf} — ${p.feedName}`);
    if (p.summary) lines.push(`    ${p.summary}`);
  });
  lines.push('');
}
```

### Optional — receipt stat (line 909, inside `stats: {}`)
```js
top_podcast_picks: topPicks.length,
```

---

## 2. Verify loop

```powershell
node agents/nfl-daily-brief.js --dry-run
```
Then open `preview/newsletter_live_preview.html` and confirm:
- [ ] A "🎯 Top Podcast Picks (last 24h)" section appears **right after** "🎙 Podcast Intel".
- [ ] Each pick shows `Category: selection ±line  NN%  ·  Nu`, a summary line, and `🎙 <feed>`.
- [ ] Confidence colour matches `confClass` (green ≥0.7, gold ≥0.4, grey below).
- [ ] No `/digest/` link present (because `M6_DIGEST_BASE` is unset locally).
- [ ] Set `M6_DIGEST_BASE=http://example:8088` in `.env`, re-run → each pick now has a
      `digest (tailnet) →` link ending `/digest/episodes/<id>.html`. Unset it again after.
- [ ] If no podcast picks in the last 24h, the whole section is **absent** (not an empty box).
- [ ] Plain-text body (printed to console) has the matching `TOP PODCAST PICKS` block.

---

## 3. Tests (new file)

Create `tests/unit/dailyBriefPodcastPicks.test.js`. The agent has **no existing test harness**,
so this is greenfield — it needs `fetchTopPodcastPicks` / `renderTopPodcastPicks` to be
**exported**. Add at the bottom of the agent (guarded so the CLI entry still works):

```js
export { fetchTopPodcastPicks, renderTopPodcastPicks };   // for unit tests
```
> The file already runs `main()` on import. That's fine for the CLI but means importing it in
> a test will trigger `main()`. Guard it: wrap the bottom `main().catch(...)` in
> `if (process.argv[1] === __filename) { main().catch(...) }` so importing the module for tests
> does **not** fire a live email/Supabase run. This is the one structural change beyond pure
> additions — call it out in the commit message.

Cover the 7 cases from spec §9 with a hand-rolled fake Supabase (a `.from().select().gte().order().limit()`
chain returning canned rows). Minimum:
1. drops `needs_review`, sorts by confidence, caps at 8;
2. non-NFL episode excluded;
3. `<script>` in summary renders escaped;
4. reads `category` (label shows) and ignores stray `type`;
5. `M6_DIGEST_BASE` unset ⇒ no `/digest/` link; set ⇒ one per pick;
6. `renderTopPodcastPicks([])` ⇒ `''`.

Run: `npx vitest run tests/unit/dailyBriefPodcastPicks.test.js`

---

## 4. Commit

```powershell
git add agents/nfl-daily-brief.js tests/unit/dailyBriefPodcastPicks.test.js
git commit -m "feat(brief): Phase 7c — Top Podcast Picks (24h) block in nfl-daily-brief

- fetchTopPodcastPicks: 24h window, drop needs_review, sort by confidence, cap 8
- renderTopPodcastPicks: confClass + escapeHtml; dashLink('podcasts'); optional
  M6_DIGEST_BASE direct digest link (omitted when env unset — GHA off-tailnet)
- plain-text mirror in buildPlainText
- guard main() behind argv check so the module is unit-testable
- new tests/unit/dailyBriefPodcastPicks.test.js (filter/sort/cap, XSS, links, empty)"
```

---

## 5. Gotchas (pre-flagged so you don't rediscover them)

- **Do not contact M6.** The brief runs in GHA off-tailnet. No HEAD check, no ping — the
  M6 link is a pure string built from `M6_DIGEST_BASE`. (Spec §7 supersedes the old handoff
  guardrail that said "ping M6, degrade if down" — that was architecturally impossible.)
- **`pick.category`, not `pick.type`.** Migration 023 v2 uses `category`. `confidence ∈ [0,1]`
  (multiply by 100 only for display). `confClass()` is already 0-1 aware.
- **`process.env.M6_DIGEST_BASE`, not `import.meta.env.VITE_M6_BASE`.** That `VITE_*` key
  belongs to 7b's browser SPA; this is a Node agent. Different mechanism — do not cross them.
- **Keep the `Promise.all` array and its destructure in lock-step.** Inserting `topPicks` in
  one but not the other silently shifts `injuries`/`gameRows`.
- **`fetchPodcastIntel` already selects `picks` and throws them away** (line 235). You are
  surfacing data that's already fetched elsewhere — don't add a second select to that function;
  the new `fetchTopPodcastPicks` is a separate, windowed query by design (spec §3.3).
