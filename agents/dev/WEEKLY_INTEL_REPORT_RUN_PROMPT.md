---
name: WEEKLY_INTEL_REPORT_RUN
role: Weekly Master Intel + SuperContest Intel report run — Friday build, late-Saturday re-run
category: dev
docsOnly: true
created: 2026-10-30
requires: scripts/master-intel/final_gate_check.py verdict GREEN for the same stage
---

# Platinum Rose — Weekly Intel Report run (Master + SuperContest)

## Activation (copy, fill <WEEK> and <STAGE>)

```text
Run the Platinum Rose Week <WEEK> Intel Report run, STAGE=<friday|saturday>.
Repo: E:\dev\projects\NFL_Dashboard via device_bash only ($HOME/mnt/dev/projects/NFL_Dashboard).
Read agents/dev/WEEKLY_INTEL_REPORT_RUN_PROMPT.md and follow it. Step 0 is the Final Gate Check; do not start synthesis unless it is GREEN for this stage.
```

## Cadence

| Stage | When | Purpose |
|---|---|---|
| **friday** | Fri afternoon/evening, once the Friday gate is GREEN | First full build of BOTH reports: Master Intel + SuperContest Intel. Andy & Amanda use the SC report to lock their five (the five is never a prerequisite). |
| **saturday** | Late Sat night, after the Saturday gate is GREEN | Re-run with late data (final lines, Friday injury designations, BEO Sunday props, late expert/podcast/Grok picks). Delta-driven: re-synthesize only games whose inputs changed; rebuild both reports in full. |

Environment: `export PATH=$HOME/pyenv312/bin:$PATH NODE_USE_ENV_PROXY=1`. Python 3.12 venv for build.py. Device shell cannot delete: rename new 0-byte `.git/**/*.lock` to `.git/stale-*` after git commands. Stage by explicit path only.

## Hard rules
- No wagers, account actions, Supabase writes, paid API/model calls, publication (artifact, Drive, client send) or git push without Andy's per-action OK. (Gemini/Grok extraction belong to the gate, not this run.)
- Once the gate is GREEN, every synthesis runs to completion: later gate-style issues (pins, hashes, a stale feed) are **noted in the report's gaps, never a reason to stop**.
- Never state a player's team, role or status from memory; roster gate + live search (see docs/BETTING_LESSONS_LEARNED.md).
- Paper recommendations go to the recommendation ledger only; never touch placed-wager records, bankroll or the futures ledger.

## Step 0 — Final Gate Check (blocking)
```
python3 scripts/master-intel/final_gate_check.py --week <WEEK> --stage <STAGE>
```
- RED → stop. Post the "Blocking items" list (each with its fix) to Andy and wait. Do not run steps 1+.
- GREEN → continue. Copy the ADVISORY warnings into the report gaps (step 7).
- Saturday only: before rebuilding, snapshot Friday's outputs: `cp -r dist/nfl_week<WEEK>_master_packet dist/nfl_week<WEEK>_master_packet_friday` (once; never overwrite an existing `_friday` copy).

## Step 1 — Synthesis queues (rebuild last, after every input)
```
python3 scripts/intel/build-game-synthesis-queue.py --week <WEEK> --pass sides --date <BKR capture date>
python3 scripts/intel/build-game-synthesis-queue.py --week <WEEK> --pass props --date <BKR capture date>
```
The BKR capture date is in the gate report header. Props pass may carry "BEO thin" on Friday; note it.

## Step 2 — Per-game sides syntheses (one game per session/agent)
- Prompt: `agents/dev/GAME_SYNTHESIS_SESSION_PROMPT.md`, PASS=sides, QUEUE=`scratch/w<WW>-game-synthesis-queue-sides.json`. One independent session per game; games never read each other.
- **friday:** all games still to play.
- **saturday (delta):** re-run a game if ANY of: spread or total moved ≥ 0.5 vs the Friday packet (crossing 3/7 always counts); a QB or key starter's status changed; a Friday injury designation affects a pick; new expert/podcast/Grok picks on the game; weather materially changed; a news flag (trade, pulled market) touches it. Otherwise carry the Friday synthesis forward with a one-line "no material change (checked <time>)" note. List re-run vs carried games in the run summary.
- Every run completes; missing inputs are named in its Ambiguity section.

