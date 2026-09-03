# 🏈 Claude Handoff: Portfolio Data-Integrity Fixes — 2 of 5 real bugs closed, 2 blockers still open, no paid committee run yet

> **Date:** September 3, 2026
> **Author:** Claude (Cowork)
> **Target:** Next Claude session, Andy
> **Status:** Deep root-cause/fix session on the futures-portfolio committee pipeline, triggered by Andy calling the 2026-09-02 committee run output "UNACCEPTABLE" and later "I have no trust in this system right now." All fixes below are committed to the **working tree only** — nothing has been git-committed/pushed, and no paid-API committee run has been executed since. **Andy's standing instruction: do not run `agents/portfolio-synthesize.js` against the real paid API again until he says so.**

---

## Why this session happened

Andy ran the paid AI committee (`agents/portfolio-synthesize.js`, Opus 4.8 + Fable 5) on 2026-09-02 to build the Packers/Bills Super Bowl anchor + hedge/ladder strategy from a clean slate. The output looked broken on multiple axes:

1. A Packers Win Total price that was demonstrably NOT stale (Andy had personally re-verified it) got treated as stale and killed the recommendation.
2. Even when a price legitimately was stale, the system should have used it as current truth rather than discarding the pick.
3. Fable's stage-1 call ($5 spent) produced nothing usable.
4. Andy's closing instruction: **"We will not run this again until it is proven end-to-end on a subscription model outside the paid API calls."**

Everything below was root-caused and fixed using free/local methods only (direct code reading, Supabase read queries, local script runs, isolated unit-test replicas) — never by re-invoking the paid committee.

---

## Bugs found and fixed (all in the working tree, uncommitted)

### 1. `agents/portfolio-dossier.js` — `isBetterOffer()` picked price before freshness
The "best price" selector compared raw price number first, freshness only as an exact-price tiebreaker. A 24-day-old BetUS quote could (and did) beat a 4-day-old BetMGM quote purely on magnitude.
**Fix:** rank by freshness tier first; within the same tier, prefer the younger (less stale) quote over a better price; only fall back to price when ages are equal/unknown.

### 2. `agents/portfolio-synthesize.js` — `validateRecommendationStrict()` hard-killed stale picks
Any recommendation whose best quote was >72h old (`MAX_QUOTE_AGE_HOURS`) got `status: 'invalid'` outright, no fallback.
**Fix:** stale quotes no longer invalidate the pick — they flag it `needs_human_review` with a note to verify the live price, and the existing (stale) number is used as the evaluation basis, per Andy's explicit instruction.

### 3. `agents/portfolio-synthesize.js` — `callModel()` had no truncation detection
Fable hit the old `MAX_OUTPUT_TOKENS=16000` cap exactly and got cut off mid-JSON; the only symptom was a cryptic `JSON.parse` error days later ("Expected ',' or ']'... position 12750"). Opus needed only 10,041 tokens for the same task — this was a cap problem, not a Fable formatting bug.
**Fix:** raised default cap to 24000; added explicit `stop_reason`/`finish_reason`/`incomplete_details` truncation detection across all three call paths (Anthropic, OpenAI chat, OpenAI Responses) so a future cutoff fails loud and specific instead of cryptic.

### 4. **No intel-quality gate existed at all** — the real trust problem
`scripts/build-intel-source-audit-report.js` already existed and already knew how to flag every intel source (odds, prediction markets, articles, training camp, player availability) as current/stale/blocked — but **nothing in the committee pipeline ever consulted it.** Worse, the audit tool itself was silently crashing (a `fallback !== null` bug in its own `readJson()` helper meant it choked instead of gracefully reporting "file not found yet" — exactly the situation an unprocessed manual-import batch puts it in). It's very likely this audit has not produced a report in a long time.
**Fixes:**
- Fixed the `readJson()` fallback bug in `scripts/build-intel-source-audit-report.js` (it now actually completes and produces a report).
- Wired a **hard preflight gate** into `agents/portfolio-synthesize.js`: it now runs `node scripts/build-intel-source-audit-report.js --strict` before Stage 1 and refuses to start (`process.exit(1)`) if anything is BLOCKED or STALE. Escape hatch: `--allow-blocked-intel` (loud, logged, documented as last-resort only). Dev-only bypass: `--skip-intel-audit`.
- Verified end-to-end against the real, current (broken) audit state — confirmed it correctly blocks before any model call, with zero risk of touching the paid API (tested the subprocess call in isolation, never executed the real committee main() ).

### 5. Training camp intel — 4 layered bugs, not 1 (fully closed, verified idempotent across 3 rebuilds)
The audit had flagged `data/training-camp/2026/latest.json` as "an all-32-team empty placeholder." Root cause chain, found by actually fixing and rebuilding rather than patching the symptom:
- **5a.** `scripts/training-camp-intel.js` did a full parse-and-replace of whatever was in `data/training-camp/2026/manual/` each run, with no merge against the existing snapshot. An empty manual folder on a given day = the whole accumulated 225-item, 27-team snapshot silently wiped to zero, no warning. **Fixed:** always merges new items into the existing `latest.json` first; added a hard guard that refuses to write a snapshot with fewer `teams_with_intel` than what's on disk unless `--force`.
- **5b.** `agents/lib/team-identity.js`'s `ambiguous_inferred_primary` flag fired on ANY 2+-team mention with no authoritative source — which is the normal shape of a wire-feed game recap ("Bears' 24-0 run" mentions both CHI and CLE, the two teams that played). This inflated 3 genuinely ambiguous multi-team roundup articles into 33 false positives, hard-blocking an otherwise-clean file. **Fixed:** threshold raised to >2 mentioned teams (2-team recaps are legitimately handled by the existing first-mention-primary + related-teams logic, verified correct by hand against all 30 false-positive cases).
- **5c.** Found while verifying 5b: `scripts/training-camp-intel.js`'s `dedupeItems()` fed each item's own *previous, algorithmically-inferred* `primary_team`/`related_teams` back in as if they were externally-*declared* facts on every rebuild — permanently laundering a one-time uncertain guess into apparent certainty, silently defeating the ambiguity check forever after the first pass. **Fixed:** only treat prior `primary_team`/`related_teams` as trustworthy input if the record's own `ownership_source` indicates real authority (feed tag, source prefix, or genuine declaration) — never if it was itself `inferred_first_mention`.
- **5d.** `agents/lib/team-identity.js`'s `teamIdentityValidationBlockers()` had its own separate, stricter rule (any nonzero ambiguous count = blocker) that ignored 5b's fixed threshold and kept blocking anyway. **Fixed:** now only surfaces ambiguous count as a blocker when it's actually why `status !== 'pass'`.

