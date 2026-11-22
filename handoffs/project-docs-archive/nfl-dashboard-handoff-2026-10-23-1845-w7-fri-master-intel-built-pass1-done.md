# NFL Dashboard handoff, Fri 2026-10-23 ~6:45 PM PT (updated ~7:35 PM): W7 Master Intel + SuperContest built, pass-1 game syntheses done; Saturday = props pass + card

Repo `E:\dev\projects\NFL_Dashboard` (bridge `$HOME/mnt/dev/projects/NFL_Dashboard`), branch `claude/w5-prop-cards-2026-10-11`. **Committed + pushed ca1b7f4** (Andy's go, 6:40 PM). Uncommitted since: `data/podcasts/youtube-extracted-picks-2026-w07.json` (+10 AN audio picks), `agents/dev/ANTIGRAVITY_W07_YOUTUBE_DIARIZATION_CHASE.md`, `reports/intel/expert-narratives-2026-w07.md`, `scripts/master-intel/build.py` (expert-narratives section), `docs/MASTER_INTEL_REPORT_FORMAT.md` (input row). Include them in Saturday's commit. Git file deletion on E:\dev was approved this session (needed to clear .git locks); a new session may need to re-ask.

## Done tonight
1. QB confirmations (Andy + web): NYG McCarthy; BAL Lamar Q (Huntley if out); TB Mayfield Q, expected to start; ARI Brissett; ATL Penix; CLE Watson; LV Cousins; MIN Murray; SEA Darnold; PHI McKee (Hurts out for season). File: `scratch/w07-qb-confirmations-1023.md` (only NYG/BAL/TB are Andy-confirmed; the rest are web-checked).
2. Re-pull 6:30 PM: availability (live injuries), projected starters, `pull.mjs` (signals 140, notes 738, expert 57, splits 14), article review (536 records), `verify_expert_rows.py --week 7 --date 2026-10-23` (68 verified / 39 rejected).
3. **New per-game synthesis system:** `scripts/intel/build-game-synthesis-queue.py --week N --pass sides|props [--date] [--qb-notes]` → `scratch/wNN-game-synthesis-queue-<pass>.json` (13 sliced packets, 50–88 KB). Prompt: `agents/dev/GAME_SYNTHESIS_SESSION_PROMPT.md`. Dispatched as 13 parallel **Opus** agents (Andy's choice). Outputs: `reports/intel/games/2026-w07-game-<AWAY>_at_<HOME>-sides.md`, `data/research-intel/proposed/games-w07/*-sides.json`, RUNLOG.
4. Digest `scratch/w07-synthesis-digest.md`, narratives `reports/intel/master-intel-narratives-2026-w07.md`, survivor `data/survivor/pick-intel-2026-w07.json`.
5. Roster gate PASS.
6. `build.py`: run on Windows via Desktop Commander (`python` = 3.14; VM Python 3.10 can't compile it). Patched for the W7 flat YouTube-pick schema; python-docx installed on Windows; PDFs exported in the cloud container (Windows has no Playwright). **Not archived to Drive yet**: archive the Saturday final.
7. **Diarization:** Action Network "NFL Week 7 Betting Preview" (10/21) named via voiceprints (Stucky 0.962, Doug Kazarian 0.992; Evan Abrams by text cue). 10 picks approved by Andy and merged into `youtube-extracted-picks-2026-w07.json` (source_pipeline=audio_parakeet_voiceprint; 85 picks total). Staging: `scratch/parakeet-w07-tue/picks/action-network-preview-2026-10-21.picks.json`.
8. **Matt Perrault** is the correct spelling (Andy). Voiceprint key, stats, BettingPros reference clip + draft, Antigravity prompt all renamed (backup `voiceprints.pre-perrault.npz`).
9. **Antigravity prompt** (YouTube versions of Sharp or Square Tue/Thu + Move the Sticks Picks/Confidence; speaker-attribution scoring vs hand-labeled clips; title the 8 untitled W7 YouTube videos): `agents/dev/ANTIGRAVITY_W07_YOUTUBE_DIARIZATION_CHASE.md` + Project doc `claude/antigravity-w07-youtube-diarization-chase-2026-10-23.md`. Deadline Sat 10 AM PT; $2 Gemini cap. Expected outputs: `data/podcasts/youtube-extracted-picks-2026-w07-addendum.json`, `reports/intel/antigravity-w07-youtube-diarization-eval.md`.
10. **Expert narratives (Andy: include in the Master Intel report):** `reports/intel/expert-narratives-2026-w07.md` (27 experts, reasoning per pick, "Moved:" vs BKR Fri 1:10 PM, stacking table, dropped list). build.py now renders it in section 4 ("🧠 Why the experts like what they like") as one collapsible panel per expert, before the registry (backup `scratch/build.py.bak-20261023-xnarr`). Format doc row added.

## Pass-1 leans (tiers)
B: Under 41.5 IND@MIN, Under 39 MIA@NYJ, Over 45 TB@CAR, SC CIN +2.5 (A- if Lamar out), SC GB +3.5.
C: Under 44.5 PIT@NO (wind), CAR -3, NYJ -4.5, Under 37.5 CLE@TEN, NYG +10.5 -120, Under 49.5 SF@ATL, CIN ML -102, Under 48.5 CIN@BAL, ARI +4, Under 43 DEN@ARI, GB +3 +104, Over 53.5 GB@DET, Over 48.5 LAR@LV (Nacua), KC +2.5/+134, PHI +4.5, Under 44 DAL@PHI.
SC five proposed: CIN, GB, CLE, PHI, LV; alternates ATL, NO, ARI. Pool confidences collide (re-rank across games).
Sharp flags: CIN ML (22-pt), TB +3 (25), TEN spread (15), HOU spread (15), ATL spread (13), NO ML (14), PHI ML (13), LAR@LV over (11). KC@SEA: line moved to SEA vs 89% KC money.

## Saturday
1. Andy reruns `npm run bolp` (BetOnline props) and optionally `bkrp`; check SF@ATL / CIN@BAL BKR props posted.
2. Pick up Antigravity's addendum + eval; if approved, merge addendum picks (one opinion per show) and **refresh `reports/intel/expert-narratives-2026-w07.md`** (new experts: Sharp or Square hosts, Move the Sticks; update "Moved:" lines to Saturday BKR).
3. `python3 scripts/intel/build-game-synthesis-queue.py --week 7 --pass props --date 2026-10-24 --qb-notes scratch/w07-qb-confirmations-1023.md`, then dispatch 13 Opus props agents (same prompt, PASS=props).
4. Card per `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md` (STOP B before tickets) → `reports/bets/2026-w07-card.md`; refresh narratives' "Why the card leans" with real tickets; rebuild (Windows/DC), PDF in container, archive to Drive `Platinum Rose / Master Intel / 2026 / Week 07`; save SC five to `data/supercontest/locked-card-week-7.json` after Andy & Amanda pick. Commit + push.
5. Sunday AM: Lamar, Nacua, Mayfield, Terrell, Kirk statuses; PIT@NO wind re-check (Paris inactives ~5:00 AM PT).

## Data issues found by agents (upstream fixes)
ATL dossier lists Raheem Morris as HC (news: Stefanski; Morris = SF DC); ARI dossier lists Gannon (news: LaFleur); secondary-matchup coverage notes carry stale coach names; mis-tagged expert/article rows (VSiN "Broncos ML +130", Makinen CIN pick on ARI/DEN, Radowitz CAR pick on DEN); projected-starters still says Dart (NYG) and Daniels (TB); availability feed lacks Friday designations; build.py EXPERT_SHOW maps "Stuckey" (actual: Stucky).

## Resume prompt
"Resume Platinum Rose Week 7 (Sat 10/24): read `claude/nfl-dashboard-handoff-2026-10-23-1845-w7-fri-master-intel-built-pass1-done.md`. Pick up Antigravity's YouTube addendum/eval, refresh the expert narratives, and after Andy's bolp rerun build the props queue and dispatch 13 Opus props agents; then build the Week 7 card (STOP B before tickets), refresh narratives, rebuild Master Intel + SuperContest (expert narratives included), export, archive to Drive, commit + push."
