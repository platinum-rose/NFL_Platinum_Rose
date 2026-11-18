#!/usr/bin/env python3
"""Write data/generated/props/bookmaker-gamelines-<date>-week<N>.raw.txt from a Bookmaker capture.

The synthesis queue (build-game-synthesis-queue.py) and the final gate (L2) read this file. It used to be written by hand
from bookmaker-live-<date>-week<N>.json; this does the same thing (2026-11-17). Main lines only.
Format per game:  AWY@HOM AWY +x odds | HOM -x odds | oT odds | uT odds | ML AWY odds HOM odds

  python3 scripts/props/bkr-gamelines-from-live.py data/generated/props/bookmaker-live-2026-11-17-week11.json
"""
import json, os, re, sys, datetime as dt

ABBR = {'Arizona Cardinals': 'ARI', 'Atlanta Falcons': 'ATL', 'Baltimore Ravens': 'BAL', 'Buffalo Bills': 'BUF', 'Carolina Panthers': 'CAR',
        'Chicago Bears': 'CHI', 'Cincinnati Bengals': 'CIN', 'Cleveland Browns': 'CLE', 'Dallas Cowboys': 'DAL', 'Denver Broncos': 'DEN',
        'Detroit Lions': 'DET', 'Green Bay Packers': 'GB', 'Houston Texans': 'HOU', 'Indianapolis Colts': 'IND', 'Jacksonville Jaguars': 'JAX',
        'Kansas City Chiefs': 'KC', 'Las Vegas Raiders': 'LV', 'Los Angeles Chargers': 'LAC', 'Los Angeles Rams': 'LAR', 'Miami Dolphins': 'MIA',
        'Minnesota Vikings': 'MIN', 'New England Patriots': 'NE', 'New Orleans Saints': 'NO', 'New York Giants': 'NYG', 'New York Jets': 'NYJ',
        'Philadelphia Eagles': 'PHI', 'Pittsburgh Steelers': 'PIT', 'San Francisco 49ers': 'SF', 'Seattle Seahawks': 'SEA',
        'Tampa Bay Buccaneers': 'TB', 'Tennessee Titans': 'TEN', 'Washington Commanders': 'WAS'}

def num(x): return f'{x:g}'
def odds(x): return f'{int(x):+d}' if x is not None else '?'

src = sys.argv[1]
m = re.search(r'bookmaker-live-(\d{4}-\d{2}-\d{2})-week(\d+)\.json$', src.replace('\\', '/'))
if not m: sys.exit('expected a bookmaker-live-<date>-week<N>.json path')
day, week = m.groups()
d = json.load(open(src, encoding='utf-8'))
by = {}
for r in d['rows']:
    if r.get('market') != 'game_lines' or not r.get('available', True): continue
    by.setdefault(r['event'], []).append(r)
lines, missing = [], []
for ev, rows in by.items():
    away, home = [s.strip() for s in ev.split(' @ ')]
    a, h = ABBR.get(away), ABBR.get(home)
    if not a or not h: missing.append(ev); continue
    get = lambda bet, side: next((r for r in rows if r['bet'] == bet and r['side'] == side), None)
    sa, sh, ov, un, ma, mh = get('spread', away), get('spread', home), get('total', 'Over'), get('total', 'Under'), get('moneyline', away), get('moneyline', home)
    if not (sa and sh and ov and un):
        missing.append(f'{ev} (spread/total incomplete)'); continue
    ml = f" | ML {a} {odds(ma['odds'])} {h} {odds(mh['odds'])}" if ma and mh else ''
    lines.append(f"{a}@{h} {a} {sa['line']:+g} {odds(sa['odds'])} | {h} {sh['line']:+g} {odds(sh['odds'])} | o{num(ov['line'])} {odds(ov['odds'])} | u{num(un['line'])} {odds(un['odds'])}{ml}")
cap = d.get('capturedAt')
pt = dt.datetime.fromisoformat(cap.replace('Z', '+00:00')) - dt.timedelta(hours=8) if cap else None
head = (f"BKR GAME LINES from cron-bkr-scrape.mjs capture (new /sportsbook site) {cap} ({pt.strftime('%a %Y-%m-%d ~%I:%M %p PT') if pt else '?'}; "
        f"main lines only; format: spread, total, ML for away/home). Source: {os.path.relpath(src).replace(os.sep, '/')}. Written by scripts/props/bkr-gamelines-from-live.py.")
out = os.path.join(os.path.dirname(src), f'bookmaker-gamelines-{day}-week{week}.raw.txt')
open(out, 'w', encoding='utf-8').write(head + '\n' + '\n'.join(lines) + '\n')
print(f'{len(lines)} games -> {out}')
for x in missing: print('  skipped:', x)
