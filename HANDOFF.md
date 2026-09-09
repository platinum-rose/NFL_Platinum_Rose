# NFL_Dashboard — Session Handoff
> Auto-generated at session end. Read this to resume.

**Date:** 2026-09-08T00:00:00.000Z
**Branch:** main

## Current Pick Up Here (Codex-review triage + 3-way reconciliation + BKR/BetUS ingest closeout, 2026-09-08)

**Session closed 2026-09-08 21:04 UTC.** Full detail:
`handoffs/2026-09-08-2104-claude-session-close-handoff.md` (read this
first, it links everything else this session produced).

Summary: Codex independently reviewed the futures-portfolio pipeline
(`docs/CODEX_REVIEW_FUTURES_PORTFOLIO_PIPELINE_2026-09-08.md`) and returned
6 findings. Claude fixed 5 and corrected the 6th's denominator rather than
just flipping its threshold; Antigravity and Codex each independently
verified the fixes against live code (three handoffs dated 2026-09-08 in
`handoffs/`, all in agreement, nothing reverted). Andy then had Claude
ingest fresh BKR/BetUS futures odds
(`docs/Futures_Odds/BKR_Odds_0908`/`BetUS_Odds_0908` → parsed via
`scripts/parse-futures-text.js` → written via `scripts/ingest_futures_json.py`,
736 rows total). All of this is now folded into
`docs/audits/2026-09-08-intel-pipeline-map/PRE_COMMITTEE_CHECKLIST.md` and
the spec doc above, both updated in place.

**New team structure**: Antigravity now owns podcast+article ingestion
(already active — see `handoffs/2026-09-08-1405-antigravity-batch1-
exhaustion-handoff.md`, master-report corpus grew 79→83). Claude implements
portfolio-synthesis pipeline changes; Codex reviews/approves before
anything ships.

**Live state at close**: `main` 1 commit ahead of `origin/main` at `0fc6112`
(Codex's own commit, stuck on their invalid GitHub token, not a conflict).
Preflight: `3 BLOCK / 8 WARN / 22 PASS`, `safe_to_run_paid_synthesis: false`
— remaining blockers are `caesars`/`circa` odds gaps (bookmaker/betus now
fresh) and two stale intel files (player-availability, prediction-markets),
none of them code defects, none touched this session.

**Nothing committed/staged/pushed by Claude this session.** Two Supabase
writes occurred (the BKR/BetUS odds upserts above), both dry-run verified
first and explicitly authorized by Andy per-write.

**Next session**: pick up portfolio-synthesis pipeline implementation
(Claude) with Codex reviewing. Top open item per the spec doc's own
ranking: Section 5's source-weighting/interpretive-framing prompt guidance
for `vault_analytical_reads`/`training_camp_intel`/`master_reports`.

## Historical: fantasy-football session closeout, superseded above (2026-09-05 through 2026-09-08)

**Codex reconciliation note, 2026-09-08:** `HANDOFF_PROMPT.md` and
`WORKING-CONTEXT.md` have been refreshed for the next session's review of Claude
team's active portfolio-synthesis pipeline work. Live Git now shows `main`
aligned with `origin/main` at `d3d4b9e`; current dirty review targets are
`agents/portfolio-preflight.js` and `agents/portfolio-synthesize.js`. The
`board-validate.js` loose end below appears superseded in live code:
`agents/lib/board-validate.js` is clean and contains the `quotedComboFor()`
non-wins-market fix. Verify before relying on it, but do not start by blindly
committing/restoring that file.

This session (2026-09-05 through 2026-09-08) was entirely fantasy-football work
across The League and Honey Badgers. **The next session should pivot back to
the Futures/betting-portfolio pipeline** — see the loose end flagged at the
bottom of this entry before starting anything new there.

**What got done this session:**
1. Confirmed The League's pre-existing 2026 custom rankings/keeper files were
   current (`docs/fantasy/2026_The_League_Custom_Rankings.csv`,
   `..._Overall_Board_Detail.csv`, `THE_LEAGUE_2026_MASTER_KEEPER_REPORT.md`,
   `data/fantasy/the_league_declared_keepers_2026.json` — 11/12 teams locked).
2. Built `docs/fantasy/2026_The_League_Draft_Dossier_And_Turn_Playbook.html` —
   a pre-draft turn-by-turn playbook for Andy's slot-12 double-turn (1.12/2.01),
   simulated precisely from the ranked board + keeper file. **Note: this
   dossier's live-pick-numbering model (187 total live picks, assuming keeper
   rounds are skipped entirely) turned out not to match how the real draft
   software behaves** — see point 4 below. Superseded now that the real draft
   is done; keep only for historical reference if a similar dossier is ever
   built for another league.
