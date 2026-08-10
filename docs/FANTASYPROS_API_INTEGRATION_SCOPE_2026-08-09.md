# FantasyPros API Integration — Scope (draft)

**Status (updated 2026-08-10):** §1 (ADP) built and verified live end-to-end 2026-08-09 —
439 rows ingested, flowed through `fantasy-value-report.js` to a real value board (251
value plays, 72 reaches, 87 no-projection). §2 backend built+live-verified 2026-08-09;
**React UI shipped 2026-08-10** (`FantasyRankingsPanel.jsx`, a toggle inside the existing
Fantasy tab). **§3 (projections) and §4 (injuries) built 2026-08-10** — code complete,
unit-tested via the plain-node harness, but **not live-verified**: the Cowork sandbox
cannot make any outbound network call at all (confirmed live 2026-08-10 — `fetch failed`
on every attempt, ESPN/Supabase/FantasyPros all equally unreachable from here, same root
cause as TASK_BOARD F-31). §3's field mapping IS live-confirmed (reuses the same
`points`/`points_ppr`/`points_half`/`rush_*`/`rec_*`/`fpid`/`name` fields §0 already
verified 2026-08-09). **§4 field mapping LIVE-CONFIRMED 2026-08-10** — Andy ran
`--live-fantasypros-injuries --dry-run` natively (187 events, 120 real FantasyPros rows
parsed, no errors) and then a raw-vs-mapped diagnostic dump; every guessed field name
resolved correctly (`name`, `status`, `comment`, `injury_type`, `team_id`, `position_id`,
`probability_of_playing`, `practice_1/2/3` all matched real response keys) except one
genuine remaining issue: `reported_at`'s source field (`injury_update_date`) is a naive,
timezone-less datetime string, so the ISO conversion's absolute instant depends on the
running machine's local timezone — flagged in code, not yet resolved (see
`agents/lib/fantasypros-injuries.js`), low-impact since it's informational-only (not a
join/dedupe key). **§3's field mapping had a REAL BUG, found and fixed 2026-08-10**: a
live dry-run mapped 0/84 rows with no error — the same diagnostic-dump approach showed
every stat/points field (`points`, `points_ppr`, `rush_att`, `pass_yds`, etc.) actually
lives nested under a `stats` sub-object (`player.stats.points`, not `player.points`),
which the original mapper didn't account for. `fpid`/`name`/`position_id`/`team_id` were
flat and correct from the start. Also corrected `pass_ints` (not `pass_int`) and
`fumbles` (not `fumbles_lost`) as the real field names. Fixed in
`agents/lib/fantasypros-projections.js`, regression-tested against the real captured
Josh Allen payload (`tests/unit/fantasyProsProjections.test.js`). **Both §3 and §4's
field mappings are now live-confirmed against real data.** Still outstanding: an actual
Supabase write test for either (both runs so far were `--dry-run`). · **Date:**
2026-08-09, updated 2026-08-10 · **Verified 2026-08-09** via live test calls against
Andy's real key + the real API docs (`api.fantasypros.com/public/v2/docs`)
**Trigger:** Andy has a FantasyPros API key, intended as the primary research engine for
fantasy player data. This doc maps that key onto the four places it fills gaps already
on record in this repo, before any of the four gets built.

---

## 0. What the API gives us

REST/JSON API at `api.fantasypros.com/public/v2/json`, auth via an `x-api-key` header.
**Confirmed 2026-08-09: Andy's key is on the premium plan** (1 req/sec, 500 req/day, full
responses — checked directly on the FantasyPros API key dashboard, not inferred). The
§5.6 "free tier" framing from the docs' own opening line was wrong/stale for this key —
struck through below.

**Real gotcha, unrelated to plan tier — confirmed live 2026-08-09:** `/nfl/players`
silently defaults to a **10-row page** if `limit` isn't passed, with no error and no
pagination metadata pointing to it (the docs page for this endpoint doesn't mention
`limit` at all). `count` in the response correctly reports the true total (501 as of
this date); `players.length` silently truncates to 10 without it. `&limit=2000` fixes
it — see `agents/fantasypros-adp-ingest.js`. Ruled out a plan-tier restriction by
confirming `consensus-rankings` and `projections` both return full untruncated data on
the same key without any `limit` param — this is `/players`-specific.

