"""Kalshi game-winner calibration: last snapshot before each game (KXNFLGAME), vs results and vs the spread-implied probability. Output kalshi_scores.json"""
import json, glob, csv, math, re, datetime, collections, os
fix = {'WSH': 'WAS', 'LA': 'LAR', 'JAC': 'JAX'}
res, spread, kick = {}, {}, {}
for r in csv.DictReader(open('data/archive/2026/season/team-weeks.csv')):
    t, o = fix.get(r['team'], r['team']), fix.get(r['opp'], r['opp']); w = int(r['week'])
    res[(w, t)] = float(r['pts']) > float(r['opp_pts']) if r['pts'] != r['opp_pts'] else None
    try: spread[(w, t)] = float(r['line'])
    except ValueError: pass
S = json.load(open('public/schedule.json'))
for g in S:
    for t in (g['visitor'], g['home']): kick[(g['week'], fix.get(t, t))] = g['kickoff_utc']
snaps = sorted(glob.glob('data/prediction-markets/prediction-markets-2026-*.json'))
best = {}
for p in snaps:
    d = json.load(open(p)); day = os.path.basename(p)[23:33]
    cs = next((v for v in d.values() if isinstance(v, list) and len(v) > 50), [])
    for c in cs:
        if c.get('series_ticker') != 'KXNFLGAME': continue
        team = fix.get(c['ticker'].split('-')[-1], c['ticker'].split('-')[-1]); pct = c.get('implied_probability_pct')
        if pct is None: continue
        for w in range(1, 10):
            k = kick.get((w, team))
            if k and day <= k[:10] and (w, team) in res:
                key = (w, team)
                if key not in best or day >= best[key][0]: best[key] = (day, pct / 100)
rows = []
for (w, t), (day, p) in best.items():
    y = res[(w, t)]
    if y is None: continue
    L = spread.get((w, t)); ps = 0.5 * (1 + math.erf((-L / 13.5) / math.sqrt(2))) if L is not None else None
    rows.append(dict(week=w, team=t, snap=day, p_kalshi=p, p_spread=ps, won=int(y)))
def brier(k): r = [x for x in rows if x[k] is not None]; return round(sum((x[k] - x['won']) ** 2 for x in r) / len(r), 4), len(r)
bins = collections.defaultdict(lambda: [0, 0])
for x in rows: b = min(9, int(x['p_kalshi'] * 10)); bins[b][0] += x['won']; bins[b][1] += 1
out = dict(n=len(rows), brier_kalshi=brier('p_kalshi'), brier_spread_implied=brier('p_spread'),
           reliability={f'{b*10}-{b*10+10}%': f'{v[0]}/{v[1]}' for b, v in sorted(bins.items())},
           note='Kalshi price from the last stored snapshot on or before game day (snapshots are irregular, often 1-4 days early). Each game appears twice (both teams).')
json.dump(dict(summary=out, rows=rows), open('reports/analysis/midseason-2026/kalshi_scores.json', 'w'), indent=1)
print(out)
