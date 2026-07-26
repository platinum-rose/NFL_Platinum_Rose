# Working Context — Platinum Rose NFL Dashboard

> Active workspace memory for the assistant. Keep this brief and accurate.

---

## Active Milestone: YouTube / Gemini Local Intel & Shadow Harness

- **S300 Completed**: YouTube OAuth, discovery, 11 candidate episodes processed, 39 human-promoted items exported to `data/shadow-harness/review/youtube-futures-agent-intel-summary.json`, 1 bad DET item rejected (`det_bad_leaks=0`).
- **S301 Completed**:
  - Reconciled 13-team gold-standard note for Win Totals Part 1 (`data/vault-seed/manual/2026-03-03-sharp-or-square-early-2026-nfl-season-win-totals-part-1.md`).
  - Refactored `scripts/gemini-podcast-shadow-harness.js` with `--simulate` vs `--live-shadow` modes.
  - Python runner `scripts/run_gemini_live_shadow.py` calling `gemini-3.5-flash`.
  - Raw Gemini model responses saved to `data/shadow-harness/observations/*-raw-gemini.json`.
  - Non-circular 7-dimension match scoring engine implemented & verified against independent ground truth.
  - Live API performance: ~20.9s–32.8s latency, ~$0.002–$0.004 per run cost.
  - Architecture specs authored in `docs/antigravity/`.
- **S302 Completed**: Wired `FUTURES`/`BETTING` agents to consume the local YouTube/Gemini intel summary as read-only research context.
  - New tool `get_youtube_futures_intel` in `src/lib/agentTools.js` (`PODCAST_INTEL_TOOLS`), filters by team/market/lane, preserves `review_flags`/`supporting_quote`/`source` per item.
  - `scripts/build-youtube-futures-agent-intel-summary.js` now also syncs a public copy to `public/youtube-futures-agent-intel-summary.json` (browser-fetchable, same pattern as `public/schedule.json`).
  - Both `agents/manifests/futures.manifest.json` and `agents/manifests/betting.manifest.json` updated; `FuturesAgentChat.jsx` system prompt + tool label updated.
  - `tests/unit/agentTools.test.js`: 94/94 passing (89 pre-existing + 5 new). **Full `npm test` (38 files) not run this session** — sandbox time-limit constraint; run before next commit.
- **Handoff Documents**: `handoffs/2026-07-25-youtube-gemini-shadow-harness-handoff.md`, `handoffs/2026-07-25-futures-betting-youtube-intel-wiring-handoff.md`
- **Committed & synced (2026-07-25)**: the full S292–S302 backlog (this milestone plus training-camp intel, futures-agent reasoning/hedge-baskets/watchlist, podcast speaker-attribution/deep-dives) landed in 5 commits (`26d9463`, `c3e8bd6`, `984a52b`, `a169d09`, `95cca82`) and pushed to `origin/main`. `TASK_BOARD.md` refreshed against this history (see F-30b, F-31, F-32 follow-ups).
- **S303 Completed**: F-29 — Platinum Rose AI official picks tab. New lazy `OfficialPicksTab.jsx` (`?tab=official-picks`) wires the local inbox server (`scripts/official-pick-inbox-server.js`, 127.0.0.1:8787) + ledger scorecard report into the dashboard: availability probe/offline state, stats bar, candidate cards with Approve/Reject, and an embedded `/ledger` iframe. Added CORS + OPTIONS preflight to the inbox server. Commit `179b3cc` + doc commit `1e7a25f` — **pushed, confirmed** `7e92d18..1e7a25f`. Approve/Reject not yet exercised against a live draft (inbox empty) — tracked as F-29b.
- **S304 Completed**: F-25 — League Injury Report tab. Confirmed the per-game injury UI (MatchupCard badges, InjuryReportModal) was already fully wired; built the actual gap, a league-wide `InjuryCenter.jsx` (`?tab=injuries`) showing all 32 teams sorted worst-impact-first with search/status-filter/hide-clear controls. Extracted shared `getTeamImpactSummary()` into `lib/injuries.js` (also fixes zero-injury teams being mislabeled "Minor"). Commit `ba00bfe` — **not yet pushed**.

---

## Next Immediate Action

Push the pending local commit (`ba00bfe` + upcoming TASK_BOARD/WORKING-CONTEXT doc-update commit) to `origin/main` — sandbox has no GitHub credentials, run natively:
```
cd E:\dev\projects\NFL_Dashboard
git push origin main
```
Then: run full `npm.cmd test` locally to confirm suite-wide count (TASK_BOARD F-32), manually smoke-test `get_youtube_futures_intel` from the FUTURES/BETTING agent chat UI, and smoke-test F-29's Approve/Reject buttons once a real draft lands in `data/official-picks/proposals/active/` (F-29b). Separately, F-31 needs one approved live `portfolio-synthesize.js` run to verify the Human Watchlist Review section against a real model pass.
