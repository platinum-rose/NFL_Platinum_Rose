# Handoff — 2026-09-26 22:15 PT — Claude (Cowork): Master Intel Report template v1 locked + SuperContest companion report

## What shipped this session (all on `main`, pushed)
- **Kalshi execution gate (option a)** — `src/lib/predictionMarketExecution.js` (bid/ask/fee/liquidity/settlement check vs the best placeable book); Kalshi stays out of SPORTSBOOK_VENUES; Polymarket context-only. (`052919a`)
- **Saturday intel cadence repairs** — YouTube invalid_grant hint + B-YT-OAUTH task (publish the Google OAuth app before ~10/3), Football Outsiders removed, Rotowire guid dedupe, PFF/Rotowire NFL gate, props-intel drops played games, preflight reads the BKR Week<N> snapshot, pick-extraction skips non-NFL opponents (college "Texas" pick). 
- **Bookmaker SGP capture pipeline** — `scripts/props/bookmaker-sgp-extract.browser.js` + `bookmaker-sgp-dump-parse.mjs`; DK Predictions `.mhtml` parser `scripts/props/dk-predictions-mhtml-parse.py`.
- **Week 3 card** — `reports/bets/2026-w03-card.md` "SUNDAY + MNF REBUILD v3"; Morning/Afternoon parlays rebuilt to Andy's templates (`20243d4`): Morning = CIN ML, CLE ML, SF −8.5, BAL ML, LAR ML (+1796); Afternoon = JAX ML, SEA −7.5, SF −8.5, TB ML, LAR ML (+2090). Night ML = hedge placeholder.
- **Master Intel Report — template v1 LOCKED** (Andy approved; sent to clients). Builder `scripts/master-intel/build.py` + `convert_summary.py` + `export_pdf.py`. Spec: `docs/MASTER_INTEL_REPORT_FORMAT.md`; steps: `docs/MASTER_INTEL_REPORT_RUNBOOK.md`; skill: `.agents/skills/master-intel-report/SKILL.md`; pointers in CLAUDE.md / AGENTS.md. Exports html/pdf/docx/md/json. Weekly hand-written inputs: `reports/intel/master-intel-narratives-<season>-w<NN>.md` (game blocks + `## TICKETS` + `## SUPERCONTEST`) and `data/survivor/pick-intel-<season>-w<NN>.json`.
- **SuperContest companion report** (`29f23c4`) — built by the same `build.py` run when `data/supercontest/week-<NN>-lines.json` exists: Our Five (contest vs market, room vs line, key-number warnings), Andy & Amanda pick sheet, every side ranked, contest vs market, expert panel, game-by-game, season review (graded from `data/supercontest/locked-card-week-<N>.json` + box scores).
- Week 3 archive set in `dist/nfl_week3_master_packet/` (gitignored): master + supercontest × html/pdf/docx/md/json. Private claude.ai artifacts: "Week 3 Master Intel" and "Week 3 SuperContest".

## Open / next
1. **NEXT SESSION (Andy): build the weekly SuperContest cadence** around the new report — when lines post (Wed), when to capture `week-<NN>-lines.json`, when to build/review with Amanda, locking the joint five into `locked-card-week-<N>.json`, grading next week. Week 3's joint five is **not yet saved** to `data/supercontest/locked-card-week-3.json`.
2. Week 3 SC ranking vs card: CIN −3.5 (loses key number 3 vs market −3) ranks 10th; NYJ +6.5 9th; JAX −3 12th; top 4 by contest score = CLE +2.5, IND +2.5, SEA −7, TB +1.5. Decision is Andy & Amanda's.
3. DK Predictions saves for 14 of 15 games still pending (Andy "later tonight"); rebuild both reports after (`python3 scripts/master-intel/build.py --week 3 --date 2026-09-26`, then `export_pdf.py`).
4. PDF export needs Playwright + Chromium, not installed on Andy's machine (`pip install playwright && python3 -m playwright install chromium`); this week's PDFs were made in the cloud container.
5. Google Drive archive of the five files per report not done (offered; Drive connector available).
6. Ticket 739211245: 2 open spots (PHI ML + TEN ML recommended). Ledger (claude.ai Project doc `claude/recommendation-ledger-2026.md`) needs proposed-vs-placed after Andy places.
7. MNF PHI@CHI card Monday. B-YT-OAUTH before ~10/3.
8. Dirty tree: ~1,200 pre-existing modified/untracked files remain (other agents/scheduled tasks). Only this session's Week 3 inputs/outputs were committed; see the commit list in git log.

## Guardrails (unchanged)
No `git add -A`; never reset/clean/stash; Supabase writes need per-change OK; no bet placement/account actions; sportsbook pages read-only; no team power ratings as evidence; manual BKR/BEO lines only (TheOddsAPI ~11 requests left); prediction-market % never mixed with sportsbook odds without the fee/spread check.

## Resume prompt (paste into a fresh session)
> Resume NFL_Dashboard. Read HANDOFF.md, then `handoffs/2026-09-26-2215-claude-master-intel-template-supercontest-handoff.md`, then `docs/MASTER_INTEL_REPORT_FORMAT.md` §8 (SuperContest companion). Goal this session: design our **weekly SuperContest cadence** around the new SuperContest report (line capture → build → review with Amanda → lock the joint five into `data/supercontest/locked-card-week-<N>.json` → grade next week), and save Week 3's final joint five. Same standing constraints as the handoff.
