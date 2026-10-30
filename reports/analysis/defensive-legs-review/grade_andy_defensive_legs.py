#!/usr/bin/env python3
"""Andy's placed defensive legs (T+A, sacks, INT) for 2026, scored against prices and against
what the defensive model knew before that week. Local only."""
import json, re, os, glob, statistics, collections
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OUT = os.path.dirname(os.path.abspath(__file__))
SUF = re.compile(r'\b(jr|sr|ii|iii|iv)\b')
nk = lambda n: ' '.join(SUF.sub('', re.sub(r"[.'’\-]", ' ', (n or '').lower())).split())

# defender history (ESPN game log) and QB INT history (ESPN summaries)
log = json.load(open(os.path.join(ROOT, 'data/defensive-props/defensive-game-log-2026.json')))['rows']
dhist = collections.defaultdict(list)
for r in log:
    if r['completed']: dhist[nk(r['player'])].append((r['week'], r['tackles_assists'], r['sacks'], r['interceptions']))
qbint = collections.defaultdict(list)
for f in glob.glob(os.path.join(ROOT, 'data/fantasy/boxscores/espn-*.json')) + glob.glob(os.path.join(ROOT, 'data/defensive-props/cache/espn-*.json')):
    try: d = json.load(open(f))
    except Exception: continue
    wk = d.get('header', {}).get('week')
    if not d.get('header', {}).get('competitions', [{}])[0].get('status', {}).get('type', {}).get('completed'): continue
    for tp in d.get('boxscore', {}).get('players', []):
        for c in tp.get('statistics', []):
            if c['name'] == 'passing':
                k = c.get('keys') or []
                for a in c['athletes']:
                    att = str(a['stats'][k.index('completions/passingAttempts')]).split('/')[-1] if 'completions/passingAttempts' in k else '0'
                    if float(att or 0) >= 10:
                        qbint[nk(a['athlete']['displayName'])].append((wk, float(a['stats'][k.index('interceptions')])))
for v in list(dhist.values()) + list(qbint.values()): v.sort()

def implied(price):
    try: p = float(str(price).replace('+', ''))
    except Exception: return None
    return 100 / (p + 100) if p > 0 else -p / (-p + 100)
def payout(price):
    p = float(str(price).replace('+', '')); return p / 100 if p > 0 else 100 / -p
SACK_MAP = lambda r: 0.08 if r == 0 else 0.10 if r <= 0.25 else 0.18 if r <= 0.5 else 0.38   # backtest W3-7
def model_prob(leg):
    nm, wk, line = nk(leg['player']), leg['week'], float(leg['line'] or 0.5)
    m = leg['market']
    if 'tackle' in m:
        h = [t for (w, t, s, i) in dhist.get(nm, []) if w < wk]
        if len(h) < 2: return None, None
        raw = sum(t > line for t in h) / len(h)
        return 0.10 + 0.67 * raw, statistics.mean(h)
    if 'sack' in m:
        h = [s for (w, t, s, i) in dhist.get(nm, []) if w < wk]
        if len(h) < 2: return None, None
        return SACK_MAP(sum(s >= 0.5 for s in h) / len(h)), None
    if 'interception' in m:
        h = [i for (w, i) in qbint.get(nm, []) if w < wk]
        if len(h) >= 2:  # QB INT thrown; shrink the raw rate toward the league ~45%
            raw = sum(i >= 1 for i in h) / len(h); return 0.5 * raw + 0.5 * 0.45, None
        h = [i for (w, t, s, i) in dhist.get(nm, []) if w < wk]  # defender INT
        if len(h) >= 2: return 0.5 * (sum(i > 0 for i in h) / len(h)) + 0.5 * 0.08, None
    return None, None

w = json.load(open(os.path.join(ROOT, 'data/official-picks/user-placed-wagers-2026.json')))
legs = []
for r in w:
    for l in r.get('legs', []):
        m = (l.get('market') or '').lower(); s = l.get('selection') or ''
        if not re.search(r'tackle|sack|interception', m + ' ' + s, re.I) or l.get('status') not in ('WON', 'LOST', 'PUSH'): continue
        if re.search(r'\bunder\b', s, re.I): continue  # overs only (all but a handful)
        x = {'week': r.get('week'), 'book': r.get('book'), 'ticket': r.get('ticket_number'), 'player': l.get('player'), 'market': 'tackles' if 'tackle' in m else 'sacks' if 'sack' in m else 'INT',
             'line': l.get('line'), 'price': l.get('price'), 'status': l['status'], 'actual': l.get('actual_stat'), 'ticket_result': r.get('result')}
        x['implied'] = implied(x['price']) if x['price'] is not None else None
        x['model_prob'], x['prior_avg'] = model_prob({**x, 'market': m})
        legs.append(x)

def summ(xs):
    g = [x for x in xs if x['status'] != 'PUSH']
    if not g: return None
    won = sum(x['status'] == 'WON' for x in g)
    pr = [x for x in g if x['implied'] is not None]
    units = sum((payout(x['price']) if x['status'] == 'WON' else -1) for x in pr)
    mp = [x for x in g if x['model_prob'] is not None]
    return {'n': len(g), 'won': won, 'hit': round(won / len(g), 3), 'priced_n': len(pr),
            'avg_implied': round(statistics.mean(x['implied'] for x in pr), 3) if pr else None,
            'units_if_straights': round(units, 2), 'roi_if_straights': round(units / len(pr), 3) if pr else None,
            'avg_model_prob': round(statistics.mean(x['model_prob'] for x in mp), 3) if mp else None, 'model_n': len(mp)}
res = {'all': summ(legs), 'by_market': {m: summ([x for x in legs if x['market'] == m]) for m in ('tackles', 'sacks', 'INT')}}
# model vs price
for m in ('tackles', 'sacks', 'INT'):
    xs = [x for x in legs if x['market'] == m and x['model_prob'] is not None and x['implied'] is not None]
    res[f'{m}_model_above_price'] = summ([x for x in xs if x['model_prob'] >= x['implied']])
    res[f'{m}_model_below_price'] = summ([x for x in xs if x['model_prob'] < x['implied']])
# tackles: line vs prior average
t = [x for x in legs if x['market'] == 'tackles' and x['prior_avg'] is not None]
res['tackles_line_vs_avg'] = {lab: summ([x for x in t if f(float(x['line']) - x['prior_avg'])]) for lab, f in [('line <= avg-1', lambda d: d <= -1), ('avg-1 < line <= avg', lambda d: -1 < d <= 0), ('line > avg', lambda d: d > 0)]}
res['by_week'] = {wk: summ([x for x in legs if x['week'] == wk]) for wk in sorted({x['week'] for x in legs})}
json.dump({'summary': res, 'legs': legs}, open(os.path.join(OUT, 'andy-defensive-legs-2026-w01-w08.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
