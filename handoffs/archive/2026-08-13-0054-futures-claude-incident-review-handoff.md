# Handoff - 2026-08-13 00:54

Session: forensic review and documentation | Model: Codex

## CRITICAL (mid-flight / broken / blocking)

- No NFL futures are placed. The proposed $100 Bills-Packers exacta at +6500 is a possible dream ticket, not an existing position.
- The six Bookmaker open parlays are past expiration and can be forfeited at the book's discretion. Count them as zero guaranteed value and zero deployable bankroll; show them only in a separate honored-by-Bookmaker scenario.
- The newest portfolio dossier remains `.nfl/portfolio/dossier-2026-08-11.json`, which predates the August 12 evidence cleanup. Do not use it for a new synthesis.
- `.nfl/portfolio/normalized-signals-gpt-4o.json` is a stale July 16 sidecar with identity and provenance problems. Do not allow it into a new dossier.
- Do not begin the intel-reacquisition build or run another synthesis yet. The immediate next step is an independent Claude-team audit using the saved incident report, followed by a Codex-Claude findings comparison.

## DONE

- `docs/NFL_FUTURES_SYNTHESIS_INCIDENT_REVIEW_CLAUDE_BRIEF_2026-08-13.md` - saved the full send-ready incident review, evidence-contamination inventory, proposed unit framework, independent Claude deliverables, and decision boundaries.
- Reconciled the first attempt accurately: the automated committee was prepared but never executed; a separate local GPT-5.6 Sol maximum-effort task returned a research-only `ACTIONABLE NOW: NONE` board.
- Captured Andy's authoritative portfolio state: no futures placed, $500 target liability, separate Bills and Packers anchors normally required, exacta treated as dream ticket, and small conviction exceptions allowed without forcing full anchor stakes.
- Captured the execution universe: BKR, BetUS, BetOnline, BetMGM/Caesars-William Hill/Circa by proxy, Kalshi, and Polymarket. Prediction-market execution requires net fill, liquidity, fees, settlement, expiration, and outcome-equivalence validation.
- Captured the approved future model route: Codex and Claude subscription tasks only; no paid model APIs until the workflow is validated.
- Proposed a design baseline of 1u = $20, 25u = $500, with the $100 dream exacta represented as a special 5u proposal subject to independent challenge and full validation.
- Inspected and preserved the dirty state in both `E:\dev\ATLAS` and `E:\dev\projects\NFL_Dashboard`.

## PENDING

- Point the Claude development/analysis team to `docs/NFL_FUTURES_SYNTHESIS_INCIDENT_REVIEW_CLAUDE_BRIEF_2026-08-13.md` and obtain its independent report.
- Compare Claude's reproduced counts, disagreements, probability architecture, article-recovery proposal, and portfolio-unit critique against the Codex findings.
- Only after that comparison, design the full-body reacquisition workflow for the 31 metadata-only and 181 suspected-truncated article records.
- After reacquisition design approval, plan a clean signal registry, canonical venue registry, candidate-first depth-chart verification, frozen evidence packet, blind Codex-Claude analysis, deterministic disagreement report, and code-owned portfolio construction.
- Build a fresh post-cleanup dossier only after the truth and eligibility contracts are approved.

## BLOCKERS (waiting on external)

- Independent Claude-team analysis has not yet been run or returned.
- Andy will decide when the strengthened intel and synthesis system is ready for a final price-verified proposal run.
- No Supabase migration is involved or awaiting application in this handoff.

## OPEN DECISIONS (need user input)

- Whether Claude agrees that 1u = $20 and a special 5u/$100 exacta proposal are appropriate for the $500 liability target.
- Final unit caps, reserve floor, and Bills/Packers correlated-exposure cap after the independent model comparison.
- Final article reacquisition architecture after Codex and Claude proposals are compared.

## GOTCHAS DISCOVERED

