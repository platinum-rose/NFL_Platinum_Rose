#!/usr/bin/env python3
"""
scripts/transcribe_twitter_video.py
Downloads audio from Twitter/X post and transcribes it using Groq Whisper and/or Gemini.
"""

import os
import sys
import tempfile
from dotenv import load_dotenv

load_dotenv()

import yt_dlp

def main():
    url = "https://x.com/lockandcash/status/2100617675307135240"
    if len(sys.argv) > 1:
        url = sys.argv[1]

    with tempfile.TemporaryDirectory() as tmpdir:
        out_template = os.path.join(tmpdir, "%(id)s.%(ext)s")
        ydl_opts = {
            'format': 'm4a/bestaudio/best',
            'outtmpl': out_template,
            'quiet': True,
            'no_warnings': True,
        }

        print(f"[1/3] Downloading audio from {url}...")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            audio_path = ydl.prepare_filename(info)

        print(f"[2/3] Downloaded: {info.get('title')} ({info.get('duration'):.1f}s)")
        print(f"      File: {audio_path} ({os.path.getsize(audio_path)/1024:.1f} KB)")

        # First try Groq Whisper API (free, fast, exact verbatim)
        groq_key = os.environ.get("GROQ_API_KEY")
        transcript_text = None
        
        if groq_key:
            print("[3/3] Transcribing via Groq Whisper-large-v3...")
            import requests
            headers = {"Authorization": f"Bearer {groq_key}"}
            with open(audio_path, "rb") as f:
                files = {"file": (os.path.basename(audio_path), f, "audio/m4a")}
                data = {
                    "model": "whisper-large-v3",
                    "response_format": "verbose_json"
                }
                res = requests.post("https://api.groq.com/openai/v1/audio/transcriptions", headers=headers, files=files, data=data)
                if res.ok:
                    result = res.json()
                    transcript_text = result.get("text", "").strip()
                    print("\n=== GROQ VERBATIM TRANSCRIPTION ===")
                    print(transcript_text)
                    print("===================================\n")
                    if "segments" in result:
                        print("=== TIMESTAMPED SEGMENTS ===")
                        for seg in result["segments"]:
                            print(f"[{seg['start']:.1f}s -> {seg['end']:.1f}s]: {seg['text'].strip()}")
                        print("============================\n")
                else:
                    print(f"Groq error: {res.status_code} {res.text}")

        if not transcript_text:
            print("[3/3] Falling back to Gemini File API...")
            from google import genai
            client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
            up_file = client.files.upload(file=audio_path)
            prompt = "Transcribe the following audio recording verbatim, word-for-word. Provide timestamps for each sentence or thought."
            resp = client.models.generate_content(
                model="gemini-3.5-flash",
                contents=[up_file, prompt]
            )
            print("\n=== GEMINI VERBATIM TRANSCRIPTION ===")
            print(resp.text)
            print("=====================================\n")
            try:
                client.files.delete(name=up_file.name)
            except Exception:
                pass

if __name__ == "__main__":
    main()
