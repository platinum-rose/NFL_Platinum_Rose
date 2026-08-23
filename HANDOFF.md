# NFL_Dashboard - Session Handoff

## Current Pick Up Here (2026-08-23, futures ingestion gap + Expert Signals extraction fixed, tab-scroll patched, blocked on a stale git lock, Claude/Cowork)

Continuation of the entry directly below (the interactivity-fix session).
Andy came back with three explicit new items after regenerating the report
and finding it "very light": (1) find out where all the manually-gathered
futures data went, (2) patch the tab-click-doesn't-scroll nuance, (3) look
into why Expert Signals doesn't surface explicit picks from article text.
All three are now code-fixed. **One is blocked on something only Andy can
clear** — see "Blocked: stale git locks" below before anything else.

### 1. Futures ingestion gap — much bigger than "the 08-22 batch"

Queried `futures_odds_snapshots` directly: for season 2026 it held exactly
4,352 rows, ALL `market_type=superbowl`, split evenly across exactly 4 books
(betmgm/betonline/draftkings/fanduel, 1088 rows each) — clearly the
automated daily feed (`agents/futures-odds-ingest.js`), running since
~2026-07-24. `bookmaker` and `betus` had **zero rows ever**, and **no
market_type other than superbowl existed for any book** — meaning all 19
manually-gathered batch files in `data/futures-imports/` (5 betonline, 5
betus, 9 bookmaker; 2026-05-17 through 2026-08-22; 4,333 rows total) had
never been loaded. This — not the 08-22 batch specifically — is why
Line Movement and Value Spots are thin: those need ≥2 snapshot dates and,
for Value Spots, sharp/public divergence, and almost all of the sharp-book
(BOL/BKR/BTU) history simply wasn't in the table.

Built `scripts/backfill-futures-imports.js` to load all 19 files. Two
wrinkles handled: (a) `betonline-2026-08-22.json` uses a wrapped
`{records:[...]}` shape instead of a flat array (the other 18 are flat
arrays), and (b) that same file uses generic `market_type` values
(`conference`, `division`) instead of the split names the report generator
expects (`conference_afc`/`conference_nfc`, `division_afc_east` etc.) — its
rows carry the split info in separate `conference`/`division` fields, which
the script now uses to derive the correct market_type. Also normalized that
file's `playoffs` rows (`yes_price` → `odds`, matching every other file) and
its `exacta` rows (`selection` → `team`, since there's no single team on a
seeding-exacta pick). `exacta` (BOL) and `conference_no_1_seed` (one BKR
batch) aren't modeled by any of the 8 report categories today — loaded as
real data under those market_type values anyway rather than dropped or
force-mapped into a wrong category; they'll just sit inert until a category
exists for them.

Dry-run (`node scripts/backfill-futures-imports.js --dry-run`) is clean:
4,333 rows, **zero anomalies**, matches the local-file grand total exactly.
Full per-book/market breakdown is in the script's own dry-run output.

**DONE — written to Supabase (2026-08-23, run by Andy).** The device
bridge's shell has no network egress to `*.supabase.co` (confirmed: `curl`
to the Supabase host returns `403` from the bridge's own egress proxy;
`github.com` is allowlisted, Supabase isn't), so Andy ran it himself from a
normal terminal. First attempt hit a real bug the dry-run didn't catch:
`betonline-2026-08-22.json`'s `wins` rows carry only `line`/`over_price`/
`under_price`, no `odds`/`price` at all (every other file's `wins` rows
mirror `odds` from `over_price`) — `futures_odds_snapshots.odds` is
`NOT NULL`, so that hit a real `23502` constraint violation on chunk
500–1000 (`"New England Patriots" betonline wins`, odds=null). Fixed in
`scripts/backfill-futures-imports.js`: `wins` rows now backfill `odds` from
`over_price` when missing, and (safety net for future format surprises)
any row that still has no usable `odds` after normalization is dropped and
reported as an anomaly instead of failing the whole chunk. Re-ran — all
4,333 rows upserted cleanly.

Verified live via a Supabase query from the running app (anon key, browser
console): `futures_odds_snapshots` for season 2026 is now **8,685 rows**
(4,352 automated-feed + 4,333 backfilled — exact match, nothing lost or
duplicated). Per-book: betmgm 1088, draftkings 1088, fanduel 1088
(unchanged, automated feed only), **betonline 1843** (was 1088),
**bookmaker 1370** (was 0), **betus 2208** (was 0). All 8 report categories
now have real rows (superbowl 4928, conference_afc/nfc 304 each,
division_afc_east 72 [representative — all divisions populated], wins 528,
playoffs 465, superbowl_matchup 1280, most_wins/least_wins 96 each), plus
`exacta` (48) and `conference_no_1_seed` (32) sitting inert as discussed.

**Next**: Regenerate the Intel Report and re-check Line Movement / Value
Spots and the previously-thin category tabs — not yet done this session.

### 2. Tab-scroll fix

Last session's anchor-nav click interceptor (in
`agents/futures-intel-report-v2.js`'s embedded `<script>`) called
`target.scrollIntoView()` on an element inside the report's own iframe
document. That's a no-op: `FuturesIntelReport.jsx`'s `sizeIframe()` sets the
iframe's height to its full `contentDocument.scrollHeight`, so the iframe
never has its own scroll container — everything's already "visible" inside
it at all times. The thing that actually needs to scroll is the **parent
app page**. Fixed to compute the target's absolute position on
`window.parent` (via `window.frameElement`, reachable because the sandbox
already has `allow-same-origin`) and call `window.parent.scrollTo(...)`
instead, falling back to the old `scrollIntoView()` if `window.parent` is
ever unreachable for some reason.

