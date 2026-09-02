# 🏈 Claude Handoff: Intel Robustness Audit — 4 Items for Fresh Session

> **Date:** September 2, 2026
> **Author:** Claude (Cowork)
> **Target:** Next Claude session, Andy
> **Status:** BettorDay pipeline audit + wiring fully closed out this session (see prior handoff `2026-09-01-2030-antigravity-bettorday-intel-and-dossier-hardening-handoff.md` and the follow-on wiring commit `3df565e`). Andy then asked for a broader intel-robustness audit and whether it's time for a full portfolio synthesis. Answer: **not yet** — 4 concrete items should happen first, listed below in priority order. No fixes were made this pass; this is audit-only, handed off clean.

---

## 0. Context: why synthesis should wait

`.nfl/portfolio/dossier-2026-09-01.json` fails `scripts/check-dossier-freshness.js` — the new `bettorday_trench` evidence lane (added this session to `scripts/lib/dossier-freshness-gate.js`) was missing when that dossier was built. The gate's own output says plainly: *"Do NOT run a fresh synthesis against this dossier. Rebuild it first."* That alone blocks synthesis regardless of anything else below.

---

## 1. Rebuild the portfolio dossier (blocking)

Run `agents/portfolio-dossier.js` fresh so it picks up the newly-live BettorDay trench/SOS data cleanly, then re-check with `scripts/check-dossier-freshness.js --dossier <new file>` to confirm it now passes. This is a prerequisite for any synthesis run, not optional.

## 2. Diagnose the 4 down research-intel feeds

Per `feed_health` (migration 051, live): 7/11 feeds healthy (BettingPros, PFF, Pro Football Talk, Rotowire, Sharp Football, VSiN, Walter Football). 4 down:
- **Action Network** — `"Unsupported content-type: text/html; charset=utf-8"`, 3 consecutive fails, alert already sent 2026-09-01T23:11.
- **ESPN NFL** — same content-type failure, same alert batch.
- **THE WINDOW (Matt Russell)** — HTTP 403, 3 consecutive fails, same alert batch. New failure, not previously tracked on `TASK_BOARD.md`.
- **Football Outsiders** — `error` status, 6 consecutive fails, `last_success_at: null`. Already tracked as `B-footballoutsiders-feed-dead` (P3, domain-level, likely genuinely dead — lower priority than the other 3).

**Lead worth checking first:** direct `curl` from this Cowork environment pulled both Action Network's and ESPN's feeds cleanly (200, correct `text/xml`) — same symptom pattern as the already-fixed `B-actionnetwork-feed-403` CloudFront/Node-`fetch()`-fingerprinting issue (`agents/research-intel-ingest.js`'s `fetchViaCurl()` / `fetchMethod: 'curl'` pattern). Worth trying the same curl-shellout fix on ESPN NFL and THE WINDOW before assuming a real outage. Could not confirm from job logs — anonymous GitHub API access 403s on log downloads (`Must have admin rights`) — so the last 3 scheduled `research-intel-ingest.yml` runs showing `conclusion: failure` couldn't be root-caused beyond what `feed_health` already shows; this is consistent with the intentional "stay red while any feed is down" design (see `feed_health` alerting section of `TASK_BOARD.md`'s DATA-LAYER-LOCKDOWN row), not necessarily a new regression, but not confirmed either way.

## 3. Re-run intel verification scoring

`intel_verification` (migration 049) hasn't run since **2026-08-30** (3+ days stale) and only covers **713 of 2,657** `research_intel_notes` rows (~27% coverage) — the rest of the growth since 08-30 has never been corroboration/conflict-scored. `scripts/verify-intel-sources.js` is confirmed **not scheduled anywhere** (manual-only). Re-run it (with `--write`) before feeding a large slice of unscored intel into a committee synthesis.

## 4. Decide what to do with the orphaned 2026-09-01 committee run

`futures_recommendation_runs` shows a run from **2026-09-01** that used only **1 model** (`{"of":1,"count":1,"models":["gpt-4.1"]}`), not the intended multi-model committee. It reached `risk_passed` (10 candidates) but **never reached `final`** — no recommendations actually came out of it — and it is **not mentioned anywhere in `HANDOFF.md`**, so nobody currently knows why it ran single-model or why it stalled. Needs a decision: investigate why (check `agents/portfolio-synthesize.js` invocation history / logs for that timestamp), or treat it as an abandoned test run and move on. Either way, don't let a second synthesis run layer confusion on top of an undiagnosed first one.

---

## Also verified this session (no action needed)

- `docs/podcast-narratives/index.json` — still stale (37 vs. 47 live episodes in `podcast_host_summaries`), unchanged from the prior session's finding, still explicitly deferred (blocked on the Obsidian vault write-path issue). No new information.
- `research_intel_notes` itself is fresh (2,657 rows, latest captured 2026-09-02 same day) — the 7 healthy feeds are keeping data flowing despite the 4 down ones.
- DATA-LAYER-LOCKDOWN's 5-item sequence: items 1-4 confirmed complete as of 2026-09-01 per `TASK_BOARD.md`. Item 5 ("full re-verification against a real dossier build") is exactly items 1 + 3 above — this handoff is effectively scoping that final item.
- Neither `agents/portfolio-dossier.js` nor `agents/portfolio-synthesize.js` is scheduled in any GitHub Actions workflow — both remain manual, one-off invocations by design.

---

## Standing Constraints & Guardrails

- Preserve the dirty worktree — large pre-existing uncommitted changes belong to other in-flight sessions/agents (Antigravity mid-edit on several shared files, per `TASK_BOARD.md`'s DATA-LAYER-LOCKDOWN row). Do not `git add -A`, stash, or revert anything not directly touched this pass.
- No Supabase writes, betting/pick-action/portfolio mutation, or **paid model/API calls** (this includes actually running `portfolio-synthesize.js` for a real committee pass) without Andy's **explicit, direct** authorization — distinct from authorizing a data-ingest write.
- No Yahoo Fantasy work.
- Commit/push only with explicit per-instance approval.

---

## 📋 Resume Prompt

```
Resume NFL Dashboard development from handoff: `handoffs/2026-09-02-intel-robustness-audit-handoff.md`.

Context snapshot:
- BettorDay intel pipeline fully audited, fixed, and wired into the canonical committee pipeline (agents/portfolio-synthesize.js) as of commit 3df565e. Live Supabase sync confirmed (64 trench + 10 newsletter records).
- Intel-robustness audit (2026-09-02) found synthesis is NOT yet ready: the local dossier fails the freshness gate (new bettorday_trench lane), 4/11 research-intel feeds are down (Action Network, ESPN NFL, THE WINDOW, Football Outsiders), intel_verification scoring is 3+ days stale (~27% coverage), and an orphaned single-model 2026-09-01 committee run never reached "final" and is undocumented.
- Four items to work through in order: (1) rebuild the portfolio dossier, (2) diagnose/fix the down feeds (try the existing curl-shellout fix pattern from agents/research-intel-ingest.js on ESPN NFL / THE WINDOW first), (3) re-run scripts/verify-intel-sources.js --write, (4) decide what to do with the orphaned Sep 1 committee run.

Standing constraints:
- No Supabase writes, betting/portfolio mutation, or paid model/API calls (including an actual portfolio-synthesize.js committee run) without Andy's explicit authorization.
- Preserve the dirty worktree -- large pre-existing uncommitted changes belong to other agents/sessions in flight.
- No git add -A, commit, or push without explicit approval.

Please inspect current repository state and proceed with item (1) unless Andy directs otherwise.
```
