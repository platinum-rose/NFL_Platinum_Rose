# Antigravity batch 2: Week 6 podcast extraction (2026-10-15 evening)

Requested by Andy 2026-10-15 20:28 PT. **No Gemini / AI Studio API calls, no Supabase, no git.** Write only to `data/shadow-harness/antigravity-staging/`.

## Episodes

| # | File to write | Show | Date | Title | Note |
|---|---|---|---|---|---|
| 1 | `youtube-DgU_WrFcn-Q.json` | Sharp or Square | 2026-10-15 | SHARP NFL Week 6 Bets: Ravens-Browns, Bills-Raiders, Cowboys-Packers, Panthers-Eagles... | NEW |
| 2 | `youtube-2vGRyoc6V2A.json` | Warren Sharp | 2026-10-15 | NFL Week 6 Preview: Cowboys-Packers, Bears-Falcons and More | NEW |
| 3 | `youtube-36yrqXIiZ40.json` | Ross Tucker (Even Money) | 2026-10-15 | 2026 NFL Week 6 PROP BETS & PARLAYS | NEW |
| 4 | `youtube-Id4ZG8i0BuA.json` | The Action Network | 2026-10-15 | Our Anytime Touchdown Picks for Week 6 of The NFL Season! | NEW |
| 5 | `youtube-slfl5V7gaOY.json` | BettingPros | 2026-10-13 | Early NFL BEST BETS & Survivor Pool Picks: Week 6 Predictions (2026) | RETRY (HTTP 429 last time) |
| 6 | `youtube-b_vEEqWIg2c.json` | BettingPros | 2026-10-13 | Top NFL Picks for Bills vs. Rams: Best Bets & Player Props for Monday... | RETRY - NOTE: Bills-Rams is the Week 5 Monday game; mark week=5, expect little for Week 6 |
| 7 | `youtube-06-42WRzKQI.json` | The Action Network | 2026-10-13 | NFL Futures Betting & Trading! | Best NFC Divisional Bets, MVP & OROY Prediction | RETRY (futures, not Week 6 games) |

URLs: `https://www.youtube.com/watch?v=<id without the "youtube-" prefix>`. (The TNF SEA@DEN preview `-3beH43dMxA` is intentionally skipped: the game is already played.)

## Fixes required versus batch 1 (from Team 2 validation, `_VALIDATION_team2_2026-10-14.md`)

1. **`speaker_segments` must not be empty.** Fill it from the captions (coarse 15-60 s blocks are fine) so quotes can be checked.
2. **Save the raw caption text** next to each JSON as `<id>.captions.txt` with timestamps, so quotes can be verified verbatim. Auto-caption garbling ("32 units" for "+3, 2 units") should be corrected in `quote` only when you are certain; otherwise keep verbatim and add an `uncertainty_flags` entry.
3. **Spread and total picks: set `side`** (e.g. team code for the side taken, or OVER/UNDER) and store `line` signed from the picked team's view (CLE +4.5 -> `4.5`, favorite KC -2.5 -> `-2.5`). Put the price in `price` when spoken, else null. Teaser legs: say so in `rationale`.
4. **`week` = 6** for Week 6 games. Do not extract picks for the already-played SEA@DEN TNF game as live picks (set `week` 6 but add a rationale prefix "TNF, played"). College picks are excluded.
5. Every pick needs a **verbatim `quote`** that actually contains the line or team; no line in the quote means flag it. Do not turn agreement ("so am I") into a pick.
6. If YouTube blocks the timedtext API (HTTP 429), use the on-page **Show transcript** panel in a signed-in browser and copy from there. Only if that also fails, write `status: no_transcript` with the reason.
7. Add a top-level `"status": "extracted"`, `"transcript_source"` (`auto_captions` or `transcript_panel`), and `"episode_id"` as in batch 1.

## Output schema and rules (same as the Gemini shadow prompt)

Use the exact JSON structure below. Substitute each episode's title/show/date and its runtime.

