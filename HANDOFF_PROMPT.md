# Resume Prompt - NFL_Dashboard portfolio synthesis pipeline

Resume in `E:\dev\projects\NFL_Dashboard`.

Start by reconciling live state, not memory alone. This prompt was refreshed
by Claude on 2026-09-08 at session close, following a full round of
Codex-review triage, three-way reconciliation, and a fresh futures-odds
ingest.

## First Reads

- `HANDOFF.md` (read the top "Current Pick Up Here" block first)
- `WORKING-CONTEXT.md`
- `handoffs/2026-09-08-2104-claude-session-close-handoff.md` — the fullest
  account of this session's close; links to everything else below
- `handoffs/2026-09-08-1322-claude-codex-review-triage-handoff.md`
- `handoffs/2026-09-08-1335-antigravity-reconciliation-handoff.md`
- `handoffs/2026-09-08-1336-codex-claude-triage-reconciliation-handoff.md`
- `handoffs/2026-09-08-1405-antigravity-batch1-exhaustion-handoff.md`
- `docs/audits/2026-09-08-intel-pipeline-map/PRE_COMMITTEE_CHECKLIST.md`
- `docs/CODEX_REVIEW_FUTURES_PORTFOLIO_PIPELINE_2026-09-08.md`

Then run:

- `git status --short --branch`
- `git log -n 8 --oneline --decorate`
- `node agents/portfolio-preflight.js --json --warn-only` (confirm current
  BLOCK/WARN/PASS counts match what's documented below before trusting it)

## Current Verified State (as of session close, 2026-09-08 21:04 UTC)

- Branch: `main`
- HEAD: `0fc6112 chore(futures): add betonline exacta matchup snapshot` — 1
  commit ahead of `origin/main`. This is **Codex's own commit** (their
  BetOnline dry-run artifact), stuck locally only because their GitHub
  token is currently invalid — not a conflict with anything else in flight.
- Worktree is dirty; preserve it.
- Nothing was staged, committed, or pushed this session.

## Team Structure (new as of 2026-09-08)

- **Antigravity** owns the podcast+article ingestion pipeline. Already
  active — Batch 1 landed same day (master-report corpus grew 79 → 83
  reports, 100% test suite passing, 0 ESLint errors).
- **Claude** implements changes to the portfolio-synthesis pipeline
  (`agents/portfolio-dossier.js`, `agents/portfolio-preflight.js`,
  `agents/portfolio-synthesize.js`, `scripts/lib/dossier-freshness-gate.js`,
  and related).
- **Codex** independently reviews and approves Claude's pipeline changes
  before anything is treated as ready to ship or run for real.
- Any of the three finding something that conflicts with another's
  in-flight work gets reconciled via a dated handoff in `handoffs/`, per
  the pattern set this session — never silently overwritten.

## What Landed This Session (all verified live, nothing assumed)

1. **All 6 findings from Codex's independent pipeline review resolved.**
   5 fixed outright (master-report pagination + word-boundary alias
   matching in `loadMasterReportEvidence()`; full preflight gate now
   enforced inside `portfolio-synthesize.js` via a new
   `--allow-unsafe-preflight`-overridable check; dead `bettorday_trench`
   evidence lane removed from `dossier-freshness-gate.js`; stale
   roster-churn warning text in `portfolio-preflight.js` corrected). The
   6th (podcast-coverage WARN-vs-BLOCK threshold) was investigated further
   at Andy's prompt — the denominator was counting non-NFL episodes,
   corrected via the existing `isNflRelevantEpisode()` filter to
   **55/128 (43.0%)**, not 56/167 (33.5%); threshold intentionally left at
   WARN.
2. **Three-way reconciliation.** Antigravity and Codex each independently
   verified these fixes against live code and filed their own handoffs —
   full agreement, nothing reverted or in conflict.
3. **Fresh BKR + BetUS futures odds ingested** (`docs/Futures_Odds/
   BKR_Odds_0908`, `BetUS_Odds_0908` → `scripts/parse-futures-text.js` →
   `scripts/ingest_futures_json.py`, 256 + 480 rows, dry-run verified then
   written on Andy's explicit go-ahead). `futures_odds_snapshots` now shows
   `bookmaker`/`betus` at 0.9 days fresh; still BLOCKs overall on `caesars`
   (10d stale) and `circa` (never captured) — unrelated to this session's
   code work, needs Andy to source those two books.
4. **Both planning docs updated in place** to reflect all of the above —
   `PRE_COMMITTEE_CHECKLIST.md` (new dated banner, 6 new checked-off Stage 0
   items, Stage 1's odds item marked done, Decision #3 updated) and the
   spec doc (new Section 8a, Section 9's "what changed" expanded, Section
   10's gap list corrected, Section 12 records the new team split).

## Live Preflight at Close

```
3 BLOCK / 8 WARN / 22 PASS, safe_to_run_paid_synthesis: false
BLOCK lanes:
  - futures_odds_snapshots: caesars stale (10.0d), circa never captured
    (bookmaker 0.9d, betus 0.9d, betonline 0.3d, betmgm 0.3d — all fresh)
  - data/player-availability/latest.json: 26.5d old (preseason limit 14d)
  - data/prediction-markets/latest.json: 17.0d old (limit 7d)
```

The two file-freshness BLOCKs are pre-existing, not from this session, and
not yet explicitly assigned to either Antigravity's new scope or anyone
else — worth raising with Andy if picking up intel-freshness work.

## Review Stance for the Next Session

If continuing pipeline implementation: pick the next item from
`PRE_COMMITTEE_CHECKLIST.md` or the spec doc's Section 10 gap list. Top
open item by the spec doc's own ranking: **Section 5's interpretive/trust
framing** for `vault_analytical_reads`, `training_camp_intel`, and
`master_reports` in `SYSTEM_PROMPT` — currently these reach the model as
raw JSON with zero guidance on how much to trust them relative to price
action. Confirm with Andy before starting, per this repo's standing
approval pattern, unless he's already specified the next target.

If reviewing (Codex persona): spot-check the 5 fixes above against current
`git diff` (all uncommitted), and re-run
`node agents/portfolio-preflight.js --json --warn-only` plus a
`--prompt-only --shadow-slim` dry-run to confirm nothing regressed since
this handoff was written.

## Standing Constraints (unchanged)

- Preserve the dirty worktree; no cleanup/reset/stash/broad staging/commit/
  push without Andy's explicit approval; scoped `git add <files>` only when
  approved.
- No Supabase writes without per-write authorization.
- No paid committee synthesis (`agents/portfolio-synthesize.js` against
  real models) without explicit authorization.
- No betting picks, official-pick promotions, or portfolio/bankroll
  mutations without explicit authorization.
- No Yahoo Fantasy work.
