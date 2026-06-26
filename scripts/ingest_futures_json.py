#!/usr/bin/env python3
"""Ingest a parsed futures-imports JSON file (uniform snapshot rows) into Supabase
`futures_odds_snapshots`. Idempotent upsert on (market_type, team, book, snapshot_time).

This is the standard path for loading a parsed export:
  parse export -> data/futures-imports/<book>-<YYYY-MM-DD>.json (tracked) -> this script on M6.

Usage:
  python3 scripts/ingest_futures_json.py data/futures-imports/bookmaker-2026-05-17.json
  python3 scripts/ingest_futures_json.py <file.json> --dry-run     # parse + summarize, no DB write

Env (for non-dry ingest): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (read from .env or environment).
"""
import json, os, sys, urllib.request, urllib.error
from collections import Counter

# Uniform key set PostgREST bulk upsert requires (all objects share these keys).
KEYS = ['snapshot_time', 'captured_at', 'season', 'book', 'market_type', 'team',
        'selection', 'odds', 'price', 'implied_prob', 'line', 'over_price', 'under_price']


def load_env(path='.env'):
    env = dict(os.environ)
    if os.path.exists(path):
        for line in open(path):
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                env.setdefault(k, v.strip().strip('"').strip("'"))
    return env


def main():
    files = [a for a in sys.argv[1:] if not a.startswith('--')]
    dry = '--dry-run' in sys.argv
    if not files:
        sys.exit('usage: ingest_futures_json.py <file.json> [--dry-run]')
    fn = files[0]
    raw = json.load(open(fn))
    rows = [{k: r.get(k) for k in KEYS} for r in raw]

    by_mkt = Counter(r['market_type'] for r in rows)
    books = sorted({r['book'] for r in rows})
    dates = sorted({str(r['snapshot_time'])[:10] for r in rows})
    print(f'{fn}: {len(rows)} rows | books={books} | dates={dates}')
    for k in sorted(by_mkt):
        print(f'  {k}: {by_mkt[k]}')

    if dry:
        print('[dry-run] no DB write')
        return

    env = load_env()
    if not env.get('SUPABASE_URL') or not env.get('SUPABASE_SERVICE_ROLE_KEY'):
        sys.exit('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (set in .env or environment)')
    url = env['SUPABASE_URL'].rstrip('/') + \
        '/rest/v1/futures_odds_snapshots?on_conflict=market_type,team,book,snapshot_time'
    key = env['SUPABASE_SERVICE_ROLE_KEY']
    req = urllib.request.Request(
        url, data=json.dumps(rows).encode(), method='POST',
        headers={'apikey': key, 'Authorization': f'Bearer {key}',
                 'Content-Type': 'application/json',
                 'Prefer': 'resolution=merge-duplicates,return=minimal'})
    try:
        resp = urllib.request.urlopen(req, timeout=60)
        print(f'OK {resp.status} — upserted {len(rows)} rows')
    except urllib.error.HTTPError as e:
        print('HTTP', e.code, e.read().decode()[:600])
        sys.exit(1)


if __name__ == '__main__':
    main()
