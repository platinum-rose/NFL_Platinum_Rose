# Platinum Rose: Week 6 YouTube Intel Handoff for Claude Verification

**Date:** Friday, 2026-10-16 20:45 PT  
**Target:** NFL Week 6 (Sunday 2026-10-18 slate)  
**Author:** Antigravity Intel Collection Team  
**Recipient:** Claude Verification Team (`team2`)  
**Staging Location:** `data/shadow-harness/antigravity-staging/`  
**Execution Pipeline:** Antigravity Zero-Cost Browser/Caption Extraction (Playwright CDP, on-page transcript panel, zero paid APIs)  
**Total LLM API Cost for this extraction run:** **$0.00** (Zero Gemini, OpenAI, or Anthropic API tokens spent)

---

## 1. Executive Summary & Verification Readiness

Before running the Week 6 synthesis and betting decision models, the Antigravity team swept, transcribed, and extracted betting picks from priority YouTube video content.

- **73 Total Extracted Picks** across 6 core betting shows are ready in staging with complete diarization, signed lines, verbatim quotes, and source timestamps.
- **Full Transcripts Saved:** Corresponding `.captions.txt` files are co-located in staging for 100% line-by-line verification against the raw text.
- **Audio Fallback Required:** 1 episode (The PFF NFL Podcast) has **no YouTube version** and requires Gemini audio ingest. 7 other episodes encountered YouTube's network-level HTTP 429 rate limit on `timedtext` and are staged as `no_transcript` pending audio fallback or manual panel capture.

---

## 2. Successfully Extracted Episodes (Ready for Line-by-Line Audit)

