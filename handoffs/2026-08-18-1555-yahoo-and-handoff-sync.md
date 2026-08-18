# NFL_Dashboard Handoff - 2026-08-18 15:55 PT

## Current Verified State

- Workspace: `E:\dev\projects\NFL_Dashboard`.
- Branch: `main`.
- Local HEAD: `2b17c75 docs: consolidate rolling handoff docs for the 2026-08-16/17 sync pass`.
- Remote tracking state at handoff time: `main...origin/main [ahead 2]`.
- `origin/main` is still `d76d309 docs: commit 2026-08-13 futures incident-review record + reacquisition evidence`.
- Correction to the prior rolling handoff: `655e713` and `2b17c75` are local-only as of this sync. The user pushed `70049b8`, `eb23751`, `086d2ee`, and `d76d309`; the later `.gitignore` and rolling-doc consolidation commits were not observed on `origin/main`.

## Recent Commits

Already pushed by Andy:

1. `70049b8` - WIP frontend UI/UX Command Hub sweep, including the real `AgentChat.jsx` conditional-hook fix.
2. `eb23751` - backend/player-availability fixes: FantasyPros injuries default-enabled, regex lint fix, win-total probability script.
3. `086d2ee` - refreshed local data snapshots, Gmail alert summaries, and staged/not-approved pick proposal artifacts.
4. `d76d309` - futures incident-review record, timestamped handoffs, Yahoo API agreement PDF, and reacquisition evidence placeholder.

Local-only after the push:

1. `655e713` - `.gitignore` cleanup for `dist-verify-*/` and undeletable `_TEST_*` reacquisition fixtures.
2. `2b17c75` - rolling handoff/doc consolidation for the 2026-08-16/17 sync pass.

Do not push, amend, or rewrite these local commits without Andy's explicit approval.

## Current Dirty / Untracked Boundaries

Observed `git status --short --branch`:

```text
## main...origin/main [ahead 2]
 M agents/portfolio-dossier.js
 M scripts/build-prediction-market-map.js
 M scripts/lib/futures-evidence-gates.js
 M tests/fixtures/prediction-market-evidence-cleanup-mini.json
 M tests/unit/futuresEvidenceGates.test.js
 M tests/unit/predictionMarketEvidenceCleanup.test.js
?? scripts/bottom-12-analysis.js
?? scripts/colts-bucs-comparison.js
```

The six modified futures/prediction-market files are Codex's in-session normalization work and should be preserved for a narrow review/commit later. The two untracked analysis scripts are not part of this handoff sync; preserve them and identify ownership before staging.

## Codex Session Work To Merge Into Context

Kalshi/Polymarket normalization was picked up but not committed:

- `scripts/build-prediction-market-map.js` now emits a `prediction_market_contract_normalization_v1` shape with normalized price, liquidity/fillability, timing/expiration, settlement, fees, and sportsbook-equivalence fields.
- `scripts/lib/futures-evidence-gates.js` now treats missing normalized prediction-market fields as blockers for prediction-market rows.
- `tests/fixtures/prediction-market-evidence-cleanup-mini.json`, `tests/unit/predictionMarketEvidenceCleanup.test.js`, and `tests/unit/futuresEvidenceGates.test.js` were updated to cover the normalized contract schema.
- `agents/portfolio-dossier.js` has a stale named-status comment corrected so it no longer says missing review "fails open"; behavior is fail-hard unless explicitly overridden.

Verification previously run on this uncommitted work:

- `node --check` on changed JavaScript files.
- Focused Vitest: 3 files / 22 tests passing.
- Targeted ESLint on the changed files.
- Dry-run prediction-market mapper.
- `git diff --check` on the modified files.

Re-run the focused checks before committing, because rolling docs changed after those checks.

## Yahoo Fantasy API Status

Yahoo work is paused pending Yahoo's developer/access update.

What happened:

- The existing repo integration points are `docs/YAHOO_INTEGRATION_SETUP.md`, `scripts/yahoo-auth.js`, `agents/lib/yahoo.js`, `agents/yahoo-league-settings.js`, and `agents/yahoo-adp-ingest.js`.
- Andy first ran scripts from `C:\Users\andre`, which failed with module-not-found because the repo root was not the working directory.
- Running from `E:\dev\projects\NFL_Dashboard` started the OAuth flow correctly.
- Andy pasted the redirected URL; `.nfl/yahoo/tokens.json` was updated.
- API calls still returned Yahoo 401 `oauth_problem="additional_authorization_required"` for both:
  - `node agents/yahoo-league-settings.js`
  - `node agents/yahoo-adp-ingest.js --dry-run`
