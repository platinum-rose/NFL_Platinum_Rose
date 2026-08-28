# NFL Dashboard Alpha Testing Suite Specification v4.1

**Canonical in-repo path:** `docs/specs/ALPHA_TESTING_SPEC.md`

**Supersedes v4.** This v4.1 revision incorporates the Codex review, Claude team v3/v4 review notes, and direct admin decisions on profile identity, profile-scoped Alpha state, SuperContest behavior, AI disabling, Alpha packet/submission fallbacks, and the Alpha v1 Westgate scrape boundary.

## 1. Objective

The NFL Dashboard Alpha Testing Suite validates the private Alpha experience for a small group of real fantasy-football and betting-oriented users. The Alpha must prove that the dashboard is functional, profile-aware, data-complete, and safe to use without hidden paid API calls, owner-funded AI usage, Supabase writes, real betting execution, owner portfolio mutation, or cross-profile data leakage.

Alpha success means each tester can use the dashboard for their own teams, fantasy leagues, NFL interests, preseason Week 3 review, sandbox portfolio planning, SuperContest, Survivor, injuries, schedule, and market-context workflows.

SuperContest and Survivor are demo-scoped for Alpha v1. They must work end-to-end against sandbox/canned data, but do not need live contest standings, live contest results, real-money wiring, or sportsbook submission wiring during this Alpha window.

## 2. Governance

No implementation, code edits, data mutation, Supabase/Postgres writes, paid API calls, AI token usage, betting submissions, pick placement, owner portfolio mutation, commits, or pushes may occur without explicit admin approval.

The Alpha suite must distinguish between:

- Local/offline deterministic QA
- Live public read-only data checks
- Tester-owned sandbox state
- Manual email submission workflows
- Deferred paid/API/AI workflows requiring separate approval

The Alpha suite may use Supabase reads if already configured. Supabase writes are forbidden for Alpha v1 unless separately approved by the admin.

Implementation must remain phase-gated. No team may proceed from spec to code, code to tests, tests to commit, or commit to push without explicit admin approval.

## 3. Target Users And Identity Model

Alpha users are a small private cohort of real fantasy league managers and betting-focused dashboard users, each testing from their own device and browser.

Alpha identity must be built on the `PRESET_PROFILES` model in `src/lib/profiles.js`. Today, `PRESET_PROFILES` contains the owner's household/navigation presets (`master`, `amanda`, `andy`), not tester identities. Phase 1 must extend this model for Alpha tester identities without breaking the owner's existing daily-use profile state.

Implementation may either add Alpha tester entries to the same exported profile catalog or split the catalog into owner and Alpha exports, but the runtime behavior must be unambiguous:

- Owner/admin mode may keep `master`, `amanda`, and `andy`.
- Alpha tester mode must expose only Alpha tester profiles.
- Alpha tester profiles must not expose `master`, `andy`, owner-only futures portfolio surfaces, or AI agent/API-key entry points.
- Existing values already stored under `PROFILE_KEY = 'nfl_user_profile_v1'` in the owner's browser must not be overwritten or migrated destructively.

Fantasy leagues remain domain data linked from the tester profile. The four supported fantasy league IDs are exactly:

- `the_league`
- `honey_badgers`
- `rfi_invitational`
- `rose_bowl`

Each Alpha `PRESET_PROFILES` entry may include:

- Profile id
- Real name
- Nickname/display label
- Email
- League/team bindings
- Favorite NFL teams
- Fantasy roster references
- Draft slot
- Keeper locks
- Allowed hubs/features
- Alpha role, such as `admin` or `tester`

Users may manually switch profiles. All Alpha-specific state must remain isolated per profile. No tester may see another tester's private profile data except through the intended leaderboard peer-comparison surface.

Phase 1 must explicitly document the final profile catalog shape by filename and export name, including how Alpha tester profiles are filtered from owner/admin profiles in the UI.

## 4. Profile-Scoped Alpha State

Alpha-owned state must be namespaced by profile. The v3 downgrade that allowed local profile bleed is rejected for v4.