Verified stable across 3 consecutive rebuilds: 225 items, 27/32 teams, exactly 3 correctly-flagged genuine ambiguous cases (down from 33 false positives), `status: pass`.

### 6. BetOnline 8/29 screenshot batch — ingested for real (Andy explicitly authorized the Supabase write)
Found Andy's screenshot capture process was real and ongoing (not "one-time," as I incorrectly said earlier in the conversation — correct that if it comes up) — but the 8/29 batch (9 screenshots: Conf/Div/MakePlayoffs/SB/WinTotals) was sitting **unprocessed** in `docs/Futures_Odds/`, never run through `scripts/ingest-beo-screenshots.js`. That script also isn't on any schedule — it only runs when someone remembers to type the command.
**Found one more bug before ingesting:** the script's prefix list only recognized `BEO_RegWins*`; Andy's 8/29 batch used `BEO_WinTotals*`, a naming drift that would have silently skipped exactly the win-totals screenshots this whole investigation started from. **Fixed:** both prefixes now accepted.
**Ran for real** (`node scripts/ingest-beo-screenshots.js --date 2026-08-29`): 159 rows upserted into `futures_odds_snapshots` (old 8/10 rows preserved as history, not overwritten), screenshots archived to `docs/Futures_Odds/_processed/BetOnline_2026-08-29/`. Packers Win Total Over 9.5 now has a real 8/29 BetOnline quote (-140) alongside BetMGM's -130 (which correctly wins on price at equal freshness).

**Bookmaker and BetUS are still stale (frozen at 8/10)** — confirmed there is no pending screenshot batch or manual-import material for either book sitting anywhere in the repo right now. This needs Andy to actually capture new screenshots for those two books before anything further can be done here.

---

## Still open — pick up here

Ranked by what's currently blocking the intel-audit gate (run `node scripts/build-intel-source-audit-report.js` to see live status):

1. **Prediction-market integrity gate — BLOCKED.** 1,993 prediction-contract rows are missing normalized price/liquidity/fee/timing/settlement/sportsbook-equivalence fields. Not yet investigated at all. Files: `data/prediction-markets/latest.json`, `team-market-map-latest.json`, `cross-market-coherence-latest.json`; validator in `scripts/lib/futures-evidence-gates.js` (`validatePredictionArtifacts`). **Start here** — read the validator first to understand exactly which fields are missing and why, the way the training-camp investigation worked (don't guess a fix, trace the actual data).

2. **Article evidence integrity review — BLOCKED.** 49 pick-oriented article records have unresolved integrity issues out of 653 assessed. Not yet investigated. Validator: `validateArticleEvidence` in `scripts/lib/futures-evidence-gates.js`. Same approach: read the validator, find the actual 49 records, understand what's specifically wrong with them before touching anything.

3. **Bookmaker/BetUS odds still stale at 8/10** — needs Andy to capture new screenshots (or confirm whether there's a different capture path for these two books than BetOnline's). Not fixable from code alone right now.

4. **Small-entry/scale-in recommendation pattern** — Andy wants the risk-editor SYSTEM_PROMPT logic in `agents/portfolio-synthesize.js` to recommend a smaller entry now + wait-for-better-price-later pattern for anchor positions (Packers SB specifically) even when raw math shows negative edge, rather than just killing the pick. Not started — this touches prompt wording the models reason from, so per earlier discussion, draft it and show Andy before it's live, since it can't be test-run against a real model call under the current no-paid-API constraint.

5. Given how deep training camp turned out to be (4 real bugs under 1 reported symptom), treat #1 and #2 with the same rigor: trace the actual validator and actual data before writing any fix, verify with a real before/after re-run of the specific check (not just the top-level audit number), and don't declare something fixed until it's been rebuilt/re-validated at least twice to catch feedback-loop bugs like #5c above.

## Standing constraints (unchanged)
- No `agents/portfolio-synthesize.js` run against the real paid Anthropic API until Andy explicitly authorizes it, and only after he's satisfied the fixes are proven via non-paid-API methods.
- No git commit/push without explicit approval — everything above is uncommitted in the working tree.
- No Supabase writes without explicit per-write authorization (the BetOnline ingest above was explicitly authorized).
- This session (and the prior one) worked entirely via `device_bash` against `E:\dev\projects\NFL_Dashboard` — a real Windows machine, mounted at `$HOME/mnt/dev/projects/NFL_Dashboard` in the Linux bridge VM. A stale `.git/index.lock` may still be present from another in-flight process; see prior handoffs for the `GIT_INDEX_FILE` + `commit-tree` + push-by-SHA workaround if it blocks a future commit.
- Andy is running a **separate, parallel session** investigating Yahoo Fantasy API access (unrelated fantasy-rankings track, not the betting portfolio) — no need to touch `agents/yahoo-*.js` or `scripts/yahoo-auth.js` from this thread.
