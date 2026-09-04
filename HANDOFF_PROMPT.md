# Resume Prompt - NFL_Dashboard fresh dev session

Resume in `E:\dev\projects\NFL_Dashboard`.

Start by reconciling live state, not memory alone.

Read first:

- `HANDOFF.md`
- `handoffs/2026-09-04-fresh-nfl-dev-and-writers-room-ingest-handoff.md`
- `WORKING-CONTEXT.md`
- `.atlas-bridge\memory.json`
- `.nfl\session-log.jsonl` if present
- `handoffs\2026-09-03-portfolio-integrity-fixes-handoff.md`
- `handoffs\2026-09-03-final-roster-reconciliation-handoff.md`

Then run:

- `git status --short --branch`
- `git log -n 8 --oneline --decorate`
- `git branch -vv`

Current verified context from the prior Codex session:

- Branch: `main`
- HEAD: `65d47e3 fix(futures): repair data-correctness, prompt-assembly, and fail-loud gaps in the portfolio pipeline`
- Remote: `origin/main` at `2c9334a feat(futures): add scale-in entry pattern to Risk/Editor stage`
- Alignment: local `main` is ahead of `origin/main` by 1 commit.
- Worktree is heavily dirty and must be preserved.
- Antigravity already ingested 2026 final roster snapshots for Honey Badgers and Rose Bowl:
  - `data/fantasy/honey_badgers_final_rosters_2026.csv`
  - `data/fantasy/rose_bowl_final_rosters_2026.csv`
- Do not assume `nfl_dashboard_final_roster_compilation.md` exists; exact search did not find it in the prior session.
- NFL comedy voice sample was ingested into `docs/writers-room/nfl-comedy-voice/` from `E:\dev\projects\Writers_Room\docs\Fw_ this just in.eml`.
- NFL_Dashboard still lacks Writers Room adoption in `.atlas-bridge\manifest.json`; do not assume narrative tooling can run here until adoption/config is explicitly approved.

Suggested next action:

Inspect the local-ahead commit `65d47e3` and scoped diffs for portfolio/futures files before editing. Then choose one explicit lane with Andy:

- verify/stabilize the portfolio-pipeline fixes represented by `65d47e3`
- continue article-evidence / Bookmaker-BetUS capture integrity work
- implement NFL Writers Room adoption as a separate lane

Guardrails:

- Preserve the dirty worktree.
- No cleanup, reset, stash, broad staging, commit, or push without explicit approval.
- No `agents/portfolio-synthesize.js` paid-model/API run without explicit approval.
- No Supabase writes without explicit per-write approval.
- No betting picks, official picks, portfolios, parlays, or proposal-slot mutation without explicit approval.
- No Yahoo Fantasy work unless explicitly directed.
