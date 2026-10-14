# Week 6 Wednesday ledger hygiene (Lane E, read-only)

Run Wed 2026-10-14 ~13:30 PT by Claude Team 2. **No ledger was edited.** Every item below is a finding for Andy to confirm; nothing here changes an official record.
Files read: `data/futures-imports/andy-portfolio-ledger-2026.json` (as_of 2026-10-08), `data/sportsbooks/promotions-2026.json` (updated_at 2026-10-13), `data/official-picks/user-placed-wagers-2026.json` (165 wagers), `data/futures-imports/open-parlays-2026.json` (summary only).

## Needs Andy (facts only he has)

1. **Ticket 994540980 is on two positions.** In the futures ledger it is both `bills_sb` ($50 at +1000, to win $500) and `bills_packers_exacta` ($45 at +8300, to win $3,735). One ticket cannot be both. The Bills SB math supports 994540980 being the $50 Bills ticket (blended 992 = (500+86.36)/59.09). The exacta's ticket number is probably a copy error; the real number is unknown. Please supply it from the BetOnline ticket list.
2. **Bears exactas (ticket 1003471850) have no confirmed sportsbook.** Two $20 selections (Bears/Chiefs +5500 to win $1,100; Bears/Bills +5400 to win $1,080) are logged with book `unspecified_user_reported`, `book_confirmed: false`, supplied by Andy 2026-10-08. Odds math checks out. **Inference only:** the ticket number sits in the BetOnline numbering range (1002759127 on 10/05, 1003628818 on 10/09), so it is probably BetOnline. Please confirm. The same applies to the two 10/09 tickets 1003628818 and 1003626841 logged as "Sportsbook not supplied" ($5 each, both losses).
3. **Week 3 BetOnline $10 Bills credit.** The promo ledger says it is `received_unused`, planned for BUF@LAR on Mon 10/12. No BetOnline free-bet wager is logged after 10/04, and the 10/12 BetOnline wagers are all cash. Either it was not used or the use was not logged. The Week 2 vs Week 3 credit spent on NE +7 is also still unrecorded (logged first-in-first-out).
4. **Week 5 Bills credit is missing from the promo ledger.** BUF beat LAR 37-34 in OT on 10/12 (per the settled DKP combo note, ESPN box score). The promo says the credit lands by 7:00 pm ET the Wednesday after each win, which is **today by 4:00 pm PT**. `expected_credits` has no Week 5 row yet. Please confirm when it shows up.
5. **$15.86 BetOnline free-slots balance.** Consistent across files: $3.96 allocated to the futures portfolio (ledger `available_futures_funding`) plus $11.90 unassigned (promo ledger, 10/13, no decision as of 10/14 00:59 PT). Your pending allocation decision.
6. **BetOnline reloads, $7.68 total, unreconciled.** $2.85 (week of 9/14, plan: Packers SB at +2500 or longer, else exacta) and $4.83 (10/05, reported in a handoff, `reported_in_handoff_unreconciled`, plan: Bills SB). Neither is `applied_to` anything and neither appears in the futures ledger funding list. Please confirm the amounts and whether they were spent.
7. **Packers SB ticket 1002306799** is logged at +6600 ($20 cash, 10/04) while the earlier Packers SB ticket (994610591, 9/09) is +2500. Math is consistent (20 x 66 = 1,320), but the price jump is large, so worth a glance that it is the Packers Super Bowl winner market and not another market.

## Data hygiene (team can fix only after Andy states the facts)

- **35 of 165 wagers have no ticket number** (31 `null`, 4 `pending-not-supplied`). The four recent ones: `bet_20261011_betonline_snf_island_6leg` and the three DKP 10/12 MNF promo combos. Includes all Week 3 BetOnline entries from 9/27 without a number; those and the 9/13-14 entries are older and likely unrecoverable.
- **6 settled losses have no `profit_usd`:** `bet_1789078322607_beo_parlay`, `bet_1789078788963_beo_tier2_parlay`, `bet_1789080171509_beo_tier3_moonshot`, `bet_1789085490285_dkp_stribling_td`, `bet_1789085490286_dkp_ferguson_td`, `bet_1789086780000_bm_parlay_rams_under`. Any net profit sum over the file undercounts up to $35 of cash losses (10+5+5+15) from the four non-promo ones.
- **Funding field is absent or `unknown` on 9 older wagers** (7 with none, 2 `unknown`, e.g. `bet_20260909_dkp_ne_sea_w1_combo`, `bet_20260917_996992070_tnf_6leg_prop_parlay`), and `bet_20261002_w04_jays_lockbox_promo_2team` ($100 promo credit) has book "unknown (Andy to confirm)".
- **Three round robins are labeled `loss` but returned money** (profit smaller than the stake): `739714646` (stake 105, profit -20.53), `739713560` (30, -17.72), `740069722` (33, -7.79). Probably partial sub-bet wins; the label is correct only if the result field means "net loss".
- **Stale fields in the promo ledger:** `updated_at` says 2026-10-13 but holds a 10/14 note; `season_projection.credits_remaining_incl_week2` is out of date (Bills are 4-1 for credit purposes: W1, W2, W3, W5 wins, W4 loss).

## Checked and clean

- All futures-ledger `to_win_usd` values match stake x price (every ticket, including the exactas).
- Blended prices: Bills SB 992 and Packers SB 3867 match their tickets.
- `bills_sb` promo offset: $8.70 free-bet win against the $9.09 boost ticket 996987591 leaves $0.39, matching `promo_offset_log`.
- No duplicate wager ids and no duplicate ticket numbers inside `user-placed-wagers-2026.json`.
- Futures tickets 994540980 / 1003471850 are correctly absent from the wagers ledger (futures belong in the portfolio ledger).
- `open-parlays-2026.json`: 6 tickets and 11 open slots, matching the summary quoted in the portfolio ledger.
- Ledger totals as of this run (for reference): 165 wagers, all SETTLED, 156 losses, 9 wins. Cash-funded `profit_usd` sums to -$1,674.13 (see the 6-missing caveat above); promo/free-funded sums to +$62.46.
