# Handoff — 2026-09-27 00:12 PT — Claude (Cowork): Week 3 Sunday cards re-priced; Dog-ML RR placed; STOP — intel sheet errors

## ⛔ STOP CONDITION (read first)
Andy ended the session at 00:10 PT Sun 9/27: **"there are major errors in the intel sheet that need to be addressed before placing bets with it."**
- The specific errors were **not itemized** in-session. First step next session: get the list from Andy (which report — Master Intel and/or SuperContest — and which sections/numbers).
- **Do not recommend or help place any more Week 3 tickets built from the intel sheet until those errors are fixed and the affected legs re-checked.** That covers Slot 1 Master RR, Slots 3/4/5, the prop tickets and the SNF islands.
- Already placed and **not** affected by this stop: Dog-ML RR #739358766 (below). Its legs came from the Saturday digest; re-check them against the corrected sheet anyway and tell Andy if any leg's case changes.

## Placed this session
- **BKR #739358766** — Compact Round Robin (10P-2T), placed 23:30 PT Sat. TEN ML +121 · NYJ ML +252 · IND ML +110 · LV ML +165 · CLE ML +113. $25 risk (10 × $2.50), $132.20 to win (all 5).
  - LV replaced TB, because TB moved +102 → −105 and was no longer a dog. NE was considered as a 6th leg and left off, because NE ML opposes JAX ML in Slots 1/4.
  - Logged in `data/official-picks/user-placed-wagers-2026.json` (gitignored, local; 69 entries). **Supabase sync not done** (needs Andy's OK).
  - Card: `reports/bets/2026-w03-card.md` "PLACED" line.

## Line snapshots added (manual; TheOddsAPI not used)
- `data/odds/BKR_current_lines_0926_2259` — Andy's BKR paste, 22:59 PT Sat, all 15 games.
- `data/odds/BEO_current_lines_0926_2306` — BEO main board transcribed from Andy's screenshots `docs/Screenshots/BEO_week2_{1,2,3}.PNG` (named week2, actually the Week 3 slate). BEO shows no MIN/TB full-game ML.
- Andy chose **not** to ingest these into `bookmaker-live-2026-09-26-week3.json`. The reports' "market now" is therefore still the 13:47 PT BKR capture.

## Card state (`reports/bets/2026-w03-card.md`, section "FOUNDATION RE-PRICE v4")
Everything below is BKR, naive-multiply prices, **unplaced**, and **pending the intel fix**:
- **Slot 1 Master RR** (Andy: "everything leans into that"): CIN ML −177 · JAX ML −164 · BAL ML −178 · SF −8 −103 · LAR ML −131 · PHI ML −188 · CAR/CLE U42.5 −110 · SEA −7.5 −113.
  - 70 × $1 = $70. 8 hit $614 · 7 hit $283–327 · 6 hit $111–151 · 5 hit $33–55.
  - Needs 6 of 8 to profit. BKR is the best single book (BEO has SEA −8.5).
- **Slot 3 Morning:** CIN ML · CLE ML · SF −8 · BAL ML · LAR ML = +1709.
  - Andy is unsure about CLE ML. CLE +2 (−107) = +1543; subsequent strategy correction: underdog spreads are allowed when the matchup and price case are stated.
  - Offered swaps: TEN ML +120 → +1769 (tier 1+2; doubles TEN with the RR), CAR/CLE U42.5 → +1522, HOU/IND U42 → +1501.
  - **Undecided.**
- **Slot 4 Afternoon:** JAX ML · SEA −7.5 · SF −8 · TB ML −105 · LAR ML = +1959.
- **Slot 5 Hybrid:** TEN ML · CIN −3 · SF −8 · PHI ML = +1132.
- **Not re-priced:** prop tickets (Prop RR, 7a/7b/7d/7e, 8a/8b) and SNF islands. They carry the Sat 12:44–13:47 prices.
- **Flags:**
  - Zay Flowers questionable (hamstring, possible pitch count) → BAL ML.
  - Puka Nacua doubtful → LAR ML, which is in Slots 1/3/4 (largest single exposure).

## Skipped by Andy tonight
- SuperContest joint five: undecided. `locked-card-week-3.json` **not written**, on purpose; don't write a placeholder, because next week's review would grade it.
- Bills $10 BEO credit: BEO options were LAC +7.5 −115 or JAX −3 −102. CIN at BEO is −3.5.
- 739211245's 2 open spots. PHI ML is −181 at BEO vs −188 at BKR; TEN ML is +121 at BKR.
- SuperContest cadence design (the original goal of this session) — not started.

## Data gaps still open
- **DK Predictions:** only CAR@CLE saved/parsed; 14 games missing. Claude in Chrome and the built-in browser both block predictions.draftkings.com (safety restriction), so saves are manual Ctrl+S (main page + Passing tab) into `docs/Player_Prop_Odds_Weekly/Week3/DK/`.
  - No free public DK Predictions prop feed exists. Paid options: Apify "DraftKings Predictions" actor (~$40/1k results, props coverage unverified) and Betstamp.
  - Codex left `docs/Player_Prop_Odds_Weekly/Week3/DK/DK_Predictions_W3_2026-09-26_capture.md`. It maps league-wide side-market tabs (Passing 11 / Receiving 5 / Rushing 6 / Defensive 4); the parser can't read league-wide boards. It is reference only: no pipeline changes.
- **BEO prop boards** missing for HOU@IND, TEN@NYG, PHI@CHI.
- **BKR** has no TD markets (ATD / 1st / 2+ / 3+) for MIN@TB and PHI@CHI.

## New/changed files (all uncommitted — nothing committed or pushed this session; HEAD still 6443fa9)
- `reports/bets/2026-w03-card.md` — v4 re-price + placed line (M).
- `data/odds/BKR_current_lines_0926_2259`, `data/odds/BEO_current_lines_0926_2306` (new).
- `scripts/props/dk-predictions-week-status.py` (new) — checklist that parses every DK .mhtml, merges multiple saves per game and flags missing sections.
  - `python3 scripts/props/dk-predictions-week-status.py --week 3 --played GB [--no-write]`
  - It rewrote `data/generated/props/dk-predictions-2026-09-26-panthers-at-browns.json` as a merge of both saves (265 rows).
  - Keep or drop is **Andy's call** (Codex note asked for no pipeline changes).
  - Note: the old parser CLI overwrites when a game has two saves.
- `scratch/w03-sc-w2style.py` (new) + `dist/nfl_week3_master_packet/nfl_week3_supercontest_intelligence_summary_w2style.{md,html,docx}` (dist is gitignored).
  - A one-off Week 3 SuperContest report in the Week 2 layout, Andy's choice.
  - Locked template v1 / `build.py` untouched; no format-doc entry needed.
  - If the intel errors are in the SuperContest data, **re-run this script after the fix**, because it reads the Week 3 build's md/json.
- Untracked `scripts/props/{build-ai-matchup-packets,run-prop-audit-agent,run-prop-stack-agent}.mjs` are **not from this session** — leave them.

## Guardrails (unchanged)
No `git add -A`; never reset/clean/stash; Supabase writes need per-change OK; no bet placement/account actions; sportsbook pages read-only; team power ratings are allowed as evidence; manual BKR/BEO lines only (TheOddsAPI ~11 requests left); DK/prediction-market % never mixed with sportsbook odds without the fee/spread check; Master Intel template v1 locked (changes need Andy's approval + format-doc log).

## Resume prompt
> Resume NFL_Dashboard (E:\dev\projects\NFL_Dashboard, main, HEAD 6443fa9 + uncommitted session files). Read HANDOFF.md, then `handoffs/2026-09-27-0012-claude-week3-sunday-cards-reprice-intel-errors-handoff.md`. FIRST: ask Andy to list the major errors he found in the Week 3 intel sheet, find their root cause in `scripts/master-intel/build.py` inputs/outputs, fix, rebuild (`python3 scripts/master-intel/build.py --week 3 --date 2026-09-26`, then `export_pdf.py`), and re-check every unplaced Sunday ticket (Slot 1 Master RR first) plus placed RR #739358766 against the corrected sheet before any placement talk. Kickoff 10:00 PT Sun. Same standing constraints.
