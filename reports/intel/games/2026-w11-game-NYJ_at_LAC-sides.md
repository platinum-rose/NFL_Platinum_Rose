# NYJ @ LAC — Week 11 sides and totals

Friday provisional research as of Fri Nov 20, 4:47 pm PT. Replay against current prices and lineups before kickoff.
Sun Nov 22, 1:05 pm PT kickoff. Recheck inactives at about Sun Nov 22, 11:35 am PT.

Sources frozen for this pass. Sides queue 2026-11-20T15:08:03.908205+00:00. ESPN roster snapshot 2026-11-20T05:35:06.971167+00:00. Friday gate PROVISIONAL. Saved Bookmaker capture Thu Nov 19, 1:02 pm PT (27.8h at synthesis). Quotes below are dated research evidence.

## Friday spread proposal and remaining leans

| Market | Research view | Bookmaker capture | Use |
|---|---|---:|---|
| Spread | **NYJ +3 · PLAY (Friday proposal)** | -103 | Verify a fresh price and lineup before any use |
| Total | **Under 42 · LEAN** | -108 | Scoring-script screen |
| Moneyline | **PASS** | -167 (LAC) | Straight-up research lean LAC. Market no-vig reference 60.7%. No confidence-pool rank assigned. |
| SuperContest | NYJ +3.5 | Locked line | Number comparison only |

The Week 11 fair-line screen puts the home spread at +0.15, a 3.15-point Jets edge at +3. The simulator gives NYJ 58.5% to cover excluding pushes, or 53.7% after shrinking toward the no-vig market. The Action Network opener showed Chargers -3.5. Friday BetOnline, DraftKings and FanDuel all showed -3, corroborating the half-point move toward the Jets. Bookmaker's saved NYJ +3 row was -103. Geno Smith had no Friday injury designation, and the Jets split quarterback attempts in Week 10. Omar Cooper Jr. was ruled out and the Chargers' receiver availability can affect the margin. A 2-point adverse shift in the unshrunk model margin leaves a 2.15-point Jets edge. Friday research only. Recheck starting quarterbacks, receivers and price before use. Keep +3 at -103 or better as the review threshold. Drop to a lean at +2.5, a shorter price, or material adverse lineup news. Model and source record: reports/intel/w11-model/fair-lines-w11.json.

## Game script

Neither offense can assume efficient early-down rushing. FTN shows -0.123 expected points per rush for the Jets and -0.222 for the Chargers. Los Angeles has a plausible edge through Justin Herbert against a Jets pass defense allowing +0.164 per opponent dropback. But the Chargers' Week 10 usage also shows a viable plan through Omarion Hampton if the game stays close.

[Sources: team dossiers for NYJ and LAC and the latest FTN Stats IQ export (2026-11-20T23:00:11.532Z). Player usage through Week 10.]

## Why these leans

The Action Network opener showed Chargers -3.5. Friday BetOnline, DraftKings and FanDuel all showed -3, corroborating the half-point move toward the Jets. Bookmaker's saved NYJ +3 row was -103. The locked contest +3.5 is an extra half point. Under 42 remains a lean.

## Quarterback and roster scenarios

Geno Smith and Herbert appear in both the primer and projections. Smith threw 21 passes in Week 10 while Cade Klubnik threw 20, so the distribution itself warrants a late check. Coach-attributed local news reports Omar Cooper Jr. out. Ladd McConkey and Charlie Kolar were listed questionable and Daiyan Henley was reported out for Los Angeles. These can change third-down quality on both sides.

[Sources: data/player-availability/latest.json, data/projected-starters/2026/latest.json, data/intel/extracted/2026-w11-primer-intel.json, data/nfl-rosters/espn-full-rosters-latest.json, and data/secondary-matchups/secondary-matchup-vulnerability-2026-w11.json.]

## Market comparison

