# Antigravity request: Week 7 podcast episodes on YouTube + speaker attribution test (Fri 2026-10-23)

Paste everything in the code block as the first message to the Antigravity team.

```text
Platinum Rose, Week 7 (2026). Repo: E:\dev\projects\NFL_Dashboard. Deadline: Sat 10/24 10:00 AM PT (picks feed Saturday's card; Sunday early kickoff is 6:30 AM PT, Paris).

GOAL
1) Find the YouTube version of each Week 7 podcast episode below.
2) Get the expert picks out of the ones we don't have yet, WITH speaker names.
3) Test whether your YouTube pipeline (Gemini video understanding: faces, on-screen name bars, people addressing each other) attributes speakers accurately enough to replace audio diarization for shows where we have no voiceprints.

GUARDRAILS
- No Supabase writes, no promotion, no git commits (the Claude team stages files by name).
- Gemini spend cap: $2.00 total for this request (last week's 10-video run cost about $0.27). Stop and report if you approach it. No Gemini AUDIO ingest, no AssemblyAI, no OpenAI.
- Never guess a speaker. If a name isn't shown on screen or said aloud, use "unknown_<n>" and say so.
- Never state a player's team from memory. Leave team null if the speaker doesn't say it.

EPISODES
A. Not yet covered (extract picks):
| # | Show | Title (RSS) | Published | Audio length |
|---|---|---|---|---|
| A1 | Sharp or Square | SHARP NFL Week 7 Bets: 49ers-Falcons, Bucs-Panthers and more | 10/22 | 80 min |
| A2 | Move the Sticks (NFL Pro) | Week 7 Picks + Confidence Rankings | NFL Pro | 10/21 | 40 min |
| A3 | Sharp or Square | NFL WEEK 7 BETS: Patriots-Bears, Chiefs-Seahawks and more | 10/20 | 76 min (NE@CHI is final, skip those picks) |

B. Validation (we already have speaker-labeled transcripts; use these to score your attribution):
| # | Show | Title | Published | Our ground truth |
|---|---|---|---|---|
| B1 | Action Network Sports Betting | NFL Week 7 Betting Preview | 10/21 | Hand-labeled clip 01:07:20-01:17:20 (Stuckey, Doug Kezirian, Evan Abrams) + full voiceprint-named transcript |
| B2 | Even Money | 2026 NFL Week 7 Bets | 10/20 | Hand-labeled clip 00:18:00-00:28:00 (Ross Tucker, Steve Fezzik) |
| B3 | BettingPros Podcast | Early NFL BEST BETS & Survivor Pool Picks: Week 7 Predictions (Ep. 1106) | 10/20 | Hand-labeled clip 00:11:00-00:21:00 (Matt Perrault, Pat Fitzmaurice) |
| B4 | BettingPros Podcast | NFL Week 7 Best Bets & Expert Picks: 5 Must-Bet Games, Longshot TDs & Parlays! (Ep. 1110) | 10/22 | Voiceprint-named full transcript |

Ground-truth files (read only):
- scratch/parakeet-w07-tue/clips/<episode_id>__<window>.reference.txt  (format "[mm:ss] Name: text", clip-relative)
  action-network-sports-betting__2026-10-21__46b83483__010720-011720
  even-money__2026-10-20__7b97079a__001800-002800
  bettingpros-podcast__2026-10-20__ab2e9473__001100-002100
- scratch/parakeet-w07-tue/parakeet-out/action-network-preview.v2.full.named.txt
- scratch/parakeet-w07-tue/parakeet-out/bettingpros-podcast__2026-10-22__89afe74e.v2.full.named.txt

C. Identify only (no re-extraction): the 8 videos in data/podcasts/youtube-extracted-picks-2026-w07.json have no titles. For each videoId (CXj3CQYc3fo, f9sJImNONrQ, _jcpmCxff84, ADtEIWuSegQ, b9FjoVzHbY0, Bxi6PLPlETY, 94GM8BqFh8k, Vgz-uaivQQ8) report channel, title, published date, duration, and which RSS episode above (if any) it is. We need this to merge audio-pipeline and YouTube picks as ONE opinion per show/episode (Andy's rule: no double counting).

STEPS
1. Search each show's YouTube channel for the episode (title + date). Confirm by duration (within ~5 min of the audio length; dynamic ads differ) and the first spoken line. If there is no YouTube upload, say "no YouTube version".
2. For A and B episodes: run scripts/run_gemini_youtube_shadow.py (gemini-3.5-flash) with speaker_segments + extracted_picks. Add to the prompt: name speakers only from on-screen name bars, self-introductions, or direct address; otherwise unknown_<n>.
3. Timeline alignment for B: YouTube and podcast audio timelines differ (ads). Find each reference clip's first sentence in the video transcript and report the offset in seconds.
4. Score B: for each reference turn, take its midpoint, shift by the offset, and check the speaker of the Gemini segment covering it. Report per episode: turns scored, % correct name, % unknown, % wrong name, and the confusion pairs. Also score B1 and B4 against the full voiceprint transcripts at the pick moments (each pick's speaker).
5. Coverage rule: speaker_segments must cover >= 90% of runtime, else mark the episode "partial" with the gap. Zero picks from a betting episode = flag it, don't continue silently.

OUTPUTS
- data/shadow-harness/antigravity-staging/youtube-<videoId>.json (+ .captions.txt if captions exist), same schema as youtube-tGNDVneDeEQ.json, plus speaker_segments.
- data/podcasts/youtube-extracted-picks-2026-w07-addendum.json: picks from A1-A3 only, same pick schema as youtube-extracted-picks-2026-w07.json (team, player, market, side, line, price, week, speaker, source_timestamp, rationale, episode, show, game), status "pending_andy_review", dropped[] with reasons. Straight-up and confidence-ranking picks from A2 go in with market "straight_up" and a "confidence" field (they feed Andy's pick'em and confidence pools).
- reports/intel/antigravity-w07-youtube-diarization-eval.md: the episode -> videoId table (A, B, C), the B scoring table, cost spent, and a verdict: can YouTube speaker attribution be trusted for (a) shows with on-screen name bars, (b) audio-only uploads with a static image? Recommend which shows should keep the local voiceprint pipeline.

Finish with a summary of 10 lines or fewer: videos found/missing, picks extracted per episode, attribution accuracy per B episode, spend, and file paths.
```

Notes for Andy:
- The Action Network preview (B1) was voiceprint-named tonight, so it's the cleanest benchmark: Stuckey 0.96 and Doug Kezirian 0.99 cosine, with Evan Abrams by text cue.
- If YouTube attribution scores well on B1-B3, A1-A3 can skip hand labeling entirely. If it scores badly, the fallback is one hand-labeled clip per show for voiceprints.
