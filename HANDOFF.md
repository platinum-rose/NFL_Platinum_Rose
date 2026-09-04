# NFL_Dashboard — Session Handoff
> Auto-generated at session end. Read this to resume.

**Date:** 2026-09-04T11:23:32-07:00
**Branch:** main

## Current Pick Up Here (fresh NFL dev session - local main ahead by 1)

Resume in `E:\dev\projects\NFL_Dashboard`. Start with timestamped handoff
`handoffs/2026-09-04-fresh-nfl-dev-and-writers-room-ingest-handoff.md`.

Live state verified by Codex:

- `main` is ahead of `origin/main` by 1 commit.
- Local HEAD is `65d47e3 fix(futures): repair data-correctness, prompt-assembly, and fail-loud gaps in the portfolio pipeline`.
- `origin/main` is `2c9334a feat(futures): add scale-in entry pattern to Risk/Editor stage`.
- Antigravity has already ingested final roster snapshots for Honey Badgers and
  Rose Bowl:
  - `data/fantasy/honey_badgers_final_rosters_2026.csv` - 204 rows, 12 teams,
    17 players/team.
  - `data/fantasy/rose_bowl_final_rosters_2026.csv` - 204 rows, 12 teams,
    17 players/team.
- The referenced project-memory file `nfl_dashboard_final_roster_compilation.md`
  was not found by exact filename/text search in the repo, hidden/ignored repo
  paths, or local Codex memory folder.
- No separate 2026 round-by-round draft-results artifact was found. The current
  Honey Badgers/Rose Bowl CSVs are roster snapshots only; they do not include
  round, pick number, keeper cost, or drafted-at metadata.
- NFL comedy voice sample was ingested as private source prep under
  `docs/writers-room/nfl-comedy-voice/`; this is separate from Abracadickface and
  does not mean NFL_Dashboard has completed Writers Room adoption.

Immediate next action: start with live Git reconciliation and inspect scoped
diffs before editing. Highest-signal dev lane is to review/verify the local
portfolio-pipeline commit `65d47e3` and related dirty files, then decide whether
to continue portfolio integrity, article-evidence/Bookmaker-BetUS capture, or
NFL Writers Room adoption as an explicitly approved lane.

Preserve the dirty worktree. Do not clean, reset, stash, broad-stage, commit,
push, run paid committee models, write Supabase, or mutate picks/portfolios
without explicit approval.

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

### Modified
- HANDOFF.md
- agents/portfolio-synthesize.js
- data/official-picks/proposals/active/candidate-prop-stack-twitter-bm-kc-rice.json
- data/official-picks/proposals/active/candidate-supercontest-week1-bills.json
- scripts/triage-unverified-intel.js
- scripts/verify-intel-sources.js
- vite.config.js

## In Progress
_No In Progress tasks._

## Last Session Summary
- **Duration:** unknown

---
_Resume by reading CLAUDE.md → this file → TASK_BOARD.md_
