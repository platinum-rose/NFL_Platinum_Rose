# Platinum Rose: Antigravity Intel Collection — Batch 3 Report

**Run Timestamp:** 2026-10-15 22:15 PT  
**Target:** NFL Week 6 (Games scheduled for Sunday 2026-10-18)  
**Execution Constraints Enforced:** Zero paid API calls (no Gemini, OpenAI, Claude), no Supabase calls, no git commits/staging, no sportsbook logins, work strictly confined to `data/shadow-harness/antigravity-staging/`.

---

## 1. Part A: Prop Handles Channel Discovery Results

Saved directly to [`channel-discovery-2026-10-15.json`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/channel-discovery-2026-10-15.json).

| Handle | YouTube Channel Title | Channel URL | Channel ID | Verified By | Status | Cadence / Notes |
|---|---|---|---|---|---|---|
| **Joe Holka** | The Joe Holka Show | `https://www.youtube.com/@thejoeholkashow` | `UCkz9wOHIZR62kbQ1600htZQ` | Same name + avatar | `verified` | Daily/multiple uploads per week. Host of The Joe Holka Show, Touchdown Press newsletter. Covers player props & prediction markets. |
| **Sal Bets** | — | — | — | Not found | `unverified` | No dedicated standalone official YouTube channel found. Overlaps with Sal Vetri (`UC6oJruhkkXrws3HWqPfMHJw`, IG `@sal.bets`) and Cousin Sal (The Ringer), but independent Twitter capper has no verified official YouTube channel. |
| **Harry Lock** | — | — | — | Not found | `not_found` | `@HarryLockPicks` is active on X, Instagram (`@harrylockpicks`), and GameScript app; does not maintain an active official YouTube channel. |
| **Cody Brown** | — | — | — | Not found | `not_found` | FanDuel Research writer ("Mismatch Algorithm" prop series). Appearances hosted natively by FanDuel/FanDuel Research; no official personal standalone YouTube channel found (`@CodyBrownBets` is an unverified third-party account). |

---

## 2. Part B: Processed Videos Summary

| Episode ID | Channel | Title | Published Date | Status | Picks Count | Notes Count | Reached End | Transcript Source / Failure Reason |
|---|---|---|---|---|---|---|---|---|
| [`youtube-5AikVQLaJEg`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-5AikVQLaJEg.json) | The Action Network | NFL Week 6 Best Bets: Our Picks for EVERY Game! | 2026-10-14 | `extracted` | 13 | 5 | Yes (`4625s/4647s`) | `auto_captions` (Full transcript saved to [`youtube-5AikVQLaJEg.captions.txt`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-5AikVQLaJEg.captions.txt)) |
| [`youtube-YwW6cqRBOao`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-YwW6cqRBOao.json) | Ross Tucker | Greg Cosell: 2026 NFL Week 6 PREVIEW Part 1 | 2026-10-15 | `no_transcript` | 0 | 0 | No (`0s/1669s`) | YouTube `timedtext` returned HTTP 429 Too Many Requests (`IpBlocked`); transcript panel unavailable after cool-off retry. |
| [`youtube-LAcTapfzSH0`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-LAcTapfzSH0.json) | Ross Tucker | 2026 NFL Week 6 POWER RANKINGS & Bills - Rams REACTION | 2026-10-13 | `no_transcript` | 0 | 0 | No (`0s/1728s`) | YouTube `timedtext` returned HTTP 429 Too Many Requests (`IpBlocked`); transcript panel unavailable after cool-off retry. |
| [`youtube-BlFH_PEwxhc`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-BlFH_PEwxhc.json) | Sharp or Square | NFL WEEK 6 BETTING SPOTLIGHT: Seattle Seahawks-Denver Broncos, Houston Texans-Jacksonville Jaguars | 2026-10-14 | `no_transcript` | 0 | 0 | No (`0s/489s`) | YouTube `timedtext` returned HTTP 429 Too Many Requests (`IpBlocked`); transcript panel unavailable after cool-off retry. |
| [`youtube-M77HPuZkC5Q`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-M77HPuZkC5Q.json) | BettingPros | 10 BEST BETS for NFL Week 6: Top Picks & Predictions to Make NOW (2026) | 2026-10-15 | `no_transcript` | 0 | 0 | No (`0s/2176s`) | YouTube `timedtext` returned HTTP 429 Too Many Requests (`IpBlocked`); transcript panel unavailable after cool-off retry. |
| [`youtube-mzT6ReHpq2Q`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-mzT6ReHpq2Q.json) | The Action Network | NFL Week 6 Preview & Picks For EVERY Game! \| The Favorites Podcast | 2026-10-15 | `no_transcript` | 0 | 0 | No (`0s/4648s`) | Captions/transcripts disabled by creator on YouTube (`captionTracks` absent). |

