# Handoff: Week 5 Podcast Intelligence & YouTube Gemini Ingestion Status

**Date:** 2026-10-08 23:59 PT  
**From:** Antigravity  
**To:** Codex Team / Claude  
**Repository:** `E:\dev\projects\NFL_Dashboard` (`main`)  
**Context:** Week 5 NFL Slate Preparation & Synthesis  

---

## Executive Summary

The **NFL Week 5 Podcast Intelligence & Multimodal Video Ingestion** pass is complete. A total of **18 Week 5 podcast/video episodes** (11 RSS queue episodes + 7 prioritized standalone YouTube videos) were extracted end-to-end via `agents/podcast-gemini-intel.js` (`gemini-3.5-flash`), audited, and 100% promoted into Supabase, the Obsidian vault, and downstream research registries.

* **Total Videos Ingested & Promoted:** **18**
* **Total Picks Extracted:** **172 structured picks** (spreads, totals, moneylines, props, anytime TDs with expert attribution and market metadata).
* **Total Context/Analysis Notes:** **100 deep film, scheme, coaching urgency, and injury notes**.
* **Obsidian Vault Notes Created:** **39 host-specific Markdown dossiers** written to `E:\data\Obsidian\NFL\Podcasts\...`.
* **Database State:** 100% promoted in Supabase table `podcast_gemini_intel` (`promoted_at IS NOT NULL`).
* **Total Compute Spend:** **$0.4775** (~4.8M tokens consumed; live billing probe verified healthy at HTTP 200).

---

## 1. Full Ingestion Manifest (Week 5)

| # | Show | Title | Experts Attributed | Picks | Notes |
|---|---|---|---|:---:|:---:|
| **1** | **Action Network** | *Our Anytime Touchdown Picks for Week 5* | Sean Koerner, Gilles Gallant, Grant Neiffer | 33 | 2 |
| **2** | **BettingPros** | *NFL Week 5 Early Lines: Best Bets & Picks (Ep. 1087)* | Andrew Erickson, Ryan Wormeli | 28 | 4 |
| **3** | **Even Money** | *2026 NFL Week 5 Bets* | Ross Tucker, Steve Fezzik | 27 | 6 |
| **4** | **Action Network** | *NFL Week 5 Betting Preview (Every Game)* | Stuckey, Doug Kezirian, Evan Abrams | 14 | 10 |
| **5** | **The Favorites** | *Construction & Big Dog Picks \| Week 5 Preview* | Brandon Kravitz, Kendra Middleton, Emerson Lotzia | 12 | 2 |
| **6** | **Even Money** | *2026 NFL Week 5 Prop Bets & Parlays* | Steve Fezzik, Dr. David Chao | 9 | 4 |
| **7** | **Sharp or Square** | *NFL WEEK 5 Betting Preview (Midweek)* | Simon Hunter, Chad Millman | 9 | 4 |
| **8** | **BettingPros** | *10 BEST BETS for NFL Week 5 (Ep. 1092)* | Andrew Erickson, Seth Woolcock | 8 | 4 |
| **9** | **BettingPros** | *Early NFL BEST BETS & Survivor Picks (Ep. 1089)* | Pat Fitzmaurice, Matt Perrault | 8 | 4 |
| **10** | **BettingPros** | *Thursday Night Football Bets & Player Props* | Scott Bogman, Tera Roberts | 8 | 3 |
| **11** | **Sharp or Square** | *SHARP NFL Week 5 Bets (Bears-Packers, Niners-Seahawks)* | Chad Millman, Simon Hunter | 7 | 3 |
| **12** | **Sharp or Square** | *Professional NFL Gamblers Hotline Week 5* | Simon Hunter, Chad Millman | 6 | 6 |
| **13** | **FantasyPros** | *Start or Sit Lineup Advice: Experts Pick Week 5* | Pat Fitzmaurice, Jake Ciely, Ryan Wormeli | 3 | 10 |
| **14** | **Even Money** | *Greg Cosell's NFL Week 5 PREVIEW Part 1* | Greg Cosell, Ross Tucker | 0 | 14 |
| **15** | **The Athletic** | *Biggest Surprises of Season's First Month* | Robert Mays, Diante Lee | 0 | 10 |
| **16** | **Sharp Football** | *NFL Week 5 Preview: 49ers-Seahawks, Eagles-Jags* | Warren Sharp, Richard Janvrin | 0 | 7 |
| **17** | **Even Money** | *Greg Cosell's NFL Week 5 PREVIEW Part 2* | Greg Cosell, Ross Tucker | 0 | 7 |
| **18** | **SportsLine** | *NFL Picks: Bets for Every Week 5 Game!* | Consensus Panel | 0 | 0 |

---

## 2. Downstream Registries & Dossiers Updated

The following downstream files and registries have been refreshed:
1. **Host Citation Index (`data/generated/host-citations-latest.json`):**
   * Indexed across all 32 NFL teams and 12 tracked podcast hosts.
2. **Expert Dossiers (`data/expert-dossiers/latest.json` & `docs/antigravity/expert-dossiers/`):**
   * Profiles updated for all primary analysts (Simon Hunter, Steve Fezzik, Andrew Erickson, Sean Koerner, Chad Millman, etc.).
3. **Podcast Deep Dives (`docs/podcast-transcript-deep-dives/`):**
   * Index regenerated at `docs/podcast-transcript-deep-dives/index.html`.
4. **Obsidian Vault Dossiers (`E:\data\Obsidian\NFL\Podcasts/`):**
   * **39 host-specific Markdown notes** populated with structured tables for picks and analysis context.

---

## 3. How Codex / Committee Agents Should Access This Intel

* **Via Supabase SQL:**
  ```sql
  SELECT episode_id, model, picks, analysis_notes, created_at, vault_paths
  FROM podcast_gemini_intel
  WHERE promoted_at IS NOT NULL
  ORDER BY created_at DESC;
  ```
* **Via Agent Tools:**
  * Use `get_youtube_futures_intel` from `src/lib/agentTools.js` to inspect promoted rows.
* **Via Local Files:**
  * Master citations: `data/generated/host-citations-latest.json`
  * Expert dossiers: `data/expert-dossiers/latest.json`
  * Obsidian vault notes: `E:\data\Obsidian\NFL\Podcasts/<Show>/<Host>/<date>-<slug>-gemini-intel.md`

---

## 4. Key Intel Highlights for Week 5 Card Construction

1. **Sharp Syndicate Positions (Gamblers Hotline & Sharp or Square):**
   * **Houston Texans -6.5:** High-conviction "burn the ships" spot with head coach DeMeco Ryans personally taking over defensive play-calling duties.
   * **Chicago Bears +3:** Syndicate resistance against giving the hook vs. Green Bay; sharp line protection.
   * **Miami Dolphins -6.5 & Atlanta Falcons -3.5:** Strong professional group buy-in confirmed on both sides.
2. **Anytime Touchdown Matrix (Koerner / Gallant / Neiffer):**
   * 33 anytime TD angles logged. Key note: **Darius Cooper** stepping into DeVonta Smith's primary Z receiver alignment with expanded red zone target share.
3. **Cosell Scheme & Film Assessment:**
   * Detailed breakdown of rookie QB Cam Ward's off-platform velocity and release under duress.
   * Dominant second-level linebacker play from Ar'Vell Reese creating coverage mismatches.
4. **Coaching Urgency & Scheme Health:**
   * Nick Sirianni hot-seat urgency escalating; Philadelphia pass rate over expectation down to -3.2% alongside severe offensive efficiency drops when offensive tackles are absent.
