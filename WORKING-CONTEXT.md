# Working Context — Platinum Rose NFL Dashboard

> Active workspace memory for the assistant. Keep this brief and accurate.

---

## Current Sync State - 2026-08-18 PT

**Latest handoff:** `handoffs/2026-08-18-1555-yahoo-and-handoff-sync.md`.

**Verified Git state:** local `main` is `2b17c75`; `origin/main` is `d76d309`; local branch is ahead by 2 commits (`655e713`, `2b17c75`). The older rolling handoff claim that `origin/main` was at `655e713` is stale.

**Preserve current dirty/untracked boundaries:**
- `agents/portfolio-dossier.js`
- `scripts/build-prediction-market-map.js`
- `scripts/lib/futures-evidence-gates.js`
- `tests/fixtures/prediction-market-evidence-cleanup-mini.json`
- `tests/unit/futuresEvidenceGates.test.js`
- `tests/unit/predictionMarketEvidenceCleanup.test.js`
- `scripts/bottom-12-analysis.js`
- `scripts/colts-bucs-comparison.js`

**Current open lanes:**
- Yahoo Fantasy API is paused until Yahoo provides Fantasy Sports API access/provisioning. Local OAuth completed and tokens updated, but API calls still return Yahoo 401 `oauth_problem="additional_authorization_required"`; screenshot review showed no Fantasy Sports Read permission option visible. Rotate the exposed secret before continuing Yahoo work.
- Kalshi/Polymarket normalization is uncommitted Codex work in the six modified futures files. It adds normalized prediction-market contract fields and gates missing normalized data. Re-run focused deterministic checks before staging/committing.
- UI modernization is WIP from pushed `70049b8`; full native build still needs verification.
- No push/commit/Supabase write/betting/official-pick action/portfolio mutation/paid model call/fresh synthesis without Andy's explicit approval.

## Current Recovery State - 2026-07-30 UTC / 2026-07-29 Pacific

**Latest triage handoff:** `handoffs/2026-07-30-1101-camp-intel-ui-handoff.md`.
**Crash recovery detail:** `handoffs/2026-07-30-0635-crash-recovery-source-audit-handoff.md`.
**Current pushed HEAD:** `29065e9` on `main` / `origin/main`.

The machine crashed during a dirty source-freshness/readiness workstream after the July 29 season-smoke and YouTube/Gemini futures reconciliation handoff. Local services have been restarted and verified:

- Dashboard: `http://localhost:5174/platinum-rose-app/`
- Official picks inbox: `http://127.0.0.1:8787/api/inbox`
- M6 podcast service: `http://127.0.0.1:5060/health`

Latest smoke verification:

```powershell
npm.cmd run smoke:season -- --require-services --dev-base http://localhost:5174/platinum-rose-app
```

Result: `READY WITH WATCH ITEMS`, PASS 11 / WARN 6 / FAIL 0 / INFO 1. Use `localhost:5174` for this recovered Vite session; `127.0.0.1:5174` failed in smoke even while the browser-visible localhost URL worked.

Safe recovered work has been committed in narrow checkpoints:

- `87476f0` - Document crash recovery source audit state.
- `0e64d66` - Add local source and article intel review tooling.
- `9273269` - Import July 29 primary futures odds.
- `642349e` - Refresh July 30 training camp intel snapshot.
- `96376e1` - Recalibrate futures synthesis source audit.
- `0cd942a` - Add futures synthesis source readiness checklist.
- `f6cee97` - Clean podcast deep-dive synthesis evidence.
- `817ec29` - Update futures synthesis handoff checkpoint.
- `5b2db46` - Add frontier futures synthesis evidence packet.
- `1c5cdee` - Document training camp source recovery.
- `b0b57ed` - Point source audit at recovered camp snapshot.
- `99fd0c5` - Register THE WINDOW Substack feed and ingest cited EMR research note.

`npm.cmd run intel:source-audit` has been recalibrated around the active objective: verifying current intel sources for a maximum-effort frontier-model futures portfolio synthesis. DK/FD bet-slip parsers and weekly live props are execution/regular-season plumbing and are out of scope for this synthesis-readiness gate.

Current source audit:

```powershell
npm.cmd run intel:source-audit
```

