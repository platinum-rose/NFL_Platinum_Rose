# NFL Roster Refresh — Plan + Build Summary

**Task:** `nfl-roster-refresh-audit-2026-07`
**Filed:** S292 (2026-07-21), scoped + built S293 (2026-07-21)

## Why this exists

Andy caught two real 2026 roster errors during a live review of the podcast host-summary
pipeline's output: Kyler Murray and Fernando Mendoza were both misjudged because nothing in
the repo tracked current player→team assignments. Investigation confirmed:

- No player-team roster table or source existed anywhere in NFL_Dashboard.
- `.github/workflows/nflverse-data-refresh.yml` looked like a candidate but isn't — it's an
  **annual** job that seeds season-level *stats* tables (`nfl_team_season_stats`,
  `nfl_player_season_stats`), not roster/trade state. Different purpose entirely.
- The podcast host-summary extraction pipeline (`agents/podcast-host-summary.js`) doesn't need
  this — it already reads player/team context straight from what hosts say in the transcript,
  not from a static table.
- The actual stale sources were `skills/nfl-team-notes/references/teams/*.md` and
  `skills/nfl-coaching-tendencies/SKILL.md` — reference docs meant to be scheme/structural
  (`nfl-team-notes`' own metadata says identity sections should be "not personnel-specific"),
  but which named specific skill players in prose. `data/fantasy/adp-2026-07-15.csv` (updated
  6 days before the review) already had Kyler Murray correctly listed under MIN — meaning two
  in-repo sources were actively disagreeing with each other.
- Fernando Mendoza appears in **zero** repo files. That misjudgment wasn't a stale-data bug at
  all — a live knowledge-cutoff gap, not fixable by editing a file.

Andy's decisions: fix the 2 originally-flagged docs now (done S292 same-day follow-up), build a
real weekly-refreshed roster data source (this doc), store it as a Supabase table, and extend
the audit to all 32 team files + the full coaching-tendencies skill rather than stopping at the
2 that happened to get caught.

## Data source

**nflverse-data's `weekly_rosters` GitHub release** —
`roster_weekly_<year>.parquet` / `.csv`, week-level rosters (team, position, status, gsis_id,
per player per week), back to 2002. Confirmed live 2026-07-21: `roster_weekly_2026.parquet`
was last updated 2026-07-09 — i.e. refreshed during the season/offseason, not just annually.

Same GitHub repo (`nflverse/nflverse-data`) and same fetch pattern
(`scripts/fetch_nflverse_data.py`'s `_read_parquets` helper) already used for
`player_stats_weekly`/`team_stats`/etc. **Zero new dependencies.** `nfl_data_py` itself is
archived (Sep 2025) — this script already works around that by downloading parquet release
assets directly rather than depending on that library's own roster functions, consistent with
how the rest of the file already handles nfl_data_py's deprecation.

Schema (via nflreadr's documented `load_rosters_weekly()`, 36 columns total — this build tracks
the subset relevant to "which team is this person on"): `season`, `week`, `game_type`, `team`,
`gsis_id`, `full_name`, `first_name`, `last_name`, `position`, `depth_chart_position`,
`jersey_number`, `status`, `status_description_abbr`, `years_exp`, `espn_id`, `yahoo_id`,
`sleeper_id`.

## What was built

1. **`supabase/migrations/038_nfl_rosters.sql`** — new `public.nfl_rosters` table, grain matches
   the source (one row per season/week/game_type/player), plus a `nfl_rosters_latest` view
   (distinct-on latest season/week per `gsis_id`) for "what team is this person on right now"
   lookups. RLS mirrors the rest of this repo's public-read tables. **Not yet applied** — needs
   Andy to run it in the Supabase SQL editor, same as every other migration in this repo.

2. **`scripts/fetch_nflverse_data.py`** — added a `rosters_weekly` dataset entry, reusing the
   existing `_read_parquets` helper against the new release tag. Downloads to
   `data/vault-seed/nflverse/rosters_weekly.csv`.

3. **`scripts/seed-nfl-rosters.py`** (new) — reads that CSV, upserts into `nfl_rosters`.
   Dry-run support, batched upserts, same NaN-sanitization pattern as
   `seed-historical-stats.py`. **Caught and fixed a real bug during its own dry-run test**: the
   "drop rows with no team" filter didn't actually work, because pandas reads empty CSV cells
   as `NaN` and `bool(float('nan'))` is `True` in Python — a no-team/UFA row was silently
   passing through instead of being dropped. Fixed by sanitizing (NaN→`None`) *before* the
   presence check, not after.

4. **`.github/workflows/nfl-roster-refresh.yml`** (new) — weekly cron (Tuesdays 13:00 UTC,
   after MNF wraps and ahead of the Wednesday transaction cycle), separate from the annual
   `nflverse-data-refresh.yml` since the cadence and purpose differ. Computes the current season
   at runtime (`date -u +%Y`) rather than hardcoding a year, so it won't need a manual bump every
   offseason the way `fetch_nflverse_data.py`'s own `DEFAULT_YEARS` list does (a known,
   pre-existing staleness gap in that script — noted, not fixed here, out of scope).

## Full 32-team + coaching-tendencies audit

Extended beyond the 2 originally-flagged files per Andy's call. Confirmed via direct read: this
personnel-baked-into-prose pattern is **systemic**, not isolated to Arizona/Tampa Bay — nearly
every one of the 32 team files and coach entries names specific skill players as load-bearing to
a scheme or betting-angle claim (Josh Allen, Justin Jefferson, T.J. Watt, Baker Mayfield, etc.).

Treatment applied is deliberately **flag, not rewrite** for all files except `ARI.md` /
Gannon (where Andy directly confirmed the Kyler Murray trade, so a real correction was
possible). For the other 31+31, no per-player trade status has been verified — asserting a
"corrected" replacement for 60+ named players I have no grounded current source for would just
trade one unverified claim for another, the exact failure mode this task exists to fix. Instead:

- All 31 remaining `skills/nfl-team-notes/references/teams/*.md` files got a file-level audit
  banner, plus a `⚠️ Contains named-player references` flag appended to any of the
  Offensive Identity / Defensive Identity / Key Matchup Factors sections that actually name a
  player (56 of 93 possible sections — detected via a name-shaped regex, deliberately tuned to
  under-flag rather than over-flag false positives like coach names or bolded headers; **known
  limitation:** a few real names were likely still missed, e.g. single-word nicknames or names
  the regex's stopword list swallowed).
- All 31 remaining `nfl-coaching-tendencies/SKILL.md` entries (Gannon excluded, already fixed)
  got one flag appended after their bullet list, rather than per-line, since virtually every
  entry references at least one current skill player somewhere in its Betting Angle / 2-min
  drill / Game script lines.
- Caught + fixed 3 self-introduced bugs while building this: an over-broad first pass that
  flagged sections with no actual player name; a name-detection regex that missed
  initials-style names (C.J. Stroud, T.J. Watt) until broadened; and a YAML-frontmatter split
  bug that silently skipped the first coaching entry (Andy Reid) and left 29 entries
  double-flagged before being caught and cleaned up.

## What's NOT done yet (next steps)

- **Migration 038 not applied.** Andy needs to run it in Supabase.
- **No real data has been seeded.** `fetch_nflverse_data.py --datasets rosters_weekly` and
  `seed-nfl-rosters.py` have only been tested against a synthetic sample CSV in-sandbox (this
  sandbox has no network route to nflverse's GitHub releases or to Supabase) — first real run
  needs to happen natively or on M6.
- **The `nfl-roster-refresh.yml` workflow hasn't run live** — needs `SUPABASE_URL` /
  `SUPABASE_SERVICE_ROLE_KEY` secrets already present in the repo (same ones the annual workflow
  uses) and a first manual `workflow_dispatch` run to confirm before trusting the weekly cron.
- **No consumer actually queries `nfl_rosters` yet.** The team-notes/coaching-tendencies files
  are flagged, not wired to auto-check against the new table — that would be a further build
  (e.g. a lint/audit script comparing named players in those docs against `nfl_rosters_latest`),
  not attempted this session, Andy's call whether it's worth it.
- All of this session's changes (2 skill-doc fixes from S292 + everything above) are held
  **uncommitted per Andy's instruction** — commit together once the build is verified live, not
  before.
