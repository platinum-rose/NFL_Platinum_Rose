# Codex Fresh-Session Handoff — Frontier Futures Synthesis Implementation Review

Date: 2026-09-12 America/Los_Angeles  
Repository: `E:\dev\projects\NFL_Dashboard`  
Role: Codex is the independent reviewer. Claude implements. Andy controls authorization.

## Resume objective

Perform a fresh, findings-first code review of Claude's latest uncommitted fixes for the frozen pre-kickoff, all-32-team, Wins/Playoffs-only Frontier Portfolio synthesis path. Review the live checkout rather than accepting this handoff or Claude's claims as proof. Flag defects; do not fix them unless Andy separately gives explicit scoped authorization.

This is a continuation of the review that most recently returned **CHANGES REQUESTED** on the first implementation pass. Claude has changed the implementation since that verdict. Those newer changes have **not** been reviewed by Codex yet.

## First reads, in order

1. `RULES.md`
2. This handoff.
3. `handoffs/2026-09-11-codex-query-dialect-fresh-session-handoff.md`
   - Use it for the original independent-review protocol and historical query-dialect context.
   - Its HEAD/current-state section is stale; live Git wins.
4. `handoffs/2026-09-11-1840-claude-frontier-synthesis-rev4-rejected-handoff.md`
5. Read these live implementation files in this order:
   1. `agents/lib/scope-enforcement.js`
   2. `agents/lib/scoped-prompts.js`
   3. `agents/lib/scoped-dossier.js`
   4. `agents/lib/committee.js`
   5. `agents/lib/persistence.js`
   6. `agents/lib/audit-artifact.js`
   7. `agents/lib/parse-json.js`
   8. the scoped diff for `agents/portfolio-synthesize.js`
6. Discover and read any new production tests Claude adds for these modules. At handoff creation, no new matching test files were visible under `tests/`; recheck live.

Do not start by reading broad generated output, scratch probes, or the entire dirty-tree diff. Establish the production scope above first.

## Mandatory live Git reconciliation

Run these read-only checks before assessing the new code:

```powershell
git -c safe.directory=E:/dev/projects/NFL_Dashboard rev-parse HEAD
git -c safe.directory=E:/dev/projects/NFL_Dashboard status --short --branch
git -c safe.directory=E:/dev/projects/NFL_Dashboard diff --cached --name-only
git -c safe.directory=E:/dev/projects/NFL_Dashboard log -10 --oneline
git -c safe.directory=E:/dev/projects/NFL_Dashboard status --short -- agents/portfolio-synthesize.js agents/lib/parse-json.js agents/lib/committee.js agents/lib/persistence.js agents/lib/audit-artifact.js agents/lib/scope-enforcement.js agents/lib/scoped-prompts.js agents/lib/scoped-dossier.js
git -c safe.directory=E:/dev/projects/NFL_Dashboard diff -- agents/portfolio-synthesize.js
rg --files tests | rg "portfolio|scope|committee|persistence|audit|scoped"
```

The worktree is extremely dirty and shared with concurrent NFL Dashboard work. Never broad-stage, clean, reset, restore, stash, delete, or rewrite unrelated files. Treat every unscoped change as user/concurrent-agent work.

## Live Git snapshot at handoff creation

- Branch: `main`
- HEAD: `8deab48e25a563758d693b481484e5ae179d2abe`
- Tracking: `main...origin/main [ahead 3]`
- Staged files: none
- Relevant modified tracked file:
  - `agents/portfolio-synthesize.js`
- Relevant untracked production files:
  - `agents/lib/audit-artifact.js`
  - `agents/lib/committee.js`
  - `agents/lib/parse-json.js`
  - `agents/lib/persistence.js`
  - `agents/lib/scope-enforcement.js`
  - `agents/lib/scoped-dossier.js`
  - `agents/lib/scoped-prompts.js`
- Relevant temporary/probe files also visible, but not production scope unless needed as evidence:
  - `.patch_synth2.py`
  - `.patch_synth3.py`
  - `_rev20_empty_watchlist.json`
  - `_rev20_prompt_preview.json`
  - `_rev20_verify_committee.mjs`
  - `_rev20_verify_scope.mjs`

The relevant files were edited after Codex's last review. Do not assume the findings below remain open or fixed; verify each against the live versions.

## Historical query-dialect correction

Do not reopen the stale Phase 3c closure issue as a current-HEAD blocker without new evidence:

