# H2C2 Start Here — NFL Dashboard, Week 8 / Futures

For Claude Team 2. Read this first; then check live Git, choose one lane, and load only the matching sources below.

## Live Git check

Run `git status --short`, `git branch --show-current`, `git rev-parse HEAD`, and `git rev-parse '@{u}'` before acting. The closeout began at `929be0255dae58d0a18ac3f7084617be52803345` on `claude/w5-prop-cards-2026-10-11`; live Git wins if it differs.

## Active lanes

| Choose one | Start with |
|---|---|
| Week 8 prep | `public/schedule.json`, `data/projected-starters/2026/latest.json`, current Week 8 reports and evidence |
| Week 7 grading | `reports/analysis/week7-postmortem/w07-closeout-2026-10-27.md` and `platinum-rose-w7-paper-accuracy-2026-10-27.md` |
| Live Tracker O/U review | `scripts/generate-live-tracker.mjs`, `docs/tracked-wagers/reconciliation-latest.md`, `public/live-tracker-sunday.html` |
| BEO futures review | `data/odds/BEO_futures_1027_1456.md` and the corresponding normalized/raw capture files |
| Yahoo fantasy research | First arrange an authorized read-only Yahoo connection in the receiving environment; access notes were excluded from Git |

## Guardrails and stop conditions

- Tuesday 10/27 cadence already ran; next cadence is Wednesday. Do not repeat Tuesday.
- Keep each betting lane's real, paper, proposal, and futures records separate. This handoff authorizes no sportsbook, account, ledger, portfolio, Supabase, or external publication actions.
- Confirm source freshness and applicable repo gates. Stop if required evidence is stale or absent; do not fill missing data with guesses.
- The Yahoo access briefing, private account files, scratch media, backups, and `.nfl` temporary/private files were excluded.
- The repo's current secret-scan hook is syntactically malformed; the closeout used a separate candidate content scan and excluded the only credential-like briefing it found. Repairing that hook is a separate code task.

## Detailed materials on demand

Read `handoffs/2026-10-27-1549-claude-h2c2-claude2-closeout-week8-futures.md` for the detailed state and stop conditions. The snapshot `README.md`, `file-manifest.md`, historical H2C2 briefings, and older session handoffs are only needed for a contradiction, recovery, audit, or explicit history request.
