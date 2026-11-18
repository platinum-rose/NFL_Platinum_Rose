# Week 8 SNF smaller narrative stacks — November 1, 2026

Paper discussion only. User requested smaller +600 to +800 alternatives. These are Tier 1-sized choices; the locked higher-tier ladder is not changed. Individual prices are user-supplied BEO builder rows with capture time unknown. Products below are arithmetic references, not combined sportsbook quotes or model win probabilities. No stakes assigned.

## A: Both offenses move the chains — approximate individual product +736

- Tanner McKee 22+ completions (+133)
- Chig Okonkwo 4+ receptions (+102)
- Sonny Styles 8+ tackles + assists (-129)

Philadelphia uses short passes to sustain drives; Washington answers through its tight end. Extra completed plays create tackle opportunities for Styles.

- McKee completed 26 and 23 passes in his last two starts.
- Okonkwo caught 4 and 7 passes on 6 and 7 targets in his last two games; earlier W4 was 2 catches on 4 targets.
- Styles recorded 8, 13 and 13 total tackles in Washington's last three games.

Failure condition: Early Eagles offensive collapse cuts McKee completions and Styles tackle opportunities together. Okonkwo target volume can fall if Washington runs with a lead.

Existing exposure: Tanner McKee in a different market or threshold; Chig Okonkwo in a different market or threshold. No exact held-leg duplicates.

## B: Washington wins through the air — approximate individual product +791

- Jayden Daniels 2+ passing TDs (+114)
- Antonio Williams 4+ receptions (+127)
- Cooper DeJean 6+ tackles + assists (-120)

Washington replaces missing receiver production with short and intermediate throws. Daniels finishes drives through the air; Williams supplies catches and DeJean sees tackle opportunities in the slot.

- Philadelphia allowed 2, 2 and 3 passing TDs in its last three completed games.
- Williams caught 3 passes for 50 yards on 4 targets in Washington's last game. The team says his role will grow with Terry McLaurin out.
- Farley recommended Williams over 3.5 receptions at +122 in the user-supplied Action Network feed; 4+ at +127 is the same integer threshold.
- DeJean is first at nickel on the fresh ESPN depth chart and recorded 10, 5 and 7 total tackles in Philadelphia's last three games. This is an opportunity link, not a promised one-to-one coverage matchup.

Failure condition: Washington rushing TDs can replace passing TDs; Williams had only 3 catches last game. Six DeJean tackles cleared in two of the last three, not all three.

Existing exposure: Jayden Daniels in a different market or threshold. No exact held-leg duplicates.

## B-INT: Clean Washington passing — approximate individual product +662

- Jayden Daniels 2+ passing TDs (+114)
- Antonio Williams 4+ receptions (+127)
- Jayden Daniels under 0.5 interceptions thrown (-176)

Use instead of B: Daniels produces passing scores and Williams receptions while avoiding a turnover. This trades DeJean tackle variance for one clean-quarterback condition.

- Daniels threw zero interceptions in each of his last two starts.
- Philadelphia intercepted its last three opposing starting QBs 1, 0 and 0 times.
- The passing-TD and Williams role evidence is the same as B. The two Daniels markets share one quarterback outcome; multiplying prices does not establish joint probability.

Failure condition: One interception kills the clean-passing leg even if Washington wins. The clean-passing sample is only two starts. B and B-INT share two exact legs: choose one.

Existing exposure: Jayden Daniels in a different market or threshold; Jayden Daniels in a different market or threshold. No exact held-leg duplicates.

## C: Competitive game, balanced Philadelphia — approximate individual product +735

- Jayden Daniels 212+ passing yards (+104)
- Saquon Barkley 45+ rushing yards (-114)
- Frankie Luvu 7+ tackles + assists (+118)

Philadelphia keeps enough balance to give Barkley carries, Luvu tackles ball carriers and short receivers, and Daniels accumulates ordinary passing volume while the game stays competitive.

- Philadelphia allowed 331, 281 and 212 passing yards to the last three opposing starters. Daniels himself threw for 199 and 300 yards in his last two starts.
- Barkley rushed for 62 yards on 7 carries in his one return game; that efficiency is not a stable forecast. Elijah Mitchell remains part of the backfield.
- Washington lists interior defenders Daron Payne and Javon Kinlaw inactive, which supports a run-game opportunity hypothesis rather than a quantified yards boost.
- Luvu recorded 5, 9 and 8 total tackles in Washington's last three games.

Failure condition: An early Washington lead can squeeze Barkley volume. Barkley's recent workload sample is one game, and Daniels missed 212 yards in one of his last two starts.

Existing exposure: Jayden Daniels in a different market or threshold; Saquon Barkley in a different market or threshold. No exact held-leg duplicates.

## D: Pressure without passing collapse — approximate individual product +703

- Odafe Oweh 1+ sack (+200)
- Tanner McKee 185+ passing yards (-205)
- Zack Baun 9+ tackles + assists (-125)

Washington creates one sack but Philadelphia still throws enough to clear a modest yards floor; sustained Washington possessions create Baun tackle opportunities.

- McKee threw for 215 and 211 yards while taking 3 and 2 sacks in his last two starts. A sack can coexist with the passing floor.
- Oweh recorded one sack in W4 and one in W6; no W5 box-score row was found, so this is not a three-game hit-rate claim.
- Baun recorded 11, 6 and 9 total tackles in Philadelphia's last three games.

Failure condition: Sacks remain volatile individual events. Baun only reached 9 tackles in two of the last three games. This set adds to the same McKee and Baun player exposure already held.

Existing exposure: Tanner McKee in a different market or threshold; Zack Baun in a different market or threshold. No exact held-leg duplicates.

## Evidence and boundaries

Strict roster vet PASS: 10 distinct players, 15 digest rows, no blocking issues. All are active on the same-day full ESPN rosters and absent from final SNF inactive lists. Game status remains scheduled for 5:20 PM Pacific in the saved fresh ESPN response.

The broad preflight was run with --no-fetch; Gemini billing probe skipped. Broad stale sources and old full-slate card issues remain unresolved. This scoped review uses fresh official last-three-game box scores and depth charts in place of the stale season usage aggregate; unused full-slate prediction/futures/alpha/podcast inputs are not inputs to these stacks. The recent samples are descriptive and do not establish positive expected value.

Reconciled local ledger with mobile grading: exactly two live SNF tickets, $10 each, Andy/Alejandro 50/50 ($5 each per ticket). Seven earlier SNF-containing tickets are burnt or settled. No new exact player/market/threshold anchor repeats across core A/B/C/D. B-INT is an alternative to B, never an additional diversified stack. Same-player exposure remains, especially Daniels and McKee.

Primary sources: [NFL final inactives](https://www.nfl.com/news/nfl-week-8-inactives-players-ruled-out-sunday-2026-season), [Washington on Antonio Williams role](https://www.commanders.com/news/commanders-antonio-williams-bigger-role-terry-mclaurin-injury). Official ESPN raw box scores and depth-chart responses, URL/hash manifests, exact selected prices, overlap details and roster receipt are preserved in E:/data/exports/PlatinumRose/snf-small-narratives-2026-11-01-1705PT.

No ledger/tracker changes, wager, account action, paid call, Supabase write, stage, commit, publication or push.