3. Found and reported (not yet fixed) a real bug in
   `2026_The_League_Custom_Rankings.csv`: IDP players are wildly oversized
   (130 of 260 rows / 50% of the board) versus the Honey Badgers source board
   it was rescored from (40 of 260 / 15%) and versus what the real draft
   actually needed (see point 4: only ~35 IDP picks happened in the real
   17-round draft). Root cause suspected: the IDP replacement-level cutoff
   (132.9 pts) is too generous and let nearly every rosterable NFL LB/DB/DL
   clear it, unlike Honey Badgers' round-paced/quota-limited approach.
   **Not fixed yet** — a CBS Top-200 PPR cross-check was requested to help
   validate outliers before fixing, but stalled on a WebFetch
   `PROVENANCE_REQUIRED` approval error against cbssports.com that was never
   resolved. If picking this back up: either get the CBS list via an approved
   fetch/pasted text, or just apply the same round-pacing/quota curation
   Honey Badgers used directly.
4. **The League's 2026 draft happened and is fully ingested.** Andy pasted the
   full 17-round results as text; parsed into
   `data/fantasy/the_league_final_rosters_2026.csv` (204 rows, 12 teams × 17
   picks — schema matches the existing `league_id,team_id,team_name,
   player_name,nfl_team,position` convention). All 11 declared keepers
   cross-checked clean against the real results (right team, right round,
   right player). **Real-mechanic correction**: the draft platform auto-fills
   a team's keeper into their turn rather than skipping that turn entirely —
   so the real draft has the full 12×17=204 picks, not the 187 "live-only"
   picks the pre-draft dossier (point 2) modeled. Worth remembering for any
   future league draft-day tooling. Also flagged to Andy: his own team (Fat
   Lazy Americans) drafted zero kickers across all 17 rounds — K slot needs a
   waiver add.
5. **2026 final-roster status across all 4 leagues** (tracked in Cowork
   project memory `nfl_dashboard_final_roster_compilation.md`): Honey Badgers
   ✅ done, Rose Bowl ✅ done, The League ✅ done (this session), RFI
   Invitational still open — no 2026 keeper/draft-board/roster file exists for
   it yet. Andy's team there **is** "Fat Lazy Americans" (team_id 5 in the
   2025 file) — a wrong claim that it was "Tremendous Slouch" (a different
   team, team_id 1) was corrected 2026-09-08; Andy's team name is always
   "Fat Lazy Americans" in every league, full stop. Confirm RFI's 2026 draft
   status with Andy before doing any work on it.

**None of this session's file changes have been committed to git** — new/
changed files are `docs/fantasy/2026_The_League_Draft_Dossier_And_Turn_
Playbook.html` (untracked) and `data/fantasy/the_league_final_rosters_2026.csv`
(untracked), on top of the pre-existing dirty worktree below. Standing
guardrail unchanged: no `git add -A`/commit/push without Andy's explicit
approval, scoped `git add <files>` only when approved.

**Futures/portfolio loose end to pick up first, before anything new**: per
`nfl_dashboard_project.md`, a real bug fix in `agents/lib/board-validate.js`
(`quotedComboFor()` false-positived `no_matching_quote` on every non-wins-
market candidate — superbowl/conference/division/playoffs picks) was drafted,
verified three ways, and confirmed working in a mocked dry-run pipeline run on
2026-09-03, but **was never committed** — single-file change, awaiting Andy's
commit/push approval. Check whether that fix is still sitting uncommitted in
the worktree before doing any new futures-pipeline work; if so, get Andy's
approval to land it (or confirm someone else already did) before building on
top of it.

Standing constraints (unchanged): preserve dirty worktrees; no cleanup/reset/
stash/broad stage; no paid committee synthesis; no Supabase writes without
per-write authorization; no betting picks, official-pick promotions, or
portfolio mutations; no Yahoo Fantasy work without explicit approval.


## Historical: 2026-09-05 commit/push/M6 sync closeout (superseded above)

Resume in `E:\dev\projects\NFL_Dashboard`. Start with timestamped handoff
`handoffs/2026-09-05-1255-codex-commit-push-m6-sync-handoff.md`.