Current result: `PASSABLE`, Current 2 / Review 18 / Stale 0 / Blocked 0 / Missing 0 / Context 7. A fresh approved live RSS scout refreshed the app-facing July 30 training-camp files to 19 items across 10 teams, and player availability was snapshotted with 796 events across all 32 teams, including OL and defensive-front cluster flags.

- Last fully passing audit: `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T07-41-18-119Z.json`
- Current audit JSON: `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T16-50-56-165Z.json`
- Current audit HTML: `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T16-50-56-165Z.html`
- `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`
- `docs/FUTURES_SYNTHESIS_SOURCE_READINESS_2026-07-30.md`
- `docs/FUTURES_SYNTHESIS_REQUIREMENT_AUDIT_2026-07-30.md`
- `docs/TRAINING_CAMP_SOURCE_RECONCILIATION_2026-07-30.md`
- `docs/player-availability/player-availability-latest.md`
- `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md`

BetOnline July 29 screenshots have now been manually normalized:

- Generator: `scripts/build-betonline-0729-import.js`
- Normalized import: `data/futures-imports/betonline-2026-07-29.json` (160 rows)
- Manual review doc: `docs/FUTURES_ODDS_BETONLINE_2026-07-29_MANUAL_REVIEW.md`
- Verified no-write commands: `npm.cmd run futures:betonline-0729`, `node scripts/build-betonline-0729-import.js --check-only`, and `node scripts/ingest-futures-json.js --file data/futures-imports/betonline-2026-07-29.json --dry-run`

Important caveats:
- BetOnline exact Super Bowl matchup was not present in the July 29 screenshot bundle.
- Current worktree copies of `data/training-camp/2026/latest.json` and `data/training-camp/2026/training-camp-intel-2026-07-30.json` contain the fresh approved live RSS scout snapshot generated `2026-07-30T15:21:34.180Z`: 19 items across 10 teams, 4 high-priority items, and 6 feed-health entries. Five feeds were available; Football Outsiders still returned `fetch failed`. Use it as review/highlight context before synthesis.
- Review items are not blockers by themselves; they must be accepted, rejected, or caveated before a frontier-model run.
- Podcast/deep-dive output was regenerated after expanding ad/legal filtering to catch sponsored-by copy. The hard promo/legal scan is clean; remaining sportsbook mentions are price/context references.
- Player availability is local/review context, generated from the ESPN injuries API plus training-camp availability-like notes. It separates OL cluster risk from defensive-front cluster risk; inspect individual player rows before moving futures exposure.

Remaining dirty work is intentional:
- Overnight/ops automation files: `scripts/overnight.js`, `docs/NFL_DASHBOARD_USER_GUIDE.md`, and `infra/systemd/`. Review separately because they change live-fetch automation assumptions and contain Linux/encoding/command assumptions.
- Older retry artifacts under `.nfl/readiness/` and `.nfl/source-audit/`; latest successful reports are already committed.

Review/stage narrowly by workstream. Do not use `git add -A`.

---

## Active Milestone: YouTube / Gemini Local Intel & Shadow Harness