**Another gotcha — don't confuse these:** `consensus-rankings?type=ADP` (a valid `type`
value, confirmed live) sounds like it should return real average-draft-position data, but
its player objects still only carry `rank_ecr` — it's Expert Consensus Rank computed from
a small (3-expert, as of this date) ADP-focused panel, not literal numeric ADP from real
completed drafts. The real ADP fields (`rank_adp`, `rank_adp_ppr`) only exist on
`/nfl/players` — that's the one that matters for §1, not this one.

Confirmed live (real key, real responses, not docs-only guesses):

- `GET /nfl/players` — the full player universe (~8,660 rows across all positions/DST,
  no server-side position filter) with `rank_ecr`, `rank_adp`, `rank_ecr_ppr`,
  `rank_adp_ppr`, `rank_ecr_half` side by side per player — **real ADP, distinct from
  ECR** (see §1). No `rank_adp_half` field exists.
- `GET /nfl/{season}/consensus-rankings?position=<one enum value>&type=ST|WEEKLY&week=N&scoring=STD|PPR|HALF`
  — Expert Consensus Rankings, draft or weekly. `position` is **required** and must be a
  single value from `QB, RB, WR, TE, K, OP, FLX, DST, IDP, DL, LB, DB, TK, TQB, TRB, TWR,
  TTE, TOL, HC, P` — `ALL` is rejected live despite appearing in the docs' schema enum for
  a different endpoint (`/rankings`, not `/consensus-rankings`) — confirmed by testing, not
  assumed.
- `GET /nfl/{season}/projections?position=<enum>&week=N&ros=true|false` — stat-line
  projections. **Already returns `points`, `points_ppr`, and `points_half` pre-computed
  per player** — no need to implement the spec §2 scoring formula ourselves for this
  source (see §3). Uses different field names than the rankings endpoints (`fpid`/`name`
  vs. `player_id`/`player_name`) — needs its own join-key handling.
- `GET /nfl/{season}/player-points?position=&scoring=STD|PPR|HALF&start=&end=` — actual
  historical fantasy points scored per player/season, configurable scoring. A possible
  future alternate/cross-check source for Phase A's history regression (currently
  nflverse-based) — not in scope for this pass, noted for later.
- `GET /nfl/injuries?year=&week=&include_probabilities=true` — structured injury/practice
  report data (`status`, `probability_of_playing`, `practice_1/2/3`). **Now in scope — see
  §4.**
- `GET /nfl/news?category=injury|recap|transaction|rumor|breaking&limit=` — categorized
  news items with impact text. Could feed a panel similar to the existing Podcast Fantasy
  Intel one. Also out of scope here.

---

## 1. ADP — smallest lift, closes an open question ✅ BUILT & VERIFIED 2026-08-09

`docs/FANTASY_VALUE_VS_ADP_SPEC.md` §3 lists FantasyPros as a candidate ADP source and
asks outright: *"ADP source for v1 — manual CSV seed, or wait for a scrape/API?"* That
question has been open since the spec was drafted (2026-07-16).

**Resolved 2026-08-09: real ADP is confirmed live**, and it's genuinely distinct from ECR
(the value-board spec needs both to stay separate — ADP is what drafters actually do,
ECR/projection is the model side, and `value_gap` is the gap between them). Source is
`GET /nfl/players`, fields `rank_adp` (overall) and `rank_adp_ppr` (PPR) — **not** the
`consensus-rankings` endpoint, which only carries `rank_ecr`. No half-PPR ADP variant
exists on this key/tier; half-PPR leagues would need to interpolate or fall back to
overall ADP.

