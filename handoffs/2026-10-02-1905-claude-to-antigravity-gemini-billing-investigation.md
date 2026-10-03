# 2026-10-02 19:05 PT: Claude → Antigravity: investigate Gemini billing for podcast/YouTube transcription

Repo: `E:\dev\projects\NFL_Dashboard`, branch `main` (HEAD 47eb968 + uncommitted session files). Read `HANDOFF.md` first, then this file.

## Prompt

You are investigating why the Platinum Rose NFL podcast pipeline can no longer call Gemini, and what it costs to keep it running. This is a **read-only investigation plus a written recommendation**. Do not top up credits, change billing settings, rotate keys, edit `.env`, or change GitHub secrets. Andy makes those decisions from your report.

### What is broken
- 13 Week 4 podcast episodes are stuck at `status = 'pending'` in Supabase `podcast_episodes` (pub dates 9/30–10/2).
- The recorded error (episode `4726c7fc-5fd9-4513-8d9a-b822807d2ea0`, Sharp Football Week 4 Best Bets):
  `gemini-3.6-flash: 402 "Your prepayment credits are depleted. Please go to AI Studio at https://ai.studio/projects to manage your project and billing."` followed by `gpt-4o: "You have no credits remaining."`
- The extraction chain is `gemini-3.6-flash → claude-sonnet-4-5 → gpt-4o` (agents/podcast-ingest.js). Claude does not appear in the error, which suggests it was skipped (probably no `ANTHROPIC_API_KEY` locally; the GH secret is also not set). Confirm this.
- The latest Windows run of `NFL_Dashboard_Podcast_Ingestion_Sync` also logged `Failed to load feeds: TypeError: fetch failed` (`logs/podcast-ingest.log`). Determine whether that's a separate network issue.
- The new YouTube path (`agents/podcast-gemini-intel.js`, model `gemini-3.5-flash`) uses the same `GEMINI_API_KEY`, so it is blocked too. Four `podcast_episodes` rows got `youtube_url` set tonight and are ready for it once billing works.

### Questions to answer
1. **Which key and project.** Which Google AI Studio / GCP project does `GEMINI_API_KEY` in local `.env` belong to? Is the GitHub Actions secret `GEMINI_API_KEY` (`.github/workflows/podcast-ingest.yml`) the same key/project? Report the last 4 characters and the project name only, never the full key.
2. **Billing model.** Is that project on prepaid credits, postpaid billing, or the free tier? What is the current balance, and when did it hit zero? Is there a spend cap or budget alert configured? Did the project ever have auto-reload?
3. **Where the money went.** Break down Gemini spend for roughly the last 30 days by model and, if possible, by day. Map it to callers in this repo. Every Gemini caller:
   - `agents/podcast-ingest.js` + `agents/lib/gemini-audio-transcribe.js` (diarized-show transcription, default `gemini-3.6-flash`; env overrides `GEMINI_AUDIO_MODEL` / `GEMINI_EXTRACTION_MODEL`)
   - `agents/lib/gemini-master-extractor.js`
   - `agents/podcast-gemini-intel.js`, `scripts/run_gemini_youtube_shadow.py`, `scripts/run_gemini_live_shadow.py`, `scripts/youtube-podcast-sweep.js --run-gemini`
   - `agents/twitter-bookmarks-agent.js`, `agents/tweet-ingest.js`, `scripts/transcribe_twitter_video.py`
   - `agents/gmail-intake-agent.js`, `agents/screenshot-watcher.js`, `scripts/ingest-beo-screenshots.js`, `scripts/parse_beo_screenshots.py`
   - `scripts/ingest_survivor_youtube.py`, `scripts/test_youtube_multimodal_audio.py`

   Flag anything that re-processes the same media repeatedly, retries in a loop (the 9/22 retry fix, commit `53af810`), runs on a schedule more often than needed, or still references `gemini-2.0-flash` (shut down) or other stale model ids. Supabase tables `podcast_gemini_intel.cost_usd` / `input_tokens` / `output_tokens` hold per-run cost for the YouTube path. Use read-only SQL only.
4. **Cost per unit.** Estimate cost per audio transcription and per YouTube video extraction (an average 60–90 min episode), and the projected weekly cost at the current in-season volume (~25–30 episodes/week + the YouTube backlog).
5. **Options, with rough monthly cost each:**
   - Top up the prepaid credits, with a recommended amount and auto-reload threshold.
   - Move to postpaid billing with a budget cap and alerts.
   - Use a cheaper model for transcription vs. extraction.
   - Route single-host shows to Groq (free) and only diarized/YouTube work to Gemini.
   - Set `ANTHROPIC_API_KEY` so the Claude fallback actually works.
   - Change the scheduled-task frequency.
6. **Guardrail gap.** Why did a depleted balance surface only as stuck episodes? Propose a cheap pre-flight balance/402 check and an alert. For example, add Gemini to `feed_health`, or have `scripts/weekly-synthesis-preflight.mjs` report "LLM providers: billing failure".

### Constraints
- No credit purchases, billing edits, key rotation, `.env` / GitHub secret changes, or reruns of paid extraction. One minimal test call to confirm the 402 is still current is OK.
- No Supabase writes. No changes to `podcast_episodes` status.
- Preserve the dirty checkout. No `git add -A`, reset, clean or stash. If you commit your report, stage only that file.

### Deliverable
Write `handoffs/2026-10-0X-HHMM-antigravity-gemini-billing-findings.md` with:
- Answers to 1–6.
- A spend table (model × caller × est. $).
- A ranked recommendation with a weekly budget figure.
- The exact steps Andy needs to take in AI Studio / GCP.

Keep the summary at the top short enough that Andy can decide in two minutes.
