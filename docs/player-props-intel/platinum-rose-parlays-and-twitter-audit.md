# Platinum Rose AI Parlay Ledger & Twitter/X Intel Audit

> **Generated**: 2026-09-09T17:35:00-07:00  
> **Status**: Official Paper Ledger Updated (5 Cards Logged) | Twitter Intel Fully Audited  
> **Portfolio Key**: `platinum_rose_ai` (In-Season Weekly Ledger 2026)  
> **Human Ownership Distinction**: **NOT user/personal bets** — tracked strictly under autonomous model portfolio `platinum_rose_ai`.

---

## 1. Platinum Rose AI Official Parlay Ledger Logging

All 5 curated multi-leg cards have been formally committed to the **Platinum Rose AI Official Paper Ledger** (`data/official-picks/platinum-rose-ai-2026.json`). Each card has been assigned a unique UUID, lifecycle state `official_paper`, standard weekly bankroll allocation (\$10.00 / 1.0 unit), individual leg pricing, and timestamped event records (`proposal_created`, `human_verified`, `official_locked`).

### Official Ledger Wager Summary Table

| Pick ID | Parlay Name / Selection | Slate / Game | Type | Odds | Stake | Potential Return | Book | Correlation Rating |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :---: |
| `ca1c9a65-1915-4b65-9623-a3cfb971b543` | **Patriots Aerial Volume SGP** | NE @ SEA (Wed) | SGP | **+785** | \$10.00 | **\$88.50** | DraftKings / FanDuel | High Positive (+) |
| `09354e7d-e5ad-4946-9b8a-e332fc75bdde` | **Seahawks Dynamic Offense SGP** | NE @ SEA (Wed) | SGP | **+810** | \$10.00 | **\$91.00** | DraftKings / FanDuel | High Positive (+) |
| `fb0b03ae-e65a-4af4-be4e-8d705e7b5f15` | **Melbourne Primetime Shootout SGP** | SF @ LAR (Thu) | SGP | **+645** | \$10.00 | **\$74.50** | DraftKings / BetMGM | High Positive (+) |
| `93d84302-3ab7-4898-b8a1-6600ec2ea946` | **Sunday Workhorse Touchdown Trio** | Multi-Game | Cross-Game | **+765** | \$10.00 | **\$86.50** | Consensus | Independent (+EV) |
| `469160b3-e4a2-414b-929e-a937beb7f473` | **Safe Floor Reception & Yardage Builder** | Multi-Game | Cross-Game | **+715** | \$10.00 | **\$81.50** | DraftKings / FanDuel | Metric Edge Stacking |

- **Total Capital Committed**: \$50.00 (5.0 units across 5 cards)
- **Cumulative Potential Payout**: **\$422.00** (\$372.00 net profit if all cash)
- **Ledger Health**: `data/official-picks/platinum-rose-ai-2026.json` expanded from 23 to 28 active wagers with full audit logs.

---

## 2. Twitter/X Intel Feed Evaluation & Freshness Audit

### Feed Mechanics & Latency Analysis
- **Harvest Mechanism**: `agents/twitter-bookmarks-agent.js` and `scripts/twitter-bookmarks-cron.js`.
- **Authentication**: Connects to personal X account session cookies via internal GraphQL endpoints to pull user-curated bookmarks.
- **Relevance Gate**: Real-time filtering via `isNflBettingIntel` ensures non-target topics (CFB, CBB, generic chat) are filtered while NFL betting, spread/total line moves, and player props are ingested.
- **Current Recency**:
  - **Audit Timestamp**: September 9, 2026, 5:31 PM PST.
  - **Most Recent Bookmark Harvested**: September 9, 2026, **19:01 UTC (12:01 PM PST / 3:01 PM EDT)**.
  - **Live Verification**: A live agent run (`--dry-run`) fetched 30 current bookmarks and confirmed **100% synchronization** with zero uningested backlog. The pipeline is operating in real time heading into kickoff.

### Key Twitter Intel Discovered in Last 24–48 Hours
1. **John Ewing (@johnewing / BetMGM PR)** — *Sep 9, 15:30 UTC*:
   - Released the official list of **Most Bet Player Props for Patriots vs. Seahawks**:
     1. George Holani Over 1.5 Receptions (-185)
     2. Drake Maye Over 231.5 Passing Yards (-120) *(Steamed up 5 yards from our 226.5 baseline!)*
     3. A.J. Brown Over 5.5 Receptions (+115) *(Steamed down 6 cents from our +121 baseline!)*
     4. Jaxon Smith-Njigba Under 6.5 Receptions (-110)
     5. Drake Maye Over 0.5 INT / TD
