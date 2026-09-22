# Cowork session — official picks 1-3 recorded, BetOnline re-ingest, SuperContest CLV pipeline built

**Created:** 2026-09-09 21:29 UTC, via Cowork (device-bridge session). Continuation of the 19:42 UTC handoff (`handoffs/2026-09-09-1942-cowork-preflight-and-value-scan-handoff.md`) — read that first for the preflight result and initial ledger cleanup; this handoff covers everything that happened after it in the same session.

## Standing guardrails (unchanged, still in force)

- Worktree intentionally dirty since 2026-08-21 during the Codex↔Claude audit — never reset/stash/clean/commit/push without explicit approval.
- No Supabase writes without per-write authorization from Andy.
- No paid committee/model synthesis (`agents/portfolio-synthesize.js`) without explicit approval.
- No betting-pick/portfolio mutations without explicit approval from Andy.
- `agents/portfolio-dossier.js`, `agents/portfolio-synthesize.js`, `agents/portfolio-preflight.js`, `agents/lib/board-validate.js` are locked under active Codex review — do not edit.
- Andy's rule: credentials never get typed into chat for Claude to use. If a login is ever needed (e.g. SuperContest member area), it goes directly into the repo's own `.env` on his machine.

## What happened this session (after the 19:42 handoff)

### 1. Ledger — 3 official picks now recorded (all confirmed by Andy, all BetOnline)

`data/futures-imports/andy-portfolio-ledger-2026.json` now has three live `status: "open"` positions:

