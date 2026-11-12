# Antigravity request: Week 10 Pass 1 podcast sweep (Tue 11/10 night / Wed 11/11 morning)

Paste the code block as the first message in a **fresh Antigravity session**. Written by Claude Team 2 on 2026-11-10 from the Week 9
Tuesday prompt plus the Pass 2 hard rules (`agents/dev/ANTIGRAVITY_W09_PASS2_PODCAST_SWEEP.md`), which stay in force.

```text
Platinum Rose, Week 10 (2026), Pass 1 podcast sweep (early lines + TNF). Repo: E:\dev\projects\NFL_Dashboard.
Today is Tue 11/10. Week 10 TNF is WAS @ NYG, Thu 11/12 at 5:15 PM PT. Byes: CHI, DEN, PHI, TB.
Deadline: Wed 11/11 at 12:00 PM PT, so Claude can build TNF proposals Wednesday afternoon.

READ FIRST
- agents/dev/ANTIGRAVITY_W09_PASS2_PODCAST_SWEEP.md  (the NEW HARD RULES section is binding again this week)
- reports/intel/w09-podcast-veracity-2026-11-04.md  (why those rules exist)
- reports/intel/antigravity-w09-pass2b-friday-podcast-sweep.md  (last week's output; copy its format)
- docs/antigravity/CANONICAL_EXTRACTION_PIPELINE.md
- data/expert-tracking/preferred-experts-2026.json

GUARDRAILS (unchanged)
- $0 spend: no Gemini API, no --run-gemini, no AssemblyAI, no OpenAI. Read captions/transcripts in-session with your own model.
- No Supabase writes, no promotion, no git commits. Claude stages files by explicit path.
- Team null for props (the digest fills it from the roster map). Extract each episode once; note audio and YouTube URLs if both exist.

HARD RULES (carried from W9 Pass 2; Pass 1 broke every one of these last week)
1. price: null unless a price is SPOKEN. Never fill -110.
2. units: record whenever spoken; "best bet" -> best_bet: true.
3. line: the number the SPEAKER says, not public/schedule.json. No number spoken -> line null + note.
4. speaker: a name only if the transcript names the speaker at that turn (self-intro, direct address, "Chad just said").
   Both hosts endorse -> "<show> (both hosts)". Otherwise "<show> (speaker not attributable)". Never claim on-screen identifiers.
5. Leans ("lean", "gravitating", "if you made me pick", survivor opinions) go in leans[], NOT extracted_picks.
6. quote: a verbatim substring of the captions; paraphrase goes in rationale.

WEEK 10 QB CHANGES (trade deadline was Tue 11/10). Flag any pick whose rationale assumes the old QB, because prices have moved:
- MIN: Kirk Cousins acquired from LV Tue; expected to start @GB if ready. Wentz was benched for Brosmer in W9 MNF; Kyler Murray DOUBTFUL (hamstring).
- LV: rookie Fernando Mendoza starts vs SEA (Cousins traded).
- BAL: Jacoby Brissett (acquired from ARI 11/04) expected to start MNF vs LAC, NOT Joe Fagnano. Lamar Jackson IR.
- ARI: rookie Carson Beck expected to start vs LAR; Gardner Minshew to IR (elbow).
- MIA: Kyle McCord starts @IND; Malik Willis to IR.
- Questionable: NYG J.J. McCarthy (hip; full practice Tue), KC Patrick Mahomes (elbow), SEA Drew Lock (oblique), LAC Justin Herbert (finger).
- Out for season: WAS Terry McLaurin. LAR Puka Nacua DOUBTFUL.
Episodes recorded BEFORE Tue 11/10 midday PT may predate the Cousins/Mendoza news: record published time and flag MIN@GB and SEA@LV picks from them.

STEP 1: discovery (free)
   On Windows: `npm run youtube:sweep:capped -- --lookback-days 3` (no --run-gemini), plus direct checks of each preferred expert's channel/feed.
   Tue/Wed posters: Action Network (early lines / look-ahead, Koerner, Anderson), BettingPros (Early Best Bets & Survivor: Erickson,
   Perrault, Fitzmaurice), Sharp or Square (Tue/Thu bets; NEVER Sunday episodes), Even Money / Ross Tucker (Week 10 PICKS),
   VSiN (Adam Burke), Warren Sharp, Sal Vetri, Lock & Cash, Cody Brown, Move the Sticks.
   List each episode: show, title, URL, published PT, duration, captions yes/no.
   Skip non-betting content and Week 9 recap shows unless they contain Week 10 picks, futures or survivor picks (flag, don't skip silently).

STEP 2: transcript + extract
   YouTube captions (manual first, then auto); none -> local Parakeet ASR (scratch/parakeet-*). Record transcript_source exactly:
   "youtube_manual_captions", "youtube_auto_captions" or "parakeet_local".
   Extract into data/shadow-harness/antigravity-staging/youtube-<videoId>.json (same schema as Week 9 Pass 2b, with "week": 10),
   .captions.txt alongside. Straight-up picks: market "pickem_pick". Futures/survivor: market as stated, game null.
   Every pick needs a source_timestamp in the transcript; no timestamp -> drop it and record why.
   Coverage >= 90% of runtime, else status "partial" with the gap recorded; last timestamp must be <= runtime.

STEP 3: verify before the digest
   python scripts/master-intel/verify_staging_quotes.py youtube-<id> [...]   -> zero "quote MISS" lines allowed.
   Spot-read 3 picks per episode at their timestamps and confirm side, line and speaker.

STEP 4: digest
   python scripts/master-intel/youtube_digest_from_staging.py --week 10
   (If data/podcasts/youtube-extracted-picks-2026-w10.json already exists, copy it to .bak-20261111-pre-pass1 first.)
   Don't hand-edit the output. If the script drops units, best_bet or leans[], or pulls in non-Week-10 staging files, report it and STOP.

STEP 5: line-move check
   For each side/total pick, compare the SPOKEN line to public/schedule.json (DK Tuesday open, 11/10 10:00 AM PT). Flag moves >= 1 point.
   Known moves by BetOnline 1:10 PM PT 11/10: SEA@LV LV +3.5 -> +6.5, total 43.5 -> 40.5; MIN@GB GB -5.5 -> -3.5, total 40.5 -> 42;
   MIA@IND IND -2.5 -> -3.5, total 40.5 -> 38; LAR@ARI total 40.5 -> 38.5; CAR@NO NO -1.5 -> pick'em.

OUTPUTS
- New staging JSONs (+ .captions.txt) for each Week 10 episode
- data/podcasts/youtube-extracted-picks-2026-w10.json (+ .bak if needed)
- reports/intel/antigravity-w10-tuesday-podcast-sweep.md: episode table (found / skipped + reason / extracted / partial),
  WAS@NYG picks and leans FIRST, then picks by game (units, best bets), leans by game, old-QB rationale flags, line-move flags,
  show-level/unattributed speakers, verifier output, $0 spend confirmation.
Finish with a summary of 10 lines or fewer: episodes found/extracted/skipped, TNF picks, QB-news flags, line-move flags, file paths.
Pass 2 (Thu night after TNF / Sat for Sunday-Monday games) is a separate request.
```

## After Antigravity reports back (Claude)
1. Veracity spot-check (5 picks against captions: quote, timestamp, speaker); roster-gate every named player; confirm $0 spend.
2. Re-run `reports/intel/w10-model/fair_lines_w10.py` (podcast dissent column) and `scripts/analysis/slate_prep_packet.py --week 10`.
3. TNF WAS @ NYG proposals into `reports/bets/2026-w10-card.md`; log with `ai_record.py add --week 10`.
4. Known issue: `scripts/master-intel/grade_podcast_picks.py --week 9` crashes on picks with line null (Pass 2 rule 3). Fix before grading W9 (treat as ungradable).