2. **Ben Fawkes (@BFawkes22)** — *Sep 9, 14:55 UTC*:
   - BetMGM ticket counts: **71% of bets on Seahawks -3.5** and **71% on Bills -1**. Heavy public backing on Seattle confirms New England's trailing pass script.
3. **What's Up P (@propswithicy)** — *Sep 8 & Aug 31*:
   - **Brock Purdy Over 14.5 Rush Yards (-114, 2u)**: Stresses that against the Rams' elite front four (with Aaron Donald returning from retirement), Purdy is forced out of the pocket on designed bootlegs and scrambles.
   - **Tyler Shough Over 14.5 Rush Yards (-112, 2u)**: Notes Saints starter averaged 25 rushing yards in 2025, clearing 14.5 in 5 of 7 starts.
4. **ZR21 (@Zl0ckz21_)** — *Sep 1*:
   - Independently backs **Brock Purdy Over 14.5 Rush Yards (FD -114)** (*2-analyst sharp confluence*).
   - Backs **Christian McCaffrey Over 36.5 Receiving Yards (FD -110)** and **Kyren Williams Over 10.5 Receiving Yards**.
5. **Dan's AI Sports Picks (@DanGambleAI)** — *Aug 31*:
   - Eight plus-money Week 1 props: **Jalen Hurts Anytime TD (+110)**, **Amon-Ra St. Brown 8+ Rec (+162)**, **Caleb Williams 250+ Pass Yds (+154)**, **Bhayshul Tuten Anytime TD (+135)**.
6. **Joe Holka (@thejoeholkashow)** — *Sep 8*:
   - #1 lock: **Zay Flowers Over Receiving Yards** (6th in NFL in ypg, Colts allowed 2nd-most WR yards).
   - #2 lock: **Omarion Hampton Over Rushing Yards** (Harbaugh run-heavy script vs. Cardinals).
7. **Sal Bets (@salbets_)** — *Sep 9, 19:01 UTC*:
   - Highlights discounted DFS lines: **A.J. Brown Over 4.5 Catches** and **Quinshon Judkins Over 1.5 Catches**.
8. **Invisible Insider (@invisiblestats)** — *Aug 31*:
   - Reverse line movement: 49ers ML moved from +180 to +165 on only 9% public dollars (massive sharp liability).

---

## 3. How Twitter Intel Alters, Validates, and Enhances Our Builds

### Card 1: Patriots Aerial Volume SGP (+785)
- **Market Validation & Closing Line Value (CLV)**:
  - John Ewing’s BetMGM report confirms that Drake Maye Over Pass Yds and A.J. Brown Over Receptions are the **#2 and #3 most bet props on the entire board**.
  - Maye’s passing yardage line was bet up from **226.5 to 231.5**. By capturing **226.5 at -117**, our card carries **+5.0 yards of positive CLV**.
  - A.J. Brown’s odds steamed from **+121 down to +115**, validating significant professional money behind Brown’s debut volume.
- **Enhancement / Alternate Variation**:
  - *High-Floor DFS Variant*: Replace AJ Brown 5.5 Receptions (+121) with Sal Bets’ flagged **AJ Brown 4.5 Catches (-145)** on alternate books to construct a safer **+540 Floor SGP**.
  - *Mega 4-Leg Expansion (+1450)*: Add **Patriots +3.5 Spread (-108)** or **Drake Maye Over 0.5 INT (-125)** to capitalize on extreme passing volume.

### Card 2: Seahawks Dynamic Offense SGP (+810)
- **Market Discovery**:
  - Ewing revealed that **George Holani Over 1.5 Receptions (-185)** is the **#1 most bet prop** for the game.
  - This confirms that market makers and sharps expect Seattle's backfield to see heavy receiving involvement in Brian Fleury’s offense.
- **How to Enhance**:
  - Because Holani is priced at prohibitive chalk (-185), our selection of **Jadarian Price Over 1.5 Receptions at +124** remains the superior asymmetric leverage play.
  - *Conservative Swap*: For risk-averse bettors, swapping Price (+124) for Holani Over 1.5 Rec (-185) yields a safer **+485 SGP**.
  - *Yardage vs. Catch Validation*: Ewing noted JSN **Under 6.5 Receptions (-110)** is heavily bet. This strongly validates our choice to bet **JSN Receiving Yards (Over 82.5)** rather than receptions—JSN can easily produce 85+ yards on 4 or 5 deep targets without needing 7 catches.

