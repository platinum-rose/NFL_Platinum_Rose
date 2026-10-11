# Week 5 synthesis: PHI@JAX (opus, HEAD fb2ad66)

Written Sat 10-10 ~23:50 PT (2026-10-11 06:50Z). Kickoff Sun 06:30 PT (13:30Z). BKR captured 23:21 PT, BEO 23:24 PT; both recommendation windows end about 02:21/02:24 PT, roughly four hours before kickoff, so they lapse before the game unless prices are recaptured. These are early-Sunday captures and must not be read as live after that. [Source: game packet, market, 2026-10-11T06:21Z/06:24Z]

## Game script

Jacksonville is the listed home team, but VSiN describes this as a London game ("Eagles +7.5 vs Jaguars (London)") [Source: w05-expert-verified.json#rows[447]]. The static roof table cannot detect neutral sites, so home field should be read as reduced. The Open-Meteo sample is for London coordinates: 57.9F, 0% precipitation, wind 10.4 km/h gusting 22.7 [Source: 2026-10-10-week5-weather-openmeteo.json, 13:00Z sample, captured 2026-10-10T17:56Z]. Weather is not material.

The likely script is Jacksonville leaning on the run while a short-handed Philadelphia offense struggles to sustain drives. The market-implied score is JAX 24.5, PHI 16.5.

## Away state: Philadelphia (2-2)

Results in order: W 24-22 vs WAS (1-3), W 24-20 at TEN (0-4), L 7-27 at CHI (3-1), L 20-24 vs LAR (2-2). Both wins were by four points or fewer against teams now a combined 1-7. Point differential is -18 and opponents are a combined 6-10. The Eagles are 1-1 on the road, 1-0 in the division and second in the NFC East behind NYG (3-1). They have 6.9 days of rest and their bye is in Week 10. Next up are CAR and DAL at home [Source: game packet, team state]. Four games is a small sample.

The ESPN injury report lists RB Saquon Barkley, WRs DeVonta Smith and Hollywood Brown, C Drew Kendall and S Marcus Epps as Out. LBs Jonathan Greenard and Chance Campbell are Questionable, and RB Tank Bigsby is on IR. G Landon Dickerson and TEs Eli Stowers and Grant Calcaterra sit only in ESPN's roster IR/Out group, which is unconfirmed [Source: ESPN injury report and roster group, 2026-10-11T06:35Z]. Losing the lead back, both outside receivers and the center changes the script. Jalen Hurts is the resolved starter.

## Home state: Jacksonville (3-1)

Results in order: W 34-10 vs CLE (3-1), L 13-20 at DEN (2-2), W 35-6 vs NE (2-2), W 22-17 at CIN (2-2). Point differential is +51 against opponents who are a combined 9-7. The Jaguars are 2-0 at home and 0-0 in the division. They lead the AFC South by a game and are second in the AFC by win% and point differential. They also have 6.9 days of rest, with the bye in Week 7. HOU follows at home [Source: game packet, standings]. Trevor Lawrence is the resolved starter. S Eric Murray is Doubtful and S Caleb Ransaw is on IR. DE B.J. Green II, G Patrick Mekari and C Sam Mustipher sit only in the unconfirmed roster group.

## Matchup mechanics

Power ratings show SRS 14.7 for JAX against -6.3 for PHI. These are 2026 four-game values (matches_2026 true) and carry no adjustment on their own. In FTN team-offense/efficiency, JAX has EPA/PLY 0.173 and SUCC% 48.2%, while PHI has -0.107 and 37.0%. FTN team-defense/rush-analytics gives JAX a DVOA of -32.5% against a PHI team-offense/rushing-analytics DVOA of -14.6%, and that was before Barkley was ruled out. In team-offense/pass-protection, PHI shows SK% 8.7% and pressured EPA/DB -0.628, but clean-pocket EPA/DB__2 is 0.226. With a backup center, the pocket matters. Both teams play slowly (team-offense/tempo PLY/GM: PHI 57.5, JAX 56.5), which supports a lower total. JAX defense TO% is 2.5% [Source: FTN team tables, packet]. Secondary severity is 6.45 for PHI's offense against JAX and 4.5 the other way. This is capped context.

## Market

BKR has JAX -8 (-113) / PHI +8 (-103), total 41 at -108 both ways and ML -389/+323. BEO has -8 at -110, total 41.5 and ML -390/+310. The sides are in sync, with a 0.5-point gap on the total. Action Network showed -7.5 and 41.5 on 10-09 19:41Z, so the spread has moved half a point toward JAX through the 7.5 hook. No opener is in the packet. Splits (context only): 60% of tickets and 57% of money on JAX; Under 60%/63%. The SuperContest line is JAX -7.5 (favorite field). Seven matters: side_push at -7 is 5.55%, against 0 at -7.5 [Source: margin-simulator.mjs, --home-line -7].

## Thesis and counter-thesis

The tier-eligible evidence is four VSiN rows (Youmans +7.5, Cohen +8 and ML +320, Tuley "+7.5 or better"). Because independence is counted by outlet, they make one source, and every row backs PHI. All are within 0.5 points of the current +8 and none crosses 7. Every other row backing JAX (BettingPros, The Favorites, Jeremiah/Brooks, PFT, teasers) is corroboration-only.

The numbers point the other way. The provisional quantitative pass projects a home margin of 9.07, FTN favors JAX on both sides of the ball, and the confirmed Out list falls heavily on Philadelphia's offense. Against that, the line already moved through 7.5 after the injury news, and a neutral London site removes real home field. That leaves a hypothesis of +0.5 home margin and 0.0 on the total. Conditional on that hypothesis, the simulator gives JAX cover 50.17%, PHI 47.35%, push 2.48%; the baseline is 50/50 excluding pushes (push 2.49%, total push 3.04%). These numbers are not calibrated edges. The only eligible source and the numbers disagree, so the disposition is conflicted and the tier is skip.

Counter-thesis: in a neutral-site game, an 8-point favorite whose record rests on four games may be overpriced, and the VSiN authors may be right. A JAX lean also rests on rating Philadelphia's absences above what the market has already priced.

## Gaps

- No opener or full line history; AN splits are 10-09.
- Quant pass margin 9.07 vs market 8 (provisional; disagreement noted, not copied).
- London neutral site comes from a source quote only; venue table says outdoor JAX.
- Roster IR/Out group unconfirmed both teams; Greenard/Campbell/Murray statuses open.
- Global: 432 corroboration-only rows; SuperContest label reversals for six other games; MIN@NO and CLE@NYJ book conflicts.
- Windows lapse ~02:21 PT, before kickoff.

## Pre-kickoff delta checklist

- [ ] Official inactives/starters (Kendall, Dickerson, Greenard, Murray)
- [ ] Fresh BKR/BEO capture; reprice VSiN picks if past +8 / below 7.5
- [ ] London weather recheck
- [ ] Game status (neutral site confirmed)
