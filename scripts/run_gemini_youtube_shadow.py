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
    return f"""
You are an expert NFL betting analyst and podcast video transcription/extraction engine.

Analyze the public YouTube video directly. Do not assume any pre-existing transcript.

Episode metadata:
Title: {meta.get("title", "NFL Podcast")}
Show: {meta.get("show", "Podcast")}
Date: {meta.get("date", "2026")}

Task:
1. Transcribe and summarize the betting-relevant sections.
2. Extract all explicit betting picks, win totals, futures, and leans.
3. Preserve speaker names when reasonably clear.
4. Preserve source timestamps in seconds from the start of the video.
5. Include short verbatim quotes that justify important extracted items.
6. Use null for unknown price, line, or speaker instead of inventing values.

Return ONLY a JSON object with this exact structure:
{{
  "transcript_summary": "Brief 2-sentence summary of the episode",
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
      "speaker": "Simon Hunter",
      "source_timestamp": 349,
      "rationale": "Graded over 11.5; 4 easy division wins vs MIA/NYJ."
    }}
  ],
  "quote_timestamps": [
    {{ "topic": "Bills Over", "timestamp": 349, "speaker": "Simon Hunter", "quote": "I got this graded over 11 and a half." }}
  ],
  "uncertainty_flags": [
    {{ "timestamp": 349, "field": "price", "reason": "price was not spoken clearly" }}
  ]
}}
"""


def extract_youtube(url, meta):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is missing from environment.")

    client = genai.Client(api_key=api_key)
    prompt = build_prompt(meta)

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

    latency_ms = round((t1 - t0) * 1000)
    response_text = response.text or ""

    usage = getattr(response, "usage_metadata", None)
    input_tokens = getattr(usage, "prompt_token_count", len(prompt) // 4) if usage else len(prompt) // 4
    output_tokens = getattr(usage, "candidates_token_count", len(response_text) // 4) if usage else len(response_text) // 4
    cost_usd = round(((input_tokens / 1_000_000) * 0.10) + ((output_tokens / 1_000_000) * 0.40), 6)

    parsed_json = parse_model_json(response_text)

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
    }


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
        return {"raw_text": response_text, "extracted_picks": []}


def main():
    parser = argparse.ArgumentParser(description="Live Gemini YouTube Shadow Runner")
    parser.add_argument("--url", required=True, help="Public YouTube watch URL")
    parser.add_argument("--episode-title", default="NFL Podcast", help="Episode title")
    parser.add_argument("--show", default="Podcast", help="Show name")
    parser.add_argument("--date", default="2026", help="Episode date")
    args = parser.parse_args()

    meta = {
        "title": args.episode_title,
        "show": args.show,
        "date": args.date,
    }

    try:
        result = extract_youtube(args.url, meta)
    except Exception as exc:
        print(json.dumps({"error": str(exc), "mode": "youtube_video_url", "model": MODEL_NAME}))
        sys.exit(1)

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
