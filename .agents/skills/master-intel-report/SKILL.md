---
name: master-intel-report
description: Build the weekly Platinum Rose Master Intel Report (Saturday night, before the Sunday slate) in the locked template v1 format, with html, pdf, docx, md and json exports.
---

# Master Intel Report (weekly, Saturday night)

**When to activate:** Andy asks for the "Master Intel Report", the "intel report", the "Saturday report", or the weekly betting intelligence summary. Also when anyone asks to change the report's format.

**Read first, in order:**
1. `docs/MASTER_INTEL_REPORT_FORMAT.md`: the locked template (layout, plain-English rules, what gets hand-written, exports, agent instructions).
2. `docs/MASTER_INTEL_REPORT_RUNBOOK.md`: the step-by-step build (captures, refreshes, pull, build, QA).

**The short version:**
1. Refresh the inputs and capture the Bookmaker lines (runbook steps 0–8).
2. `node scripts/master-intel/pull.mjs --week <N>`
3. First pass: `python3 scripts/master-intel/build.py --week <N> --date <capture-date> --no-export`
3b. **Roster gate:** `python3 scripts/nfl-rosters/roster_vet.py --week <N> --date <capture-date> --fetch --strict` must print `ROSTER VET: PASS`. Never write a player's 2026 team, role or status from memory; look it up in `data/nfl-rosters/espn-full-rosters-latest.json`.
4. Write `reports/intel/master-intel-narratives-<season>-w<NN>.md` (game write-ups + `## TICKETS` + `## SUPERCONTEST`) and `data/survivor/pick-intel-<season>-w<NN>.json`.
5. Final build: `python3 scripts/master-intel/build.py --week <N> --date <capture-date>` (md, html, docx, json). It re-runs the roster gate and exits on any BLOCK.
6. `python3 scripts/master-intel/export_pdf.py dist/nfl_week<N>_master_packet/nfl_week<N>_master_betting_intelligence_summary.html` (pdf).
7. QA (format doc §6), then archive the five files to Google Drive: `Platinum Rose / Master Intel / <season> / Week <NN>`.

**Never:** hand-edit the output files, redesign the layout without Andy's OK, click anything on a sportsbook, write to Supabase, place bets, or `git add -A`.
