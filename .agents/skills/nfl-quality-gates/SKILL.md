---
name: nfl-quality-gates
description: Quality gate instructions and pre-commit checks required before finalizing tasks.
---

# NFL Quality Gates

**When to Activate:** Read this skill before committing any changes or closing a task to ensure quality standards and project requirements are met.

## Self-Enforced Quality Gates

Before marking any task complete or committing to Git, ensure the following checks pass. These serve as self-enforced pre-commit hooks.

### 1. Code Quality & Linting
- **No `console.log`**: Detect and remove `console.log` statements left in changed files.
- **ESLint**: Run `npx eslint` on staged JS/JSX files. There must be 0 warnings/errors.
- **Format**: Run `npx eslint --fix` on changed files when dev session ends.

### 2. Build & Tests
- **Test Gate**: Run `npm test -- --run`. All tests must pass. Do not commit failing tests.
- **Build Check**: Run `npm run build` to verify the production build succeeds after `src/` changes. Fix any errors before committing.

### 3. File & Scope Protection
- **Protect Hot Files**: If `src/App.jsx`, `src/lib/storage.js`, `src/lib/picksDatabase.js`, or `AGENT_LOCK.json` are modified, verify that a PM lock exists in `AGENT_LOCK.json` before committing.
- **Scope Match**: Check `git diff --stat` to ensure staged files match the PM-delegated scope.

### 4. Data Schema Integrity
- **Protect localStorage Keys**: Detect changes to canonical localStorage key strings (e.g., `pr_picks_v1`, `nfl_bankroll_data_v1`, `nfl_futures_portfolio_v1`, `nfl_expert_consensus`, `nfl_splits`, `nfl_my_bets`) in `src/lib/storage.js`, `picksDatabase.js`, `bankroll.js`, or `futures.js`.
- **Migration Helper REQUIRED**: If any localStorage key name is changed, a migration helper MUST be written and committed alongside it.

## Verification Gate Reminder
A task is **not done** until it is proven to work. Check the console, verify UI behavior, and confirm `localStorage` state before considering a fix or feature complete. For grading/scoring changes, manually verify at least one bet grades correctly end-to-end.