- **S318 Completed (2026-07-29)**: Season readiness smoke + YouTube futures review repair.
  - Added `npm.cmd run smoke:season` (`scripts/season-readiness-smoke.js`) and generated `docs/SEASON_READINESS_SMOKE_TEST_LATEST.md` plus `.nfl/readiness/` timestamped reports.
  - Fixed the YouTube/Gemini persistence gap: per-episode `human_verification` and resolved dispute audit trails now drive the local review ledger/export defaults.
  - Recovered 18 legacy human-reviewed promoted futures rows from commit `95cca82` after reprocessing changed timestamps/item IDs.
  - Andy decided the final 7 unresolved rows: 5 awards props rejected, `NYG Jaxson Dart season_rushing_tds OVER 5.5` and `SF Brock Purdy MVP +2000` promoted.
  - Final YouTube futures state: 45 promoted futures items, 6 rejected futures items, 0 futures items left in `needs_review`/`pending_review`; hallucinated `TEN win_total OVER` remains rejected.
  - Verified: `test:youtube-futures-review`, `test:youtube-local-intel-export`, `test:youtube-agent-intel-summary`, and `smoke:season -- --require-services` all passed. Latest smoke: READY WITH WATCH ITEMS, PASS 11 / WARN 6 / FAIL 0 / INFO 1.
  - Latest handoff: `handoffs/2026-07-29-0405-season-readiness-youtube-futures-handoff.md`.

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
- **S306 Completed**: F-27b — fixed the P1 finding from the QC pass. `Dashboard.jsx` was fabricating `commence_time` as "right now" for every game instead of using `schedule.json`'s real `kickoff_utc`, so every matchup card showed the wrong kickoff time. Also removed 3 confirmed-dead fields riding alongside it. Commit `fb316f2` + doc commit `1fcdc86` — **pushed, confirmed** `1baa16b..1fcdc86`.
- **S307 Completed**: F-26 — root-caused and fixed why the fantasy value board had never produced a real projection (200/200 "no projection" on every prior run). Two bugs: `player_season_stats` was never seeded (fixed, 7963 rows via `player-stats-ingest.js`), and `fetchSeasonStats()`'s query was silently truncated by Supabase's default 1000-row cap before reaching QB/RB/WR/TE (fixed with `.in('position', POSITIONS)`). Verified: 62 value / 42 reach / 45 no-projection on re-run. Also scoped K/IDP/DEF per Andy: K out of scope, IDP/DEF need per-league configurable weights (filed as F-26b, blocked on Yahoo approval). Commit `57b2d3c` + doc commit `2576053` — **pushed, confirmed** `1fcdc86..2576053`.
- **S308 Completed**: F-26 — built `FantasyValueBoard.jsx` (`?tab=fantasy`), rendering the now-working value board in-app: stats bar, position/tier filters, player search, value-gap badges. `agents/fantasy-value-report.js` now also syncs `public/fantasy-value-board.json` (same pattern as the YouTube intel summary) for the browser to fetch. Verified against the real 200-player board (40 strong_value/22 value/51 fair/42 reach/45 no_projection) — every field the component reads matches the generator's actual shape. Commit `9b4f584`, pushed and confirmed `1fcdc86..9b4f584` in commit `7ddff75`'s session-close pass.
- **S309 Completed**: F-27c/d/e — closed out the remaining findings from the F-27 QC pass. F-27c: `lib/injuries.js` now tracks per-team live/mock-fallback state (`getInjuryDataSourceState()`, persisted to `nfl_injury_source_v1`, mirrors `enhancedOddsApi.js`'s `getOddsQuotaState` isMock pattern) — surfaced as a banner + per-team warning icon in `InjuryCenter.jsx`, a SIMULATED badge in `InjuryReportModal.jsx`, and a small icon on `MatchupCard.jsx`'s injury summary. `fetchTeamInjuries()`'s public return shape is unchanged (still an array), so no other call sites needed touching. F-27d: `PulseModal.jsx`'s "Critical Injuries" section now renders real OUT/critical-impact players pulled from each game's already-merged `injuries.home`/`injuries.visitor` (same data `MatchupCard` uses) instead of a hardcoded placeholder. F-27e: removed `ContestLinesModal.jsx`'s dead "Fetch Official Lines" button (fake spinner + always-`alert()`) and replaced it with a static note next to the still-working "Sync Live Odds" button. Also cleaned up 7 stray untracked debug scripts left over from the F-26 root-cause session (`agents/_verify_*.mjs`, `scripts/_diag_fantasy_join*.mjs.bak`). `npx eslint` clean (0 errors; pre-existing warnings only) on all 7 changed files; `tests/unit/injuryAccess.test.js` + `tests/unit/storage.test.js` pass (35/35). Full `npm test`/`vite build` re-run still blocked by the sandbox's ~40s command timeout (same constraint noted in prior sessions) — tracked under F-32. Commit `535f469` — **pushed, confirmed** `7ddff75..535f469`.

- **S310 Completed**: F-30b — training camp intel Phase 2, the free-tier RSS scout. Built `scripts/training-camp-rss-scout.js`: fetches 6 approved free feeds (ESPN NFL, Pro Football Talk, PFF, Rotowire NFL, Sharp Football, Football Outsiders — same URLs already live in `agents/research-intel-ingest.js`), applies a camp-keyword prefilter (`--camp-only`, default true — "training camp", "depth chart", "questionable", "waived", etc.), tags teams via the existing `inferTeams()`, and merges the result with manual notes through the *same* `dedupeItems`/`buildSnapshot` pipeline Phase 1 uses (dedup by canonical URL). Refactored `scripts/training-camp-intel.js` to export the pieces needed for reuse (`parseManualDirectory`, `toIntelRecord`, `inferTeams`, `dedupeItems`, `buildSnapshot`, `writeSnapshotAndReports`, `parseArgs`) and added optional `feed_health` rendering to both the Markdown and HTML reports. Network fetch requires an explicit `--live` flag on *every* invocation, not just today's approval — `config/training-camp-sources.json`'s `network_fetch_default: false` stays the resting default by design. New npm scripts: `training-camp:scout` (preview/no-network) and `training-camp:scout:live`. 15 new unit tests in `tests/unit/trainingCampRssScout.test.js` (RSS/Atom parsing, URL canonicalization, camp-relevance filter, and a `fetchFeedImpl`-mocked integration test proving manual+RSS merge/dedup/feed-health) all pass, plus Phase 1's existing 1-file fixture test still passes unchanged. `eslint` clean on all touched files (also fixed a pre-existing unused-import error in `training-camp-intel.js` while in there). Could not verify actual feed connectivity — this sandbox's network can't reach any of the 6 domains (`fetch failed`, proxy/allowlist restriction, not a code issue) — filed as F-30c: run `npm run training-camp:scout:live -- --dry-run` natively for the first real feed-health check before trusting a persisted run.

- **S311 Completed**: F-33 — closed out the win-total distribution fit + schedule coherence sim spec's one missing piece. Investigation first found TASK_BOARD's F-33 description was stale: Feature A (`agents/lib/win-dist.js`) and Feature B (`agents/portfolio-simulate.js`) were already built, wired in, and unit-tested — only the spec's A.5 mechanical board validator (`agents/lib/board-validate.js`) didn't exist yet. Built it as a pure-function module (no I/O, same convention as `win-dist.js`): book-bettable check, `n_books >= 3` thin-market kill switch (mechanically kills `most_wins`/`least_wins`-style cards), the `superbowl_matchup` sim-price-only policy (locked decision #4), a quoted book+line+price existence check, and an independent dossier-edge cross-check (2pt tolerance). Wired into `portfolio-synthesize.js` as an *additive* pass right after the existing strict validator (`validateRecommendationStrict`, which already hard-invalidates fabricated candidates) — this new layer is strictly annotate-and-keep per locked decision #3: it stamps `candidate.validation` violations without ever dropping a candidate, and both the HTML and Markdown reports now render a red "Board Validator Flag" badge + the violation list when present. 25 new unit tests (`tests/unit/boardValidate.test.js`) all pass; re-ran `winDist.test.js`/`portfolioSimulate.test.js` to confirm zero regression; `eslint` clean on everything touched (5 pre-existing, unrelated errors elsewhere in `portfolio-synthesize.js` left alone — not introduced by this change). Filed a smaller follow-up, F-33b, for a real test-coverage gap found along the way (Feature B's B.6 acceptance criteria — conservation/consistency/determinism tests — aren't fully covered by the existing 1-test file).

- **S312 Completed**: OPS-1 — added `.github/workflows/stats-to-vault-sync.yml` (no code changes, `agents/stats-to-vault-sync.js` already worked, it just had no scheduled trigger). Modeled on `intel-to-vault-sync.yml`'s pattern (closer fit than `betting-splits-ingest.yml` since both are Node vault-sync agents with a receipt-upload step). Corrected the board's original assumption along the way: `nflverse-data-refresh.yml` only fetches nflverse CSVs and seeds `nfl_team_season_stats`/`nfl_player_season_stats` in Supabase — it never calls `stats-to-vault-sync.js`, the separate downstream step that actually writes `vault_notes`. Scheduled 4 hours after that workflow's annual March 1 run so it always syncs freshly-seeded stats, plus `workflow_dispatch` inputs (`dry_run`/`seasons`/`team`) mirroring the script's real CLI flags. Verified the exact invocation locally — argument parsing is correct; it only failed on Supabase being unreachable from this sandbox (same network restriction already known from F-30c, not a workflow bug). YAML syntax validated with `python3 -c "import yaml; yaml.safe_load(...)"`.

- **S313 Completed**: F-30c — Andy ran `npm run training-camp:scout:live -- --dry-run` natively (Windows, outside the sandbox), giving the RSS scout its first real feed-health check. Result: 5/6 feeds `available` (ESPN NFL 2 kept, Pro Football Talk 11 kept, PFF 0 kept, Rotowire NFL 1 kept, Sharp Football 0 kept), 1/6 `error` (Football Outsiders, `fetch failed`). 14 items merged (manual + RSS) across 32 teams, 10 with intel. PFF/Sharp Football's 0-kept counts are a non-issue — both fetched successfully, nothing in today's feed matched the camp-keyword filter. Football Outsiders' failure is a real connectivity issue on that one domain (confirmed native, not the sandbox proxy restriction) — not blocking since the scout already degrades gracefully and keeps the other 5 sources; worth revisiting if it recurs. `--dry-run` confirmed no snapshot/report files were written, as designed. Receipt: `.nfl/receipts/training-camp-rss-scout-2026-07-27T01-54-30-053Z.json`.

- **S314 Completed**: F-27a — investigated live via Claude in Chrome (Andy ran `npm run dev` natively, dashboard reached at `localhost:5173/platinum-rose-app/`). Drove the Podcasts tab through every rendering branch (all 5 feed groups, expanded/collapsed, with/without picks, the PARTIAL badge, the true 0-picks/0-intel empty state) plus a DOM-wide computed-contrast scan (foreground vs. true composited background for every text node). Found no black-on-black anywhere; git history shows `PodcastDigestTab.jsx` hasn't been touched since it was built (one ESLint-only commit) so nothing else incidentally fixed it either. No repro — asked Andy for a screenshot/browser+OS combo next time it surfaces, since it may be environment-specific (forced-dark-mode extension, OS high-contrast mode) rather than a code defect. Also F-33b — grew `tests/unit/portfolioSimulate.test.js` from 1 test to 9 covering all 5 of spec B.6's named acceptance criteria (conservation incl. matchup marginals, consistency, determinism, calibration honesty, known-case fixture). New fixture `tests/fixtures/portfolio-simulate-2026-schedule.json` (real 2026 schedule + real Feature-A win_dist fit, extracted from the gitignored `.nfl/portfolio/dossier-2026-07-23.json`). Along the way, found two real spec-vs-code gaps rather than just missing tests: the B.2 HFA/scale calibration step was never built (measured mean \|gap\| ≈0.035 against real division-market prices, vs. spec's <0.02 target), and the literal 07-16 known-case fixture can't be replayed (that dossier predates both Feature A and schedule persistence) — both filed as F-33c. Verified test logic correct via a plain-node harness (20/20 assertions pass) since `vitest run` itself doesn't complete inside this sandbox's ~45s command timeout, same constraint as F-32 — needs a native `npm test -- tests/unit/portfolioSimulate.test.js` to get an official green run. `eslint` clean.

---

- **S315 Completed**: F-33c — built the HFA/scale calibration step spec §B.2 step 1 called for and F-33c flagged as missing. New `divisionFairProbs()`, `simulateDivisionProbs()`, and `calibrateGlobalParams()` (3×3 coarse grid + local refinement, minimizing SSE between sim division probs and de-vigged book `fair_prob`s) in `agents/portfolio-simulate.js`, wired into `runSimulation()` so it runs automatically whenever a dossier carries division market rows (no-ops otherwise — every prior synthetic-dossier test is unaffected, verified). On real 2026-07-16 book division prices (32 teams): uncalibrated mean |gap| ≈0.035-0.042 → calibrated ≈0.017-0.021, at or just under the spec's <0.02 target, with chosen params (`hfa≈0.20-0.28, scale≈0.73`) meaningfully different from the old hardcoded 0.28/1 — confirms the market really was off from the uncalibrated model, not just noise. 7 new tests (16 total in `tests/unit/portfolioSimulate.test.js`). The other F-33c finding — the literal 07-16 known-case dossier can't be replayed since it predates both Feature A and schedule persistence — is a permanent real-data limitation, not something to build; stays documented in the test file. Verified via plain-node harness (26/26 checks) since `vitest run` doesn't finish inside this sandbox's ~45s timeout (same F-32 constraint) — needs a native `npm test` run for an official green check.

- **S316 Completed**: F-32 (partial) + F-34 — Andy ran the full suite natively: 802/803 passing. Two issues, both fixed same-day. (1) `portfolioSimulate.test.js`'s new calibration test hit vitest's default 5000ms test timeout (it's a real ~5.5s computation, not a bug) — fixed by passing an explicit 20000ms timeout to that `it()`. (2) `vaultRebuilder.test.js` failed to even parse — `agents/vault-rebuilder.js` was genuinely truncated mid-statement inside `aggregateExpertLedger()`. Traced via `git log`/`git diff` to an old commit (`6b61af5`, unrelated to this thread) whose write got cut off before finishing — it also silently dropped the `byEpisodeDateDesc()` helper the new group-by functions depend on (would've thrown `ReferenceError` at runtime) and the CLI-invocation guard at the file's end (so running the script directly did nothing — `main()` was never called). Been broken since that commit; nobody noticed because the full suite hadn't run end-to-end in a while — exactly the gap F-32 existed to close. Reconstructed all three pieces (the ledger math verified byte-for-byte against `vaultRebuilder.test.js`'s exact expected numbers, the helper and CLI guard restored verbatim from the pre-truncation commit). `node --check`/`eslint` clean; `vitest run tests/unit/vaultRebuilder.test.js` — 22/22, verified natively-equivalent in-sandbox (one of the few files light enough to actually finish here). No production impact beyond the test suite — nothing currently invokes this script automatically. Live YouTube-intel smoke test (F-32's other half) still open.

`npm run build` also failed outright (a third finding this session): `FantasyValueBoard.jsx` (F-26, S308, commit `9b4f584`) imported `FANTASY_VALUE_BOARD` as if it were a standalone named export from `src/lib/apiConfig.js`, but it's actually nested inside the `LOCAL_DATA` object (`LOCAL_DATA.FANTASY_VALUE_BOARD`) — a mismatch that a dev server never catches (Vite serves modules individually, doesn't tree-shake/resolve exports strictly the way Rollup's production bundler does) but `vite build` does. Checked all 13 files that import from `apiConfig.js` — this was the only one wrong; every other consumer already uses the correct `LOCAL_DATA.X` pattern. Fixed the import and its one call site.

**Confirmed on Andy's re-run**: `npm run build` — `✓ built in 14.56s`, full `dist/` manifest including `FantasyValueBoard-*.js`. `npm test` — **825/825 passing, 40/40 files** (up from the pre-session baseline; includes `vaultRebuilder.test.js`'s 22 and `portfolioSimulate.test.js`'s 10, calibration test finishing in 6.6s well inside its new 20s timeout). F-32's "full suite re-run" half is fully closed out; only the live YouTube-intel chat-UI smoke test remains open under that ID.

- **S317 Completed**: OPS-2 — the spec's §6 in-process "post-run hook" turned out to already be fully wired (`runRegistry.js`/`server.js`); the real gap was a periodic *full* re-render sweep to heal drift from `nfl-auto-grade.js` grading picks outside M6's own ingest runs. Added an in-process `setInterval` in `packages/m6-podcast-service/src/server.js` calling `renderer.renderAll()` (new `config.digestRenderAllIntervalMs`, default 6h, `=0` disables), fail-soft, `.unref()`'d, cleared on shutdown signals. No GHA workflow possible here (render-digests writes to M6's local disk, no SSH/remote-trigger path exists in this repo) — ships with the service itself instead. Verified via eslint/`node --check`, the existing `test/server.test.js` (10/10, unaffected — it tests `app.js` not `server.js`), and an isolated test of the exact timer-callback logic against a fake renderer. Couldn't boot-smoke-test the real service end-to-end in this sandbox — it hangs with fake Supabase creds, confirmed this is pre-existing (unmodified `server.js` hangs identically), likely a DNS hang on the bogus host, not caused by this change. **Housekeeping note**: left a scratch file `packages/m6-podcast-service/src/server_orig_test.js` from that investigation that the sandbox's filesystem mount wouldn't let me delete (`Operation not permitted` on unlink, same class of issue as the `.git/index.lock` problem from S314) — neutralized its contents to a safe no-op, but it needs a manual `git rm` or Explorer delete on Andy's end.

- **S317 also completed**: F-32's remaining half, the live YouTube-intel smoke test. Used Claude in Chrome against Andy's already-running `npm run dev` to send two real prompts to the Agent tab chat. Confirmed the live model tool-call loop genuinely works end-to-end — the model correctly chose `get_youtube_futures_intel` both times (visible tool-call badge, not mocked) and correctly narrated the tool's `no_data` fallback. Surfaced a real, previously-unknown issue in the process: the fetch for `public/youtube-futures-agent-intel-summary.json` (which does exist, 39 real items) came back HTTP 503, and moments later the whole dev server went unreachable (`Failed to fetch` on every request, including `/`). Not something this session's edits caused (no front-end files touched today) — filed as a new P3 backlog item for Andy to check his `npm run dev` terminal.

- **S317 also completed**: GAMEID-FORMAT — Andy picked option (b) of the 3 documented in `docs/NFL_AUDIT_BACKLOG.md` (shared canonical-key helper, no changes to any live table/ingest script/cron; option (c), full standardize+backfill, stays deferred as a separate backlog item). New `src/lib/gameId.js` parses each of the 3 real `game_id` formats (`games` table, odds/splits tables, nflverse) and folds any of them into one new in-memory canonical key, reusing `teams.js`'s existing team-code alias table rather than adding a 4th ad hoc map. 16 new tests (`tests/unit/gameId.test.js`) prove the actual claim — all 3 formats for the same real game (including nflverse's alt codes like SD/OAK) collapse to the identical key, and different `seasonType` values correctly produce different keys (this guards the exact bug `seed-game-context.py` hit in production). `eslint` clean; ran `npx vitest run tests/unit/gameId.test.js` natively in-sandbox — 16/16 passing (fast pure-function file, no Monte Carlo/timeout issue this time).

- **S317 also completed**: F-31. First attempt (in-sandbox, `--only opus --skip-committee`) confirmed a new generalizable sandbox limitation: Node's `fetch`/`dns` don't route through this sandbox's mandatory proxy (`HTTPS_PROXY`/`ALL_PROXY` → `localhost:3128`/`:1080`) the way `curl` does, so no script here can make a real external API call to completion — needs Andy to run natively going forward, not just a timeout issue like the compute-heavy vitest files. Andy ran natively; opus hit "credit balance is too low" (Anthropic account out of credit — his call whether to top up, not touched here). Switched to the documented `--models gpt-4o` fallback, which then hit `context_length_exceeded` (159,154 tokens vs. gpt-4o's 128k) on the full 1.6MB dossier. Found the script already had the fix built in: `--shadow-slim`, which trims the dossier (row caps, slimmed team profiles) before the prompt — just wasn't mentioned in the fallback's own usage comment. Re-ran with `--shadow-slim` added — succeeded (22.7s, 5 candidates, validator caught 2 as invalid exactly as designed). Read the output `.md` directly and confirmed all 6 Human Watchlist Review items (Bills anchor, Packers anchor, Giants win-total, Bengals ATB, Saints playoffs, Chiefs SB+exactas) rendered with real quotes/fair-prices/edges/status — nothing placeholder. `--no-persist` honored.