```text
Task:
1. Transcribe and summarize the betting-relevant sections.
2. Extract all explicit betting picks, win totals, futures, and leans.
3. Preserve speaker names when reasonably clear.
4. Preserve source timestamps in seconds from the start of the video.
5. Include short verbatim quotes that justify important extracted items.
6. Use null for unknown price, line, or speaker instead of inventing values.
7. Also extract "analysis_notes": non-pick commentary worth capturing on its own —
   team/player evaluations, injury or health context, roster/depth-chart notes,
   coaching or scheme discussion, matchup analysis, schedule context, fantasy
   relevance, or market sentiment. Do this even when a note doesn't accompany an
   explicit numbered pick.
8. IMPORTANT: populate "analysis_notes" even on episodes with zero
   "extracted_picks". Pure-analysis episodes (no explicit bets) still get a full
   "analysis_notes" array — never return both arrays empty just because there was
   no explicit pick; capture the substance of what was actually discussed.
9. If a host declares an explicit weekly survivor-pool pick (a single team,
   straight up, no line) or a pick'em pick, record it in "extracted_picks" with
   "market": "survivor_pick" or "market": "pickem_pick" respectively. For these
   two markets: "team" is the pick, "side" and "price" are null (not applicable —
   these are not priced or over/under bets).
10. When a pick or lean is tied to a specific NFL week, set "week" to that week
    number (integer, e.g. 5). Use null when no specific week applies (e.g. a
    season-long futures pick).
11. PLAYER-AWARD MARKETS MUST NAME THE PLAYER. For any pick whose market is
    "mvp", "opoy", "dpoy", "oroy", "droy", or "comeback_player_of_the_year",
    the pick is fundamentally about a PERSON, not a team — "team" alone
    (e.g. "NE" for a Patriots MVP pick) is not enough to identify who was
    actually picked. Always include a "player" field with the player's full
    name for these six markets. Use null for "player" on every other market
    where there is no individual player being picked (win_total,
    division_winner, spread, etc.) — don't force a player name where the pick
    is genuinely team-level. Found necessary 2026-07-28: the original schema
    had no "player" slot at all, so player-award picks could only be
    identified by team code, with the player's name sometimes surviving only
    inside free-text "rationale" and sometimes not captured anywhere.
12. RANKING/LIST EPISODES MUST PRESERVE LIST COVERAGE. If the title or host
    framing indicates a ranked list (for example top 10 quarterbacks, top 20
    receivers, team rankings, tiers, or greatest players), extract the full
    list structure into "analysis_notes" even when most entries are not bets.
    Create one note per ranked subject whenever a player or team receives a
    meaningful ranking discussion. Include the rank or tier in "topic" or
    "summary", preserve the speaker/ranker when clear, and do not collapse a
    top-10 discussion into only two or three strongest betting angles.

11. FULL-DURATION COVERAGE IS MANDATORY even though an exact runtime wasn't
    given to you. Keep extracting "speaker_segments" / "extracted_picks" /
    "analysis_notes" contiguously until you reach the actual end of the video
    file — never stop early because the early portion already contained
    substantial content, and never stop just because you believe you've
    captured "enough". A partial transcript of a long episode is a failure
    even when what you did capture is accurate.
12. Self-report your own coverage. Include a top-level "coverage_check" object:
    { "video_duration_seconds": <your own best estimate of the video's total length in seconds>, "last_analyzed_timestamp": <int, the timestamp of the last thing you actually analyzed>, "reached_end_of_video": <true/false, be honest — false if you stopped before the video ended for any reason> }.

Return ONLY a JSON object with this exact structure:
{
  "transcript_summary": "Brief 2-sentence summary of the episode",
  "coverage_check": {
    "video_duration_seconds": null,
    "last_analyzed_timestamp": 0,
    "reached_end_of_video": false
  },
  "speaker_segments": [
    { "start": 0.0, "end": 15.0, "speaker": "Chad Millman", "text": "sample text" }
  ],
  "extracted_picks": [
    {
      "team": "BUF",
      "player": null,
      "market": "win_total",
      "side": "OVER",
      "line": 10.5,
      "price": -115,
      "week": null,
      "speaker": "Simon Hunter",
      "source_timestamp": 349,
      "rationale": "Graded over 11.5; 4 easy division wins vs MIA/NYJ."
    },
    {
      "team": "KC",
      "player": null,
      "market": "survivor_pick",
      "side": null,
      "line": null,
      "price": null,
      "week": 5,
      "speaker": "Chad Millman",
      "source_timestamp": 812,
      "rationale": "Easiest matchup on the board this week, safe survivor call."
    },
    {
      "team": "KC",
      "player": "Patrick Mahomes",
      "market": "mvp",
      "side": "YES",
      "line": null,
      "price": 450,
      "week": null,
      "speaker": "Chad Millman",
      "source_timestamp": 900,
      "rationale": "Best supporting cast of his career; MVP is squarely in play."
    }
  ],
  "analysis_notes": [
    {
      "note_type": "team_evaluation",
      "teams": ["KC"],
      "players": ["Patrick Mahomes"],
      "topic": "Mahomes ramp-up concern",
      "summary": "Hosts flagged Mahomes looking rusty in camp reps and questioned Week 1 readiness.",
      "speaker": "Chad Millman",
      "source_timestamp": 570,
      "quote": "He didn't look right out there today.",
      "confidence": "stated"
    }
  ],
  "quote_timestamps": [
    { "topic": "Bills Over", "timestamp": 349, "speaker": "Simon Hunter", "quote": "I got this graded over 11 and a half." }
  ],
  "uncertainty_flags": [
    { "timestamp": 349, "field": "price", "reason": "price was not spoken clearly" }
  ]
}

Notes on "analysis_notes" field values:
- "note_type" must be one of: team_evaluation, player_evaluation, injury_or_health,
  roster_or_depth_chart, coaching_or_scheme, matchup_analysis, schedule_context,
  fantasy_relevance, market_sentiment, other.
- "confidence" must be one of: stated, implied, speculative.
- "teams" and "players" are arrays and may be empty ([]) if not applicable.

```
