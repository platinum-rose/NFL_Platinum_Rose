# 2026-07-25 FUTURES/BETTING Agent Wiring for Local YouTube/Gemini Intel Handoff

## Objective

Continue from the completed S300/S301 YouTube/Gemini local-intel pipeline and shadow harness work. Wire the `FUTURES` and `BETTING` agent manifests to consume `data/shadow-harness/review/youtube-futures-agent-intel-summary.json` as read-only research context, per the recommended next step in `WORKING-CONTEXT.md` and `HANDOFF_PROMPT.md`.

This remains local-only reviewed intel. It does not authorize official picks, production recommendations, Supabase writes, live analyst/model recommendation runs, or open-parlay changes.

---

## Done This Session

- **Public sync**: `scripts/build-youtube-futures-agent-intel-summary.js` now also writes a public copy to `public/youtube-futures-agent-intel-summary.json` (same pattern as `public/schedule.json`), so the browser-side agent tools can `fetch()` it. Re-ran the script: `items=39 det_bad_leaks=0`, public copy confirmed written and byte-identical in content to the canonical `data/shadow-harness/review/` copy.
- **`src/lib/apiConfig.js`**: added `LOCAL_DATA.YOUTUBE_FUTURES_INTEL = './youtube-futures-agent-intel-summary.json'`.
- **`src/lib/agentTools.js`**:
  - New tool `get_youtube_futures_intel` added to `PODCAST_INTEL_TOOLS` (shared array consumed by both `BETTING_TOOLS` and, transitively, the FUTURES agent chat). Filters by `team` / `market` / `lane` (`futures_pick` | `injury_intel` | `non_futures_betting`), `limit` (default 25).
  - New implementation `toolGetYoutubeFuturesIntel()`: fetches the local JSON via `LOCAL_DATA.YOUTUBE_FUTURES_INTEL`, returns `no_data` if the fetch fails or no items match, otherwise returns `{ status, guardrail, generated_at, total_matched, returned, items[] }` with `review_flags`, `supporting_quote`, and full `source` (episode/timestamp) preserved per item — nothing is summarized away.
  - Registered in the `executeTool` switch.
- **Manifests**:
  - `agents/manifests/futures.manifest.json`: added tool entry (`source: PODCAST_INTEL_TOOLS`).
  - `agents/manifests/betting.manifest.json`: added full inline tool schema (this manifest doesn't reference the shared source array — matches its existing convention of duplicating full parameter schemas).
- **`src/components/agent/FuturesAgentChat.jsx`**: added `get_youtube_futures_intel` to the system prompt's "Podcast intel (shared with BETTING — PODCAST_INTEL_TOOLS)" tool list (explicitly flags: local-only, NOT Supabase, must surface `review_flags`, never an official pick) and to the `toolLabels` map (`📺 YouTube Intel`).
  - `AgentChat.jsx` (BETTING) was left untouched: its "Available Tools" system-prompt section already omits all 7 pre-existing `PODCAST_INTEL_TOOLS` entries (pre-existing gap, out of scope for this session) — the new tool is still available to the model via `BETTING_TOOLS`/`executeTool`, just not separately advertised in that prompt block, consistent with the other 7.
- **Tests** (`tests/unit/agentTools.test.js`):
  - Bumped `BETTING_TOOLS` count assertion 20 → 21 (13 base + 8 podcast intel).
  - Bumped `PODCAST_INTEL_TOOLS` count assertion 7 → 8; added `get_youtube_futures_intel` to both sorted name-list assertions.
  - Added `YOUTUBE_FUTURES_INTEL` to the `apiConfig.js` mock.
  - Added 5 new tests for `get_youtube_futures_intel`: no_data on fetch failure, unfiltered returns all 3 fixture items + guardrail text, team filter preserves `review_flags`, combined team+lane filter, no_data when filters match nothing.
  - Added `afterEach(() => vi.unstubAllGlobals())` and imported `afterEach` from vitest.

## Verification

- `node --check` clean on `src/lib/agentTools.js`, `src/lib/apiConfig.js`, `scripts/build-youtube-futures-agent-intel-summary.js`.
- Both manifest JSON files parse cleanly.
- `npx vitest run tests/unit/agentTools.test.js` → **94/94 passing** (89 pre-existing + 5 new).
- `node scripts/build-youtube-futures-agent-intel-summary.js` re-run clean: `items=39 det_bad_leaks=0`; `npm.cmd run test:youtube-agent-intel-summary` fixture still passes.
- **Not run this session**: full `npm test` (all 38 files under `tests/unit/`). The sandboxed shell used this session could not complete a full run within its per-command time limit (it does not finish within ~40s and background processes do not persist across tool calls in this environment). Only the one test file touching this change (`agentTools.test.js`) was verified; no other test file references `agentTools`, `FuturesAgentChat`, `AgentChat`, or the manifests. **Recommended**: run `npm.cmd test` locally before the next commit to confirm the full-suite count and close out the RULES.md "always run npm test before closing a session" rule properly.

---

## Guardrails (unchanged)

1. Only run `--live-shadow` when explicitly requested.
2. Do not promote any local-queue or shadow-harness item to official picks without explicit approval.
3. No Supabase writes.
4. No official real AI proposals; no open-parlay slot changes.
5. Local Gemini/YouTube extractions remain source-backed research context requiring human review and market validation — this session's wiring only makes that context *readable* by the agents; it adds no new promotion path.

---

## Pending / Recommended Next Steps

1. Run full `npm.cmd test` locally and update `WORKING-CONTEXT.md`'s test count if it changes.
2. Manually smoke-test `get_youtube_futures_intel` from the FUTURES or BETTING agent chat UI (dev server) to confirm the tool round-trips correctly through the live Anthropic/OpenAI tool-call loop, not just the unit-mocked `executeTool` path.
3. Batch live-queue benchmark: execute `--live-shadow` across remaining phase queues as new YouTube episodes are published (unchanged from prior handoff).
4. Consider whether `AgentChat.jsx`'s "Available Tools" system-prompt block should be expanded to list the 8 `PODCAST_INTEL_TOOLS` (including the new one) — currently a pre-existing gap, flagged but not fixed this session since it wasn't part of the requested wiring task.

---

## Resume Prompt

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard. Read HANDOFF_PROMPT.md, WORKING-CONTEXT.md, and handoffs\2026-07-25-futures-betting-youtube-intel-wiring-handoff.md first. Current task: continue from the completed FUTURES/BETTING agent wiring for local YouTube/Gemini intel. Verified state: get_youtube_futures_intel tool added to PODCAST_INTEL_TOOLS in src/lib/agentTools.js (team/market/lane filters, review_flags preserved), public/youtube-futures-agent-intel-summary.json synced by scripts/build-youtube-futures-agent-intel-summary.js, both agent manifests updated, FuturesAgentChat.jsx system prompt + tool label updated, agentTools.test.js passing 94/94 (89 pre-existing + 5 new). Full npm test suite NOT run this session (sandbox time-limit constraint) — run it before next commit. Guardrails: do not make live API calls, write to Supabase, persist production recommendations, or modify open parlay slots without explicit approval. Recommended next: full npm test run, then a live dev-server smoke test of the new tool from the FUTURES/BETTING agent chat UI.
```