Live state verified by Codex on 2026-09-05:

- Local `main`, `origin/main`, and M6 `~/projects/NFL_Dashboard` were synced
  through work-stack commit
  `53c3967 chore: commit remaining approved dashboard artifacts`; this handoff
  closeout is a state-only commit on top.
- The 2026-09-04/05 commit stack is pushed: Tier 4 futures fixes, Antigravity
  final roster + Survivor Alpha work, master report guard, Survivor app wiring,
  intel hardening, The League custom rankings, Twitter harvester/vault sync
  agents, public schedule odds snapshot, and the remaining approved artifacts.
- M6 was fast-forwarded from `ee0931b` to `53c3967` after a fetch/overlap check.
  Its existing local dirty files were preserved: one modified active official
  pick proposal and untracked non-test Gmail summaries.
- Local Windows worktree intentionally remains dirty only for excluded items:
  `vite.config.js`, `.nfl/gmail-summaries/*test*`, sensitive Yahoo files, and
  scratch/tmp/probe piles.
- Handoff closeout updated `.atlas-bridge/memory.json`, `.nfl/session-log.jsonl`,
  this `HANDOFF.md`, and the timestamped handoff file.

Immediate next action: begin from live Git/status, then choose a single next
lane with Andy. Sensible candidates are portfolio-pipeline stabilization,
article-evidence/Bookmaker-BetUS capture integrity, or NFL Writers Room
adoption/config.

Standing constraints: preserve dirty worktrees; no cleanup/reset/stash/broad
stage; no paid committee synthesis; no live `agents/signal-normalize.js --source
pick_signal`; no Supabase writes; no betting picks, official-pick promotions, or
portfolio mutations; no Yahoo Fantasy work without explicit approval.


## Historical S243 Context (stale, retained for provenance)

Awaiting Codex Sign-Off: Alpha Testing Suite & Preseason Week 3 Sandbox Spec.
This section is superseded by the final-roster reconciliation pickup above
unless a future session explicitly resumes Alpha work.

Resume in `E:\dev\projects\NFL_Dashboard`.

Start with:

```powershell
git status --short --branch
git log -n 5 --oneline --decorate
npm run lint
npx vitest run
```

> **Test Suite Note:** `npm run lint` passes (0 errors, 8 warnings). `npx vitest run` executes 77 test files total, 72 passed / 5 failed (1,130 tests total: 1,122 passed / 8 failed) across 5 pre-existing/environment files (`predictionMarketEvidenceCleanup`, `preseasonBankrollTest`, `seasonHardcode`, `sportsRelevanceFilter`, `twitterBookmarksAgent`). `appTabRouting.test.js` is 100% green (20/20 passed).

> **Stale-inventory resolution (Claude, 2026-08-28):** Codex correctly flagged that the "Uncommitted Changes" list below no longer matches live Git. This file is dated 2026-08-26T20:52:00Z, before the most recent commit (`9fe8249`) and before all Alpha-spec work since. Verified directly: `src/App.jsx`, `src/components/layout/Header.jsx`, `src/lib/profiles.js`, and `tests/unit/appTabRouting.test.js` are **clean** in live Git (last touched in the older commit `958f499`, not currently dirty). `public/league_keeper_master_2026.json`, `src/components/injuries/InjuryCenter.jsx`, and `src/lib/injuries.js` **are** dirty live but are missing from the list below. The two `handoffs/*.md` entries below are stale too -- both are `git status`-confirmed **deleted** from their original path, with matching copies already in `handoffs/archive/`. HEAD itself is not in question -- `main` genuinely is `9fe8249`, matching `origin/main`. **Resolution: live `git status --short --branch` supersedes the list below -- use it as the source of truth, not this stale snapshot.** Codex, proceed with Phase 1 using live Git state. Do not touch `public/league_keeper_master_2026.json`, `InjuryCenter.jsx`, or `src/lib/injuries.js` -- they're pre-existing dirty work unrelated to the approved Phase 1 file list. Please re-run `hooks/scripts/build-handoff.js` at session close so this list is fresh for whoever picks up next.

Then read:

```text
HANDOFF.md
docs/specs/ALPHA_TESTING_SPEC.md
docs/fantasy/MASTER_BETTING_INTELLIGENCE_PACKET_2026.md
data/podcasts/actionable_betting_recommendations_2026.json
```

---


## 1. Accomplishments & Verification Summary (Session S243)

