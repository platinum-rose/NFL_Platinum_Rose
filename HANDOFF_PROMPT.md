# HANDOFF_PROMPT.md - NFL Platinum Rose

> Rolling session handoff. Read this first in a fresh session, then read `WORKING-CONTEXT.md` and the audit named below.

## Persistent Backlogs

> Read the source file and mark items there, not in this handoff.

| Backlog | File | Open Items | Last Touched |
|---|---|---:|---|
| NFL Dashboard Audit Findings | `docs/NFL_AUDIT_BACKLOG.md` | 1 (`GAMEID-FORMAT`, unrelated/non-blocking) | 2026-07-21 |

## Last Session Summary

- Date: 2026-07-22
- Branch: `main`
- HEAD: `4cbd3be` (`docs: add Codex handoff for the hedge-basket/parlay-ladder reconciliation thread`)
- Working tree: intentionally dirty with the futures audit, offline corpus, portfolio-builder changes, and handoff files
- Verification: portfolio corpus 5/5 passed; futures dossier conformance passed; podcast host-summary unit test passed; changed Node entry points pass `node --check`
- Live API calls: none in this audit/benchmark-handoff work
- Supabase writes: none
- Open parlay changes: none

## Current Objective

Determine whether the futures analyst can generate recommendations intelligent enough to justify risking money. The system has now been audited as a whole: ingestion, dossier, prompts/committee, deterministic validation, portfolio construction, scenario-book hedging, personalization, live chat, and evaluation strategy.

Canonical audit:

- `docs/FUTURES_ANALYST_SYSTEM_INTELLIGENCE_AUDIT_2026-07-22.md`

Supporting portfolio/corpus handoff:

- `handoffs/2026-07-22-futures-portfolio-analyst-handoff.md`

Latest timestamped handoff:

- `handoffs/2026-07-22-1635.md`

## Audit Verdict

The system is a promising research and candidate-discovery workflow. It is not yet a risk-worthy forecasting system.

The strongest current pieces are deterministic quote validation, exacta resolution, the five-case offline plumbing corpus, preservation of committee stages, and the scenario-book vocabulary. The main blockers are malformed market schemas, incomplete devig/edge transmission, no independent probability model, unenforced freshness, weak committee independence, forced-action ranking, no joint payoff model, and incomplete personalization wiring.

## Required Build Order

### P0 - Before another live recommendation run

1. Canonicalize wins/playoffs rows and add dossier conformance tests.
2. Forward all computed fair/edge fields into synthesis.
3. Correct playoff/exact-position devig and validate exact line/book/price identity.
4. Enforce quote timestamps and maximum age.
5. Remove forced recommendation counts and reject negative-EV standalone bets.
6. Validate prices and scenario legs before the final Risk Editor pass.
7. Load Andy's real ledger into batch synthesis and repair live-chat position/bankroll context.
8. Preserve open parlays as unverified contingent assets, never guaranteed capacity.

### P1 - Forecasting and portfolio intelligence

Build the matched-line win distribution, schedule simulation, uncertainty intervals, deterministic correlation graph, joint terminal-payoff tables, exacta-role taxonomy, evidence-value packets, numeric thresholds, and strict versioned schemas.

### P2 - Evaluation infrastructure

Build shadow mode, CLV capture, calibration scoring, repeated-run stability, committee ablations, abstention scoring, portfolio-distribution scoring, and the frozen benchmark harness/report format.

### Post-P0-P2 promotion benchmark

Run the audit's full benchmark only after all three phases are implemented. It requires held-out contract, forecast, semantic, portfolio, adversarial, and personalization suites; deterministic/current/frontier comparison arms; five-run stability controls; blind semantic grading; confidence intervals; and explicit hard/statistical gates.

The target command documented in the audit is an interface to build, not a command that exists today:

```powershell
npm.cmd run benchmark:futures -- --suite full --repeats 5 --no-persist
```

Passing `npm.cmd run test:portfolio-corpus` proves portfolio plumbing. It does not prove forecasting skill, profitability, calibration, CLV, or recommendation trustworthiness.

## Andy's Known Personalization

