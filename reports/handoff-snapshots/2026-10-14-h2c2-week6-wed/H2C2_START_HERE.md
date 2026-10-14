# H2C2 Start Here — Week 6 Wednesday (Claude Team 2)

Required first read. Written Wed 2026-10-14 ~11:00 PT by Claude Team 1 (Cowork session linked to Andy's laptop). It routes you to one lane. The detailed briefing, manifest, copies and older handoffs are on-demand only.

## Start in this order

1. In `E:\dev\projects\NFL_Dashboard` (device_bash: `$HOME/mnt/dev/projects/NFL_Dashboard`) run `git rev-parse --short HEAD` and `git branch --show-current` (20 s timeout). Do NOT run `git status` unless about to commit (2+ min, leaves `.git/index.lock`). Expect branch `claude/w5-prop-cards-2026-10-11`, HEAD = the H2C2 handoff commit on top of `dbf8225`. **Live Git wins**; if they disagree, stop and report.
2. Check the clock against the Week 6 kickoffs (not verified in this brief; read them from the BKR board `data/odds/BKR_current_lines_1014_0020`).
3. Choose one lane below; read only its section in the detailed briefing.

## State in one paragraph

Week 6 intel is partly built. Done and committed (all local, **not pushed**: 999b55a, 9cff701, 23d9810, 506bcf8, 7b7cc9a, dbf8225): BEO futures capture (842 rows / 131 markets), BEO props baseline (only SEA@DEN posted, 246 rows, gate failed as expected), BKR W6 full-slate lines (14 games, 10/14 00:20 PT) with the quant synthesis rerun on them, a $11.90 BEO free-spin win logged in the promo ledger (unallocated), refreshed ESPN rosters and secondary-matchup seeds with vulnerability rebuilt, and the Wednesday cadence outputs. **Not done:** the YouTube/podcast extraction (Gemini credits are depleted; Antigravity produced 3 of 6 episodes into an untracked, unvalidated staging folder), dossier/synthesis rebuild on the refreshed seeds, the dossier availability/priors layer, and the BEO props re-run.

## Guardrails (from Andy, verbatim where quoted)

- "no paid synthesis and no Supabase writes without my explicit authorization. Sportsbooks are read-only. Never use `git add -A`. Files can't be deleted on this mount, so overwrite instead. Commit locally and I push."
- Proposed ≠ placed. Portfolio/ledger/promo records change only to record what Andy reports, with his go-ahead.
- Roster gate before naming any player in a card or narrative.
- Andy runs what the cloud VM cannot reach in PowerShell (BEO capture port 9223, BKR 9222, git push, YouTube/Gemini). ESPN public APIs are reachable from the VM.
- Quant-synthesis numbers are provisional and unbacktested: not recommendations.

## Active lanes

| Lane | Next safe action | Read now | Needs Andy |
|---|---|---|---|
| A. Podcast picks (Even Money, Sharp or Square) | Validate the 3 extracted staging files, then ingest as `antigravity-transcript` observations | Briefing §4.A | go-ahead to ingest/commit; credits top-up or a retry for the 3 `no_transcript` episodes |
| B. BEO props re-run | After Andy runs `npm run bolp -- --week 6`: diff vs the baseline, gate needs >=500 rows | Briefing §4.B | runs capture in PowerShell |
| C. Rebuild W6 dossiers + quant synthesis on refreshed seeds | Dry-run diff first | Briefing §4.C | yes: offered, not yet authorized |
| D. Dossier availability/priors layer | Roster gate first | Briefing §4.D | no |
| E. Ledger hygiene (read-only) | Report anomalies, do not edit | Briefing §4.E | allocation decision, ticket numbers |
| F. Placeholder tiers | 11 placeholder rows (8 WR3, 3 SS) | Briefing §4.F | tier choices, only if they matter |

## Stop conditions

- Stale/missing capture, changed line, unavailable market, gate failure, preflight FAIL or traceback.
- Anything needing a wager, account action, paid call (including Gemini `--run-gemini`), Supabase write, or official-record change without Andy's explicit go-ahead.
- Git, live sources and this packet disagree materially.

## Packet map

- Detailed briefing: `handoffs/2026-10-14-1100-claude-h2c2-team2-week6-wednesday-briefing.md`
- Snapshot README / `file-manifest.md` / `commits.md` / `copies/` (this folder): provenance only. `copies/` holds a point-in-time copy of the untracked Antigravity staging files; the live working copy stays at `data/shadow-harness/antigravity-staging/`. Do not build from copies.
