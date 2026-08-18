# NFL_Dashboard - Session Handoff

## Current Pick Up Here (2026-08-18 Yahoo/API pause + handoff sync, Codex)

- Latest timestamped handoff: `handoffs/2026-08-18-1555-yahoo-and-handoff-sync.md`.
- Verified live Git state during this sync: local `main` is at `2b17c75`, while `origin/main` is still `d76d309`; branch state is `main...origin/main [ahead 2]`.
- Correction to the prior rolling handoff: `70049b8`, `eb23751`, `086d2ee`, and `d76d309` were pushed by Andy, but `655e713` and `2b17c75` are local-only as of this handoff. Do not push them without Andy's explicit approval.
- Current dirty/untracked boundaries to preserve:
  - `agents/portfolio-dossier.js`
  - `scripts/build-prediction-market-map.js`
  - `scripts/lib/futures-evidence-gates.js`
  - `tests/fixtures/prediction-market-evidence-cleanup-mini.json`
  - `tests/unit/futuresEvidenceGates.test.js`
  - `tests/unit/predictionMarketEvidenceCleanup.test.js`
  - `scripts/bottom-12-analysis.js`
  - `scripts/colts-bucs-comparison.js`
- Codex session work merged into context: Kalshi/Polymarket normalization exists as uncommitted local work in the six modified futures files. It adds normalized price/liquidity/timing/settlement/fee/sportsbook-equivalence fields to the prediction-market map and gates missing normalized fields in futures evidence validation. Focused deterministic checks had passed previously, but re-run them before any commit.
- Yahoo Fantasy API status: paused pending Yahoo's access/provisioning update. Andy completed the local OAuth redirect flow and `.nfl/yahoo/tokens.json` updated, but `yahoo-league-settings.js` and `yahoo-adp-ingest.js --dry-run` still returned Yahoo 401 `oauth_problem="additional_authorization_required"`. Screenshot review showed no visible Fantasy Sports Read permission option in the Yahoo Developer app page. Rotate the exposed client secret before continuing Yahoo work.
- UI modernization status remains WIP from pushed commit `70049b8`; a native `npm run build` still needs to be run before relying on the frontend sweep.
- Guardrails remain active: no `git clean`, destructive reset/checkout, blind revert, broad staging, `git add -A`, commit, push, Supabase writes, betting, official picks, portfolio/parlay mutation, recommendation persistence, paid model/API calls, fresh synthesis, or external service runs without Andy's explicit approval. Evidence gate PASS means evidence readiness only.

## Resume Prompt

```text
Resume in E:\dev\projects\NFL_Dashboard.

First run:
- git status --short --branch
- git log -n 10 --oneline --decorate
- git branch -vv

Read first:
- handoffs/2026-08-18-1555-yahoo-and-handoff-sync.md
- HANDOFF.md
- HANDOFF_PROMPT.md
- TASK_BOARD.md
- WORKING-CONTEXT.md

Current verified checkpoint as of the 2026-08-18 Codex handoff sync: local HEAD is 2b17c75, origin/main is d76d309, and main is ahead of origin/main by 2 local commits: 655e713 and 2b17c75. The older rolling handoff text that says origin/main is at 655e713 is stale; verify Git before relying on prose.

Preserve dirty/untracked work:
- agents/portfolio-dossier.js
- scripts/build-prediction-market-map.js
- scripts/lib/futures-evidence-gates.js
- tests/fixtures/prediction-market-evidence-cleanup-mini.json
- tests/unit/futuresEvidenceGates.test.js
- tests/unit/predictionMarketEvidenceCleanup.test.js
- scripts/bottom-12-analysis.js
- scripts/colts-bucs-comparison.js

Yahoo Fantasy is blocked on Yahoo-side access/provisioning. Rotate the exposed secret before continuing, refresh tokens from the repo root, then test league settings and ADP dry-run. Do not write fantasy/Supabase data without approval.

Kalshi/Polymarket normalization is uncommitted Codex work in the six modified futures files. Re-run focused deterministic checks before staging or committing.

No commit, push, Supabase write, betting, official-pick action, portfolio/parlay mutation, paid model/API call, fresh synthesis, destructive cleanup, or broad staging without Andy's explicit approval.
```

## Current Pick Up Here (2026-08-16/17 full sync pass, Cowork/Claude)