- **S317 also completed**: cataloguing-gap fix, prompted by Andy asking to make sure nothing NFL-Dashboard-related was being left incomplete/forgotten. Found 3 real tasks that exist only in ATLAS's own cross-project registry (`.atlas/domain/atlas/tasks.json`) — requested 2026-07-20 during an ATLAS session, never once reflected in this repo's own `TASK_BOARD.md`, so anyone working in NFL_Dashboard alone (like every session this week) would never see them. Surfaced all 3 here as `NFL-ATLAS-1` (futures watchlist with expert citations, open), `NFL-ATLAS-2` (daily digest redesign, open, blocked on Andy answering a couple of scoping questions first), and `NFL-ATLAS-3` (podcast host-summary pipeline — this one is real, substantial, nearly-done work from S290-S292, not a stub; only 2 small items left open: the weekly-cron wiring decision and a non-blocking deferred comparison pass). ATLAS's `tasks.json` stays the source of record; this board is now the mirror so it's visible locally. Also fixed two other staleness bugs found in the same pass: this file's header still said S313 (now S317, with the correct HEAD `21caa1d` and a note that this session's files are still uncommitted), and the backlog still carried a duplicate open `GAMEID-FORMAT` line describing it as unresolved even though it was closed out and moved to DONE earlier this same session.

