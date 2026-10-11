# Week 5 synthesis (opus): NYG@WAS

Written Sat 10-10 23:51 PT (2026-10-11T06:51:22Z). Kickoff Sun 10:00 PT (17:00Z). Tag key: P = data/research-intel/game-packets/2026-w05/NYG_at_WAS.md; S = data/vault-seed/nflverse/player_stats_weekly.csv.

**Disposition: pass. Tier: skip. No side, no total lean. Edge hypothesis 0.0 / 0.0.**

## Game script

The market has Washington -3.5, total 41.5, an implied 22.5-19.0 [Source: P, market-implied score, BKR 06:21Z]. The likeliest script is a low-efficiency division game where both offenses struggle on the ground and the result turns on whether Jameis Winston can exploit a depleted Washington secondary before Washington's blitz gets home. The only tier-eligible outlet is split.

## Away state: Giants (3-1)

New York beat DAL 28-20 (+8), lost at LAR 6-28 (-22), beat TEN 12-7 (+5) and ARI 36-24 (+12) [Source: P, results table, built 06:35Z]. All three wins came at home; the Giants are 0-1 away. Their opponents are a combined 5-12, so a 3-1 record carries only a +3 point differential. Four games is a small sample, not a rating. They lead the NFC East at 3-1 (1-0 division) and sit fifth in the NFC order. Rest is 7.0 days, bye still ahead in Week 8; next is NO at home [Source: P, team state].

## Home state: Commanders (1-3)

Washington lost at PHI 22-24 (-2) and at DAL 20-37 (-17), beat SEA 33-31 (+2), and lost to IND 13-30 (-17) [Source: P, results table]. Opponents are 9-8 combined, a tougher slate, but the -34 differential and 30.5 points allowed per game are real. They are last in the division (0-2). A loss drops them to 1-4 and three games behind New York; a win cuts the gap to one. Rest is 7.1 days, bye in Week 7, and next is a trip to SF. Context only, no adjustment [Source: P, standings].

## Matchup mechanics

Quarterbacks: the packet resolves Winston and Jayden Daniels as starters (operator-confirmed, stated not verified) [Source: P, Quarterbacks, ESPN 06:35Z]. Daniels last played Week 2 (96 yards on 17 attempts); Mariota and Kaliakmanis covered Weeks 3-4 [Source: S, weeks 1-4]. Winston threw for 111, 118 and 250 yards in Weeks 2-4 [Source: S].

Washington's pass defense is the weak point. In FTN team-defense passing-analytics it allows EPA/DB 0.101, DVOA 19.7% and OPEN% 72.1% [Source: P, FTN]. The ESPN injury report lists safeties Tyler Owens, Percy Butler and Nick Cross Out, with CB Trey Amos and DE Charles Omenihu also out [Source: P, ESPN injury report 06:35Z]. Against that, New York's protection is poor. In FTN pass-protection the Giants show SK% 8.7% and EPA/DB -0.402 under pressure, but clean-pocket EPA/DB__2 0.241 and SUCC%__2 50.6%. Washington blitzes at BLZ% 47.4% but generates only PRESS% 25.7% [Source: P, FTN pass-rush]. So the Giants' passing game works only if the blitz misses.

On the ground both sides lean under: Washington's rush defense allows EPA/ATT -0.094 with STF% 23.5%, and the Giants rush at RUSH% 48.0% for -0.152 EPA/ATT [Source: P, FTN]. Washington's offense posts EPA/PLY -0.051 and lost Stefon Diggs (Out, ESPN injury report), who had 17-31% target shares [Source: S]. Terry McLaurin is Questionable. Giants S Jason Pinnock is Out and DE Chauncey Golston is on IR (ESPN injury report). The ESPN roster IR/Out group lists Brian Burns, Roy Robertson-Harris and Paulson Adebo for NYG and Laremy Tunsil and Jer'Zhan Newton for WAS. Unconfirmed; not treated as Out.

