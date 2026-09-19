# Week 2 Sunday/Monday Card — FIRST PASS (2026-09-19, Claude/Cowork)

Status: draft for Andy to react to. Nothing placed/logged. Follows `docs/NFL_WEEKLY_CARD_PROCESS.md` slots
and `docs/BETTING_LESSONS_LEARNED.md` (highest-conviction reads also go out as standalone / 2-leg tickets).

## Inputs (and how fresh they are)
- Game lines: `game_odds_snapshots` 2026-09-19 12:00Z (3-book median). **Re-check before placing.**
- Game status injuries / QB calls / secondary tiers: alpha packet `weekly_intel` built 2026-09-19 07:16Z.
- Podcast picks: 35 Sep 14+ transcripts re-extracted over the full transcript (Gemini), 255 picks. Counted per
  show, not per row (Action Network's Playground is one source even with 37 rows).
- **Missing:** no Week 2 Sun/Mon prop board in `docs/Player_Prop_Odds_Weekly/Week2` (TNF only), and
  `player_prop_odds` is empty — prop lines below are the podcasters' lines from Wed–Fri, not live prices.
  Kalshi feed `data/prediction-markets/latest.json` is from 09-13 (stale). SuperContest picks not in hand.

## Key availability (game-status rows)
ATL: Penix OUT, Tua DOUBTFUL → Cooper Rush starts · MIN: Murray OUT (concussion) → Wentz · SEA: Darnold OUT → Drew Lock,
Charbonnet OUT · HOU: Nico Collins OUT (Tank Dell OUT) · BAL: Zay Flowers DOUBTFUL · CIN: Burrow QUESTIONABLE (back) ·
LV: Bowers DOUBTFUL, O'Connell Q · LAR: Puka Nacua Q · LAC: McConkey Q · PIT: Joey Porter Jr. OUT · ARI: Garrett Williams OUT ·
NYJ: Minkah Fitzpatrick OUT · DEN: Mims OUT · WAS: Okonkwo OUT · PHI: Greenard OUT.

## Consensus board (distinct shows)
| Game (line now) | Lean | Shows for / against | Matchup data | Verdict |
|---|---|---|---|---|
| CLE @ TB (TB -8.5, 41.5) | TB -8.5 | SoS, BettingPros, Action, Even Money, Favorites / Favorites (split) | watch only | **Play** |
| PHI @ TEN (PHI -7, 39.5) | UNDER 39.5 | Action, BettingPros, Favorites / none | medium both ways | **Play** |
| NYG @ LAR (LAR -7.5, 48) | LAR -7.5 | Action, SoS, Even Money, DJ&Bucky (ML, 90) / DJ&Bucky alt | **HIGH** LAR→NYG (6.49, top of week) | Play — confirm Nacua; -7 is gone |
| MIA @ SF (SF -13.5, 44.5) | MIA +13.5 | Action, BettingPros, SoS, Favorites / none | medium | **Play** |
| CIN @ HOU (HOU -2.5, 45.5) | HOU -2.5 | BettingPros, Even Money, SoS, Action / BettingPros alt, DJ&Bucky | — | Conditional on Burrow status |
| NO @ BAL (BAL -8.5, 46.5) | UNDER 46.5 | BettingPros, Action (+ Sharp: Lamar U221.5 pass) / none | medium | Play (Flowers out → run-heavy) |
| IND @ KC (KC -6.5, 46.5) | IND +6.5 | SoS, Action / DJ&Bucky, Favorites | — | Lean |
| PIT @ NE (NE -5, 41.5) | PIT +5 | SoS, Favorites, Action (ML) / DJ&Bucky, Action | **HIGH** NE→PIT (Porter out) — conflicts | Lean only; shows had +5.5 |
| GB @ NYJ (GB -3.5) | NYJ +3.5 | Even Money, Action / Mays | medium | Pass — line moved 4.5→3.5 |
| SEA @ ARI, CAR @ ATL, MIN @ CHI, JAX @ DEN, WAS @ DAL, LV @ LAC | — | split | — | **Pass on sides** |

## Standalone / 2-leg tickets (lessons-learned rule)
These are the reads with multiple backers AND a matchup or availability reason. They don't sit only inside the big parlays.
1. **Justin Jefferson OVER 6.5 receptions** — BettingPros (37.5% target share with Wentz), Action (O73.5 yds, 85);
   MIN→CHI **HIGH** (slot/inside tags; Kyler Gordon PUP, A. Johnson Jr. OUT). Standalone.
2. **Bijan Robinson OVER 126.5 rush+rec yds** — BettingPros (80); CAR allowed ~300 rush yds Wk1; Cooper Rush at QB
   means more run. Standalone.
3. **PHI/TEN UNDER 39.5** — 3 shows. Standalone.
4. **TB -8.5** — 5 shows. Standalone.
5. 2-leg: **Dalton Schultz OVER 3.5 rec + Rashod Bateman OVER 2.5 rec** — both pick up targets from an absent WR1
   (Collins OUT / Flowers doubtful). Price-check; both are likely juiced alt-style lines.
6. 2-leg SGP: **NO/BAL UNDER 46.5 + Lamar UNDER 221.5 pass yds** (correlated).

## Slot 1 — Master Round Robin (8 legs, 4-team, 70 combos, $70–140)
TB -8.5 · PHI/TEN U39.5 · LAR -7.5 · MIA +13.5 · NO/BAL U46.5 · HOU -2.5 (drop if Burrow is ruled active/full) · IND +6.5 · PIT +5

## Slot 2 — ML Underdog RR (5–6 legs, ≤$30)
ATL +126 (Rush at QB is the risk) · NYJ +160 · ARI +175 · PIT +195 · IND +240

## Slots 3/4 — AM / PM weighted parlays (SNF favorite cap)
- AM: TB ML (-450) · BAL ML (-425) · PHI ML (-350) · HOU ML (-136) · cap **KC ML (-300)**
- PM: SF ML (-900) · LAC ML (-305) · DAL ML (-210) · TB ML · cap **KC ML (-300)**
- Note: the lean on the SNF game is IND +6.5, not KC. KC ML is the template's hedge cap, and it pairs with the IND +6.5 RR leg to set up a middle (KC wins by 1–6).

## Slot 5 — Hybrid (≤5–6 legs, highest conviction)
TB -8.5 · PHI/TEN U39.5 · Jefferson O6.5 rec · Bijan O126.5 R+R · LAR -7.5

## Slot 7 — Player prop stacks (need the Week 2 board to price)
- Legit: Jefferson O6.5 rec · Bijan O126.5 · Purdy O19.5 completions (BettingPros "5-star") · Mac Hollins O35.5 rec yds
  (NE→PIT HIGH, Porter OUT) · Parker Washington O4.5 rec
- Moonshot: Mike Evans ATD (+130) · JSN ATD (+135) · Mark Andrews ATD (+125) · Isaiah Likely ATD (+270)

## Slots 8a / 8b — TD stacks ($5 each; prices from the board)
- 8a First TD: Chuba Hubbard (+500 per Action) · Mike Evans · Justin Jefferson
- 8b 2+ TD: Bijan Robinson · Kenneth Walker (KC) · Mike Evans — likely won't reach +7000 at 3 legs; flag the actual price

## Slot 6 — SuperContest 5: needs this week's SC picks from Andy.
## Slot 9 — Island games
- SNF IND@KC: Daniel Jones U32.5 pass att (BettingPros "5-star", 85) · Walker O78.5 rush · Rashee Rice O53.5 rec yds · UNDER 46.5 (BettingPros)
- MNF NYG@LAR: LAR -7.5 (HIGH secondary tier), LAR WR overs once Nacua's status is known · Isaiah Likely ATD +270

## Data caveats found while building
- `secondary_matchups[].target_receivers` uses stale rosters (e.g. Cooper Kupp on LAR, DK Metcalf/Lockett on SEA,
  Deebo on SF, Hopkins/Boyd on TEN). Use the tiers and tags. Ignore the receiver names.
- Secondary dedupe misses name variants: BAL "T.J. Tampa" and "T.J. Tampa Jr." both counted.
- Extracted picks have team noise (e.g. Daniel Jones filed under KC, "Opponent"/"Unknown" team2, one LSU/Ole Miss
  college pick from Warren Sharp) — the per-show tally above was checked by hand.