---

## Next Immediate Action (Current - 2026-07-30 UTC / 2026-07-29 Pacific)

**Crash recovery and safe workstream checkpoints are committed:** continue from `handoffs/2026-07-30-0655-workstream-triage-handoff.md`.

**Current main focus:** request explicit approval for a paid/frontier model call, then run a deep-dive futures portfolio synthesis using the prepared evidence packet, including the player-availability snapshot for injury/return context. Do not spend current-cycle attention on DK/FD bet-slip parsers or weekly live props.

Recommended next:
- Use `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md` as the current model-ready evidence packet, with `docs/player-availability/player-availability-latest.md` alongside it.
- Ask explicit approval before any paid/frontier model call.
- Keep no Supabase writes, recommendation persistence, official-pick approvals/proposals, or open-parlay changes without explicit approval.
- Review `scripts/overnight.js`, `docs/NFL_DASHBOARD_USER_GUIDE.md`, and `infra/systemd/` separately before committing any ops automation.
- Clean older retry artifacts only after deciding they are no longer useful crash-window evidence.

- Create one real official-picks proposal draft and exercise approve/reject through the inbox UI.
- Confirm whether migration 044 has been applied live before relying on production official-picks flows.
- Refresh/review training-camp intel closer to kickoff; latest RSS scout receipt `.nfl/receipts/training-camp-rss-scout-2026-07-30T15-21-35-524Z.json` covers 32 teams, 10 with intel, and one feed issue (`Football Outsiders: fetch failed`).
- Keep older open context in view: Yahoo Fantasy API approval still blocks F-26/F-26b, `NFL-ATLAS-3` weekly-cron wiring still needs a decision, and `NFL-ATLAS-2` is still blocked on digest redesign scoping answers.