(While in that file: my first pass at this fix accidentally put literal
backticks inside a JS comment — `` `target` `` — inside what turned out to
be one giant backtick-delimited template literal spanning the whole
generated HTML document (lines ~1795–2323). That silently broke `node
--check` (caught before shipping, not caught by an earlier check I ran
against a stale copy — worth remembering that any edit inside this
particular file's HTML-template region can never contain a literal
backtick, even in a comment).

### 3. Expert Signals — root cause found and fixed

`expertSignalsForTeam()` (in the report generator) is fine — it does a
simple team-nickname match. The actual bug is upstream, in
`agents/research-intel-ingest.js`: `extractSignals()`, which populates
`research_pick_signals`, only ever reads `item.title` + `item.description`
— the short RSS teaser. There's a separate step ("F-11 Ph.2",
`INTEL_FETCH_BODY=true` in `.github/workflows/research-intel-ingest.yml`)
that fetches each article's **full body** (up to 20k chars) — but it only
ever backfills a display column on `research_intel_notes`; it never re-runs
pick extraction against that body text. So a pick stated only in an
article's body — e.g. "Eagles vs Patriots pick: Patriots +2.5 (-118)" — and
not repeated in the RSS teaser, was silently never captured as a signal.
This is very likely systemic, not specific to that one article — worth
checking after the next ingest run whether Expert Signals entries stop
being generically `[other]`-tagged as often.

Fixed: factored the regex-based extraction out into
`extractSignalsFromText()` and now also run it against each fetched body
(inside the same F-11 Ph.2 backfill loop, right after the body is fetched
and before it's discarded), deduped per-note against whatever the teaser
pass already found so the same pick isn't double-inserted when it appears
in both. This only takes effect on the **next scheduled/manual run** of
`research-intel-ingest.js` — it doesn't retroactively backfill signals for
already-ingested notes that already have a `body` stored. If Andy wants
past notes covered too, that'd be a small follow-up script (re-run
extraction against `research_intel_notes.body` for existing rows) — not
built this session, wasn't asked for.

### 4. Value Spot card display bug (found by Andy after the backfill landed)

Andy spotted "Super Bowl Winner BKR +2227(+227 vs BOL)" on the regenerated
report and (reasonably) read "+227" as BOL's own odds — flagged it as
corrupted/truncated data (a Super Bowl longshot price should be 4 digits,
not 3). Checked the actual data directly: BetOnline's Packers Super Bowl
price is consistently **+2000** (every snapshot, all season), Bookmaker's
latest is **+2227**. Nothing corrupted — `agents/futures-intel-report-v2.js`'s
"spread" Value Spot card (the inter-sharp-book price-spread type) was only
ever rendering the point **gap** between the best and worst book
(`m.spread`, here `2227 − 2000 = 227`), never the worst book's actual
price — so "(+227 vs BOL)" was genuinely ambiguous and easy to misread as
BOL's raw price. Fixed: now renders `(vs BOL +2000, +227 pts)`, unambiguous.
Checked the other spot-card types (divergence, playoffs_spread, wins_line,
wins_ou) for the same pattern — all of those already show both sides'
actual values explicitly, only the "spread" card had this gap.

### Blocked: stale git locks — needs Andy to delete 3 files

All three code fixes above are on disk in the repo (confirmed correct via
`node --check` + `eslint`, zero errors) but **not yet committed**. Two
pre-existing stale lock files from earlier this session (`.git/index.lock`,
dated Aug 22 — pre-existing crash debris; `.git/HEAD.lock`, left behind
after the previous commit succeeded but couldn't clean up its own lock
file) blocked `git add`/`git commit` the normal way. Same low-level
workaround as before (`GIT_INDEX_FILE=/tmp/... git write-tree` +
`git commit-tree`) got as far as creating the commit object
(`0b662c9a1d150d8a37acbdd87d449aad82e478c6` — content-correct, just not
pointed to by any branch yet), but `git update-ref refs/heads/main` also
needs to touch `HEAD`'s reflog and hit the same stuck `HEAD.lock`. That
attempt left a THIRD stale lock behind: `.git/refs/heads/main.lock`. The
device bridge's shell cannot delete or rename any of these (`rm`/`mv` both
fail "Operation not permitted" — by design, this session has no delete
permission on the connected folder).

