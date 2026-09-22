# Codex Handoff — Governance Context Audit + Fictional Island Review

Generated: 2026-09-21 19:36 PT  
Workspace: `E:\dev\projects\NFL_Dashboard`  
Branch observed: `wip/yahoo-sync`  
HEAD observed: `7d49901 feat(wagers): add interactive/CLI wager-entry utility`  
Tracking state observed: `wip/yahoo-sync...origin/wip/yahoo-sync [ahead 1]`

## Current Session Summary

This session built local tooling and artifacts around BEO/BKR prop extraction and fictional Island-game review fixtures. The latest user intent is to close out here and resume later with two tasks:

1. Review fictional NYG @ LAR Island parlay fixtures after the game ends.
2. First, in the next session, audit NFL Dashboard governance/context files for bloated Markdown files that are being loaded into every session and wasting context.

## Important Guardrails

- Dirty checkout is large and contains substantial unrelated NFL Dashboard work. Do not clean, revert, broad-stage, rename, or delete anything.
- If committing later, stage only files relevant to the exact task.
- No betting/account actions, official-pick ledger mutations, Supabase writes, or paid/model-backed synthesis without explicit approval.
- Treat BEO/BKR artifacts and fictional parlay files as local review/simulation artifacts, not official picks or placed wagers.
- For live game review, verify final status and official box score before grading any legs.

## Live Git State Snapshot

Commands run at closeout:

- `git status -sb`
- `git branch --show-current`
- `git log -5 --oneline`

Observed branch/log:

```text
wip/yahoo-sync
7d49901 feat(wagers): add interactive/CLI wager-entry utility
328132c fix(live-tracker): resolve current NFL week by default; add Out/Inactive leg flag
f388edb docs: capture fantasy recap voice guide
f9a5fda fix(live-tracker): guard leg-toggle overrides, add Push state, fix template-literal escaping
27bf77a wip(yahoo): in-progress sync changes + week reconciliation guard
```

`git status -sb` was huge and truncated, but confirmed branch `wip/yahoo-sync...origin/wip/yahoo-sync [ahead 1]` plus extensive modified/untracked files. Treat the checkout as dirty and shared.

## Artifacts Created/Updated This Session

Prop extraction / packet artifacts:

- `scratch/betonline-live-2026-09-21-repull-nyg-lar.raw.json`
- `scratch/betonline-live-2026-09-21-repull-nyg-lar.parsed.json`
- `scratch/bookmaker-live-2026-09-21-repull-nyg-lar.json`
- `scratch/bookmaker-sgp-live-2026-09-21-nyg-lar.json`
- `scratch/prop-market-movement-2026-09-21-repull-nyg-lar.json`
- `scratch/ai-prop-matchup-packets-2026-09-21-nyg-lar.json`
- `scratch/ai-prop-matchup-packets-2026-09-21-nyg-lar.md`
- `scratch/prop-audit-agent-report-2026-09-21-nyg-lar.json`
- `scratch/prop-audit-agent-report-2026-09-21-nyg-lar.md`
- `scratch/prop-stack-agent-report-2026-09-21-nyg-lar.json`
- `scratch/prop-stack-agent-report-2026-09-21-nyg-lar.md`

New fictional review fixture:

- `scratch/fictional-island-stacks-nyg-lar-2026-09-21.md`

Relevant code/test files from prop tooling work:

- `scripts/props/betonline-live-parser.mjs`
- `scripts/props/bookmaker-live-normalize.mjs`
- `scripts/props/build-ai-matchup-packets.mjs`
- `scripts/props/run-prop-audit-agent.mjs`
- `scripts/props/run-prop-stack-agent.mjs`
- `tests/unit/betonlineLiveParser.test.js`
- `tests/unit/bookmakerLiveNormalize.test.js`
- `tests/unit/aiMatchupPackets.test.js`
- `tests/unit/propAuditAgent.test.js`
- `tests/unit/propStackAgent.test.js`
- `docs/specs/AI_PROP_MATCHUP_PACKET_SPEC_2026.md`

## Verification Performed

Focused tests were green after the ATD canonicalization and stack-agent changes:

```text
npx.cmd vitest run tests\unit\aiMatchupPackets.test.js tests\unit\propAuditAgent.test.js tests\unit\propStackAgent.test.js tests\unit\betonlineLiveParser.test.js

Test Files  4 passed (4)
Tests       14 passed (14)
```

## Key Findings From Prop Work