## Step 3 — Per-game props syntheses
Same prompt, PASS=props, props queue. Friday: run for games with posted boards; Saturday: all games (BEO Sunday props now required by the gate).

## Step 4 — Quant refresh
Re-run `reports/intel/w<WW>-model/fair_lines.py` (copy the prior week's script if missing) on the current BKR/consensus lines and `node scripts/intel/margin-simulator.mjs` for every game with a candidate rec. Syntheses supply injury/judgment adjustments (soft cap 2.0, hard cap 3.0).

## Step 5 — Synthesis digest and card
- `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md` → `scratch/w<WW>-synthesis-digest-sat.md` (rolled up from steps 2–4) and `reports/bets/<season>-w<WW>-card.md`.
- Platinum Rose recs only where a Pitch can be made; every rec gets Pitch / Pushback (`agents/dev/PITCH_PUSHBACK_AGENT.md`) → `reports/intel/master-pitches-<season>-w<WW>.json`. Non-elevated = "Lean" on game cards + the "Leans: not elevated" section.
- Always include the 7e Anytime TD 7-leg and 8a First TD parlay recs.
- Prop stacks: one leg per game across the slate (`agents/dev/PROP_STACK_AGENT.md`), BEO for cross-game props; no BKR QB INT legs in BKR SGPs; no prop round robins.
- Parlay templates (morning / afternoon / SNF ML cap as last-resolving leg; no same-game legs outside SGP at BKR). Units: $10 parlays, $20 singles.

## Step 6 — Narratives, experts, SuperContest
- Rewrite `reports/intel/master-intel-narratives-<season>-w<WW>.md` from the syntheses (game script / why the card leans / what breaks it), plus `## TICKETS` and `## SUPERCONTEST`.
- **Preferred-expert final cards:** one block per expert in `data/expert-tracking/preferred-experts-2026.json` (the gate's E10 coverage table says where each card was found: article, podcast, YouTube, Grok/X, Twitter video). Attribute picks to the individual expert, not the outlet. Experts with no published card are listed as such (gate-manual `experts_no_card`).
- Twitter media (`data/twitter/w<WW>-media-extraction-queue.json`): video picks, image/chart stat cards (matchup analytics, not picks) and Grok thread picks feed the expert section and the game packets.
- `reports/intel/expert-narratives-<season>-w<WW>.md`: per-expert picks + reasoning; verify each expert/article against the actual matchup; same pick from the same show via audio + YouTube = one opinion.
- SuperContest pitches (AI five, spread-only, Pitch/Pushback) → `reports/intel/supercontest-pitches-<season>-w<WW>.json`. If `data/supercontest/locked-card-week-<WEEK>.json` exists, the official five is shown alongside; never required.

## Step 7 — Build both reports
```
python3 scripts/master-intel/build.py --week <WEEK> --date <BKR capture date>
python3 scripts/master-intel/check_sc_report.py   # SuperContest format gate: FAIL = do not send the SC report
```
- build.py runs the strict roster gate itself; BLOCK = fix names in source files (never `--allow-roster-issues` without Andy).
- Gaps section lists every ADVISORY gate warning and every synthesis Ambiguity that affected a rec.
- Client editions: the **Week 7 editions are the starting template** for both client reports (Andy, 2026-10-30). Build the client copies from that format; any client-specific trims need Andy's spec.
- PDF: device has no Chromium → stage the html, run `scripts/master-intel/export_pdf.py` in the cloud container, commit the pdf back to `dist/`.

## Step 8 — QA (runbook §6) and summary
- QA every item in `docs/MASTER_INTEL_REPORT_RUNBOOK.md` §6. Open the html and the pdf.
- Summary ≤ 15 lines to Andy: verdicts, recs (with line + price), changes vs Friday (saturday stage), gaps, file paths. Show files in-session (SendUserFile), inline any copy-paste text.
- Stop. Publication (hosted link republish, Drive archive `Platinum Rose / Master Intel / <season> / Week <WW>`, client send) and git push each need Andy's OK.
