#!/usr/bin/env python3
"""
Batch extraction of newly discovered Friday Week 5 NFL podcast episodes.
Runs directly via Gemini API in read-only / evidence-only mode.
Does NOT write to Supabase.
"""

import os
import sys
import json
import time
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.run_gemini_youtube_shadow import extract_youtube

VIDEOS = [
    {
        "id": "_Vw1I62_6I8",
        "slug": "athletic-best-teams-week5-preview",
        "title": "Are the NFL's Two Best Teams Facing Off This Weekend?",
        "show": "The Athletic Football Show",
        "url": "https://www.youtube.com/watch?v=_Vw1I62_6I8",
        "date": "2026-10-09",
    },
    {
        "id": "zHst1TgR4Ag",
        "slug": "sportsline-week5-player-props",
        "title": "NFL Week 5 PLAYER PROPS - Picks and Bets",
        "show": "SportsLine",
        "url": "https://www.youtube.com/watch?v=zHst1TgR4Ag",
        "date": "2026-10-09",
    },
    {
        "id": "VnsSqi-bqNQ",
        "slug": "bettingpros-sunday-best-bets",
        "title": "Sunday NFL Week 5 Best Bets | Expert Picks, Predictions & Player Props (2026)",
        "show": "BettingPros",
        "url": "https://www.youtube.com/watch?v=VnsSqi-bqNQ",
        "date": "2026-10-09",
    },
    {
        "id": "DlVpbB-tBa0",
        "slug": "warren-sharp-best-bets-props",
        "title": "(39-14, 74%) NFL Week 5 Best Bets & Player Props 2026",
        "show": "Sharp Football",
        "url": "https://www.youtube.com/watch?v=DlVpbB-tBa0",
        "date": "2026-10-09",
    },
    {
        "id": "7xS3qbuGu2E",
        "slug": "bettingpros-snf-ravens-falcons",
        "title": "NFL Sunday Night Football Bets & Player Props: Ravens vs. Falcons Picks (Week 5)",
        "show": "BettingPros",
        "url": "https://www.youtube.com/watch?v=7xS3qbuGu2E",
        "date": "2026-10-09",
    },
]

def main():
    out_dir = Path("data/research-intel/source-evidence/friday-podcasts")
    out_dir.mkdir(parents=True, exist_ok=True)

    # First re-encode wl4Ey6QOQe4 to clean UTF-8 if present
    p1 = out_dir / "wl4Ey6QOQe4-bettingpros-props.json"
    if p1.exists():
        try:
            with open(p1, "r", encoding="utf-16") as f:
                d = json.load(f)
            with open(p1, "w", encoding="utf-8") as f:
                json.dump(d, f, indent=2)
            print("Successfully normalized wl4Ey6QOQe4 to UTF-8")
        except Exception as e:
            print(f"wl4Ey6QOQe4 already UTF-8 or check needed: {e}")

    results_summary = []

    for vid in VIDEOS:
        out_file = out_dir / f"{vid['id']}-{vid['slug']}.json"
        if out_file.exists() and out_file.stat().st_size > 1000:
            print(f"Skipping already extracted: {vid['id']} ({vid['title']})")
            continue

        print(f"\n==========================================")
        print(f"Processing: {vid['title']} ({vid['show']})")
        print(f"URL: {vid['url']}")
        print(f"==========================================")

        meta = {
            "title": vid["title"],
            "show": vid["show"],
            "date": vid["date"],
        }

        try:
            res = extract_youtube(vid["url"], meta, max_retries=2, retry_delay_seconds=15)
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump(res, f, indent=2)
            
            parsed = res.get("parsed_json") or {}
            picks = parsed.get("extracted_picks") or []
            notes = parsed.get("analysis_notes") or []
            latency = res.get("latency_ms", 0)
            cost = res.get("estimated_cost_usd", 0.0)

            print(f"DONE {vid['id']}: {len(picks)} picks, {len(notes)} notes in {latency/1000:.1f}s (${cost:.4f})")
            results_summary.append({
                "id": vid["id"],
                "show": vid["show"],
                "title": vid["title"],
                "picks_count": len(picks),
                "notes_count": len(notes),
                "cost_usd": cost,
                "latency_ms": latency
            })
        except Exception as e:
            print(f"ERROR processing {vid['id']}: {e}")

    print("\nExtraction Batch Completed.")

if __name__ == "__main__":
    main()
