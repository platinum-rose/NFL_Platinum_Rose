#!/usr/bin/env python3
"""
scripts/test_youtube_multimodal_audio.py

Direct YouTube URL -> Audio Stream Extraction -> Gemini 3.5 Flash Multimodal Analysis
"""

import os
import sys
import tempfile
from dotenv import load_dotenv

load_dotenv()

try:
    import yt_dlp
except ImportError:
    print("yt-dlp not installed. Install with: pip install yt-dlp")
    sys.exit(1)

def download_youtube_audio(video_url, output_dir):
    """Download audio stream from YouTube using yt-dlp."""
    print(f"[INGEST] Downloading audio stream for: {video_url}")
    ydl_opts = {
        'format': 'm4a/bestaudio/best',
        'outtmpl': os.path.join(output_dir, '%(id)s.%(ext)s'),
        'quiet': True,
        'no_warnings': True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(video_url, download=True)
        filename = ydl.prepare_filename(info)
        return filename, info

def analyze_audio_with_gemini(audio_path, video_info):
    """Upload audio to Gemini File API and run multimodal analysis with Gemini 3.5 Flash."""
    from google import genai
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("\n[CONFIG] GEMINI_API_KEY not found in environment or .env file.")
        print("Please add GEMINI_API_KEY=your_key to your .env file.")
        return None

    client = genai.Client(api_key=api_key)

    print(f"[GEMINI] Uploading audio to Gemini File API: {os.path.basename(audio_path)}")
    audio_file = client.files.upload(file=audio_path)
    print(f"[GEMINI] Audio uploaded successfully. File URI: {audio_file.name}")

    prompt = f"""
You are an expert NFL betting analyst and transcript diarization engine.
Analyze the attached audio recording from the YouTube episode:
Title: {video_info.get('title')}
Channel: {video_info.get('uploader')}
Published Date: {video_info.get('upload_date')}

Extract structured betting intelligence with precise speaker attribution (e.g. Chad Millman vs Simon Hunter), verbatim quotes, timestamp references, and explicit pick leans.

Output a structured Markdown note using the following exact YAML frontmatter format:

---
title: "{video_info.get('title')}"
type: podcast_summary
source: youtube
channel: "{video_info.get('uploader')}"
video_url: "{video_info.get('webpage_url')}"
published_at: "{video_info.get('upload_date')}"
ingested_at: "{video_info.get('upload_date')}"
season: 2026
bet_types: [win_totals, futures]
processed_by: "gemini-3.5-flash-multimodal-audio"
tags:
  - nfl/podcast
  - source/youtube
  - market/win_totals
---

# Episode Summary: {video_info.get('title')}

## Key Tactical Takeaways & Detailed Team Breakdown
(Provide speaker attribution, timestamps, exact line numbers, and quotes for every team discussed in the audio)

## Extracted Pick Ledger
| Picker | Team | Market | Line | Selection | Price | Conviction | Key Rationale |
|---|---|---|---|---|---|---|---|
(List all picks extracted from the audio)
"""

    print("[GEMINI] Processing audio with Gemini 3.5 Flash...")
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
    if len(sys.argv) < 2:
        url = "https://www.youtube.com/watch?v=WQYY5lAh5MM"
    else:
        url = sys.argv[1]

    with tempfile.TemporaryDirectory() as tmpdir:
        audio_path, video_info = download_youtube_audio(url, tmpdir)
        print(f"[SUCCESS] Audio stream downloaded successfully!")
        print(f"   Title: {video_info.get('title')}")
        print(f"   Uploader: {video_info.get('uploader')}")
        print(f"   Upload Date: {video_info.get('upload_date')}")
        print(f"   Audio Size: {os.path.getsize(audio_path) / (1024*1024):.2f} MB")
        
        markdown = analyze_audio_with_gemini(audio_path, video_info)
        if markdown:
            out_name = f"{video_info.get('upload_date', '2026-01-01')}-{video_info.get('id')}-gemini-audio.md"
            out_path = os.path.join("data", "vault-seed", "manual", out_name)
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(markdown)
            print(f"\n[SUCCESS] Saved to {out_path}\n")
            print(markdown[:1200])

if __name__ == "__main__":
    main()
