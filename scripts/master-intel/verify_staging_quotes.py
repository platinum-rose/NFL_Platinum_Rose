#!/usr/bin/env python3
"""Check Antigravity staging files against their own captions (read-only).
For each quote: does it appear (normalized) in the captions within +-90 s of its timestamp?
For each pick: is a price stated anywhere near the timestamp, or was -110 filled in?
Usage: python scripts/master-intel/verify_staging_quotes.py youtube-<id> [...]"""
import json, re, sys, os
D = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'shadow-harness', 'antigravity-staging')
def norm(s): return re.sub(r'[^a-z0-9 ]', ' ', s.lower()).split()
def cap(vid):
    rows = []
    for l in open(os.path.join(D, vid + '.captions.txt'), encoding='utf-8'):
        m = re.match(r'\[(?:(\d+):)?(\d+):(\d+)\]\s*(.*)', l)
        if m: rows.append(((int(m[1] or 0)) * 3600 + int(m[2]) * 60 + int(m[3]), m[4]))
    return rows
def window(rows, t, w=90): return ' '.join(x for s, x in rows if t - w <= s <= t + w)
def found(q, text):
    qs = [p for p in re.split(r'\.\.\.|…', q) if len(norm(p)) >= 3]
    tw = ' '.join(norm(text))
    return all(' '.join(norm(p)) in tw for p in qs) if qs else False
for vid in sys.argv[1:]:
    d = json.load(open(os.path.join(D, vid + '.json'), encoding='utf-8')); rows = cap(vid)
    print(f'== {vid} ({d.get("show")})')
    for q in d.get('quote_timestamps', []):
        ok = found(q['quote'], window(rows, q['timestamp']))
        print(f"  quote {'OK  ' if ok else 'MISS'} @{q['timestamp']} {q['speaker']}: {q['quote'][:80]}")
    for p in d.get('extracted_picks', []):
        txt = window(rows, p['source_timestamp'], 60).lower()
        stated = bool(re.search(r'minus \d+|plus \d+|\b-\d{3}\b|\+\d{3}|juice|vig|even money|odds of', txt))
        print(f"  pick @{p['source_timestamp']} {p['game']} {p['side']} {p['line']} price={p.get('price')} {'(price words nearby)' if stated else '(no price stated nearby)'}")
