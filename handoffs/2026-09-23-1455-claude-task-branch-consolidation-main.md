# Task: consolidate wip/yahoo-sync into main, make main the working branch, retire wip

**Created:** 2026-09-23 14:55 PT by Claude (at Andy's request) · **Status:** not started — run in a fresh session; Codex may assist
**TASK_BOARD id:** BRANCH-CONSOLIDATE-MAIN (P1)

## Goal
`main` becomes the single current branch (local checkout + origin). `wip/yahoo-sync` is retired (kept as an archive tag, then deleted remotely once Andy confirms).

## Why
- GitHub cron workflows run on the default branch (`main`), and `deploy.yml` / `ci.yml` / `smoke-test.yml` key off `main`. Fixes committed only to wip never reach automation (proven 2026-09-23: old pick-extraction on main inserted 347 bad picks).
- `agents/pick-extraction.js` fetches `schedule.json` from GitHub raw `main`.
- The branches diverged both ways.

## Snapshot at task creation (re-verify live — live git wins)
- merge-base: `215f1a3` (Week 2 prop boards/BKR lines).
- wip ahead of main: **46** commits (incl. this session's 32a981e/881d28a if pushed). main ahead of wip: **22** commits:
  - 7 cherry-picks from wip made 2026-09-23 (pick-extraction week scope/teasers/dedupe/team codes; intel revisions; CFB filter; revisions opt-in) — same content as wip commits 229042d, d438484, de8145e, 75e85a5, 1e35dda, 40d2eb1, 6020262. Expect clean resolution / duplicate patches.
  - 15 main-only commits (not on wip): 7b350eb live-tracker leg toggles/Push; 2edda4d fantasy voice guide; a7fa5ba live-tracker current-week default + Out/Inactive flag; c4b6126 wager-entry CLI; 6195892 survivor/waiver/SuperContest CLV tooling; c085cc4 committee + scoped dossier + provenance (Rev 20); 7623711 toolbox double-tab launcher / stale SC week / Windows exit / waiver tools; 48d05d0 article-intel bet-tier classification; 7aa3ba3 portfolio preflight + committee/scope sync; 71a4315 in-season CI schedules + npm scripts + acorn; 4f298b7 scheduled-task hiding utility; 8063e0c session log; 32fadd7 lessons-learned/specs/audits docs; b14e2b0 futures pipeline spec; 41bbfcd auto schedule update.
- Diff size main..wip: ~198 files / ~1.1M lines, mostly data/docs; **code-only ~85 files**.
- **Files changed on both sides since the merge-base (31)** — the conflict list to review by hand (non-data): HANDOFF.md, TASK_BOARD.md, agents/dev/WEEKLY_BETTING_ANALYST_PROMPT.md, agents/pick-extraction.js, agents/research-intel-ingest.js, agents/lib/{pick-normalize,pick-week-scope,intel-revisions,college-football-filter}.js, scripts/toolbox-app-server.mjs, scripts/generate-live-tracker.mjs, scripts/add-placed-wager.mjs, scripts/windows/** (hidden-tasks *.cmd, hide-nfl-task-windows.ps1, run-hidden.vbs), src/components/modals/ManualGradeModal.jsx, src/components/picks-tracker/PicksTracker.jsx, src/lib/picksDatabase.js, tests/unit/{addPlacedWager,collegeFootballFilter,intelRevisions,pickNormalize,pickWeekScope}.test.js.
- **Dirty local checkout: ~1,157 porcelain entries (~221 tracked modifications)**, including uncommitted workflow edits (`.github/workflows/injury-ingest.yml`, `odds-ingest.yml`, `research-intel-ingest.yml`), `scripts/toolbox-app-server.mjs` (likely a local copy of main's 7623711), agents/portfolio-*.js, lots of data/. These are NOT on either branch.

## Plan (proposal — Andy approves each push)
1. **Inventory (read-only).** In a separate worktree (never touch the dirty checkout): list both-sides files, classify each of the 22 main-only commits and 46 wip-only commits as code / data / docs. Classify the ~221 uncommitted tracked modifications: already on main? already on wip? genuinely new? stale/regenerable data?
2. **Merge** `origin/main` into a new branch off `wip/yahoo-sync` (`consolidate/main-2026-09`) in the worktree. Resolve the both-sides files by hand; for generated data prefer the newer artifact or regenerate. Run `npx vitest run` (full), eslint on touched code, `npm run build`, and node --check on agents/scripts.
3. **Review gates with Andy before any push:** (a) every `.github/workflows/*` diff (cron cadence, ref, secrets) — these go live immediately; (b) `public/` + deploy impact; (c) anything touching Supabase schemas/migrations.
4. **Promote:** Andy pushes `consolidate/main-2026-09` → `main` (fast-forward). Tag old wip head `archive/wip-yahoo-sync-2026-09-23` and push the tag.
5. **Switch the local checkout to main without losing dirty work:** do NOT reset/clean/stash. Options: `git switch main` only after confirming every dirty tracked file either (i) matches main already, (ii) is committed to main in step 2, or (iii) is intentionally carried over (git switch carries uncommitted changes when no conflict). Resolve file by file; untracked files are unaffected.
6. **Retire wip:** update CLAUDE.md / AGENTS.md / HANDOFF.md / HANDOFF_PROMPT.md / WORKING-CONTEXT.md and the weekly synthesis prompt so every agent commits to `main`; update any script or scheduled task that references wip. Delete `origin/wip/yahoo-sync` only after Andy confirms a full week of automation runs clean on main.
7. **Post-checks:** next scheduled GitHub runs (podcast ingest → pick extraction, research-intel, injuries, odds) succeed on main; deploy succeeds; local Windows scheduled tasks still run from the checkout.

## Codex split (suggested)
- **Codex:** step 1 inventory + step 2 mechanical merge and test runs in its own worktree; writes a conflict/resolution report in `handoffs/`.
- **Claude session:** review the report with Andy, handle workflow/public review gates (step 3), docs/governance retirement (step 6).

## Guardrails
No `git add -A`; stage narrow, reviewed sets. Never reset/clean/stash the dirty checkout. Pushes are Andy's (this environment has no GitHub credentials). Supabase writes need per-change OK. Stale `.git/index.lock`: confirm no git process, delete permission on E:\dev, rm, retry.

## Fresh-session activation prompt
```
Branch consolidation for NFL_Dashboard (task BRANCH-CONSOLIDATE-MAIN). Repo E:\dev\projects\NFL_Dashboard
(device_bash: $HOME/mnt/dev/projects/NFL_Dashboard). Read HANDOFF.md, then
handoffs/2026-09-23-1455-claude-task-branch-consolidation-main.md, and follow its plan.
Work only in a separate git worktree; do not touch the dirty checkout. Start with step 1 (read-only inventory)
and report before merging. Goal: main is the single current branch; wip/yahoo-sync retired.
```
