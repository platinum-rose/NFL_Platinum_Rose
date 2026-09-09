# NFL Dashboard — Session Handoff (2026-09-09)

For pickup in a fresh session. This folds together: Codex's post-round-10 review response, the P1 #1 remediation completed this session, and the still-open decisions/work for P1 #2 and the P2s.

---

## 1. Status: what's closed

**Round 10 resolver-hardening — CLOSED.** Codex confirmed the round-10 disposition was correct; no round 11 needed. The SOURCE HIERARCHY / evidence-tier gating system in `agents/lib/board-validate.js` is not touched by anything below except the one flagged policy question in section 3.

**P1 #1 — Prior-season evidence-framing gap — FIXED AND VERIFIED this session.**

Problem: `loadGeneratedProfileRows()` (in `agents/portfolio-dossier.js`) silently falls back to a prior season's `analytics`/`dvoa`/`coaching_profile` artifact when no current-season data exists yet (true right now, pre-kickoff for 2026). Nothing downstream — not the JSON, not the markdown, not the SYSTEM_PROMPT — told the synthesis model or a human reader that a number was actually last year's.

Fix, fully shipped:
- `loadGeneratedProfileRows(prefix)` now stamps every row it returns with `is_current_season` (bool), `seasons_behind` (int), `staleness_note` (string|null), regardless of whether the data came from the current season or a prior-season fallback.
- The three Supabase-branch `mapRow` closures in `fetchAdvancedAnalytics()`, `fetchDvoaSnapshots()`, `fetchCoachingProfiles()` now stamp the same three fields (`is_current_season: true, seasons_behind: 0, staleness_note: null`) so every consumer sees one consistent shape no matter which code path served the row.
- New `stalenessSuffixMd()` helper wired into `analyticsMd()`, `dvoaMd()`, `coachingMd()` — markdown output now shows a visible `[Nyr prior]` suffix when data is stale.
- SYSTEM_PROMPT in `agents/portfolio-synthesize.js` rewritten in 4 places: the `analytics`, `dvoa`, and `coaching_profile` bullets, plus the "prefer analytics for current form" sentence — all now instruct the model to check `is_current_season` before treating any of these three fields as real current-season evidence, and to explicitly flag it as a preseason prior/baseline (never as evidence of current form) when it's false.
- Two related bugs fixed while in there: (a) the season-picker sorted `generated_at` lexicographically as a string, which silently breaks on non-ISO override values — now uses `Date.parse()` with `-Infinity` fallback; (b) an empty-`rows` current-season artifact used to short-circuit past a perfectly good prior-season fallback instead of falling through to it — fixed by filtering zero-row payloads out before the season-branching logic runs.

