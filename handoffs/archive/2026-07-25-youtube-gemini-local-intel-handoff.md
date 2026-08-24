# 2026-07-25 YouTube Gemini Local Intel Handoff

## Objective

Continue the Platinum Rose NFL YouTube/Gemini podcast-intel workflow after the local pilot, human review, local promotion gate, and agent-facing summary were completed.

This workstream is local-only reviewed intel. It does not authorize official picks, production recommendations, Supabase writes, live analyst/model recommendation runs, or open-parlay changes.

## First Read

1. `HANDOFF_PROMPT.md`
2. `WORKING-CONTEXT.md`
3. `docs/antigravity/YOUTUBE_DATA_API_OAUTH_SETUP.md`
4. `docs/antigravity/youtube-futures-agent-intel-summary.md`
5. `data/shadow-harness/review/youtube-futures-agent-intel-summary.json`

## Verified State

- YouTube OAuth and local discovery are configured.
- The Gemini YouTube pilot processed 11 futures-eligible YouTube candidates.
- Human review promoted 39 items to local intel and rejected 1 bad item.
- The rejected item is `DET division_winner +1500` from `youtube-4OxpAX6UJlM`.
- The rejected Lions item is blocked by `price_not_in_quote` and `suspicious_price_shape`.
- Local intel export currently has 39 promoted items and skips the rejected Lions item.
- Agent summary currently has 39 items:
  - `futures_pick`: 29
  - `injury_intel`: 4
  - `non_futures_betting`: 6
- The agent summary leak check reports `det_division_winner_plus_1500: 0`.

## Key Files

- `scripts/youtube-podcast-sweep.js`
- `scripts/gemini-podcast-shadow-harness.js`
- `scripts/build-youtube-futures-intel-review.js`
- `scripts/youtube-futures-review-ui.js`
- `scripts/export-youtube-futures-local-intel.js`
- `scripts/build-youtube-futures-agent-intel-summary.js`
- `scripts/test-youtube-futures-intel-review.js`
- `scripts/test-youtube-local-intel-export.js`
- `scripts/test-youtube-agent-intel-summary.js`
- `data/shadow-harness/review/youtube-futures-intel-review-status.json`
- `data/shadow-harness/review/youtube-futures-local-intel-queue.json`
- `data/shadow-harness/review/youtube-futures-agent-intel-summary.json`
- `docs/antigravity/youtube-futures-intel-review-latest.md`
- `docs/antigravity/youtube-futures-local-intel-queue.md`
- `docs/antigravity/youtube-futures-agent-intel-summary.md`

## Commands

Local review and export:

```powershell
npm.cmd run youtube:review-futures
npm.cmd run youtube:review-ui
npm.cmd run youtube:export-local-intel
npm.cmd run youtube:agent-intel-summary
```

Validation:

```powershell
npm.cmd run test:youtube-futures-review
npm.cmd run test:youtube-review-ui
npm.cmd run test:youtube-local-intel-export
npm.cmd run test:youtube-agent-intel-summary
```

Capped candidate workflow:

```powershell
npm.cmd run youtube:sweep:capped
npm.cmd run youtube:run-futures-candidates:capped
```

Only append `--run-gemini` when the user explicitly wants live Gemini calls.

## Latest Verification

Passed on 2026-07-25:

```powershell
npm.cmd run test:youtube-futures-review
npm.cmd run test:youtube-local-intel-export
npm.cmd run test:youtube-agent-intel-summary
npm.cmd run test:youtube-review-ui
```

Final real-output regeneration:

```powershell
npm.cmd run youtube:export-local-intel
npm.cmd run youtube:agent-intel-summary
```

Results:

- Local intel export: 39 exported, 1 skipped.
- Agent summary: 39 items, `det_bad_leaks=0`.

## Guardrails

- Do not run live Gemini/API calls without explicit approval.
- Do not promote any item to official picks or production recommendations from this local queue.
- Do not write to Supabase.
- Do not generate official real AI proposals.
- Do not fill, close, or modify open parlay slots.
- Treat local Gemini extraction as source-backed research context requiring market validation.
- Preserve the bad Lions extraction as rejected unless the user provides an independently verified correction.

## Recommended Next Step

Wire the Futures and Betting agents to read `data/shadow-harness/review/youtube-futures-agent-intel-summary.json` as local context only. The reader should preserve item lanes, source timestamps, supporting quotes, review flags, and the guardrail that this is not official pick authority.

## Resume Prompt

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard. Read HANDOFF_PROMPT.md, WORKING-CONTEXT.md, docs\antigravity\YOUTUBE_DATA_API_OAUTH_SETUP.md, docs\antigravity\youtube-futures-agent-intel-summary.md, and handoffs\2026-07-25-youtube-gemini-local-intel-handoff.md first. Current task: continue from the completed YouTube/Gemini local-intel pilot. Verified state: 11 futures-eligible YouTube episodes processed, 39 human-promoted local intel items exported, 1 bad DET division_winner +1500 extraction rejected, agent summary built at data\shadow-harness\review\youtube-futures-agent-intel-summary.json with 29 futures_pick, 4 injury_intel, and 6 non_futures_betting items, and det_division_winner_plus_1500 leak check equals 0. Guardrails: do not make live Gemini/API calls, write to Supabase, persist production recommendations, generate official real AI proposals, or modify open parlay slots without explicit approval. Recommended next: wire Futures/Betting agents to consume the local agent-intel summary as read-only context with source timestamps, supporting quotes, lanes, and review flags preserved.
```
