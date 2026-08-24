# NFL_Dashboard — Deep Audit Report

_2026-08-21, ATLAS S333 (Cowork). Live-tested against the local dev server
via Claude in Chrome using Andy's real Supabase data; repo-level findings
pulled from the working tree on `E:\dev\projects\NFL_Dashboard` directly.
Mission scope confirmed with Andy beforehand: all six of the newer pillars
(podcast, futures analyst, training-camp intel, props, prediction-markets,
Twitter) are in-mission and meant to be perfected, not pruned. Core priority
order: main matchup cards/intel and bankroll/portfolio management first,
everything else close behind._

## 1. Confirmed bugs

### 1a. Bet Management ("Bankroll") popup is broken end-to-end — highest priority

This is the single most important finding in this audit: it sits inside
bankroll/portfolio management, one of the two paramount-priority areas, and
Andy flagged it independently before I'd gotten to it myself.

Clicking "Bankroll" on any matchup card opens a modal meant to log a bet
against that game. Three things fail:

- **Every game in the "Game" dropdown reads "undefined @ undefined."** Not
  just the one card clicked — inspected the full option list (300+ entries)
  and every single one is unlabeled. The underlying ESPN event IDs are
  correct (e.g. `401873271`); the label-building code just isn't finding team
  names on whatever shape of game object it's receiving.
- **"Team" never auto-populates and has no real options.** Inspecting it
  directly: exactly three options — "Select Team" plus two entries with no
  label text at all. It doesn't react to which game is selected either.
- **"Bet Amount" (Kelly-based unit sizing) shows literal `$NaN`.**

No console errors accompany any of this — it fails completely silently.
Likely one root cause: a mismatch between the field names the modal expects
(probably `homeTeam`/`awayTeam` display names) and the actual shape of the
schedule/game data being passed to it. Fixing the data mapping in one place
likely resolves the Game label, the Team list, and the Kelly math together,
since sizing almost certainly depends on the same broken lookup.

**Recommendation:** highest-priority fix, ahead of any bloat cleanup. Trace
`BetEntryModal.jsx` (or wherever "Bet Management" renders from) and whatever
prop/hook hands it the selected game — compare its expected field names
against what `useSchedule.js` actually returns.

### 1b. Picks & Inbox tab never resolves

Loads to a permanent spinner — "Checking local inbox server at
http://127.0.0.1:8787..." — with no timeout, no error state, no retry
control. Held for 10+ seconds with zero change. Two open questions, not yet
distinguished: whether a companion local server this depends on should be
running (and isn't documented in the README's setup steps), or whether the
health-check itself simply has no timeout/fallback UI. Either way: a real bug
today, since anyone hitting this tab without that context gets an
unexplained infinite spinner.

**Recommendation:** add a timeout + explicit error state regardless of the
underlying cause, and document the `127.0.0.1:8787` dependency in the README
if it's expected to run locally.

### 1c. Live Odds Center returned 0 games from TheOddsAPI (local dev)

Console: `✅ Live Odds Loaded: 0 games from TheOddsAPI`, followed by an
ESPN-fallback warning for all 321 scheduled games individually. Not yet
confirmed whether this is a local-only config issue (missing/expired
`ODDS_API_KEY` in local `.env`, harmless) or reproduces on the deployed site
too.

**Recommendation:** check the deployed production site directly to separate
"local dev isn't configured" from "the feature is actually broken." Also see
2b below — the per-game fallback logging is real, separate waste regardless
of the root cause.

### 1d. Splits: false alarm, actually handled well

Initial console warning ("Splits load failed: Error: Splits not found") read
like a bug, but the Splits Analysis modal has a clean, correct empty state:
"No Splits Data Found — Waiting for Cron Job to populate
`betting_splits.json`..." **Not a bug.** Only nitpick: the console logs it at
warning level, which is misleading to anyone debugging from the console
alone when the UI already explains it clearly.

### 1e. Futures analyst AI tool returns empty

Asking the Sides & Totals agent about YouTube podcast intel on both Super
Bowl and Chiefs futures returned "There is currently no local YouTube futures
intel available... The summary may need to be regenerated," for both
prompts tried. Live gap in the futures/podcast pillar Andy specifically wants
perfected — needs whatever regeneration step produces that local intel file.

## 2. Performance findings

### 2a. All ~23 modal components load eagerly, un-code-split

Confirmed via the network request log on page load: `MatchupWizardModal`,
`MyCardModal`, `SplitsModal`, `WongTeaserModal`, `PulseModal`,
`ContestLinesModal`, `AudioUploadModal`, `ReviewPicksModal`,
`BulkImportModal`, `ExpertManagerModal`, `InjuryReportModal`,
`UnitCalculatorModal`, `BetEntryModal`, `BetImportModal`,
`PendingBetsModal`, `EditBetModal`, `ManualGradeModal`,
`BankrollSettingsModal`, `FuturesEntryModal`, `StorageBackupModal`,
`PodcastIngestModal`, `AgentStatusModal`, `ProfileSettingsModal`,
`LineHistoryModal`, `PredictionMarketModal` are all statically imported into
the initial bundle even though at most one or two are ever open at once.
This is the most concrete, fixable lead for the in-browser sluggishness Andy
described — the initial JS payload is carrying every modal's code whether or
not it's ever opened in a given session.

