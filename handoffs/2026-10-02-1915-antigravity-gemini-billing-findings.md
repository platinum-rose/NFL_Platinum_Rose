# Gemini API Billing Exhaustion & Cost Investigation

**Date:** 2026-10-02 19:15 PT  
**Author:** Antigravity (Pair Programming Session)  
**Status:** Read-only Investigation & Strategic Recommendations Completed  
**Target File:** `handoffs/2026-10-02-1915-antigravity-gemini-billing-findings.md`

---

## Executive Summary (2-Minute Decision)

* **The Problem:** The Gemini API key used by the Platinum Rose pipeline depleted its prepaid credit balance and returns `402 Payment Required` (`RESOURCE_EXHAUSTED: Your prepayment credits are depleted`). Because OpenAI (`gpt-4o`) is simultaneously out of credits and `ANTHROPIC_API_KEY` is missing from GitHub repository secrets, the entire extraction chain failed on Oct 2 at 14:54 UTC, leaving 13 Week 4 podcast episodes stuck at `status = 'pending'`.
* **The Root Cause:** Between Sep 22 and Oct 1, Gemini was made the default native audio transcription & diarization provider for multi-host shows (transcribing 47 episodes / 36.3 hours of audio) in addition to text extractions and YouTube multimodal tests. This consumed the initial ~$5.00 prepaid credit pack.
* **The Key & Project:** Local `.env` and GitHub secret `GEMINI_API_KEY` share the identical key ending in **`vbGs`**, associated with GCP Project `platinum-rose-gmail` (Project Number `563752605285`).
* **Weekly Run-Rate Cost:** At full regular-season volume (25–30 episodes/week + YouTube sweep), Gemini audio diarization + extraction costs only **~$0.75 – $1.25 / week** (~$3.00 – $5.00 / month).
* **The Fix for Andy:**
  1. Go to [Google AI Studio Projects](https://ai.studio/projects) -> select `platinum-rose-gmail` (or the project owning key `...vbGs`).
  2. Top up **$25.00** in prepaid credits and enable **Auto-reload ($25 reload when balance drops below $5)** — this will fund the pipeline for the entire rest of the season and playoffs.
  3. Add the existing local `ANTHROPIC_API_KEY` to GitHub Repository Secrets so Claude Sonnet 4.5 acts as a working safety net.

---

## 1. Key & Project Identification

* **Local `.env` Key:** `GEMINI_API_KEY` length 39 characters, ends in **`vbGs`**.
* **GitHub Actions Secret:** The secret `GEMINI_API_KEY` was created/updated on `2026-09-19T08:00:10Z` (commit `b87ba33`). Both GitHub Actions run `37023091252` and local execution with key `...vbGs` trigger the identical error:
  ```json
  {
    "error": {
      "code": 402,
      "message": "Your prepayment credits are depleted. Please go to AI Studio at https://ai.studio/projects to manage your project and billing. Learn more at https://ai.google.dev/gemini-api/docs/billing#prepay.",
      "status": "RESOURCE_EXHAUSTED"
    }
  }
  ```
* **Associated Google Cloud / AI Studio Project:**
  * **Project Name / ID:** `platinum-rose-gmail`
  * **Project Number:** `563752605285`
  * *Verification:* Matches `config/youtube-oauth-client.json` (`client_id: 563752605285-...apps.googleusercontent.com`, `project_id: platinum-rose-gmail`).

---

## 2. Billing Model & Depletion Timeline

* **Billing Model:** **Google AI Studio Prepaid Billing** (not GCP postpaid billing and not the free tier).
  * In the free tier, requests hit `429 RESOURCE_EXHAUSTED: Quota exceeded`. A `402` error specifically indicates a project with prepayment billing enabled whose credit ledger reached `$0.00`.
* **Current Balance:** `$0.00` (Confirmed via live minimal probe against `gemini-3.6-flash:generateContent`).
* **When did it hit zero?**
  * The last successful Gemini operations ran on **2026-10-01** (Even Money at 14:11 UTC and Athletic Football Show at 07:00 UTC).
  * The first recorded failure occurred on **2026-10-02 at 14:54:42 UTC** during scheduled GitHub Actions workflow run `37023091252` (Episode `4726c7fc`, Sharp Football Analysis Week 4 Best Bets).
* **Auto-Reload & Spend Cap:**
  * The project does **not** have auto-reload configured, which is why it hard-stopped the moment credits ran out.
  * No postpaid fallback was enabled.

---

## 3. Where the Money Went (Last 30 Days Breakdown)

Between 2026-09-10 and 2026-10-01, a total of **101 podcast transcripts** utilized Gemini across text extraction and audio diarization.

### Historical Usage Pattern in Supabase (`podcast_transcripts`):
* **2026-09-10:** 12 episodes extracted via `gemini-3.8-flash` (transcribed via AssemblyAI).
* **2026-09-19:** 37 episodes bulk re-extracted via `gemini-3.6-flash` (commit `70c898b` full-transcript chunking pass).
* **2026-09-22 to 2026-10-01:** **47 multi-host episodes** processed with **Gemini Native Diarization** (`gemini-diarized` + `gemini-3.6-flash`).
  * Total audio ingested by Gemini: **2,179 minutes (36.3 hours)**.
  * Daily volume: 2 to 9 episodes/day (peak on Friday 9/25 with 9 episodes / 409 minutes).
* **YouTube Ingest / Shadow Harness:**
  * `podcast_gemini_intel`: 1 production row (`04f9e092-cf6b-46bc-beea-2e028ce82c2e`, Sharp or Square Week 3 preview) logged 426,166 input tokens and 3,081 output tokens for `$0.0438` using `gemini-3.5-flash`.
  * Local shadow tests on 11 bench episodes consumed ~$0.50 in testing.

### Caller Audit & Codebase Inspection

| File / Component | Model(s) Used | Operational State / Findings | Est. Spend (30d) |
| :--- | :--- | :--- | :---: |
| `agents/podcast-ingest.js` + `gemini-audio-transcribe.js` | `gemini-3.6-flash` | **Primary Driver:** 47 multi-host episodes transcribed (36.3 hrs audio) + 51 text extractions. | **~$3.60** |
| `agents/podcast-ingest.js` (9/19 re-extract) | `gemini-3.6-flash` | Bulk re-extract across 37 past transcripts (chunked 30k chars). | **~$0.15** |
| `agents/podcast-gemini-intel.js` + `run_gemini_youtube_shadow.py` | `gemini-3.5-flash` | YouTube video token processing (~15k tokens/min). 1 prod run + 11 bench runs. | **~$0.60** |
| `agents/lib/gemini-master-extractor.js` | `gemini-3.8-flash` | Used for deep report extractions in `scratch/`. | **~$0.20** |
| `scripts/parse_beo_screenshots.py` | `gemini-3.6-flash` | OCR on sportsbook odds graphics. | **~$0.05** |
| `agents/twitter-bookmarks-agent.js` | `gemini-3.6-flash` | Visual OCR on tweet graphics (infrequent). | **~$0.02** |
| `agents/tweet-ingest.js` | `gemini-2.0-flash` | ⚠️ **STALE MODEL:** Line 57 hardcodes shut-down `gemini-2.0-flash`. | $0.00 (dormant) |
| `agents/gmail-intake-agent.js` | `gemini-2.0-flash` | ⚠️ **STALE MODEL:** Lines 165 & 187 hardcode shut-down `gemini-2.0-flash`. | $0.00 (dormant) |
| `agents/screenshot-watcher.js` | `gemini-2.0-flash` | ⚠️ **STALE MODEL:** Lines 99 & 127 hardcode shut-down `gemini-2.0-flash`. | $0.00 (dormant) |
| `scripts/ingest_survivor_youtube.py` | `gemini-3.5-flash` | Survivor analysis script. | < $0.01 |
| **Total 30-Day Estimated Spend** | | | **~$4.62** |

*Note on Retries (Commit `53af810`):* `agents/lib/gemini-audio-transcribe.js` retries at most once (`GENERATION_ATTEMPTS = 2`) on socket/network drops (`TypeError: fetch failed`). It does **not** loop infinitely or retry on 402/HTTP errors.

---

## 4. Cost Per Unit & In-Season Projections

### Unit Costs (`gemini-3.6-flash` / `gemini-3.5-flash`)
* **Audio Podcast Ingestion (75-minute episode average):**
  * **Audio Transcription & Diarization:** 4,500 sec × 32 tokens/sec = 144,000 audio tokens ($0.10/M) = **$0.0144**
  * **Diarization Output:** ~13,000 output tokens ($0.40/M) = **$0.0052**
  * **Pick/Intel Text Extraction:** ~15,000 input tokens + 1,500 output tokens = **$0.0021**
  * **Total per episode (Transcribe + Diarize + Extract):** **~$0.022 (2.2 cents)**
* **YouTube Video Extraction (60–90 min video):**
  * Multimodal video frames + audio (~290 tokens/sec): 4,500 sec × 290 = ~1.3M tokens.
  * **Total per YouTube episode:** **~$0.14** (shorter 25–30 min shows are **~$0.044**).

### Projected In-Season Weekly & Monthly Budget

| Item | Weekly Volume | Cost per Unit | Weekly Total | Monthly Total |
| :--- | :---: | :---: | :---: | :---: |
| Single-host Podcasts (Groq Whisper + Gemini Extract) | 8–10 eps | $0.002 | $0.02 | $0.08 |
| Multi-host Podcasts (Gemini Diarized + Gemini Extract) | 18–20 eps | $0.022 | $0.42 | $1.75 |
| YouTube Multimodal Video Extraction (Key weekly shows) | 4–6 videos | ~$0.09 | $0.45 | $1.90 |
| Margin / Backfill buffer | — | — | $0.25 | $1.00 |
| **Projected Pipeline Total** | **~32 units/wk** | — | **~$1.14 / week** | **~$4.73 / month** |

---

## 5. Answers to Specific Questions

### A. Claude Fallback Confirmation
* **Confirmed:** In local `.env`, `ANTHROPIC_API_KEY` is present (`sk-ant-api...`, 108 characters). However, `gh secret list` reveals that `ANTHROPIC_API_KEY` **does not exist in GitHub Actions repository secrets**.
* When GitHub Actions ran `podcast-ingest.yml`, `process.env.ANTHROPIC_API_KEY` was empty. `agents/lib/extraction-providers.js` silently skipped Claude (`keyPresent: false`) and moved to `gpt-4o`, which also failed on zero credits.

### B. Network Issue in `logs/podcast-ingest.log`
* The log error `❌ Failed to load feeds: TypeError: fetch failed` at line 1498 and 1512 occurred when Node's `fetch()` timed out trying to reach Supabase REST (`https://aambmuzfcojxqvbzhngp.supabase.co/rest/v1/podcast_feeds`).
* This was a transient local network/DNS resolution blip. Supabase connectivity is currently healthy and verified.

### C. Four YouTube URLs Ready Tonight
* Supabase `podcast_episodes` rows `4726c7fc`, `929eeaf1`, `e54e9a7a`, and `9f05cece` have `youtube_url` populated and are pending. They can be immediately extracted with `agents/podcast-gemini-intel.js` once billing is refreshed.

---

## 6. Guardrail Gap & Pre-Flight Hardening

### Why did a depleted balance surface only as stuck episodes?
1. **False Positive API Check:** Calling `GET https://generativelanguage.googleapis.com/v1beta/models` returns `200 OK` even when a project's balance is `$0.00`. Any health check that only lists models will report green.
2. **Silent Failure in Scheduled Workflows:** When extraction fails with `ExtractionUnavailableError`, the agent marks the episode pending and exits 1, but triggers no external notification or dashboard alert.

### Proposed Solution:
1. **Active 1-Token Ping in Pre-Flight:**
   Add a tiny probe in `scripts/weekly-synthesis-preflight.mjs` and at the start of `agents/podcast-ingest.js`:
   ```javascript
   const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${k}`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }], generationConfig: { maxOutputTokens: 1 } })
   });
   if (res.status === 402) throw new Error('GEMINI BILLING FAILURE: Prepayment credits depleted');
   ```
   *Cost:* 1 token = $0.0000001 (negligible).
2. **GitHub Actions Secrets Sync:** Add `ANTHROPIC_API_KEY` to GitHub repository secrets immediately.

---

## 7. Strategic Options & Ranked Recommendation

### Options Analysis:
1. **Option 1: AI Studio Prepaid Top-Up with Auto-Reload (RECOMMENDED)**
   * Add $25.00 credits. Set auto-reload to $25 when balance drops below $5.
   * *Cost:* ~$5/month actual burn.
   * *Pros:* Fully contained in AI Studio; eliminates pipeline stalls; no risk of runaway credit card charges.
2. **Option 2: Switch to Postpaid GCP Billing with Budget Cap**
   * Link GCP billing account with a $15 monthly budget alert and spend cap.
   * *Cost:* ~$5/month actual burn.
   * *Pros:* Invoiced monthly, zero risk of prepay depletion.
3. **Option 3: Fallback Routing Only (Groq + Claude)**
   * Route single-host shows to Groq Whisper (free) and add Claude key to GitHub secrets.
   * *Cost:* Free transcription for single-host shows, Claude extraction costs ~$0.015/ep.
   * *Cons:* Multi-host shows still need Gemini for diarization (AssemblyAI is currently balance-blocked).

---

## Exact Steps for Andy in Google AI Studio / GCP

1. **Open AI Studio Projects:**
   * Navigate to: [https://ai.studio/projects](https://ai.studio/projects)
2. **Select Project:**
   * Open project **`platinum-rose-gmail`** (associated with Project Number `563752605285` and key ending in **`vbGs`**).
3. **Manage Billing & Credits:**
   * Go to **Settings** (gear icon) -> **Plan & Billing** (or [ai.google.dev/gemini-api/docs/billing#prepay](https://ai.google.dev/gemini-api/docs/billing#prepay)).
   * Click **Add Funds / Purchase Credits**.
   * Purchase **$25.00** in prepaid credits.
   * Enable **Auto-Reload**: set threshold to **$5.00** and reload amount to **$25.00**.
4. **Sync Anthropic Secret to GitHub (Safety Net):**
   * Run in terminal (or set via GitHub Web UI -> Settings -> Secrets and variables -> Actions):
     ```powershell
     gh secret set ANTHROPIC_API_KEY --body "<your-existing-local-anthropic-key>"
     ```
5. **Resume the Ingestion Pipeline:**
   * Once credits are active, run the Week 4 backlog ingest:
     ```powershell
     $env:MAX_PER_RUN="15"; node agents/podcast-ingest.js
     ```