Power ratings: SRS NYG -4.141 vs WAS -11.37, net PPG 0.75 vs -8.5 [Source: P, power ratings]. The label check shows these equal 2026 four-game values, so I apply no adjustment. Pace: WAS 65.3 plays/game vs NYG 61.0 (FTN tempo). Weather: outdoor, 68°F, 72% precipitation probability but 0 mm, wind 12.8 km/h [Source: Open-Meteo, forecast captured 2026-10-10T17:56Z]. That is no total adjustment. Secondary severity 5.55 / 5.25, even and capped.

## Market comparison

BKR: NYG +3.5 -109 / WAS -3.5 -107; o41.5 -104 / u41.5 -112; ML +172 / -197, captured 23:21 PT Sat [Source: P, BKR 06:21Z]. BEO: same spread at -113/-107, 41.5 at -110/-110, ML +157/-180, captured 23:24 PT [Source: P, BEO 06:24Z]. The books agree. Action Network had WAS -4.5 on Friday with 74% tickets and 75% money on NYG and 77% tickets on the Over [Source: P, Action splits 2026-10-09T19:41Z]. Those splits are context only; the move to -3.5 is toward the Giants. The opener field is malformed. The SuperContest line is WAS -3.5. Key numbers: the hook sits just past 3, which carries an 8.3% side_push at -3; 7 carries 5.6% [Source: margin-simulator CLI, side_push].

## Thesis and counter-thesis

VSiN appears on both sides. w05-expert-verified.json#rows[452] backs "Washington Commanders -3.5 vs." and w05-expert-verified.json#rows[564] backs "Best Bet: Giants +3.5". That is one outlet, split, so it supports no tier. Corroboration-only rows also split: Action Network w05-expert-verified.json#rows[103] and The Favorites w05-expert-verified.json#rows[120] take NYG +3.5, while Sharp or Square w05-expert-verified.json#rows[132] and ESPN w05-expert-verified.json#rows[394] take WAS -3.5. The provisional quant pass puts the home margin at +0.76, about 2.7 points short of the market. It is unbacktested, so I do not copy it.

Edge hypothesis: 0.0 margin, 0.0 total. Simulator baseline: home cover 0.500 / away 0.500, push 0; over 0.500 / under 0.500, push 0. These numbers are conditional on the hypothesis, not calibrated edges.

Counter-thesis: the Giants case (three Washington safeties out, line moving off -4.5, a better 2026 differential) is real. If it is right, NYG +3.5 is the value side, and the hook over 3 matters. The Washington case is Daniels' return against an opponent whose wins came against a 5-12 slate. 

The captures are early-Sunday UTC (late Saturday PT). Both books' recommendation windows end 04:00 PT (11:00Z), six hours before kickoff, and any price-specific claim needs a fresh capture after that.

## Gaps

- Only tier-eligible outlet (VSiN) is split; no second independent outlet.
- Quant pass +0.76 home margin vs market -3.5 (provisional, unbacktested).
- Action Network opener field malformed; Friday splits are 2 days old.
- Daniels' elbow is described only by an ESPN API note; no 2026 snap data after Week 2.
- The ESPN roster IR/Out group (Burns, Robertson-Harris, Adebo, Tunsil, Newton) is unresolved.
- Weather forecast is ~13h old; 72% precipitation probability needs recheck.
- Global: 432 corroboration-only rows; SuperContest label reversals on 6 other games; 2 BKR/BEO conflicts on other games.

## Delta checklist

- [ ] Official inactives and starters (Daniels, Winston, McLaurin, Burns/Tunsil status)
- [ ] Fresh BKR/BEO capture after 04:00 PT; watch 3 vs 3.5
- [ ] Weather recheck (precipitation, gusts)
- [ ] Game status (on schedule, venue)
- [ ] Reprice source picks (w05-expert-verified.json#rows[303] quoted NYG +3: across key 3, a different bet)
