# W10 MNF final: settle MNF, then Fable run and W11 (Claude, 2026-11-16 20:40 PT)

Repo `E:\dev\projects\NFL_Dashboard`, branch `claude/w5-prop-cards-2026-10-11`. Access only through `device_bash` at `$HOME/mnt/dev/projects/NFL_Dashboard`.
Previous handoff: `handoffs/2026-11-15-1145-claude-w10-sunday-live-alejandro-tracker.md`.

## State at 20:40 PT Monday
- **MNF LAC@BAL is FINAL: LAC 23, BAL 20** (ESPN event 401873065). Quarters: LAC 10/7/3/3, BAL 0/10/3/7. 2nd half: BAL 10, LAC 6 (16 pts).
- **All W10 tickets are settled except the 7 MNF tickets placed 11/16** (below). The W10 Sunday settlement was done by hand on 11/16. It corrected 44 leg grades from the 2:30 AM mobile settler, which inverts Under legs and leaves ATD legs PENDING. Backup: `...wagers-2026.json.bak-claude-20261116-w10-settle`.
- **W10 bankroll before MNF: -$162.20** (legacy open-spot win excluded). **Season bankroll: -$490.35.** Bankroll-exempt +$548.15. Alejandro's W10 net is -$49.95.
- **Live Tracker** (`public/live-tracker-sunday.html`) and the mobile tracker are now built for **Week 11** (`--week 11`). The final W10 page is saved at `scratch/live-tracker-sunday-w10-final-2026-11-16.html`. Before Tue ~7 AM PT, a default build (no `--week`) still targets W10.

## FIRST TASK: settle the 7 MNF tickets (ledger `data/official-picks/user-placed-wagers-2026.json`)
Back up first (`.bak-claude-<date>-mnf-settle`). Grade from the ESPN summary box score (`.../summary?event=401873065`). After settling, rebuild the main tracker (`--week 11`) and the mobile tracker.
| id | stake → return | notes |
|---|---|---|
| bet_20261116_dkp_7pick_solo_mnf_bal45_henry70_herbert20_henryatd_simpson5_henley6_dicker2fg_boost | $9.97 → $310.30 | BAL -4.5 leg LOST (BAL lost outright) → ticket LOST |
| bet_20261116_dkp_6pick_solo_mnf_t2_patterson2fg_andrews3_roquan8_hampton30_mitchell115_flowers6_boost | $9.99 → $135.40 | grade every leg from the box score |
| bet_20261116_dkp_7pick_solo_mnf_t3_henry2td_henry100_roquan8_henry19att_lambertsmith2_brissett_int_flowers5_boost | $10 → $1,148.50 | moonshot |
| bet_20261116_dkp_7pick_solo_mnf_green_sack_herbert_int_hampton20_harris30_johnston20_hill20_henry_atd | $9.98 → $188 | |
| bet_20261116_fdp_mnf_sgc3_henry_td_hampton195_henry595_andy_solo | $10 → $29.85 | FDP, bankroll_exempt |
| bet_20261116_bkr_741947214_mnf_live_2h_sgp_u215_lac_p3_5 | $24.54 → $72.88 | 2H Under 21.5 WON (16); 2H LAC +3.5 LOST (6-10, short by 0.5) → **ticket LOST** |
Also: the week-11 9-team `bet_20261116_bkr_9team_open1_jax_lac_hou_chi_det_sf_den_cin_andy_solo` has its LAC ML leg already graded WON (1/9). The other 7 legs are W11, plus 1 open spot. The ticket number is still missing.
- Do NOT trust `scripts/settle_from_mobile_state.py`. It inverts Under legs and has no 1H/2H logic. It runs at 2:30 AM, so settling MNF first leaves it nothing to do.
- Andy has no MNF Alejandro tickets. Republish his page only if something of his changes.
- When MNF is settled, report the final W10 P/L and the updated season bankroll to Andy.

## Built/changed this session (11/15–11/16), committed in this checkpoint
- **1H/2H grading** in both trackers. `generate-live-tracker.mjs` (client-side pacing): half legs (`period: '1H'/'2H'` or `first_half_*`/`second_half_*` markets) grade off the ESPN quarter linescores. 1H = Q1+Q2, settles at halftime. 2H = Q3+Q4+OT, shows "2nd half · after halftime" until Q3. `generate-live-tracker-mobile.mjs` does the same server-side (`legHalf`/`halfView` in `gradeLeg`). Both were verified live and with mock states.
- **Cross-week leg fix** (`generate-live-tracker.mjs`): a leg with its own `kickoff_utc` (e.g. the W10 MNF leg on the W11 9-team) is no longer matched to that team's other-week game, and it shows its own kickoff.
- `scripts/settlements/partner_leg_tab.py`: added category labels for `total` and ATD.
- **Legacy open-spot parlays**: `data/official-picks/legacy-open-spot-parlays.json`. Five live BKR NCAA tickets (730888303, 730737412, 731062665, 731063264, 731536472) each have 2 open spots. 730846806 was filled (PIT@CIN O45.5) and won ($399.43). **Rule (Andy):** legacy NCAA open-spot tickets are OFF the 2026 bankroll. New 2026 open-spot parlays count toward 2026, even if they carry into 2027.
- **Endcap strategy**: `docs/strategies/endcap-open-spot-hedge.md`. Each week, place a $10-15 longshot ML/total parlay ending on a primetime leg, then hedge it with a legacy open spot. A high total as the endcap is cheap to hedge to the Under after Q1, or via the 2H total. **Build the first W11 endcap once lines post.**
- Duma pool: $50 won (entry fee covered). Recorded in `data/pickem/pools-2026.json`.
- Scratch notes: `scratch/w10-mnf-island-rework-2026-11-15.md` (DKP correlation cuts on same-game legs; a 2nd same-team DEF leg collapses the payout; there's no 94.6x cap), `scratch/w10-snf-live-hedge-price-log-2026-11-15.md`, `scratch/w10-snf-island-proposals-2026-11-15.md`, `scratch/w10-stranded-legs-2026-11-15.html`, `scratch/w10-alejandro-postmortem-2026-11-15.html`.
- **Fable prompt**: `handoffs/2026-11-16-fable-midseason-postmortem-and-pipeline-audit-PROMPT.md`. Andy launches it tonight after MNF settles. Scope: the W1-10 post-mortem, a pipeline/automation audit (incl. the settler Under bug), and the intel→recommendation review. Audit and propose only, except closing-line capture. No paid API spend. Due before W11 TNF (Thu 11/19).

## Kept local (not committed): private settlement statements
- `reports/settlements/2026-w10/Week10-Settlement-Alejandro.html/.pdf` (PR-2026-W10-AL). **Alejandro owes Andy $46.89.** Andy sends it to him.

## Andy to do
1. Push the alejandro-tickets repo: `git -C E:\dev\projects\alejandro-tickets push` (2 local commits "W10 settled"; the bridge has no credentials). You can then delete `E:\dev\projects\alejandro-tickets-b6d0596.bundle`.
2. Supply the Bookmaker ticket # for the 9-team, plus the DKP position numbers still missing on several solo tickets.
3. Launch the Fable run after MNF settles.

## Standing rules
- Log tickets only when Andy says they're official. Never place wagers.
- Back up the ledger before every edit. Use `git commit --only <paths>`, never `git add -A`.
- Deletes are blocked on the bridge: rename stale git locks to `.git/stale-*` and move stray files to `_to_delete/`.
- QB INT market is `pass_interceptions`. Half legs use `period` 1H/2H.
- Captures (DKP 9224, BOL 9223, BKR 9222) must be run by Andy on Windows. The bridge can't reach CDP.
