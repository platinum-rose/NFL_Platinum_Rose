# TNF SEA @ DEN - Island 3-tier prop parlays (DRAFT, nothing placed)
Built 2026-10-15 by Claude. Kickoff 5:15 PM PT. Prices: BEO capture 2026-10-15T21:15Z (file 764 rows; handoff cited 20:08Z / 770 rows). DKP capture 21:30Z (779 rows, 14 games) used only as TD-probability cross-check (prediction contracts, not executable odds).
Template: Island 3-tier (T1 +600..+1000 $10 | T2 +1800..+3000 $5 | T3 +6500..+20000 $5), distinct players per tier.
Gate: roster_vet.py --week 6 --strict PASS (0 blocks; it resolved 0 card legs, so all 12 players below were separately checked vs ESPN snapshot 2026-10-15T21:03Z: right team, active, not IR/PS). Availability: Charbonnet OUT (SEA), Surtain OUT, Hufanga OUT, Moss Q (DEN). JSN ankle - full Wed, no designation.
Math below is NAIVE leg multiplication. BEO SGP pricing will haircut correlated legs; expect lower real prices.

## Tier 1 - $10 - naive +812 (to win $81.24) - thesis: Seattle air attack vs depleted DEN secondary; DEN offense stalls
| Leg | Line | BEO price |
|---|---|---|
| Jaxon Smith-Njigba SEA | Over 90.5 rec yds | -125 |
| Sam Darnold SEA | Over 18.5 completions | -145 |
| Bo Nix DEN | Under 200.5 pass yds | -125 |
| AJ Barner SEA | Over 2.5 receptions | -150 |
Tension: Nix Under is hurt if SEA leads and DEN throws late. Darnold hit exactly 18 cmp last week (29 att).

## Tier 2 - $5 - naive +2252 (to win $112.62) - thesis: low-total (40.5) grind; both ground games, WR unders
| Leg | Line | BEO price |
|---|---|---|
| Emanuel Wilson SEA | Over 65.5 rush yds | -115 |
| J.K. Dobbins DEN | Over 48.5 rush yds | -125 |
| RJ Harvey DEN | Over 3.5 receptions | -115 |
| Courtland Sutton DEN | Under 31.5 rec yds | +100 |
| Jaylen Waddle DEN | Under 47.5 rec yds | -115 |
Tension: Harvey rec Over vs WR Unders only works if checkdowns replace WR volume.

## Tier 3 Moonshot - $5 - naive +17935 (to win $896.76) - thesis: Kupp/Shaheed secondary volume with Kupp scoring, plus Engram TD
| Leg | Line | BEO price |
|---|---|---|
| Cooper Kupp SEA | Over 2.5 receptions | +125 |
| Cooper Kupp SEA | Anytime TD | +375 |
| Rashid Shaheed SEA | Over 2.5 receptions | +150 |
| Evan Engram DEN | Anytime TD | +575 |
Kupp rec + Kupp TD is the correlated pair (book will cut it). DKP ATD: Kupp 17% (+488) and Shaheed 17% (+488) vs BEO +375/+425 (BEO shorter); Engram 15% (+567) ~ BEO +575.

## Cross-ticket
Nix Under (T1) and WR Unders (T2) share a "DEN offense stalls" exposure; T1 (SEA passing) and T2 (grind) pull against each other, so both can lose together. Not a shared-anchor, but not independent.

## Price-sensitive at recapture (30-45 min pre-kick)
- T1: naive +812 has ~1.3x decimal of room down before leaving the band; a real SGP haircut can push it under +600. Lever: Darnold cmp -> Over 29.5 att (-125). Nix key number 200 (200.5 now). Barner -150 / Darnold -145 are heavily juiced.
- T2: Sutton U 31.5 flat +100 (a juice or number move kills the plus-money leg). Harvey rec 3.5 at -115: if 4.5, drop. Dobbins -125.
- T3: only ~1.11x decimal of room UP to +20000; downside room large. If Kupp/Shaheed ATD shorten, naive price falls, still fine.
- Any leg that disappears (BEO pulls player props near kickoff) breaks that tier; check availability first.
- Re-run roster gate after recapture if any player is swapped in (e.g. Troy Franklin, Marvin Mims have no BEO prop rows today).
