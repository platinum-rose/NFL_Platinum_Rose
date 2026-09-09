# Codex review request — post-round-10 session wrap (2026-09-09)

## Context

Your round-10 review closed the Stage 5 SOURCE HIERARCHY resolver-hardening
thread: "The resolver-hardening thread is now done. No round 11 is needed
for `resolvePath()`." Two minor, non-blocking observations from that review
were applied anyway (below). Everything after that point in this document
is separate work from the same session, zoomed out to the rest of the
portfolio-synthesis pipeline at Andy's request ("what else needs our
attention"). None of it touches the SOURCE HIERARCHY evidence-tier gate's
core logic — it's five independent fixes/additions across data freshness,
a real pagination bug, a real empty-coverage bug, and one new free-data
scraper. Grouped by area below, each with what changed, why, and how it
was verified. Nothing staged, committed, or pushed — worktree is still the
same intentionally-dirty state it's been in since 2026-08-21.

## 0. Round-10 polish (from your own review, applied for completeness)

Your round-10 review flagged two minor, non-blocking items while
confirming the resolver-hardening thread was closed:

1. **Comment precision**: the round-8 comment claimed the own/enumerable
   check on `resolvePath()`'s string branch only ever matches a plain data
   property. You noted `propertyIsEnumerable()` also returns true for an
   own enumerable *accessor* (getter), so the comment overclaimed slightly.
   Fixed: the comment now says "this permits an own enumerable
   ACCESSOR/getter, not only a data property; dossier objects are plain
   `JSON.parse()` output, which never has getters, so this distinction has
   no practical effect on real input, per Codex's round-10 review" — see
   `agents/lib/board-validate.js` ~line 715.
2. **Test hygiene**: the round-10 regression test polluted
   `Array.prototype[0]` and cleaned it up with a bare `delete`, which
   would silently misbehave if some other code had already defined a
   real descriptor at that index. Fixed: the test now captures
   `Object.getOwnPropertyDescriptor(Array.prototype, 0)` before polluting
   and restores it (or deletes only if there was none) in the `finally`
   block — see `tests/unit/evidenceTierGate.test.js` ~line 654.

No behavior change, no new tests. Test count unchanged at 129.

## 1. `vault_notes` pagination bug (real, fixed)

Andy's `agents/portfolio-preflight.js` (a free, read-only Supabase
row-cap/staleness scanner, unrelated to SOURCE HIERARCHY) flagged two
`vault_notes` reads in `loadVaultReferenceEvidence()`
(`agents/portfolio-synthesize.js` ~line 1252) as truncation risks —
`vault_notes` has grown past PostgREST's silent 1000-row cap, and any
`.from(table).select(...)` without `.range()`/`.limit(n<1000)`/`head:true`
gets silently truncated with no error.

On inspection, one was a scanner false positive: the reference-docs read
uses `.in('path', docPaths)` where `docPaths` is always exactly 6 entries
(from `REFERENCE_DOC_FILES`) — `.in()` can never return more rows than
the array it's given, regardless of table size. Made the bound explicit
with a matching `.limit(docPaths.length)` anyway so the site is
self-documenting as safe rather than safe by accident.

The other was real: the team-notes read (`.like('path', 'NFL/Teams/%')`)
is genuinely unbounded by table size. Fixed with `.range()` pagination +
`.order('path', {ascending: true})` as the tiebreaker (a per-row-unique
vault key), matching the existing convention in
`agents/portfolio-dossier.js`'s `fetchAllPaged()` and
`scripts/export-vault-to-md.js`'s `fetchAllNotes()`.

**Verification**: `node --check` clean; scoped eslint zero errors; live
preflight run before/after — `A:rowcap` lane went from 2 BLOCK to a clean
pass, overall BLOCK count 5→3 at that point in the session. This function
has no unit test coverage (only the live preflight check exercises it —
pre-existing gap, not something this fix introduced or should have fixed
given its narrow scope).

## 2. `coaching_profile` empty-in-every-dossier bug (real, fixed — 2 parts)

Live preflight also flagged `team_coaching_tendency_snapshots` empty for
every season, and the dossier build separately reported `coaching_profile`
0/32 teams in every run. Traced to two independent problems:

