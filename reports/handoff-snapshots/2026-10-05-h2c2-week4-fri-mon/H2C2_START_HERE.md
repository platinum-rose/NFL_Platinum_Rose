# H2C2 Start Here — Week 4 close-out and Week 5 launch

This is the required first read for the incoming Claude Team 2. It routes work through
the H2C2 packet without requiring a fresh team to absorb every historical handoff.

## Start in this order

1. Run `git status -sb`, `git branch --show-current`, and `git log -5 --oneline` in
   `E:\dev\projects\NFL_Dashboard`. Live Git wins over this October 5 snapshot.
2. Confirm that the selected work is authorized and choose one lane below.
3. Read only the indicated detailed-briefing sections and live artifacts. The chain
   digest, file manifest, ticket ledger, and older handoffs are for recovery, source
   verification, or contradiction resolution—not default startup reading.

## Guardrails

- Sportsbooks are read-only: no bet placement, account/cashier action, or TheOddsAPI.
- No Supabase write or `game_odds_snapshots` pricing without Andy's per-action approval.
- Ledger, portfolio, and promotion records change only to record what Andy reports.
- Preserve the dirty shared checkout. Never use `git add -A`, reset, clean, stash, or
  pull over local work. Use the detailed briefing's temporary-index method only for a
  scoped, authorized commit.
- Before presenting any player card, run the roster gate against the capture date.

## Active lanes

| Lane | Next safe action | Read now | Load only if needed |
|---|---|---|---|
| MNF live close-out | Log tickets Andy reports; rebuild trackers; settle after final; grade pick'em. | Briefing §4.1–§4.3 and §6a; live ledger/tracker files. | `week4-ticket-ledger.md` and chain digest for a disputed ticket/result. |
| Week 5 lines and promos | Capture only boards Andy supplies; correct CHI@GB; handle Bills credit/reloads only with current authorization. | Briefing §4.4, §4.8, §6a; current BKR board and promo/portfolio files. | Manifest/snapshot copies to compare provenance. |
| Week 4 analysis | Grade paper tickets, separate proposals from placed tickets, and prepare the end-of-week analysis. | Briefing §6b and live ledger/report files. | Ticket ledger and chain digest for historical reconciliation. |
| Week 5 Master Intel | Begin the documented cadence; do not synthesize wagers until the evidence gate is complete. | Briefing §4.5–§4.6, then the weekly-synthesis prompt §5/§7.2 and report runbook. | Format spec, canonical extraction pipeline, or earlier handoffs only when the selected task calls for them. |

## Stop conditions

- Ask Andy before any wager/account action, paid model call, Supabase write, official-pick promotion, or unreported ledger mutation.
- Stop and report if Git, a live source, and the packet give materially different state.
- Do not treat snapshot copies as live inputs; they are provenance records.

## Packet map

- Detailed briefing: `handoffs/2026-10-05-1300-claude-h2c2-team2-briefing-week4-fri-mon.md`.
- Snapshot README and manifest: this directory's `README.md` and `file-manifest.md`.
- Chain digest: `handoff-chain-digest.md` — on demand only.
- Snapshot ticket ledger: `week4-ticket-ledger.md` — settlement/reconciliation only.
