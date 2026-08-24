#!/usr/bin/env python3
"""
Automated Gemini 2.0 Flash Vision OCR Parser for BetOnline (BEO) Futures Screenshots.
Parses all 10 screenshots in docs/Futures_Odds/ dated 2026-08-22 and generates:
1. data/futures-imports/betonline-2026-08-22.json
2. docs/FUTURES_ODDS_BETONLINE_2026-08-22_MANUAL_REVIEW.md
"""

import os
import sys
import base64
import json
import requests
import time
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).resolve().parent.parent
FUTURES_ODDS_DIR = ROOT / 'docs' / 'Futures_Odds'
OUT_JSON = ROOT / 'data' / 'futures-imports' / 'betonline-2026-08-22.json'
OUT_MD = ROOT / 'docs' / 'FUTURES_ODDS_BETONLINE_2026-08-22_MANUAL_REVIEW.md'

API_KEY = os.getenv('GEMINI_API_KEY')
if not API_KEY:
    print('❌ Error: GEMINI_API_KEY environment variable not set!')
    sys.exit(1)

GEMINI_URL = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={API_KEY}'

FILES_TO_PARSE = [
    {'file': 'BEO_SB_0822.PNG', 'market': 'superbowl'},
    {'file': 'BEO_Conf_0822.PNG', 'market': 'conference'},
    {'file': 'BEO_Div_0822.PNG', 'market': 'division'},
    {'file': 'BEO_RegWins1_0822.PNG', 'market': 'wins'},
    {'file': 'BEO_RegWins2_0822.PNG', 'market': 'wins'},
    {'file': 'BEO_RegWins3_0822.PNG', 'market': 'wins'},
    {'file': 'BEO_MakePlayoffs1_0822.PNG', 'market': 'playoffs'},
    {'file': 'BEO_MakePlayoffs2_0822.PNG', 'market': 'playoffs'},
    {'file': 'BEO_MakePlayoffs3_0822.PNG', 'market': 'playoffs'},
    {'file': 'BEO_Seeding_Exacta.PNG', 'market': 'exacta'},
]

PROMPT_MAP = {
    'superbowl': '''Analyze this BetOnline (BEO) Super Bowl odds screenshot from August 22, 2026.
Extract all NFL team names and American odds (e.g., +475, +1000, +1600).
Return ONLY a valid JSON array of objects:
[
  {"team": "Full NFL Team Name", "odds": 475}, ...
]''',
    'conference': '''Analyze this BetOnline (BEO) NFC/AFC Conference Winner odds screenshot from August 22, 2026.
Extract all NFL team names, conference (NFC or AFC), and American odds.
Return ONLY a valid JSON array of objects:
[
  {"team": "Full NFL Team Name", "conference": "NFC", "odds": 275}, ...
]''',
    'division': '''Analyze this BetOnline (BEO) Division Winner odds screenshot from August 22, 2026.
Extract all NFL team names, division (e.g. AFC East, NFC West), and American odds.
Return ONLY a valid JSON array of objects:
[
  {"team": "Full NFL Team Name", "division": "NFC West", "odds": 115}, ...
]''',
    'wins': '''Analyze this BetOnline (BEO) Regular Season Win Totals screenshot from August 22, 2026.
Extract each NFL team name, win total line (e.g. 9.5), Over American price (e.g. -115), and Under American price (e.g. -105).
Return ONLY a valid JSON array of objects:
[
  {"team": "Full NFL Team Name", "line": 9.5, "over_price": -115, "under_price": -105}, ...
]''',
    'playoffs': '''Analyze this BetOnline (BEO) Make/Miss Playoffs Yes/No odds screenshot from August 22, 2026.
Extract each NFL team name, Yes price (e.g. -140), and No price (e.g. +110).
Return ONLY a valid JSON array of objects:
[
  {"team": "Full NFL Team Name", "yes_price": -140, "no_price": 110}, ...
]''',
    'exacta': '''Analyze this BetOnline (BEO) Seeding / Exacta odds screenshot from August 22, 2026.
Extract selection label and American odds.
Return ONLY a valid JSON array of objects:
[
  {"selection": "Selection Label", "odds": 500}, ...
]'''
}