| Source | Spread | Total | Detail |
|---|---|---:|---|
| Action Network opener | LAC -3.5 | 40.5 | Spread Sun Nov 15, 5:11 pm PT, total Sun Nov 15, 6:01 pm PT |
| Bookmaker snapshot | NYJ +3 (-103), LAC -3 (-113) | 42 | Over -108, Under -108. Moneyline NYJ +147, LAC -167. |
| DraftKings / FanDuel comparison | LAC -3 / LAC -3 | 41.5 / 41.5 | Fri Nov 20, 2:00 pm PT |
| SuperContest | NYJ +3.5, LAC -3.5 | — | Thu Nov 19, 5:49 pm PT |

The Bookmaker home spread differs from the opener by +0.5 points and the total by +1.5. This comparison spans sources and times. It cannot establish who moved the market.

**Historical splits.** Home spread bets 49%, money 22%. Over bets 70%, money 61%. Archived Action Network snapshot at Tue Nov 17, 6:45 pm PT. Excluded from the handicap.

## Analytics and market baseline

| Team | SRS | FTN rush EPA/attempt | FTN rush success | FTN pass-defense EPA/dropback | Secondary vulnerability faced |
|---|---:|---:|---:|---:|---|
| NYJ | -5.06 | -0.123 | 41.4% | 0.164 | low |
| LAC | -9.40 | -0.222 | 36.0% | 0.042 | low |

The Bookmaker spread and total imply NYJ 19.5, LAC 22.5. These are arithmetic reference points. SRS is a season strength measure and FTN expected points describe past plays. The gate did not establish a current independent fair line. No calibrated matchup edge or player projection is inferred.

Season-level cross-market context as of Fri Nov 20, 3:01 pm PT. Saved make-playoffs indicators are NYJ 1% and LAC 3%. These season contracts do not measure this game's win or cover probability.

## Counter-case and expert context

A healthy Los Angeles receiving group can turn the Jets' pass-defense numbers into a larger margin. If the Jets turn pass plays into negative plays or short fields, the Under can fail even with modest yards. There was no approved full-game named pick in the queue. The primer's long-run Jets post-Buffalo trend is too broad to resolve this matchup.

[Sources: data/generated/master-intel/w11-pull.json, data/podcasts/youtube-extracted-picks-2026-w11.json, data/intel/extracted/2026-w11-primer-intel.json, and data/supercontest/live-market-comparison.json. Named opinions are context. Teasers and other lines are kept distinct.]

## Ambiguity and pre-kickoff checks

The Jets' QB split and Chargers' receiver availability affect both pace and the passing markets.

Check the named roles and final inactives, then compare the same market and number across fresh sources. A push at a whole-number spread is materially different from a half-point win or loss. Venue conditions, if they matter, require a dated forecast.

- Action Network splits were captured November 17 at 6:45 p.m. PT and are stale. Context only.
- No fresh BetOnline player-prop board. Use only row-verified Bookmaker evidence. DraftKings Predictions prices are contract references before fees.
- The Week 11 weather and venue feed is absent. Venue labels, where supported, do not establish conditions.
- Usage trends end with Week 10. The running-back measure is carries plus half a target. Game-by-game QB and receiver counts reflect attempts and targets.
- Two media-intake items remain pending, one image/chart and one linked article.
- Late injury and QB checks are deferred. The Friday provisional override covers only manual QB and news confirmations.

## Evidence index

