Platinum Rose, Week 9 (2026): podcast sweep, Pass 1, Part B ONLY. Repo: E:\dev\projects\NFL_Dashboard. Today is Wed 11/04.
Part A (Week 8 grades) is DONE: reports/intel/w08-podcast-pick-grades.md/.json. Don't redo it.
Deadline: digest written by 12:00 PM PT today. TNF is JAX @ BAL, Thu 11/05, 5:15 PM PST. PIT and TEN are on bye.

READ FIRST
- docs/antigravity/CANONICAL_EXTRACTION_PIPELINE.md
- agents/dev/ANTIGRAVITY_W08_SATURDAY_PODCAST_SWEEP.md (schema and rules; copy them)
- reports/intel/w09-episode-discovery-2026-11-03.json (THE QUEUE: discovery is done, skip step 1 except a quick re-check)

GUARDRAILS (unchanged)
- Zero API spend: no Gemini API, no --run-gemini, no AssemblyAI, no OpenAI. Read captions in-session with your own model.
- No Supabase writes, no promotion, no git commits.
- Never guess a speaker: name one only from an on-screen name bar, a self-introduction or direct address; otherwise "unknown_<n>".
- Never state a player's team from memory: leave team null for props.
- Extract each episode once; if it also exists as audio or a short, note both URLs.
- BAL's QB is Joe Fagnano (Lamar on IR). PHI's QB is Tanner McKee (Hurts on IR). NYG's Jaxson Dart is on IR.
  Flag any pick whose rationale assumes Lamar, Hurts or Dart plays.
- Ross/Fezzik teasers: keep them, labeled (Wong) teaser legs.

QUEUE (extract in this order; JAX@BAL picks first in the report)
1. Sharp or Square  WbYwN5iWNGY  (Tue; JAX@BAL @0:06:00; Millman + Hunter named in the description)
2. Ross Tucker / Fezzik "Week 9 BETS!"  kq21OfxY1Mk  (runtime 26:53; JAX@BAL @14:09; skip W8 recap 2:10-14:09)
3. BettingPros "Early NFL BEST BETS & Survivor Pool Picks: Week 9"  KjbSWUbYkeI  (survivor = market as stated, game null)
4. BettingPros "NFL Week 9 Early Picks & Line Movement"  OtB_TD5uMgE  (+ short KBxzssZwduM: likely a clip, so extract once)
Optional quick re-check: Ross Tucker "Week 9 PICKS" (expected Wed); Action Network early-lines audio.
Skip: Sharp or Square KuDM9dpepC8 and qR8k9BWi-VM (Sunday-recorded: rule).

STEPS
a. Transcript: YouTube manual captions, then auto. With no captions, use local Parakeet (scratch/parakeet-*).
   Record transcript_source exactly: "youtube_manual_captions" | "youtube_auto_captions" | "parakeet_local".
   Keep <id>.captions.txt next to the staging JSON. Coverage must be >=90% of runtime, else status "partial" with the gap recorded.
   Last timestamp must be <= runtime.
b. Extract into data/shadow-harness/antigravity-staging/youtube-<videoId>.json, same schema as youtube-B52fNE-Gm4k.json, week 9.
   Straight-up picks use market "pickem_pick". Every pick needs a source_timestamp you can point to in the transcript; drop it otherwise and record why.
   Flag any betting episode with zero picks.
c. Digest: python scripts/master-intel/youtube_digest_from_staging.py --week 9
   (if data/podcasts/youtube-extracted-picks-2026-w09.json exists, copy it to .bak-20261104-pre-wed first). Don't hand-edit the output.
   If the script hard-codes Week 8 or needs a --final list, report that and STOP rather than patching it.
d. Line-move check: public/schedule.json is now CURRENT (DK snapshot 11/03 1 PM PT, refreshed by Claude). Flag moves >= 1 point
   between the stated line and the schedule. Known: JAX@BAL went 8.5/42.5 -> 9.5/41.5 -> BAL +10 / 40.5; CLE@NO is NO -1.5 / 42.5;
   NYG/PHI total 39.5; BUF/MIN total 45.5.

OUTPUTS
- staging JSONs (+ .captions.txt) per episode
- data/podcasts/youtube-extracted-picks-2026-w09.json (+ .bak if one was needed)
- reports/intel/antigravity-w09-tuesday-podcast-sweep.md: episode table (extracted / partial / skipped + reason), picks per episode,
  JAX@BAL picks first, line-move flags, Lamar/Hurts/Dart flags, speaker-unknown picks, $0 spend confirmation.
Finish with a summary of 10 lines or fewer.
