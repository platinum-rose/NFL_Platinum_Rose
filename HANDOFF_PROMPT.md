Resume in E:\dev\projects\NFL_Dashboard.

First run:
- `git status --short --branch`
- `git log -n 10 --oneline --decorate`
- `git branch -vv`

Read first:
- `handoffs/2026-08-18-1555-yahoo-and-handoff-sync.md`
- `HANDOFF.md`
- `TASK_BOARD.md`
- `WORKING-CONTEXT.md`

Current verified checkpoint as of the 2026-08-18 Codex handoff sync:
- Local `main` HEAD is `2b17c75`.
- `origin/main` is `d76d309`.
- Local `main` is ahead of `origin/main` by 2 commits: `655e713` and `2b17c75`.
- Correction: the older rolling handoff text that said `origin/main` was at `655e713` was stale. Andy pushed through `d76d309`; the `.gitignore` cleanup and rolling-doc consolidation commits were not observed on remote.

Current dirty/untracked boundaries to preserve:
- `agents/portfolio-dossier.js`
- `scripts/build-prediction-market-map.js`
- `scripts/lib/futures-evidence-gates.js`
- `tests/fixtures/prediction-market-evidence-cleanup-mini.json`
- `tests/unit/futuresEvidenceGates.test.js`
- `tests/unit/predictionMarketEvidenceCleanup.test.js`
- `scripts/bottom-12-analysis.js`
- `scripts/colts-bucs-comparison.js`

Known open lanes:
1. Yahoo Fantasy API is paused pending Yahoo-side access/provisioning. The repo OAuth flow updated `.nfl/yahoo/tokens.json`, but `agents/yahoo-league-settings.js` and `agents/yahoo-adp-ingest.js --dry-run` still returned Yahoo 401 `oauth_problem="additional_authorization_required"`. Screenshot review showed no visible Fantasy Sports Read permission checkbox in the Yahoo Developer app. Rotate the exposed Yahoo client secret before continuing.
2. Kalshi/Polymarket normalization exists as uncommitted Codex work in the six modified futures files. It adds normalized price/liquidity/timing/settlement/fees/sportsbook-equivalence fields and gates missing normalized prediction-market data. Re-run focused deterministic checks before staging or committing.
3. UI modernization remains WIP from pushed commit `70049b8`; run a native `npm run build` before relying on the frontend sweep.
4. `655e713` and `2b17c75` are local-only; ask Andy before pushing.

Guardrails:
- No `git clean`, destructive reset/checkout, blind revert, broad staging, `git add -A`, commit, push, Supabase writes, betting, official picks, portfolio/parlay mutation, recommendation persistence, paid model/API calls, fresh synthesis, or external service runs without Andy's explicit approval.
- Treat evidence gate PASS as evidence readiness only, never betting readiness.
- Preserve all dirty/untracked work until ownership is clear.
