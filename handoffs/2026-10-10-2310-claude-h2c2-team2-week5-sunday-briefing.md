# H2C2 detailed briefing — Week 5 per-game synthesis done → Claude Team 2 builds Sunday cards

Written Sat 2026-10-10 ~23:10 PT by Claude Team 1 (Cowork, linked to Andy's laptop). Required first read is the start brief: `reports/handoff-snapshots/2026-10-10-h2c2-week5-sunday/H2C2_START_HERE.md`. This file is the detailed reference; load only the section for your lane.

## 1. Verified Git state at handoff

- Repo `E:\dev\projects\NFL_Dashboard`, branch `main`. Before this handoff commit HEAD was `7ebef66` (6 commits ahead of origin: 3f9cc26, 3a32ce8, 4a42100, edcb385, d36f3f7, 7ebef66). The handoff commit sits on top of 7ebef66; run `git log -3 --oneline` for its SHA. **All per-game outputs and packets were produced at 7ebef66** — use the newest HEAD in any new launch message.
- The checkout is intentionally dirty (~950 entries from other lanes). Commit only explicit paths (`git add <path>` or a temporary index); never `git add -A`, reset, clean, stash.
- Live Git wins over this prose. If they disagree, stop and report.

## 2. What Team 1 did tonight

1. Reviewed Astra CLE@NYJ against its packet: clean.
2. Moved the stale Astra PHI@JAX output to `reports/intel/games/_superseded/` and `data/research-intel/proposed/games/_superseded/` (kept untracked).
3. Codex (Astra) ran out of tokens after finishing CHI@GB; Team 1 ran **all 14 games as `MODEL = opus`** via parallel Claude agents (one blind agent per game; each wrote only its two files), all at HEAD 7ebef66 between 05:19 and 05:49Z, before the BKR window closed (07:15Z = 00:15 PT).
4. Validated all 18 outputs (14 Opus + 4 Astra): 0 fail / 0 warn (`reports/handoff-snapshots/2026-10-10-h2c2-week5-sunday/validation-summary.txt`).
5. Hand/agent number review of every output against its packet → corrections table, patterns and packet gaps in `reports/intel/games/2026-w05-per-game-review-notes.md`.
6. Found the ESPN availability gap (221 players) → `reports/intel/games/2026-w05-espn-roster-ir-out-gap.md`.
No wagers, tickets, ledger/portfolio/Supabase writes, paid calls or TheOddsAPI. No scraping (books were not recaptured).

## 3. Per-game results (summary; full table in the review notes §1)

- Opus 14/14 and Astra CLE@NYJ, CHI@GB (7ebef66), MIN@NO (4a42100), BAL@ATL (d36f3f7).
- Every output is pass / conflicted / price moved with tier skip or research_only, **except Opus IND@PIT: price moved / 2−, Under 43.5 on weather only**. Team 1 recommends treating it as research_only until Sunday's forecast and lines (the only tier-eligible total source took Under 44.5). Andy decides.
- Book conflicts (BKR vs BEO ≥ 1 pt) on Saturday night: MIN@NO (2.5 vs 1) and CLE@NYJ (−2.5 vs −1).
- Weather flagged `review_required`: CLE@NYJ (78% rain, gusts 37 km/h), CHI@GB (gusts 42 km/h), IND@PIT (gusts 58 km/h), NYG@WAS (72% rain, 0 mm).
- QB notes: CHI ambiguous (ESPN: Caleb Williams Questionable; operator-confirmed Bagent). Operator-confirmed: BAL Huntley, CHI Bagent, WAS Daniels, NYG Winston (`data/research-intel/operator-confirmed-starters-2026-w05.json`).
- Kickoffs (PT): PHI@JAX **Sun 06:30 (London)**; CHI@GB, HOU@TEN, CIN@MIA, LV@NE, MIN@NO, CLE@NYJ, IND@PIT, NYG@WAS Sun 10:00; DEN@LAC 13:05; DET@ARI, SF@SEA 13:25; BAL@ATL Sun 17:20; BUF@LAR Mon 17:15. TB@DAL is final (TB 24–16).

## 4. Lanes for Team 2

### 4.1 Sunday-morning refresh (time-critical; Andy runs the PowerShell steps)
Do this before relying on any price. PHI@JAX kicks off 06:30 PT, so refresh by ~05:30 PT for that game.
1. Andy (PowerShell, repo root): `npm run props:bkr:launch` then `npm run props:bkr:cron` (same as `./bkrp` / `npm run runbkrprops`); `npm run props:bol:launch` then `npm run props:bol:cron` (same as `./bolp` / `npm run runbolprops`). Read-only capture tabs.
2. `python3 scripts/intel/fetch-espn-status.py` (ESPN injuries, depth charts, finals → `data/research-intel/source-evidence/espn-status-w05.json`). Reconfirm operator starters with Andy only if ESPN shows a Questionable/Doubtful QB; never ask him to confirm publicly announced statuses.
3. `npm run roster:vet -- --week 5 --date 2026-10-11 --strict` (roster gate before any player-specific card).
4. Rebuild packets: `python3 scripts/intel/build-w05-game-packets.py` (picks the newest `data/generated/props/{bookmaker,betonline}-live-2026-10-*-week5.json`; `--exclude TB@DAL` is the default; add any game already final). Weather: `data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json` is from 10-10 17:56Z and **no fetch script exists in the repo** (only the builder reads it). Four games carry `review_required` weather; a refreshed kickoff forecast needs a new capture that Andy approves, otherwise state the forecast age in every weather-driven call.
5. Commit the rebuilt packets + evidence with explicit paths; put the new short SHA in every launch message (preflight checks `--expect-head`).
Recommendation windows: capture + 6 h, or + 3 h once within 6 h of kickoff (packet field `expires_for_recommendation_at`; do not recompute).

### 4.2 Pipeline fixes before the rebuild (optional but recommended; ~30–60 min)
- `scripts/intel/fetch-espn-status.py` + `scripts/intel/build-w05-game-packets.py`: add ESPN roster `injuredReserveOrOut` players (from `data/nfl-rosters/espn-full-rosters-latest.json`, refreshed by `npm run roster:fetch`) to AVAILABILITY as a separate labelled "ESPN roster IR/Out group (unconfirmed)" category; fix the packet sentence "Players not on this list are not reported injured by ESPN".
- `prompts/2026-w05-game-synthesis.md`: add the four notes in review notes §2 (key-number = `side_push`; FTN table+metric incl. `__2` clean-pocket splits; source attribution for availability; newest props file + row timestamps). Note: the prompt and calibration files are pinned by the preflight (it checks they are committed and clean) — commit prompt edits before launching.
- `scripts/intel/validate-game-output.py`: optional BEO-expiry check.

### 4.3 Per-game reruns on fresh packets
- Which games: any game whose decision matters for the card, plus any whose line or availability changed. Move old outputs for the same model into the `_superseded/` folders first (an existing output forces "no price-specific recommendation"; `rm` of shared files is not permitted from Cowork without Andy's approval — `mv` works).
- **Opus via Claude agents** (what Team 1 did): one general-purpose agent per game, launched in parallel; each ~5 min and ~135–185k tokens. Give each agent: the repo is reachable only through `mcp__remote-devices__device_bash` at `$HOME/mnt/dev/projects/NFL_Dashboard`; `cat prompts/2026-w05-game-synthesis.md` and follow it with GAME/GK/MODEL=opus/HEAD; run the preflight **in the foreground** (`timeout 175 python3 scripts/intel/week5-preflight.py --model opus --game G --prompt prompts/2026-w05-game-synthesis.md --expect-head HEAD > $HOME/scratch/pf-opus-GK.txt 2>&1`; background/nohup runs get killed when the shell call ends); work blind (only its own packet; never read other outputs); write only its two files via device_bash; no git; finish with the validator and a <200-word report. Python in that shell is 3.10 (accepted), node 22.
- **Astra via Codex** — paste one message per game (Codex sessions run out of tokens; of the three Codex sessions launched Saturday night only CHI@GB finished):
  > Run the Week 5 single-game synthesis in `E:\dev\projects\NFL_Dashboard`. Read `prompts/2026-w05-game-synthesis.md` and follow it exactly. GAME = AWAY@HOME, GK = AWAY_at_HOME, MODEL = astra, HEAD = <current short SHA>. Environment note: if `python3 --version` is not 3.10+, define a session-only alias to the real interpreter (Windows `python3` is the Store stub; real interpreter is Python 3.14.2, `py`/`python` aliases are also unusable — locate under `%LOCALAPPDATA%\Programs\Python` or `C:\Python*`). Batch note: other sessions may be running other Week 5 games; touch nothing but your two output files and read no other game's packet or output. Rules: any preflight FAIL/traceback/non-zero exit -> stop and report; work blind; write only the two output files; no commit/push/stage; end with an "Ambiguity / missing data" list.
- After each run: `python3 scripts/intel/validate-game-output.py --model M --game G`, then hand-check narrative numbers (the validator does not).

### 4.4 Sunday card build (Team 2's main lane)
- Start from Codex's review-only layers: `reports/bets/2026-w05-card.md`, `reports/intel/master-intel-narratives-2026-w05.md`, `data/research-intel/hypothesis-ledger/2026-w05-pilot.json`, and `handoffs/2026-10-10-codex-week5-card-prep-and-prop-capture-handoff.md` (shortlist LV +3.5, CHI −1.5, BUF +3; props Dulcich o25.5, Judkins u59.5 — all `review`/`unpriced_thesis`).
- Cross-check each card item against the per-game outputs and review notes §4 (none of the per-game runs supports a shortlist side at tier 2 on Saturday-night prices).
- Every price must come from a fresh capture inside its recommendation window; every player leg must pass the roster gate and the ESPN roster-group check (gap file).
- Keep proposed vs placed separate. Recording a real ticket requires Andy's explicit authorization and his reported book/price/time.

### 4.5 Slate merge (optional dry run)
`prompts/2026-w05-slate-merge.md` (untested). Needs all 14 outputs for one model — Opus has them at 7ebef66 (Saturday prices, so every game would be `stale_for_recommendation` after 00:15 PT; useful only to test the prompt). The old `reports/bets/2026-w05-opus-decision-support.md` is already moved to `reports/bets/_bak/`; keep it out of `reports/bets/`. For a real merge, rerun the 14 on fresh packets first.

## 5. Corrections and known errors
See `reports/intel/games/2026-w05-per-game-review-notes.md` §2 (per-output corrections; none changes a disposition) and §3 (packet gaps). Earlier Team 1 errors already corrected: none outstanding.

## 6. Open decisions for Andy
1. IND@PIT 2− weather-only Under — keep as research_only? (Team 1: yes.)
2. Which games to rerun Sunday morning, and with which model (Opus via Claude vs Astra via Codex).
3. Whether to land the ESPN roster-group fix before the rebuild.
4. SuperContest label swap (six reversed matchups: TEN@HOU, MIA@CIN, NO@MIN, GB@CHI, LAC@DEN, ARI@DET) still awaits his OK; models join by unordered pair and use the favorite/spread fields.

## 7. Guardrails and stop conditions (unchanged)
- No database deletes; no paid Gemini or Supabase writes unless Andy runs them; no TheOddsAPI; sportsbooks read-only; no wagers, tickets, cashier or account actions; ledger/portfolio/official-pick records change only to record what Andy reports.
- Anything the cloud VM can't reach (git push, X, RSS, YouTube, sportsbook capture) Andy runs in PowerShell.
- Don't reinstate Monday-night Week 4 leakage: the pull window starts Mon 04:00Z.
- Never `git add -A`; preserve the dirty checkout; roster gate before player cards.
- Stop and report: stale/missing capture, changed line, unavailable market, status conflict, preflight FAIL/traceback, or Git/handoff mismatch.

## 8. Artifact map
| Need | Path |
|---|---|
| Per-game outputs | `reports/intel/games/2026-w05-{opus,astra}-<GK>.md`, `data/research-intel/proposed/games/2026-w05-{opus,astra}-<GK>.json` |
| Results + corrections | `reports/intel/games/2026-w05-per-game-review-notes.md` |
| ESPN roster-group gap | `reports/intel/games/2026-w05-espn-roster-ir-out-gap.md` |
| Validator results | `reports/handoff-snapshots/2026-10-10-h2c2-week5-sunday/validation-summary.txt` |
| Packets (Sat night) | `data/research-intel/game-packets/2026-w05/` (`_slate-index.json`, `_slate-context.md`) |
| Prompts | `prompts/2026-w05-game-synthesis.md`, `prompts/2026-w05-slate-merge.md` |
| Scripts | `scripts/intel/{build-w05-game-packets.py,fetch-espn-status.py,week5-preflight.py,validate-game-output.py,margin-simulator.mjs}` |
| ESPN status / operator starters | `data/research-intel/source-evidence/espn-status-w05.json`, `data/research-intel/operator-confirmed-starters-2026-w05.json` |
| Book captures | `data/generated/props/bookmaker-live-2026-10-11-week5.json`, `data/generated/props/betonline-live-2026-10-*-week5.json` |
| Codex card lane | `handoffs/2026-10-10-codex-week5-card-prep-and-prop-capture-handoff.md`, `reports/bets/2026-w05-card.md` |
| Snapshot copies (provenance only) | `reports/handoff-snapshots/2026-10-10-h2c2-week5-sunday/copies/` |