Verification performed:
- Live dossier regeneration (`node agents/portfolio-dossier.js`) — confirmed Rams team profile shows `analytics: {is_current_season: false, seasons_behind: 1, staleness_note: "Prior-season fallback: no season-2026 data yet (pre-kickoff)..."}`, same shape on `coaching_profile`, and `dvoa: {is_current_season: true, seasons_behind: 0}` correctly (real 2026 DVOA artifact exists on disk; 2026 analytics/coaching artifacts don't yet).
- Markdown output (`grep "yr prior\]"` on the generated `.md`) — confirmed `[1yr prior]` suffix present for Rams, Bills, Cowboys.
- Focused Stage-5 test suite (`evidenceTierGate`, `boardValidate`, `boardValidateNamedPlayerGate`, `namedStatusReviewSizingGates`, `dataGatheringSprint`): **129/129 passing**, no regression.
- Live preflight (`node agents/portfolio-preflight.js`): unchanged at **1 BLOCK · 7 WARN · 0 ERROR · 25 pass** (sole blocker is still the `futures_odds_snapshots` Circa gap, unrelated to this fix).

All edits made via `node --check` + `node node_modules/eslint/bin/eslint.js` clean patch scripts through the device bridge. Nothing committed to git — worktree intentionally stays dirty per standing convention (uncommitted since 2026-08-21).

---

## 2. Open decision #1 — evidence-tier gating for prior-season data (flagged, not resolved)

Codex's review also noted: a prior-season numeric field is now *labeled* honestly, but it still counts as full Tier 1 evidence today — meaning a 2025 stat standing in as a preseason prior could, by itself, still originate a core/standard stake, just with a visible `[1yr prior]` tag attached.

Closing that gap for real means changing `classifyEvidenceTier()` / `isTier4OnlyCandidate()` / `enforceEvidenceTierGate()` in `agents/lib/board-validate.js` — the exact surface that just went through 10 rounds of hardening with sign-off at each step. **Not touched this session.**

**Decision needed from Andy:** should prior-season fallback data (any row with `is_current_season: false`) be capped at a lower evidence tier — i.e., allowed to corroborate/support a pick but not independently originate one — or is "originate + visibly labeled as prior-season" acceptable? This is a policy call, not an engineering one; the code to implement either answer is straightforward once decided.

---

## 3. Open decision #2 — VegasInsider ToS violation (P1 #2, not resolved)

**What happened:** Last session, a Caesars-odds scraper (`scripts/scrape-vegasinsider-futures.js`) was built and run against vegasinsider.com to source live Circa/Caesars futures odds. It was checked for technical scrapability (static HTML, no anti-bot) but **not checked against the site's Terms of Use** before being built or run. It already wrote 32 rows to production `futures_odds_snapshots` via `npm run ingest-futures:caesars`.

**Independently re-verified this session:** vegasinsider.com/terms-of-use/ Section 2 explicitly states: *"Users of the Service may not engage in unauthorized spidering, 'scraping,' data mining or harvesting of Content, or use any other unauthorized automated means to gather data from or about the Service."* This is an unambiguous ToS violation — that scraper should not have been run.

**Current state:** the scraper has not been run again since this was discovered. No further automated VegasInsider ingestion should happen until Andy decides how to proceed.

**Known technical defects in the script** (separate from the ToS question — these would need fixing regardless of what Andy decides, before any future authorized use):
1. Doesn't hour-truncate `snapshot_time`/`captured_at` per migration 022's upsert convention (`unique(market_type, team, book, snapshot_time)`) — reruns within the same hour would insert duplicates instead of upserting. Fix: reuse the already-exported `truncateToHour()` from `agents/futures-odds-ingest.js`.
2. Writes full team names ("Pittsburgh Steelers") where the rest of the Caesars data uses nicknames ("Patriots") — inconsistent with `canonicalTeamAbbreviation()` in `agents/lib/team-identity.js`, the established normalization convention.
3. No provenance column exists in `futures_odds_snapshots` to distinguish "scraped aggregator" from "official book feed" (confirmed via schema inspection — the table has no such column today). Adding one is a schema migration decision, separate from the ToS question.
4. Treats scrape time as quote freshness, letting an aggregator capture pass the same freshness gate as a live book quote.
5. No fixture/unit tests; partial parse of 20-31/32 teams only warns rather than blocking.

**Questions for Andy, to resolve in the fresh session:**
1. The 32 rows already written to `futures_odds_snapshots` — leave them as-is tagged pending a provenance decision, or remove them?
2. VegasInsider as a data source going forward — drop it and look for a licensed/API route for Circa/Caesars odds, or pursue explicit authorization from VegasInsider first?
3. Fix the technical defects (items 1–2 above) now, since that doesn't require running the scraper again — or hold until the ToS question is settled?

---

## 4. Remaining P2s (not started this session)

- **`tests/unit/predictionMarketEvidenceCleanup.test.js` line 197** — stale fixture, hardcodes `source_generated_at` for August 22 against what's now a September 9 `latest.json` snapshot. Straightforward fix, no policy call needed — just update the fixture assertion to match current data shape/date handling.
- **`vault_notes` pagination concurrency (P2 #3)** — the existing pagination fix uses offset-based `.range()` pagination; Codex flagged this as not safe under concurrent writes (rows can shift between pages). A keyset/cursor-based approach would be more robust. Not urgent — no known production incident, just a stability improvement.
- **Preflight scanner 900-character window misclassification (P2 #4)** — the preflight tool's text-scanning window can misclassify findings near the 900-char boundary. Lower priority, cosmetic/accuracy issue in the preflight report itself, not the pipeline.

---

## 5. Recommended order for the fresh session

1. Get Andy's steer on the two open decisions (§2 evidence-tier policy, §3 VegasInsider disposition) — these gate whether/how future ingestion and synthesis proceed.
2. Fix the VegasInsider script's technical defects (§3 items 1–2) if Andy says to — safe to do without running the scraper again.
3. Fix the stale test fixture (straightforward, no decision needed).
4. Decide fix-now vs. document-as-follow-up for the two remaining P2s (pagination, preflight window).
5. Compose a reply-to-Codex document in the same review format, covering this session's remediation, so the review loop stays current.
6. Re-run the full test suite + preflight one more time before considering the handoff clean enough for paid synthesis or recurring ingestion — Codex's stated bar for approving either.

---

## 6. Standing guardrails (carry forward, unchanged)

- No `git add`/stage/commit/push without explicit approval.
- No Supabase writes without per-write authorization.
- No paid committee synthesis without explicit authorization.
- No betting picks/portfolio mutations without authorization.
- Preserve the dirty worktree — no reset/stash/clean/revert (intentionally uncommitted since 2026-08-21).
- `.env` is not edited by the assistant.
- Codex stays in the review loop — findings get addressed and reported back in this same format.
