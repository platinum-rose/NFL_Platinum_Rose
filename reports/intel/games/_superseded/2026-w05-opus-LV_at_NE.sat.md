# LV@NE (Week 5) - opus single-game synthesis

Written 2026-10-11T05:34:42Z (Sat 10-10 22:34 PT), HEAD 7ebef66. `pkt` = `data/research-intel/game-packets/2026-w05/LV_at_NE.md` (built 04:23Z). Kickoff Sun 10:00 PT, outdoor.

**Disposition `conflicted`, tier `skip`. No side; total leans Over, but the price is already shaded. Edge: home margin -0.5, total +0.5.**

## Game script

The market implies NE 24.25, LV 20.75 [Source: pkt, implied score, BKR 01:15Z]. I expect Las Vegas to throw into a New England secondary missing four corners. New England should rely on short passing and Drake Maye scrambles against the stronger pass rush. That makes the game slightly closer and higher-scoring than the line, but not enough to beat the price.

## Away: Las Vegas (3-1)

LV beat MIA 27-13 (+14), won 26-14 at LAC (+12) and 35-27 at NO (+8), then lost 27-30 to KC (-3) [Source: pkt, results, 04:23Z]. Its opponents are a combined 5-11, three wins came against teams now 0-4, 0-4 and 1-3, and the only strong opponent beat LV. LV is 2-0 on the road with a +31 differential, 6.9 days of rest and a Week 13 bye. It is second in the AFC West behind KC (4-0) and third in a win%/differential AFC order. BUF visits next. Four games is a small sample, and the +31 is mostly schedule.

## Home: New England (2-2)

NE lost 10-13 at SEA, beat PIT 20-3, lost 6-35 at JAX and won 29-26 at BUF, against opponents with a combined 11-5 record [Source: pkt, results, 04:23Z]. The -12 differential is the JAX game. NE is 1-0 at home and 1-0 in the division, with 7.0 days of rest and a Week 11 bye. It is second in the AFC East, one game behind BUF but holding the head-to-head win, and NYJ is next. The market rates NE well above its results: a 10.35 win total against model rank 17 [Source: pkt, power_rating, 04:23Z].

## Matchup mechanics

The LV passing game is strong: FTN team-offense passing-analytics DVOA 29.6%, EPA/DB 0.161. Its running game is poor: rushing DVOA -25.1%, STF% 31.9% [Source: pkt, FTN, 04:23Z]. NE has ruled out CBs Christian Gonzalez, Carlton Davis III, Karon Prunty and Channing Canada, and CB Charles Woods and S Craig Woodson are questionable [Source: ESPN injuries, 04:21Z]. NE's -10.7% pass-defense DVOA was built with those players. Secondary severity is 10.05 (high) in a man scheme "featuring Christian Gonzalez"; that is capped context. LV is also short at WR: Jalen Nailor is out and Dont'e Thornton Jr. is on IR, so targets narrow to Brock Bowers (24 targets in Weeks 3-4), Michael Mayer and Tre Tucker [Source: nflverse player_stats_weekly.csv, wk1-4]. LV center Trey Zuhn III is out. NE's rush is mild (PRESS% 27.0%, SK% 5.7%), and Dre'Mont Jones and Christian Barmore are questionable, so Kirk Cousins (ESPN-resolved starter) should mostly stay clean.

The other side of the ball favors LV's defense. NE's offense has DVOA -16.7%, 8 turnovers and INTW% 6.5%. Under pressure it drops to EPA/DB -0.433, and LV pressures at 39.5% with SK% 8.2% [Source: pkt, FTN pass-rush/protection, 04:23Z]. RT Morgan Moses and RB Rhamondre Stevenson are questionable. On pace, LV runs 67.8 plays per game to NE's 63.3. SRS (LV 6.19, NE 2.40) uses 2026 four-game values, so I make no adjustment for it. The forecast is 64.6F, 2% chance of precipitation, wind 15.6 km/h gusting 24.1 km/h; not material [Source: Open-Meteo, 10-10 17:56Z].

## Market

At BKR (01:15Z, 18:15 PT): LV +3.5 -107 / NE -3.5 -109, Over 45 -114 / Under -102, ML +167/-191. At BEO (03:15Z, 20:15 PT): 3.5 at -110 both ways, Over 45 -114 / Under -106, ML +160/-183. There is no book conflict, both captures are under 6 hours old, and BKR lapses at 00:15 PT [Source: pkt, market, 01:15Z/03:15Z]. The line sits on the hook above 3, where an exact 3 is 15.1% at zero edge. The Action Network opener is missing. The 10-09 splits had 77% of spread money on LV, and 81% of the money on Over 45.5. The total has since dropped to 45 with -114 Over juice, so the Over shading is already priced. SuperContest has NE -3.5, a separate contest reference.

## Evidence, thesis, counter-thesis

All three tier-eligible rows are VSiN, so they count as one outlet, and it contradicts itself: "Best Bet: Patriots -3.5" (`w05-expert-verified.json#rows[445]`), Raiders +3.5 (`#rows[563]`) and Over 45 (`#rows[453]`). A VSiN near-miss (`#rows[510]`) takes LV. The corroboration-only rows split the same way: Sharp or Square, Even Money and Fezzik back LV, and Erickson and Wormeli back NE.

My hypothesis is margin -0.5 toward LV and total +0.5. The basis is the NE CB absences against LV's pass efficiency, plus LV's pressure against NE's collapse under pressure. The LV center loss and LV's soft schedule offset part of that. The simulator, conditional on this hypothesis rather than a calibrated edge, gives LV cover 51.33%, NE 48.67%, no push; Over 50.00%, Under 46.97%, push 3.04%. The zero-edge baseline is 50/50 on the side and 48.48/48.48 on the total with a 3.04% push. LV at -107 needs about 51.7%, and Over at -114 needs about 53.3% excluding pushes. Neither clears.

**Counter-thesis.** LV's record is built on a 5-11 schedule, and NE won at BUF. If Bowers carries a narrow LV passing game, NE's replacement corners may matter less. A 3-point result is the single likeliest margin, so the side is a pure price question.

## Gaps

- The Action Network opener is missing, and the splits (10-09 19:41Z) are stale.
- The packet's quant row has the home margin at +0.85 against the market's -3.5 (4.3 points toward LV) and Over at 52.9%. It is unbacktested and not copied here.
- The tier-eligible rows come from one self-contradicting outlet. There are 3 near-miss rows (game warning).
- Availability warnings: Jeanty, Woods, Woodson, Jones, Elliss, Barmore, Stevenson and Moses are questionable.
- Global: BKR lapses within 120 minutes; book conflicts on MIN@NO and CLE@NYJ; 432 rows are corroboration-only; SuperContest labels are reversed on 6 other games.
- BKR has pulled the Jeanty yardage, receptions and carries props, and its ATD board still lists Reggie Gilliam (IR). The power-rating label is stale (matches_2026 true), and the venue comes from a static table.

## Delta checklist

- [ ] Official inactives (Jeanty, Woods, Woodson, Moses, Barmore, Stevenson)
- [ ] Fresh BKR/BEO capture: 3.5 vs 3; 45 vs 44/46
- [ ] Weather recheck (gusts >40 km/h, rain)
- [ ] ESPN game status, any QB change
- [ ] Reprice source picks; NE -3 or LV +3 is a different bet