### Card 3: Melbourne Primetime Shootout SGP (+645)
- **Major Twitter Discovery (Brock Purdy Scramble Confluence)**:
  - Both **@propswithicy (2 units)** and **@Zl0ckz21_ (0.75 unit)** independently singled out **Brock Purdy Over 14.5 Rushing Yards (-114)**.
  - With Aaron Donald returning to anchor the Rams' front four, San Francisco will encounter interior pressure, forcing Purdy into 3–5 scramble opportunities.
- **Enhanced Variant: The "Melbourne 4-Leg Super-Shootout" (+1350)**:
  - Leg 1: Mike Evans Anytime TD (+175)
  - Leg 2: Christian McCaffrey 61+ Rush Yds (-115)
  - Leg 3: Kyle Juszczyk Over 4.5 Rec Yds (-120)
  - Leg 4: **Brock Purdy Over 14.5 Rush Yds (-114)**
  - *Synergy*: A complete script covering the run game, screen game, red-zone passing, and quarterback scrambling.
- **Alternative Passing Variant (+825)**:
  - Swap CMC Rushing (61+) for **CMC Over 36.5 Receiving Yards (-110)** (backed by @Zl0ckz21_) + **Brock Purdy Over 14.5 Rush Yards (-114)** if anticipating a pass-heavy shootout on the Melbourne turf.

### Card 4: Sunday Workhorse Touchdown Trio (+765)
- **Lottery Leg Risk vs. Twitter Solution**:
  - Our original Card 4 uses **James Cook First TD (+550)**, which is an asymmetric multiplier but inherently high-variance.
- **Twitter Solution (The "Tush Push" Anytime TD Lock)**:
  - Dan's AI Sports Picks (@DanGambleAI) flagged **Jalen Hurts Anytime TD (+110)**.
- **Enhanced Variant: The "Undisputed Goal-Line Alpha Trio" (+950)**:
  - Leg 1: **Rhamondre Stevenson Anytime TD (+100)** [NE @ SEA]
  - Leg 2: **Mike Evans Anytime TD (+175)** [SF @ LAR]
  - Leg 3: **Jalen Hurts Anytime TD (+110)** [PHI vs. DAL]
  - *Synergy*: Replaces a high-variance First TD lottery with the most reliable goal-line play in football (the Brotherly Shove / Tush Push). All three players are exclusive inside-the-5 goal-line monopolizers, yielding **+950 odds** ($10 pays $105.00).

### Card 5: Safe Floor Reception & Yardage Builder (+715)
- **Twitter Sharp Confluence**:
  - Joe Holka (@thejoeholkashow) isolated **Zay Flowers Over Receiving Yards (64.5)** and **Omarion Hampton Over Rushing Yards (65.5)**.
  - PropsWithIcy (@propswithicy, 2u) and DanGambleAI (@DanGambleAI) isolated **Tyler Shough Over 14.5 / 20+ Rushing Yards**.
- **Alternative Sharp Ticket: "Sunday High-Floor Sharp Confluence" (+685)**:
  - Leg 1: **Zay Flowers Over 64.5 Rec Yds (-114)** (Holka)
  - Leg 2: **Tyler Shough Over 14.5 Rush Yds (-112)** (PropsWithIcy 2u)
  - Leg 3: **Alec Pierce Over 44.5 Rec Yds (-113)** (Zachary Cohen / OptaAI)
  - *Synergy*: 3 players backed by direct quantitative edges, matchup funnels (Colts secondary leakiness), and mobile QB game scripts.

---

## 4. Summary & Verification

1. **Official Ledger**: All 5 original cards are now tracked under `platinum_rose_ai` in `data/official-picks/platinum-rose-ai-2026.json`.
2. **Personal Separation**: Formally delineated as **Platinum Rose AI model paper bets**, completely distinct from the user's personal portfolio.
3. **Twitter Intel Currency**: Fully synchronized as of September 9, 2026, 19:01 UTC.
4. **Enhanced Variant Playbook**: Ready for execution should the user choose to deploy the **+950 All-Anytime TD Trio** or the **+1350 Melbourne 4-Leg Super-Shootout**.
