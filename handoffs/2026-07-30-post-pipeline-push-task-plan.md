# NFL Dashboard Post-Pipeline Push Task Plan

**Date:** 2026-07-30
**Branch:** main
**Remote status:** pushed to `origin/main` through `c4f52df`
**Purpose:** Preserve the clean checkpoint after the injury/player-availability/secondary-matchup pipeline work, then separate the remaining dirty files into reviewable workstreams for a fresh session.

---

## Completed And Pushed

The committed pipeline work has been pushed to GitHub:

- `c758b7b` - Add player availability source snapshot.
- `2be02f4` - Split trench availability risk signals.
- `c4f52df` - Add secondary matchup vulnerability POC.

Also included in the pushed history are the earlier crash-recovery/source-audit/futures-readiness commits that were already local. `main` is now synced with `origin/main` at `c4f52df`.

No paid/frontier model calls, Supabase writes, official-pick approvals, production recommendation persistence, or open-parlay changes were made during this checkpoint.

---

## Remaining Dirty Workstreams

### 1. Fantasy Value Board

Files currently dirty or untracked:

- `package.json`
- `public/fantasy-value-board.json`
- `docs/fantasy/value-board-2026-07-30.html`
- `docs/fantasy/value-board-2026-07-30.json`
- `docs/fantasy/value-board-2026-07-30.md`
- `tests/unit/fantasyValueReport.test.js`

Observed diff:

- `package.json` adds `seed:adp` and `report:fantasy`.
- `public/fantasy-value-board.json` updates the report date from `2026-07-26` to `2026-07-30`.
- Related scripts already exist: `scripts/parse-adp.js` and `agents/fantasy-value-report.js`.

Fresh-session review steps:

1. Inspect `agents/fantasy-value-report.js`, `scripts/parse-adp.js`, and the generated July 30 fantasy docs.
2. Run targeted syntax and unit checks for the fantasy report.
3. Verify whether the public JSON date-only change is expected and whether generated docs are deterministic.
4. If clean, commit as a narrow fantasy-value-board update.

### 2. Overnight / Ops Automation

Files currently dirty or untracked:

- `scripts/overnight.js`
- `docs/NFL_DASHBOARD_USER_GUIDE.md`
- `infra/systemd/nfl-overnight.service`
- `infra/systemd/nfl-overnight.timer`

Observed diff:

- `scripts/overnight.js` adds `research-intel`, live `training-camp-scout`, and `daily-brief` steps to the overnight sequence.

Fresh-session review steps:

1. Decide whether overnight automation is allowed to perform live RSS scouting by default.
2. Review whether `research-intel` and `daily-brief` should run every overnight cycle.
3. Check the user guide for Windows-safe `npm.cmd` examples and encoding artifacts.
4. Review the systemd service/timer assumptions before committing Linux ops files into repo truth.
5. If approved, commit as a separate ops automation update.

### 3. Training Camp Intel UI

Files currently dirty or untracked:

- `src/App.jsx`
- `src/components/layout/Header.jsx`
- `src/components/intel/TrainingCampIntel.jsx`

Observed diff:

- `App.jsx` adds a lazy-loaded `training-camp` tab.
- `Header.jsx` adds a `Camp Intel` navigation tab.
- `TrainingCampIntel.jsx` is a new 32-team camp intel UI, but currently contains visible mojibake/encoding artifacts in comments and display labels.

Fresh-session review steps:

1. Clean encoding artifacts in `TrainingCampIntel.jsx`.
2. Validate responsive layout and text fit in the dashboard.
3. Confirm the tab should be called `Camp Intel` and whether it should coexist with the new player-availability and secondary-matchup reports.
4. Run app build/tests or a focused browser smoke check.
5. If clean, commit as a separate UI update.

### 4. Old Retry Artifacts

Untracked retry artifacts remain in:

- `.nfl/readiness/`
- `.nfl/source-audit/`

Fresh-session review steps:

1. Keep the latest committed source-audit/readiness artifacts as the durable reference.
2. Decide whether older untracked retry artifacts are useful crash evidence.
3. If not needed, clean them deliberately after confirming filenames.

---

## Outstanding Pipeline/Data Tasks

These remain after the pushed injury and secondary-matchup proof of concept:

1. Fill manual secondary-matchup seed files for all 32 teams.
2. Add source URLs, source dates, and confidence notes for scheme, secondary role, and receiver role rows.
3. Tighten player-availability parsing for false positives where active/participation wording is mixed with historical injury words.
4. Decide when to wire `data/secondary-matchups/latest.json` into the portfolio dossier and in-season player-prop workflow.
5. Consider a dashboard report tab for player availability and secondary matchup vulnerability after data coverage improves.
6. Seek explicit approval before any paid/frontier-model synthesis run.

---

## Suggested Fresh Session Order

1. Start from synced `main` at `c4f52df`.
2. Run `git status --short --branch` and confirm only the known dirty files remain.
3. Review and either commit or clean the fantasy value board workstream.
4. Review and either commit or defer the overnight/ops automation workstream.
5. Review and either commit or defer the Training Camp Intel UI workstream.
6. Clean stale retry artifacts only after confirming they are not needed.
7. Return to data completion for secondary matchups and parser quality.

---

## Resume Prompt

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard. Start by reading handoffs\2026-07-30-post-pipeline-push-task-plan.md, then run git status --short --branch. The committed injury/player-availability/OL-DL/secondary-matchup pipeline work has already been pushed to origin/main through c4f52df. Do not recommit that work. The remaining dirty files should be reviewed as separate workstreams: fantasy value board, overnight/ops automation, Training Camp Intel UI, and old retry artifacts. Stage narrowly; do not use git add -A. Guardrails remain: no paid/frontier model calls, no Supabase writes, no official-pick approvals/proposals, no production recommendation persistence, and no open-parlay changes without explicit approval. Priority order: review fantasy workstream first, then ops automation, then Training Camp Intel UI, then stale retry artifacts, then resume secondary-matchup seed completion and parser-quality tasks.
```