---

## 3. Skipped Videos and Justifications

A total of 138 recent videos across all priority channels were scanned. The table below categorizes the skipped videos in accordance with the batch rules:

### A. Explicitly Handled in Prior Batches (Per Rule: Skip List)
| Video ID | Channel / Show | Reason |
|---|---|---|
| `EC4r_E6mc0E` | Even Money (Ross Tucker) | Handled in Batch 1 (23 picks extracted) |
| `Di8EC4Nu_XE` | Ross Tucker Football Podcast | Handled in Batch 1 (14 picks extracted) |
| `0XtOHyz2LRs` | Sharp or Square | Handled in Batch 1 (7 picks extracted) |
| `slfl5V7gaOY` | BettingPros | Handled in Batch 1 / Batch 2 (`no_transcript` 429) |
| `b_vEEqWIg2c` | BettingPros | Handled in Batch 1 / Batch 2 (`no_transcript` 429) |
| `06-42WRzKQI` | The Action Network | Handled in Batch 1 / Batch 2 (`no_transcript` 429) |
| `DgU_WrFcn-Q` | Priority List | Pre-specified skip ID (handled in batch 2) |
| `2vGRyoc6V2A` | Priority List | Pre-specified skip ID (handled in batch 2) |
| `36yrqXIiZ40` | Priority List | Pre-specified skip ID (handled in batch 2) |
| `Id4ZG8i0BuA` | Priority List | Pre-specified skip ID (handled in batch 2) |
| `3beH43dMxA` | Priority List | Pre-specified skip ID (handled in batch 2) |

### B. Thursday Night Football (SEA@DEN Already Played)
| Video ID | Channel | Title | Reason |
|---|---|---|---|
| `szXtHPTD3fI` | Joe Holka | long-term winner just bet $278,000 on one TNF play | TNF SEA@DEN game already played Thursday |
| `tLexfj6cm5o` | Joe Holka | Seahawks vs. Broncos Prediction: Best Bet for NFL Week 6 | TNF SEA@DEN game already played Thursday |
| `aflz1x0ayag` | The Action Network | Seahawks vs. Broncos Picks & Predictions: Thursday Night Football Best Bets | TNF SEA@DEN game already played Thursday |
| `cHHd13wvnDI` | BettingPros | Top NFL Picks for Seahawks vs. Broncos: Best Bets & Props for Thursday | TNF SEA@DEN game already played Thursday |
| `zuAINjMHJmQ` | Sharp or Square | Professional NFL Gamblers Hotline Week 6 - Calls on Seahawks vs. Broncos, Ohio State vs. Indiana | TNF SEA@DEN game & CFB only |

### C. Fantasy Football / Trade Advice (Per Prompt: "Not wanted: Fantasy Football Today")
| Channel | Video IDs Sample | Reason |
|---|---|---|
| **Sal Vetri** | `2zUMnfLh9EM`, `62pUH9Kr2_8`, `-cEzSbQ4diw`, `vnOLlU-tNk8`, `JTjbIu8puw4`, `SCkhn-vKEhk`, `KEjyTYVxEvA`, `lVwKlEjKswQ`, `p5vfTSSUqrg`, `OKYpPOguMtI` | Strictly fantasy football waiver wire, trade panic, rankings; zero sports betting lines or ATS picks |
| **The Action Network** | `DflRQvGJ1Ic`, `NnSrEoBfSYQ` | Week 6 Fantasy Football rankings and waiver wire priority; not betting content |