1. **100% Uncapped Podcast & Media Extractions (All 56 Master Reports Complete)**:
   - Extracted 100% exhaustive master reports across all 8 NFL divisions and 6 national podcast episodes (`even_money`, `bettingpros`, `sharp_or_square`, `favorites`).
   - Squeezed all speaker turns, rationale, odds, and timecoded quotes without artificial bullet ceilings.

2. **Master Actionable Betting Intelligence Suite (209 Recommendations)**:
   - Generated structured JSON dataset at [`data/podcasts/actionable_betting_recommendations_2026.json`](file:///E:/dev/projects/NFL_Dashboard/data/podcasts/actionable_betting_recommendations_2026.json).
   - Generated human-readable newsletter & user data packet at [`docs/fantasy/MASTER_BETTING_INTELLIGENCE_PACKET_2026.md`](file:///E:/dev/projects/NFL_Dashboard/docs/fantasy/MASTER_BETTING_INTELLIGENCE_PACKET_2026.md).

3. **Automated Live Sharp Vegas Odds Scraper**:
   - Implemented [`agents/vegas-web-odds-ingest.js`](file:///E:/dev/projects/NFL_Dashboard/agents/vegas-web-odds-ingest.js) and [`agents/lib/live-market-fallback.js`](file:///E:/dev/projects/NFL_Dashboard/agents/lib/live-market-fallback.js) supporting Circa Sports & STN Sports (Station Casinos).

4. **Injuries & Availability Intelligence Pipeline Integration**:
   - Resolved off-season empty state by connecting Dr. David Chao / PFF / Rotowire medical intelligence into [`src/lib/expertInjuries.js`](file:///E:/dev/projects/NFL_Dashboard/src/lib/expertInjuries.js) and [`src/lib/injuries.js`](file:///E:/dev/projects/NFL_Dashboard/src/lib/injuries.js).
   - Added medical recovery prognoses, betting impact warnings, and source attribution badges on [`src/components/injuries/InjuryCenter.jsx`](file:///E:/dev/projects/NFL_Dashboard/src/components/injuries/InjuryCenter.jsx).

5. **Formal Alpha Testing Specification (Addressing Codex Audit)**:
   - Alpha UI residue reverted; uncommitted S243 market/injury files preserved.
   - Drafted formal in-repo engineering specification [`docs/specs/ALPHA_TESTING_SPEC.md`](file:///E:/dev/projects/NFL_Dashboard/docs/specs/ALPHA_TESTING_SPEC.md) addressing storage conformance (`storage.js`), exact-5 contest validation, fresh deadline evaluation, real scoring engine, AI rate limiting, and error-checked telemetry.

1. **AFC North 2nd-Pass Intelligence Extraction**:
   - Run 2nd-pass extraction on raw diarized transcript JSON for the AFC North division preview (following NFC North S241 verification), then complete remaining division previews prior to production email dispatch.

2. **RFI Invitational Draft Order Simulation**:
   - As soon as RFI 2026 draft order drops, plug slot position into `docs/fantasy/LEAGUE_DRAFT_ORDERS_2026.json` and model Round 1 & 2 draft room availability.

3. **Track Incoming Opponent Keepers**:
   - Log declared keepers from opponent managers in *Honey Badgers*, *The League*, and *RFI* to refine available draft room pools.

4. **Email Digest Pipeline Dispatch**:
   - Run final dry-run verification of `agents/send-biweekly-digest.js` before any production email dispatch.


## Uncommitted Changes

These are intentionally preserved and excluded from the closeout commit.

### Modified
- scratch/article_nfl_preseason_week_2_results_seahawks_ti_master_100percent_exhaustive.md
- scratch/article_nfl_preseason_week_3_best_bets_master_100percent_exhaustive.md
- scratch/article_nfl_preseason_week_3_starting_quarterbac_master_100percent_exhaustive.md
- vite.config.js

### Untracked
- .nfl/gmail-summaries/*test*
- docs/Yahoo_API_keys
- docs/Fantasy Sports API access is now live.eml
- root scratch/probe files (`_audit_*`, `_pf_*`, `_t1_*`, `audit*_tmp.mjs`, etc.)
- scratch/ large research/tmp pile
- scripts/_tmp* and scripts_tmp_check_transcript.mjs

## In Progress
_No In Progress tasks._

## Last Session Summary
- **Duration:** unknown

---
_Resume by reading CLAUDE.md → this file → TASK_BOARD.md_
