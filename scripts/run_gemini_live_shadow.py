#!/usr/bin/env python3
"""
scripts/run_gemini_live_shadow.py
═══════════════════════════════════════════════════════════════════════════════
Live Gemini 3.5 Flash Audio & Transcript Extraction Engine for Shadow Harness

Usage:
  python scripts/run_gemini_live_shadow.py --baseline data/podcasts/m6-diarized-all/2026-03-03-sharp-or-square-early-2026-nfl-season-win-totals-part-1.json
  python scripts/run_gemini_live_shadow.py --url https://www.youtube.com/watch?v=AMS0ckHohNU
═══════════════════════════════════════════════════════════════════════════════
"""

import os
import sys
import json
import time
import argparse
from dotenv import load_dotenv

load_dotenv()

try:
    from google import genai
    from google.genai import types
except ImportError:
    print(json.dumps({"error": "google-genai SDK not installed. Run: pip install google-genai"}))
    sys.exit(1)

MODEL_NAME = "gemini-3.5-flash"

def extract_with_gemini_text(transcript_text, meta):
    """Send an existing baseline transcript to Gemini 3.5 Flash for extraction."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is missing from environment.")

    client = genai.Client(api_key=api_key)
    
    prompt = f"""
You are an expert NFL betting analyst and transcript extraction engine.
Analyze the following transcript from the podcast:
Title: {meta.get('title', 'NFL Podcast')}
Show: {meta.get('show', 'Podcast')}
Date: {meta.get('date', '2026')}

TRANSCRIPT:
{transcript_text}

Task:
1. Extract all explicit betting picks, win totals, futures, and leans discussed in the transcript.
2. Also extract "analysis_notes": non-pick commentary worth capturing on its own —
   team/player evaluations, injury or health context, roster/depth-chart notes,
   coaching or scheme discussion, matchup analysis, schedule context, fantasy
   relevance, or market sentiment. Do this even when a note doesn't accompany an
   explicit numbered pick.
3. IMPORTANT: populate "analysis_notes" even when the transcript has zero
   "extracted_picks". Pure-analysis episodes still get a full "analysis_notes"
   array — never return both arrays empty just because there was no explicit
   pick; capture the substance of what was actually discussed.
4. If a host declares an explicit weekly survivor-pool pick (a single team,
   straight up, no line) or a pick'em pick, record it in "extracted_picks" with
   "market": "survivor_pick" or "market": "pickem_pick" respectively. For these
   two markets: "team" is the pick, "side" and "price" are null (not applicable —
   these are not priced or over/under bets).
5. When a pick or lean is tied to a specific NFL week, set "week" to that week
   number (integer, e.g. 5). Use null when no specific week applies (e.g. a
   season-long futures pick).

Return ONLY a JSON object with this exact structure:
{{
  "transcript_summary": "Brief 2-sentence summary of the podcast",
  "speaker_segments": [
    {{ "start": 0.0, "end": 15.0, "speaker": "Chad Millman", "text": "sample text" }}
  ],
  "extracted_picks": [
    {{
      "team": "BUF",
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
      "market": "survivor_pick",
      "side": null,
      "line": null,
      "price": null,
      "week": 5,
      "speaker": "Chad Millman",
      "source_timestamp": 812,
      "rationale": "Easiest matchup on the board this week, safe survivor call."
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
  ]
}}

Notes on "analysis_notes" field values:
- "note_type" must be one of: team_evaluation, player_evaluation, injury_or_health,
  roster_or_depth_chart, coaching_or_scheme, matchup_analysis, schedule_context,
  fantasy_relevance, market_sentiment, other.
- "confidence" must be one of: stated, implied, speculative.
- "teams" and "players" are arrays and may be empty ([]) if not applicable.
"""

    t0 = time.perf_counter()
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(response_mime_type="application/json")
    )
    t1 = time.perf_counter()

    latency_ms = round((t1 - t0) * 1000)
    
    # Calculate token cost ($0.10/1M input, $0.40/1M output)
    usage = getattr(response, 'usage_metadata', None)
    input_tokens = getattr(usage, 'prompt_token_count', len(prompt) // 4) if usage else len(prompt) // 4
    output_tokens = getattr(usage, 'candidates_token_count', len(response.text) // 4) if usage else len(response.text) // 4
    
    cost_usd = round(((input_tokens / 1_000_000) * 0.10) + ((output_tokens / 1_000_000) * 0.40), 6)

    try:
        parsed_json = json.loads(response.text)
    except Exception:
        parsed_json = {"raw_text": response.text, "extracted_picks": [], "analysis_notes": []}

    return {
        "model": MODEL_NAME,
        "mode": "text_prompt",
        "latency_ms": latency_ms,
        "estimated_cost_usd": cost_usd,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "raw_model_response": response.text,
        "parsed_json": parsed_json
    }

def main():
    parser = argparse.ArgumentParser(description="Live Gemini Shadow Runner")
    parser.add_argument("--baseline", help="Path to baseline diarized JSON file")
    parser.add_argument("--url", help="Reserved for future direct YouTube/video audio transcription")
    args = parser.parse_args()

    if args.url and not args.baseline:
        print(json.dumps({
            "error": "--url direct YouTube/video transcription is not implemented in this runner yet. Use --baseline for live text extraction."
        }))
        sys.exit(1)

    if not args.baseline:
        print(json.dumps({"error": "Must specify --baseline"}))
        sys.exit(1)

    meta = {}
    transcript_text = ""

    if args.baseline and os.path.exists(args.baseline):
        with open(args.baseline, "r", encoding="utf-8") as f:
            data = json.load(f)
            episode = data.get("episode", {})
            meta = {
                "title": episode.get("title", os.path.basename(args.baseline)),
                "show": episode.get("show_title", "Podcast"),
                "date": episode.get("pub_date", "2026")
            }
            # Extract transcript text from baseline transcript segments
            segments = data.get("transcript", {}).get("speaker_segments", [])
            if segments:
                transcript_text = "\n".join([f"[{s.get('speaker', 'Speaker')}]: {s.get('text', '')}" for s in segments[:120]])
            else:
                transcript_text = data.get("transcript", {}).get("text", "")[:15000]

    if not transcript_text:
        print(json.dumps({
            "error": "Baseline file did not contain transcript text or speaker segments; refusing to run against sample placeholder text.",
            "baseline": args.baseline
        }))
        sys.exit(1)

    result = extract_with_gemini_text(transcript_text, meta)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
