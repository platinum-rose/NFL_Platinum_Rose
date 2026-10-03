# Handoff: Week 4 Podcast Intelligence & YouTube Gemini Ingestion Status

**Date:** 2026-10-02 23:00 PT  
**From:** Antigravity  
**To:** Codex Team / Claude  
**Repository:** `E:\dev\projects\NFL_Dashboard` (`main`)  
**Context:** Week 4 NFL Slate Preparation & Synthesis  

---

## Executive Summary

The **NFL Week 4 Podcast Intelligence & Multimodal Video Ingestion** pass is complete. Following the resolution of Gemini API billing and the restoration of local Windows scheduled tasks, **17 Week 4 podcast/video episodes** (11 RSS queue episodes + 6 prioritized standalone YouTube videos) were extracted end-to-end via `agents/podcast-gemini-intel.js` (`gemini-3.5-flash`), audited, and promoted into the Obsidian vault and downstream research registries.

* **Total Videos Ingested:** 17
* **Total Picks Extracted:** **155 structured picks** with attributed experts, markets, and lines.
* **Total Context/Analysis Notes:** **96 deep film, scheme, and injury notes**.
* **Obsidian Vault Notes Created:** **39 host-specific Markdown dossiers** written to `E:\data\Obsidian\NFL\Podcasts\...`.
* **Database State:** 100% promoted in Supabase table `podcast_gemini_intel` (`promoted_at IS NOT NULL`).
* **Total Compute Spend:** **$0.5074** (consuming ~5.1M tokens; ~$24.49 remaining on the $25.00 top-up).

---

## 1. Full Ingestion Manifest (Week 4)

| # | Show | Title / Content | Experts Attributed | Picks | Notes |
|---|---|---|---|:---:|:---:|
| **1** | **BettingPros** | *Top 10 NFL Player Props Picks for Week 4* | Andrew Erickson, Chris Welsh | 3 | 2 |
| **2** | **SportsLine** | *NFL Week 4 PLAYER PROPS: Picks and Bets* | PropStarz, Dave Tuley, Mike Spector | 15 | 3 |
| **3** | **Even Money** | *Greg Cosell's 2026 NFL Week 4 PREVIEW: Part 2* | Greg Cosell | 0 | 9 |
| **4** | **Sharp or Square** | *Professional NFL Gamblers Hotline Week 4* | Chad Millman, Simon Hunter | 3 | 4 |
| **5** | **BettingPros** | *10 BEST BETS for NFL Week 4* | Andrew Erickson, Seth Woolcock | 3 | 4 |
| **6** | **FantasyPros** | *Week 4 start/sit questions* | Pat Fitzmaurice, Derek Brown | 6 | 10 |
| **7** | **Sharp Football** | *(39-13, 75%) NFL Week 4 Best Bets & Player Props* | Warren Sharp, Ryan McCrystal, Richard Janvrin, Joe Pisapia | 12 | 3 |
| **8** | **The Athletic** | *Week 4 Preview: Raiders Game of the Week* | Robert Mays, Derrik Klassen | 1 | 10 |
| **9** | **Action Network** | *NFL Betting Playground \| Week 4* | Brandon Anderson, Matt Perrault | 40 | 2 |
| **10** | **Action Network** | *NFL Touchdown Show \| Week 4* | Sean Koerner, Gilles Gallant, Grant Neiffer | 32 | 6 |
| **11** | **Sharp Football** | *NFL Week 4 Matchups: What You Need to Know* | Warren Sharp, Richard Janvrin | 0 | 13 |
| **12** | **Even Money** | *2026 NFL Week 4 Prop Bets & Parlays* | Steve Fezzik, Dr. David Chao | 8 | 4 |
| **13** | **The Athletic** | *What Trevor Lawrence's rise can teach us* | Robert Mays, Derrik Klassen | 0 | 9 |
| **14** | **Even Money** | *2026 NFL Week 4 Bets* | Ross Tucker, Steve Fezzik | 15 | 2 |
| **15** | **Sharp or Square** | *SHARP NFL Week 4 Bets - Patriots-Bills, Rams-Eagles* | Chad Millman, Simon Hunter | 4 | 5 |
| **16** | **The Favorites** | *A Vasectomy & Icky Picks \| NFL Week 4 Preview* | Kendra Middleton, Evan Abrams, John Hansen, Dr. David Chao | 5 | 5 |
| **17** | **Action Network** | *NFL Week 4 Betting Preview* | Stuckey, Evan Abrams, Doug Kezirian | 8 | 5 |

---

## 2. Downstream Registries & Dossiers Updated

The following downstream intelligence files have been regenerated and are ready for synthesis:

1. **Host Citation Index (`data/generated/host-citations-latest.json`):**
   * Contains **1,517 citations** mapped across all 32 NFL teams and 12 tracked podcast hosts.
2. **Expert Dossiers (`data/expert-dossiers/latest.json` & `docs/antigravity/expert-dossiers/`):**
   * Covers 13 primary expert profiles with cross-season records, consensus leans, and recent picks.
3. **Podcast Deep Dives (`docs/podcast-transcript-deep-dives/`):**
   * Rebuilt **57 episode dossiers** and the interactive HTML index at `docs/podcast-transcript-deep-dives/index.html`.
4. **Obsidian Vault Dossiers (`E:\data\Obsidian\NFL\Podcasts/`):**
   * **39 host notes** organized by Show and Host, formatted with Markdown tables for both picks and analysis notes.

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

## 4. Key Intel Highlights for Week 4 Card Construction

1. **Action Network Touchdown & Playground Board:**
   * Heavy volume of anytime TD signals from Sean Koerner & Gilles Gallant (32 TD props logged).
   * Brandon Anderson & Matt Perrault registered 40 spread, total, and teaser angles.
2. **High-Stakes Gambler Consensus (Hotline + Sharp or Square):**
   * Sharp syndicate positions flagged on **Denver +2.5** (Brass Balls pick vs. KC), **Arizona -2.5**, and **Rams +2.5** against Philadelphia.
3. **Medical & Injury Insights (Dr. David Chao):**
   * **Puka Nacua:** Core muscle issue; playing through it but lacking top-end explosiveness.
   * **Drake Maye:** Shoulder labrum managed in practice; monitored closely.
   * **Baltimore Ravens:** Centers 1 and 2 on IR; guard sliding to center poses severe protection risk vs. Bills pass rush.
   * **Baker Mayfield:** Dislocated thumb; out Week 4, likely avoiding IR for Week 5.
4. **Cosell Scheme & Film Assessment:**
   * Dennis Allen's defensive structure completely neutralized Philadelphia's early-down run schemes.
   * Eagles defense under Vic Fangio exhibiting severe communication breakdowns in the secondary.

---

## 5. System Health Status

* **Gemini Billing:** Operational with $25.00 top-up balance. Active email alert guardrail installed (`agents/lib/billing-alert.js`).
* **Windows Task Scheduler:** All 12 automated tasks registered in hidden mode on `LAPTOP-1P2J0006`.
* **Twitter / X Session:** Valid and active (tested HTTP 200).
