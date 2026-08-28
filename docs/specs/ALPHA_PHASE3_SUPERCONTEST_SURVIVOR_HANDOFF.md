# Alpha Testing Suite — Phase 3 Implementation Handoff (SuperContest + Survivor)

**Canonical in-repo path (once approved):** `docs/specs/ALPHA_PHASE3_SUPERCONTEST_SURVIVOR_HANDOFF.md`

**Status:** DRAFT — awaiting Andy's review and explicit approval. No code has been written against this document. This is not a replacement for `docs/specs/ALPHA_TESTING_SPEC.md` v4.1 — it is the repo-grounded implementation authorization for that spec's §12 (SuperContest), §13 (Survivor), and §19 Phase 3, produced the same way the v4.1 master spec review caught real gaps in v2–v4 before Phase 1/2 were authorized.

Per master spec §2 and §19: no team may proceed from spec to code without explicit admin approval. This document exists to get that approval on record with the real gaps surfaced first, not discovered mid-build.

## 1. Live Repo State Verified

Checked directly against the checkout, not against HANDOFF.md prose (HANDOFF.md's own uncommitted-changes list is currently stale again — same pattern flagged 2026-08-28 for the prior round; live `git status --short --branch` is the source of truth, not this file).

- Branch: `main`, HEAD `9fe8249`, matches `origin/main`.
- Phase 1 + Phase 2 plumbing exists and is real: `src/lib/profiles.js` (4 Alpha tester profiles + `getPresetProfilesForMode`/`isAlphaTesterProfile` gating), `src/lib/storage.js` (`ALPHA_STATE_DOMAINS.SUPERCONTEST` and `.SURVIVOR` already registered, `getAlphaStorageKey`/`loadAlphaState`/`saveAlphaState` already implemented and key-collision-safe), `src/lib/alphaPacket.js` (packet/manifest validators), `data/alpha/alpha-packet-2026.json` + mirrored `public/alpha/alpha-packet-2026.json` (the real Alpha data bundle).
- The Alpha packet's own placeholder fields self-report the Phase 3 boundary: `supercontest_demo_lines` and `survivor_demo_slate` are both currently `{ "status": "not_built_phase_3_pending", "lines": [] / "games": [] }`. Nothing needs to be reverse-engineered here — the prior session left an explicit marker.
- `data.schedule` (272 entries) already carries `kickoff_utc` (ISO, UTC) and `spread` per game, exactly as master spec §6/§12.7 require. `alphaPacket.js`'s `validateScheduleKickoffs` already enforces this at packet-validation time.
- Grading primitives already exist and are reusable: `src/lib/picksDatabase.js` exports `gradeSpread(pick, homeScore, visitorScore)` (ATS win/push/loss against a locked line, home/away-aware) and `gradeMoneyline(pick, homeScore, visitorScore)` (straight-up win/loss). Both are pure functions — no owner-portfolio or Supabase coupling. `PR_STORAGE_KEYS.GAME_RESULTS` (`pr_game_results_v1`) is the existing results cache keyed by `gameId`, shape `{ homeScore, visitorScore, gradedAt }`.

## 2. Two Real Gaps Found (repo-grounded, not spec-text gaps)

### 2a. `src/components/supercontest/SuperContestView.jsx` cannot be "extended" into the tester experience — it is a different tool

Master spec §19 Phase 3a says "extend SuperContest into a weekly five-pick demo card." The existing `SuperContestView.jsx` (263 lines, most recently touched 2026-08-24) is Andy's own admin tool for entering/syncing a single spread **number** per game and tracking drift against it. Its own file-header comments say this explicitly: *"there is no 'which side did I take' concept anywhere in this data model — SuperContest only ever stored a single spread NUMBER per game, not a home/visitor selection."*

That is precisely the concept master spec §12.5 requires (`selectedTeam`, `opposingTeam`, one side per game, exactly five picks). The existing component has no side-selection UI, no five-pick limit, no per-profile scoping, no deadline/lock enforcement beyond a single global "lock timestamp on save," and is wired to the owner-only `nfl_contest_lines` key (`PR_STORAGE_KEYS.CONTEST_LINES`), not a profile-scoped Alpha key.

**Resolution proposed here:** these are two separate surfaces serving two separate roles already described in master spec §12.3 (`westgate` / `admin_override` / `preseason_live_demo` line sources):
- `SuperContestView.jsx` stays exactly what it is — the **admin line-entry tool** Andy uses to set/override the locked contest line (`admin_override` and `preseason_live_demo` sources). It is not touched by Phase 3 beyond, optionally, being the write path admins use to populate `data/alpha/alpha-packet-2026.json`'s `supercontest_demo_lines.lines[]`.
- A new, separate tester-facing component (proposed: `src/components/supercontest/SuperContestAlphaCard.jsx`) is Phase 3a's actual deliverable — the five-pick weekly card described in §12.4–12.9, reading the locked line the admin already set via the existing tool, never writing to `nfl_contest_lines`.

This keeps the owner's real admin workflow (which Andy uses live with his betting partner) completely unmodified, and avoids retrofitting home/away-selection and five-pick-limit logic into a component that was never designed for it.

### 2b. The Alpha email submission mechanism that master spec §9 and §12.9 assume does not exist yet

Master spec §9 says Alpha submission (portfolio, SuperContest, Survivor, feedback) goes through one manual email template mechanism, and §12.9 says "SuperContest should be included in the Alpha email submission template automatically." Searched the full `src/` tree for any `mailto`, submission-template, or sandbox-portfolio UI component: none exist. Phase 2's real, verified deliverable (confirmed by reading its own tests, `tests/unit/alphaDataPlumbing.test.js` and `alphaStorage.test.js`) is the **profile-scoped storage plumbing** for `ALPHA_SANDBOX_PORTFOLIO`/`ALPHA_FEEDBACK_DRAFTS` — there is no sandbox-portfolio UI component in `src/components` and no email-template builder anywhere in the repo yet.

This means "SuperContest included in the email template automatically" (§12.9) has no template to be included in. Two options, Andy's call:

1. **Scope the shared submission-template builder into Phase 3** (a small, shared `buildAlphaSubmissionEmail()` helper in `src/lib/` that SuperContest, Survivor, and the still-unbuilt sandbox portfolio UI can all feed into later) — adds real but bounded scope to Phase 3a/3b.
2. **Defer §9/§12.9 email-inclusion entirely to Phase 4** (master spec §19 already assigns Phase 4 to leaderboard/feedback/evidence capture, which is the more natural home for a shared submission mechanism) and have Phase 3a/3b ship SuperContest and Survivor as standalone tester-facing card UIs with local persistence only, no email step yet.

This document assumes **option 2** below (Phase 3 ships the cards; Phase 4 wires them into the shared submission template), since building a shared cross-feature email mechanism inside a spec that's supposed to be scoped to two specific game features is exactly the kind of scope-creep the v3→v4.1 review caught elsewhere (Westgate live-scrape creeping into the line-source model). Flagged here explicitly so Andy can override if he wants email wiring done now instead.

## 3. Phase 3a — SuperContest Tester Card

**New files:**
- `src/components/supercontest/SuperContestAlphaCard.jsx` — the tester-facing five-pick weekly card (§12.4–12.9 UI).
- `src/lib/supercontestAlpha.js` — pure card/pick-state helpers: `createDraftCard`, `applyPick` (one side per game, replaces prior side on same game per §12.6), `isCardConfirmable` (exactly five valid picks), `confirmCard`, `resetCard`, deadline evaluation (`getPickDeadline(game)` implementing §12.7's Sunday-10am-Pacific-else-kickoff rule — this logic does not exist anywhere in the repo today and must be written new), and a thin `gradeCard(card, results)` wrapper around the existing `gradeSpread` from `picksDatabase.js`.

**Storage:** `getAlphaStorageKey({ profileId, stateDomain: ALPHA_STATE_DOMAINS.SUPERCONTEST, season, week })` → already produces `nfl_alpha:{profileId}:supercontest:{season}:{week}:v1`. No storage.js changes needed — Phase 1 already registered this key.

**Line source:** reads `data/alpha/alpha-packet-2026.json`'s `supercontest_demo_lines.lines[]` (currently empty — populating this array with real locked lines per §12.1–12.3 is part of this phase's data work, not just UI). Each line entry needs `gameId`, `line`, `source` (`westgate` | `admin_override` | `preseason_live_demo`), matching §12.3.

**Grading:** on read, cross-reference `PR_STORAGE_KEYS.GAME_RESULTS` (already populated by the existing results pipeline) by `gameId`; where a result exists, call `gradeSpread({ isHomeTeam, line: lockedLine }, homeScore, visitorScore)` — reused as-is, not reimplemented. Where no result exists yet, pick stays `pending` per §12.8.

**Wiring:** add a `'supercontest'` entry to `ALPHA_VISIBLE_HUBS` in `src/lib/profiles.js` and a corresponding tab/route in `App.jsx`/`Header.jsx` (same double-gate pattern already used for the alpha-sandbox tab work referenced in the 2026-08-28 session: hub membership check + `OWNER_ONLY_TABS`/`AI_ONLY_TABS`-style guard so this tab is Alpha-tester-visible only, never exposing `nfl_contest_lines` or the owner's `SuperContestView.jsx`).

**Explicitly forbidden:** writes to `nfl_contest_lines`, any import of or write path into `src/components/supercontest/SuperContestView.jsx`'s state, any Supabase write.

## 4. Phase 3b — Survivor (net-new)

Confirmed net-new: no `Survivor*` file exists anywhere in `src/` today (master spec §13 already says this; verified by search, not assumed).

**New files:**
- `src/components/survivor/SurvivorAlphaView.jsx` — weekly single-team-pick UI: pick one team to survive the week, cannot reuse a team already picked in a prior week this season (the one Survivor-specific rule not covered by the SuperContest pattern — must be enforced against the profile's own pick history, read from the same storage domain).
- `src/lib/survivorAlpha.js` — pure helpers: `getPickHistory(profileId, season)` (reads all prior weekly entries under the Survivor domain for that profile), `isTeamAvailable(team, history)`, `makePick`, and a `gradeWeek(pick, results)` wrapper around the existing `gradeMoneyline` from `picksDatabase.js` (straight-up win/loss — Survivor has no spread).

**Storage:** `getAlphaStorageKey({ profileId, stateDomain: ALPHA_STATE_DOMAINS.SURVIVOR, season, week })` — already registered, same as SuperContest.

**Data source:** `survivor_demo_slate.games[]` in the Alpha packet (currently empty — needs populating from the same `schedule` array already in the packet; Survivor doesn't need a separate line, just the game list + `kickoff_utc` for its own deadline, which per §12.7-equivalent logic should reuse the same deadline helper built for 3a rather than a second implementation).

**Scope note for the estimate:** master spec §13 explicitly asks for Survivor to be "scoped and estimated separately from SuperContest" as new feature work. Relative to 3a, 3b is smaller in data-model surface (one pick per week vs. five, no line/drift concept, no admin-override path) but adds the one genuinely new rule — cross-week team-reuse validation — that has no analog anywhere else in the codebase to crib from.

**Explicitly forbidden:** any live survivor-pool standings integration, any real-money or sportsbook submission wiring (already excluded by master spec §13).

## 5. Shared Deadline Logic (built once, used by both 3a and 3b)

Proposed home: `src/lib/alphaDeadlines.js`, single exported `getPickDeadline(game)`:

- Default: Sunday 10:00 AM Pacific for the game's week.
- Override: if `kickoff_utc` is before that Sunday-10am-Pacific cutoff (Thu/Fri/Sat/international/early Sunday games), the deadline is that game's own `kickoff_utc`.
- Callers (SuperContest per-pick, Survivor per-week) evaluate "is this locked" at the moment of selection, edit, confirm, and submit — not from a cached render-time value — per master spec §12.7's explicit requirement.

This does not exist anywhere in the repo today (confirmed by search) and is real, non-trivial new logic — timezone handling around Pacific/UTC and DST matters here, and preseason Week 3 (the actual near-term Alpha test window) sits in September before the fall-back DST change, so `America/Los_Angeles` at UTC-7 can be hardcoded for the initial Alpha window, but the helper should not silently break once DST changes later in the season. Flagging so whoever builds this doesn't hardcode a fixed UTC offset that goes wrong in November.

## 6. Test Plan Additions

Following master spec §15's hybrid approach and the existing `tests/unit/alpha*.test.js` naming convention:

- `tests/unit/supercontestAlphaCard.test.js` — pick-replacement-on-same-game (§12.6), five-pick confirm gating, draft→confirmed→re-opened-to-draft-on-edit transition, grading via `gradeSpread` reuse, pending-vs-graded display logic.
- `tests/unit/alphaDeadlines.test.js` — Sunday-10am-Pacific default, kickoff-time override for Thu/Fri/Sat/international games, late-badge marking after deadline passes, evaluated-at-call-time behavior (not cached).
- `tests/unit/survivorAlphaView.test.js` — cross-week team-reuse rejection, profile isolation (tester A's Survivor history never visible to tester B), straight-up grading via `gradeMoneyline` reuse.
- Extend `tests/unit/alphaProfiles.test.js` or add a routing test confirming the new `'supercontest'`/`'survivor'` hubs are reachable only under `PROFILE_MODES.ALPHA` and that `master`/`andy`/owner futures surfaces stay unreachable from those tabs (same style as the existing gating tests referenced in the 2026-08-28 session summary).

## 7. Acceptance Criteria (subset of master spec §14 relevant to Phase 3)

- SuperContest functions as a demo-scoped five-pick weekly card, profile-isolated, deadline-enforced, graded against locked lines using the existing `gradeSpread` helper.
- Survivor functions as a demo-scoped weekly pick, profile-isolated, cross-week reuse enforced, graded using the existing `gradeMoneyline` helper.
- No cross-profile Alpha state leakage (verify by switching profiles and confirming card/pick state swaps fully, same verification method used for Phase 1/2).
- No writes to `nfl_contest_lines`, no writes to owner portfolio files, no Supabase writes.
- `supercontest_demo_lines` and `survivor_demo_slate` in the Alpha packet are populated with real data and pass `validateAlphaPacket`.
- Lint clean; new test files pass; known pre-existing failing files (`predictionMarketEvidenceCleanup`, `preseasonBankrollTest`, `seasonHardcode`, `sportsRelevanceFilter`, `twitterBookmarksAgent`) remain the only accepted backlog, unchanged by this phase.

## 8. Open Decisions Needing Andy's Sign-Off Before Codex Starts

1. **§2b above:** ship Phase 3 as standalone card UIs with local persistence only (email wiring deferred to Phase 4), or pull a shared email-submission helper into Phase 3 scope now?
2. **§2a above:** confirm the split — `SuperContestView.jsx` stays the admin line-entry tool untouched; `SuperContestAlphaCard.jsx` is new and separate. (This seems like the only sane reading of "extend," but it's a real scope decision, not a cosmetic one, so flagging for explicit confirmation rather than assuming it.)
3. Who actually populates `supercontest_demo_lines.lines[]` for the initial preseason Week 3 demo — admin manual entry through the existing `SuperContestView.jsx` sync-live-odds flow, or a one-time script pulling from `packet.schedule`'s existing `spread` field? Either is spec-compliant (§12.1 allows live public lines for the Week 3 demo only); just needs a decision so Codex isn't guessing.

No implementation should begin until Andy responds to these three points and gives explicit go-ahead per master spec §2/§19/§20.