| Staging File | Channel / Show | Title | Runtime | Picks | Notes | Diarization & Experts | Status & Coverage |
|---|---|---|---|---|---|---|---|
| [`youtube-5AikVQLaJEg.json`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-5AikVQLaJEg.json) | The Action Network | NFL Week 6 Best Bets: Our Picks for EVERY Game! | 77m (4647s) | **13** | 5 | **Stuckey, Doug Kezirian, Evan Abrams** (129 continuous 30-45s segments) | Full (`4625s/4647s`, 99.5%) |
| [`youtube-0XtOHyz2LRs.json`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-0XtOHyz2LRs.json) | Sharp or Square | NFL WEEK 6 BETS: Seahawks-Broncos, Bears-Falcons... | 69m (4164s) | **7** | 3 | **Chad Millman, Simon Hunter** (86 continuous segments) | Full (`4158s/4164s`, 99.8%) |
| [`youtube-EC4r_E6mc0E.json`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-EC4r_E6mc0E.json) | Ross Tucker (Even Money) | 2026 NFL Week 6 BETS! | 27m (1620s) | **23** | 4 | **Ross Tucker, Steve Fezzik** (40 continuous segments) | Full (`1616s/1620s`, 99.8%) |
| [`youtube-Di8EC4Nu_XE.json`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-Di8EC4Nu_XE.json) | Ross Tucker Football Pod | 2026 NFL Week 6 PICKS! | 28m (1697s) | **14** | 2 | **Ross Tucker** (Pick'em straight-up contest selections) | Full (`1690s/1697s`, 99.6%) |
| [`youtube-tGNDVneDeEQ.json`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-tGNDVneDeEQ.json) | Warren Sharp | Week 6 Best Bets & Player Props 2026 | 49m (2910s) | **4** | 7 | **Warren Sharp, Rich Hribar, Joe Gibbs, Ryan McCrystal** | Full (`2908s/2910s`, 99.9%) |
| [`youtube-C8cDtGmsRoc.json`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-C8cDtGmsRoc.json) | The Action Network | Week 6 Best Bets: Player Props, SGPs & Longshots | 53m (3157s) | **12** | 6 | **Brandon Anderson** | Full (`3150s/3157s`, 99.8%) |
| **Total** | | | | **73** | **27** | | |

---

## 3. Diarization & Expert Pick Attribution Breakdown

All extracted picks include the `speaker` field and diarized block associations so the synthesizer knows exactly who endorsed each position:

### A. The Action Network Six-Pack & Contest Card (`youtube-5AikVQLaJEg`)
- **Stuckey:**
  - `TB +2.5` vs PIT (Spread, `PIT@TB`, 4550s)
  - `LV +5.5` vs BUF (Spread, `BUF@LV`, 4553s)
  - `NO -1.5` at NYG (Spread, `NO@NYG`, 4558s)
  - `BAL@CLE Under 43.0` (Total, `BAL@CLE`, 2625s)
  - `ATL +510` (Market: `parlay_price_note`, `CHI@ATL`, 4448s)
  - `HOU Teaser Leg` (Teaser, 6 pts, `HOU@JAX`, 4489s — line null per instruction)
  - `DAL Teaser Leg` (Teaser, 6 pts, `DAL@GB`, 4532s — line null per instruction)
- **Doug Kezirian:**
  - `LAR -12.5` vs ARI (Spread, `ARI@LAR`, 4569s)
  - `SF -7.5` vs WAS (Spread, `WAS@SF`, 4571s)
  - `CAR` at PHI (Spread, `CAR@PHI`, 3418s — line null per instruction; notes Eagles are home dog)
  - `DAL@GB Over` (Total, `DAL@GB`, 3702s — line null per instruction; shoot-out game script)
- **Evan Abrams:**
  - `NYJ +7.5` at NE (Spread, `NYJ@NE`, 1797s — fade Drake Maye peak scoring output)
  - *Stuckey agreement:* joined Evan on NYJ +7.5 into the official Six-Pack card (1871s).

### B. Sharp or Square (`youtube-0XtOHyz2LRs`)
- **Simon Hunter (Pro Bettor):**
  - `CLE +4.5` vs BAL (Spread, `BAL@CLE`, 1106s — "Simon Says" official bet)
  - `CHI@ATL Under 44.0` (Total, `CHI@ATL`, 1735s)
  - `LAC +3.0` at KC (Spread, `LAC@KC`, 2335s)
  - `HOU +3.0` at JAX (Spread, `HOU@JAX`, 2901s)
- **Chad Millman:**
  - `LV +5.5` vs BUF (Spread, `BUF@LV`, 1289s — "Chad's Choice" official bet)
  - `DET -3.5` at MIN (Spread, `DET@MIN`, 3450s)
  - `TEN +4.0` at IND (Spread, `TEN@IND`, 3892s)

### C. Even Money (`youtube-EC4r_E6mc0E`)
- **Steve Fezzik & Ross Tucker Consensus & Individual Plays (23 Picks):**
  - Fezzik Best Bets: `TB +2.5` (2 Stars), `CLE +4.5` (2 Stars), `CAR +1.5` (1 Star), `NYJ +7.5` (1 Star).
  - Ross Tucker Plays: `LV +5.5` (2 Stars), `DEN +8.5` (Teaser leg), `NO -1.0` (1 Star).
  - Full card spans Sunday morning, afternoon, SNF (`DAL@GB Over 53.5`), and MNF (`SF -7.5`).

### D. Warren Sharp's NFL Best Bets (`youtube-tGNDVneDeEQ`)
- **Warren Sharp:** Best Bet: `Bijan Robinson Over 89.5 Rushing Yards` (`rushing_yards`, `CHI@ATL`, 2810s).
- **Rich Hribar:** 
  - `Blake Corum Over 9.5 Rushing Attempts` (`rushing_attempts`, `ARI@LAR`, 2315s)
  - `Trey McBride Longest Reception Under 21.5 Yards` (`longest_reception`, `ARI@LAR`, 2450s)
  - `Pat Freiermuth Over 3.5 Receptions` (`receptions`, `PIT@TB`, 2580s)
- **Joe Gibbs (Ref Angles):** Browns +5.0 (`BAL@CLE`, 1810s), DAL@GB Over lean (`DAL@GB`, 2120s).

### E. The Action Network Props & Longshots (`youtube-C8cDtGmsRoc`)
- **Brandon Anderson (12 Props & SGPs):**
  - Anytime TD & Yardage props for Week 6 matchups, formatted with exact prop names, ladder legs, and bookmaker odds.

---

## 4. Verification Instructions for Claude Team

When validating staging files against the Bookmaker board and raw captions:

1. **Quote Fidelity Check:**
   - Every pick must match verbatim text in the co-located `youtube-<id>.captions.txt`.
   - All quotes without an explicitly spoken numerical line have their `line` set to `null` with a corresponding entry in `uncertainty_flags`.
2. **Prop Market Standard Names:**
   - Check that all player props utilize exact standard names: `anytime_td`, `rushing_yards`, `rushing_attempts`, `receiving_yards`, `receptions`, `longest_reception`, etc.
   - For ladders, confirm that `alt_line: true` and `ladder_id: "<player>-<market>"` are populated.
3. **Game Notation:**
   - Ensure all picks use `game: "AWY@HOM"` (e.g. `CAR@PHI`, `DAL@GB`, `HOU@JAX`).
4. **Totals Formatting:**
   - Check that game total picks have `team: null` and `side: "OVER"` or `"UNDER"`.

---

## 5. Audio Fallback List for Week 6 Synthesis

The following episodes could not be transcribed from YouTube captions/panel due to either no video upload or network HTTP 429 rate limiting on YouTube's `timedtext` service. **Pass these to the Gemini audio ingest pipeline:**

| Episode / Podcast | Staging JSON | Reason | Fallback Action |
|---|---|---|---|
| **The PFF NFL Podcast** (*"Can Dallas FIX their defense..."*, 10/14, 89m) | None (no YouTube ID) | **No YouTube video exists.** Published as audio podcast only on Apple/Spotify. | **Priority 1 Gemini Audio Ingest** |
| **BettingPros Podcast Ep. 1097** (*Early Best Bets & Survivor*, 10/13, 24m) | [`youtube-slfl5V7gaOY.json`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-slfl5V7gaOY.json) | HTTP 429 rate limit on YouTube timedtext | Gemini Audio Ingest |
| **BettingPros Podcast Ep. 1096** (*Early Betting Picks*, 10/12, 47m) | [`youtube-_wZpv4TuNVI.json`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-_wZpv4TuNVI.json) | HTTP 429 rate limit on YouTube timedtext | Gemini Audio Ingest |
| **Even Money Prop Bets & Parlays** (Ross Tucker, 10/15, 26m) | [`youtube-36yrqXIiZ40.json`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-36yrqXIiZ40.json) | HTTP 429 rate limit on YouTube timedtext | Gemini Audio Ingest |
| **Warren Sharp NFL Week 6 Preview** (10/15, 52m) | [`youtube-2vGRyoc6V2A.json`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-2vGRyoc6V2A.json) | HTTP 429 rate limit on YouTube timedtext | Gemini Audio Ingest |
| **Action Network Touchdown Show** (10/15, 38m) | [`youtube-Id4ZG8i0BuA.json`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-Id4ZG8i0BuA.json) | HTTP 429 rate limit on YouTube timedtext | Gemini Audio Ingest |
| **Action Network Futures Watch** (10/13, 56m) | [`youtube-06-42WRzKQI.json`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-06-42WRzKQI.json) | HTTP 429 rate limit on YouTube timedtext | Gemini Audio Ingest |
| **BettingPros 10 Best Bets** (Ep. 1103, 10/15, 36m) | [`youtube-M77HPuZkC5Q.json`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-M77HPuZkC5Q.json) | HTTP 429 rate limit on YouTube timedtext | Gemini Audio Ingest |

---

## 6. Part A: Twitter Prop Handles Discovery Summary

Documented in [`channel-discovery-2026-10-15.json`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/channel-discovery-2026-10-15.json):
- **Joe Holka:** Verified channel `https://www.youtube.com/@thejoeholkashow` (ID: `UCkz9wOHIZR62kbQ1600htZQ`). Week 6 Sunday slate videos not yet uploaded as of Friday evening.
- **Sal Bets:** Unverified (No official standalone YouTube channel; distinguish from Sal Vetri and Cousin Sal).
- **Harry Lock:** Not found on YouTube (operates on X/IG `@HarryLockPicks` and GameScript).
- **Cody Brown:** Not found on YouTube (content hosted directly on FanDuel Research).
