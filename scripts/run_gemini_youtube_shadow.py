#!/usr/bin/env python3
"""
Run a true Gemini YouTube/video shadow extraction.

This runner does not read or send the local baseline transcript. The baseline is
only used later by the Node harness for scoring.
"""

import argparse
import json
import os
import sys
import time
import re

from dotenv import load_dotenv

load_dotenv()

try:
    from google import genai
    from google.genai import types
except ImportError:
    print(json.dumps({"error": "google-genai SDK not installed. Run: pip install google-genai"}))
    sys.exit(1)


MODEL_NAME = "gemini-3.5-flash"


def build_prompt(meta):
    duration_seconds = meta.get("duration_seconds")
    segment_start = meta.get("segment_start_seconds")
    segment_end = meta.get("segment_end_seconds")
    is_segment = segment_start is not None and segment_end is not None
    if duration_seconds:
        duration_minutes = round(duration_seconds / 60, 1)
        duration_line = (
            f"Runtime: this video is {duration_seconds} seconds long "
            f"(~{duration_minutes} minutes), start to finish."
        )
        duration_enforcement = f"""
11. FULL-DURATION COVERAGE IS MANDATORY. This video runs {duration_seconds}
    seconds (~{duration_minutes} minutes). Your "speaker_segments" MUST extend
    contiguously in time all the way to the end of the video — the final
    segment's "end" value should land within roughly 60 seconds of
    {duration_seconds}. Likewise, keep listening and extracting
    "extracted_picks" / "analysis_notes" for the ENTIRE runtime, not just the
    opening portion. Do NOT stop early because the early segments already
    contained substantial content, and do NOT stop early because you believe
    you have "enough" — a partial transcript of a long episode is a failure
    even if what you captured is accurate. If the video continues, keep
    analyzing until you actually reach the end.
12. Self-report your own coverage. Include a top-level "coverage_check" object:
    {{ "video_duration_seconds": {duration_seconds}, "last_analyzed_timestamp": <int, the timestamp of the last thing you actually analyzed>, "reached_end_of_video": <true/false, be honest — false if you stopped before the video ended for any reason> }}.
"""
    else:
        duration_line = (
            "Runtime: not provided in advance — determine it yourself from the "
            "video and keep analyzing all the way to the actual end; do not "
            "assume the episode is over just because the discussion reaches a "
            "natural-sounding pause."
        )
        duration_enforcement = """
11. FULL-DURATION COVERAGE IS MANDATORY even though an exact runtime wasn't
    given to you. Keep extracting "speaker_segments" / "extracted_picks" /
    "analysis_notes" contiguously until you reach the actual end of the video
    file — never stop early because the early portion already contained
    substantial content, and never stop just because you believe you've
    captured "enough". A partial transcript of a long episode is a failure
    even when what you did capture is accurate.
12. Self-report your own coverage. Include a top-level "coverage_check" object:
    { "video_duration_seconds": <your own best estimate of the video's total length in seconds>, "last_analyzed_timestamp": <int, the timestamp of the last thing you actually analyzed>, "reached_end_of_video": <true/false, be honest — false if you stopped before the video ended for any reason> }.
"""

    if is_segment:
        duration_line = (
            f"Runtime: this video is {duration_seconds or 'unknown'} seconds long. "
            f"Segment retry window: analyze only {segment_start}-{segment_end} seconds."
        )
        duration_enforcement = f"""
11. SEGMENTED COVERAGE IS MANDATORY. This is a retry/fallback extraction for
    the time window {segment_start}-{segment_end} seconds. Analyze ONLY this
    segment, but cover this segment completely. Keep timestamps absolute from
    the start of the full video. Do not summarize or invent content outside
    this segment. Your "speaker_segments" MUST start near {segment_start} and
    extend contiguously to roughly {segment_end}.
12. Self-report your own coverage. Include a top-level "coverage_check" object:
    {{ "video_duration_seconds": {duration_seconds if duration_seconds else "null"}, "segment_start_seconds": {segment_start}, "segment_end_seconds": {segment_end}, "last_analyzed_timestamp": <int, the timestamp of the last thing you actually analyzed>, "reached_end_of_video": <true/false, true only if you reached the requested segment end> }}.
"""

    return f"""
You are an expert NFL betting analyst and podcast video transcription/extraction engine.

Analyze the public YouTube video directly. Do not assume any pre-existing transcript.
{"This is a segmented retry. Analyze only the requested time window, with absolute timestamps." if is_segment else ""}

Episode metadata:
Title: {meta.get("title", "NFL Podcast")}
Show: {meta.get("show", "Podcast")}
Date: {meta.get("date", "2026")}
{duration_line}

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
{duration_enforcement}
Return ONLY a JSON object with this exact structure:
{{
  "transcript_summary": "Brief 2-sentence summary of the episode",
  "coverage_check": {{
    "video_duration_seconds": {duration_seconds if duration_seconds else "null"},
    "last_analyzed_timestamp": 0,
    "reached_end_of_video": false
  }},
  "speaker_segments": [
    {{ "start": 0.0, "end": 15.0, "speaker": "Chad Millman", "text": "sample text" }}
  ],
  "extracted_picks": [
    {{
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
    }},
    {{
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
    }},
    {{
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
    }}
  ],
  "analysis_notes": [
    {{
      "note_type": "team_evaluation",
      "teams": ["KC"],
      "players": ["Patrick Mahomes"],
      "topic": "Mahomes ramp-up concern",
      "summary": "Hosts flagged Mahomes looking rusty in camp reps and questioned Week 1 readiness.",
      "speaker": "Chad Millman",
      "source_timestamp": 570,
      "quote": "He didn't look right out there today.",
      "confidence": "stated"
    }}
  ],
  "quote_timestamps": [
    {{ "topic": "Bills Over", "timestamp": 349, "speaker": "Simon Hunter", "quote": "I got this graded over 11 and a half." }}
  ],
  "uncertainty_flags": [
    {{ "timestamp": 349, "field": "price", "reason": "price was not spoken clearly" }}
  ]
}}

Notes on "analysis_notes" field values:
- "note_type" must be one of: team_evaluation, player_evaluation, injury_or_health,
  roster_or_depth_chart, coaching_or_scheme, matchup_analysis, schedule_context,
  fantasy_relevance, market_sentiment, other.
- "confidence" must be one of: stated, implied, speculative.
- "teams" and "players" are arrays and may be empty ([]) if not applicable.
"""


