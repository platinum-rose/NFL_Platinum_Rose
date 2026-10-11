# H2C2 Start Here — Week 5 Sunday cards (Claude Team 2)

Required first read. Written Sat 2026-10-10 ~23:15 PT by Claude Team 1. It routes you to one lane; the detailed briefing, manifest, copies and older handoffs are on-demand only.

## Start in this order

1. In `E:\dev\projects\NFL_Dashboard` run `git status -sb`, `git branch --show-current`, `git log -5 --oneline`. Expect `main` with the H2C2 handoff commit on top of `7ebef66`. **Live Git wins** over this brief; if they disagree, stop and report.
2. Check the clock against kickoffs: **PHI@JAX Sun 06:30 PT (London)**; nine games 10:00 PT; DEN@LAC 13:05; DET@ARI, SF@SEA 13:25; BAL@ATL 17:20; BUF@LAR Mon 17:15.
3. Choose one lane below; read only its briefing section and artifacts.

## State in one paragraph

All 14 Week 5 games have a validated per-game synthesis by **Opus** (plus Astra for CLE@NYJ, CHI@GB, MIN@NO, BAL@ATL), all written against **Saturday-night captures that expired at 00:15 PT (BKR) / 02:15 PT (BEO)** — nothing in them is a live price. Every output is pass / conflicted / price moved at skip or research_only, except Opus IND@PIT (price moved / 2−, weather-only Under 43.5; Team 1 recommends research_only). A number review lists 23 corrections, none of which changes a disposition, and a packet gap: 221 players in ESPN's roster IR/Out group are missing from every packet's availability lines (e.g. Achane, Conner, Etienne, Kerby Joseph, Jayden Reed). No per-game run supports Codex's review-only shortlist (LV +3.5, CHI −1.5, BUF +3) at tier 2 on Saturday prices.

## Guardrails

- Sportsbooks are read-only: no bets, account/cashier actions, or TheOddsAPI. No paid Gemini or Supabase writes unless Andy runs them; no database deletes.
- Proposed ≠ placed. Ledger/portfolio/official-pick records change only to record what Andy reports, with his explicit authorization.
- Preserve the dirty shared checkout: commit explicit paths only; never `git add -A`, reset, clean, stash.
- Roster gate (`npm run roster:vet -- --week 5 --date 2026-10-11 --strict`) and the ESPN roster-group gap list before any player-specific card.
- Andy runs anything the cloud VM can't reach (git push, sportsbook capture, X/RSS/YouTube) in PowerShell. Don't ask him to confirm publicly announced player statuses.

## Active lanes

| Lane | Next safe action | Read now | Load only if needed |
|---|---|---|---|
| A. Sunday-morning refresh (first, time-critical) | Andy recaptures BKR + BEO; then ESPN status, roster vet, packet rebuild, commit, new HEAD | Briefing §4.1 | `scripts/intel/build-w05-game-packets.py` header; snapshot `copies/` for Saturday provenance |
| B. Pipeline fixes (before rebuild) | ESPN roster-group availability; 4 prompt notes; optional BEO-expiry validator check | Briefing §4.2; review notes §2–§3 | `reports/intel/games/2026-w05-espn-roster-ir-out-gap.md` |
| C. Per-game reruns on fresh packets | Move old same-model outputs to `_superseded/`; Opus agents (foreground preflight) or Astra; validate; hand-check numbers | Briefing §4.3 | Prompt `prompts/2026-w05-game-synthesis.md` |
| D. Sunday card build (main lane) | Reconcile Codex's review-only card with the per-game outputs and fresh prices | Briefing §4.4; review notes §1, §4 | Codex handoff, `reports/bets/2026-w05-card.md`, hypothesis ledger |
| E. Slate merge (optional) | Dry-run only on Saturday Opus set, or real run after reruns | Briefing §4.5 | `prompts/2026-w05-slate-merge.md` |

## Stop conditions

- Stale/missing capture, changed line, unavailable market, availability/status conflict, preflight FAIL or traceback.
- Any request that needs a wager, account action, paid call, Supabase write or official-record change without Andy's explicit go-ahead.
- Git, live sources and this packet disagree materially.

## Packet map

- Detailed briefing: `handoffs/2026-10-10-2310-claude-h2c2-team2-week5-sunday-briefing.md`
- Results + corrections: `reports/intel/games/2026-w05-per-game-review-notes.md`
- ESPN roster-group gap: `reports/intel/games/2026-w05-espn-roster-ir-out-gap.md`
- Per-game outputs: `reports/intel/games/2026-w05-{opus,astra}-<GK>.md`, `data/research-intel/proposed/games/2026-w05-{opus,astra}-<GK>.json`
- Validator results: `validation-summary.txt` (this folder)
- Snapshot README, `file-manifest.md`, `commits.md`, `copies/` (this folder): provenance only — point-in-time copies of gitignored/dirty inputs (Saturday BKR/BEO captures, expert-verified rows, ESPN roster file, Codex's dirty card). Do not build from copies; live files stay at their original paths.
