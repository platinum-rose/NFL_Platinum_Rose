# Week 7 YouTube Speaker Diarization & Expert Pick Attribution Evaluation

**Date:** 2026-10-23  
**Evaluator:** Antigravity Team  
**Repo:** `E:\dev\projects\NFL_Dashboard`  
**Pipeline:** Gemini 3.5 Flash YouTube Video Understanding (`scripts/run_gemini_youtube_shadow.py`)  
**Gemini Spend for Run:** **$0.16177** (Spend cap: $2.00; 8.1% of budget used)  

---

## 1. Episode to YouTube Video Mapping

### Section A: New Coverage (Pick Extraction)
| # | Show | RSS Title | Published | Audio Length | YouTube Status | Video ID | Video Title | YouTube Runtime | Coverage Status |
|---|---|---|---|---|---|---|---|---|---|
| **A1** | Sharp or Square | SHARP NFL Week 7 Bets: 49ers-Falcons, Bucs-Panthers and more | 10/22 | 80 min (4826.9s) | Found | `b9FjoVzHbY0` | SHARP NFL Week 7 Bets: 49ers-Falcons, Bucs-Panthers, Rams-Raiders, Packers-Lions, Chiefs-Seahawks | 68.6 min (4115.0s) | Partial (60.1% coverage, 1640s gap) |
| **A2** | Move the Sticks | Week 7 Picks + Confidence Rankings | NFL Pro | 10/21 | 40 min (2416.9s) | **No YouTube version** | N/A | Digital/Omny podcast audio & NFL.com video only; no YouTube upload | Dropped (guardrail blocks audio ingest) |
| **A3** | Sharp or Square | NFL WEEK 7 BETS: Patriots-Bears, Chiefs-Seahawks and more | 10/20 | 76 min (4530.5s) | Found | `ADtEIWuSegQ` | NFL WEEK 7 BETS: Patriots-Bears, Chiefs-Seahawks, Cowboys-Eagles, Bengals-Ravens, Packers-Lions | 73.8 min (4430.9s) | Complete (100.9% coverage, 47 segments) |

*Note on A3:* All Thursday Night Football picks (`NE@CHI`) were excluded from the addendum as the game has already concluded.

---

### Section B: Validation Episodes (Ground-Truth Scored)
| # | Show | RSS Title | Published | Audio Length | Video ID | Video Title | YouTube Runtime | Ground Truth Source | Timeline Offset (Video - Audio) |
|---|---|---|---|---|---|---|---|---|---|
| **B1** | Action Network Sports Betting | NFL Week 7 Betting Preview | 10/21 | 79.2 min (4754.0s) | `wGShfSLzcrk` | NFL Week 7 Picks & Predictions: EVERY Game Against the Spread! | 71.0 min (4262.4s) | Hand-labeled clip 01:07:20-01:17:20 + full voiceprint | -395.72s |
| **B2** | Even Money | 2026 NFL Week 7 Bets | 10/20 | 28.3 min (1700.4s) | `f9sJImNONrQ` | 2026 NFL Week 7 BETS! | 27.1 min (1626.3s) | Hand-labeled clip 00:18:00-00:28:00 | -59.60s |
| **B3** | BettingPros Podcast | Early NFL BEST BETS & Survivor Pool Picks: Week 7 Predictions (Ep. 1106) | 10/20 | 24.7 min (1484.6s) | `Bxi6PLPlETY` | Early NFL BEST BETS & Survivor Pool Picks: Week 7 Predictions (2026) | 23.1 min (1383.6s) | Hand-labeled clip 00:11:00-00:21:00 | -3.92s |
| **B4** | BettingPros Podcast | NFL Week 7 Best Bets & Expert Picks: 5 Must-Bet Games, Longshot TDs & Parlays! (Ep. 1110) | 10/22 | 42.0 min (2520.8s) | `94GM8BqFh8k` | 10 BEST BETS for NFL Week 7: Top Picks & Predictions to Make NOW (2026) | 37.6 min (2253.9s) | Full voiceprint transcript | -36.00s |

---

