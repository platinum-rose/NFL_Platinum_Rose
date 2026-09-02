# 🏈 Claude Handoff: Intel Robustness Audit — Closeout (All 4 Items Done)

> **Date:** September 2, 2026
> **Author:** Claude (Cowork)
> **Target:** Next Claude session, Andy
> **Status:** All 4 items from `handoffs/2026-09-02-intel-robustness-audit-handoff.md` are now closed. Synthesis readiness has meaningfully improved but see the open item below before running a real committee pass.

---

## What happened this session

### 1. Rebuilt the portfolio dossier ✅
Ran `agents/portfolio-dossier.js --season 2026`. New dossier:
`.nfl/portfolio/dossier-2026-09-02.json` (+ `.md` summary). Re-checked with
`scripts/check-dossier-freshness.js --dossier .nfl/portfolio/dossier-2026-09-02.json`
→ **PASS**. The `bettorday_trench` evidence lane the old dossier was missing is
now included. This is the dossier to point `portfolio-synthesize.js --dossier`
at for any future run.

### 2. Diagnosed the 4 down research-intel feeds ✅
Tested each feed with direct `curl` (same UA as `fetchViaCurl()` in
`agents/research-intel-ingest.js`), 3-5x each for stability:

- **Action Network** — already fixed in a prior session (`fetchMethod:'curl'`
  already in the FEEDS config). Re-confirmed working: 3/3 clean `200 text/xml`.
  Nothing to do.
- **THE WINDOW (Matt Russell)** — was genuinely broken via Node fetch (403).
  curl got a clean `200 application/xml` 3/3 tries — same CloudFront/Node-
  fingerprint pattern as Action Network. **Fixed**: added `fetchMethod: 'curl'`
  to its FEEDS entry in `agents/research-intel-ingest.js` (with a dated
  comment explaining why). **This edit is uncommitted** — standing
  no-commit-without-approval guardrail applies; `node --check` confirms it's
  syntactically valid.