**Part A — data never seeded.** A full season-2025 coaching-tendency
artifact (`data/generated/team-profiles/team-coaching-tendency-snapshots-
2025-w18.json`, 32 teams, generated back in July) existed on disk but had
never been written to Supabase. Ran the existing
`scripts/seed-team-profile-snapshots.js --season 2025 --table
team_coaching_tendency_snapshots --apply` after a clean dry-run review
(Andy approved the write in-conversation first, since it's a Supabase
write). 32 rows upserted; confirmed via preflight
(`team_coaching_tendency_snapshots`: empty-for-all-seasons → 32 rows).

**Part B — the actual bug.** `agents/portfolio-dossier.js`'s
`fetchCoachingProfiles()` (and the same pattern for
`fetchAnalyticsSnapshots()`/`fetchDvoaSnapshots()`) already has a local
JSON-artifact fallback, `loadGeneratedProfileRows()` (~line 456), meant
to catch Supabase legitimately returning zero rows for a season with no
games played yet (2026 has none as of this writing — week 1 hasn't
kicked off). The fallback was self-defeating: it hard-filtered candidate
artifacts to the *current* SEASON constant (2026) in both the filename
match and `payload.meta.season`, so even with 2025 data on disk (the
only data that could possibly exist pre-kickoff), the fallback would
never select it and silently returned `[]`. This affected coaching
*and* analytics identically (both only had 2025-dated artifacts on
disk); DVOA happened to have a 2026 artifact already so wasn't visibly
broken, but shared the same latent bug.

Fixed: `loadGeneratedProfileRows()` now reads every artifact matching
the prefix (not just ones with the current season in the filename),
prefers an exact current-season match if one exists, and otherwise falls
back to the most recent *prior* season (never a future one), logging a
`console.warn` when it does so the fallback is visible in run logs, not
silent. Each row still carries its own `season`/`snapshot_at` fields
from the original artifact — the fallback relabels nothing, so any
downstream freshness or evidence-tier logic that reads those fields sees
this honestly as prior-season data, not current-season data.

**Verification**: `node --check`/eslint clean on
`agents/portfolio-dossier.js`. Regenerated the dossier live
(`node agents/portfolio-dossier.js` — read-only against Supabase, no
paid API calls, no DB writes, just a local JSON/markdown snapshot
build): log now shows `team-analytic-snapshots-: no season-2026
artifact found; using season-2025 as a stale prior (...)` and the same
for coaching; dossier's own summary line went from `0 w/ coaching
profiles` / `0 w/ EPA analytics` to `32 teams w/ EPA analytics · 32 w/
DVOA · 32 w/ coaching profiles · ...`. Preflight's `signal_coverage`
check (which reads the dossier's own reported per-signal team counts)
confirmed `coaching_profile` dropped off its "ZERO team coverage" list.

**No unit test coverage added.** This function has none currently (same
situation as `loadVaultReferenceEvidence()` above) — flagging in case
you think it's worth a synthetic-artifact-directory test given it's now
had one real production bug.

## 3. Caesars futures — new free scraper (new code)

Unrelated to any Codex-reviewed logic, but new code worth a look: Andy's
`futures_odds_snapshots` freshness check was BLOCKing on Caesars (10.4d
stale) and Circa (never captured). TheOddsAPI (the existing
`agents/futures-odds-ingest.js` source) can't reach Caesars without a
paid-plan upgrade (`williamhill_us` is gated) and doesn't offer Circa at
any tier. Andy wanted a fully free alternative.

Verified live that `vegasinsider.com/nfl/odds/futures/` server-renders a
real odds table (bet365/BetMGM/DraftKings/Caesars/FanDuel) on a plain
GET request — no JS execution, no login, no anti-bot barrier observed.
Cross-checked its Rams (+500) and Bills (+1000) values against
already-confirmed betmgm/fanduel `superbowl` rows already in
`futures_odds_snapshots` from the same session — exact match — which
confirms the table (whose internal HTML id/data-content oddly label it
"nfl championship winner") is actually the Super Bowl Winner outright
market, not conference winner. Wrote `market_type: 'superbowl'` to match
the real content, not VI's internal mislabel.

New file: `scripts/scrape-vegasinsider-futures.js`. Design notes for
review:
- Parses the book-column order from the table's own `<thead>` at scrape
  time (`book-pinup blank"><span class="hidden">BookName</span>` pattern)
  rather than hardcoding a column index — a column reorder on VI's end
  changes which index maps to which book, not which book gets which
  number.