- **data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json** (2026-11-20T23:00:11.532Z)
- **data/generated/master-intel/w11-pull.json** (2026-11-20T05:44:24.062Z)
- **data/intel/extracted/2026-w11-primer-intel.json** (2026-11-20T05:34:18.920Z)
- **data/player-availability/latest.json** (2026-11-20 local availability snapshot, individual reports dated in text)
- **data/projected-starters/2026/latest.json** (2026-11-20 projected snapshot)
- **data/generated/player-usage-trends-2026.json** (2026-11-17T18:00:27.353Z)
- **data/nfl-rosters/espn-full-rosters-latest.json** (2026-11-20T05:35:06.971167+00:00)
- **data/generated/master-intel/w11-roster-vet.json** (2026-11-20T05:35:06.971167+00:00)
- **data/secondary-matchups/secondary-matchup-vulnerability-2026-w11.json** (2026-11-20T05:36:01.786770+00:00)
- **data/generated/props/bookmaker-live-2026-11-19-week11.json** (2026-11-19T21:01:11.138Z)
- **data/generated/props/draftkings-predictions-feed-2026-11-19-week11.json** (2026-11-19T21:12:27.168Z)
- **data/supercontest/week-11-lines.json** (2026-11-20T01:49:33.703Z)
- **data/supercontest/live-market-comparison.json** (2026-11-20T22:00:00.000Z)
- **data/prediction-markets/cross-market-coherence-latest.json** (2026-11-20T23:01:14.824Z)
- **data/odds/actionnetwork-openers-2026-w11.json** (2026-11-15 opening cutoff)
- **data/vault-seed/manual/grok-week11-threads/grok-twitter-picks-2026-11-20.csv** (2026-11-20 extraction, original 2026-11-18)
- **data/intel/articles/2026-w11/bookmark-text-intelligence-digest.md** (2026-11-20)
- **data/podcasts/youtube-extracted-picks-2026-w11.json** (2026-11-18 local extraction)
- **reports/intel/gates/w11-final-gate-friday.json** (2026-11-20T16:38:33.317275-08:00)
- **data/generated/props/bookmaker-live-2026-11-19-jets-at-chargers.json** (2026-11-19T21:02:27.541Z)
- **data/generated/team-dossiers/2026-w11/NYJ.json** (through Week 10)
- **data/generated/team-dossiers/2026-w11/LAC.json** (through Week 10)


---

## Saturday delta — 2026-11-21T11:50:00-08:00 (Claude, research view; gate RED)

Status: **carried (no material change)**. Friday leans above are preserved; this section supersedes them where it disagrees. Research evidence only: no ticket, no official pick and no ledger change. The Saturday gate is RED (no fresh Bookmaker capture), so this is provisional.

**Quarterbacks.** NYJ Geno Smith, LAC Justin Herbert.

**Availability (ESPN injuries feed, refreshed Sat 11:08 am PT).** LAC secondary thin: S Kendall Williamson Out, CB Rodney Shelley Out, LB Daiyan Henley Out, CBs Tarheeb Still and Isas Waxter Q; WR Ladd McConkey Q. NYJ: WRs Omar Cooper Jr. and Isaiah Williams Out.

| Source | Home spread (LAC) | Total | Note |
|---|---:|---:|---|
| Bookmaker, Thu Nov 19 1:02 pm PT (Friday basis) | -3 | 42.0 | Last row-verified Bookmaker capture; 46h old |
| BetOnline, Sat Nov 21 11:33 am PT | -3 (-113) | 42.0 | data/generated/props/betonline-live-2026-11-21-week11.json |
| Baseline fair line (fair-lines-w11.json, "baseline only") | +0.2 | 42.8 | Not a calibrated edge |

The comparison is book to book (Bookmaker Thursday, BetOnline Saturday). A half point can be book noise rather than movement.

- **Spread.** No material change (checked Sat 11:39 am PT BetOnline): NYJ +3 (-107). Carried as LEAN; baseline fair LAC +0.2 is the strongest model-versus-market gap on the slate.
- **Total.** Under 42 unchanged; SoFi covered. Carried.
- **Weather / venue (Open-Meteo, read Sat ~11:40 am PT).** SoFi Stadium, covered

**Podcast and expert calls on this game (reviewed-podcast-picks.json):**
- No new reviewed game-market calls.

**Still open before kickoff:** fresh Bookmaker capture (Andy login), final inactives, and a weather recheck on game day.


### Bookmaker recheck — Sat Nov 21, 1:10 pm PT capture

Source: `data/generated/props/bookmaker-live-2026-11-21-week11.json` and `bookmaker-gamelines-2026-11-21-week11.raw.txt` (capturedAt 2026-11-21T21:10:25.854Z). This supersedes the Thursday Bookmaker numbers above.

- **Bookmaker now:** NYJ +3 (-103) / LAC -3 (-113); total 42 (o -108 / u -108)
- **Saturday view:** No change; NYJ +3 at a better price (-103). Lean holds; the strongest model gap on the slate (baseline fair LAC +0.2).