At minimum, these Alpha state domains must be profile-scoped:

- Sandbox portfolio
- SuperContest weekly card
- Survivor pick/history
- Feedback drafts
- Profile-local settings and filters
- Evidence capture/session metadata

Recommended key pattern:

`nfl_alpha:{profileId}:{stateDomain}:v1`

For weekly or season-based records:

`nfl_alpha:{profileId}:{stateDomain}:{season}:{week}:v1`

Example:

`nfl_alpha:honey_badgers:supercontest:2026:preseason_week_3:v1`

The implementation should keep `PR_STORAGE_KEYS` in `src/lib/storage.js` as the central storage registry, but Alpha keys must still be derived or registered in a way that prevents one profile's Alpha data from reading or overwriting another profile's Alpha data.

Switching profiles must immediately swap to that profile's saved Alpha state. It must not show or mutate the prior profile's SuperContest card, Survivor state, sandbox portfolio, feedback draft, or settings.

## 5. Scope

Alpha v1 includes:

- Dashboard overview
- NFL team dashboards
- Schedule views
- Injury center
- Fantasy profile switching
- Fantasy team packets
- Market-context display
- Preseason Week 3 usage paths
- Sandbox portfolio creation/save/submit
- SuperContest experience, demo-scoped
- Survivor experience, demo-scoped
- Alpha leaderboard, admin-aggregated
- Manual feedback and evidence capture
- BYO AI setup documentation only

Alpha v1 excludes:

- Built-in AI agent chat usage for Alpha testers
- In-app API key storage for Alpha testers
- Supabase writes
- Paid API calls
- Real betting execution
- Owner portfolio mutation
- Public launch readiness
- Full production authentication/roles beyond admin/tester expectations
- Live odds/results wiring for SuperContest or Survivor
- Cross-device/cross-tester real-time state sync

## 6. Data Packet

Preferred format: one ingestible Alpha JSON bundle containing all required Alpha data.

The Alpha bundle should include:

- `schema_version`
- `generated_at`
- `season`
- `alpha_window`
- `profiles`
- `fantasy_leagues`
- `fantasy_team_packets`
- `nfl_team_dashboards`
- `schedule`
- `injuries`
- `market_context`
- `supercontest_demo_lines`
- `survivor_demo_slate`
- `source_provenance`

If the bundle becomes too large or difficult to maintain, use a manifest-based fallback:

- `alpha_manifest.json`
- Split profile files
- Split fantasy team packet files
- Split NFL team dashboard files
- Split injury files
- Split schedule files
- Split market-context files
- Split SuperContest demo-line files
- Split Survivor demo-slate files
- Source/provenance metadata for each file

The manifest must act as the single import target and must include paths, checksums or content hashes where practical, schema versions, generated timestamps, and required profile IDs.

The data packet must support all four fantasy league IDs and all relevant NFL/fantasy dashboard surfaces. "All intel complete" means fantasy team packets, NFL team dashboards, injuries, schedule context, market context, and currently available app data needed for Alpha workflows are present and inspectable.

Schedule data must carry `kickoff_utc` per game, sourced from `agents/schedule-ingest.js` output or an equivalent canonical schedule source. Do not hand-maintain a second copy of kickoff times in SuperContest or Survivor code. Confirm in the implementation report which packet file(s) carry this field and that it was copied through unmodified from the ingest source.

## 7. Data Safety

Live public data may be read when available. Cached/local fallback data should be used when live public data is unavailable.

Manual user-entered odds/lines are allowed for tester-owned sandbox workflows. They must be labeled as tester-entered data and must not be treated as verified market data unless separately validated.

The app must clearly label sandbox portfolios as tester-owned Alpha artifacts, separate from the admin's real portfolio, historical picks, official picks, or official records.

The tester sandbox portfolio must use a separate mutating/persistence path from `FuturesPortfolio.jsx` and the owner's real portfolio ledger files. Reuse of pure helper functions is allowed only if those helpers cannot read, write, mutate, persist, or infer ownership from owner portfolio state.

