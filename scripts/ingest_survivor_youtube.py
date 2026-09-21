#!/usr/bin/env python3
"""
scripts/ingest_survivor_youtube.py

Downloads audio from YouTube Survivor podcast via yt-dlp, uploads to Gemini File API,
and extracts deep strategic survivor analysis, host-attributed picks, and future-value advice.
"""

import os
import sys
import json
import tempfile
from dotenv import load_dotenv

load_dotenv()

try:
    import yt_dlp
except ImportError:
    print("yt-dlp not installed.")
    sys.exit(1)

from google import genai
from google.genai import types

def download_youtube_audio(video_url, output_dir):
    print(f"[INGEST] Downloading audio stream for: {video_url}")
    ydl_opts = {
        'format': 'm4a/bestaudio/best',
        'outtmpl': os.path.join(output_dir, '%(id)s.%(ext)s'),
        'quiet': False,
        'no_warnings': True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(video_url, download=True)
        filename = ydl.prepare_filename(info)
        return filename, info

def analyze_survivor_audio(audio_path, video_info):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is missing from environment.")

    client = genai.Client(api_key=api_key)

    print(f"[GEMINI] Uploading audio to Gemini File API: {os.path.basename(audio_path)} ({os.path.getsize(audio_path)/(1024*1024):.2f} MB)...")
    audio_file = client.files.upload(file=audio_path)
    print(f"[GEMINI] Audio uploaded. File URI: {audio_file.name}")

    prompt = f"""
You are an elite NFL Survivor Pool strategist, game theory expert, and podcast analyst.
Analyze the attached audio recording from the TrueDFS Survivor Pool YouTube episode:
Title: {video_info.get('title')}
Channel: {video_info.get('uploader')}
Published Date: {video_info.get('upload_date')}

The two main hosts are Sheets and Brave Jayhawk.
Analyze the ENTIRE audio thoroughly from start to finish.

Provide an exhaustive, structured strategic intelligence dossier covering:
1. Executive Summary: Core thesis for Week 2 and high-level strategy for 2026 Survivor pools.
2. Speaker-Attributed Picks & Leans:
   - What is Sheets' primary Week 2 pick? Secondary/contingency picks?
   - What is Brave Jayhawk's primary Week 2 pick? Secondary/contingency picks?
   - Any disagreements or contrasting philosophical approaches between Sheets and Brave Jayhawk.
3. Game-by-Game Survivor Assessment:
   - For every Week 2 game analyzed, provide:
     * Matchup (Favorite vs Underdog, Spread, Implied Win Probability if discussed)
     * Risk rating / Trap game status
     * Value assessment (Burn now vs Save for later weeks)
     * Host consensus & specific reasoning / key statistics cited
4. Long-Term Portfolio Pathing & Future Value Strategy:
   - Which elite teams (e.g. Chiefs, 49ers, Bills, Ravens, Eagles, Lions) MUST be saved for upcoming bottleneck weeks?
   - Which teams have peak utility RIGHT NOW in Week 2 and should be burned immediately?
   - Future schedule navigation and multi-entry portfolio distribution (if running 2-5 entries, how to split them).
5. Public Pick Distribution & Contrarian Leverage:
   - Where is the public expected to concentrate their picks in Week 2?
   - What are the highest-leverage pivot plays to gain expected value against the field?
6. Structured Pick & Note Ledger:
   - A markdown table listing every team evaluated:
     | Team | Opponent | Spread | Survivor Tier (Lock / Strong Lean / Leverage Pivot / Danger Trap / Save For Later) | Sheets Lean | Jayhawk Lean | Key Rationale & Timestamps |

Also output a JSON code block at the very end enclosed in ```json ... ``` with this exact schema:
{{
  "show": "TrueDFS",
  "title": "{video_info.get('title')}",
  "video_url": "{video_info.get('webpage_url')}",
  "hosts": ["Sheets", "Brave Jayhawk"],
  "week": 2,
  "season": 2026,
  "top_survivor_picks": [
    {{
      "team": "<string, e.g. BAL>",
      "host": "<string, Sheets or Brave Jayhawk or Both>",
      "pick_tier": "<primary | secondary | leverage_pivot | avoid>",
      "rationale": "<string>",
      "timestamp_seconds": <int or null>
    }}
  ],
  "future_value_saves": [
    {{
      "team": "<string>",
      "target_future_weeks": [<int>],
      "reason_to_save": "<string>"
    }}
  ],
  "trap_teams_to_avoid": [
    {{
      "team": "<string>",
      "opponent": "<string>",
      "risk_factors": "<string>"
    }}
  ]
}}
"""

    print("[GEMINI] Generating Survivor intelligence with Gemini 3.5 Flash...")
    response = client.models.generate_content(
        model='gemini-3.5-flash',
        contents=[audio_file, prompt]
    )

    try:
        client.files.delete(name=audio_file.name)
        print("[GEMINI] Cleaned up temporary file from Gemini File API.")
    except Exception as e:
        print(f"Note: Could not delete remote file: {e}")

    return response.text

def main():
    url = "https://www.youtube.com/watch?v=CFSaUMy21k8"
    if len(sys.argv) > 1:
        url = sys.argv[1]

    with tempfile.TemporaryDirectory() as tmpdir:
        audio_path, video_info = download_youtube_audio(url, tmpdir)
        print(f"[SUCCESS] Downloaded: {video_info.get('title')} ({os.path.getsize(audio_path)/(1024*1024):.2f} MB)")
        
        content = analyze_survivor_audio(audio_path, video_info)
        
        # Save Markdown Report
        md_dir = os.path.join("docs", "survivor-intel")
        os.makedirs(md_dir, exist_ok=True)
        md_path = os.path.join(md_dir, "2026-week2-truedfs-survivor-analysis.md")
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"\n[REPORT] Saved Markdown report to: {md_path}")

        # Extract and Save JSON Structured Data
        json_dir = os.path.join("data", "research-intel", "review")
        os.makedirs(json_dir, exist_ok=True)
        json_path = os.path.join(json_dir, "survivor-truedfs-week2.json")
        
        import re
        json_match = re.search(r"```json\s*([\s\S]*?)\s*```", content)
        if json_match:
            try:
                parsed = json.loads(json_match.group(1))
                with open(json_path, "w", encoding="utf-8") as f:
                    json.dump(parsed, f, indent=2)
                print(f"[DATA] Saved structured JSON to: {json_path}")
            except Exception as je:
                print(f"[WARN] Could not parse embedded JSON: {je}")

if __name__ == "__main__":
    main()
