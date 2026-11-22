# Week 11 Saturday QB, final-injury and news check

Compiled by Claude, Sat Nov 21 2026, about 11:50 am PT. This is evidence for Andy's confirmation. The manual gate flags in `data/generated/master-intel/w11-gate-manual.json` are **not** set. Per the runbook, they are cleared only after Andy confirms in chat, and never on "trending" language.

Inputs:
- ESPN depth charts via the site API, captured Sat ~11:46 am PT (`scratch/w11-sat-espn-qb-depth.json`).
- ESPN and FantasyPros injury feeds, refreshed Sat 11:08 am PT (`data/player-availability/latest.json`).
- Source-attributed reports, linked below.

## Starting quarterbacks

| Game | Away QB | Home QB | Evidence | Clearable? |
|---|---|---|---|---|
| MIA@BUF | Kyle McCord | Josh Allen | ESPN depth QB1. Willis on IR 11/16. McCord started Week 10 (AP via La Nación). | Yes |
| NO@CHI | Tyler Shough | Caleb Williams | ESPN depth QB1, no QB injury designation | Yes |
| TEN@DAL | Cam Ward | Dak Prescott | ESPN depth QB1, no designation | Yes |
| TB@DET | **Baker Mayfield (Q)** | Jared Goff | Mayfield Questionable (foot/plantar fascia, thumb). On Friday, Bowles said "trending in the right direction" but would not commit, per Pewter Report and PFT/NBC citing the Tampa Bay Times. | **No.** Trending language only; recheck at Sunday inactives |
| ARI@KC | Carson Beck | Patrick Mahomes | ESPN depth QB1. Second straight start after Minshew's season-ending elbow injury (Yardbarker/FLM, 11/19). ESPN feed still shows Beck Questionable as of Fri 9:36 am PT. | Andy to confirm; Beck's Q tag is unresolved |
| PIT@PHI | Aaron Rodgers | Joe Milton III | Sirianni confirmed Milton on Wed 11/18 (FOX Sports, Yardbarker, theScore). Hurts on IR. | Yes |
| BAL@CAR | Jacoby Brissett | Bryce Young | ESPN depth QB1. Ravens traded for Brissett; Lamar Jackson on IR (Panthers.com Know Your Foe). | Yes |
| NYJ@LAC | Geno Smith | Justin Herbert | ESPN depth QB1, no designation | Yes |
| LV@DEN | Fernando Mendoza | Bo Nix | ESPN depth QB1, no designation | Yes |
| JAX@NYG | Trevor Lawrence | J.J. McCarthy | ESPN depth QB1, no designation | Yes |
| MIN@SF | Kirk Cousins | Brock Purdy | ESPN depth QB1. Cousins started the Week 10 win at Green Bay (FOX 9). Murray Out. | Yes. Resolves the Friday conflict |
| CIN@WAS | Joe Burrow | Jayden Daniels | ESPN depth QB1, no designation | Yes |

**Data defect:** `data/projected-starters/2026/latest.json` still lists Jacoby Brissett as ARI QB1, from the 10/27 Ourlads file. It has no QB1 for MIA, PHI, BAL, LV, JAX or MIN. Use the ESPN depth snapshot above until the manual depth files are refreshed.

**Fixed Sat 12:45 pm PT (Andy's request).** Added `data/projected-starters/2026/manual/qb-starters-2026-w11.json` (MIA McCord, PHI Milton, BAL Brissett, LV Mendoza, JAX Lawrence, MIN Cousins). In `ari-depth-chart-2026-10-27.json`, Brissett is now `departed` and Beck is QB1 (backup `.bak-claude-20261121-sat`). Rebuilt starters: all 24 Week 11 teams have one QB1 matching ESPN, with no duplicates.

## Final injury designations (Friday reports, ESPN feed)

Listed by game in each matchup's Saturday delta. Material items reported **after** the Friday write-ups:
- NO: C Erik McCoy, OT Taliese Fuaga and OT Asim Richards are Out. NO +11.5 downgraded to PASS.
- WAS: OT Laremy Tunsil to IR; RB Jacory Croskey-Merritt to IR (Sat). WAS +6 downgraded to PASS.
- TEN: RB Tyjae Spears to IR (Sat 10:44 am PT).
- PIT: LB Nick Herbig Out (Sat update).
- BUF: DT Ed Oliver Questionable (Sat update).
- CIN: G Dalton Risner Out (Sat update).

## News flags

- **Venue:** MIN@SF is at Estadio Banorte, Mexico City, elevation about 2,240 m (FOX 9). The weather file now uses the Mexico City forecast.
- **Market:** BetOnline has not posted TB@DET or ARI@KC game lines or props as of 11:33 am PT. Treat this as a market-status question, not an injury fact.
- **Not checked:** trades or pulled Bookmaker markets since Thursday. That needs a fresh Bookmaker capture.

## Recommendation for Andy

- `qb_status_confirmed`: leave open until TB (Mayfield) is settled at inactives. Confirm ARI (Beck).
- `final_injury_reports_checked`: ready to confirm on the evidence above if you agree.
- `news_flags_resolved`: open until Bookmaker is recaptured. The pulled-market check needs it.

## Update Sat 1:45 pm PT: ARI QB conflict (from X bookmark review)

RotoWire (Fri 4:03 pm PT) and Fantasy Couch (Fri 5:09 pm PT) report that Beck did not practice Friday and Josh Johnson is preparing to start. This conflicts with the ESPN depth chart (Beck QB1). Projected starters now list Josh Johnson as ARI QB1, flagged for review. `qb_status_confirmed` stays open for ARI and TB until inactives.
Other source conflicts are recorded in the bookmark digest: Michael Pittman Jr. and Jonathon Brooks (ESPN IR vs later RotoWire questionable), and Jacory Croskey-Merritt (later ESPN IR wins).