def extract_youtube(url, meta, max_retries=0, retry_delay_seconds=20):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is missing from environment.")

    client = genai.Client(api_key=api_key)
    prompt = build_prompt(meta)

    last_error = None
    for attempt in range(max_retries + 1):
        try:
            t0 = time.perf_counter()
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=types.Content(
                    parts=[
                        types.Part(file_data=types.FileData(file_uri=url)),
                        types.Part(text=prompt),
                    ]
                ),
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            )
            t1 = time.perf_counter()
            break
        except Exception as exc:
            last_error = exc
            retryable = "503" in str(exc) or "UNAVAILABLE" in str(exc).upper()
            if not retryable or attempt >= max_retries:
                raise
            delay = retry_delay_seconds * (attempt + 1)
            print(
                f"WARNING: Gemini retryable error on attempt {attempt + 1}/{max_retries + 1}: {exc}. "
                f"Retrying in {delay}s.",
                file=sys.stderr,
            )
            time.sleep(delay)
    else:
        raise last_error

    latency_ms = round((t1 - t0) * 1000)
    response_text = response.text or ""

    usage = getattr(response, "usage_metadata", None)
    input_tokens = getattr(usage, "prompt_token_count", len(prompt) // 4) if usage else len(prompt) // 4
    output_tokens = getattr(usage, "candidates_token_count", len(response_text) // 4) if usage else len(response_text) // 4
    cost_usd = round(((input_tokens / 1_000_000) * 0.10) + ((output_tokens / 1_000_000) * 0.40), 6)

    parsed_json = parse_model_json(response_text)
    coverage = assess_coverage(
        parsed_json,
        meta.get("duration_seconds"),
        meta.get("segment_start_seconds"),
        meta.get("segment_end_seconds"),
    )

    return {
        "model": MODEL_NAME,
        "mode": "youtube_video_url",
        "youtube_url": url,
        "latency_ms": latency_ms,
        "estimated_cost_usd": cost_usd,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "raw_model_response": response_text,
        "parsed_json": parsed_json,
        "coverage_assessment": coverage,
    }


def extract_youtube_segmented(url, meta, segment_seconds, max_retries=0, retry_delay_seconds=20):
    duration_seconds = meta.get("duration_seconds")
    if not duration_seconds:
        raise ValueError("--segment-seconds requires --duration-seconds.")

    segments = []
    start = 0
    while start < duration_seconds:
        end = min(duration_seconds, start + segment_seconds)
        segments.append((start, end))
        start = end

    segment_results = []
    for index, (segment_start, segment_end) in enumerate(segments, start=1):
        print(
            f"Running segmented Gemini extraction {index}/{len(segments)}: "
            f"{segment_start}-{segment_end}s",
            file=sys.stderr,
            flush=True,
        )
        segment_meta = {
            **meta,
            "segment_start_seconds": segment_start,
            "segment_end_seconds": segment_end,
        }
        segment_result = extract_youtube(url, segment_meta, max_retries, retry_delay_seconds)
        segment_results.append(segment_result)
        coverage = segment_result.get("coverage_assessment") or {}
        print(
            f"Finished segmented Gemini extraction {index}/{len(segments)}: "
            f"last_covered={coverage.get('last_covered_timestamp')} "
            f"incomplete={coverage.get('suspected_incomplete')}",
            file=sys.stderr,
            flush=True,
        )

    parsed_segments = [row.get("parsed_json") or {} for row in segment_results]
    merged_segments = []
    merged_picks = []
    merged_notes = []
    merged_quotes = []
    merged_uncertainty = []

    for parsed in parsed_segments:
        merged_segments.extend(parsed.get("speaker_segments") or [])
        merged_picks.extend(parsed.get("extracted_picks") or [])
        merged_notes.extend(parsed.get("analysis_notes") or [])
        merged_quotes.extend(parsed.get("quote_timestamps") or [])
        merged_uncertainty.extend(parsed.get("uncertainty_flags") or [])

    incomplete = []
    segment_coverages = []
    segment_fingerprints = {}
    for row in segment_results:
        parsed = row.get("parsed_json") or {}
        check = parsed.get("coverage_check") or {}
        segment_start = check.get("segment_start_seconds")
        segment_end = check.get("segment_end_seconds")
        coverage = assess_coverage(parsed, duration_seconds, segment_start, segment_end)
        semantic_reason = segmented_semantic_issue(parsed, segment_fingerprints)
        if semantic_reason:
            coverage["suspected_incomplete"] = True
            coverage["reason"] = semantic_reason
            coverage["semantic_coverage_failed"] = True
        row["coverage_assessment"] = coverage
        segment_coverages.append(coverage)
        if coverage.get("suspected_incomplete"):
            incomplete.append(coverage)
    merged_json = {
        "transcript_summary": "Segmented extraction merged from full-video time windows.",
        "coverage_check": {
            "video_duration_seconds": duration_seconds,
            "last_analyzed_timestamp": duration_seconds if not incomplete else max(
                [0] + [float((row.get("coverage_assessment") or {}).get("last_covered_timestamp") or 0) for row in segment_results]
            ),
            "reached_end_of_video": len(incomplete) == 0,
        },
        "speaker_segments": merged_segments,
        "extracted_picks": merged_picks,
        "analysis_notes": merged_notes,
        "quote_timestamps": merged_quotes,
        "uncertainty_flags": merged_uncertainty,
    }

    total_latency_ms = sum(int(row.get("latency_ms") or 0) for row in segment_results)
    total_cost_usd = round(sum(float(row.get("estimated_cost_usd") or 0) for row in segment_results), 6)
    total_input_tokens = sum(int(row.get("input_tokens") or 0) for row in segment_results)
    total_output_tokens = sum(int(row.get("output_tokens") or 0) for row in segment_results)
    coverage = {
        "last_covered_timestamp": merged_json["coverage_check"]["last_analyzed_timestamp"],
        "self_reported_reached_end": len(incomplete) == 0,
        "duration_used_for_check": duration_seconds,
        "suspected_incomplete": len(incomplete) > 0,
        "reason": "; ".join(filter(None, [item.get("reason") for item in incomplete])) or None,
        "coverage_ratio": 1 if len(incomplete) == 0 else None,
        "segment_count": len(segment_results),
        "segment_seconds": segment_seconds,
        "segment_coverages": segment_coverages,
    }

    return {
        "model": MODEL_NAME,
        "mode": "youtube_video_url_segmented",
        "youtube_url": url,
        "latency_ms": total_latency_ms,
        "estimated_cost_usd": total_cost_usd,
        "input_tokens": total_input_tokens,
        "output_tokens": total_output_tokens,
        "raw_model_response": json.dumps([row.get("raw_model_response") for row in segment_results]),
        "parsed_json": merged_json,
        "coverage_assessment": coverage,
        "segment_results": segment_results,
}


def segmented_semantic_issue(parsed_json, segment_fingerprints):
    """Catch segmented YouTube failures where timestamps look complete but the
    model repeats the intro or another prior window instead of honoring the
    requested time window.
    """
    check = parsed_json.get("coverage_check") or {}
    segment_start = check.get("segment_start_seconds")
    try:
        segment_start = float(segment_start)
    except (TypeError, ValueError):
        segment_start = None

    text_parts = []
    for row in parsed_json.get("speaker_segments") or []:
        text_parts.append(str(row.get("text") or ""))
    full_text = " ".join(text_parts).lower()

    intro_markers = [
        "welcome to sharp or square",
        "this is the show that makes the square sharper",
        "i am chad millman",
        "hello simon",
    ]
    if segment_start is not None and segment_start >= 600:
        if sum(1 for marker in intro_markers if marker in full_text) >= 2:
            return "segment semantic mismatch: later window repeated the episode intro"

    fingerprint = " ".join(full_text.split()[:80])
    if fingerprint:
        prior = segment_fingerprints.get(fingerprint)
        if prior is not None:
            return f"segment semantic mismatch: repeated content from segment starting at {prior}s"
        segment_fingerprints[fingerprint] = segment_start

    return None


def assess_coverage(parsed_json, duration_seconds_hint, segment_start_seconds=None, segment_end_seconds=None):
    """Best-effort, code-side sanity check for the under-extraction failure mode
    found 2026-07-28 (model stops analyzing a long video well before its real
    end, without any indication in the returned JSON that anything is wrong).
    Does not trust the model's self-reported "coverage_check" alone -- also
    cross-checks against the last speaker_segment / pick / note timestamp, since
    a model that stopped early may also under-report its own stopping point.
    Returns a dict with a human-readable "suspected_incomplete" bool and the
    evidence behind it; never raises.
    """
    if not isinstance(parsed_json, dict):
        return {"suspected_incomplete": None, "reason": "response did not parse as JSON"}

    segs = parsed_json.get("speaker_segments") or []
    picks = parsed_json.get("extracted_picks") or []
    notes = parsed_json.get("analysis_notes") or []

    last_seg_end = 0
    for s in segs:
        end = s.get("end", s.get("stop", 0)) or 0
        try:
            last_seg_end = max(last_seg_end, float(end))
        except (TypeError, ValueError):
            continue

    last_item_ts = last_seg_end
    for item in picks + notes:
        ts = item.get("source_timestamp") or 0
        try:
            last_item_ts = max(last_item_ts, float(ts))
        except (TypeError, ValueError):
            continue

    coverage_check = parsed_json.get("coverage_check") or {}
    self_reported_duration = coverage_check.get("video_duration_seconds")
    self_reported_reached_end = coverage_check.get("reached_end_of_video")

    duration_estimate = duration_seconds_hint or self_reported_duration
    coverage_target = segment_end_seconds or duration_estimate
    result = {
        "last_covered_timestamp": last_item_ts,
        "self_reported_reached_end": self_reported_reached_end,
        "duration_used_for_check": duration_estimate,
        "segment_start_seconds": segment_start_seconds,
        "segment_end_seconds": segment_end_seconds,
        "suspected_incomplete": None,
        "reason": None,
    }

    if coverage_target:
        if segment_start_seconds is not None and segment_end_seconds:
            covered_span = max(0, last_item_ts - segment_start_seconds)
            target_span = max(1, segment_end_seconds - segment_start_seconds)
            coverage_ratio = covered_span / target_span
        else:
            if self_reported_reached_end is False:
                result["suspected_incomplete"] = True
                result["reason"] = "model explicitly self-reported reached_end_of_video=false"
                return result
            coverage_ratio = last_item_ts / duration_estimate if duration_estimate else 0
        result["coverage_ratio"] = round(coverage_ratio, 3)
        if coverage_ratio < 0.85:
            result["suspected_incomplete"] = True
            result["reason"] = (
                f"last covered timestamp ({last_item_ts:.0f}s) is only "
                f"{coverage_ratio:.0%} of the known/estimated duration "
                f"({coverage_target:.0f}s)"
            )
            return result
        result["suspected_incomplete"] = False
        return result

    result["reason"] = "no duration hint provided and model did not self-report one; cannot check"
    return result


def parse_model_json(response_text):
    text = (response_text or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)

    try:
        return json.loads(text)
    except Exception:
        pass

    # Gemini may emit human-style positive American odds like +500, which is
    # not valid JSON. Keep the raw response, but repair this common shape for
    # structured shadow scoring.
    repaired = re.sub(r'(:\s*)\+(\d+(?:\.\d+)?)', r'\1\2', text)
    try:
        return json.loads(repaired)
    except Exception:
        return {"raw_text": response_text, "extracted_picks": [], "analysis_notes": []}


def main():
    parser = argparse.ArgumentParser(description="Live Gemini YouTube Shadow Runner")
    parser.add_argument("--url", required=True, help="Public YouTube watch URL")
    parser.add_argument("--episode-title", default="NFL Podcast", help="Episode title")
    parser.add_argument("--show", default="Podcast", help="Show name")
    parser.add_argument("--date", default="2026", help="Episode date")
    parser.add_argument(
        "--duration-seconds",
        type=int,
        default=None,
        help=(
            "The video's actual runtime in seconds, if known (e.g. from the "
            "YouTube player). Strongly recommended for episodes over ~15 "
            "minutes -- passing this lets the model enforce full-duration "
            "coverage and lets this script auto-detect early stopping. "
            "Added 2026-07-28 after confirming the model can silently stop "
            "analyzing a long episode a fraction of the way through."
        ),
    )
    parser.add_argument(
        "--segment-seconds",
        type=int,
        default=None,
        help=(
            "Optional fallback mode: split a known-duration YouTube video into "
            "fixed-size windows and merge the structured extraction. This uses "
            "multiple Gemini calls and should be used only for reprocessing "
            "episodes that repeatedly fail full-duration coverage."
        ),
    )
    parser.add_argument("--max-retries", type=int, default=0, help="Retry transient Gemini 503/UNAVAILABLE errors this many times.")
    parser.add_argument("--retry-delay-seconds", type=int, default=20, help="Base delay between retry attempts.")
    args = parser.parse_args()

    meta = {
        "title": args.episode_title,
        "show": args.show,
        "date": args.date,
        "duration_seconds": args.duration_seconds,
    }

    try:
        if args.segment_seconds:
            result = extract_youtube_segmented(
                args.url,
                meta,
                args.segment_seconds,
                args.max_retries,
                args.retry_delay_seconds,
            )
        else:
            result = extract_youtube(args.url, meta, args.max_retries, args.retry_delay_seconds)
    except Exception as exc:
        print(json.dumps({"error": str(exc), "mode": "youtube_video_url", "model": MODEL_NAME}))
        sys.exit(1)

    coverage = result.get("coverage_assessment") or {}
    if coverage.get("suspected_incomplete"):
        print(
            f"WARNING: suspected incomplete extraction -- {coverage.get('reason')}. "
            f"Re-run may be needed; consider passing --duration-seconds explicitly "
            f"if you didn't already.",
            file=sys.stderr,
        )

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
