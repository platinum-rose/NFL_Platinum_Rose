# H2C2 Start Here — Week 5 Sunday cards, round 2 (Claude Team 3)

Required first read. Written Sun 2026-10-11 ~00:50 PT by Claude Team 2. It routes you to one lane; the detailed briefing, manifest and copies are on-demand only.

## Start in this order

1. In `E:\dev\projects\NFL_Dashboard` run `git status -sb`, `git branch --show-current`, `git log -12 --oneline`. Expect `main` with the H2C2 handoff commit on top of `aaafb25`, ahead of origin (nothing pushed). **Live Git wins** over this brief; if they disagree, stop and report.
2. Check the clock against kickoffs: **PHI@JAX Sun 06:30 PT**; nine games 10:00 PT; DEN@LAC 13:05; DET@ARI, SF@SEA 13:25; BAL@ATL 17:20; BUF@LAR Mon 17:15.
3. Choose one lane below; read only its section of `handoffs/2026-10-11-0050-claude-h2c2-week5-cards-round2-briefing.md`.

## State in one paragraph

All 14 Week 5 games have a fresh **Opus** synthesis and a slate merge, built on Saturday-night captures (BKR 06:21Z, BEO 06:24Z = 23:21/23:24 PT) that **lapse before most kickoffs** (PHI@JAX ~02:21 PT, 10:00 games ~04:00 PT). Every output is pass / conflicted / price moved at skip or research_only; edges ~0. The Master Intel report (`dist/nfl_week5_master_packet/`, gitignored) is built and committed-input-clean: 10 ranked sides, 9 totals, 56 props, props pool for every game, all labelled **research-only at stale prices** with the Opus caution. No sportsbook tickets exist. **Andy decided to keep these captured prices and recapture in the morning.**

## Guardrails

- Sportsbooks read-only: no bets, account/cashier actions, or TheOddsAPI. No paid Gemini or Supabase writes unless Andy runs them; no database deletes.
- Proposed ≠ placed. Ledger/portfolio/official-pick records change only to record what Andy reports, with his explicit authorization.
- Preserve the dirty shared checkout: commit explicit paths only; never `git add -A`, reset, clean, stash. Move stale `.git/*.lock` aside with `mv`, never delete.
- Roster gate (`npm run roster:vet -- --week 5 --date 2026-10-11 --strict`) and ESPN roster-group check before any player-specific card.
- Don't re-run packets or per-game synthesis except after Andy's recapture. Andy runs anything the cloud VM can't reach (git push, sportsbook capture) in PowerShell.

## Active lanes

| Lane | Next safe action | Read now |
|---|---|---|
| A. Post-recapture refresh (first) | Andy recaptures BKR + BEO; then ESPN status, roster vet, packet rebuild, commit, new HEAD | Briefing §5.1 |
| B. Re-run changed games | Only games whose line/availability changed; Opus or Astra; validate; hand-check | Briefing §5.2 |
| C. Final cards + Master report refresh | Fresh prices, roster gate, update digest tiers, `build.py`, exports, PDFs, commit | Briefing §5.3 |
| D. Andy's open items | Weather refresh OK, SuperContest label-swap OK, `git push` | Briefing §4 |

## Stop conditions

- Stale/missing capture, changed line, unavailable market, availability/status conflict, preflight FAIL or traceback.
- Any request needing a wager, account action, paid call, Supabase write or official-record change without Andy's explicit go-ahead.
- Git, live sources and this packet disagree materially.

## Packet map

- Detailed briefing: `handoffs/2026-10-11-0050-claude-h2c2-week5-cards-round2-briefing.md`
- Per-game outputs: `reports/intel/games/2026-w05-opus-<GK>.md`, `data/research-intel/proposed/games/2026-w05-opus-<GK>.json`; slate merge `reports/intel/2026-w05-opus-slate-merge.md`; decision support `reports/bets/2026-w05-opus-decision-support.md`
- Master Intel inputs: `reports/intel/master-intel-narratives-2026-w05.md`, `scratch/w05-synthesis-digest-sat.md`, `reports/bets/2026-w05-card.md`; Codex originals in `reports/intel/_bak/`, `reports/bets/_bak/`
- Reconciliation draft: `reports/bets/2026-w05-sunday-card-reconciliation-DRAFT.md`
- Snapshot README, `file-manifest.md`, `commits.md`, `copies/` (this folder): provenance only. Do not build from copies.