- Andy asked for a full sync pass: get everything committed and pushed so any other session or team member coming online has a clean, current picture, and clean up the working tree.
- Starting point: `main` was already in sync with `origin/main` at `6a0097d` (the Aug 15 execution-venue/reacquisition-gates push, see the S328-era entries below), but the working tree had 3+ days of accumulated uncommitted work from concurrent Codex/Antigravity/Cowork sessions sitting on disk.
- Committed and pushed 5 new commits on `main`; `origin/main` now at `655e713`:
  1. `70049b8` - the in-progress UI/UX Command Hub sweep (`App.jsx` + `Header.jsx`/`Dashboard.jsx`/`MatchupCard.jsx`/`MatchupWizardModal.jsx`/`AgentChat.jsx` modified; `FantasyHub.jsx`/`FuturesHub.jsx`/`UnifiedIntelHub.jsx`/`DashboardLayout.jsx`/`PersistentAgentSidebar.jsx`/`ProfileSettingsModal.jsx` new; `docs/DASHBOARD_MATCHUP_CARD_LEGEND.md` new). **This is still WIP, not a finished feature** - not all 19 tabs are consolidated into the planned 6 hubs yet. Found and fixed a real `react-hooks/rules-of-hooks` bug in `AgentChat.jsx` along the way: a `useEffect` (message persistence) was declared after an early conditional return (the "no API key" setup screen), so the hook was skipped on some renders and not others - would have thrown a "rendered fewer hooks" error the first time a user completed API key setup, or silently broken message persistence. Moved it above the early return; verified clean via `npx eslint`. **Left flagged, not fixed**: `ProfileSettingsModal.jsx` mixes a non-component export with its component export (`react-refresh/only-export-components`) and has a `setState`-in-effect pattern that needs a design call (pure derivation vs. real sync effect) - both need someone who knows the intended structure, not a guess.
  2. `eb23751` - backend: FantasyPros injuries now default-on in `scripts/build-player-availability.js` (was opt-in via `--live-fantasypros-injuries`, now opt-out via `--no-live-fantasypros-injuries`); fixed a real `no-useless-escape` eslint error in `agents/lib/sportsRelevanceFilter.js` (an unnecessary `\/` inside a regex character class); added `scripts/calculate-win-total-probabilities.js`.
  3. `086d2ee` - data: refreshed `player-availability`/`training-camp` `latest.json` snapshots + dated point-in-time copies, regenerated the HTML/MD reports, committed 3 Gmail auto-summarized betting-relevant alerts (`.nfl/gmail-summaries/`, not personal correspondence) and 3 staged (**not** approved/placed) official-picks candidate proposals.
  4. `d76d309` - docs: committed the full 2026-08-13 futures-incident-review paper trail that had been sitting untracked per the concurrent-session preservation notice (Codex's incident brief, Claude's independent forensic response, Codex's comparison - no material factual disagreement found between them - and the 4 timestamped handoffs: `0054`, `0135`, `0140`, `0155`), plus the Yahoo Fantasy API personal-use agreement PDF and the still-open `docs/antigravity/recovery/youtube-qoCm4G2Jmng-contested-datapoints-review.md` (status unchanged, flagged not resolved).
  5. `655e713` - chore: gitignored `dist-verify-*/` (ad hoc build-verification snapshots) and the undeletable `data/research-intel/reacquisition/_TEST_*` placeholder fixtures so they stop showing as permanent noise in `git status`.
- Verification performed, given this session could not get a full `npm run build` to complete within its tool time limits (`vite build` consistently exceeded what a single call allows here - a bridge/sandbox constraint, same class of issue as prior sessions' "sandbox has zero outbound network access" notes, not a new problem and not evidence of broken code): `npx eslint` clean (0 errors, 0 warnings) on every touched/new file after the two fixes above; `npx vitest run` targeted at every test tied to changed code (`playerAvailability.test.js` 21/21, `sportsRelevanceFilter.test.js` + `nflRelevance.test.js` 5/5) - all passing, no regressions; `esbuild` syntax check (no bundling) on every new/modified `.jsx` file - all clean. **Recommend Andy run `npm run build` natively once before relying on the frontend sweep in production** - it was never verified end-to-end this session.
- **Left deliberately untouched, still dirty on disk as of this entry**: a live concurrent session (Codex or Antigravity - not identified, not this session) was actively editing `agents/portfolio-dossier.js`, `scripts/build-prediction-market-map.js`, `scripts/lib/futures-evidence-gates.js`, `tests/fixtures/prediction-market-evidence-cleanup-mini.json`, `tests/unit/futuresEvidenceGates.test.js`, `tests/unit/predictionMarketEvidenceCleanup.test.js`, and a new `scripts/bottom-12-analysis.js` while this sync pass was running - confirmed by file mtimes ~1-2 minutes old at the time of checking, and by a live `.git/index.lock` contention hit mid-session. None of that was staged, committed, or reviewed here. **Whoever picks this up next: check `git status` fresh before assuming this list is still accurate or still incomplete** - that other session may have committed its own work, or may still be going.
- **Sandbox/bridge note for future sessions**: this Windows-bridged filesystem has a recurring quirk where `git` (and plain `rm`) cannot *unlink* certain files it just created - lock files (`.git/HEAD.lock`, `.git/index.lock`) and some data files (the `_TEST_*` fixtures above, the `dist-verify-*/` build output) all fail with `Operation not permitted` on delete, even though `mv`/rename on the exact same file works fine. Every commit this session left a stale `.git/HEAD.lock` behind that had to be `mv`'d out of the way (never `rm`'d) before the next git command would work. If a future session hits `fatal: cannot lock ref 'HEAD'` or `index.lock: File exists`: check the lock file's mtime and `ps aux` for a real git process first - if it's stale and nothing is running, `mv` it aside rather than assuming real concurrent contention (though real contention is also genuinely possible in this repo - see above).
- No official picks approved, no bets placed, no Supabase writes, no betting/portfolio/parlay mutations this session.

## Current Pick Up Here (2026-08-13 UI/UX Modernization & Refactoring Pivot)

- **Pivot Objective**: Full UI/UX Modernization Sweep of the NFL Dashboard React frontend (`src/`).
- **Implementation Plan**: Available at `C:\Users\andre\.gemini\antigravity\brain\de2b709b-4dc1-4117-a528-9d9d5f048a2b\implementation_plan.md`.
- **Scope**: Streamline 19 fragmented tabs into 6 high-level Command Hubs (Dashboard & Games, Picks & Inbox, AI Intel & Command, Fantasy & Props, Injury & Availability, Bankroll & Futures). Remove dead code/modals, merge duplicate chat agents (`AgentChat`, `PropsAgentChat`, `FuturesAgentChat`), and elevate the UI with a premium dark glassmorphism design system.
- **Backend & Data Status**: All 4 pre-season intel & data workstreams completed & verified (195 training camp items, 925 availability events, 622 ECR rows, 526 projections, 38 research notes). 24/7 background timers active on M6 (`nfl-gmail-intake.timer` & `nfl-twitter-bookmarks.timer`). 6/6 unit tests passing.
- **Protected Artifacts**: All incident review artifacts (`docs/NFL_FUTURES_SYNTHESIS_INCIDENT_REVIEW_CLAUDE_BRIEF_2026-08-13.md`, `docs/NFL_FUTURES_SYNTHESIS_INCIDENT_REVIEW_CLAUDE_RESPONSE_2026-08-13.md`, `handoffs/2026-08-13-0054-futures-claude-incident-review-handoff.md`, `handoffs/2026-08-13-0135-concurrent-session-preservation-handoff.md`) are preserved intact.

## Current Pick Up Here (2026-08-13 Gmail & Twitter Intel Ingestion + Pre-Season Data Refresh)


- Latest timestamped handoff: `handoffs/2026-08-13-0140-gmail-and-twitter-intel-ingestion-handoff.md`.
- Concurrent session handoffs preserved: `handoffs/2026-08-13-0135-concurrent-session-preservation-handoff.md` and `handoffs/2026-08-13-0054-futures-claude-incident-review-handoff.md`.
- Protected artifacts preserved: `docs/NFL_FUTURES_SYNTHESIS_INCIDENT_REVIEW_CLAUDE_BRIEF_2026-08-13.md` and `docs/NFL_FUTURES_SYNTHESIS_INCIDENT_REVIEW_CLAUDE_RESPONSE_2026-08-13.md`.
- Status: 
  1. Live Gmail Auto-Summarization (`platinumrose75@gmail.com`) active 24/7 on M6 via `nfl-gmail-intake.timer` (15-min interval).
  2. Live Personal Twitter Bookmarks Agent active 24/7 on M6 via `nfl-twitter-bookmarks.timer` (2-hour interval). Verified with 80 live bookmarks fetched, 60 sports betting bookmarks ingested to `vault_notes`, 20 non-sports bookmarks filtered.
  3. Gemini 2.0 Vision OCR integrated for tweet graphics, extracting player prop stacks and staging proposals into `data/official-picks/proposals/active/`.
  4. Screenshot OCR watcher registered in Windows Task Scheduler (`NFL_Dashboard_Screenshot_Watcher`).
  5. Full pre-season intel & data stack refreshed: 195 training camp items across 32 teams; 925 player availability events across 32 teams; 622 ECR rows & 526 projection rows in Supabase; 38 research notes & 12 sharp signals inserted.
  6. Unit tests: 6/6 passing. All commits through HEAD (`82385b3`) pushed to `origin/main`.

## Current Pick Up Here (2026-08-13 concurrent-session preservation)



- Latest timestamped handoff: `handoffs/2026-08-13-0135-concurrent-session-preservation-handoff.md`.
- Protected artifacts: the Codex incident brief, the Claude response, the 00:54 incident-review handoff, and the 01:35 preservation handoff. All are currently untracked and must not be cleaned, reverted, overwritten, or absorbed into another workstream.
- Claude response discovered at `docs/NFL_FUTURES_SYNTHESIS_INCIDENT_REVIEW_CLAUDE_RESPONSE_2026-08-13.md`; it has not been reviewed by this Codex session.
- Claude and Antigravity sessions are concurrent. Before any closeout, re-run Git status/log, re-read rolling handoffs, write a unique timestamped handoff, and merge pointers rather than replacing them from stale context.
- Observed NFL state: `main...origin/main` at `694be71`. Observed ATLAS state: `main...origin/main [ahead 3]` at `83cc7f0`. Recheck both because concurrent sessions can advance them.
- Immediate objective after concurrent sessions finish: reconcile their final file sets and handoffs, then compare the Claude response against the Codex brief in a fresh session.
- Do not begin the intel-reacquisition build until the comparison is complete and Andy approves proceeding.
- Cross-session notification text is embedded in the timestamped preservation handoff under `## Cross-Session Notification Prompt`.
- Guardrails: no clean/reset/revert, broad staging, commit, push, betting, official picks, portfolio/parlay mutation, Supabase writes, paid model/API calls, synthesis, or reacquisition build without explicit approval.

## Resume Prompt

```text
Resume in E:\dev\projects\NFL_Dashboard after the concurrent Claude and Antigravity sessions finish. First run git status --short --branch and git log -n 5 --oneline; do not edit until current state is reconciled. Read handoffs/2026-08-13-0135-concurrent-session-preservation-handoff.md, docs/NFL_FUTURES_SYNTHESIS_INCIDENT_REVIEW_CLAUDE_BRIEF_2026-08-13.md, docs/NFL_FUTURES_SYNTHESIS_INCIDENT_REVIEW_CLAUDE_RESPONSE_2026-08-13.md, handoffs/2026-08-13-0054-futures-claude-incident-review-handoff.md, HANDOFF.md, HANDOFF_PROMPT.md, and any newer Claude/Antigravity timestamped handoffs.

Objective: reconcile all concurrent-session work, then perform a claim-by-claim Codex-Claude comparison. Preserve every dirty/untracked file and every unique timestamped handoff. If rolling handoffs conflict, reconstruct them from Git/current artifacts rather than discarding either session. Stop for Andy's approval before designing or building the intel-reacquisition workflow.

Verified boundary: the incident brief, Claude response, and both timestamped handoffs exist as untracked protected artifacts. The Claude response has not yet been reviewed by this Codex session. No futures are placed; the exacta remains a proposed dream ticket; expired parlays have zero guaranteed value; target liability is $500.

Guardrails: no git clean, destructive reset/checkout, blind revert, git add -A, broad stage, commit, push, betting, official picks, portfolio/parlay changes, Supabase writes, recommendation persistence, paid model/API calls, synthesis, or reacquisition implementation without explicit approval.
```

## Current Pick Up Here (2026-08-13 Claude incident-review brief)

- Latest timestamped handoff: `handoffs/2026-08-13-0054-futures-claude-incident-review-handoff.md`.
- Claude-team brief: `docs/NFL_FUTURES_SYNTHESIS_INCIDENT_REVIEW_CLAUDE_BRIEF_2026-08-13.md`.
- Branch: `main`; current observed HEAD is `e3b2689`. No commit or push was performed in this handoff session.
- Immediate objective: give the Claude team the incident-review brief, obtain its independent forensic analysis, and compare it against the Codex findings before designing or building the intel-reacquisition workflow.
- Authoritative portfolio state: no futures are placed; the proposed $100 Bills-Packers exacta at +6500 is a dream-ticket candidate, not an existing position; the six expired Bookmaker parlays count as zero guaranteed value and zero deployable bankroll.
- Target liability: $500. Separate Bills and Packers anchor positions should normally survive in the portfolio, while the exacta is a special joint-upside position. Small conviction stakes may be proposed, but weak prices default to reserve/watch rather than forced full stakes.
- Proposed analysis scale for independent review: 1u = $20, 25u = $500, and the dream exacta represented as a special 5u/$100 proposal subject to independent challenge.
- Final authorized output after the system is strengthened: price-verified proposals awaiting Andy's approval.
- Subscription route: blind independent Codex and Claude tasks only; no paid model APIs at this stage.
- Critical evidence boundary: `.nfl/portfolio/dossier-2026-08-11.json` is still the newest dossier and predates cleanup. Do not synthesize from it. Do not reuse `.nfl/portfolio/normalized-signals-gpt-4o.json`.
- Existing dirty NFL and ATLAS work was inspected and preserved. See the timestamped handoff for the exact NFL dirty boundaries.
- Guardrails: no betting, official picks, portfolio/open-parlay mutation, Supabase writes, recommendation persistence, paid model/API calls, fresh synthesis, broad web collection, commit, push, or broad staging without explicit approval.

## Resume Prompt

```text
Resume in E:\dev\projects\NFL_Dashboard.

First inspect git status and preserve all dirty/untracked work. Read docs/NFL_FUTURES_SYNTHESIS_INCIDENT_REVIEW_CLAUDE_BRIEF_2026-08-13.md, handoffs/2026-08-13-0054-futures-claude-incident-review-handoff.md, HANDOFF.md, HANDOFF_PROMPT.md, docs/FUTURES_EVIDENCE_CLEANUP_ROADMAP_2026-08-11.md, .nfl/portfolio/frontier-synthesis-context-2026-08-12.json, and .nfl/verification/futures-evidence-verification-2026-08-12T05-40-00-000Z.json.

Objective: obtain or review the Claude team's independent forensic analysis, compare it with the Codex incident report, and stop for Andy's approval before designing or building the intel-reacquisition workflow.

Verified state: no futures are placed. The $100 Bills-Packers exacta at +6500 is a proposed dream ticket. The six expired Bookmaker parlays have zero guaranteed value and zero deployable bankroll. The target liability is $500. A surviving portfolio should normally include separate Bills and Packers anchors; small conviction stakes are allowed, but reserve/watch is preferred to forcing weak-price anchor positions. The final future output is price-verified proposals awaiting approval. Codex and Claude subscription tasks will run blind first; no paid model APIs are authorized.

Immediate next step: point the Claude team to the saved brief and request the 20 independent deliverables listed in it. Preserve Claude's response separately for comparison. Do not build or run a new synthesis yet.

Guardrails: no betting, official picks, portfolio/parlay mutation, Supabase writes, recommendation persistence, paid model/API calls, fresh synthesis, broad source reacquisition, commit, push, or git add -A without explicit approval. Do not synthesize from .nfl/portfolio/dossier-2026-08-11.json or reuse .nfl/portfolio/normalized-signals-gpt-4o.json.
```

## Current Pick Up Here (2026-08-12 futures evidence cleanup post-commit)

- Latest timestamped handoff: `handoffs/2026-08-12-0054-futures-evidence-cleanup-postcommit-handoff.md`.
- Branch: `main`.
- G01-G03 futures evidence cleanup checkpoint committed locally as `961b6e9` (`fix: gate and verify futures evidence rebuild`).
- Branch state after this docs-only closeout is committed: `main...origin/main [ahead 2]`; no git push has been performed.
- Completed: A01/A02/A05 and G01/G02/G03 in `docs/FUTURES_EVIDENCE_CLEANUP_ROADMAP_2026-08-11.md`.
- Latest local verification receipt: `.nfl/verification/futures-evidence-verification-2026-08-12T05-40-00-000Z.json` with PASS.
- Latest deterministic rebuild manifest: `.nfl/rebuild/futures-evidence-rebuild-2026-08-12T05-30-00-000Z.json`.
- Unstaged dirty boundaries to preserve unless explicitly approved: `TASK_BOARD.md`, `WORKING-CONTEXT.md`, `Complete_with_Docusign_Personal_Use_-_Andrew_NFL_Dashboard_Yahoo_API_agreement.pdf`, and `docs/antigravity/recovery/youtube-qoCm4G2Jmng-contested-datapoints-review.md`.
- Immediate next step: push only if Andy explicitly approves pushing. Otherwise the next project decision is whether to approve a separately scoped frontier futures synthesis run.
- Guardrails: no paid/frontier model/API calls, Supabase writes, official-pick actions, production recommendation persistence, portfolio/open-parlay mutations, or git push without explicit approval.

## Resume Prompt

```text
Resume in E:\dev\projects\NFL_Dashboard.

First read HANDOFF.md, HANDOFF_PROMPT.md, handoffs/2026-08-12-0054-futures-evidence-cleanup-postcommit-handoff.md, and docs/FUTURES_EVIDENCE_CLEANUP_ROADMAP_2026-08-11.md.

Objective: continue after the completed futures evidence cleanup G01-G03 checkpoint.

Verified state: G01-G03 was committed locally as 961b6e9 with message fix: gate and verify futures evidence rebuild. Before that commit, local HEAD, cached origin/main, and M6 all resolved to f54712351b663b45c95db643c792241fbebe5019. A01/A02/A05 and G01/G02/G03 are complete. Article rebuild has 292 records, complete requested DB window, zero unresolved pick-oriented rows, zero actual_picks, and 10 explicit selections held out for price/venue verification. Strict source audit is PASSABLE: Current 2 / Review 25 / Stale 0 / Blocked 0 / Missing 0 / Context 12. Deterministic rebuild passed at 2026-08-12T05:30:00.000Z. Final verification passed at 2026-08-12T05:40:00.000Z. Latest receipt is .nfl/verification/futures-evidence-verification-2026-08-12T05-40-00-000Z.json. Latest rebuild manifest is .nfl/rebuild/futures-evidence-rebuild-2026-08-12T05-30-00-000Z.json. After this closeout handoff is committed, main is ahead of origin/main by two local commits; no push was performed.

Immediate next step: run git status --short --branch. Push only if Andy explicitly approves pushing. Otherwise, the next project decision is whether to approve a separately scoped frontier futures synthesis run.

Dirty boundaries to preserve: TASK_BOARD.md, WORKING-CONTEXT.md, Complete_with_Docusign_Personal_Use_-_Andrew_NFL_Dashboard_Yahoo_API_agreement.pdf, and docs/antigravity/recovery/youtube-qoCm4G2Jmng-contested-datapoints-review.md.

Guardrails: do not run paid/frontier model/API calls, write Supabase, approve official picks, persist recommendations, mutate portfolio/open parlays, fill/close parlays, push git, or use git add -A without explicit approval. The G03 pass proves evidence readiness only; it does not authorize betting action or model synthesis.
```

## Current Pick Up Here (2026-08-11 futures synthesis checkpoint)

- Current local HEAD: `85fee49`; `main...origin/main [ahead 14]`.
- Latest timestamped handoff: `handoffs/2026-08-11-1355-futures-synthesis-prompt-handoff.md`.
- Working tree is intentionally dirty after futures-data refresh; preserve unrelated dirty/untracked boundaries and stage narrowly.
- Immediate next step: run a maximum-effort NFL futures synthesis using refreshed local data, with no official picks, Supabase writes, production recommendation persistence, portfolio/open-parlay changes, paid/frontier model/API calls, or git push unless Andy explicitly approves that action in the fresh session.
- Readiness: source audit frontier-ready/passable; Aug 10 BKR/BetUS/BetOnline odds processed; YouTube/podcast missing observations now 0; articles, availability, starter-impact digest, projected-starters estimate, training camp, prediction-market map/coherence all refreshed.
- Portfolio objective: Bills and Packers are the primary Super Bowl anchor spine; Bills-Packers exact matchup/exacta is the ultimate payout target if placeable/price-shoppable; supplemental futures should hedge, ladder, or create playoff optionality around that core.
- Timing requirement: evaluate buy-now vs wait-for-better-entry for every candidate, including likely in-season market changes from schedule shape, rough early starts, injury uncertainty, public narrative, and line movement.
- Carry forward July 30 packet constraints: `$500` futures bankroll, `$20` unit, 0.25u/0.5u/1u/2u sizes, Bills/Packers SB target caps, watchlist targets as evaluation targets only, exactas monitor-only until exact two-team rows plus secondary price shopping, and open parlays as open/unverified contingent assets only.
- Carry forward the filled goal-context worksheet: `docs/FUTURES_PORTFOLIO_GOAL_CONTEXT_QUESTIONS_2026-08-11.md`.
- Fresh-session option before synthesis: do a final review of the max-effort prompt itself against `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md`, `docs/spec-win-dist-and-coherence-sim.md`, and this handoff before running any synthesis.
- Biggest caveats: BetOnline is missing Tampa Bay win total and make-playoffs screenshots; projected starters are estimated only with 0 manual depth-chart rows; prediction markets are context only; two old QB-list reprocess rows are stale/manual-recovery artifacts, not true missing blockers.

> Fresh-session resume notes. Read this first, then `HANDOFF_PROMPT.md`, `WORKING-CONTEXT.md`, `TASK_BOARD.md`, and the latest timestamped handoff.

**Date:** 2026-08-10 UTC / 2026-08-09 Pacific
**Branch:** main
**HEAD observed:** `54ebfcf` (committed, NOT pushed — push is Andy's own action / explicit request)
**Latest timestamped handoff:** none written this session — see Pick Up Here below.
**Status:** FantasyPros API integration (F-26c) — all four parts now code-complete. Parts 1-2 (ADP, weekly/draft rankings) built AND live-verified. Part 2's React UI, Part 3 (projections), and Part 4 (injuries/availability) built 2026-08-10 but NOT live-verified — Cowork sandbox confirmed unable to make any outbound network call at all. Needs a native run on Andy's machine to close the loop. Working tree clean except one pre-existing unrelated untracked file (`docs/antigravity/recovery/youtube-qoCm4G2Jmng-contested-datapoints-review.md`, not from this session, left alone deliberately).

---

## Pick Up Here (2026-08-10 continuation, Cowork session)

**FantasyPros API integration (F-26c) — parts 2 (UI), 3 (projections), 4 (injuries) all built, none live-verified:**

- **§2 UI**: `src/components/fantasy/FantasyRankingsPanel.jsx` — new "Weekly Rankings" view toggled inside the existing Fantasy tab (`FantasyValueBoard.jsx` now has a Value Board / Weekly Rankings segmented control; no `App.jsx`/`Header` changes needed). Reads `fantasy_rankings` **directly via Supabase's public-read RLS**, not a generated JSON file — new `getFantasyRankings()`/`getFantasyRankingsAvailableWeeks()` in `src/lib/supabase.js`.
- **§3 projections**: migration `047_fantasy_projections.sql`, `agents/lib/fantasypros-projections.js` (`mapProjections`/`dedupeProjections`, unit-tested), `agents/fantasypros-projections-ingest.js` (`npm run ingest-fantasypros-projections` / `:dry`), and a `--source fantasypros` flag on `agents/fantasy-value-report.js` (`npm run report:fantasy:fantasypros`, new `buildBoardFromProjections()`) — writes to its own `-fantasypros`-suffixed files, alongside Phase A rather than replacing it. Field mapping reuses the §0-confirmed live shape (`points`/`points_ppr`/`points_half`/`rush_*`/`rec_*`/`fpid`/`name`).
- **§4 injuries**: `fetchFantasyProsInjuries()` + `agents/lib/fantasypros-injuries.js` added to `scripts/build-player-availability.js` (`--live-fantasypros-injuries`, `npm run availability:fantasypros:dry`), feeding the same `buildAvailabilitySnapshot()` call ESPN already uses — no cross-source dedupe added (kept as independent corroboration, per the scope doc's resolved §6 Q7). `probability_of_playing`/`practice_1-3` now carry through as optional fields on the availability event shape (`agents/lib/player-availability.js`). **§4's exact `/nfl/injuries` field names are NOT live-confirmed** — the scope doc only gives mapping arrows, not the raw player/team/position field names, and every other FantasyPros endpoint in this repo uses different names for the same concepts. Built with defensive multi-name fallback chains instead of guessing one shape — see the file header in `agents/lib/fantasypros-injuries.js` before trusting this live.
- **Bug found + fixed along the way**: `scripts/build-player-availability.js` never loaded `dotenv` (never needed it before — ESPN's feed takes no key), so `FANTASYPROS_API_KEY` silently never reached it even with a real key sitting in `.env`. Fixed with `import 'dotenv/config'`.
- **Verification done this session**: `node --check`/`esbuild` syntax-clean on every touched/new file; plain-node harness assertions (manual `assert()`, mirrors the `describe`/`it` blocks in the real `vitest` test files) passing for `fantasyProsInjuries.test.js`, `fantasyProsProjections.test.js`, and `buildBoardFromProjections()` — `vitest run` itself still hangs in this sandbox.
- **Verification NOT done from this session's sandbox** (can't be — confirmed live via `node -e "fetch(...)"` that this Cowork sandbox makes zero outbound network calls, same root cause as `TASK_BOARD F-31`). **Andy then ran §4 live natively and it checked out**: `npm run availability:fantasypros:dry` → 187 events, 120 real FantasyPros rows, 0 errors; a follow-up raw-vs-mapped diagnostic dump (2 real players, Alec Pierce/Kittle) confirmed every guessed field name (`name`, `status`, `comment`, `injury_type`, `team_id`, `position_id`, `probability_of_playing`, `practice_1/2/3`) matched the real API response. **One real issue found and fixed in place**: `injury_update_date` is a naive, timezone-less datetime string, so `reported_at`'s absolute instant depends on the running machine's local timezone rather than FantasyPros' actual source zone (unconfirmed, undocumented by them) — flagged clearly in `agents/lib/fantasypros-injuries.js` rather than guessing an offset; low-impact since it's display-only, not a join/dedupe key.

**§3 (projections) then hit a real bug on its first live dry-run — found and fixed same session.** `npm run ingest-fantasypros-projections:dry` mapped 0/84 rows across every position, no error thrown. Same raw-vs-mapped diagnostic technique showed why: every stat/points field (`points`, `points_ppr`, `rush_att`, `pass_yds`, etc.) actually lives nested under a `stats` sub-object (`player.stats.points`), not flat on the player object the way §0-§2's confirmed endpoints are — `mapProjections()` had wrongly assumed the same flat shape. `fpid`/`name`/`position_id`/`team_id` were flat and correct. Also corrected `pass_ints` (not `pass_int`) and `fumbles` (not `fumbles_lost`). Fixed in `agents/lib/fantasypros-projections.js`; `tests/unit/fantasyProsProjections.test.js` now carries the real captured Josh Allen payload as a regression fixture. **Both §3 and §4 field mappings are now live-confirmed against real data — and so is persistence.** §4's real (non-dry-run) run: 189 events (122 FantasyPros + 67 training camp) written to `data/player-availability/latest.json` + docs copies. §3's real write initially failed clean: `Could not find the table 'public.fantasy_projections'` — migration 047 existed but had never actually been applied in Supabase (unlike 046, which was already applied for §2). Andy applied it via the Dashboard SQL Editor, re-ran: **531 rows upserted** (84 QB/132 RB/190 WR/125 TE), 451/531 resolved a `player_id`, zero duplicate-key collisions (§2's rankings ingest hit exactly one, for comparison). **All four parts of the FantasyPros integration are now fully built and live-verified end-to-end.** Nothing left to verify for this feature.
- Docs updated in place: `docs/FANTASYPROS_API_INTEGRATION_SCOPE_2026-08-09.md` (status header + §2/§3/§4 build summaries), `TASK_BOARD.md` (F-26c entry).
- **Commit `54ebfcf`, NOT pushed this session** — sits on top of `4fd9438`/`91a4c8a`/`7d02d92`/`f9baff6`/`7f80409`/`090bc16`, which WERE pushed earlier this same session (`2d6ed63..090bc16` on `origin/main`) once a persistent `.github_push_token` credential was set up (see ATLAS's own handoff for the cross-repo S321-option-3 credential-policy change that unblocked that push). This newest commit is local-only until Andy asks for it to be pushed.

---

## Prior Session (2026-08-09/10, Cowork session)

**FantasyPros API integration (F-26c) — parts 1-2 built and live-verified end-to-end:**

- **§1 ADP**: `agents/fantasypros-adp-ingest.js` + `agents/lib/fantasypros-adp.js` pull `/nfl/players` (real market ADP via `rank_adp`/`rank_adp_ppr`, NOT the `type=ADP` consensus-rankings variant which is still just ECR from a small panel) into the existing source-agnostic `fantasy_adp` table (migration 034). Live run: 439/439 rows upserted, 367/439 resolved to `player_id`. `npm run report:fantasy` (`agents/fantasy-value-report.js`) confirmed consuming it correctly: 610 stat rows, 439 ADP rows, 251 value/72 reach/87 no-projection picks.
- **§2 weekly/draft rankings**: `agents/fantasypros-rankings-ingest.js` + `agents/lib/fantasypros-rankings.js` pull `/nfl/{season}/consensus-rankings` (Expert Consensus Rank — a different signal from ADP, don't conflate) into new table `fantasy_rankings` (migration 046, applied by Andy). Live run: 661 rows fetched across QB/RB/WR/TE, 1 duplicate collision caught and collapsed by `dedupeRankings()` (a real FantasyPros API data-quality artifact — same player appeared twice in one position response), 660 rows upserted successfully.
- No React UI built yet for either — both are backend/data-layer only. Full design detail, all API quirks found, and the open questions in `docs/FANTASYPROS_API_INTEGRATION_SCOPE_2026-08-09.md` (§1-§7).
- `FANTASYPROS_API_KEY` is in `.env` (server-side only, never `VITE_`-prefixed) and documented in `.env.example`.

**Incidental bug fixed (blocked verifying the above, not FantasyPros-related):** the ESM "am I the entrypoint" guard (`path.resolve(argv[1]) === fileURLToPath(import.meta.url)`) silently fails on Windows due to drive-letter casing (`E:\` vs `e:\`), causing scripts to exit clean with zero output. Fixed in all 11 affected files (found via repo-wide grep) by switching to `import.meta.url === pathToFileURL(process.argv[1]).href`. Re-verified live only for `agents/fantasy-value-report.js`; the other 10 share the identical fix and confidence level but weren't individually re-run this session.

**Deferred, by Andy's explicit direction — do not start without new instruction:**
- `LINT-1`: 212 pre-existing eslint problems, backlog written at `docs/LINT_CLEANUP_BACKLOG_2026-08-09.md` (severity-tiered, recommends fix order, explicitly warns against a blind `eslint --fix` on hook-deps and against one giant commit). Raw report at `docs/fantasyPros_lint_output`.
- F-26c parts 3 (projections) and 4 (injuries/availability) — scoped in the doc, not built.
- The React dashboard panel that would surface §2 weekly rankings in the UI.

**Sandbox limits hit this session (for the next Cowork session, not a code problem):** `vitest run` and `npx eslint` both hang indefinitely in this bash sandbox — worked around with `node --check` (syntax) + a plain-Node harness using manual `assert()` (logic). This sandbox also cannot make live external network calls (matches documented `F-31`) — all live API verification and the two live ingest runs were done by Andy natively, pasted back into this session for interpretation.

**3 commits made this session, not pushed:**
- `4fd9438` — feat(fantasy): FantasyPros API integration — ADP + weekly/draft rankings (F-26c parts 1-2)
- `91a4c8a` — fix(cli): Windows drive-letter-casing entrypoint guard bug (11 files)
- `7d02d92` — docs(lint): backlog for the pre-existing 212-problem eslint report

Push needs Andy's own action — no `credential.helper` is set up for `origin` (`https://github.com/platinum-rose/NFL_Platinum_Rose.git`).

---

## Prior Session (2026-07-30) — Pick Up Here

> **⟂ Parallel task (Copilot, 2026-07-30):** Master futures synthesis prompt committed (`e273e4f`) at `agents/product/tier1/FUTURES_PORTFOLIO_MASTER.md`; Kalshi/Polymarket are now treated as **placeable venues** (net fee-adjusted cross-venue shopping). A deep **data-package gap analysis** is queued for a fresh session → see `handoffs/2026-07-30-futures-data-package-gap-analysis.md`. This is additive and does NOT touch the crash-recovery workstream described below.
>
> **(DONE) Futures data-package deep analysis (Copilot, 2026-07-30):** Two docs-only deliverables authored (no Supabase writes, no picks, no `git add -A`):
>
> - `docs/FUTURES_DATA_PACKAGE_ENHANCEMENT_BACKLOG_2026-07-30.md` — ranked leverage×effort backlog of the 10 catalogued gaps mapped to dossier v1.0. Top finding: the PM "5/132 mapping" gap is misdiagnosed — it's **feed acquisition** (`build-prediction-markets.js` never targets NFL series_tickers; raw feed = 137 contracts, ~0 core NFL futures, all 41 Polymarket = geopolitics/crypto), not a mapping bug.
> - `docs/FUTURES_DATA_PACKAGE_DEPTH_EXPANSION_2026-07-30.md` — net-new domain expansion (15 domains, leverage×effort×acquisition). Headline: highest-leverage depth is **plumbing, not new collection**. Verified empirically that migration-044 `team_analytic_snapshots` / `team_coaching_tendency_snapshots` are **~50% null by design** (builders read only `team_stats.csv`, not pbp/charting; CI runs `--no-pbp`). Free wins: regression/luck signals (turnover/Pythag/one-score → feeds required `thesis.regression_direction`), snap_counts/depth_charts (reframes manual backlog #3), projection ensemble (fills dead `power_rating.model_rank`), cross-market coherence arbitrage.
> - **Not yet committed** — both docs are lint-clean and awaiting individual commits (never `git add -A` while Codex tree is dirty).
>
> **(CONVENTION) Model-tier routing (Copilot, 2026-07-30):** New always-on rule `.claude/rules/model-tiering.md` + repo memory — **every plan/backlog/handoff must tag each task with a model tier** (`code` / `flash` / `standard` / `frontier`, compound allowed) so work routes to the cheapest capable model as the creator swaps platforms. Both futures docs now carry a `## Model-tier routing` section. Key takeaway: most depth gains are `code` (pipeline), extraction/normalization is `flash`, and only final dossier synthesis is `frontier`.

The computer crashed during a dirty source-freshness/readiness workstream that started after the July 29 season-smoke and YouTube/Gemini futures reconciliation handoff. The immediate recovery task is complete, and the safe recovered work has been split into narrow commits.

Latest verified service command:

```powershell
npm.cmd run smoke:season -- --require-services --dev-base http://localhost:5174/platinum-rose-app
```

Latest verified smoke:
- Verdict: `READY WITH WATCH ITEMS`.
- PASS 11 / WARN 6 / FAIL 0 / INFO 1.
- Dashboard, schedule asset, YouTube intel asset, official-picks inbox, and M6 health all returned HTTP 200.
- Latest report: `docs/SEASON_READINESS_SMOKE_TEST_LATEST.md`.

Use `localhost:5174` for the recovered dashboard session. Earlier probes against `127.0.0.1:5174` failed even while the browser-visible Vite URL worked.

---

## Completed Checkpoints

- `7d02d92` - docs(lint): backlog for the pre-existing 212-problem eslint report.
- `91a4c8a` - fix(cli): Windows drive-letter-casing entrypoint guard bug (11 files).
- `4fd9438` - feat(fantasy): FantasyPros API integration — ADP + weekly/draft rankings (F-26c parts 1-2).
- `87476f0` - Document crash recovery source audit state.
- `0e64d66` - Add local source and article intel review tooling.
- `9273269` - Import July 29 primary futures odds.
- `642349e` - Refresh July 30 training camp intel snapshot.
- `d58f8e3` - Document post-recovery workstream triage.
- `96376e1` - Recalibrate futures synthesis source audit.
- `0cd942a` - Add futures synthesis source readiness checklist.
- `f6cee97` - Clean podcast deep-dive synthesis evidence.
- `817ec29` - Update futures synthesis handoff checkpoint.
- `5b2db46` - Add frontier futures synthesis evidence packet.
- `1c5cdee` - Document training camp source recovery.
- `b0b57ed` - Point source audit at recovered camp snapshot.
- `26c85b2` - Document post-pipeline push task plan.
- `29065e9` - Add training camp intel dashboard tab.
- `12aa0cf` - Refresh handoff after camp intel UI checkpoint.
- `4436095` - Refresh fantasy value board.
- `c797669` - Guard overnight ops automation.
- `8695b57` - Expose secondary matchup seed gaps.
- `d7fb7a0` - Gitignore readiness and source-audit retry artifacts.
- `de5c9c0` - Add Antigravity IDE `.agents/skills` project configurations.
- `6d8acdc` - Update session handoff for Antigravity skills rollout.

Latest source-readiness state:
- Source-audit gate now removes execution-only DK/FD bet-slip and weekly live-props plumbing from the futures-synthesis freshness check.
- Last fully passing written source audit: `PASSABLE`, Current 2 / Review 17 / Stale 0 / Blocked 0 / Missing 0 / Context 7.
- Current written source audit: `PASSABLE`, Current 2 / Review 18 / Stale 0 / Blocked 0 / Missing 0 / Context 7. A fresh approved live RSS scout refreshed the app-facing July 30 training-camp files to 19 items across 10 teams, and the player-availability snapshot covers 796 events across all 32 teams with OL and defensive-front cluster flags.
- Frontier synthesis packet: `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md`.
- BetOnline manual review: `docs/FUTURES_ODDS_BETONLINE_2026-07-29_MANUAL_REVIEW.md`.
- BetOnline normalized import: `data/futures-imports/betonline-2026-07-29.json`.
- Latest artifacts:
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T07-41-18-119Z.json`
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T07-41-18-119Z.html`
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T15-21-51-624Z.json` - prior passable audit after BetOnline normalization, fresh live training-camp scout, and podcast ad-filter refresh.
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T15-21-51-624Z.html` - prior passable audit after BetOnline normalization, fresh live training-camp scout, and podcast ad-filter refresh.
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T16-14-57-708Z.json` - prior passable audit after adding player availability to the source gate.
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T16-14-57-708Z.html` - prior passable audit after adding player availability to the source gate.
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T16-50-56-165Z.json` - current passable audit after splitting OL and defensive-front availability.
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T16-50-56-165Z.html` - current passable audit after splitting OL and defensive-front availability.
  - `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`

---

## Remaining Dirty Work

**From 2026-08-09/10 session:** none — tree is clean except one pre-existing, unrelated untracked file (`docs/antigravity/recovery/youtube-qoCm4G2Jmng-contested-datapoints-review.md`, not from this session, deliberately left alone). The 3 commits above are on `main` but **not pushed** — needs Andy's own `git push` (no credential helper configured for this remote).

**From 2026-07-30 session (prior, unrelated workstream):**
- Overnight pipeline additions and untracked ops docs/systemd files. This was not committed because it adds live training-camp RSS scouting to automation and the docs contain Linux/encoding/command assumptions.
- `data/training-camp/2026/latest.json` and `data/training-camp/2026/training-camp-intel-2026-07-30.json` now contain the fresh approved live RSS scout snapshot: 19 items across 10 teams, with 4 high-priority items and 6 feed-health entries. Treat it as review/highlight context before synthesis, not as an official recommendation source.
- Older untracked retry artifacts under `.nfl/readiness/` and `.nfl/source-audit/`.

Do not stage this as one sweep. Review and stage by workstream.

---

## Key Files

**From 2026-08-09/10 session (FantasyPros F-26c):**
- `docs/FANTASYPROS_API_INTEGRATION_SCOPE_2026-08-09.md` - master scoping doc, §1-§7, all API quirks and status.
- `docs/LINT_CLEANUP_BACKLOG_2026-08-09.md` - deferred lint-debt backlog (LINT-1), severity-tiered.
- `agents/lib/fantasypros-client.js` - shared fetch wrapper (auth, base URL, error shape).
- `agents/lib/fantasypros-adp.js` + `agents/fantasypros-adp-ingest.js` - §1 ADP, tested + live-verified.
- `agents/lib/fantasypros-rankings.js` + `agents/fantasypros-rankings-ingest.js` - §2 rankings, tested + live-verified, includes `dedupeRankings()`.
- `supabase/migrations/046_fantasy_rankings.sql` - new table for §2, applied.
- `tests/unit/fantasyProsAdp.test.js`, `tests/unit/fantasyProsRankings.test.js` - unit coverage (run via plain-Node harness in this sandbox, vitest hangs here).
- `agents/fantasy-value-report.js` - Windows guard-bug fix, re-verified live.

**From prior sessions:**
- `handoffs/2026-07-30-1101-camp-intel-ui-handoff.md` - current Camp Intel UI and post-push handoff.
- `handoffs/2026-07-30-post-pipeline-push-task-plan.md` - post-pipeline push task plan.
- `handoffs/2026-07-30-0655-workstream-triage-handoff.md` - prior triage handoff.
- `handoffs/2026-07-30-0635-crash-recovery-source-audit-handoff.md` - detailed crash-recovery handoff.
- `handoffs/2026-07-29-0405-season-readiness-youtube-futures-handoff.md` - prior completed checkpoint.
- `docs/SEASON_READINESS_SMOKE_TEST_LATEST.md` - latest readiness report.
- `docs/FUTURES_SYNTHESIS_SOURCE_READINESS_2026-07-30.md` - current source-acceptance checklist for the frontier synthesis packet.
- `docs/FUTURES_SYNTHESIS_REQUIREMENT_AUDIT_2026-07-30.md` - requirement-by-requirement evidence audit for the active objective.
- `docs/TRAINING_CAMP_SOURCE_RECONCILIATION_2026-07-30.md` - recovery note plus fresh live RSS scout receipt for the current 19-item training-camp snapshot.
- `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md` - accepted evidence packet and approval-gated run path for the frontier synthesis.
- `docs/player-availability/player-availability-latest.md` - latest local player injury/return/practice availability report.
- `docs/FUTURES_ODDS_BETONLINE_2026-07-29_MANUAL_REVIEW.md` - BetOnline screenshot transcription and No-side playoff values.
- `scripts/build-intel-source-audit-report.js` - new source-audit report.
- `scripts/build-betonline-0729-import.js` - local BetOnline screenshot normalization generator.
- `scripts/build-article-intel-review.js` - new article-intel review.
- `agents/research-intel-ingest.js` - feed/source filtering changes.
- `scripts/parse-futures-text.js` - BetUS alternate-wins parsing guard.

---

## Guardrails

- Do not make paid model/API calls without explicit approval.
- Do not write Supabase, approve official picks, persist production recommendations, or modify open parlays without explicit approval.
- Podcast, YouTube, article, and training-camp intel are reviewed research context only until promoted by explicit human decision.
- Keep generated fixtures and local smoke outputs distinct from production betting recommendations.
- Stage narrowly; avoid `git add -A`.
- On resume, scan project-local `.codex/rules/`, `.codex/hooks.json`, `skills/`, `agents/`, and hook folders before planning. Use relevant local `SKILL.md` guidance and project agents/workflows when they fit the task, while keeping guardrails and explicit-approval boundaries intact.

---

## Recommended Next Step

1. Andy: `git push` the 3 local commits (`4fd9438`, `91a4c8a`, `7d02d92`) to `origin/main` — needs a short-lived, repo-scoped `GITHUB_TOKEN` per this repo's established convention (see ATLAS `.claude/rules/lessons-learned.md` §Security/Credential Hygiene), not attempted automatically.
2. Next FantasyPros work, in priority order: build the React UI panel for §2 weekly rankings (backend is ready and live-verified); or scope/build §3 projections (pre-computed points, straightforward — same client/pattern as §1-§2); or §4 injuries/availability (would extend the existing multi-source `agents/lib/player-availability.js` pipeline rather than being standalone).
3. Separately, whenever a dedicated session is available: work `LINT-1` per `docs/LINT_CLEANUP_BACKLOG_2026-08-09.md`'s recommended order (HIGH items first — the two real bugs, not the volume items).

(Prior 2026-07-30 recommendation, unrelated workstream, still open if picked back up: use `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md` as the evidence packet — BetOnline normalized, live training-camp scout written, player availability available as context; source gate clear; remaining decision is explicit approval before any paid/frontier model synthesis call.)

---

## Resume Prompt

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard. Read HANDOFF.md (Pick Up Here,
2026-08-09/10 session), TASK_BOARD.md (F-26c, LINT-1), and
docs/FANTASYPROS_API_INTEGRATION_SCOPE_2026-08-09.md before planning. Current local HEAD is
7d02d92 on main — 3 commits ahead of origin/main, not yet pushed (needs Andy's own
GITHUB_TOKEN per repo convention). FantasyPros §1 (ADP) and §2 (weekly/draft rankings) are
built and live-verified end-to-end; no UI built for either yet. §3 (projections) and §4
(injuries) are scoped only. LINT-1 (212 pre-existing eslint problems) is written up and
explicitly deferred — do not start it without direction. Stage narrowly; do not use git add
-A. Guardrails: no paid/frontier model calls, no Supabase writes, no official-pick
approvals/proposals, no production recommendation persistence, no open-parlay changes, and
no git push, without explicit approval.
```

---

## Prior Resume Prompt (2026-07-30, unrelated workstream)

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard. Read HANDOFF.md, HANDOFF_PROMPT.md, WORKING-CONTEXT.md, TASK_BOARD.md, handoffs\2026-07-30-1259-codex-protocol-access-handoff.md, and handoffs\2026-07-30-1256-antigravity-agents-handoff.md first. Before planning, scan `.codex/rules/`, `.codex/hooks.json`, `skills/`, `agents/`, `.agents/skills/`, and hook folders for relevant project-local skills, agents, and hooks; read only task-relevant local SKILL.md files and use matching project workflows when appropriate. Current pushed HEAD is 6d8acdc on main/origin/main. Fantasy value board, overnight/ops automation, stale retry artifact cleanup, secondary-matchup seed-gap exposure, Antigravity `.agents/skills/`, and the 12:56 handoff are already committed and pushed; do not recommit them. Preserve uncommitted Codex protocol edits unless intentionally reconciling them. Stage narrowly; do not use git add -A. Guardrails: no paid/frontier model calls, no Supabase writes, no official-pick approvals/proposals, no production recommendation persistence, and no open-parlay changes without explicit approval. Immediate next step: start a fresh Codex session rooted at E:\dev, verify write access to ATLAS/GitHub/projects, then apply the same Project Capability Scan resume rule to ATLAS.
```