One wrinkle confirmed live: `/nfl/players` returns the full relevant player universe in
one call (501 rows as of 2026-08-09, all sports positions including team DST, no
server-side position filter param) **only if `&limit=` is passed generously** — it
silently defaults to a 10-row page otherwise, with no error (see §0). The ingest script
passes `limit: 2000` and filters client-side to QB/RB/WR/TE, same scoping
`player_season_stats` already applies.

**Good news: no schema work needed.** The `fantasy_adp` table (migration
`034_fantasy_adp.sql`) already has a `source` column defaulting to `'manual'` — it was
built source-agnostic on purpose. A FantasyPros ingest just writes rows with
`source: 'fantasypros'`, same shape `scripts/parse-adp.js` already writes for the manual
CSV path. `agents/fantasy-value-report.js`'s `loadAdpFromTable()` already reads "latest
`as_of_date`" with no source filter — works unmodified.

**Build:** `agents/fantasypros-adp-ingest.js` (mirrors `agents/schedule-ingest.js`'s
dotenv/fetch/Supabase-write shape) → `npm run ingest-fantasypros-adp` /
`:dry`. One call to `/nfl/players`, filter to QB/RB/WR/TE, map `rank_adp`/`rank_adp_ppr`
→ `adp` (by scoring format), upsert into `fantasy_adp` with `source: 'fantasypros'`.
Pure logic in `agents/lib/fantasypros-adp.js` (unit-tested,
`tests/unit/fantasyProsAdp.test.js`, 8/8 passing), shared fetch wrapper in
`agents/lib/fantasypros-client.js`.

**Verified live end-to-end 2026-08-09:** real run loaded 439 QB/RB/WR/TE rows into
`fantasy_adp` (367/439 resolved a `player_id` join against `player_stats` by name — the
other 72 are name-join misses, not data-quality issues, and don't block the board since
it can join on name alone). `npm run report:fantasy` then produced a real board: 610
nflverse stat rows × 439 FantasyPros ADP rows → 251 value plays, 72 reaches, 87
no-projection (29 land in the untallied "fair" tier).

**Two bugs found and fixed along the way, both outside the FantasyPros code itself:**
1. `Number(null)` is `0` in JS, not `NaN` — a player with no ADP was silently ranking
   #1 instead of being excluded. Caught by a unit test before it ever hit real data.
2. `/nfl/players` silently defaults to a 10-row page without `&limit=`, no error, not
   a plan-tier issue (see §0). Needed `&limit=2000`.
