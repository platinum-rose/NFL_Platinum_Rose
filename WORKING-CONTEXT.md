# Working Context - Platinum Rose NFL Dashboard

Active workspace memory for the assistant. Keep this brief and accurate.

## Current State

As of: 2026-09-08 (session close, 21:04 UTC).

Verified Git state: `main` is 1 commit ahead of `origin/main` at
`0fc6112 chore(futures): add betonline exacta matchup snapshot` — this is
Codex's own commit, stuck locally on their invalid GitHub token, not a
conflict with anything else. The worktree is dirty and must be preserved.

Current pickup: continue portfolio-synthesis pipeline implementation.
Start with `HANDOFF_PROMPT.md`, then reconcile live Git and preflight state
before editing or running checks.

## Team Structure (new as of 2026-09-08)

- **Antigravity**: podcast+article ingestion pipeline (already active,
  Batch 1 landed same day — master-report corpus 79 → 83).
- **Claude**: implements portfolio-synthesis pipeline changes.
- **Codex**: independently reviews/approves Claude's changes before
  anything ships.

## What Happened This Session

Codex independently reviewed the pipeline (spec doc +
live code) and returned 6 findings. Claude fixed 5 outright and corrected
the 6th's measurement (podcast coverage denominator was counting non-NFL
episodes — corrected to 55/128, 43.0%, kept at WARN by design). Antigravity
and Codex each independently verified the fixes against live code — full
agreement, three reconciliation handoffs filed. Andy then had fresh
BKR/BetUS futures odds ingested (736 rows total, dry-run verified then
written). Both `PRE_COMMITTEE_CHECKLIST.md` and the Codex-review spec doc
were updated in place to reflect all of this.

Full detail: `handoffs/2026-09-08-2104-claude-session-close-handoff.md`.

Files with real code changes this session (all uncommitted, all
`node --check`/`eslint` clean):

- `agents/master-reports-to-vault-sync.js` (header comment only)
- `agents/portfolio-dossier.js`
- `agents/portfolio-preflight.js`
- `agents/portfolio-synthesize.js`
- `scripts/lib/dossier-freshness-gate.js`

## Live Preflight

`3 BLOCK / 8 WARN / 22 PASS`, `safe_to_run_paid_synthesis: false`. Blockers:
`futures_odds_snapshots` (caesars stale, circa never captured — bookmaker/
betus now fresh), `data/player-availability/latest.json` (26.5d old),
`data/prediction-markets/latest.json` (17.0d old). None are code defects;
none touched this session; the two file-freshness ones aren't yet assigned
to either team's new scope.

## Next Likely Target

Top-ranked open item in the spec doc: add explicit interpretive/trust
framing in `SYSTEM_PROMPT` for `vault_analytical_reads`,
`training_camp_intel`, and `master_reports` — currently reach the model as
raw JSON with no guidance on how much to trust them relative to price
action. Confirm with Andy before starting.

## Standing Guardrails

- Do not clean, reset, stash, revert, delete, broad-stage, commit, or push
  without explicit approval.
- Do not run `agents/portfolio-synthesize.js` against paid models/API
  without explicit approval.
- Do not perform Supabase writes without explicit per-write approval.
- Do not mutate betting picks, official picks, portfolios, parlays, open
  proposal slots, or recommendation persistence without explicit approval.
- No Yahoo Fantasy work unless explicitly directed.
- Preserve unrelated dirty work; inspect scoped diffs before touching
  shared files.