### Section C: Audit of 8 Videos in `data/podcasts/youtube-extracted-picks-2026-w07.json`
To prevent double-counting across audio pipelines and YouTube channels (Andy's rule), the 8 unidentified videos from Week 7 are mapped below:

| Video ID | Channel Name | Video Title | Published Date | Duration | Matched RSS Episode / Role | Deduplication Action |
|---|---|---|---|---|---|---|
| `CXj3CQYc3fo` | The Action Network: Sports Betting Picks & Tips | NFL Week 7 Best Bets: Player Props, SGPs & Longshots \| Brandon's Playground | 2026-10-23 | 58.7 min (3520s) | Brandon's Playground (props/SGPs) | Independent show; merge props card |
| `f9sJImNONrQ` | Ross Tucker | 2026 NFL Week 7 BETS! | 2026-10-20 | 27.1 min (1626s) | **B2** (Even Money Tuesday show) | **Duplicate of B2 audio**; merge as ONE opinion |
| `_jcpmCxff84` | Ross Tucker | 2026 NFL Week 7 PROP BETS & PARLAYS | 2026-10-22 | 26.1 min (1566s) | Even Money Thursday props show | Independent Thursday props show |
| `ADtEIWuSegQ` | Sharp or Square | NFL WEEK 7 BETS: Patriots-Bears, Chiefs-Seahawks, Cowboys-Eagles, Bengals-Ravens, Packers-Lions | 2026-10-20 | 73.8 min (4430s) | **A3** (Sharp or Square Tuesday show) | **Duplicate of A3 audio**; merge as ONE opinion |
| `b9FjoVzHbY0` | Sharp or Square | SHARP NFL Week 7 Bets: 49ers-Falcons, Bucs-Panthers, Rams-Raiders, Packers-Lions, Chiefs-Seahawks | 2026-10-22 | 68.6 min (4115s) | **A1** (Sharp or Square Thursday show) | **Duplicate of A1 audio**; merge as ONE opinion |
| `Bxi6PLPlETY` | BettingPros | Early NFL BEST BETS & Survivor Pool Picks: Week 7 Predictions (2026) | 2026-10-20 | 23.1 min (1383s) | **B3** (BettingPros Ep. 1106) | **Duplicate of B3 audio**; merge as ONE opinion |
| `94GM8BqFh8k` | BettingPros | 10 BEST BETS for NFL Week 7: Top Picks & Predictions to Make NOW (2026) | 2026-10-22 | 37.6 min (2253s) | **B4** (BettingPros Ep. 1110) | **Duplicate of B4 audio**; merge as ONE opinion |
| `Vgz-uaivQQ8` | The Action Network: Sports Betting Picks & Tips | NFL Week 7 FULL Betting Preview & Picks For Every Game \| The Favorites | 2026-10-22 | 57.1 min (3426s) | The Favorites Thursday preview show | Independent show (The Favorites); merge card |

---

## 2. Validation Scoring (B Episodes)

### Turn-Level Diarization Accuracy (Reference Clips)
For each hand-labeled turn in the 10-minute gold standard clips, the turn midpoint was shifted by the timeline offset and scored against the covering Gemini speaker segment:

| Episode | Show | Turns Scored | % Correct Name | % Unknown | % Wrong Name | Primary Confusion Pairs |
|---|---|---|---|---|---|---|
| **B1** | Action Network | 34 | **44.1%** (15) | 0.0% (0) | **55.9%** (19) | Stucky -> Doug Kezirian (9)<br>Doug Kazarian -> Stuckey (7)<br>Evan Abrams -> Doug Kezirian (2)<br>Production Voice -> Doug Kezirian (1) |
| **B2** | Even Money | 64 | **68.8%** (44) | 0.0% (0) | **31.2%** (20) | Steve Fezzik -> Ross Tucker (20)<br>Ross Tucker -> Steve Fezzik (0) |
| **B3** | BettingPros | 49 | **57.1%** (28) | 0.0% (0) | **42.9%** (21) | Pat Fitzmaurice -> Matt Perrault (15)<br>Matt Perrault -> Pat Fitzmaurice (6) |

---

### Pick-Level Diarization Accuracy (Voiceprint Transcripts)
Evaluated against full voiceprint transcripts (`*.named.txt`) at the exact timestamp of each extracted pick:

| Episode | Total Picks | Correct Speaker | Wrong Speaker | Accuracy | Key Notes & Observations |
|---|---|---|---|---|---|
| **B1** (Action Network) | 9 | 4 | 5 | **44.4%** | Doug Kezirian and Stuckey exchange rapid banters when discussing games. In 5 cases, Gemini assigned the pick to the host framing the matchup rather than the analyst giving the bet. |
| **B4** (BettingPros) | 9 | 5* (0**) | 4 | **55.6%*** | *The local voiceprint pipeline had NO profiles for Seth Woolcock or Andrew Erickson, labeling them `unknown_01` (Erickson) and `unknown_02` (Woolcock). Gemini video understanding correctly named both hosts from on-screen graphics. Against the resolved ground truth, 5/9 picks matched. |

---

## 3. Gemini Spend & Token Consumption

| Episode | Video ID | Mode | Latency | Input Tokens | Output Tokens | Cost (USD) |
|---|---|---|---|---|---|---|
| B2 (Even Money) | `f9sJImNONrQ` | Video URL | 38.1s | 150,333 | 4,442 | $0.01681 |
| B3 (BettingPros) | `Bxi6PLPlETY` | Video URL | 30.5s | 128,307 | 2,660 | $0.01389 |
| B4 (BettingPros) | `94GM8BqFh8k` | Video URL | 44.8s | 204,491 | 4,321 | $0.02218 |
| B1 (Action Network) | `wGShfSLzcrk` | Video URL | 54.2s | 378,822 | 7,160 | $0.04074 |
| A1 (Sharp or Square) | `b9FjoVzHbY0` | Video URL | 61.3s | 365,110 | 7,025 | $0.03932 |
| A3 (Sharp or Square) | `ADtEIWuSegQ` | Video URL | 61.1s | 393,205 | 8,498 | $0.04272 |
| **Total** | | | | **1,620,268** | **34,106** | **$0.16177** |

---

## 4. Verdict & Architectural Recommendation

### Question A: Can YouTube speaker attribution be trusted for shows with on-screen name bars?
**VERDICT: NO for fine-grained diarization; YES for speaker roster discovery.**
- **The Good:** Gemini video understanding reliably identifies who is appearing on the show. In B4, where our local audio pipeline completely failed to name Seth Woolcock and Andrew Erickson (`unknown_01`, `unknown_02`), Gemini recognized both hosts immediately from on-screen lower-thirds and intros.
- **The Fatal Flaw (Coarse Chunking):** Gemini outputs 15 to 45 coarse segments across a 30-75 minute video (averaging 45 to 120 seconds per segment). In sports betting shows with fast conversational debate and interruptions, coarse segmentation collapses multiple back-and-forth speaker turns into a single speaker block. This resulted in an error rate between **42.9% and 55.9%** on turn attribution and over **44% to 55%** on pick attribution.

### Question B: Can YouTube speaker attribution be trusted for audio-only uploads with a static image?
**VERDICT: DEFINITELY NO (Severe Dominant-Host Bias).**
- In shows with static branding or minimal camera switching (e.g. Even Money), Gemini relies strictly on auditory cues without visual mouth movements.
- Host Ross Tucker frames each game and poses the betting questions (~70% of talk time), while Steve Fezzik gives the 2-unit play in a quick 10-second response. Gemini credited the entire discussion block to Ross Tucker in 20 out of 20 disagreement turns (**100% of Fezzik's turns in that window were swallowed by Ross Tucker**).

### Recommended Pipeline Strategy
1. **Retain the Local Audio Diarization Pipeline (Voiceprints + Pyannote/Parakeet):**  
   Local acoustic diarization operating at 100ms frame resolution is mandatory for separating speaker boundaries and assigning bets to the proper expert.
2. **Shows That MUST Keep Local Voiceprints:**
   - **Action Network Sports Betting:** Keep voiceprints for `Stucky`, `Doug Kazarian`, and `Evan Abrams`.
   - **Even Money:** Keep voiceprints for `Ross Tucker` and `Steve Fezzik`.
   - **Sharp or Square:** Keep voiceprints for `Chad Millman` and `Simon Hunter`.
3. **Use YouTube Video Understanding as a Cold-Start Voiceprint Enroller:**  
   When a show features un-enrolled hosts (such as `BettingPros` Ep. 1110 with Woolcock & Erickson), use Gemini video understanding to identify the host names from on-screen graphics, extract a clean 15-second audio snippet at that timestamp, and auto-enroll the voiceprint into `voiceprints.npz`. Then let local audio diarization perform the actual turn-level separation.