3. Unrelated pre-existing bug, found only because it blocked verifying this work:
   `agents/fantasy-value-report.js`'s CLI "run directly" guard compared two
   independently-resolved paths with a case-sensitive `===`, which can silently fail on
   Windows due to drive-letter casing (`E:\` vs `e:\`) — the exact same pattern existed
   in 10 other `scripts/*.js` files repo-wide, all fixed the same session (see
   `TASK_BOARD.md` → `GUARD-FIX`).

---

## 2. Weekly rankings / start-sit — the literal original ask

TASK_BOARD F-26's notes call out "roster/waiver intel + weekly-projections spec (the
literal original ask)" as still open — this is it. FantasyPros' weekly ECR by position
and scoring format is exactly the "who should I start" data that was requested when F-26
was first filed.

**New table needed** (no existing one fits — `fantasy_adp` is draft-only, not weekly):

```sql
create table public.fantasy_rankings (
  id           bigserial primary key,
  player_id    text,
  player       text not null,
  position     text not null,
  team         text,
  season       int not null,
  week         int,                    -- null = season-long/draft ECR, else weekly
  scoring      text default 'ppr',
  rank_ecr     int not null,
  rank_best    int,
  rank_worst   int,
  std_dev      numeric,
  tier         int,
  source       text not null default 'fantasypros',
  as_of_date   date not null default current_date,
  created_at   timestamptz not null default now(),
  unique (player, position, season, week, scoring, source, as_of_date)
);
```

**Build:** `agents/fantasypros-rankings-ingest.js` + a new read-only dashboard panel
(same pattern as `FantasyValueBoard.jsx` — fetch a generated JSON, filter by
position/week). Weekly cadence during the season; this is genuinely new UI, not a drop-in
to the existing value board.

**Backend built 2026-08-09, not yet live-verified.** Migration
`supabase/migrations/046_fantasy_rankings.sql`, pure mapping in
`agents/lib/fantasypros-rankings.js` (unit-tested, `tests/unit/fantasyProsRankings.test.js`,
15/15 passing via the same plain-node harness pattern used for §1 — `vitest` still hangs
in the Cowork sandbox), CLI in `agents/fantasypros-rankings-ingest.js`
(`npm run ingest-fantasypros-rankings:draft` / `:dry`; weekly runs via
`--type weekly --week N`, no fixed npm script since the week number changes every run).

Two real design decisions baked in during the build, not just a mechanical port of §1's
pattern:
- **`week` defaults to `0` for season-long/draft rows, never `null`.** Postgres treats
  `NULL` as distinct-from-itself in a unique constraint, so a nullable `week` would let
  every re-run of the season-long ingest silently accumulate duplicate rows instead of
  upserting cleanly. `0` also matches the FantasyPros API's own convention (its response
  `week` field is literally `"0"` for draft/season-long).
- **One position per call, rate-limit-respecting loop.**
  `consensus-rankings` requires exactly one `position` per call (`ALL` is rejected,
  confirmed in §1's build) — the ingest script loops QB/RB/WR/TE sequentially with an
  explicit ~1.1s delay between calls to respect the plan's confirmed 1 request/second
  limit.

**UI shipped 2026-08-10:** `src/components/fantasy/FantasyRankingsPanel.jsx` — a toggle
inside the existing Fantasy tab (`FantasyValueBoard.jsx` now has a "Value Board" /
"Weekly Rankings" segmented control at the top, no App.jsx/Header changes needed since
both stayed inside the one existing `fantasy` tab). Reads `fantasy_rankings` **directly
via Supabase's public-read RLS policy** rather than through a generated JSON file like
the Value Board does — the table is small (a few hundred rows per `as_of_date`) and this
skips a report-generation/sync step, so the panel always shows the true latest ingest.
New `getFantasyRankings()` / `getFantasyRankingsAvailableWeeks()` helpers added to
`src/lib/supabase.js`. §2 is now done to the same standard as §1.

**Dry-run verified live 2026-08-09.** Against the real key: 661 rows across QB (98) /
RB (173) / WR (239) / TE (151), total_experts 89-94 per position — healthy, plausible
data (Josh Allen QB1, Lamar Jackson QB2 checks out for 2026). Migration applied in
Supabase. **The real (non-dry) run then hit a genuine bug on its first attempt:**
`fantasy_rankings upsert: ON CONFLICT DO UPDATE command cannot affect row a second time`
— Postgres can't apply an upsert's DO UPDATE to the same conflict-key row twice within
one statement, which means FantasyPros' response contained two entries for the same
`(player, position)` within a single position call — a real data artifact on their end
(root cause unconfirmed, possibly a trade-transition duplicate), not a mapping bug on
ours. Added `dedupeRankings()` to `agents/lib/fantasypros-rankings.js` (keeps the row
with the better/lower `rank_ecr`, logs every collision rather than silently dropping
data) and wired it into the ingest script before every write, dry or real — not just as
a one-time patch, since this could recur on any future pull. 4 new regression tests
added, verified via the plain-node harness.

**Re-run confirmed the fix works 2026-08-09.** Real ingest: caught the exact 1 collision
predicted (Isaiah Williams, WR, ranked both 190 and 220 — kept 190), logged it, upserted
all 660 deduped rows cleanly (500 + 160 in two chunks). §2's backend is done to the same
standard as §1 — real data, real bug found and fixed, real write confirmed.

---

## 3. Phase B value-board projections — unblocks a stalled feature ✅ BUILT 2026-08-10, LIVE-VERIFIED + BUG FIXED 2026-08-10

The value board's "sharp" version (market-derived `proj_ppr`, not history-regression) is
Phase B in the spec, and it's been blocked since 2026-07-16 on sourcing real season-long
*sportsbook player-prop odds* into `player_prop_odds` — a separate, harder problem shared
with `PROPS-1` on TASK_BOARD.

FantasyPros' consensus season-long projections are a **different, independent path** to
the same output (a projected stat line → `proj_ppr` via the spec's existing scoring
formula in §2) that doesn't wait on the props subsystem. It's the market's *expert*
median rather than the *betting* median — a reasonable substitute, arguably a reasonable
permanent second source even after real prop odds land (compare/blend the two).

**Confirmed live 2026-08-09 — simpler than originally planned.** `GET
/nfl/{season}/projections?position=<enum>` already returns `points`, `points_ppr`, and
`points_half` **pre-computed per player**, alongside the raw stat line (rush_att,
rush_yds, rush_tds, rec_rec, rec_yds, rec_tds, etc.). We don't need to implement the spec
§2 scoring formula for this source at all — just read the right `points_*` field for the
chosen scoring format. Note the field names differ from the rankings endpoints (`fpid`,
`name` here vs. `player_id`, `player_name` there) — the ingest needs its own join-key
logic, not a shared one.

**New table:**

```sql
create table public.fantasy_projections (
  id           bigserial primary key,
  fpid         text,                   -- FantasyPros player id (raw, from the API)
  player       text not null,
  position     text not null,
  team         text,
  season       int not null,
  week         int,                    -- null/0 = preseason season-long; else weekly
  ros          boolean default false,
  rec          numeric, rec_yds numeric, rec_td numeric,
  rush_att     numeric, rush_yds numeric, rush_td numeric,
  pass_yds     numeric, pass_td numeric, interceptions numeric,
  proj_std     numeric,                -- API's own points (standard)
  proj_ppr     numeric,                -- API's own points_ppr
  proj_half    numeric,                -- API's own points_half
  source       text not null default 'fantasypros',
  as_of_date   date not null default current_date,
  created_at   timestamptz not null default now(),
  unique (player, position, season, week, ros, source, as_of_date)
);
```

**Build:** `agents/fantasypros-projections-ingest.js`, plus a `--source fantasypros`
option on `agents/fantasy-value-report.js` so it can compute `value_gap` against
FantasyPros projections instead of (or alongside) the Phase A history regression, without
touching the Phase A code path.

This is the biggest build of the three and the one with a real open design question (see
§5.4) — recommend building it last, after ADP and weekly rankings prove out the shared
client code.

**Built 2026-08-10.** Migration `supabase/migrations/047_fantasy_projections.sql`, pure
mapping in `agents/lib/fantasypros-projections.js` (`mapProjections()` +
`dedupeProjections()` — same defensive dedupe as §2's, applied preemptively rather than
waiting to hit the same Postgres "cannot affect row a second time" error live), CLI in
`agents/fantasypros-projections-ingest.js` (`npm run ingest-fantasypros-projections` /
`:dry`), and a `--source fantasypros` flag on `agents/fantasy-value-report.js`
(`npm run report:fantasy:fantasypros`) that resolves §6 open question 4: **alongside
Phase A, not replacing it** — writes to its own `-fantasypros`-suffixed output files
(`docs/fantasy/value-board-<date>-fantasypros.*`, `public/fantasy-value-board-fantasypros.json`),
never touching Phase A's default filenames, so the existing Fantasy tab keeps working
unchanged. New `buildBoardFromProjections()` mirrors `buildBoard()`'s ADP-join/rank/tier
logic exactly, minus the regression math (a FantasyPros row's `proj_points` comes
straight from the table, no `posMean`/`K` needed). Unit-tested (`tests/unit/
fantasyProsProjections.test.js`, plain-node harness verified — `buildBoardFromProjections()`
against a hand-built ADP/proj fixture, passing).

**Live-verified 2026-08-10 — and a real bug found and fixed.** Andy ran
`npm run ingest-fantasypros-projections:dry` natively: **0/84 rows mapped for every
position, no error thrown.** A raw-vs-mapped diagnostic dump (same technique used to
verify §4) showed why: the real response nests every stat/points field under a `stats`
sub-object (`player.stats.points`, `player.stats.rush_att`, ...) rather than flat on the
player object — `mapProjections()` had assumed the same flat shape as the confirmed §0/§1/
§2 endpoints, which was wrong for this one. `fpid`/`name`/`position_id`/`team_id` were
flat and correct. Also corrected two field names: `pass_ints` (not `pass_int`) and
`fumbles` (not `fumbles_lost`). Fixed in `agents/lib/fantasypros-projections.js`;
`tests/unit/fantasyProsProjections.test.js` now carries the real captured Josh Allen
payload as a byte-faithful regression fixture specifically to catch a repeat of this.
**No UI reads the `-fantasypros` file yet** — it exists for CLI/comparison use today (a
source-toggle on the Value Board panel would be the natural next step if Andy wants to
compare Phase A vs FantasyPros side by side). An actual Supabase write (non-dry-run) is
still untested.

---

## 4. Player availability / injuries — upgrades an existing pipeline, not a new one ✅ BUILT 2026-08-10, MAPPING LIVE-VERIFIED 2026-08-10

Unlike §1-3, this isn't filling a gap — the dashboard already has a working availability
pipeline. `scripts/build-player-availability.js` fetches ESPN's free public injuries API
(`site.api.espn.com/.../injuries`) and merges it with training-camp RSS/manual intel via
the shared `agents/lib/player-availability.js`, into `data/player-availability/*.json`
(events keyed by team/player/`event_type`/`trend`). `scripts/build-availability-impact-digest.js`
then scores those against `projected-starters` into `impact-digest-latest.json` — the file
`fantasyOverlayStore.js` reads for the Fantasy tab's ⚠ availability badges.

**Good news, same pattern as §1: no new merge logic needed.** `buildAvailabilitySnapshot()`
in `agents/lib/player-availability.js` already accepts a generic `injuryRecords` array and
normalizes any source through `availabilityEventFromInjuryRecord()` — ESPN's URL is only a
*default* used when a record doesn't supply its own `source`/`source_type`/`source_url`.
FantasyPros injury records map onto the same generic shape ESPN already produces
(`player_name`, `team_abbr`, `position`, `injury_status` ← `status`, `injury_type`,
`short_comment` ← `comment`, `reported_at` ← `injury_update_date`, `source: 'FantasyPros
injuries API'`) and merge in alongside ESPN + training-camp in one
`buildAvailabilitySnapshot({ injuryRecords: [...espn, ...fantasyPros], trainingCampItems,
sourceHealth })` call — three sources instead of two, same output schema, same downstream
digest/overlay code untouched.

**Real upgrade, not just a duplicate feed.** FantasyPros' `/nfl/injuries` carries two
things ESPN's endpoint doesn't have at all:
- `probability_of_playing` — a literal numeric probability (e.g. `"0.88797"`), versus
  ESPN's free-text-only status that the current pipeline has to regex-classify
  (`classifyAvailabilityEvent()`'s pattern matching against `shortComment`/`longComment`).
- `practice_1`/`practice_2`/`practice_3` (+ `team_practice_N_submitted` flags) — actual
  Wed/Thu/Fri practice-report participation level (Full/Limited/DNP), which ESPN's
  injuries feed doesn't expose.

Worth carrying both through as new optional fields on the availability event object
(`availabilityEventFromInjuryRecord()`'s return value) rather than dropping them — a
later scoring pass in `build-availability-impact-digest.js` could weight
`probability_of_playing` directly instead of only the bucketed `event_type`/`trend`
heuristics it uses today. That's a phase-2 scoring change, not required for the initial
merge.

**One real open question this raises (see §6.7):** ESPN and FantasyPros will sometimes
report the *same* player's status. `dedupeAvailabilityEvents()` dedupes on
`[team, player, event_type, dedupe_key||source_url]` — since the two sources have
different URLs, a genuinely duplicate report from both won't currently collapse into one
event; it'll show as two corroborating-but-separate entries instead. Andy's call: keep
both as independent corroboration (two sources agreeing is arguably a useful signal on
its own), or add a cross-source dedupe pass that prefers FantasyPros' cleaner
`status_short` + numeric probability when both exist for the same player/week.

**Build:** extend `scripts/build-player-availability.js` directly rather than a separate
ingest script — it already orchestrates multiple sources into one call (ESPN +
training-camp today), so adding a `fetchFantasyProsInjuries()` alongside the existing
`fetchEspnInjuries()` matches the established pattern better than a parallel pipeline.
Fetch `/nfl/injuries?year=&week=&include_probabilities=true`, map to the shared record
shape, pass into the existing `buildAvailabilitySnapshot()` call. **No new Supabase
table** — unlike §1-3, this pipeline is file-based (`data/player-availability/*.json`),
not DB-backed.

**Built 2026-08-10, additive not replacement.** New `--live-fantasypros-injuries` flag
(`npm run availability:fantasypros:dry` for a quick check) alongside the existing
`--live-injuries` (ESPN) — both flow into the same `injuryRecords` array and one
`buildAvailabilitySnapshot()` call, exactly as scoped; no cross-source dedupe pass added
(§6 open question 7, resolved 2026-08-09: keep both as independent corroborating
entries). `availabilityEventFromInjuryRecord()` in `agents/lib/player-availability.js`
now carries `probability_of_playing`/`practice_1`/`practice_2`/`practice_3` through as
optional passthrough fields on the event object (undefined on every ESPN/training-camp
record — only FantasyPros populates them), not yet consumed by
`build-availability-impact-digest.js`'s scoring (still a phase-2 change).

**Important caveat — read before trusting this live:** the mapping in
`agents/lib/fantasypros-injuries.js` was built WITHOUT a successful live call. Unlike §1-
§3 (all confirmed against real responses 2026-08-09), the Cowork sandbox cannot make any
outbound `fetch()` call at all (confirmed live 2026-08-10, same root cause as TASK_BOARD
F-31), and the scope doc text above only specifies mapping *arrows*
(`injury_status ← status`, `short_comment ← comment`, `reported_at ← injury_update_date`)
without giving this endpoint's exact raw field names for player/team/position — and every
other FantasyPros endpoint in this repo uses *different* field names for the same
concepts (`/nfl/players`: `player_name`/`position_id`/`team_id`; `/consensus-rankings`:
`player_name`/`player_position_id`/`player_team_id`), so guessing one shape and hardcoding
it would repeat a mistake this repo's own lessons-learned already warns against.
`mapFantasyProsInjury()` checks several plausible field-name variants defensively
instead. Also found and fixed along the way: `scripts/build-player-availability.js` never
loaded `dotenv` (it never needed env vars before — ESPN's feed takes no key), so
`FANTASYPROS_API_KEY` silently wasn't reaching it even with a real key in `.env`; now
fixed with `import 'dotenv/config'`. **Run this live on Andy's machine before trusting
it** — a one-off script dumping the raw `/nfl/injuries` response, or just
`--live-fantasypros-injuries --dry-run` with a look at the parsed row count/shape, would
confirm or correct the field-name guesses.

**Live-confirmed 2026-08-10.** Andy ran `npm run availability:fantasypros:dry` natively
(187 total events, 120 real FantasyPros rows, 0 errors) then a raw-vs-mapped diagnostic
dump for 2 real players (Alec Pierce/WR/IND, George Kittle/TE/SF, both status PUP). Every
guessed field name matched the real response: `name`→player_name, `status`→injury_status,
`comment`/`injury_type`→short_comment/injury_type (both legitimately empty strings in
these 2 samples, correctly mapped to `null`), `team_id`→team_abbr, `position_id`→position,
`probability_of_playing`/`practice_1/2/3`→same (all `null` for these 2 PUP players, which
is real — PUP players don't have practice-report data). **One real remaining issue found
this pass**: `injury_update_date` ("2026-08-10 09:00:01") has no timezone marker, so `new
Date(...)`'s absolute instant depends on the machine's local timezone rather than
FantasyPros' actual source zone (unconfirmed — their docs don't state it). Flagged in code
with a full explanation rather than guessing further; low-impact since `reported_at` isn't
part of any join/dedupe/unique-constraint key, only display precision. §3 (projections)
and an actual Supabase write test for §4 are still outstanding.

## 5. Shared plumbing (build once, use for all four)

`agents/lib/fantasypros-client.js` — one auth/base-URL/rate-limit/retry wrapper, imported
by all four ingest paths (including the §4 addition to `build-player-availability.js`),
rather than four copies of the same fetch logic. Follows
the existing `agents/lib/` convention (see `win-dist.js`, `board-validate.js` — pure,
no-I/O helpers get their own file under `lib/`).

Env var: `FANTASYPROS_API_KEY` in `.env.example`, **not** `VITE_`-prefixed — same tier as
`SUPABASE_SERVICE_ROLE_KEY` (server-side ingest scripts only, never shipped to the browser
bundle, unlike `VITE_ODDS_API_KEY` which the client does need directly).

---

## 6. Open questions for Andy

1. ~~Confirm plan tier~~ — **done 2026-08-09, corrected same day.** Key is on the
   **premium** plan (1 req/sec, 500 req/day, full responses — confirmed on the FantasyPros
   API key dashboard directly), not the free tier the docs page's opening line suggested.
   `/nfl/players` (with `&limit=2000`), `/consensus-rankings`, and `/projections` all
   confirmed returning real, complete data.
2. **Scoring format(s)** — PPR only, or also half/standard? For ADP specifically, note
   there's no half-PPR variant available at all (§1) — half-PPR leagues need a fallback
   decision (interpolate, or just use overall ADP).
3. **Weekly cadence, in-season** — daily during draft season is obviously fine; once the
   season starts, how often should rankings/projections refresh (daily? twice a week
   ahead of waivers)? Affects whether this becomes a GitHub Actions cron like
   `stats-to-vault-sync.yml` or stays manual-trigger.
4. **§3's real design question** — should FantasyPros projections *replace* Phase A's
   history-based projection as the default, sit *alongside* it as a second selectable
   source, or only activate once real prop odds are still unavailable (i.e. FantasyPros
   as the permanent Phase B, prop odds as a future Phase C)? This decides whether
   `fantasy-value-report.js` needs a `--source` flag or a full new default.
5. **Build order confirmation** — this doc assumes ADP → weekly rankings → Phase B
   projections, smallest/most-blocked-question-closing first. Confirm before starting
   part 1.
6. ~~Free-tier watch item~~ — **plan tier is premium, not free (see §6.1 correction)**,
   so the `total_experts: 5` vs. 90 gap seen on the weekly-rankings call isn't a plan
   restriction. Still worth a repeat check closer to Week 1 — likely just a preseason
   artifact (fewer experts have published Week 1 rankings yet as of 8/09), but confirm
   before relying on it for real start/sit decisions.
7. ~~§4's cross-source dedupe question~~ — **resolved 2026-08-09: keep both as
   independent corroborating entries.** No cross-source dedupe pass needed — ESPN and
   FantasyPros injury records both flow into `buildAvailabilitySnapshot()` as-is,
   `dedupeAvailabilityEvents()`'s existing per-source-URL keying is left untouched.

---

## 7. Relationship to existing work

- Does **not** touch Yahoo OAuth/roster sync (separately blocked on Yahoo's own developer
  approval, F-26).
- Does **not** touch sportsbook player props (`PROPS-1`) — FantasyPros projections are a
  parallel path to Phase B, not a fix for the props feature itself.
- Reuses `fantasy_adp` as-is (§1); adds two new tables (§2, §3) following the same
  migration-numbering and RLS-policy convention as `034_fantasy_adp.sql`; §4 adds no table
  at all, it extends the existing file-based availability pipeline in place.
- Not scoped here, but confirmed available on the same key if wanted later: `/nfl/news`
  (categorized items with impact text, could pair with the existing Podcast Fantasy Intel
  panel pattern). Wasn't asked for — file as a new backlog item if/when wanted.
