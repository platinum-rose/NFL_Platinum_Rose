# Antigravity request: Week 8 Saturday podcast sweep, in-session extraction (Sat 2026-10-31)

Paste everything in the code block as the first message to the Antigravity team.

```text
Platinum Rose, Week 8 (2026), Saturday podcast sweep. Repo: E:\dev\projects\NFL_Dashboard.
Deadline: tonight 7:00 PM PT (feeds the Saturday re-synthesis). DST ends tonight: Sunday early kickoff is 10:00 AM PST.

GOAL
Find every Week 8 betting podcast/YouTube episode published since Fri 10/30 11:00 PM PT (last discovery sweep),
extract the expert picks IN-SESSION with your own model reading the captions/transcript (same zero-cost caption
pipeline you used for the 15 episodes in youtube-extracted-picks-2026-w08.json), and stage them for the Claude team.

GUARDRAILS
- Zero API spend: no Gemini API (prepay credits are depleted anyway; HTTP 402), no AssemblyAI, no OpenAI, no --run-gemini.
- No Supabase writes, no promotion, no git commits (Claude stages files by explicit path).
- Never guess a speaker: name only from on-screen name bars, self-introductions or direct address; else "unknown_<n>".
- Never state a player's team from memory; leave team null for props (the digest script fills it from the roster map).
- CAR@GB (Thursday) is final: skip its picks (the digest drops them with --final).
- One opinion per show/episode: if the same episode exists as audio and YouTube, extract once and note both URLs.

ALREADY DONE (do not redo): youtube-<id>.json in data/shadow-harness/antigravity-staging/ with status "extracted" for
-vn96xTfA7M B52fNE-Gm4k DGrfV1YjmvA IxMnLS4ZQnI KCgsLsa-a2w M58KQ9kZGBw NG-2BbFS3nU SBt7paSti4M Uk93_ggoK8M
W9MdDfo7bcQ WczLTmmqupM bTUlcxhVFx8 jc-ydIH0_Fw sLxmjAwnZZQ wroZyAXRZhc UMhqcdkFEMw 5dIACwzMnzg 0yJHJPrkrTM

STEPS
1. Discovery (free): on Windows run `npm run youtube:sweep:capped -- --lookback-days 2` (no --run-gemini). Also check each
   preferred expert's channel/feed directly (data/expert-tracking/preferred-experts-2026.json), especially Saturday posters:
   Action Network (Big Bets / Saturday best bets, Koerner, Anderson), BettingPros (Erickson, Perrault, Fitzmaurice),
   Sharp or Square, Even Money (Fezzik / Ross Tucker), VSiN (Adam Burke), Warren Sharp, Sal Vetri, Lock & Cash, Cody Brown,
   Ross Tucker, Move the Sticks (Jeremiah & Bucky Brooks). List each: show, title, URL, published PT, duration, captions yes/no.
2. Skip non-betting content (fantasy-only, college, politics) and anything already listed above. Thu/Fri episodes
   missing from discovery count too if they have Week 8 Sunday/Monday picks.
3. Transcript: YouTube captions (manual > auto). No captions -> local Parakeet ASR (scratch/parakeet-* setup, same as Week 7)
   on the downloaded audio. Record transcript_source exactly ("youtube_auto_captions", "youtube_manual_captions", "parakeet_local").
4. Extract in-session into data/shadow-harness/antigravity-staging/youtube-<videoId>.json, same schema as
   youtube-B52fNE-Gm4k.json (episode_id, status "extracted", transcript_source, show, channel, title, url, published_date,
   week 8, transcript_summary, coverage_check, speaker_segments, extracted_picks[team, player, market, side, line, price,
   week, speaker, source_timestamp, rationale], analysis_notes, quote_timestamps, uncertainty_flags, coverage_assessment).
   Keep .captions.txt next to it. Straight-up/pick'em picks: market "pickem_pick". Futures/survivor: market as stated, game null.
   Every pick needs a source_timestamp you can point to in the transcript; no timestamp = drop it with a reason.
5. Coverage: the transcript must cover >= 90% of runtime, else status "partial" with the gap. A betting episode with
   zero picks gets a flag, not silence.
6. Rebuild the digest: `python scripts/master-intel/youtube_digest_from_staging.py --week 8 --final CAR@GB`
   (writes data/podcasts/youtube-extracted-picks-2026-w08.json, status pending_andy_review). Copy the current file to
   youtube-extracted-picks-2026-w08.json.bak-20261031-pre-sat first. Do not edit the digest output by hand.
7. Do NOT touch reports/intel/expert-review-2026-w08.json; the Claude team reconciles it after your digest.

OUTPUTS
- New staging JSONs (+ .captions.txt) per episode.
- Rebuilt data/podcasts/youtube-extracted-picks-2026-w08.json (+ the .bak).
- reports/intel/antigravity-w08-saturday-podcast-sweep.md: episode table (found / skipped + reason / extracted / partial),
  picks per episode, every pick whose line moved >= 1 point vs when it was said (flag it), speaker-unknown picks, $0 spend confirmation.

Finish with a summary of 10 lines or fewer: episodes found/extracted/skipped, new picks by game, flags, file paths.
```
