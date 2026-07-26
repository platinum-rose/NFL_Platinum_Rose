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
- **S304 Completed**: F-25 — League Injury Report tab. Confirmed the per-game injury UI (MatchupCard badges, InjuryReportModal) was already fully wired; built the actual gap, a league-wide `InjuryCenter.jsx` (`?tab=injuries`) showing all 32 teams sorted worst-impact-first with search/status-filter/hide-clear controls. Extracted shared `getTeamImpactSummary()` into `lib/injuries.js` (also fixes zero-injury teams being mislabeled "Minor"). Commit `ba00bfe` + doc commit `2607199` — **pushed, confirmed** `1e7a25f..2607199`.
- **S305 Completed**: F-27 — UI QC pass, audit-only (its own scope forbids code changes). All 17 tabs checked for dead routes (none), empty click handlers/dead links (none). Full findings in `docs/F27_UI_QC_FINDINGS_2026-07-26.md`. Real defects spun out to TASK_BOARD: F-27b, F-27c, F-27d, F-27e. Commit `57e402a` + doc commit `1baa16b` — **pushed, confirmed** `2607199..1baa16b`.
- **F-26 status correction (2026-07-26)**: TASK_BOARD's F-26 description was stale — a full Phase A fantasy value-vs-ADP pipeline and a complete Yahoo OAuth2 client already existed. Walked Andy through the one-time Yahoo OAuth handshake (tokens now saved) — but the first real API call hit `additional_authorization_required`: Yahoo has moved Fantasy Sports API access behind a separate approval application (`sports.yahoo.com/developer/access/`) that didn't exist when this integration was originally built. Andy submitted that application (using his GitHub profile URL, since the project repo is private). **Now waiting on Yahoo's approval** — nothing left to do on our side until that comes through.
- **S306 Completed**: F-27b — fixed the P1 finding from the QC pass. `Dashboard.jsx` was fabricating `commence_time` as "right now" for every game instead of using `schedule.json`'s real `kickoff_utc`, so every matchup card showed the wrong kickoff time. Also removed 3 confirmed-dead fields riding alongside it. Commit `fb316f2` — **not yet pushed**.

---

## Next Immediate Action

Push the pending local commit (`fb316f2` + upcoming TASK_BOARD/WORKING-CONTEXT doc-update commit) to `origin/main` — sandbox has no GitHub credentials, run natively:
```
cd E:\dev\projects\NFL_Dashboard
git push origin main
```
F-26 is blocked on Yahoo's approval of the access application — nothing to do there until Andy hears back. In the meantime, good candidates: build the Fantasy tab for the already-working Phase A value board (no Yahoo needed), refresh the value board (stale since 07-18), or pick up F-27c/F-27d/F-27e from the QC findings. Also open: full `npm.cmd test` re-run (F-32), `get_youtube_futures_intel` live smoke test, F-29's Approve/Reject smoke test once a real draft exists (F-29b), and F-31's live `portfolio-synthesize.js` watchlist re-run.
