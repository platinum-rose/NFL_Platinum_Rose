# Handoff — Wed 2026-10-07 18:50 PT — Claude Team 2 → Codex team: finish Week 5 market lines

**From:** Claude Team 2. **To:** Codex team. Andy is saving Claude token budget for the end of the week, so the remaining lane goes to Codex.
**Supersedes the "next lane" in:** `handoffs/2026-10-07-1555-claude-week5-market-lines-handoff.md` (read it for §3 open items and §4 guardrails, which are unchanged).

## 1. State at close

- Handoff 1555, `git status -sb -uno` and `git log -5 --oneline` were checked at the start of the session. `main` = `origin/main` at `96663f8` before this commit.
- Tracked files already modified and left alone (not Team 2's): `data/player-availability/*`, `docs/player-availability/*`, `data/research-intel/grok-thread-prompt-latest.md`, `data/supercontest/live-market-comparison.json`.
- Both `logs/cadence-reports/2026-w05-*.md` reports were read. No newer ones existed.
- **Built (partial) Week 5 line set:** `reports/analysis/week5-intel/w05-market-lines-2026-10-07.md` and `.json`.
  - DK/FD/MGM spread, total and moneyline for all 15 games. Source: Supabase `game_odds_snapshots`, week 5, captured 2026-10-07 21:00Z (14:00 PT), read-only.
  - BKR 10/05 12:05 PT paste (12 of 15 games), Kalshi game-win prices (15 of 15, `KXNFLGAME`, snapshot 2026-10-07T22:00Z) and injury/QB news from the Wednesday cadence reports.
  - Consensus = median of the three books. Spreads are the HOME team's.
- **Flags in the table:**
  - Spread moves ≥ 1.5 vs BKR 10/05: TB @ DAL (DAL −10 → −8.5), PHI @ JAX (JAX −6 → −7.5), DET @ ARI (ARI +4 → +5.5).
  - Total move ≥ 1.5: HOU @ TEN (40 → 37.5).
  - QB changes: TB @ DAL (Mayfield out), BAL @ ATL (Lamar out, Huntley likely), CHI @ GB (Bagent).
- **The "move since open" column is a proxy:** consensus US books vs the BKR 10/05 paste (a different book, two days old). Re-base it on the AN openers once they exist.
- Generator: `scratch/w05_market_lines_build.py` (uncommitted, per Andy's no-commit list). Book lines are hard-coded from the Supabase read. Run it from the repo root: `python scratch\w05_market_lines_build.py`. Re-running refreshes only Kalshi and overwrites the two report files.

## 2. What Codex needs to do (in order)

1. **Action Network openers.** `api.actionnetwork.com` returned 403 from the Claude bridge shell. Run on the laptop: `python scripts\master-intel\actionnetwork_openers.py --week 5`. It writes `data/odds/actionnetwork-openers-2026-w05.json` and `data/generated/odds/actionnetwork-history-2026-w05/`. Read-only.
2. **Fresh BKR board (Andy pastes).** Ask Andy for a paste covering all 15 games, especially MIN @ NO, BAL @ ATL and BUF @ LAR (not on the 10/05 paste). Save as `data/odds/BKR_current_lines_<MMDD_HHMM>` with a `_buildfmt` copy and a `.provenance.md`, following the 1005_1205 pattern. NYG @ WAS had no moneyline on the 10/05 board, so `build.py` skips it. Check whether the new paste has one.
3. **SuperContest Week 5 lines (Andy supplies, or read-only from nfl-supercontest.com).** Save to `data/supercontest/week-05-lines.json` using the `week-04-lines.json` schema. Then run the contest vs book check for every game (≥ 1.5-pt middle). `live-market-comparison.json` still says `supercontest_week: 4`.
4. **Regenerate the table.** Update the generator's hard-coded book data from a fresh read, replace the BKR proxy with the AN openers (fall back to the new BKR paste), and fill the `Contest` and `AN open` columns. Keep the ≥ 1.5-pt flags and QB-change flags. Output: `reports/analysis/week5-intel/w05-market-lines-<date>.md` and `.json`.
   - **Supabase:** read-only (`select`). Filter `week=5 and captured_at >= '2026-08-25'`. Project: "NFL Dashboard".
   - **Do not call TheOddsAPI.** Only the Tuesday cadence spends credits (≈470 left).
5. **Run `python scripts\master-intel\build.py --week 5 --date <BKR date> --no-export`** once the inputs exist. Evidence cadence only: no wagering synthesis until the readiness gates in `docs/MASTER_INTEL_REPORT_RUNBOOK.md` pass.
6. **TNF reminder:** TB @ DAL is Thu 10/08 17:15 PT. Books are DAL −8.5 / 47.5, with Mayfield out and Kalshi DAL ~80%. BKR on 10/05 had DAL −10, so a fresh BKR paste before kickoff matters most for this game.

## 3. Guardrails (unchanged from the 1555 handoff §4)

- Sportsbooks and pool sites are read-only. No TheOddsAPI calls from a session.
- No Supabase writes or paid model calls without Andy's per-action OK.
- Ledger changes record only what Andy reports or what box scores settle.
- Commit via the temp index with explicit paths, never `git add -A`. Use `git -c core.fsmonitor=false`, path-limit status/diff, and use `timeout_ms` over the bridge. Move stale `.lock` files directly under `.git/` instead of deleting.
- Leave the do-not-commit list uncommitted (`scratch/`, `*.bak*`, `.nfl/gmail-summaries/*test-injury-alert*`, `docs/*.eml`, `data/prediction-markets/team-market-map-2026-09-*`, `data/fantasy/Week1_*.xlsx`, `reports/bets/season-recap/work/*_w4.json`, repo-root scratch files).
- Every handoff document goes to both the repo and the DEV project.

## 4. Open items for Andy (not Codex)

- Re-auth YouTube: `node scripts/youtube-oauth-setup.js`.
- The BKR paste (item 2) and the contest lines (item 3).
- Fantasy lock decisions before Thursday night (Honey Badgers has no kicker; Butker on bye; Chase, Hall and Swift injured).
- Supabase `week` tag fix (Week 4 rows tagged `week=5`), BUF @ LAR Bills credit, and the survivor team-ID bug in `scripts/sync-yahoo-survivor.mjs`.

## 5. Resume prompt for Codex

> You are the Codex team continuing NFL_Dashboard ("Platinum Rose") from Claude Team 2. Read `handoffs/2026-10-07-1850-claude-week5-market-lines-to-codex-handoff.md` and `handoffs/2026-10-07-1555-claude-week5-market-lines-handoff.md` in E:\dev\projects\NFL_Dashboard, then run `git -c core.fsmonitor=false status -sb -uno` and `git log -5 --oneline`. Then complete §2 of the 1850 handoff, in order, under its §3 guardrails.
