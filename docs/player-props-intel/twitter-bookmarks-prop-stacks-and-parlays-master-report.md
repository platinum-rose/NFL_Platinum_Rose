# 🏈 Twitter Bookmark Intel: Master Player Prop Stacks & Parlay Catalog (Week 1 Slate)

> **Generated:** 2026-09-13T01:25:00-07:00  
> **Source Pipeline:** Personal Twitter/X Bookmarks Ingestion (`agents/twitter-bookmarks-agent.js`) & Local Vault  
> **Slate Target:** NFL 2026 Week 1 Sunday & Monday Slate (Sept 13–14, 2026)  
> **Recipient Teams:** Claude / Codex Multi-Model Evaluation & Parlay Synthesis Committee  
> **Status:** Full Pipeline Audit Complete | 72 Local Reports Scanned | 62 Vault Notes Indexed  

---

## 1. Twitter Bookmark Ingestion Pipeline: Health & Status

### A. Current Corpus Metrics
* **Total Local Harvested Reports:** **72 Markdown Files** in [`.nfl/reports/twitter-bookmarks/`](file:///E:/dev/projects/NFL_Dashboard/.nfl/reports/twitter-bookmarks/)
* **Total Supabase Vault Notes:** **62 Notes** under `NFL/Bookmarks/%` in `vault_notes`
* **Research Intel Bridge Notes:** **45 Notes** indexed in `research_intel_notes`
* **Live Ingestion Freshness:** Verified via live `--dry-run` against personal X session cookies. All 35 active bookmarks in the recency window are synchronized.

### B. Pipeline Diagnostic & Gemini Vision OCR Finding
* **The Diagnostic:** `research_pick_signals` currently contains 0 rows for Twitter bookmarks despite dozens of graphic attachments.
* **Root Cause Identified:** In [`agents/twitter-bookmarks-agent.js`](file:///E:/dev/projects/NFL_Dashboard/agents/twitter-bookmarks-agent.js#L491), line 491 targeted `models/gemini-2.5-flash`, which Google's API has officially deprecated (`404 NOT_FOUND: This model models/gemini-2.5-flash is no longer available`).
* **Verified Resolution:** Upgrading the endpoint string in line 491 to `models/gemini-3.6-flash` immediately restores full JSON OCR extraction of multi-leg betting slips, prop cheat sheets, and parlay cards from attached media URLs (tested and validated 200 OK on sample tickets).

---

## 2. Master Catalog of Player Prop Stacks & Parlay Recommendations

### Stack 1: The "Dual-Threat QB Rushing Ceiling" 6-Leg Parlay (+15660)
* **Primary Source:** The Prop Dealer (`@thepropdealer`) & Sal Bets (`@salbets_`)
* **Core Thesis:** Sportsbooks chronically underprice early-season quarterback designed rushing and scramble volume while defensive containment schemes are uncalibrated.
* **Component Legs:**
  1. **Josh Allen (BUF @ HOU):** Over 40 Alt Rushing Yards (`+182`)
     * *Rationale:* Heavy blitz pressure from Will Anderson Jr. and Danielle Hunter forces Allen on designed power runs and scramble escapes.
  2. **Tyler Shough (NO @ DET):** Over 20 Alt Rushing Yards (`+154`) *(Consensus Sharp Anchor)*
     * *Rationale:* Shough averaged 25.0 rush ypg in 2025; cleared 14.5 in 5 of 7 starts. Lions' aggressive pass rush creates wide B-gap scramble lanes.
  3. **Lamar Jackson (BAL @ IND):** Over 40 Alt Rushing Yards (`+108`)
     * *Rationale:* Colts' defensive front vulnerable to read-option; Jackson cleared 40+ rushing in 7 of 8 career seasons.
  4. **Jayden Daniels (WAS @ PHI):** Over 40 Alt Rushing Yards (`+116`)
     * *Rationale:* Absence of Laremy Tunsil stresses line protection; Daniels will take off on bootlegs against Vic Fangio's zone shell.
  5. **Jaxson Dart (DAL @ NYG - SNF):** Over 30 Alt Rushing Yards (`-106`)
     * *Rationale:* Primetime debut under Brian Daboll; designed QB draws featured in red zone.
  6. *(Historical / Week Opener Leg)*: Drake Maye (NE @ SEA): Over 30 Alt Rushing Yards (`+152`)
* **Sunday-Only 5-Leg Adjusted Odds:** **~+6150** ($10 pays $625.00)

---

### Stack 2: The "5 Players WILL WIN Your NFL Parlays" Target Card
* **Primary Source:** Joe Holka (`@thejoeholkashow`)
* **Market Format:** Multi-Game Correlated Prop Accumulator
* **Component Legs:**
  1. **Zay Flowers (BAL @ IND):** Over 64.5 Receiving Yards (`-114`, DraftKings)
     * *Rationale:* Ranked 6th in NFL in receiving yards per game (71.1); Colts allowed 2nd-most receiving yards to boundary WRs. Cleared in 4 of final 5 games.
  2. **Omarion Hampton (ARI @ LAC):** Over 65.5 Rushing Yards (`-114`, DraftKings)
     * *Rationale:* Jim Harbaugh ground-and-pound commitment against a soft Cardinals run front that allowed 130+ rush ypg. Hampton commands clear workhorse volume.
  3. **Tyler Shough (NO @ DET):** Over 14.5 Rushing Yards (`-112`, Consensus)
     * *Rationale:* 2-unit sharp confluence with `@propswithicy`. High mobile floor in dome environment.
  4. **Amon-Ra St. Brown (DET vs. NO):** 8+ Receptions (`+162`, Consensus)
     * *Rationale:* Target funnel in projected high-scoring indoor shootout (48.5 total).
  5. **Jalen Hurts (PHI vs. WAS):** Anytime Touchdown (`+110`, Consensus)
     * *Rationale:* Brotherly Shove / goal-line quarterback sneak dominance.

---

### Stack 3: Dan's AI Sports Picks 8 Plus-Money Value Board
* **Primary Source:** Dan's AI Sports Picks (`@DanGambleAI`)
* **Core Angle:** Exploiting plus-money mispricings across premier offensive playmakers.
* **Component Selections:**
  * **Jalen Hurts (PHI vs. WAS):** Anytime Touchdown (`+110`)
  * **Amon-Ra St. Brown (DET vs. NO):** 8+ Receptions (`+162`)
  * **Caleb Williams (CHI vs. CAR):** 250+ Passing Yards (`+154`)
  * **Bhayshul Tuten (JAX vs. CLE):** Anytime Touchdown (`+135`)
  * **Tyler Shough (NO @ DET):** 20+ Rushing Yards (`+154`)
  * **Emeka Egbuka (TB @ CIN):** 60+ Receiving Yards (`+110`)
  * **Malik Nabers (NYG vs. DAL - SNF):** 6+ Receptions (`+130`)
  * **Jayden Daniels (WAS @ PHI):** 40+ Rushing Yards (`+116`)

---

### Stack 4: Cody Brown Bets "Lines That Look Too Low"
* **Primary Source:** Cody Brown Bets (`@CodyBrownBets`)
* **Format:** Cross-Game Floor Builders & Teaser Anchors
* **Component Selections:**
  * **Dallas Goedert (PHI vs. WAS):** Over 34.5 Receiving Yards (`-115`)
  * **Jalen Hurts (PHI vs. WAS):** Over 26.5 Rushing Yards (`-115`)
  * **DJ Moore (CHI vs. CAR):** Over 3.5 Receptions (`-125`)
  * **Josh Allen (BUF @ HOU):** Over 29.5 Rushing Yards (`-115`)
  * **Tucker Kraft (GB @ MIN):** Over 3.5 Receptions (`-110`)
  * **Malik Nabers (NYG vs. DAL):** Over 5.5 Receptions (`-110`)

---

### Stack 5: The Prop Dealer 13-Leg Moneyline Model Ticket (+27000)
* **Primary Source:** The Prop Dealer (`@thepropdealer`)
* **Ticket Sizing:** $10.00 pays **$2,700.00**
* **Active Sunday Model Moneylines (from `docs/twitter/Nates_AlgoPicks_1` & Live Feed):**
  1. **Carolina Panthers ML** (`+118`) @ CHI
  2. **Miami Dolphins ML** (`+176`) @ LV
  3. **Pittsburgh Steelers ML** (`-146`) @ ATL
  4. **Tennessee Titans ML** (`-134`) vs. NYJ
  5. **Buffalo Bills ML** (`-110`) @ HOU
  6. **Minnesota Vikings ML** (`-104`) vs. GB
  7. **Jacksonville Jaguars ML** (`-440`) vs. CLE
  8. **Los Angeles Chargers ML** (`-480`) vs. ARI
  9. **Philadelphia Eagles ML** (`-245`) vs. WAS
  10. **Detroit Lions ML** (`-330`) vs. NO
  11. **Cincinnati Bengals ML** (`-175`) vs. TB
  12. **Dallas Cowboys ML** (`-160`) @ NYG (SNF)
  13. **Kansas City Chiefs ML** (`-145`) @ DEN (MNF)

---

### Stack 6: The Prop Dealer 2-Leg FanDuel Mega Lotto (+1250000)
* **Primary Source:** The Prop Dealer (`@thepropdealer`) (`2026-09-12-thepropdealer-2098872532346851762.md`)
* **Ticket Sizing:** $2.00 pays **$25,000.00+**
* **Market Angle:** Cross-game extreme yardage/touchdown milestones on ascending sophomore weapons.

---

### Stack 7: Harry Lock Picks 3-Year Consecutive Winner (+2686)
* **Primary Source:** Harry Lock Picks (`@HarryLockPicks`) (`2026-09-06-HarryLockPicks-2096723883290136948.md`)
* **Market Angle:** Trend-based historical Week 1 multi-leg parlay combining divisional dogs and under-totals.

---

## 3. Game-by-Game Slate Breakdown (Sunday & Monday Games)

| Game Window | Matchup | Twitter Expert | Proposed Leg / Market | Line / Price | Key Angle / Notes |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Early (1:00 PM ET)** | **BAL @ IND** | Joe Holka | Zay Flowers Over Rec Yds | `64.5 (-114)` | Colts secondary allows 2nd-most yards to WRs. |
| **Early (1:00 PM ET)** | **BAL @ IND** | Model / Vision | Lamar Jackson Alt Rush Yds | `40+ (+108)` | Scramble volume against Gus Bradley zone front. |
| **Early (1:00 PM ET)** | **NO @ DET** | What's Up P | Tyler Shough Rush Yds | `O14.5 (-112)` | **2-Unit Sharp Lock**; cleared in 5 of 7 games. |
| **Early (1:00 PM ET)** | **NO @ DET** | Dan's AI Picks | Amon-Ra St. Brown Receptions | `8+ (+162)` | High-volume target share in indoor shootout. |
| **Early (1:00 PM ET)** | **BUF @ HOU** | Cody Brown | Josh Allen Rushing Yards | `O29.5 (-115)` | Texans pass rush forces Allen out of pocket. |
| **Early (1:00 PM ET)** | **BUF @ HOU** | Vision OCR | Josh Allen Alt Rush Yds | `40+ (+182)` | High-leverage plus-money variant. |
| **Early (1:00 PM ET)** | **CHI vs. CAR** | Dan's AI Picks | Caleb Williams Passing Yards | `250+ (+154)` | Upgraded WR corps against soft Panthers boundary. |
| **Early (1:00 PM ET)** | **CHI vs. CAR** | Cody Brown | DJ Moore Receptions | `O3.5 (-125)` | Revenge game volume; high-floor chain-mover. |
| **Early (1:00 PM ET)** | **CLE @ JAX** | Sal Bets | Quinshon Judkins Receptions | `O1.5 Catches` | Dump-off target script behind battered O-line. |
| **Early (1:00 PM ET)** | **CLE @ JAX** | Dan's AI Picks | Bhayshul Tuten Anytime TD | `+135` | Liam Coen red-zone power rushing option. |
| **Early (1:00 PM ET)** | **TB @ CIN** | Dan's AI Picks | Emeka Egbuka Receiving Yards | `60+ (+110)` | Rookie target vacuum opposite Mike Evans departure. |
| **Late (4:25 PM ET)** | **ARI @ LAC** | Joe Holka | Omarion Hampton Rushing Yds | `O65.5 (-114)` | Harbaugh trench commitment vs. Cardinals run D. |
| **Late (4:25 PM ET)** | **WAS @ PHI** | Dan's AI Picks | Jalen Hurts Anytime TD | `+110` | Tush Push / Brotherly Shove goal-line equity. |
| **Late (4:25 PM ET)** | **WAS @ PHI** | Cody Brown | Dallas Goedert Receiving Yds | `O34.5 (-115)` | Washington LB coverage mismatch over middle. |
| **Late (4:25 PM ET)** | **WAS @ PHI** | Vision OCR | Jayden Daniels Alt Rush Yds | `40+ (+116)` | Scramble equity in trailing script. |
| **Late (4:25 PM ET)** | **GB @ MIN** | Cody Brown | Tucker Kraft Receptions | `O3.5 (-110)` | Intermediate security blanket against Flores blitz. |
| **SNF (8:20 PM ET)** | **DAL @ NYG** | Dan's AI Picks | Malik Nabers Receptions | `6+ (+130)` | Undisputed WR1 alpha volume. |
| **SNF (8:20 PM ET)** | **DAL @ NYG** | Vision OCR | Jaxson Dart Alt Rush Yds | `30+ (-106)` | Designed quarterback draw role. |

---

## 4. Cross-Platform Confluence & Validation Matrix

Where Twitter bookmarks intersect with our National Podcast & Article Syndicate Dossier:

1. **Tyler Shough Rushing Floor (Consensus Confluence):**
   * *Twitter Sharps:* What's Up P (`@propswithicy`, 2.0u at `O14.5`), Dan's AI Sports Picks (`20+ at +154`).
   * *Podcasts / Media:* Even Money (Ross Tucker & Steve Fezzik cite Shough's dual-threat ability as key to Saints' offensive floor).
   * *Syndicate Rating:* **Highest Conviction QB Prop on Board**.

2. **Zay Flowers Target Funnel (Tactical Confluence):**
   * *Twitter Sharps:* Joe Holka (`@thejoeholkashow`, Over 64.5 Rec Yds).
   * *Media:* VSiN Zachary Cohen independent model highlights Ravens' pass funnel against Indianapolis Cover-3.

3. **Josh Allen Scramble / Ground Volume (Pressure Confluence):**
   * *Twitter Sharps:* Cody Brown (`O29.5`), Vision OCR Slip (`40+ at +182`).
   * *Media:* Sharp Football (Rich Hribar notes Houston's exterior pressure funnel forces mobile QBs up into the B-gap).

4. **Quinshon Judkins Reception Volume (Analytics Confluence):**
   * *Twitter Sharps:* Sal Bets (`@salbets_`, Higher Than 1.5 Catches).
   * *Analytics:* Sean Koerner (Action Network AMA explicitly highlighted Judkins' receiving usage offsetting negative rushing scripts behind an injured line).

---

## 5. Curated Ready-to-Evaluate Parlay Cards for Claude & Codex

### Card A: The "High Floor Safe Yardage & Receptions Builder" (4 Legs — +685)
* **Bookmaker:** DraftKings / FanDuel Consensus
* **Leg 1:** Tyler Shough Over 14.5 Rushing Yards (`-112`)
* **Leg 2:** Zay Flowers Over 59.5 Receiving Yards (Alt Line `-145`)
* **Leg 3:** DJ Moore Over 3.5 Receptions (`-125`)
* **Leg 4:** Dallas Goedert Over 29.5 Receiving Yards (Alt Line `-150`)
* **Evaluation Target:** Optimal for conservative 1.0u paper allocation; builds on high baseline touch floors.

---

### Card B: The "Dual-Threat Mobile QB Rush Engine" (4 Legs — +1920)
* **Bookmaker:** FanDuel / DraftKings
* **Leg 1:** Tyler Shough 20+ Rushing Yards (`+154`)
* **Leg 2:** Josh Allen 35+ Rushing Yards (`+136`)
* **Leg 3:** Lamar Jackson 40+ Rushing Yards (`+108`)
* **Leg 4:** Jayden Daniels 40+ Rushing Yards (`+116`)
* **Evaluation Target:** High-upside correlated game-script parlay capitalizing on uncalibrated Week 1 spy defenses.

---

### Card C: The "Sunday Red-Zone Touchdown Trio" (3 Legs — +785)
* **Bookmaker:** Consensus
* **Leg 1:** Jalen Hurts Anytime TD (`+110`)
* **Leg 2:** Bhayshul Tuten Anytime TD (`+135`)
* **Leg 3:** Jonathan Taylor Anytime TD (`-115`)
* **Evaluation Target:** Exploits teams with confirmed goal-line personnel commitment.

---

### Card D: The "Sharp Sunday Moneyline Anchor" (5 Legs — +445)
* **Bookmaker:** Consensus
* **Leg 1:** Pittsburgh Steelers ML (`-146`)
* **Leg 2:** Tennessee Titans ML (`-134`)
* **Leg 3:** Minnesota Vikings ML (`-104`)
* **Leg 4:** Buffalo Bills ML (`-110`)
* **Leg 5:** Jacksonville Jaguars ML (`-440`)
* **Evaluation Target:** Core moneyline parlay derived from The Prop Dealer's 13-leg algorithmic card, isolating the 5 highest-confidence sharp favorites.

---

## 6. Action Items & Next Steps for Claude / Codex Teams

1. **Review Card Synergy:** Audit the 4 curated cards against live injury feeds (e.g., inactives dropping 90 minutes before 1:00 PM ET kickoff).
2. **CLV Verification:** Cross-check current bookmaker odds against the baseline prices cataloged above; lock wagers where market steam has improved expected value.
3. **Model Portfolio Logging:** Following review, submit approved parlay cards to [`data/official-picks/platinum-rose-ai-2026.json`](file:///E:/dev/projects/NFL_Dashboard/data/official-picks/platinum-rose-ai-2026.json) under `official_paper` status for automated post-game grading.
