# 2026-10-02 16:40 PT: Claude: TNF graded, template v2, SuperContest W4, BKR/BEO/DK Week 4 boards

Lane: Week 4 Saturday Master Intel build (Platinum Rose NFL). Branch `main`, the only branch.
HEAD at close: see the resume prompt (the handoff commit sits on top of `f64dbaf`).

## CRITICAL

- **Template v2 needs Andy's approval.** `scripts/master-intel/build.py` now emits picks first, then reasoning, then reference (48cfb6e). Andy reviewed the layout but has not signed off. `scripts/master-intel/rebuild_review.py` re-lays out an existing md in v2 order. The v2 change log is in `docs/MASTER_INTEL_REPORT_FORMAT.md`.
- **Week 4 narratives are on hold until Saturday** (ce11bdd; Codex was told in `handoffs/2026-10-01-2330-claude-to-codex-week4-narratives-hold.md`). They must meet the Week 3 standard: see the "narrative minimum" checklist in `docs/MASTER_INTEL_REPORT_RUNBOOK.md`. The build currently reports GAP for all 15 games.
- **Caleb Williams is OUT** (Andy, multiple sources). NYJ@CHI pricing and picks must assume Tyson Bagent.
- **TNF PIT@CLE is graded and written** to the local wagers ledger `data/official-picks/user-placed-wagers-2026.json`. That file is gitignored, so it is local only; backup `.bak-claude-20261001-pre-tnf-grade`. The Mason Graham leg is marked `injury_exit: true`. No Supabase sync was done.

## IMPORTANT

### Shipped this session (all pushed to origin/main)
- `8107c5d` Live Tracker:
  - A leg can be marked Out (`legsOut`), and the Out status now survives the Burnt toggle.
  - Burnt + Out busts the ticket.
  - An "injury bad beat" badge, banner and summary for parlays lost on a single injury.
- `48cfb6e` Master Intel template v2 (for review).
- `4bb4fbd` Roster gate: "No Week" is now on the non-player phrase list.
- `ce11bdd` Narrative minimum checklist, plus the Week 4 narrative hold.
- `248aa71` SuperContest:
  - Week 4 contest lines in `data/supercontest/week-04-lines.json`.
  - Fixed the SuperContest report build (module-level `SIDE_CSS`/`SIDE_BTN`).
  - The build tolerates BKR rows with no threshold.
- `8712129` SuperContest dashboard:
  - Shows the current week only (`SC_CURRENT_WEEK`); the week picker is gone and Week 3 no longer shows.
  - Until the 5 picks are locked, it shows contest lines for all games.
- `9698310` Secondary matchups regenerated for Week 4 after the roster-seed rebuild (Porter Jr. now on DAL).
- `f64dbaf` Andy's hand-pasted BEO Week 4 prop boards for 14 games, in `docs/Player_Prop_Odds_Weekly/Week4/BEO_Week4_*`.

### Week 4 market data (gitignored, local in `data/generated/props/`)
- **BKR:** `bookmaker-live-2026-10-02-week4.json` (6,304 rows, plus per-game files), from Codex's capture.
- **BEO:** `beo-w04.json`, parsed from the BEO boards above.
- **DK Predictions:** `dk-predictions-2026-10-02-<away>-at-<home>.json` for all 15 games, schema `dk_predictions_markets_v1`. Each file holds:
  - Game spread, total and moneyline.
  - ATD, first TD and 2+ TD boards.
  - **New: `pass_yds` / `rec_yds` / `rush_yds`.** These are the DK-highlighted ladder rung per player, 289 players in all. A row looks like `side "Josh Downs 70+"`, `line 70`, `prob 0.46`, with flag `ladder_rung: "dk_highlighted"`.
  - Captured about 23:15Z on 10/2 through a keyless firecrawl JSON extract that copies the ladder string verbatim. That method is required: the first interpretive extraction got 32 rungs wrong by one step, including Bijan Robinson and James Cook.
  - Cross-checked against the BKR alternate ladders: 197 matched. Only 10 fringe 20+ receiving/rushing lines differ by more than 12 points, with DK lower.
