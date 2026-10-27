# Antigravity request: Twitter/X video picks, clear the queue + automate it (Fri 2026-10-23)

Paste everything in the code block as the first message to the Antigravity team.

```text
Platinum Rose, 2026 Week 7. Repo: E:\dev\projects\NFL_Dashboard. Deadline for Part 1: Sat 10/24 10:00 AM PT. Part 2 (automation) can land after the weekend.

BACKGROUND
The Twitter bookmarks agent (agents/twitter-bookmarks-agent.js -> queueTweetVideos) appends every bookmarked video to data/research-intel/twitter-video-queue.json (status pending/skipped/done; author, tweet_url, tweet_id, tweet_created_at, duration_ms, context, video url/poster). You processed 4 by hand on 9/19 (notes in data/vault-seed/manual/twitter-video-<tweet_id>.md). Since then: 61 pending, 20 skipped, 0 done. These are almost always ONE person talking, so NO diarization: the speaker is the account owner. Andy wants these picks in the Master Intel report's expert section every week, automatically.

GUARDRAILS
- No Supabase writes, no promotion, no git commits (the Claude team stages named files).
- Transcription: Groq whisper-large-v3 (free tier; scripts/transcribe_twitter_video.py already does yt-dlp + Groq). No Gemini AUDIO, no AssemblyAI, no OpenAI.
- Pick extraction from the transcript text: gemini-3.5-flash allowed, hard cap $1.00 for Part 1 and a configurable per-run cap (default $0.50) in Part 2. Log tokens and estimated cost per video. Andy caps Gemini at $25/month and is chasing a credit drain, so never loop or retry silently.
- Do NOT re-enable the Windows task NFL_Dashboard_Twitter_Bookmarks_Sync (Andy disabled it on 10/15). Part 2 adds an opt-in step; Andy decides when it runs.
- Never state a player's team from memory. Team comes from the speaker, the tweet text, or data/nfl-rosters/espn-full-rosters-latest.json.
- Ignore promo reads (deposit codes, "tail on Novig", app ads). They are not picks.

PART 1: clear the queue now
1. Order: Week 7 Sunday/Monday first (tweet_created_at on/after 2026-10-19, e.g. @HarryLockPicks 2113346013289472028 "All of these teams win in Week 7"), then the Week 7 TNF videos (NE@CHI is FINAL 30-24: extract for the record and tag game_final=true), then the September/early-October backlog (record only; tag the week from tweet_created_at).
2. Multi-video threads (e.g. @JoeOrrico 2113097101706244100..110744662164, four clips in one thread) = ONE opinion: transcribe each clip, merge into one thread transcript, extract picks once.
3. Speaker = the account. Map handle -> display name in a new file data/twitter/handle-expert-map.json ({handle, display_name, outlet_or_show, notes}). Fill it from the tweet profile / bio / how they introduce themselves (e.g. salbets_ -> Sal Vetri). If a handle is a show account with several hosts (e.g. RossTuckerPod, SharpFootball, PoolGenius), set speaker to the host who is speaking if they say their name, otherwise the show name, and set "multi_host": true.
4. Per pick: game (AWAY@HOME on the week's slate in data/generated/team-dossiers/w<NN>-slate.json), team, player, market (spread/total/moneyline/player_prop/anytime_touchdown/teaser/parlay_leg/straight_up), side, line, price, speaker, handle, source_timestamp (seconds into the video), rationale (their reasoning in 1-2 sentences, close to their words), quote (short verbatim), tweet_url, best_bet (true if they call it a best bet / lock / top play), confidence if stated.
5. Validation per pick: player on one of the two teams' rosters (ESPN file); game on that week's slate; line plausible for the market. Failures go to dropped[] with a reason, never silently.
6. Update each queue entry: status done/skipped, processed_at, picks_count, note_path, transcript_path, skip_reason (no speech, music only, non-NFL, duplicate clip, promo only). Write the note md like the 9/19 ones.

PART 2: automate it
Build scripts/process-twitter-video-queue.py:
- Args: --week N (or auto from tweet date), --max-videos, --max-cost-usd, --dry-run, --since YYYY-MM-DD.
- Steps: read the queue -> group by thread (same author + same conversation/thread or consecutive tweet_ids within one bookmark) -> yt-dlp audio -> Groq transcription (split audio over 24 MB / 10 min; back off on 429; resumable state in data/twitter/state/) -> extraction (gemini-3.5-flash, JSON schema, stops at the cost cap) -> validation (step 5) -> write outputs -> update queue.
- Outputs:
  - data/twitter/transcripts/<tweet_id>.txt (+ .json with segments)
  - data/twitter/twitter-video-picks-<season>-w<NN>.json, SAME pick schema as data/podcasts/youtube-extracted-picks-2026-w07.json plus handle/tweet_url/game_final, top-level status "pending_andy_review", dropped[], cost log, and source_pipeline "twitter_video" on every pick.
  - data/vault-seed/manual/twitter-video-<tweet_id>.md notes (same format as before).
- Hook: add an opt-in flag to scripts/twitter-bookmarks-cron.js (--process-videos, default OFF) that calls the processor after a bookmark sync, and add a "Process Twitter videos" button/step to the Toolbox Friday cadence (scripts/toolbox.mjs) that runs it with --dry-run first and shows the plan (videos, minutes, estimated cost) before running for real.
- Tests: a --selftest using one short cached clip (no network), and a unit test for thread grouping and the promo filter.
- Docs: a section in agents/dev or docs/ explaining the flow, the cost controls, and how Andy approves a week's file.

HANDOFF BACK TO THE CLAUDE TEAM
- The Claude team will merge approved picks into the Master Intel report (expert section + reports/intel/expert-narratives-<season>-w<NN>.md) and apply Andy's one-opinion rule (the same pick by the same person on Twitter and on a podcast counts once). So keep handle/display_name consistent with the names already used in youtube-extracted-picks and the expert registry (e.g. "Sal Vetri", "Cody Brown"); list any new names in your summary.

Finish with a summary of 10 lines or fewer: videos processed/skipped (with reasons), picks per account for Week 7 Sunday/Monday, Groq minutes and Gemini cost, new handle mappings, files written, and what Andy has to approve.
```

Notes for Andy:
- Week 7 is thin: of the 8 queue entries from this week, 7 are TNF (now final) and one (@HarryLockPicks) covers Sunday. Run the bookmarks sync (`node scripts/twitter-bookmarks-cron.js`) before handing this over if you've bookmarked Sunday videos since Thursday; the scheduled task is still disabled.
- When their Week 7 file comes back, the Claude team merges approved picks into the expert section and the expert narratives on Saturday's build.
