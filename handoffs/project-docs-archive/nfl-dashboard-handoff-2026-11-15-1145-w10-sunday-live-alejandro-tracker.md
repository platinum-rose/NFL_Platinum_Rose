# NFL Dashboard handoff — 2026-11-15 11:45 PT — W10 Sunday live, Alejandro tracker live

Repo `E:\dev\projects\NFL_Dashboard`, branch `claude/w5-prop-cards-2026-10-11`, commit **9b0786b3** pushed. Full repo handoff: `handoffs/2026-11-15-1145-claude-w10-sunday-live-alejandro-tracker.md`.

## Done
- Every W10 ticket logged with a ticket/position number (except the DKP first-TD 3-pick and the boosted Alejandro 5-pick). Local ledger only, no Supabase.
- New tickets since the 01:35 handoff: DKP promo 8-pick 60232674, BKR 5-leg props #741848628, BKR teaser NE +8.5/BUF −2 #741848843, BKR SGP+ #741849069, BEO ATD 8-leg #1015544828, BEO NE@DET 4-leg #1015545207 (lost), BEO NYJ +9 free bet #1015546951, BEO Happy Hour GB −3 #1014724720, DKP first-TD 3-pick (Cook/Hubbard/D. Henry), Alejandro splits: boosted 5-pick, 8-pick 60555716, 7-pick 60689102.
- Fixed: QB INT legs logged as `pass_int` weren't graded; renamed to `pass_interceptions` (use that going forward).
- **Alejandro Live Tracker** live at https://platinum-rose.github.io/alejandro-tickets/ — `generate-live-tracker.mjs --partner Alejandro` (same Ticketboard, his share, leg notes, season ledger, Andy-only data never read). Republish: `npm run tracker:alejandro:publish`.
- Defender tackle model `scripts/analysis/def_tackle_split_model.py` (volume signal validated; not tested vs prices). Kicking FG model: no signal.

## Next
1. Sweat the slate; settle W10 after SNF/MNF; then republish Alejandro's page.
2. Missing position #s: DKP first-TD 3-pick, DKP boosted Alejandro 5-pick. Solo/split unconfirmed on several tickets placed overnight.
3. Conflict to watch: PIT@CIN O46.5 (SGP+) vs U48.5 (master 8-team).
4. Optional: hide Add Sunday Slip / Export marks / Hide Imaginary on Alejandro's page; save DKP tackle prices weekly.