- `build.py` reads only the DK `game_*` rows. The rungs are not in the report yet; they are input for the prop-stack build.

### Rebuilt
- `python3 scripts/master-intel/build.py --week 4 --date 2026-10-02` produced `dist/nfl_week4_master_packet/` (master report and SuperContest report). Roster vet: PASS.
- Open GAPs:
  - No YouTube pick digest.
  - No synthesis digest.
  - No narratives for any of the 15 games.
  - No card in `reports/bets/2026-w04-card.md`.
  - No survivor popularity file.

## Blockers (Andy)

- **Podcasts:** 13 episodes are pending. Gemini is returning 402 (billing) and OpenAI is out of credits. The `ANTHROPIC_API_KEY` GH secret is not set, and GH dispatch returns 403 from the device. Andy will:
  - Top up Gemini credits at https://ai.studio/projects.
  - Find YouTube versions of the episodes for the `agents/podcast-gemini-intel.js` path.
- Approve template v2, or send changes.
- Say go on the **Week 4 prop stacks**: build them from the BKR/BEO boards under the Week 3 rules, using the DK rungs as a check. Offered; not started.
- Pre-existing test failures, not from this session: `generateLiveTracker.test.js` (1) and `superContestView.test.js` (1); touched suites 38/40. The full suite could not finish inside the device bridge's 180s limit, so run `npm test` on Windows.

## Guardrails (unchanged)
- No wagers and no sportsbook account actions. Sportsbook pages are read-only.
- No TheOddsAPI calls.
- No Supabase writes, ledger changes or official-pick promotion without Andy's explicit go.
- Paid synthesis needs authorization.
- Preserve the dirty checkout (about 1,260 unrelated dirty or untracked files). Stage narrow, reviewed paths only: never `git add -A`, reset, clean, stash or force-push.
- Uncommitted files left alone on purpose (not from this session):
  - `scripts/props/bookmaker-sgp-dump-parse.mjs` (Codex)
  - `data/supercontest/live-market-comparison.json`
  - Expert dossiers and podcast data
  - BetOnline account PDFs in `docs/tracked-wagers/`

## Next (Saturday 10/3)
1. Final inactives and injury refresh, then rerun the roster gate.
2. Week 4 prop stacks (if Andy says go) and the Week 4 card at `reports/bets/2026-w04-card.md`.
3. Week 4 narratives to the checklist standard, by Codex or Claude. Then build, export and QA the packet.
4. Get Andy's v2 approval. Then lock the SuperContest five and save them to `data/supercontest/locked-card-week-4.json`.
5. Ingest the podcasts once credits are topped up.

## Resume prompt
```
Resume Platinum Rose NFL. HEAD = the 2026-10-02 16:40 Claude handoff commit on top of f64dbaf (main). Suite: full run not completed on the device (the bridge's 180s limit); the touched suites are 38/40, and the 2 failures are pre-existing (generateLiveTracker v4-HTML test, superContestView live-comparison test). State: TNF graded (local ledger), Live Tracker injury bad-beat tracking shipped, Master Intel template v2 awaiting Andy's approval, SuperContest W4 lines saved (dashboard is current-week only), BKR/BEO/DK Week 4 boards parsed (DK includes highlighted yardage rungs), Week 4 narratives on hold until Saturday, podcasts blocked on Gemini/OpenAI credits. Next: Saturday final inactives + roster gate, Week 4 prop stacks (if Andy says go) + card, narratives to the checklist standard, build/export/QA of the W4 packet, lock the SuperContest five. Read HANDOFF.md, reconcile live Git, then read only handoffs/2026-10-02-1640-claude-week4-tnf-graded-v2-template-dk-rungs-handoff.md. Guardrails in that handoff apply (no wagers/account actions, no TheOddsAPI, no Supabase/ledger writes without Andy's go, narrow staging only).
```