Implementation handoff must state, by filename, which component and storage key are used for tester sandbox portfolios and must confirm they are isolated from:

- `src/components/futures/FuturesPortfolio.jsx`
- `data/futures-imports/andy-portfolio-ledger-2026.json`
- `agents/portfolio-dossier.js`
- `agents/portfolio-simulate.js`
- `agents/portfolio-synthesize.js`

## 8. AI Policy

AI agent chats are disabled for Alpha testers in Alpha v1.

Existing AI/API-key entry points must be hidden, disabled, or gated out of Alpha tester profiles. This includes, at minimum, the agent chat surfaces and any API-key entry/storage UI exposed through:

- `src/components/agent/AgentChat.jsx`
- `src/components/agent/FuturesAgentChat.jsx`
- `src/components/agent/PropsAgentChat.jsx`
- `src/components/agent/PersistentAgentSidebar.jsx`
- `src/components/modals/AudioUploadModal.jsx`

BYO AI setup may be documented for Claude, Codex, Gemini, OpenAI, or similar services, but Alpha v1 must not store tester API keys in the app.

Any future in-app API key support requires a separate secure design review.

No owner-funded AI calls may occur during Alpha testing.

## 9. Submission And Feedback

Alpha portfolio, SuperContest, Survivor, and feedback submission uses a manual email link/template to:

`andrewlrose@gmail.com`

Submission must not write to Supabase or any remote database in Alpha v1.

The email template should include:

- Tester profile
- Active tab/flow
- Sandbox portfolio summary
- SuperContest card summary
- Survivor pick/status
- Notes/feedback
- Screen size
- Browser/user agent
- Timestamp
- Optional screenshot attachment prompt

If `mailto:` generation fails or the generated email body is too long, the app must show a clear fallback:

- Copyable plain-text submission body
- Downloadable JSON attachment containing the same submission payload
- Clear instruction to email the copied text or JSON attachment to `andrewlrose@gmail.com`

If submission generation fails entirely, the app should show a clear error and provide a local/manual fallback path.

Every tester-submitted email is the only path data takes off a tester's device in Alpha v1.

## 10. Leaderboard Data Flow

The Alpha leaderboard is the only peer-comparison surface.

After receiving tester email submissions, the admin manually transcribes relevant summary data into one shared, admin-maintained file:

`data/alpha/leaderboard.json`

The app reads this file read-only to render the leaderboard. This is a manual, admin-driven update cycle, not real-time sync. The leaderboard reflects whatever has been transcribed as of the last time `leaderboard.json` was updated and the app was reloaded or redeployed with it.

The leaderboard UI must show a visible "as of" timestamp from `leaderboard.json`, so testers do not mistake it for live sync.

It should show real profile labels and compare:

- SuperContest performance
- Survivor status
- Sandbox portfolio ROI or status

SuperContest scoring should use:

- Win: 1.0
- Push: 0.5
- Loss: 0.0

Leaderboard calculations must avoid missing props, duplicate keys, `NaN`, broken formatting, and misleading zero/empty states. If `leaderboard.json` has no entry yet for a given profile, show an explicit "no submissions yet" state rather than a zero that reads as a real score.

## 11. Critical Flows

Each Alpha tester should be able to complete:

1. Select or switch to their profile.
2. Confirm their fantasy team packet and profile identity.
3. Review dashboard overview.
4. Review relevant NFL team pages.
5. Review schedule and injury context.
6. Review market context without triggering paid APIs.
7. Create and save a tester-owned sandbox portfolio.
8. Submit the sandbox portfolio through the admin email template.
9. Make SuperContest picks in the Alpha sandbox.
10. Make a Survivor selection in the Alpha sandbox.
11. Compare leaderboard status using real profile labels, reflecting the admin's most recently transcribed `leaderboard.json`.
12. Submit manual feedback with context metadata.

## 12. SuperContest Requirements

The UI label is **SuperContest**.