**Recommendation:** convert these to `React.lazy(() => import(...))` behind
their trigger buttons. Straightforward, high-confidence win; verify with a
before/after production build size comparison.

### 2b. 321 synchronous per-game console.warn calls on every load without live odds

Real, measurable waste, separate from whether the 0-games root cause (1c) is
a config issue or a live bug — one warning per game, string interpolation
plus stack-trace capture, called in a tight loop. The dev session generated
**1,312 console messages within roughly 10 seconds of use.** Should collapse
to one summary line ("0/321 games have live odds, all using ESPN fallback").

### 2c. No hard JS exceptions found anywhere tested

Dashboard & Games, AI Intel & Command, Fantasy & Props, Injuries &
Availability, Bankroll & Futures tab, Teasers, Contest, Pulse, Kalshi/Poly,
Splits, and the broken Bankroll popup and Picks & Inbox tab — none threw a
console error. The app has specific soft spots, not systemic instability.

### 2d. Top-bar utility tools: mostly in good shape

Cross-checking the remaining pillar surfaces against the two confirmed
problems above: Teasers (Wong Teaser Finder), Contest (SuperContest Lines,
manual-entry by design), Pulse (Market Pulse & Urgent Intel), and Kalshi/Poly
(Prediction Market Odds Converter) all work correctly with real data and
correct math. The breakage is concentrated, not spread evenly across the
app.

## 3. Repo-level bloat classification

### 3a. Safe to delete outright (build artifacts, ~34MB)

Eight directories, all named as build-verification snapshots, none of them
source:

| Directory | Size |
|---|---|
| `dist.old-1786404342` | 3.5M |
| `dist.old-1786405313` | 4.4M |
| `dist.old-1786405603` | 4.4M |
| `dist.old-1786406395` | 4.4M |
| `dist.old-1786407199` | 4.4M |
| `dist.old-1786408580` | 4.4M |
| `dist-verify-2026-08-13` | 4.2M |
| `dist-verify-2026-08-13b` | 4.3M |

Confirm nothing references these (a quick grep for the directory names
across the repo) before deleting — expected to come back clean since these
are timestamped one-off backups, not something code would import.

### 3b. Clearly out of place — not project docs at all

- `docs/The Genius of Desperation.epub` (2.9M) and
  `docs/TheGeniusofDesperati_9781641250825_3892848.acsm` (4K) — a personal
  ebook and its Adobe Digital Editions license file, unrelated to NFL_Dashboard
  by any reading of its mission. Almost certainly dropped in accidentally
  during a research session. Recommend removing from the repo (and from git
  history if it was ever committed with real content, given it's copyrighted
  material).

### 3c. `docs/` — 108 entries, 29MB, needs sorting into three piles

Most files carry a `2026-07-21` filesystem mtime that's suspiciously uniform
across dozens of otherwise-unrelated files — a bulk copy/reorg date, not a
reliable signal of when each was last relevant. The dates embedded in
filenames are the trustworthy signal here.