- ATD and Anytime Touchdown Scorer are the same proposition. The packet builder now canonicalizes `atd_1_plus` to `atd` and dedupes duplicate same-player ATD rows.
- First TD Yes/No rows are canonicalized with first-TD list rows.
- The stack agent deliberately separates touchdown longshot watches from actual thesis-based stack candidates.
- BEO/BKR player/team rows still require roster validation. Example: the BEO pull included rows like `Darnell Mooney NYG`, which should be treated as a scraper/data-quality test until verified.
- The fictional fixture file includes BEO-derived leg prices, naive parlay prices, and fictional stake sizing:
  - 1u = $5.
  - 2u only if a shorter, higher-likelihood fixture lands in the +1000 to +3000 range.
  - Current fictional fixtures are all above +3000, so all are marked 1u.

## Fictional Island Review State

File to review after final:

`scratch/fictional-island-stacks-nyg-lar-2026-09-21.md`

It contains:

- Fixture A: Island Over Anchor
- Fixture B: Chalk Normal-Game Builder
- Fixture C: NYG Chase-Mode Receiver/Rush Stack
- Fixture D: LAR Passing Funnel With Kyren Usage
- Fixture E: Touchdown Watchlist
- Fixture F: Anti-Correlation Canary

Each fixture has TBD postgame fields:

- Result
- Legs hit
- Template accuracy
- Main lesson

Before grading, verify the game is final and use official box-score stats only. If a player/row is not roster-valid, grade that leg as `NOT GRADEABLE / data issue`, not as a handicap miss.

## Next Session Priority: Governance Context Audit

The user explicitly wants the next session to start by reviewing NFL Dashboard governance files for bloated Markdown that is eating context every session.

Suggested audit targets:

- `HANDOFF.md`
- `HANDOFF-1.md`
- `.atlas/lessons-learned.md`
- `.atlas-bridge/memory.json`
- `agents/dev/WEEKLY_BETTING_ANALYST_PROMPT.md`
- Any root or config files automatically loaded by agents/Codex/Claude.
- Any `.md` files named `README`, `HANDOFF`, `CONTEXT`, `GOVERNANCE`, `INSTRUCTIONS`, `CLAUDE`, `AGENTS`, or similar.
- Search for very large `.md` files with `rg --files -g "*.md"` plus size/line counts.

Recommended first commands:

```powershell
git status -sb
git branch --show-current
git log -5 --oneline
rg --files -g "*.md" | % { $p=$_; $lines=(Get-Content $p -ErrorAction SilentlyContinue | Measure-Object -Line).Lines; $bytes=(Get-Item $p -ErrorAction SilentlyContinue).Length; [pscustomobject]@{Path=$p; Lines=$lines; Bytes=$bytes} } | Sort-Object Lines -Descending | Select-Object -First 50
rg -n "governance|context|handoff|instructions|always|load|session|Claude|Codex|agent" HANDOFF.md HANDOFF-1.md .atlas .atlas-bridge agents docs scripts -g "*.md"
```

Do not modify governance files until after reporting the biggest offenders and proposed cuts/splits.

## Resume Prompt

Copy/paste this into the next session:

```text
Resume in E:\dev\projects\NFL_Dashboard.

Start by checking live state, not relying on this handoff alone:

1. Run:
   - git status -sb
   - git branch --show-current
   - git log -5 --oneline
2. Read:
   - handoffs/2026-09-21-1936-codex-governance-context-and-fictional-island-review-handoff.md
   - scratch/fictional-island-stacks-nyg-lar-2026-09-21.md

Primary next task:
Before grading the fictional Island parlays, audit the NFL Dashboard governance/context files for bloated Markdown that is getting loaded into every session and eating context.

Guardrails:
- The checkout is dirty with substantial unrelated work. Do not clean, revert, broad-stage, rename, or delete anything.
- Do not mutate official picks, wager ledgers, Supabase, or betting/account state.
- Do not edit governance files yet. First produce an audit of the largest likely context offenders, why they are being loaded, and a proposed slimming/splitting plan.
- If edits are approved later, stage only files relevant to that exact governance cleanup.

Suggested first audit commands:
- rg --files -g "*.md" and rank Markdown files by line count/byte size.
- Inspect root/config/governance candidates such as HANDOFF.md, HANDOFF-1.md, .atlas/lessons-learned.md, .atlas-bridge/memory.json, agents/dev/WEEKLY_BETTING_ANALYST_PROMPT.md, README/CLAUDE/AGENTS/CONTEXT/GOVERNANCE-style files.
- Search for loader references to governance files in scripts, agents, package scripts, and app config.

After governance audit:
If the NYG @ LAR game is final, review scratch/fictional-island-stacks-nyg-lar-2026-09-21.md against official box-score stats. Grade each fictional fixture as HIT/MISS/PARTIAL/NOT GRADEABLE, record legs hit, template accuracy, and whether the miss was game-script, player-role, bad-line, data-quality, anti-correlation, or variance.
```