## Previous Immediate Action (S317 Historical)

**Committed + pushed (2026-07-27, native):** OPS-2 (`f643614`), GAMEID-FORMAT option b (`e3e417b`), and S317's doc refresh — TASK_BOARD.md, WORKING-CONTEXT.md, NFL_AUDIT_BACKLOG.md, plus a new `docs/NFL_UNFINISHED_WORK_SCAN_2026-07-27.md` cross-check doc (`911a1df`). HEAD is now `911a1df..21caa1d` ahead, pushed clean to `origin/main`. Hit a stale `.git/index.lock` on the sandbox mount first (same class of issue as S286/S314 — the sandbox can create the lock but can't remove it); resolved with a native `Remove-Item -Force .git\index.lock` before committing.

Still open: the leftover `packages/m6-podcast-service/src/server_orig_test.js` scratch file is untracked (never committed), so `git rm` correctly found nothing to remove — needs a plain `Remove-Item -Force` instead, not a git operation. Check whether `npm run dev` crashed (see the NFL-BACKLOG item on the 503/unreachable dev server) and restart it if needed. Consider whether to top up Anthropic API credits (ran out mid-F-31; OpenAI/gpt-4o worked as a fallback once `--shadow-slim` was added). Decide the weekly-cron wiring for `NFL-ATLAS-3`'s podcast host-summary pipeline. Answer `NFL-ATLAS-2`'s scoping questions when ready to redesign the daily digest. Yahoo Fantasy API approval (blocks F-26/F-26b) is still pending (1–2 week SLA). Everything else genuinely actionable this session is closed: F-31, F-32 (both halves), F-33b/F-33c, F-34, GAMEID-FORMAT (option b), and OPS-2 are all done, tested, documented, **and now committed+pushed**.