- `bills_sb` — $50 @ +1000, ticket `994540980`, accepted 2026-09-09. Qualifies for BetOnline's "$10 per regular-season win" Super Bowl futures promo (min $50 qualifying wager, Bills/Packers/Ravens eligible, one-time per account). `data/futures-imports/betonline-superbowl-futures-promo-2026.json` updated: `status: claimed_qualifying_wager_placed`, `selected_team: Buffalo Bills`, ref back to this ledger entry.
- `bills_packers_exacta` — $45 @ +8300 ("Green Bay Packers vs Buffalo Bills" exact matchup), same ticket `994540980`. This replaced a **fake/leftover-from-planning entry that never actually happened** ($100 @ BetUS +6500) which Andy explicitly caught and had removed entirely — worth remembering: don't trust ledger `status: open` entries at face value without confirming with Andy.
- `packers_sb` — $40 @ +2500, ticket `994610591`, accepted 2026-09-09. Does NOT separately qualify for the BetOnline promo (that's tied only to the Bills wager).

Cap room remaining: `bills_sb` $150 of $200, `packers_sb` $160 of $200. `bills_packers_exacta` is monitor-only per `market_holds` (pending a secondary book).

**Known loose end, not yet fixed:** the id of the removed fake exacta entry is still hardcoded in several scripts (`scripts/build-futures-odds-execution-validation.js`, `scripts/build-futures-synthesis-context.js`, `scripts/lib/futures-evidence-gates.js`, `scripts/lib/futures-odds-execution.js`, `scripts/score-futures-benchmark.js`) plus old validation snapshots/fixtures, all pre-dating its removal. Flagged to Andy, not touched — code changes, needs explicit approval.

### 2. BetOnline data was stale — caught live, fixed

Andy caught BetOnline's Packers NFC Champ line showing a stale +1100 when the live line had moved to +1200. Diagnosis via Supabase: BetOnline's conference/division/wins/playoffs markets were 11 days stale (last captured 2026-08-29) while its superbowl/exacta markets were fresh (partial-refresh gap, not a full outage). Andy supplied fresh screenshots under `docs/Futures_Odds/`; ran the existing `scripts/ingest-beo-screenshots.js` OCR pipeline (untouched, no code changes):

- Dry-run first (`--dry-run --date 2026-09-09`) caught a missing team (Dallas Cowboys, 31/32 in the playoffs market).
- Andy supplied a 4th screenshot (`BEO_MakePlayoffs4_0909.PNG`) to complete it.
- Ran for real: **416/416 rows upserted**, screenshots archived to `docs/Futures_Odds/_processed/BetOnline_2026-09-09/`.

Also worth noting for future reference (not acted on, just documented): BetOnline currently prices the Packers/Bills exact-matchup exacta more efficiently (less compounded vig) than a synthetic parlay built from the two straight legs (Packers NFC + Bills AFC) covering the same underlying event — confirmed with real numbers before and after the stale-data fix.

### 3. New standing workstream: NFL SuperContest weekly lines + CLV

Distinct from the live sportsbook markets above — SuperContest is a **fixed weekly contest** Andy pools his "5 picks of the week" against. Lines lock at publish and never move again, so tracking CLV against them works like tracking CLV against a closing line.

Built two new permanent scripts (both live, both tested against real Week 1 data):

- **`agents/supercontest-lines-ingest.js`** — fetches `https://www.nfl-supercontest.com/src/weekly_lines_table.php` (public page; its `login.php` redirect is client-side-JS-only, so a raw HTTP GET/fetch still returns the full table, no auth needed — confirmed live 2026-09-09). Parses the `++` = home-team marker per row (see the correction note below), normalizes teams via `normalizeTeam()` from `src/lib/teams.js`, writes `data/supercontest/week-<NN>-lines.json` + `data/supercontest/latest.json`. Idempotent (no-op if content unchanged for a week), fails loudly on 0 parsed rows rather than writing an empty file, warns instead of overwriting if the week number hasn't advanced yet (handles late-publish weeks). **Week 1 captured: 16/16 games.**
- **`agents/supercontest-clv.js`** — joins the captured contest lines against the live `games` table (matched by normalized home/away pair), derives `closing_favorite_team`/`closing_line_magnitude` from `closing_spread_line` using the verified sign convention (**away-team-relative; negative = away team favored** — confirmed from the authoritative code comment in `agents/portfolio-dossier.js`, not guessed/reverse-engineered), computes `clv_points` when the favored side hasn't changed or a descriptive `clv_note` when it has crossed sides (avoids a misleading numeric edge in that case), and formats kickoff time in Pacific via `Intl.DateTimeFormat({timeZone: 'America/Los_Angeles', ...})` — never manual UTC offset math, per RULES.md. **Run for Week 1: all 16/16 games matched cleanly, output written to `data/supercontest/week-01-clv.json`.**

**Week 1 CLV summary** (contest line locked at publish vs. today's closing line, 2026-09-09):
- No movement (8 games): Patriots@Seahawks, 49ers@Rams, Buccaneers@Bengals, Ravens@Colts, Bills@Texans, Saints@Lions, Dolphins@Raiders, Commanders@Eagles.
- Tightened toward favorite (good CLV on the chalk, bad on the dog): Bears -3→-2.5, Steelers -3.5→-3, Jaguars -8.5→-7.5, Cowboys -3→-2.5.
- Drifted toward dog (bad CLV on the chalk, good on the dog): Titans -1.5→-2.5, Chargers -9.5→-10.5, Chiefs -2.5→-3.
- **Fully crossed sides:** Packers/Vikings — contest locked Vikings -1.5, market now favors Packers -1.5 (a full 3-point swing past pick'em). Flagged as notable since Buffalo/Green Bay are Andy's anchor teams.

**Scheduled task created** (via the Cowork trigger tools, not local cron — those don't persist): weekly Thursday 8:00 AM PT auto-fire of `agents/supercontest-lines-ingest.js`. Standing understanding: a manual fire is the fallback if SuperContest publishes lines late in a given week.

### 4. Correction worth carrying forward

First pass at reading the SuperContest table misread the `++` home-team marker for 2 of 16 games (said "Indianapolis @ Baltimore" instead of "Baltimore @ Indianapolis"; "Houston @ Buffalo" instead of "Buffalo @ Houston" — the Bills one matters most, Buffalo being Andy's anchor team). Andy caught it directly: *"You missed a very important detail. ++ = Home Team."* Re-verified every row methodically afterward — all correct in the final table and in the ingest script's own parsing logic. **Lesson for next time: verify the `++` marker per-row, never by pattern-skimming** — this is now baked into the ingest script's logic itself, but worth remembering when eyeballing any future manual read of that page.

## Explicitly deferred (Andy's call, not mine)

- Anything "behind the member area" on the SuperContest site — would need real login/credentials. Andy: *"Let's not worry about behind the member area for now, we can set that up later if it's needed."* If/when this comes up, credentials go into the repo's `.env` directly on Andy's machine — never typed into chat.
- Finalizing Andy's actual "5 picks of the week" using the Week 1 CLV data above — this is the natural next step but wasn't asked for yet this session.

## Not yet done — pick this up next

- Everything in this handoff is documented in Cowork project memory (`nfl_dashboard_project.md`) as well, for cross-session continuity.
- The `futures_import_manifest` BLOCK from the 21:10 UTC Codex-response handoff (untracked `betonline-2026-09-09.json`) hasn't been investigated — may be related to this session's real BetOnline ingest run; worth checking before assuming it's a problem.
- VegasInsider scraper source question is still on hold (⚠ standing restriction: no invocations, dry-run included).
- The stale exacta-id cleanup (see item 1 above) is still outstanding, pending Andy's go-ahead.