def parse_image_with_gemini(img_path, prompt):
    img_bytes = img_path.read_bytes()
    base64_data = base64.b64encode(img_bytes).decode('utf-8')
    mime_type = 'image/png' if img_path.suffix.lower() == '.png' else 'image/jpeg'

    payload = {
        'contents': [{
            'parts': [
                {'text': prompt},
                {'inlineData': {'mimeType': mime_type, 'data': base64_data}}
            ]
        }],
        'generationConfig': {'responseMimeType': 'application/json'}
    }

    for attempt in range(1, 7):
        try:
            resp = requests.post(GEMINI_URL, json=payload, timeout=90)
            if resp.status_code == 200:
                data = resp.json()
                raw_text = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                if raw_text:
                    return json.loads(raw_text)
            else:
                print(f'[WARN] Gemini Vision API error ({resp.status_code}): {resp.text}', flush=True)
                time.sleep(4 * attempt)
        except Exception as err:
            print(f'[WARN] Attempt {attempt} failed ({err}). Retrying in {4 * attempt}s...', flush=True)
            time.sleep(4 * attempt)
    return []

def main():
    print('=======================================================')
    print('  BetOnline (BEO) Screenshot Ingestion Pipeline')
    print('  Target Date: 2026-08-22  | Provider: Gemini 2.0 Flash')
    print('=======================================================\n')

    all_records = []
    
    for item in FILES_TO_PARSE:
        fname = item['file']
        market = item['market']
        fpath = FUTURES_ODDS_DIR / fname

        if not fpath.exists():
            print(f'[WARN] File not found: {fname}, skipping...')
            continue

        print(f'[OCR] Processing screenshot {fname} ({market})...', flush=True)
        prompt = PROMPT_MAP.get(market, PROMPT_MAP['superbowl'])
        parsed = []
        for s_attempt in range(1, 4):
            parsed = parse_image_with_gemini(fpath, prompt)
            if parsed:
                break
            print(f'  -> Screenshot attempt {s_attempt} returned 0 items. Retrying in 5s...', flush=True)
            time.sleep(5)
            
        print(f'  -> Extracted {len(parsed)} items from {fname}', flush=True)

        for rec in parsed:
            rec['captured_at'] = '2026-08-22T12:00:00Z'
            rec['snapshot_time'] = '2026-08-22T12:00:00Z'
            rec['season'] = 2026
            rec['book'] = 'betonline'
            rec['market_type'] = market
            rec['source_file'] = fname
            all_records.append(rec)

    print(f'\nTotal raw records extracted across all 10 screenshots: {len(all_records)}', flush=True)

    # Format JSON payload according to data/futures-imports schema
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)

    json_payload = {
        'snapshot_time': '2026-08-22T12:00:00Z',
        'captured_at': '2026-08-22T12:00:00Z',
        'season': 2026,
        'book': 'betonline',
        'records_count': len(all_records),
        'records': all_records
    }

    OUT_JSON.write_text(json.dumps(json_payload, indent=2), encoding='utf-8')
    print(f'Saved BEO futures import JSON: {OUT_JSON}', flush=True)

    # Write Markdown Review Summary
    md_content = f"""# BetOnline Futures Odds — Manual Review (2026-08-22)

**Snapshot Time:** `2026-08-22T12:00:00Z`  
**Book:** `betonline`  
**Total Ingested Records:** `{len(all_records)}`  
**Source Screenshots:** `docs/Futures_Odds/BEO_*_0822.PNG`

## Overview
This document presents the Gemini 2.0 Flash Vision OCR extraction of the 10 BetOnline futures screenshots taken on August 22, 2026.

### Market Record Breakdown:
- Super Bowl Winner: `{len([r for r in all_records if r.get('market_type') == 'superbowl'])}` teams
- Conference Winner: `{len([r for r in all_records if r.get('market_type') == 'conference'])}` teams
- Division Winner: `{len([r for r in all_records if r.get('market_type') == 'division'])}` teams
- Win Totals: `{len([r for r in all_records if r.get('market_type') == 'wins'])}` teams
- Make/Miss Playoffs: `{len([r for r in all_records if r.get('market_type') == 'playoffs'])}` teams
- Seeding / Exactas: `{len([r for r in all_records if r.get('market_type') == 'exacta'])}` items
"""

    OUT_MD.write_text(md_content, encoding='utf-8')
    print(f'Saved Markdown Review: {OUT_MD}')

    print('\nDone!')

if __name__ == '__main__':
    main()
