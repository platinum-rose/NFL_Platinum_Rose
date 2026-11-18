# Antigravity request: Week 11 Pass 1 podcast sweep + article ingestion (Tue 11/17 night / Wed 11/18 morning)

Paste the code block as the first message in a **fresh Antigravity session**. Written by Claude on 2026-11-17 from the Week 10
Tuesday prompt (`agents/dev/ANTIGRAVITY_W10_TUESDAY_PODCAST_SWEEP.md`); the Pass 2 hard rules stay in force.

```text
Platinum Rose, Week 11 (2026), Pass 1: podcast sweep (early lines + TNF) and article ingestion. Repo: E:\dev\projects\NFL_Dashboard.
Today is Tue 11/17. Week 11 TNF is IND @ HOU, Thu 11/19 at 5:15 PM PT. Byes: ATL, CLE, GB, LAR, NE, SEA.
Deadline: Wed 11/18 at 12:00 PM PT, so Claude can build TNF proposals Wednesday afternoon.

READ FIRST
- agents/dev/ANTIGRAVITY_W09_PASS2_PODCAST_SWEEP.md  (its NEW HARD RULES section is binding)
- reports/intel/antigravity-w10-pass2b-friday-podcast-sweep.md  (last week's output; copy its format)
- docs/antigravity/CANONICAL_EXTRACTION_PIPELINE.md
- data/expert-tracking/preferred-experts-2026.json

GUARDRAILS
- $0 spend: no Gemini API, no --run-gemini, no AssemblyAI, no OpenAI. Read captions/transcripts in-session with your own model.
- No git commits. No promotion. Claude stages files by explicit path.
- Supabase: the ONLY write allowed is Part B step B1 (research-intel-ingest, approved by Andy for this run; it dedups).
  Nothing else writes to Supabase.
- Team null for props (the digest fills it from the roster map). Extract each episode once; note audio and YouTube URLs if both exist.

HARD RULES (carried from W9 Pass 2)
1. price: null unless a price is SPOKEN. Never fill -110.
2. units: record whenever spoken; "best bet" -> best_bet: true.
3. line: the number the SPEAKER says, not public/schedule.json. No number spoken -> line null + note.
4. speaker: a name only if the transcript names the speaker at that turn (self-intro, direct address, "Chad just said").
   Both hosts endorse -> "<show> (both hosts)". Otherwise "<show> (speaker not attributable)". Never claim on-screen identifiers.
5. Leans ("lean", "gravitating", "if you made me pick", survivor opinions) go in leans[], NOT extracted_picks.
6. quote: a verbatim substring of the captions; paraphrase goes in rationale.

QB / AVAILABILITY CHECK
Before extracting, read data/player-availability/latest.json and list every Week 11 team whose starting QB is OUT, doubtful,
questionable or changed since Week 10. Flag any pick whose rationale assumes a different QB, and record each episode's
published time (PT) so picks made before news broke can be flagged.

========== PART A: PODCAST SWEEP ==========
A1 discovery (free)
   On Windows: `npm run youtube:sweep:capped -- --lookback-days 4` (no --run-gemini; 4 days reaches back past the W10 Friday sweep),
   plus direct checks of each preferred expert's channel/feed.
   Tue/Wed posters: Action Network (early lines / look-ahead, Koerner, Anderson), BettingPros (Early Best Bets & Survivor: Erickson,
   Perrault, Fitzmaurice), Sharp or Square (Tue/Thu bets; NEVER Sunday episodes), Even Money / Ross Tucker (Week 11 PICKS),
   VSiN (Adam Burke), Warren Sharp, Sal Vetri, Lock & Cash, Cody Brown, Move the Sticks.
   List each episode: show, title, URL, published PT, duration, captions yes/no.
   Skip non-betting content and Week 10 recap shows unless they contain Week 11 picks, futures or survivor picks (flag, don't skip silently).

A2 transcript + extract
   YouTube captions (manual first, then auto); none -> local Parakeet ASR (scratch/parakeet-*). Record transcript_source exactly:
   "youtube_manual_captions", "youtube_auto_captions" or "parakeet_local".
   Extract into data/shadow-harness/antigravity-staging/youtube-<videoId>.json (same schema as Week 10 Pass 2b, with "week": 11),
   .captions.txt alongside. Straight-up picks: market "pickem_pick". Futures/survivor: market as stated, game null.
   Every pick needs a source_timestamp in the transcript; no timestamp -> drop it and record why.
   Coverage >= 90% of runtime, else status "partial" with the gap recorded; last timestamp must be <= runtime.
   Extract expert spreads/totals as usual: from Week 11 they are context only in synthesis (rule S6), but they are still graded.

A3 verify before the digest
   python scripts/master-intel/verify_staging_quotes.py youtube-<id> [...]   -> zero "quote MISS" lines allowed.
   Spot-read 3 picks per episode at their timestamps and confirm side, line and speaker.

A4 digest
   python scripts/master-intel/youtube_digest_from_staging.py --week 11
   (If data/podcasts/youtube-extracted-picks-2026-w11.json already exists, copy it to .bak-20261118-pre-pass1 first.)
   Don't hand-edit the output. If the script drops units, best_bet or leans[], or pulls in non-Week-11 staging files, report it and STOP.

A5 line-move check
   For each side/total pick, compare the SPOKEN line to public/schedule.json (DK Tuesday open). Flag moves >= 1 point.

========== PART B: ARTICLE INGESTION ==========
B1 ingest (live; the one approved Supabase write)
   node agents/research-intel-ingest.js
   Record: feeds polled, new articles, duplicates skipped, failures (Action Network feed has needed the curl path before; report 403s).
B2 rebuild the article review for the current week only (since Tue 00:00 PT)
   node scripts/build-article-intel-review.js --since 2026-11-17T08:00:00.000Z
B3 rebuild player-props intel (free: ESPN rosters + local files)
   node scripts/build-player-props-intel.js
B4 check: data/research-intel/review/article-intel-review-latest.json and player-props-intel-latest.json both have a
   generated_at from this run. List Week 11 analyst selections for IND @ HOU first, then counts by game and by source.
   Do not edit either file by hand.

OUTPUTS
- New staging JSONs (+ .captions.txt) for each Week 11 episode
- data/podcasts/youtube-extracted-picks-2026-w11.json (+ .bak if needed)
- Refreshed article-intel-review-latest.json and player-props-intel-latest.json
- reports/intel/antigravity-w11-tuesday-podcast-article-sweep.md: episode table (found / skipped + reason / extracted / partial),
  IND@HOU picks and leans FIRST, then picks by game (units, best bets), leans by game, QB flags, line-move flags,
  show-level/unattributed speakers, verifier output; article ingest counts and failures; $0 spend confirmation.
Finish with a summary of 12 lines or fewer: episodes found/extracted/skipped, TNF picks, QB flags, line-move flags,
articles ingested, file paths.
Pass 2 (Thu night after TNF / Sat for Sunday-Monday games) is a separate request.
```

## After Antigravity reports back (Claude)
1. Veracity spot-check (5 picks against captions: quote, timestamp, speaker); roster-gate every named player; confirm $0 spend.
2. Re-run the W11 fair lines (copy `reports/intel/w10-model/fair_lines_w10.py` to w11) and `scripts/analysis/slate_prep_packet.py --week 11`.
3. TNF IND @ HOU proposals into `reports/bets/2026-w11-card.md`, checked with `python scripts/cards/check_overlap.py --week 11 --date 2026-11-19 --candidates <file>` before anything is placed (rules S1, S5, P1, P2, P6).