### D. Non-NFL Sports & College Football
| Channel | Video IDs Sample | Sport / Reason |
|---|---|---|
| **The Action Network** | `tu_QVzFM-9M`, `moega-a0piM` | College Football (CFB Week 7) |
| **The Action Network** | `xjbTadsUJ4Y` | NBA Futures Win Totals |
| **The Action Network** | `28d6KIvysLk` | NASCAR (Freeway Insurance 500) |
| **The Action Network** | `H5wfclLqvDA` | UFC Vegas 122 |
| **BettingPros** | `41pW-E4PDG8`, `RennwC4uR5I` | MLB Playoffs & NHL Predictions |
| **Ross Tucker** | `PabxshhnH-4` | College Football Week 7 Bets |
| **Evan Miyakawa** | `y5Bd8AU0tJc`, `uxG1qv14S4c`, `Jtk7YKD_KWc`, `7WgPm0LqY4w`, `Ne3jF1L3_Ls`, `4g_3SXyMe88`, `qSNLKCBjPsY`, `_z-_GHi4XQM`, `xJcSODLpSXk`, `PduVJ7qtnPE` | College Basketball (CBB) Preseason & Transfer Portal Analytics |

### E. Published Prior to Week 6 Window (< 2026-10-13) or Week 5 Content
| Channel | Video IDs Sample | Upload Date | Reason |
|---|---|---|---|
| **Warren Sharp** | `Bahxb0Z9IZ4`, `DlVpbB-tBa0`, `oL4NQ48EH10`, `hTxSDWcLYfo` | 2026-10-07 to 2026-10-10 | Week 5 content and officiating reviews; no Week 6 video uploaded yet |
| **Ross Tucker** | `TB-JAhobgbU`, `DTqwGdX1leg`, `qSJVE__F4Zk` | 2026-10-06 to 2026-10-12 | Week 5 reaction and prop bets |
| **Sharp or Square** | `UOxjB97Or4Q`, `nvaX5pS3i80`, `y_Lr5V1mSVY`, `Crn8sHMySQ8`, `zUZNHpEiIII` | 2026-10-05 to 2026-10-12 | Published before 2026-10-13 window |
| **BettingPros** | `_wZpv4TuNVI`, `5xDI4d8RROc`, `lfsOlzXkAw8`, `aIlB4gogUrg`, `o7IRIg-UN7M` | 2026-10-06 to 2026-10-12 | Week 5 MNF / early lookahead published before 2026-10-13 |
| **TheProsBestBets** | `uNoQZrHknDA`, `TsvYOZDD88k`, `isOOKAEY4Eo`, `lBOkihXwCZc`, etc. | Nov 2024 | Inactive channel (no recent 2026 uploads) |
| **Ed Feng** | `9aNlC2rrVWg`, `VM7UjouCYLg`, `MGtW5HQiZHg` | 2020-2021 | Inactive channel (no 2026 uploads) |

---

## 4. Technical Notes, Rate Limiting & Ambiguities

1. **Extraction Highlight (`youtube-5AikVQLaJEg`)**:
   - The Action Network's premier Week 6 episode (4,647 seconds / 1 hr 17 min) was completely processed and extracted.
   - 13 distinct picks were extracted with verbatim quotes, timestamps, signed lines, and speaker attribution (Stuckey, Doug Kezirian, Evan Abrams), including the Sunday Six-Pack contest selections (TB +2.5, LV +5.5, NO -1.5, LAR -12.5, SF -7.5, NYJ +7.5).
   - 10 representative speaker segments (15–60s) were captured, along with 5 key analysis notes (covering Carolina depth chart changes, Saints-Giants rushing matchups, and rest disadvantage situations).
2. **YouTube IP Rate-Limiting (`timedtext` HTTP 429)**:
   - YouTube strictly limits automated retrieval from the `timedtext` endpoint. While `5AikVQLaJEg` successfully fetched, subsequent requests across candidate videos (`YwW6cqRBOao`, `LAcTapfzSH0`, `BlFH_PEwxhc`, `M77HPuZkC5Q`) triggered HTTP 429 / `IpBlocked` errors even after wait intervals.
   - Consistent with Rule 1 & Step 1, these episodes have been recorded with `"status": "no_transcript"` and honest coverage metadata, without inventing lines or picks.
3. **Creator-Disabled Subtitles (`youtube-mzT6ReHpq2Q`)**:
   - The Favorites Podcast episode for Week 6 does not have English closed captions enabled by the publisher on YouTube (`captionTracks: false`).
4. **Sweep Schedule Recommendation**:
   - The Friday morning sweep (8:00–10:00 AM PT) is strongly recommended as creators release their final injury reaction shows (e.g., Eagles QB situation, Questionable tags for BAL, CHI, TB) and Warren Sharp's official Week 6 best bets video.