**Pile 1 — living specs and references, keep visible at top level (a
non-exhaustive sample; anything undated and description-like belongs here):**
`ARCHITECTURE.md`, `ROADMAP.md`, `GOTCHAS.md`, `ANTI_PATTERNS.md`,
`TESTING.md`, `NFL_BACKLOG.md`, `NFL_AUDIT_BACKLOG.md`, `FUTURES_REPORT_SPEC.md`
(load-bearing per ATLAS's standing rule — never archive this one),
`DASHBOARD_MATCHUP_CARD_LEGEND.md`, `PIPELINE_AGENTS.md`,
`YAHOO_INTEGRATION_SETUP.md`, `NFL_DASHBOARD_USER_GUIDE.md`,
`QUANT_RISK_SIZING_PLAYBOOK.md`, `LOCAL_PIPELINE_SPEC.md`.

**Pile 2 — completed, point-in-time artifacts: move to `docs/archive/`.**
Every filename carrying a specific date more than a few weeks old and
describing a review, audit, response, comparison, or manual check is
effectively a dated snapshot, not a living document. Representative (not
exhaustive) list: `SESSION_HANDOFF_2026-06-03_PODCAST_PHASE7.md`,
`SESSION_HANDOFF_2026-06-04.md`, `SESSION_HANDOFF_2026-06-05.md`,
`AUDIT_RECEIPT_2026-05-23.md`, `NFL-Dashboard-Audit-Report-2026-05-21.md`,
`FUTURES_ANALYST_CODEX_REVIEW_2026-07-22.md`,
`FUTURES_ANALYST_SYSTEM_INTELLIGENCE_AUDIT_2026-07-22.md`,
`FUTURES_ANALYST_WORKFLOW_SUMMARY_2026-07-22.md`,
`GEMINI_VS_ASSEMBLYAI_PODCAST_PIPELINE_REVIEW_2026-07-27.md`,
`NFL_UNFINISHED_WORK_SCAN_2026-07-27.md`,
`FUTURES_SYNTHESIS_REQUIREMENT_AUDIT_2026-07-30.md`,
`FUTURES_SYNTHESIS_SOURCE_READINESS_2026-07-30.md`,
`FUTURES_ODDS_BETONLINE_2026-07-29_MANUAL_REVIEW.md`,
`FUTURES_ODDS_BETONLINE_2026-08-10_MANUAL_REVIEW.md`,
`NFL_FUTURES_CLAUDE_REACQUISITION_GATES_REVIEW_FEEDBACK_2026-08-13.md`,
`NFL_FUTURES_CLAUDE_REACQUISITION_GATES_REVIEW_RESPONSE_2026-08-13.md`,
`NFL_FUTURES_SYNTHESIS_CODEX_CLAUDE_COMPARISON_2026-08-13.md`,
`NFL_FUTURES_SYNTHESIS_INCIDENT_REVIEW_CLAUDE_BRIEF_2026-08-13.md`,
`NFL_FUTURES_SYNTHESIS_INCIDENT_REVIEW_CLAUDE_RESPONSE_2026-08-13.md`,
`CODEX_HANDOFF_2026-07-22.md`, `F27_UI_QC_FINDINGS_2026-07-26.md`,
`CODEX_Ultrathink_NFL_Dashboard_Formal_Audit_Report.docx`,
`NFL_Platinum_Rose_Audit_Report.docx`. Roughly 25-30 files fit this pattern —
worth a full pass rather than treating this list as final.

**Pile 3 — "LATEST" pointer files coexisting with their own dated history.**
`FUTURES_ODDS_EXECUTION_VALIDATION_LATEST.md` exists alongside
`FUTURES_ODDS_EXECUTION_VALIDATION_2026-08-11.md` and `..._2026-08-12.md`;
similarly `NFL_INTEL_SOURCE_AUDIT_LATEST.html` and
`SEASON_READINESS_SMOKE_TEST_LATEST.md` each imply there should be a
superseded-snapshot pattern here. If `_LATEST` is meant to be the current
pointer, the dated ones behind it are natural Pile 2 candidates once
confirmed superseded.

### 3d. Large data dumps living inside `docs/` (not classified as bloat, but likely mis-located)

These aren't clutter to delete — they're real working data — but `docs/` is
probably the wrong home for them:

| Directory | Size |
|---|---|
| `podcast-transcript-deep-dives` | 6.9M |
| `Futures_Odds` | 5.8M |
| `article-intel-review` | 5.6M |
| `player-availability` | 2.0M |
| `prediction-markets` | 1.1M |
| `fantasy` | 652K |
| `podcast-narratives` | 484K |
| `antigravity` | 440K |
| `projected-starters` | 360K |

**Recommendation:** decide with Andy whether these are pipeline output caches
(regenerable, candidate for `.gitignore` + a `data/` directory) or genuine
reference material worth keeping under version control as-is — that
determines whether they move, get ignored, or stay put.

### 3e. `TASK_BOARD.md` — bloat is concentrated in a few cells, not the item count

Only 133 lines for 67KB — the size comes from a small number of table rows
carrying multi-paragraph narrative essays inline in the "Notes" column
(one "IN PROGRESS" row alone is several hundred words of session history),
rather than from having too many tracked tasks. That narrative content
usually already has a proper home — the row in question explicitly says
"Full history in `docs/PODCAST_HOST_SUMMARY_PIPELINE_PLAN.md`" — so the fix
is trimming Notes cells to a one-line summary + link, not removing tasks.

### 3f. `WORKING-CONTEXT.md` — looks properly maintained, not bloat

196 lines, actively tracks git state and dirty/untracked file boundaries,
references the `handoffs/` directory by name. Didn't find evidence this one
needs pruning the way `TASK_BOARD.md` does.

### 3g. `handoffs/` — 54 dated files, 444K total

A rolling log, similar in spirit to ATLAS's own `.atlas/session_archive.md`
pattern. Not large enough to be urgent, but worth confirming whether there's
a rotation/archive convention for the older ones, or whether it's meant to
grow unbounded.

### 3h. `scratch/` — actually empty, not a cleanup item

Listed in the original root scan as a bloat signal; turned out to have zero
files. No action needed.

## 4. What this audit did not cover

- Production (deployed GitHub Pages) cross-check for the Live Odds finding.
- Full read-through of Pile 2's ~25-30 candidate files to confirm none are
  secretly still load-bearing (spot-checked the pattern, not every file).
- The individual futures/podcast/props/prediction-market/Twitter panels
  beyond the two AI-assistant prompts tried — the top-level pillar surfaces
  tested clean, but their deeper flows weren't exhaustively clicked through.
- Whether "Add Bet" in the broken Bankroll modal fails loudly or silently
  persists bad data if forced through with `$NaN` — not attempted, to avoid
  writing test data into Andy's real Supabase tables.
