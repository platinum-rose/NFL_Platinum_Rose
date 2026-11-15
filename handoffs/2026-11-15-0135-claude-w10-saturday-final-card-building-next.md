# W10 Saturday final build done — continue Sunday card building (Claude, 2026-11-15 01:35 PT)

## State
- Master Intel + SuperContest reports rebuilt Sat night (latest archive `reports/intel/packets-archive/2026-w10/2026-11-14-2145-build`). Roster vet PASS, SC format gate PASS. Saturday gate RED only on S2 (BKR props thin for SEA@LV, SF@DAL — Andy accepted).
- Saturday synthesis re-run complete: Claude 10 games, Codex NE@DET / KC@ATL / HOU@CLE (`SAT-RERUN` lines in `reports/intel/games/2026-w10-game-RUNLOG.md`). Digest: `scratch/w10-synthesis-digest-sat.md`.
- Card expanded (Andy 9:21 PM): every B/C play still +EV is a Platinum Rose rec (10 sides/totals + 20 props); every-game leans in §L with above/below break-even caveats.
- Weekend template proposals for every slot written to `reports/bets/2026-w10-card.md` ("Week 10 Sunday/Monday card — supersedes…"): singles, morning/afternoon/hybrid parlays, SC split stake, dog ML RR, 7a/7b/7d/7e, 8a/8b, SNF/MNF 3-tier ladders. Below-break-even tickets are labelled.
- 16 Master Intel parlays logged as imaginary $10 paper tickets (`paper_w10_mi_*` in `data/official-picks/paper-wagers-2026.json`).
- AI SuperContest five re-ranked at contest lines: KC -3.5, SF -4.5, BAL -4.5, JAX -10.5, ARI +9.5 (alts CAR +2.5, PIT +3.5). Root cause of the change: Friday CAR SC grade used a draft sim (53.9%) instead of the final (52.7%). Proposed fix (not built): check that SC grades come from each game's final sim run.
- **Official SC five (Andy & Amanda):** IND -3, KC -3.5, SF -4.5, JAX -10.5, BUF -7.5 → `data/supercontest/locked-card-week-10.json` (tracker SC tab shows contest lines).

## Real tickets logged tonight (local ledger only, no Supabase)
- DKP Alejandro splits: 6-pick ($10/$169), 7-pick ($9.97/$283), 5-pick NE@DET ($10/$98), 8-pick #60166483 ($9.98/$349).
- BKR 6-leg +3305 ×2 (Alejandro split + Andy solo double; ticket #s missing).
- BKR master 8-team parlay #741847132 ($5) + 4s RR #741847133 ($105). Rule C5 overridden by Andy.
- BKR SC 5-team #741847526 ($20) + 2s RR ($20, ticket # missing — probably 741847527).
- Tracker: 10 real W10 tickets open + 16 paper. Mobile tracker NOT republished.

## Open / next
1. Continue Sunday card building (Andy). BEO 8-leg prop slip (+12,800) was priced but not confirmed placed.
2. Fill missing ticket numbers (BKR 6-leg ×2, SC RR).
3. Morning refresh if wanted: splits (8h), Master pull (10h), injuries (10h) are stale by Sunday AM. Confirm inactives (Q/D players) before kickoff; NE@DET 6:30 AM PT.
4. Investigate why scheduled NFL_BetOnline_Prop_Sync skipped Props Builder at 8:10 PM (manual rerun restored 936 rows).
5. Kalshi $25.01 bonus credit expires ~2026-12-14 (reminder set 12/8).

## Addendum 02:58 PT (Claude, same session) — 6 more real tickets logged (local ledger only)
- DKP promo 8-pick (Strange/Dulcich/Shakir/Watson/Young/Charbonnet/Kyren/C. Brown), $10 promo → $946. Replaces the BEO +12,800 slip (never placed). Position # missing.
- BKR 5-leg props (Cook O19.5 att / Taylor O15.5 att / Olave O73.5 / Rice O5.5 rec / Collins U4.5 rec) +2880, $10. Henry dropped (BKR -102). Ticket # missing.
- BEO 8-leg ATD parlay +5300, $7.65. Ticket # missing.
- BEO NE@DET 4-leg SGP #1015545207 +2600, $5 (Henry O3.5 rec / LaPorta ATD / Gibbs O4.5 rec / NE ML). Low-correlation build; the correlated version priced +850.
- BKR 2-team 6-pt teaser NE +8.5 / BUF -2, -120, $42. Ticket # missing.
- BKR SGP+ 8-leg +6371, $8. **Conflict:** PIT@CIN O46.5 vs master 8-team U48.5 (middle 47–48).
- Pending: DKP first-TD 3-pick (Hubbard/Cook/D. Henry) — DKP down for maintenance; reminder scheduled 9:15 AM PT (trig_0155tFD7bPDyCjroX5yCxfYE). BEO fallback +12,275.
- All logged solo/cash unless noted; solo is an assumption. Tracker: 16 real W10 open + 16 paper. Mobile tracker still not republished.