- Model agreement is not independent data-source corroboration.
- Evidence-gate PASS proves deterministic consistency and quarantine behavior, not factual completeness, current prices, calibrated probabilities, or betting readiness.
- The current synthesis prompt pressures 12-20 plays and permits current-fact model memory; both conflict with truth-first abstention.
- The current dossier builder and odds execution validator disagree on the placeable-book allowlist.
- Current preseason depth charts are dated observations, not regular-season ground truth.
- Existing dirty changes in `TASK_BOARD.md`, `WORKING-CONTEXT.md`, the FantasyPros scope/code/test files, Gmail summaries, official-pick proposals, the Yahoo agreement PDF, and the contested YouTube review are outside this handoff's ownership.

## Resume Prompt

```text
Resume in E:\dev\projects\NFL_Dashboard.

First inspect `git status --short --branch` and preserve all dirty and untracked work. Then read, in order:
1. docs/NFL_FUTURES_SYNTHESIS_INCIDENT_REVIEW_CLAUDE_BRIEF_2026-08-13.md
2. handoffs/2026-08-13-0054-futures-claude-incident-review-handoff.md
3. HANDOFF.md
4. HANDOFF_PROMPT.md
5. docs/FUTURES_EVIDENCE_CLEANUP_ROADMAP_2026-08-11.md
6. .nfl/portfolio/frontier-synthesis-context-2026-08-12.json
7. .nfl/verification/futures-evidence-verification-2026-08-12T05-40-00-000Z.json

Objective: obtain or review the Claude development team's independent forensic analysis of the failed August 11 NFL futures synthesis attempt, then compare Claude's findings against the saved Codex incident review. Do not begin implementation of the intel-reacquisition workflow until Andy approves moving from comparison into design/build.

Verified state: no NFL futures have been placed. The $100 Bills-Packers exacta at +6500 is a proposed dream ticket, not an existing position. The six Bookmaker parlays are past expiration and must count as zero guaranteed value and zero available bankroll, with only a separate contingent honored-by-Bookmaker scenario permitted. The target portfolio liability is $500. A surviving portfolio should normally have separate Bills and Packers anchor positions; a small conviction stake can be proposed when price is weak, but reserve/watch is preferred over forcing a full stake. The eventual output is price-verified proposals awaiting Andy's approval. Placeable venues are BKR, BetUS, BetOnline, BetMGM/Caesars-William Hill/Circa by proxy, Kalshi, and Polymarket. The next frontier validation route is Codex and Claude subscription tasks only, with blind independent first passes and no paid model APIs.

The automated three-stage committee was prepared but not executed. A separate local GPT-5.6 Sol maximum-effort task returned research-only `ACTIONABLE NOW: NONE`. The August 12 deterministic cleanup passed, but the newest portfolio dossier is still the contaminated pre-cleanup `.nfl/portfolio/dossier-2026-08-11.json`. Do not synthesize from it. Do not reuse `.nfl/portfolio/normalized-signals-gpt-4o.json`.

Immediate next step: point the Claude team to `docs/NFL_FUTURES_SYNTHESIS_INCIDENT_REVIEW_CLAUDE_BRIEF_2026-08-13.md`, request the 20 independent deliverables listed there, and preserve its response as a separate artifact for later Codex-Claude comparison. After the comparison, ask Andy before designing or building the article/full-source reacquisition workflow.

Dirty boundaries to preserve include the existing changes in TASK_BOARD.md, WORKING-CONTEXT.md, docs/FANTASYPROS_API_INTEGRATION_SCOPE_2026-08-09.md, scripts/build-player-availability.js, tests/unit/playerAvailability.test.js, .nfl/gmail-summaries/, data/official-picks/proposals/active/, the Yahoo API agreement PDF, and docs/antigravity/recovery/youtube-qoCm4G2Jmng-contested-datapoints-review.md. Do not stage, revert, or absorb them.

Guardrails: no betting, official picks, portfolio or parlay mutation, Supabase writes, recommendation persistence, paid model/API calls, fresh synthesis, broad web collection, commit, push, or `git add -A` without explicit approval. Live source access is authorized only for the later approved intel-recovery phase. Treat the evidence PASS as readiness-gate proof only, not factual completeness or betting authority.
```