**To unblock**: delete these three files (they're all empty 0-byte lock
files, safe to remove — they're not real git state):
```
E:\dev\projects\NFL_Dashboard\.git\index.lock
E:\dev\projects\NFL_Dashboard\.git\HEAD.lock
E:\dev\projects\NFL_Dashboard\.git\refs\heads\main.lock
```
Once those are gone, next session (or later this session) can commit +
push cleanly in one shot. The orphan commit object above can just be
ignored/left for git gc — I'll create a fresh commit rather than depend on
it.

### Files touched this round (uncommitted, pending the lock cleanup above)

- `agents/futures-intel-report-v2.js` — tab-scroll fix (see #2) + Value Spot spread-card display fix (see #4)
- `agents/research-intel-ingest.js` — Expert Signals body extraction (see #3)
- `scripts/backfill-futures-imports.js` — new, futures ingestion backfill (see #1)
- `src/components/futures/FuturesIntelReport.jsx` — unchanged this round (already committed last round)

### Guardrails followed this session

Same standing guardrails as before: dirty worktree preserved (no `git add
-A`, only the specific files above), no commit without Andy's approval (he
gave it — see conversation; still pending, blocked on the stale locks above),
no Supabase write without approval (he gave it explicitly for the backfill;
he ran the actual write himself since the bridge has no network path to
Supabase — see #1), no fabricated data (every normalization in the backfill
script maps real fields from the source JSON files, nothing invented;
unmodeled market types loaded as-is rather than force-fit into a wrong
category).

## Previous Pick Up Here (2026-08-23, Futures Intel Report interactivity fixed — root cause was a missing iframe sandbox flag, Claude/Cowork)

Continuation of the entry directly below. Andy asked to fix Bug 3 (non-live
category tabs rendering blank) and then do the "full pass on all
functionality" on the Intel Report page. The real root cause turned out to
be much bigger — and different — than Bug 3's original diagnosis.

- **Real root cause, found by reproducing live in Chrome + inspecting the
  iframe DOM directly**: `src/components/futures/FuturesIntelReport.jsx`'s
  report iframe has `sandbox="allow-same-origin allow-popups"` — missing
  `allow-scripts`. This has been true since the file was created (`git log
  -L` on the sandbox line shows only the one original commit ever touched
  it). Without `allow-scripts`, **the report's entire embedded `<script>`
  block never executes in production** — not just tab navigation, but
  section collapse toggles, sortable table columns, "Show N more" buttons,
  and the matchup/mover filter chips were all silently dead. Live-verified
  before the fix: clicking the ▼ collapse button on Line Movement did
  nothing at all — not a rendering bug, a permissions bug.
- Because scripts don't run, the toc's plain `<a href="#category-id">`
  links fall back to native browser anchor navigation. Per the HTML spec, a
  `srcDoc` iframe's document base URL is inherited from the **parent
  page's** URL, not `about:srcdoc` — so `href="#superbowl"` resolves to
  `http://localhost:5173/platinum-rose-app/?tab=futures#superbowl` and the
  browser navigates the iframe to that URL. Since the dev server serves the
  SPA's own `index.html` for any path, the iframe ends up loading a blank
  copy of the app shell (`<div id="root"></div>` + `main.jsx`), wiping the
  entire report — not just the clicked category. Confirmed this happens for
  **every** toc link, tested both `#superbowl` (which was live data at test
  time) and `#movement` (always-present content) — this was never specific
  to non-live categories. Bug 3's original diagnosis ("only non-live tabs
  go blank") was a reasonable read from testing only one tab, but
  incomplete.
- **Correction to Bug 3's premise**: the "no data yet for this category"
  empty-state Bug 3 asked to add was **already implemented correctly** in
  `agents/futures-intel-report-v2.js`'s `catSection()` (`.empty-note` with
  `cat.note` text) — verified by reading the DOM directly (bypassing the
  broken click) for all 5 non-live categories (conference, division, wins,
  playoffs, superbowl_matchup): each showed its correct empty-state
  message. No template/rendering fix was needed there.
- **Two files fixed (uncommitted, in the dirty worktree — see guardrails)**:
  1. `src/components/futures/FuturesIntelReport.jsx` — added `allow-scripts`
     to the iframe's `sandbox`. This is the fix that matters most: it makes
     all interactivity work immediately for anyone on the dev server, since
     it's a wrapper-level fix, not baked into the stored report HTML.
     Live-verified post-fix: section collapse ✅, sortable table column
     headers ✅, "Show N more" button ✅.
  2. `agents/futures-intel-report-v2.js` — added a capturing branch at the
     top of the report's own delegated click listener that intercepts
     `a[href^="#"]` clicks, calls `preventDefault()`, and does
     `element.scrollIntoView()` manually instead of relying on native
     anchor navigation. This fixes the toc tab-nav blanking bug
     specifically. **Only takes effect on the next Regenerate** — Regenerate
     builds via GitHub Actions from the committed HEAD, not this local dirty
     worktree, so it won't reach the live report until this change is
     committed and pushed. Did not commit/push (guardrail) and did not
     click Regenerate (a real GitHub Actions run + Supabase write, also
     guardrail-gated). Verified correctness instead by injecting the
     identical patch into the live iframe's document via DevTools JS:
     clicking a toc link no longer blanks the report and correctly scrolls
     to the target section with its content (including the empty-state
     note) intact.
  3. Also fixed while doing the narrow-width check (below), same file:
     `.tbl-wrap{overflow-x:hidden}` → `overflow-x:auto`.
- **Is "3/8 categories live" expected for preseason, or a gap? It's a real
  ingestion gap, not expected.** Queried `futures_odds_snapshots` directly
  (read-only, via the app's own public Supabase anon key): for
  `book=betonline`, `captured_at` on 2026-08-22, only the `superbowl` market
  type has rows (64) — but `data/futures-imports/betonline-2026-08-22.json`
  (the parsed BetOnline OCR batch from that same date, per the Antigravity
  entry below) contains 182 records spanning **all 6** of
  `superbowl/conference/division/wins/playoffs/exacta`. So the
  conference/division/wins/playoffs/superbowl_matchup data was captured and
  parsed but never loaded into the table the report reads from. Likely
  cause: `scripts/ingest-futures-json.js` (the generic loader into
  `futures_odds_snapshots`) expects a flat array (`raw.map(...)`), but
  `betonline-2026-08-22.json` is wrapped in an object
  (`{snapshot_time, ..., records: [...]}`) — running the loader against it
  as-is would throw immediately. Earlier BetOnline batches (0729, 0810) each
  got a dedicated `scripts/build-betonline-0729-import.js` /
  `-0810-import.js`; no equivalent `-0822-` script exists. **Not fixed this
  session** — writing a real loader means new Supabase writes, which needed
  Andy's sign-off on the approach first (dedicated per-batch script matching
  the existing pattern, vs. fixing `ingest-futures-json.js` to accept the
  `{records: [...]}` shape generically).
- **Full functionality pass (the rest of what Andy asked for)**:
  - Movement/Value: these are two of the toc's anchor sections (not a
    toggle) — covered by the same tab-nav fix as the 8 categories.
  - All 8 category tabs: DOM-verified each one's actual state — superbowl
    (live), most_wins/least_wins (proxy, present), conference/division/
    wins/playoffs/superbowl_matchup (no data, correct empty-state text
    each).
  - Narrow-width rendering: found and fixed the `.tbl-wrap` overflow bug
    above (odds tables were clipping extra columns invisibly below ~680px
    with no way to scroll to them — confirmed visually by force-narrowing
    the iframe to 380px). The toc nav and the `mover-grid`/`spots-grid`/
    `rpt-meta` media query at 680px were already fine.
  - Did not re-test Regenerate itself this session (already verified
    end-to-end last session; re-triggering it would be an unapproved
    Supabase write via a real GitHub Actions run).
- **Next session / needs Andy**: (1) decide whether to commit+push the two
  interactivity fixes — the sandbox fix is already live for anyone using
  the dev server, but the generator fix needs a commit+push+Regenerate to
  reach the actually-stored report; (2) decide how to handle the
  2026-08-22 BetOnline batch ingestion gap (dedicated loader script vs.
  generic `ingest-futures-json.js` fix); (3) once committed, run Regenerate
  and re-verify the toc tab nav live end-to-end against the freshly built
  report.

Guardrails followed: worktree left dirty (only added the file edits above,
nothing staged/committed/pushed), no Supabase writes (only read-only
queries via the public anon key to diagnose the ingestion gap), no
fabricated data — every finding above came from a live DOM read or a live
Supabase read, not an assumption.

## Previous Pick Up Here (2026-08-23, Futures Intel Report page broken — 3 bugs found, 2 fixed, Claude/Cowork)

Andy reported: Bankroll & Futures → Intel Report page "coming up blank," and Regenerate
failing with a generic error. Diagnosed live in Chrome. **Recommend a fresh session for the
full page pass** — see reasoning below. Bugs 1 and 2 are fully resolved and verified live;
Bug 3 is the one real open item.

- **Bug 1 — Regenerate error message was masking the real cause (FIXED, committed, verified
  live).** `src/components/futures/FuturesIntelReport.jsx`'s `handleRegenerate()` only read
  `e.message` off the Supabase JS error, which for `functions.invoke()` is always the generic
  "Edge Function returned a non-2xx status code" — the edge function's own `{error, detail}`
  JSON body (see `supabase/functions/dispatch-futures-report/index.ts`) lives on
  `e.context` (the raw Response) and was never being read, so the UI always showed the same
  vague "check the GitHub token" text no matter what actually failed. Fixed to parse
  `e.context.json()` and show the real detail. Lint-clean, verified live: after the fix,
  clicking Regenerate now shows the actual upstream error.
- **Bug 2 — Regenerate's real failure was a dead GitHub PAT (FIXED by Andy, verified live
  end-to-end 2026-08-23).** Live error (visible thanks to Bug 1's fix) was
  `{"message":"Bad credentials","documentation_url":"https://docs.github.com/rest",
  "status":"401"}` — a straight 401 from the GitHub API. Ruled out config drift first: repo
  name (`platinum-rose/NFL_Platinum_Rose`) matches `git remote -v`; `.github/workflows/
  futures-intel-report.yml` exists and its `workflow_dispatch.inputs`
  (`trigger`/`season`/`dry_run`) match exactly what the edge function sends. Confirmed no
  reusable PAT existed anywhere else in the repo (checked the other 2 edge functions —
  `ai-proxy`, `odds-proxy` — and every workflow's `secrets.*` references; GitHub Actions
  secrets aren't retrievable from outside a running workflow anyway, so they couldn't have
  supplied this even if one matched). Andy regenerated the existing fine-grained PAT in his
  GitHub account settings and ran `supabase secrets set GITHUB_DISPATCH_TOKEN=<new value>`.
  **Verified**: clicked Regenerate in Chrome afterward — dispatch succeeded (green "Build
  queued" banner, no error), and ~10s later "Updated report loaded" with a fresh
  `generated_at` (2026-08-22 23:49) and `trigger: on_demand_ui`, confirming the whole chain
  (edge function → GitHub Actions dispatch → workflow run → `futures_reports` write → UI
  poll/swap-in) works end-to-end again.
- **Bug 3 — found, NOT yet fixed, confirmed it persists on the fresh post-fix report: this is
  very likely the actual "blank page" Andy saw.** The report itself renders fine at the top
  level (title, header stats, "3/8 categories live" — still 3/8 on the brand-new report too).
  But clicking into a category tab that isn't one of the 3 "live" ones (tested: "Super Bowl
  Winner") renders a **completely empty content area** — no chart, no "no data yet"
  placeholder, nothing. Re-tested on the freshly-regenerated report (2026-08-22 23:49,
  on_demand_ui) after Bug 2 was fixed — same blank result, so this is a real, persistent bug,
  not stale/cached data. This is inside the report's own generated HTML (the iframe's
  `srcDoc={report.html}`, built by `agents/futures-intel-report-v2.js`), not a React bug —
  so the fix lives in that report generator's HTML/tab-switching output, most likely needing
  a real empty-state per category instead of silently rendering nothing when a category has
  no live odds data. **Not investigated further this session** — `agents/futures-intel-
  report-v2.js` is large and `FUTURES_REPORT_SPEC.md`-governed (same file with the dormant
  `valueSpotSourceLinks()` NFL-ATLAS-1 touched a couple sessions ago), worth a properly-scoped
  look rather than a rushed one.
- **Why hand off rather than push through now**: Bugs 1 and 2 are done and verified — only
  Bug 3 remains. It needs a real read of a large, spec-governed generator file, which deserves
  fresh context rather than the tail end of an already long session. Andy also asked for "a
  full pass for all functionality on this page," which is proactively scoped as its own body
  of work, not a quick follow-on to a bug fix.
- **Next session, in order**: (1) read `agents/futures-intel-report-v2.js`'s category-tab
  HTML/JS generation to find why non-live categories render empty instead of a placeholder,
  fix it, and check whether "3/8 categories live" itself is expected right now (preseason,
  thin futures markets) or a separate ingestion gap; (2) once that's solid, do the fuller "all
  functionality on this page" pass Andy asked for — this session only checked Regenerate/
  Reload/one category tab, not e.g. the Movement/Value toggle, the other 7 category tabs, or
  mobile/narrow-width rendering.

## Previous Pick Up Here (2026-08-22, Quant Probability Strategy & IDP Ingest Complete, Antigravity)

- **Completed BetOnline (BEO) Vision OCR Futures Ingestion & Validation**:
  - Parsed 10 BetOnline futures screenshots (206 raw futures items) into [`data/futures-imports/betonline-2026-08-22.json`](file:///E:/dev/projects/NFL_Dashboard/data/futures-imports/betonline-2026-08-22.json) using Gemini Vision OCR (`parse_beo_screenshots.py`).
  - Generated review markdown [`docs/FUTURES_ODDS_BETONLINE_2026-08-22_MANUAL_REVIEW.md`](file:///E:/dev/projects/NFL_Dashboard/docs/FUTURES_ODDS_BETONLINE_2026-08-22_MANUAL_REVIEW.md) and archived raw PNGs to [`docs/Futures_Odds/_processed/BetOnline_2026-08-22/`](file:///E:/dev/projects/NFL_Dashboard/docs/Futures_Odds/_processed/BetOnline_2026-08-22/).
  - Normalized 4,151 sportsbook records (`sportsbook-normalized-latest.json`) and validated 543 execution references (`odds-execution-validation-latest.json`).
- **DraftSharks IDP Rankings Pipeline Built & Ingested (`agents/draftsharks-idp-ingest.js`)**:
  - Discovered dynamic endpoint `https://www.draftsharks.com/rankings/load-rows?offset=0&position=idp`.
  - Built zero-dependency agent [`agents/draftsharks-idp-ingest.js`](file:///E:/dev/projects/NFL_Dashboard/agents/draftsharks-idp-ingest.js).
  - Parsed 976 total fantasy players, isolating **425 IDP (Defensive) players** (DL, LB, DB, etc.) with projections, ADP, SOS %, Injury Risk %, and 3D Value scores.
  - Saved local JSON snapshot [`data/rankings/draftsharks-idp-2026-08-22.json`](file:///E:/dev/projects/NFL_Dashboard/data/rankings/draftsharks-idp-2026-08-22.json) and upserted 425 rows into Supabase `fantasy_rankings` (`source='draftsharks'`).
- **IDP Defensive Schemes Strategy Guide Ingested**:
  - Parsed Ryan Sitzmann's *IDP Defensive Schemes Strategy Guide* from idpguru.com.
  - Created [`docs/IDP_DEFENSIVE_SCHEMES_STRATEGY_GUIDE.md`](file:///E:/dev/projects/NFL_Dashboard/docs/IDP_DEFENSIVE_SCHEMES_STRATEGY_GUIDE.md) and local JSON [`data/intel/idp-defensive-schemes-strategy-2026.json`](file:///E:/dev/projects/NFL_Dashboard/data/intel/idp-defensive-schemes-strategy-2026.json).
  - Built [`scripts/ingest-idp-strategy-guide.js`](file:///E:/dev/projects/NFL_Dashboard/scripts/ingest-idp-strategy-guide.js) and upserted document into Supabase `vault_notes` (`source='agent'`).
- **Quant vs. Gambler Probability Analysis (`@velesxbt`)**:
  - Analyzed and synthesized Abraham de Moivre's bell-curve distribution model for sports betting & bankroll survival.
  - Formulated practical rules for NFL Dashboard AI Agents (Monte Carlo tail risk modeling, 2.5% max Kelly caps) and personal pick strategies (grading decisions over outcomes, planning for the 1-in-370 tail loss streak).

## Previous Pick Up Here (2026-08-23, NFL-ATLAS-1 Futures Pin/Watchlist built, Claude/Cowork)

- Worked ATLAS task `nfl-futures-watchlist-2026-07` (pin specific futures with links to
  agreeing/disagreeing tracked experts + cited stats, both Obsidian and dashboard sides).
  Design doc: [`docs/NFL_ATLAS_1_FUTURES_WATCHLIST_DESIGN.md`](file:///E:/dev/projects/NFL_Dashboard/docs/NFL_ATLAS_1_FUTURES_WATCHLIST_DESIGN.md)
  (read this first — it has the full scoping reasoning, not repeated here).
- **Key scoping finding**: a live, already-shipped `FuturesWatchList.jsx` (Futures →
  Portfolio → Watchlist tab) already did most of the team-pinning/citation UI, but via a
  *different* citation pipeline (an offline podcast-sentiment index, `data/generated/
  host-citations-latest.json`) than the one the original task assumed
  (`research_pick_signals`). Andy's call (2026-08-23): extend the existing tab rather than
  build a parallel feature. Also found `agents/futures-intel-report-v2.js` had a fully-built
  but never-called `valueSpotSourceLinks()` function — reused its matching logic (ported,
  not imported, since agents/ and src/lib/ are separate build contexts) rather than
  reinventing it.
- **Built and verified this session** (lint-clean; live-verified in Chrome after Andy ran
  migration 048 — pinned MVP → Josh Allen, confirmed it persisted to `futures_pins` across a
  full page reload (not just local state), confirmed the Expert Signals panel rendered its
  correct empty state, no console errors, then unpinned to leave the real watchlist clean):
  - `supabase/migrations/048_futures_pins.sql` — new table. **Run live by Andy 2026-08-23.**
  - `src/lib/supabase.js`: `getFuturesPins`/`addFuturesPin`/`removeFuturesPin`.
  - `src/lib/expertSignals.js` (new): `getExpertSignalsForPin()` — matches
    `research_pick_signals`/`research_intel_notes` against a pin by team nickname or
    market/selection keyword. **Neutral framing** ("signals mentioning this pick," not
    agree/disagree) — `research_pick_signals.lean` is free text, not a real stance flag,
    unlike the podcast citation store's `sentiment: bullish/bearish`. See design doc Open
    Item 2 for the full reasoning; this was a real design gap, not a guess.
  - `src/components/futures/FuturesWatchList.jsx`: new "📌 Pin a Future" button, Pinned
    Futures section, `ExpertSignalPanel`, `AddPinModal` — supports any market including
    player/award pins (MVP/OPOY/DPOY/OROY/DROY/Coach of the Year) that have **no live odds
    source anywhere in this repo** (same real blocker as PROPS-1 — pins/cites them, does not
    fabricate price tracking for them).
  - `agents/futures-pin-vault-sync.js` (new) — Obsidian side, mirrors
    `agents/intel-to-vault-sync.js`'s shape exactly (splice a generated "## Expert Signals"
    section into `vault_notes`, `NFL/Futures/<slug>.md`, `ensureVaultFrontmatter`). Only
    reads `futures_pins`, never writes it. Not yet run (needs live pins to sync against).
- **Next session, in order**: (1) once Andy has pinned at least one real future for keeps,
  run `agents/futures-pin-vault-sync.js --dry-run` then for real to verify the Obsidian side
  (not yet run — needs live pins to sync against, and the test pin used for browser
  verification was deliberately removed rather than left in); (2) decide whether to also
  mirror existing team-slot pins into `futures_pins` automatically or leave that manual (not
  decided — the two pin lists currently coexist independently, see the migration's header
  comment).

## Previous Pick Up Here (2026-08-22, IDP Defensive Schemes Strategy Guide Ingested, Antigravity)

- **IDP Defensive Schemes Strategy Guide Ingestion (`scripts/ingest-idp-strategy-guide.js`)**:
  - Ingested Ryan Sitzmann's *IDP Defensive Schemes Strategy Guide* from [`https://idpguru.com/2010/07/guide-to-nfl-defensive-schemes/`](https://idpguru.com/2010/07/guide-to-nfl-defensive-schemes/).
  - Created strategic reference markdown [`docs/IDP_DEFENSIVE_SCHEMES_STRATEGY_GUIDE.md`](file:///E:/dev/projects/NFL_Dashboard/docs/IDP_DEFENSIVE_SCHEMES_STRATEGY_GUIDE.md) detailing sub-package personnel shifts, green-dot LBs, 3-tech vs 0/1-tech DTs, platform positional arbitrage, and coverage shell tackle floors.
  - Built ingestion script [`scripts/ingest-idp-strategy-guide.js`](file:///E:/dev/projects/NFL_Dashboard/scripts/ingest-idp-strategy-guide.js).
  - Saved local intel snapshot [`data/intel/idp-defensive-schemes-strategy-2026.json`](file:///E:/dev/projects/NFL_Dashboard/data/intel/idp-defensive-schemes-strategy-2026.json).
  - Upserted document into Supabase `vault_notes` database table (`path='docs/IDP_DEFENSIVE_SCHEMES_STRATEGY_GUIDE.md'`, `source='agent'`).

## Previous Pick Up Here (2026-08-22, DraftSharks IDP Rankings Agent Implemented & Ingested, Antigravity)

- **DraftSharks IDP Rankings Ingestion (`agents/draftsharks-idp-ingest.js`)**:
  - Successfully connected to DraftSharks IDP rankings page (`https://www.draftsharks.com/rankings/idp`).
  - Discovered dynamic endpoint `https://www.draftsharks.com/rankings/load-rows?offset=0&position=idp` which serves full pre-season rankings with zero API key or login requirements.
  - Built automated, zero-dependency ingestion agent [`agents/draftsharks-idp-ingest.js`](file:///E:/dev/projects/NFL_Dashboard/agents/draftsharks-idp-ingest.js).
  - Extracted **976 total fantasy players**, isolating **425 IDP (Defensive) players** across DL, LB, DB, DE, DT, EDGE, ILB, OLB, CB, and S positions.
  - Extracted rich projections (Floor, Consensus, DraftSharks, Ceiling), ADP, SOS %, Injury Risk %, Bye week, and 3D Value scores.
  - Saved raw snapshot to [`data/rankings/draftsharks-idp-2026-08-22.json`](file:///E:/dev/projects/NFL_Dashboard/data/rankings/draftsharks-idp-2026-08-22.json).
  - Upserted all 425 IDP records directly into Supabase `fantasy_rankings` table (`source='draftsharks'`).

## Previous Pick Up Here (2026-08-22, BetOnline Futures Vision OCR Ingest Verified, Antigravity)

- **Completed BetOnline (BEO) Futures Ingestion via Gemini Vision OCR**:
  - Ingested 10 BetOnline futures screenshots taken on August 22, 2026 from `docs/Futures_Odds/`.
  - Built automated vision parser script [`scripts/parse_beo_screenshots.py`](file:///E:/dev/projects/NFL_Dashboard/scripts/parse_beo_screenshots.py) with exponential backoff & retry handling for 503 API demand spikes.
  - Successfully extracted **206 raw futures records** across Super Bowl LX, NFC/AFC Conference Winners, Division Winners, Win Totals, Make/Miss Playoffs, and Seeding Exactas into [`data/futures-imports/betonline-2026-08-22.json`](file:///E:/dev/projects/NFL_Dashboard/data/futures-imports/betonline-2026-08-22.json).
  - Generated Markdown manual review summary [`docs/FUTURES_ODDS_BETONLINE_2026-08-22_MANUAL_REVIEW.md`](file:///E:/dev/projects/NFL_Dashboard/docs/FUTURES_ODDS_BETONLINE_2026-08-22_MANUAL_REVIEW.md).
  - Archived the 10 raw PNG files to [`docs/Futures_Odds/_processed/BetOnline_2026-08-22/`](file:///E:/dev/projects/NFL_Dashboard/docs/Futures_Odds/_processed/BetOnline_2026-08-22/).
- **Re-runs & Database Syntheses Verified Clean**:
  - `build-sportsbook-exports-normalizer.js`: Normalized `4,151` sportsbook records into [`data/generated/sportsbook-normalized-latest.json`](file:///E:/dev/projects/NFL_Dashboard/data/generated/sportsbook-normalized-latest.json).
  - `build-futures-odds-execution-validation.js`: Verified 543 execution references and 256 exacta monitors cleanly into [`data/futures-imports/odds-execution-validation-latest.json`](file:///E:/dev/projects/NFL_Dashboard/data/futures-imports/odds-execution-validation-latest.json).

## Previous Pick Up Here (2026-08-22, Antigravity Archive Cleanup Verified, Claude/Cowork)

- Andy asked for a full technical review of the broad Antigravity archive
  reorganization Codex's entry below flagged as unreviewed (123 tracked
  deletions: 68 files into `docs/archive/`, 56 into `handoffs/archive/`,
  root-level cleanup, the Yahoo PDF relocated).
- **Zero data loss, verified programmatically, not by inspection.** Every
  one of the 123 `D` (deleted) paths was matched against its new location
  and confirmed **byte-identical via `git hash-object`** (the deleted
  blob's HEAD hash vs. the new file's working-tree hash) — not just "a
  same-named file exists," an actual content checksum match:
  - 118/118 `docs/*` → `docs/archive/*` and `handoffs/*` → `handoffs/archive/*`
    moves: all MATCH.
  - The 5 remaining root-level deletions (`.project-delegation.md`,
    `CONTEXT_HANDOFF_PROTOCOL.md`, `RESUME_PROMPT.md` → all landed in
    `docs/archive/`; `template_trace.txt` → `scratch/template_trace.txt`;
    the Yahoo Docusign PDF → `.nfl/yahoo/...`): all 5 MATCH.
  - `docs/The Genius of Desperation.epub` /
    `docs/TheGeniusofDesperati_9781641250825_3892848.acsm` are among the
    118 — also confirmed byte-identical in `docs/archive/`.
- **No functional/CI breakage found.** Checked every place the moved
  filenames appear in live code (`agents/`, `scripts/`, `src/`,
  `.github/`, `package.json`):
  - Zero references in `.github/workflows/*` or `package.json` — no CI
    risk.
  - The handful of scripts that construct paths under the moved basenames
    (`build-betonline-0729-import.js`, `build-betonline-0810-import.js`,
    `build-futures-odds-execution-validation.js`,
    `build-intel-source-audit-report.js`, `season-readiness-smoke.js`)
    are all **write-only** targets (regenerate a fresh `docs/*_LATEST.*`
    or dated snapshot on next run) — confirmed none of them read the file
    back as an input. Not broken.
  - Live pipeline data dirs referenced at runtime
    (`docs/podcast-narratives/`, `docs/podcast-transcript-deep-dives/`,
    `docs/article-intel-review/`, `docs/antigravity/`) were untouched by
    the reorg — confirmed all 4 still present with their expected file
    counts.
  - Dozens of `// see docs/X.md §N` **code comments** across `agents/`,
    `scripts/`, `src/` now point at a since-archived path — cosmetic
    only (developer-facing comments, not runtime reads), left as-is; not
    worth a mechanical sweep for this many low-value doc-pointer
    corrections.
  - **One real (non-runtime-breaking) issue found and fixed**:
    `scripts/build-youtube-futures-intel-review.js` had 3
    `docs/PODCAST_HOLISTIC_INTEL_EXTRACTION_PLAN.md` references baked
    into **guardrail text strings that get written into generated JSON/
    report output** (not just source comments) — updated all 3 to
    `docs/archive/PODCAST_HOLISTIC_INTEL_EXTRACTION_PLAN.md`. Re-linted
    clean.
  - `docs/audits/` showing as untracked (`??`) is **not** new from this
    cleanup — confirmed via `git ls-tree HEAD -- docs/audits` (0 tracked
    files): it was never committed in the first place, unrelated
    pre-existing state.
- **Two judgment calls surfaced, both resolved directly with Andy this
  session** (no need to pull the Antigravity chat transcript — the
  technical audit above was conclusive on its own):
  1. The ebook/license files being archived contradicted the "leave
     as-is" decision made earlier in this same session (before Antigravity
     ran). **Andy's call: leave them archived** — Antigravity's state
     stands, no git action needed.
  2. The Yahoo PDF's new home (`.nfl/yahoo/`) is gitignored, so it would
     silently stop being tracked by git on next commit (content stays on
     disk either way). **Andy's call: intentional** — a signed personal
     document shouldn't be in git history going forward.
- **Bottom line: nothing is broken.** From a pure safety/correctness
  standpoint this archive reorg is sound and could be committed as its
  own narrow, reviewable change. Whether to actually commit it is still
  Andy's call (per every checkpoint's standing guardrail) — this session
  did not stage, commit, or push anything.
- Nothing committed/staged/pushed. Worktree preserved dirty as found, plus
  this session's edits (the LINT-1 fixes above and the one stale-pointer
  fix in `build-youtube-futures-intel-review.js`).

## Current Pick Up Here (2026-08-22, LINT-1 Fixed, Claude/Cowork)

- Andy asked to handle TASK_BOARD.md's LINT-1 backlog item ("212 pre-existing
  lint problems"). That description was stale: `docs/archive/
  LINT_CLEANUP_BACKLOG_2026-08-09.md` confirms the 212-problem sweep was
  already fully fixed and committed on 2026-08-10 (9 commits, re-verified
  clean at the time). Live lint state (freshly re-verified this session via
  scoped `node node_modules/eslint/bin/eslint.js <dir>` runs, per the sandbox
  workaround) was actually **0 errors / 14 warnings**, matching what
  Checkpoint 4 already confirmed with Codex on 2026-08-22.
- **Fixed 7 of the 14 warnings** (all `no-unused-vars`), 4 files touched:
  - `src/lib/keeperEvaluator.js` — `generateDraftStrategyInsights`'s
    `leagueSize` param is genuinely unused in the function body despite being
    computed and passed by its one real caller
    (`FantasyRosterManager.jsx:226`, `activeProfile.leagueSize`). Not a guess
    fix: prefixed `_leagueSize` (repo's escape-hatch convention) and left a
    `FLAGGED (lint cleanup, 2026-08-22, not fixed — needs Andy's call)`
    comment matching this repo's existing pattern for half-wired params —
    same treatment as the 2026-08-10 pass gave similar cases.
  - `src/components/fantasy/FantasyRosterManager.jsx` — removed 3 genuinely
    dead imports (`useEffect`, `loadFromStorage`, `saveToStorage`). Confirmed
    via grep this file's actual roster persistence goes through
    `fantasyLeagues.js`'s `getLeagueRoster`/`saveLeagueRoster`, not the raw
    storage helpers.
  - `src/App.jsx` — **two real bug fixes, not just suppression.**
    `picksRefreshKey` (from `useModals()`) and `autoGraded` (from
    `useAutoGrade()`) were both being bumped after sync/manual-grade/podcast-
    import events specifically to trigger a refresh, but neither was ever
    consumed anywhere — confirmed via grep, so those refresh triggers were
    silent no-ops. `useAutoGrade.js`'s own doc comment literally says
    "pass it as a `key`/`refreshKey` prop to force ... re-render," and
    `<OfficialPicksTab>`/`<PicksTracker>` were the only plausible targets (the
    call sites that bump each one are literally about picks/grading state).
    Wired `key={picksRefreshKey}` onto `<OfficialPicksTab>` and
    `key={autoGraded}` onto `<PicksTracker>`. Worth a manual browser check
    next time either tab is open — sync, manual grade, and podcast import
    should now visibly refresh those tabs where they silently didn't before.
  - `tests/unit/keeperEvaluator.test.js` — removed the unused
    `generateDraftStrategyInsights` import. That function has zero test
    coverage — flagged in a comment, not added (would need its own scoped
    test cases, out of scope for a lint fix).
- **Remaining 6 warnings** (`Icon`/`IconComp` "defined but never used" in
  `OutcomesDashboard.jsx`, `ExpertLeaderboard.jsx`, `FuturesPortfolio.jsx`,
  `Header.jsx` ×3, `AgentStatusModal.jsx`) are the exact known false-positive
  already investigated and deliberately left untouched on 2026-08-10 (a
  renamed-destructured-prop-used-as-a-JSX-tag pattern this repo's ESLint
  config mis-flags). Re-confirmed by direct inspection at every site this
  session — all genuinely rendered as `<Icon .../>`/`<IconComp .../>`. Left
  untouched, consistent with the prior decision.
- Verified via fresh `eslint` runs on every touched scope post-edit: 0
  problems. **Could not complete a full `npm run build`/vite production
  build from this session's device bridge** — 3 consecutive attempts timed
  out mid-`transforming...` (a known bridge I/O-latency limit for a repo
  this size, same root cause as the documented lint/test sandbox issue, not
  a code problem). Recommend Andy run `npm.cmd run build` natively as final
  confirmation, though the 4 edits are mechanical enough (two JSX `key=`
  props, an import cleanup, a param rename) that ESLint's clean parse across
  every touched file is strong signal on its own.
- `TASK_BOARD.md`'s `LINT-1` row (Bugs table) is now stale and should read
  as done/removed — **left `TASK_BOARD.md` untouched** per its own "PM agent
  is the sole writer of this file" note; flagging here instead of editing it
  directly.
- **Unrelated to, and did not touch**, the broad Antigravity archive cleanup
  described in the Codex entry directly below (`docs/archive/`,
  `handoffs/archive/`, ebook/PDF relocations) — that's a separate,
  still-unreviewed workstream. This session's edits are confined to
  `src/lib/`, `src/App.jsx`, `src/components/fantasy/`, and `tests/unit/` —
  no `docs/`, `handoffs/`, or root-file changes made.
- Nothing committed, staged, or pushed. Worktree preserved dirty as found,
  plus these 4 edits.

## Current Pick Up Here - 2026-08-22 11:55 PT - Codex

Codex reviewed Claude/Cowork Checkpoints 3, 4, and 5 in sequence. Checkpoints
1-4 are Codex-approved. Checkpoint 5 item 14 had an initial blocker, then a
correction pass that Codex approved for the state that existed at the time:
tracked ebook/license files had been restored, `_to_delete_checkpoint5_item14/`
was gitignored, and the 12 `dist.old-*` / `dist-verify-*` snapshot folders were
empty.

The repo moved again after that approval. Live state now includes a broader
Antigravity non-code archive cleanup that has not been Codex-reviewed:

- 68 files now exist under `docs/archive/`.
- 56 files now exist under `handoffs/archive/`.
- Many original `docs/*` and `handoffs/*` paths show as tracked deletions.
- `docs/The Genius of Desperation.epub` and
  `docs/TheGeniusofDesperati_9781641250825_3892848.acsm` are again deleted
  from `docs/` and present under `docs/archive/`.
- `Complete_with_Docusign_Personal_Use_-_Andrew_NFL_Dashboard_Yahoo_API_agreement.pdf`
  is deleted from repo root and present at `.nfl/yahoo/...`.
- `HANDOFF.md` had been replaced by a short Antigravity handoff that only
  described Checkpoints 1-3; this file now supersedes that rolling text.

Do not treat the broad archive cleanup as approved. The immediate next action
is to review/reconcile that archive pass before any commit, staging, or next
checkpoint work.

## Verified In This Codex Handoff

- `git status --short --branch` shows `main...origin/main`; latest visible HEAD
  from prior checks remains `7840966`.
- `docs/audits/2026-08-21-codex-independent/CHECKPOINT_5_SUMMARY.md` exists and
  includes the correction-pass narrative, but parts of it are now stale relative
  to live state because the later archive cleanup moved the ebook/license files
  into `docs/archive/`.
- `.gitignore` has `_to_delete*/`, so `_to_delete_checkpoint5_item14/` is
  protected from accidental broad staging.
- The 12 build snapshot folders from Checkpoint 5 remain empty of files.
- Live `dist/` was previously verified present after Checkpoint 5 correction.
- No Codex commit, push, Supabase write, betting/pick action, portfolio change,
  Yahoo work, paid model/API call, or fresh synthesis was performed.

## Active Review Boundary

Review these current cleanup/archive changes as their own workstream:

- `docs/archive/` additions versus tracked deletions from root `docs/`.
- `handoffs/archive/` additions versus tracked deletions from root `handoffs/`.
- Root cleanup deletions: `.project-delegation.md`,
  `CONTEXT_HANDOFF_PROTOCOL.md`, `RESUME_PROMPT.md`, `template_trace.txt`, and
  the root Yahoo Docusign PDF.
- Whether the tracked ebook/license files should be archived/deleted or restored
  to their original `docs/` paths.
- Whether `HANDOFF_PROMPT.md` and `WORKING-CONTEXT.md` should be rewritten to
  point at the new archive layout.

Until that review is complete, preserve all dirty/untracked work. Do not use
`git add -A`.

## Checkpoint Status

- Checkpoint 1: Codex-approved.
- Checkpoint 2: Codex-approved.
- Checkpoint 3: Codex-approved. Lazy modal/tool loading, lazy agent mode
  bodies, and bundle budget script verified.
- Checkpoint 4: Codex-approved. Lint errors restored to zero; 14 warnings
  remain triaged; focused 48-test audit smoke passed.
- Checkpoint 5 item 14: correction pass was approved for the pre-archive state,
  but the later broad archive cleanup needs its own review before item 14 should
  be treated as commit-ready.
- Checkpoint 5 item 15 / Yahoo secret rotation: out of scope and still not
  confirmed here.

## Resume Prompt

Resume in `E:\dev\projects\NFL_Dashboard`.

First run:

- `git status --short --branch`
- `git log -n 8 --oneline --decorate`
- `git branch -vv`
- `git diff --stat -- .gitignore HANDOFF.md HANDOFF_PROMPT.md WORKING-CONTEXT.md docs handoffs .project-delegation.md CONTEXT_HANDOFF_PROTOCOL.md RESUME_PROMPT.md Complete_with_Docusign_Personal_Use_-_Andrew_NFL_Dashboard_Yahoo_API_agreement.pdf template_trace.txt`

Read first:

- `HANDOFF.md`
- `HANDOFF_PROMPT.md`
- `WORKING-CONTEXT.md`
- `handoffs/2026-08-22-1155-codex-checkpoint5-archive-cleanup-handoff.md`
- `docs/audits/2026-08-21-codex-independent/CHECKPOINT_5_SUMMARY.md`
- `docs/audits/2026-08-21-codex-independent/CODEX_CHECKPOINT_3_REVIEW.md`
- `docs/audits/2026-08-21-codex-independent/CHECKPOINT_4_SUMMARY.md`

Objective:

Independently review the current broad non-code archive cleanup before any
commit or next checkpoint. Confirm whether the moved docs/handoffs, root cleanup
files, Yahoo PDF relocation, and tracked ebook/license archive are intentional
and safe. Separate this review from the already-approved code checkpoints.

Guardrails:

- Preserve the dirty worktree.
- No `git clean`, destructive reset/checkout, blind revert, broad staging,
  `git add -A`, commit, or push without Andy's explicit approval.
- No Supabase writes, betting, official picks, portfolio/parlay mutation,
  recommendation persistence, Yahoo work, paid model/API call, or fresh
  synthesis without explicit approval.
- Stage narrowly by workstream only after review.
