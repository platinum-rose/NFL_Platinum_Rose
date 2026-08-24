# NFL_Dashboard Handoff - 2026-08-18 17:46 PT

## Current Verified State

- Workspace: `E:\dev\projects\NFL_Dashboard`.
- Branch: `main`.
- Local HEAD: `4e751c5 feat(futures): normalize prediction-market contract fields`.
- Remote tracking state at handoff time: `main...origin/main [ahead 1]`.
- `origin/main`: `ccecef6 docs: add 2026-08-18 Yahoo handoff sync`.
- Local-only commit to push later if approved:
  - `4e751c5` - Kalshi/Polymarket prediction-market contract normalization.

## Completed This Session

### Kalshi / Polymarket Normalization

Committed as `4e751c5 feat(futures): normalize prediction-market contract fields`.

Included files:

- `agents/portfolio-dossier.js`
- `scripts/build-prediction-market-map.js`
- `scripts/lib/futures-evidence-gates.js`
- `tests/fixtures/prediction-market-evidence-cleanup-mini.json`
- `tests/unit/futuresEvidenceGates.test.js`
- `tests/unit/predictionMarketEvidenceCleanup.test.js`

Implementation notes:

- Adds `prediction_market_contract_normalization_v1` envelope per contract with normalized price, liquidity, fee, timing, settlement, and sportsbook-equivalence fields.
- Adds futures evidence gate blocker when prediction-market rows lack normalized fields.
- Keeps prediction markets context/coherence only; execution eligibility remains blocked.
- Semantic review adjustment: generic `description` no longer counts as settlement terms. Only explicit settlement/rules/resolution fields count, so weak local snapshots do not look more verified than they are.
- Corrected a stale portfolio-dossier comment around named-status fail-hard behavior.

Verification run before commit:

- `node --check agents\portfolio-dossier.js`
- `node --check scripts\build-prediction-market-map.js`
- `node --check scripts\lib\futures-evidence-gates.js`
- `npx.cmd vitest run tests/unit/predictionMarketEvidenceCleanup.test.js tests/unit/futuresEvidenceGates.test.js` -> 10/10 passing.
- Targeted ESLint on changed Kalshi files -> clean.
- `git diff --check` on changed Kalshi files -> clean.
- `node scripts\build-prediction-market-map.js --dry-run` -> 596 mapped, 1397 unmapped, 255 actionable coherence, 0 execution eligible.

### Scratch Scripts Dropped

Deleted untracked scratch scripts per Andy's instruction:

- `scripts/bottom-12-analysis.js`
- `scripts/colts-bucs-comparison.js`

They were isolated-use console scripts and duplicated the already committed `scripts/calculate-win-total-probabilities.js` direction.

## Current Uncommitted Work

Risk-sizing implementation lane is verified but not committed.

Modified:

- `agents/manifests/betting.manifest.json`
- `agents/manifests/futures.manifest.json`
- `src/App.jsx`
- `src/components/agent/AgentChat.jsx`
- `src/components/agent/FuturesAgentChat.jsx`
- `src/components/layout/Header.jsx`
- `src/components/modals/UnitCalculatorModal.jsx`
- `src/lib/agentTools.js`
- `src/lib/bankroll.js`
- `tests/unit/agentTools.test.js`

Untracked:

- `docs/QUANT_RISK_SIZING_PLAYBOOK.md`
- `src/lib/riskSizing.js`
- `tests/unit/riskSizing.test.js`

Risk-sizing implementation summary:

- Adds code-owned EV, implied probability, volatility, Kelly, fractional Kelly, risk-of-ruin proxy, and geometric log-growth math.
- Adds `calculate_risk_sizing` tool for BETTING/FUTURES agents.
- Updates BETTING/FUTURES prompts to require code-owned sizing when model probability and odds are known.
- Upgrades the Unit Calculator modal with EV, market breakeven, model edge, signal/noise, quarter-Kelly/capped stake, and log-growth fields.
- Adds a visible desktop top-bar `Sizing` button; previously the Unit Calculator modal existed but was orphaned by the hub navigation.
- Adds durable doctrine note from the Orion / `0xOrionVega` X article: `docs/QUANT_RISK_SIZING_PLAYBOOK.md`.