- Futures unit: `$20`
- In-season unit: `$10`
- Bills vs Packers exacta: `$100` at `+6500`
- Bills Super Bowl target cap: about `$200`
- Packers Super Bowl target cap: about `$200`
- Primary planned exposure cap: about `$500`
- Bills and Packers are anchors; their exacta is a cross-anchor amplifier, not a hedge
- Six open parlays exist with 11 open slots and `$162.50` sunk stake, but all are beyond 90 days and their availability is unresolved

Do not fill, close, modify, or rely on an open parlay unless Andy explicitly directs it after resolving the house rule.

## Critical Evidence From The Audit

- Wins and playoffs each contain 96 dossier rows: 32 canonical teams plus 64 side-labeled pseudo-team rows.
- `buildOddsView()` computes win-total fair/edge fields, but `buildSynthesisInput()` omits them.
- Giants Over 7.5 changes from a reported positive edge to a negative same-line fair edge after devigging.
- Bears Over 9.5 and Saints playoffs also have materially overstated reported edges after correct pairing/devig.
- Proposed independent-model files do not exist in production.
- The dossier does not expose quote timestamps to the model or enforce final availability.
- Stage 2 and Stage 3 default to the same model, and current merge logic can reward confidence.
- The live chat reads futures fields that do not match `src/lib/futures.js` and does not load the advertised bankroll/open-parlay context.

## Safe Commands

```powershell
npm.cmd run test:portfolio-corpus
node --check agents\portfolio-synthesize.js
node --check scripts\run-portfolio-corpus.js
```

Do not run a live LLM analyst command, write to Supabase, overwrite canonical reports, or modify open parlay records without explicit approval.

## Modified And Added Files

Current workstream:

- `agents/portfolio-synthesize.js` - scenario-book/role output, strict exacta resolution, raw-coverage quarantine, report isolation
- `agents/podcast-host-summary.js` - upstream `source_timestamp` request and timestamp-aware vault-note output for future host-summary runs
- `package.json` - offline corpus script
- `scripts/build-podcast-narratives.js` - offline per-episode podcast narrative summaries from local host-summary vault notes
- `scripts/run-portfolio-corpus.js` - local model-stub corpus runner
- `tests/fixtures/portfolio-corpus/` - five curated scenarios
- `docs/podcast-narratives/` - generated offline episode-level NFL podcast narrative summaries
- `docs/FUTURES_ANALYST_SYSTEM_INTELLIGENCE_AUDIT_2026-07-22.md` - full audit and post-build benchmark protocol
- `handoffs/2026-07-22-futures-portfolio-analyst-handoff.md` - portfolio/corpus context
- `handoffs/2026-07-22-1010.md` - current timestamped handoff
- `handoffs/2026-07-22-1635.md` - report UX and podcast-source attribution handoff
- `HANDOFF_PROMPT.md` and `WORKING-CONTEXT.md` - refreshed session state

Leave these pre-existing untracked scratch files alone:

- `agents/_verify_ev_tmp.mjs`
- `agents/_verify_synth_tmp.mjs`
- `agents/_verify_tmp.mjs`
- `agents/_verify_val_tmp.mjs`

## Immediate Next Steps

1. Read `handoffs/2026-07-22-1635.md` for the latest report UX and podcast-source state.
2. Inspect the new HTML UX: one card per team section, lower sections collapsed, no repeated ranking-card drops.
3. Consider adding a report table of contents and source-quality badges.
4. Plan podcast timestamp backfill before rerunning host-summary extraction; existing summaries do not yet contain timestamps.
5. Continue P0-P2 audit work only after preserving the current offline UX/podcast improvements.

## Resume Command

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard. HEAD = 4cbd3be (main) with uncommitted futures-audit and portfolio-corpus work. Suite: portfolio corpus 5/5 plus both Node syntax checks passing. Read HANDOFF_PROMPT.md, then docs/FUTURES_ANALYST_SYSTEM_INTELLIGENCE_AUDIT_2026-07-22.md; implement the P0-P2 build order beginning with P0, then run the audit's post-P0-P2 benchmark protocol. Do not make a live API call, persist a report, or modify open parlay slots without explicit approval.
```