- Screenshot reviewed: `C:\Users\andre\OneDrive\Desktop\forATLAS.PNG` showed the Yahoo Developer app page with the app/client details and `https://localhost` redirect URI, but no visible Fantasy Sports permission checkbox or Read scope under API Permissions.

Current conclusion: this is Yahoo-side Fantasy Sports API access/provisioning, not a missing local code step. Wait for Yahoo to update access or expose the Fantasy Sports permission option.

When Yahoo responds:

1. Rotate the Yahoo client secret because it was pasted into chat.
2. Update the local `.env` with the new secret.
3. Delete or move aside `.nfl/yahoo/tokens.json` so the next auth run cannot reuse a stale grant.
4. Run `node scripts/yahoo-auth.js` from `E:\dev\projects\NFL_Dashboard`.
5. Run `node agents/yahoo-league-settings.js`.
6. Run `node agents/yahoo-adp-ingest.js --dry-run`.
7. Do not write fantasy data or Supabase data without Andy's explicit approval.

## Open Work

- Push decision: local `655e713` and `2b17c75` remain ahead of `origin/main`; ask Andy before pushing.
- Kalshi/Polymarket normalization: review and commit the six modified futures files only if Andy approves staging/commit.
- Yahoo Fantasy: blocked on Yahoo developer/access provisioning; no more useful local API work until access changes.
- UI modernization: `70049b8` is WIP and pushed, but the full native build still needs to be run before relying on it.
- Futures reacquisition/Supabase promotion: still requires separate approval; no Supabase writes.
- McGovern/Parsons factual named-player cases remain unresolved before dependent sizing claims.

## Guardrails

- No `git clean`, destructive reset/checkout, blind revert, broad staging, `git add -A`, commit, push, Supabase writes, betting, official picks, portfolio/parlay mutation, recommendation persistence, paid model/API calls, fresh synthesis, or external-service runs without Andy's explicit approval.
- Treat evidence gate PASS as evidence readiness only, never betting readiness.
- Preserve all dirty and untracked work unless ownership is confirmed and Andy approves the action.

## Resume Prompt

```text
Resume in E:\dev\projects\NFL_Dashboard.

First run:
- git status --short --branch
- git log -n 10 --oneline --decorate
- git branch -vv

Read first:
- handoffs/2026-08-18-1555-yahoo-and-handoff-sync.md
- HANDOFF.md
- HANDOFF_PROMPT.md
- TASK_BOARD.md
- WORKING-CONTEXT.md

Current verified checkpoint as of the 2026-08-18 Codex handoff sync:
- Local HEAD is 2b17c75 on main.
- origin/main is d76d309.
- main is ahead of origin/main by 2 local commits: 655e713 and 2b17c75.
- The previous rolling handoff text that said origin/main was at 655e713 was corrected; verify Git again before relying on any prose.

Dirty boundaries to preserve:
- agents/portfolio-dossier.js
- scripts/build-prediction-market-map.js
- scripts/lib/futures-evidence-gates.js
- tests/fixtures/prediction-market-evidence-cleanup-mini.json
- tests/unit/futuresEvidenceGates.test.js
- tests/unit/predictionMarketEvidenceCleanup.test.js
- scripts/bottom-12-analysis.js
- scripts/colts-bucs-comparison.js

Known state:
- Yahoo Fantasy API is paused pending Yahoo access/provisioning. Auth token was refreshed, but API calls still returned oauth_problem="additional_authorization_required"; screenshot showed no Fantasy Sports Read permission option visible in Yahoo Developer. Rotate the exposed secret before continuing.
- Kalshi/Polymarket normalization exists as uncommitted Codex work in the six modified futures files. Re-run focused deterministic checks before committing.
- UI modernization is WIP in pushed commit 70049b8; run a native npm build before relying on it.
- Do not write to Supabase, place/approve picks, mutate portfolio/parlays, run paid model/API calls, or push/commit without Andy's explicit approval.
```
