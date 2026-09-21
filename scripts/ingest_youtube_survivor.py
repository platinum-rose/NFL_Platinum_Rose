#!/usr/bin/env python3
import os
import sys
import json
from dotenv import load_dotenv
load_dotenv()

import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from run_gemini_youtube_shadow import extract_youtube, MODEL_NAME

def main():
    url = "https://www.youtube.com/watch?v=CFSaUMy21k8"
    meta = {
        "title": "NFL Survivor Pool Analysis with Sheets and Brave Jayhawk",
        "show": "TrueDFS",
        "date": "2026-09-17",
        "duration_seconds": 3280,
    }
    out_path = os.path.join("data", "podcasts", "youtube-truedfs-survivor-cfsaumy21k8.json")
    print(f"Extracting YouTube podcast {url} using {MODEL_NAME}...")
    try:
        result = extract_youtube(url, meta, max_retries=2, retry_delay_seconds=15)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"Successfully saved extraction to {out_path}")
    except Exception as e:
        print(f"Extraction failed: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