For Alpha v1, SuperContest is a demo of what the live in-season contest experience will look like. It is not a betting surface, sportsbook submission surface, or real-money workflow.

The SuperContest experience must display locked SuperContest lines from the Westgate SuperContest once those lines are available in season. It must also allow admin override if the local contest line differs from the Westgate line.

### 12.1 Alpha Preseason Week 3 Demo

Because there are no official locked Westgate SuperContest lines for preseason Week 3, the Alpha demo may use live public lines as temporary demo locked lines.

This live-line seeding is allowed only for the first preseason Week 3 Alpha demo. It must be labeled clearly as "Demo / Preseason Week 3 test only."

After the preseason Week 3 demo, SuperContest lines must come only from:

1. Westgate SuperContest line scrape/import, once available.
2. Admin manual entry fallback.

Live-line sync must not become a normal future SuperContest behavior.

### 12.2 Contest Setup

All games on the slate should render.

Games with no available contest/demo line should show `Line unavailable`.

Games without a valid line should not be selectable unless the admin has entered or imported a line.

Only the admin may override contest lines.

Alpha testers do not need to see original-vs-override comparison. They should simply see the active locked contest line.

### 12.3 Line Source

Each game line should track its source:

- `westgate`
- `admin_override`
- `preseason_live_demo`

The implementation should be designed so future Westgate sourcing can be automated by scrape/import once lines are published. The exact scrape source and method can be finalized later, but the data model should not assume manual entry is the only permanent source.

Alpha v1 uses `admin_override` and `preseason_live_demo` only. No live Westgate scrape/import is built or run in Alpha v1; that requires separate approval and review.

### 12.4 Weekly Card Model

Each profile gets one SuperContest card per week.

Cards must be keyed by:

`profileId + season + week`

Recommended storage key:

`nfl_alpha:{profileId}:supercontest:{season}:{week}:v1`

Each card should track:

- Profile id
- Season
- Week
- Card status: `draft`, `confirmed`, `closed`
- Selected picks
- Created timestamp
- Updated timestamp
- Confirmed timestamp
- Submission/email timestamp, if submitted
- Reset timestamp or reset history

### 12.5 Pick Model

Each pick should track:

- Game id
- Away team
- Home team
- Selected team
- Opposing team
- Locked SuperContest line
- Line source
- Kickoff time
- Pick deadline
- Selected timestamp
- Confirmed timestamp
- Locked status
- Late status
- Result: `pending`, `win`, `loss`, `push`
- Points: `null`, `1`, `0.5`, or `0`

### 12.6 Pick Rules

Users may save a draft with fewer than five picks.

Users may select only one side per game. Selecting the other side of the same game replaces the prior side rather than adding a sixth pick.

Final confirmation requires exactly five valid picks.

The card may remain in draft state with fewer than five picks, but it must not be considered confirmed/submitted until exactly five valid picks are selected and the user confirms.

The confirm action should be disabled until exactly five valid picks are selected.

Users may change unlocked picks before the applicable deadline.

If a confirmed card is edited before applicable deadlines, it returns to `draft` until re-confirmed.

Reset/delete card is allowed for Alpha demo testing, but it must affect only the active profile's current weekly card.

### 12.7 Deadline Rules

Default weekly deadline: Sunday 10:00 AM Pacific.

Thursday, Friday, Saturday, and international games lock at their own kickoff time.

Any game kicking off before Sunday 10:00 AM Pacific locks at kickoff.

Sunday games after 10:00 AM Pacific lock at Sunday 10:00 AM Pacific.

For Thursday/Friday/Saturday/international/early games, only that individual pick locks at kickoff. The rest of the card remains editable until each remaining pick's applicable deadline.

After a pick locks, changing or removing it is prevented.

Late badge rule:

- Once a pick's deadline has passed, the user cannot change or remove it.
- If a pick was already selected/confirmed after its applicable deadline during Alpha/demo testing, it remains visible and is badged `LATE SUBMISSION`.
- In production/in-season use, the UI should prevent late submission wherever possible.
- The late badge is an audit/status marker, not permission to keep editing after lock.