- **ESPN NFL** — different failure mode: `x-amzn-waf-action: challenge` header
  present (AWS WAF JS challenge, not a simple client-fingerprint block).
  Curl fails it too — 0/5 success rate across two separate test batches (one
  fluke 200 with a `?xml=1` query param did NOT reproduce on 3 retries, so
  that's noise, not a fix). This is **not curl-fixable** — would need a real
  headless-browser JS solve, which is a materially bigger lift than the
  Action Network pattern. Recommend leaving it down and documented rather
  than chasing a browser-automation fix for one RSS feed, unless Andy wants
  that investment.
- **Football Outsiders** — `curl: (6) Could not resolve host` / DNS
  `NXDOMAIN`. Domain is genuinely dead (not a fetch-layer issue at all).
  Confirms the existing `B-footballoutsiders-feed-dead` tracking — no new
  action, stays low priority / likely-permanent.

**Net effect if the THE WINDOW fix is committed and deployed**: 9/11 feeds
healthy (up from 7/11), with the remaining 2 (ESPN NFL, Football Outsiders)
requiring either a browser-automation investment or acceptance as permanently
down.

### 3. Re-ran intel verification scoring ✅ (Andy authorized the write)
Dry run first (930 rows: `research_pick_signals` + podcast future-mentions):
211 verified, 119 stale, 328 unverified, 32 conflicting, 240 rejected as
non-NFL. Andy confirmed Action Network needed no further fix, then authorized
the write. Ran `node scripts/verify-intel-sources.js --write` →
**930 rows upserted to `public.intel_verification`**. Coverage and recency
are both now current as of this session (was 3+ days stale / ~27% coverage
before). Per the script's own design (`FLOW-THROUGH MODE`), this only stamps
`verification_status` on the companion table — it never touched, blocked, or
deleted the underlying `research_pick_signals` / `podcast_host_summaries` rows.

### 4. Orphaned 2026-09-01 committee-run investigation ✅ — resolved, no cleanup needed
Queried `futures_recommendation_runs` directly (read-only). Turns out there
were **two** single-model runs on 2026-09-01, 3 minutes apart:
- `8cd89f32-...` — `claude-opus-4-8` only (the default first model in
  `portfolio-synthesize.js`'s MODELS list — consistent with `--only opus` or
  an equivalent single-model override), reached `validator_invalidated`.
- `77a9b511-...` — `gpt-4.1` (**not** in the script's default MODELS list at
  all — must have been an explicit `--models gpt-4.1` override), reached
  `risk_passed` then `validator_invalidated`.

Neither reached `stage: final` (the most recent row anywhere with
`stage='final'` is from **2026-07-22**, over a month prior — no live
recommendations exist from Sep 1). The pattern (two back-to-back single-model
invocations, one using a model that isn't even in the script's default list)
reads as **manual ad-hoc testing of the synthesis pipeline**, not a broken
production committee run. No recommendations were produced or acted on, so
there's nothing to unwind. Conclusion: **treat as resolved, no action taken
or needed** beyond this note for the record.

---

## Open item for next session: commit decision

One real code change is sitting uncommitted:
`agents/research-intel-ingest.js` — the THE WINDOW `fetchMethod:'curl'` fix
(7 lines). Confirmed working via direct testing but never exercised through
the actual ingest script against Supabase this session (per the standing
no-Supabase-writes-without-authorization guardrail — the script's
`checkFeedHealthAndAlert()` upserts to `feed_health` on every run, dry-run or
not, so it wasn't run end-to-end). Ask Andy whether to commit+push this fix
(and possibly pull in whatever else is sitting in the dirty worktree from
other in-flight agents, per past practice) so it actually reaches the
scheduled GitHub Actions ingest job.

---

## Standing Constraints & Guardrails (unchanged)

- Preserve the dirty worktree — large pre-existing uncommitted changes belong
  to other in-flight sessions/agents. Do not `git add -A`, stash, or revert
  anything not directly touched this pass.
- No Supabase writes, betting/pick-action/portfolio mutation, or **paid
  model/API calls** (this includes actually running `portfolio-synthesize.js`
  for a real committee pass) without Andy's **explicit, direct**
  authorization.
- No Yahoo Fantasy work.
- Commit/push only with explicit per-instance approval.

---

## 📋 Resume Prompt

```
Resume NFL Dashboard development from handoff: `handoffs/2026-09-02-intel-robustness-closeout.md`.

Context snapshot:
- All 4 items from the prior intel-robustness audit are closed: (1) portfolio
  dossier rebuilt (.nfl/portfolio/dossier-2026-09-02.json) and passes the
  freshness gate; (2) research-intel feeds diagnosed — Action Network already
  fixed/confirmed working, THE WINDOW fixed via the same curl-shellout pattern
  (uncommitted code change in agents/research-intel-ingest.js), ESPN NFL is a
  genuine AWS WAF JS-challenge (not curl-fixable), Football Outsiders' domain
  is dead (DNS NXDOMAIN); (3) intel_verification scoring re-run with --write
  (Andy-authorized), 930 rows current; (4) the orphaned 2026-09-01 committee
  run turned out to be two manual single-model test invocations that never
  reached "final" — resolved, no cleanup needed.
- Open item: decide whether to commit+push the THE WINDOW feed fix so it
  reaches the scheduled ingest job.
- Synthesis readiness has improved a lot but a real portfolio-synthesize.js
  committee run still needs Andy's explicit authorization (paid model calls).

Standing constraints:
- No Supabase writes, betting/portfolio mutation, or paid model/API calls
  without Andy's explicit authorization.
- Preserve the dirty worktree -- large pre-existing uncommitted changes
  belong to other agents/sessions in flight.
- No git add -A, commit, or push without explicit approval.

Please inspect current repository state and confirm with Andy on the open
commit decision, or proceed as directed.
```