- Refuses to write on zero parsed rows (`throw` rather than silently
  writing nothing) and warns if fewer than 20 of the expected ~32 teams
  parse, on the theory that a partially-broken parse should be loud, not
  silently accepted as "the market must just be thin today."
- Row shape matches the existing `futures_odds_snapshots` schema and the
  `agents/futures-odds-ingest.js` convention exactly (same
  `market_type`/`team`/`book`/`odds`/`implied_prob`/`selection`/`price`/
  `captured_at`/`snapshot_time`/`season` fields, same
  `onConflict: 'market_type,team,book,snapshot_time'` upsert key).
- `--book` flag currently supports `caesars` (what was needed) but the
  column-name map (`BOOK_LABEL_TO_KEY`) also covers bet365/betmgm/
  draftkings/fanduel if useful later — those are already covered by
  TheOddsAPI so not run today, but the same table could backfill them
  too without new code.
- No API key required. Ran with real credentials
  (`SUPABASE_SERVICE_ROLE_KEY`) after a `--dry-run` pass was reviewed —
  32 Caesars rows written.

Added `npm run ingest-futures:caesars` alias in `package.json`.

**Verification**: `node --check`/eslint clean; `--dry-run` output
manually cross-checked against a raw `curl` + Python parse of the same
page done independently during investigation (identical 32-row output,
same Ravens = +1300 spot-check); live run wrote 32 rows; preflight
confirmed `caesars` freshness 10.4d → 0.0d.

**Deliberately NOT built**: an equivalent scraper for Circa. Investigated
the free odds widget on `wagertalk.com` (the other free source in play)
down to its actual transport and found it's not an HTTP/JSON API at all
— it's a proprietary WebSocket protocol
(`freeodds.oddslogic.com/.../WSclient.js`) with a plaintext
`username:password` login line and a custom pipe-delimited command/
response format requiring its own parser suite (multiple
`Parser*.js` files just to decode schedules/lines/sportsbooks/scores).
Guest credentials and server host aren't present in the static JS files
reachable without a deeper live-session trace. Judged this
disproportionate effort/fragility for one book's futures data and did
not build it — flagging here mainly so it's on record as evaluated, not
overlooked. Circa remains the one open `futures_odds_snapshots` BLOCK.

## Cumulative live-preflight delta this session

Before this session's non-SOURCE-HIERARCHY work: 3 BLOCK / 8 WARN / 22
PASS. After: **1 BLOCK / 7 WARN / 25 PASS** (`safe_to_run_paid_synthesis:
false`, sole blocker Circa — a genuine, currently-unfixable-for-free data
gap, not a code defect). Also cleared this session but not by code
changes (Andy ran the existing refresh scripts once instructed which
ones to run): `data/player-availability/latest.json` and
`data/prediction-markets/latest.json` both went from 2+ weeks stale to
0.0d. Not included above since no code changed for those two.

## What we'd like from you

1. Anything wrong or overreaching in the `loadGeneratedProfileRows()`
   prior-season fallback (section 2, part B) — in particular, is silently
   falling back across season boundaries ever the wrong call for a
   different consumer of this same helper (analytics/DVOA) in a way
   coaching profiles wouldn't hit? It's the same function serving three
   different signal types.
2. Any concern with the `vault_notes` pagination fix's ordering-by-`path`
   tiebreaker (section 1) given `NFL/Teams/%` paths — is `path` actually
   guaranteed unique/stable enough for `.range()` correctness, or could a
   concurrent write between pages produce a gap/duplicate the same way
   an unstable sort would?
3. Any concern with the new scraper (section 3) writing directly to a
   production table Codex hasn't seen code for before — schema fit,
   `onConflict` correctness, anything about scraping a third-party page
   for production betting data that should be handled differently than
   an official API source (staleness labeling, provenance tagging, etc.)?
4. Anything else a cumulative read of this whole document turns up,
   including anything in section 0's polish that deserves a second look.

This is a session wrap, not a numbered round — work on NFL_Dashboard
continues in a fresh session from here, so treat this as a full status
snapshot rather than "round 11."