Deadline comparisons must use the `kickoff_utc` field from the canonical schedule data. Do not use stale render-time clocks; deadline checks must evaluate the current time at the moment of selection, edit, confirmation, and submission.

### 12.8 Tracking And Grading

Results should come from schedule/results data when available.

Scoring follows classic SuperContest scoring:

- Win: 1.0
- Push: 0.5
- Loss: 0.0

Picks must be graded against the locked contest line, not live closing line.

Ungrading or unavailable results should show `pending`.

Card totals should either:

- Ignore pending games in a clearly labeled current-points display, or
- Show `current points / possible points`.

Do not imply final score while any pick is pending.

### 12.9 Email Submission

SuperContest should be included in the Alpha email submission template automatically.

The email should include:

- Profile
- Season/week
- Card status
- Selected teams
- Locked lines
- Line source
- Kickoff times
- Pick deadlines
- Selected timestamps
- Confirmed timestamps
- Late flags
- Pending/win/loss/push status
- Total points if available

Screenshots are not required for SuperContest acceptance, though browser evidence during implementation is still expected for core flow verification.

## 13. Survivor Requirements

Survivor is demo-scoped for Alpha v1.

Survivor is a net-new build; there is no existing Survivor component to extend. It should be scoped, estimated, and reviewed as new feature work.

Survivor state must persist under the active profile only.

Recommended storage key:

`nfl_alpha:{profileId}:survivor:{season}:{week}:v1`

Switching profiles must not leak Survivor selections, SuperContest cards, or sandbox portfolio state.

No live survivor pool standings, real-money wiring, or sportsbook/pool submission wiring is required in Alpha v1.

## 14. Acceptance Criteria

Alpha-specific acceptance requires:

- No app crashes in core flows
- No cross-profile Alpha state leakage
- No hidden paid API calls
- No owner-funded AI/token usage
- No Supabase writes
- No owner portfolio or official pick mutation
- Profile switching works for all Alpha profiles
- Sandbox portfolio save/submit works through email/manual flow
- SuperContest functions as a demo-scoped real Alpha experience
- Survivor functions as a demo-scoped real Alpha experience
- Live public data reads degrade gracefully to cached/local data
- Required Alpha packet is ingestible, including `kickoff_utc` on schedule entries
- Feedback capture produces usable admin-facing reports
- Leaderboard renders correctly from `leaderboard.json`, including empty/no-submission-yet state
- Core desktop and mobile views are usable

Minor cosmetic issues are acceptable if they do not block core Alpha workflows.

## 15. Test Strategy

Use a hybrid test approach:

- Unit tests for profile-scoped Alpha storage
- Unit tests for corrupted/missing localStorage recovery
- Unit tests for SuperContest pick rules, deadline rules, late badges, and grading
- Unit tests for Survivor profile isolation
- Unit tests for leaderboard scoring and empty-state handling
- Unit tests or smoke tests proving Alpha tester profiles cannot access AI chat/API-key entry points
- Smoke tests for core routing and dashboard rendering
- Browser-based manual tests with screenshots/video evidence
- Real tester feedback during preseason Week 3 usage

Known non-Alpha global test failures may remain accepted backlog if documented accurately. Test reports must state the exact command, total tests, passing tests, failing tests, and failing files. Selective test results must never be described as full-suite success.

## 16. Browser And Device Coverage

Minimum Alpha coverage:

- Desktop Chrome
- Desktop Edge or Firefox
- Mobile-width responsive Chrome simulation
- At least one real mobile device if available

Evidence should include screenshots for profile switching, dashboard load, fantasy packet review, portfolio submission, SuperContest, Survivor, leaderboard, and feedback flow.

## 17. Bug Triage

Use these categories:

- P0 Blocker: crash, data loss, cross-profile Alpha leakage, paid/API call violation, Supabase write, owner portfolio mutation, real betting action
- P1 Critical: core Alpha flow unusable, incorrect profile binding, broken submission, incorrect contest/survivor persistence, incorrect SuperContest deadline enforcement
- P2 Major: misleading data display, broken leaderboard math, stale-data labeling issue, important browser/device failure, SuperContest grading bug
- P3 Minor: cosmetic issue, layout polish, non-core broken button, copy adjustment
- Backlog: known pre-existing tests or deferred enhancements not blocking Alpha

## 18. Pass/Fail Gates

Alpha may proceed only if:

- Alpha-specific unit/smoke tests pass
- Lint has 0 errors and known warnings reviewed
- Core flows pass browser verification
- No forbidden write/API/betting behavior is observed
- Data packet loads for all Alpha profiles, with `kickoff_utc` present on schedule entries
- Admin email submission path works or has a clear fallback
- `leaderboard.json` read path renders correctly, including empty states
- Known failures are documented as accepted backlog

Alpha must stop if any P0 issue appears.

## 19. Implementation Phases

**Phase 1: Profile and data fixtures**

Extend/verify `src/lib/profiles.js` so `PRESET_PROFILES` is the Alpha identity layer. Link profiles to fantasy league/team data, profile identity fields, and Alpha packet ingestion. Confirm `kickoff_utc` is present in schedule entries. Implement profile-scoped Alpha storage helpers or key derivation.

**Phase 2: Sandbox portfolio and submission**

Implement tester-owned sandbox portfolios with their own component and profile-scoped storage path. Keep all mutating/persistence paths separate from the owner's real portfolio. Add manual email submission and fallback export/copy behavior.

**Phase 3: SuperContest and Survivor**

3a: Build/extend SuperContest into a weekly five-pick demo card with locked lines, admin-only override, profile-scoped storage, deadline enforcement, late badge audit state, schedule/results grading, and email inclusion.

3b: Build Survivor as net-new demo-scoped functionality. Scope and estimate separately from SuperContest. No live results wiring beyond schedule/results data needed for demo tracking.

**Phase 4: Leaderboard, feedback, and evidence capture**

Implement `data/alpha/leaderboard.json` as the admin-maintained, app-read-only leaderboard data source, including its "as of" timestamp and empty-state handling. Implement manual feedback templates, metadata capture, browser evidence expectations, and Alpha test reporting.

**Phase 5: BYO AI documentation**

Document optional external AI setup. Disable Alpha tester access to in-app agent chats and API-key storage. Do not implement in-app API key storage in Alpha v1.

## 20. Handoff Requirements

Before implementation, the next team must verify live repository state from the actual checkout and read current handoff/state files. If handoff files disagree with live Git state, stop and flag the mismatch.

Implementation handoff must include:

- Exact approved phase
- Allowed files
- Forbidden files/actions
- Expected test commands
- Known failing backlog
- Data packet path, confirming `kickoff_utc` is present on schedule entries
- Profile fixture path and `PRESET_PROFILES` mapping
- Confirmation of Alpha tester profile gating/filtering, including proof testers cannot access `master`, `andy`, owner-only futures portfolio surfaces, or AI agent/API-key entry points
- Evidence requirements
- Confirmation, by filename, that tester sandbox portfolio persistence is isolated from owner portfolio persistence
- Confirmation of profile-scoped storage keys for SuperContest, Survivor, sandbox portfolio, feedback drafts, and Alpha settings
- Confirmation that Alpha tester profiles cannot access AI chat/API-key entry points
- Confirmation of the `leaderboard.json` admin-aggregation mechanism and where it is read from in the app
- No-commit/no-push status unless separately approved

No team may proceed from spec to code, code to tests, tests to commit, or commit to push without explicit admin approval.

## 21. Claude Review Resolution

Claude's v4 Section 21 questions are resolved in this v4.1 body:

- Section 3 now states how the Alpha identity model relates to the existing owner/admin `PRESET_PROFILES` entries and requires explicit tester gating/filtering.
- Section 12.3 now states that Alpha v1 does not authorize any live Westgate scrape/import work.

Phase 1 may begin only after explicit admin approval of v4.1 and the allowed implementation scope.
