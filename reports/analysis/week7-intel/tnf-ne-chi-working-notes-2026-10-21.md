# W7 TNF NE @ CHI: working notes (inputs only, NO card), 2026-10-21 ~14:30 PT

Statistical context only. Andy's instruction: hold the TNF draft until all expert, data and analytics reports are verified. This file records verified inputs so the draft can be built Thursday after the props recapture and the final inactives. Kickoff Thu 10/22 5:15 PM PT, Soldier Field.

## Market (captures 2026-10-21)
| Book | Spread | Total | Moneyline | Captured |
|---|---|---|---|---|
| Bookmaker | CHI -3 (-103) / NE +3 (-113) | 50.5 (O -106 / U -110) | CHI -153 / NE +138 | 10/21 13:02 PT |
| DK Predictions (consensus prob., not executable) | CHI -2.5 (56%) / NE +2.5 (46%) | 51.5 (O 48% / U 54%) | n/a | 10/21 |
| BetOnline | CHI -3 (-110) / NE +3 (-110) | 50.5 (-110 each) | CHI -161 / NE +141 | 10/21 13:00 PT (pre-gate dump) |
Movement at Bookmaker since Tuesday evening: lines unchanged; passing-yards ladders slid ~4-5 yards (Maye main line 253.5 -> 248.5, Williams 248.5 -> 244.5).

## Player markets available
- BetOnline pre-gate dump (gate failed on volume, 368 rows, other games not posted): 116 over/under rows for NE @ CHI (CHI 70, NE 46) in scratch/bol_tnf_ne_chi_pregate_parsed.json. Yes/no TD markets not parsed.
- Bookmaker: 589 rows incl. first TD, anytime TD, 2+ and 3+ TD, receptions, receiving yards, carries, rush yards, completions. Quarter and half team totals are unparsed ("unknown", 24 rows).
- DK Predictions anytime TD (consensus): Swift 59% (-144), Stevenson 47% (+113), A.J. Brown 41% (+144), Odunze 34%, Loveland 34%, Burden 33%, Roschon Johnson 31%, Henry 30%. First TD: Swift 17%, Stevenson 11%, Brown 8%, Odunze 8%.
- Bookmaker anytime TD: Swift -191, Stevenson -140, Odunze +150, Loveland +160, Burden +170, Henry +179, Douglas +196. First TD: Swift +451, Stevenson +602, Loveland +913, Johnson +939, Burden/Odunze +1103, Henry +1114.

## Expert inputs (article intel review, 15 explicit selections, 0 actual picks)
- VSiN, Zachary Cohen (TNF preview, read from the page): Patriots +3 (-105, 1.5u); Patriots ML (+138, 0.5u); Maye Over 1.5 passing TDs (-115). No total. Prices need verification against current boards; the +138 ML matches Bookmaker, the -105 spread price is better than Bookmaker's -113.
- Walter Football: Under 50.5 (-110, consensus price assumed).
- BettingPros and Action Network: nothing on this game. Action Network's futures article was dispositioned as context only.
- Dispositions added 10/21: ESPN 2027 mock draft (non-betting, Andy), Action Network futures (context), VSiN TNF preview (selections need execution verification).

## Facts verified
- Maye (nflverse): W1 1 TD, W2 0, W3 0, W4 3, W5 4, W6 3 (three straight 3+ TD games); pass attempts 33/22/25/37/34/32. Short sample.
- Caleb Williams: rows only for W1 (2 TD), W2 (0 TD, 1 INT), W6 (305 yds, 1 TD vs ATL). Andy confirmed he was injured and did not play W3-W5.
- Availability (ESPN feed Tue 10/20 15:47 PT, roster gate PASS, dossiers validate 0/0): NE Doubs IR; A.J. Brown, Webb, Prunty, Canada, Carlton Davis III, Moses questionable; Ben Brown, Vera-Tucker doubtful. CHI Odeyingbo and A. Johnson Jr. IR; Monangai, Jackson, T.J. Edwards, Sanborn questionable; Sweat suspension flagged 10/13. Both QBs ESPN depth chart only; no operator confirmation yet.

## Still to verify before a draft
1. Refresh ESPN status/availability after Wednesday practice reports, again Thursday late morning; official inactives decide.
2. Full BetOnline props recapture (`npm run bolp`), Bookmaker (`bkrp`), DK Predictions (`dkp`) Thursday morning; MIA @ NYJ DK TD board was partial.
3. Andy's W7 QB confirmations.
4. Expert registry (`expert:registry`, run in PowerShell) and the remaining analytics reports on the checklist.
5. Price check of the VSiN picks against live boards.