Verification run for risk-sizing lane:

- `node --check src\lib\riskSizing.js`
- `npx.cmd vitest run tests/unit/riskSizing.test.js tests/unit/bankroll.test.js tests/unit/agentTools.test.js` -> 3 files passed, 120 tests passed.
- Targeted ESLint -> 0 errors; known pre-existing warnings in `App.jsx` / `Header.jsx` when included.
- `git diff --check` on risk-sizing files -> clean.
- `npm.cmd run build` -> successful. Known warnings only: old Browserslist data, `constants.js` static/dynamic import note, large chunk warning.

Manual smoke:

- Initial browser load hit `ERR_NETWORK_CHANGED`, but local dev server still returned HTTP 200.
- Hard refresh recovered the app.
- Unit Calculator was not visible because it had no active opener in the modernized desktop header.
- Added desktop top-bar `Sizing` button next to `Kalshi/Poly`; build and focused tests passed after the fix.

## Current Open Decisions

- Decide whether to commit the risk-sizing lane as a narrow commit.
- If committing, stage only the risk-sizing files listed above.
- Decide whether to push local `4e751c5` and any future risk-sizing commit to `origin/main`.
- Full UI bug-testing pass is deferred to a future session.

## Guardrails

- No `git clean`, destructive reset/checkout, blind revert, broad staging, `git add -A`, Supabase writes, betting, official picks, portfolio/parlay mutation, recommendation persistence, paid model/API calls, fresh synthesis, commit, or push without Andy's explicit approval.
- Treat evidence gate PASS as evidence readiness only, never betting readiness.
- Yahoo Fantasy API remains paused pending Yahoo-side access/provisioning and secret rotation.
- Risk-sizing output is proposal support only; it is not authorization to log, place, or persist a bet.

## Resume Prompt

```text
Resume in E:\dev\projects\NFL_Dashboard.

First run:
- git status --short --branch
- git log -n 8 --oneline --decorate
- git branch -vv

Read first:
- handoffs/2026-08-18-1746-risk-sizing-and-kalshi-normalization-handoff.md
- handoffs/2026-08-18-1555-yahoo-and-handoff-sync.md
- HANDOFF.md
- TASK_BOARD.md
- WORKING-CONTEXT.md

Current verified checkpoint:
- Local main HEAD is 4e751c5.
- origin/main is ccecef6.
- main is ahead of origin/main by 1 local commit: 4e751c5 feat(futures): normalize prediction-market contract fields.
- Kalshi/Polymarket normalization is committed locally and verified, but not pushed.
- Risk-sizing implementation is verified but uncommitted.

Preserve uncommitted risk-sizing files:
- agents/manifests/betting.manifest.json
- agents/manifests/futures.manifest.json
- src/App.jsx
- src/components/agent/AgentChat.jsx
- src/components/agent/FuturesAgentChat.jsx
- src/components/layout/Header.jsx
- src/components/modals/UnitCalculatorModal.jsx
- src/lib/agentTools.js
- src/lib/bankroll.js
- tests/unit/agentTools.test.js
- docs/QUANT_RISK_SIZING_PLAYBOOK.md
- src/lib/riskSizing.js
- tests/unit/riskSizing.test.js

Risk-sizing verification already run:
- node --check src\lib\riskSizing.js
- npx.cmd vitest run tests/unit/riskSizing.test.js tests/unit/bankroll.test.js tests/unit/agentTools.test.js -> 120/120 passing
- targeted ESLint -> no errors
- git diff --check -> clean
- npm.cmd run build -> successful with known warnings only

Next recommended NFL action:
- If Andy approves, make a narrow risk-sizing commit using only the listed risk-sizing files.
- Push decisions are separate: do not push 4e751c5 or any future risk-sizing commit without Andy's explicit approval.

Guardrails:
- No git clean, destructive reset/checkout, blind revert, broad staging, git add -A, Supabase writes, betting, official picks, portfolio/parlay mutation, recommendation persistence, paid model/API calls, fresh synthesis, commit, or push without Andy's explicit approval.
- Evidence PASS is evidence readiness only, not betting readiness.
```