- Historical commit `2e47611` alone is not self-contained.
- Commit `5ab2d9b` subsequently committed the required Phase 1-3b dependencies.
- Current HEAD `8deab48` descends from that repair, so current-HEAD clean-checkout dependency closure was previously verified.
- BettorDay Phase 4 / Site 5 was superseded by `8deab48`, which retired BettorDay. Do not resume that stale lane.

## Last Codex verdict to recheck against the new code

The first implementation pass received **CHANGES REQUESTED**. Its accepted pieces and findings are summarized below.

### Previously accepted implementation pieces

- Extracted helper modules appeared import-safe.
- Persistence checked `suppressed`, then `noPersist`, then credentials, before lazy client construction.
- The CLI routed the two persistence bridges through one `persistPortfolioRun()` call.
- `clampConfidence()` moved with `applySkepticVerdicts()` and rejected malformed deltas.
- Skeptic and Risk/Editor statuses were split; Risk failure retained Skeptic survivors.
- Intentional `--skip-committee` was no longer classified as a crash.
- Run identity was created before Stage 1.
- The all-Stage-1-failed artifact used a run-qualified path and atomic rename.
- The final assertion was positioned before ranking, proposal export, report writes, and persistence, although its coverage was inadequate.

Reverify all of these in the latest code; acceptance applied to the earlier file versions only.

### P1 group 1 — actual assembled prompts were still contaminated

The earlier implementation changed system-prompt selection but left the ordinary `buildUserPrompt()` active. It still supplied primary-position hedge language, open-parlay framing, other markets, matchup team pairs, adjacent Week-1 hedge signals, and an explicit instruction to build hedges/ladders/strategy. The Risk/Editor user prompt likewise still serialized and requested scenario structures.

Required review now:

- Inspect the fully assembled Stage-1 **system and user** prompts under suppression.
- Inspect the fully assembled Risk/Editor **system and user** prompts under suppression.
- Confirm they are positive Wins/Playoffs-only templates, not full prompts plus a negative deletion list.
- Confirm excluded fields and concepts are absent, including prediction-market, live-vault/master-report, primary-position, hedge, parlay, scenario-review, matchup, conference/division/Super Bowl, open-parlay, and Week-1-pairing lanes.
- Confirm the normal-mode assembled prompts remain unchanged.

### P1 group 2 — quarantine schema and scope enforcement were incomplete

The earlier `quarantineStage1()` validated only the outer object and array containers. Live in-memory probes showed that it silently dropped a null row, allowed an object-valued `type`, allowed `edge_type: "hedge"`, retained forbidden structures on watch rows, and retained top-level `scenario_review` / `correlated_week1`.

Required contract:

- Fail the whole model response on malformed Stage-1 schema/type shapes.
- Validate each recommendation and watch row as a plain object.
- Validate primitive field types and explicit allowed markets.
- Apply the hedge prohibition to both `type` and `edge_type`.
- Apply forbidden timing/key rules to watch rows as well as recommendations.
- Remove all approved top-level scenario keys.
- Return a new cleaned structure without mutating the parsed input.
- Preserve useful quarantine counts/reasons for audit review.

### P1 group 3 — final assertion coverage was too narrow

The earlier assertion accepted `edge_type: "hedge"`, `timing.action: "pair"`, and a present-but-null `correlated_week1` key. It traversed only `final` rather than the complete derived/report-facing state.

Required contract:

- Assert structurally and recursively over per-model recommendations/watch, nested `stage1_versions`, candidates, final, passed, killed, committee notes, watch-derived output, and the complete derived raw-output object.
- Exclude only the deliberately separate `audit_raw_unsanitized` container.
- Reject forbidden-key **presence** regardless of null/empty value.
- Report the path of the violation and throw before ranking, proposal export, report writes, or persistence.

### P1 group 4 — suppressed report/raw-output contract was missing

The earlier `.raw.json` still emitted top-level `raw`, `stage2_3`, `hedge_baskets`, `parlay_ladders`, and `portfolio_strategy` keys under suppression. HTML and Markdown still rendered Scenario Book, Parlay Ladders, and Hedge Baskets headings/blocks/TOC entries.

Required contract:

- Under suppression, untouched call results exist only in `audit_raw_unsanitized: { stage1, skeptic, risk_editor }`.
- No sibling `raw` / `stage2_3` keys under suppression.
- Scenario keys are omitted, not present with null/empty values.
- Parse/apply failures retain raw response text, usage, failure phase, and error; skipped/not-reached stages have explicit markers.
- HTML and Markdown structurally omit scenario headings, blocks, and TOC links.
- Hedge/parlay validation and portfolio-strategy construction are not invoked under suppression.

### P1 group 5 — frozen-input/live-bridge boundary was absent

The earlier implementation lacked `--disable-live-context-bridges`, still ran the two Supabase-backed context bridges, and described fields that the approved scoped dossier removes. The scoped dossier builder and scoped fixtures were unfinished.

Required review now:

- Inspect the new `agents/lib/scoped-dossier.js` and its actual CLI integration.
- Verify it keeps only Wins/Playoffs synthesis rows for all 32 canonical teams, filters the experts map correctly, strips `prediction_markets`, preserves required provenance, writes atomically, and refuses overwrite if those were the approved responsibilities implemented here.
- Verify the live-context bridge flag skips only `loadVaultReferenceEvidence()` and `loadMasterReportEvidence()` while leaving credentials available to the authoritative read-only preflight.
- Confirm scoped prompt descriptions exactly match the scoped dossier/fixture data actually supplied.
- Locate and verify the empty scoped ledger, official-config, expert-index, watchlist, and promotions fixtures if Claude adds them.

### P2 / Low items from the last review

- Prompt-only token estimation used `SYSTEM_PROMPT.length` instead of `ACTIVE_SYSTEM_PROMPT.length`.
- `committee.js` documentation incorrectly said `parseJSON()` was injected even though it was imported.

## Review checklist for the new Claude changes

1. Reconcile live Git and inventory only the scoped production/test files.
2. Compare the latest implementation against every P1/P2 item above.
3. Verify imports with credentials blank before running any tests.
4. Use in-memory fixtures to challenge quarantine and assertion bypasses.
5. Inspect the assembled prompt strings, not only template fragments.
6. Inspect the actual suppressed output-object construction and both renderer branches.
7. Verify committee call/parse/apply failures retain audit raw data and accurate statuses.
8. Verify persistence defense-in-depth and sole-wrapper routing remain intact.
9. Verify ordinary/non-suppressed behavior has not drifted.
10. Review production tests for real-function coverage, fail-closed cases, call ordering, import safety, no-network isolation, and normal/suppressed matrices.

Do not call the implementation approved merely because syntax checks, ad hoc `_rev20_*` probes, or a prompt-only run pass. Those are supporting evidence, not substitutes for the promised production tests and structural review.

## Safe verification boundary

Allowed without further authorization:

- Read-only Git inspection.
- Source/diff review.
- `node --check`.
- Import-safe checks with Supabase/model credentials explicitly blank.
- In-memory unit probes that perform no file/network/database writes.
- Existing or newly added offline unit tests after inspecting them to confirm they cannot call paid models, Supabase, or external services.

Do not run a CLI prompt-preview command merely to inspect strings if it writes an artifact or can reach a live context bridge; prefer exported pure builders and in-memory fixtures. Stop and ask Andy if adequate verification requires any external read, generated artifact write, or broader command.

## Standing authorization boundaries

- No paid model normalization or committee synthesis.
- No Supabase/Postgres writes, migrations, or schema changes.
- No live Supabase/context-bridge access during this review.
- No betting picks, official-pick promotion, portfolio/exposure/bankroll mutation, or wagering action.
- No staging, commit, push, broad cleanup, reset, restore, stash application, or deletion.
- No unrelated NFL Dashboard, SuperContest, fantasy, toolbox, or UI work.
- No fixes unless Andy explicitly authorizes an exact implementation scope.
- Findings first. Live source/tests/Git override all handoff prose.

## Expected fresh-session deliverable

Return:

1. Live Git reconciliation summary.
2. Findings ordered P0/P1/P2/P3 with precise file/line evidence.
3. Explicit disposition of every prior P1/P2 item: fixed, partially fixed, still open, or regressed.
4. Answers on the five scope-definition sets and their actual use across recommendations, watch rows, final assertion, renderers, raw output, and persistence.
5. Test/verification evidence actually run, clearly separating offline proof from Claude-reported prior runs.
6. Final verdict: approved for the next gate or changes requested.
7. Confirmation that the dirty worktree was preserved and no prohibited action occurred.

