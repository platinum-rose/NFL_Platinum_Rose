#!/usr/bin/env python3
"""Grade saved defensive prop offers (data/defensive-props/boards/defensive-board-history-<season>.jsonl)
against ESPN box scores, and against the defensive model's pre-game probability.

Box scores: data/fantasy/boxscores, then data/defensive-props/cache (fetched read-only from ESPN with
curl when missing). Model probability uses only games before the offer's week:
  T+A / solo / assists: 0.10 + 0.67 x the player's raw prior hit rate at that threshold
  sacks (1+): prior sack-game rate mapped 0 -> 8%, <=25% -> 10%, <=50% -> 18%, >50% -> 38%
Outputs data/defensive-props/boards/defensive-board-grades-<season>.json and prints a summary.
Usage: python scripts/grade_defensive_boards.py [--season 2026]
"""
import json, os, re, sys, glob, subprocess, statistics, collections

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SEASON = sys.argv[sys.argv.index('--season') + 1] if '--season' in sys.argv else '2026'
B = os.path.join(ROOT, 'data/defensive-props/boards')
CACHE = os.path.join(ROOT, 'data/defensive-props/cache')
SUF = re.compile(r'\b(jr|sr|ii|iii|iv)\b')
nk = lambda n: ' '.join(SUF.sub('', re.sub(r"[.'’\-]", ' ', (n or '').lower())).split())

sched = json.load(open(os.path.join(ROOT, 'public/schedule.json')))
sched = sched if isinstance(sched, list) else sched.get('games', [])
def event_for(week, game):
    a, h = game.split('@')
    for g in sched:
        if str(g.get('season')) == SEASON and int(g.get('week') or 0) == int(week) and {g['visitor'], g['home']} == {a, h}:
            return str(g['id'])
    return None

def summary(eid):
    for p in (os.path.join(ROOT, f'data/fantasy/boxscores/espn-{eid}.json'), os.path.join(CACHE, f'espn-{eid}.json')):
        try:
            d = json.load(open(p))
            if d['header']['competitions'][0]['status']['type']['completed']: return d
        except Exception: pass
    try:
        txt = subprocess.run(['curl', '-s', '-m', '30', f'https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event={eid}'], capture_output=True, text=True).stdout
        d = json.loads(txt)
        if d['header']['competitions'][0]['status']['type']['completed']:
            os.makedirs(CACHE, exist_ok=True); open(os.path.join(CACHE, f'espn-{eid}.json'), 'w').write(txt); return d
    except Exception: pass
    return None

def stats_of(d):
    out = collections.defaultdict(lambda: collections.Counter())
    for tp in d['boxscore']['players']:
        for c in tp['statistics']:
            k = c.get('keys') or []
            for a in c['athletes']:
                s = a['stats']; n = nk(a['athlete']['displayName'])
                g = lambda key: float(str(s[k.index(key)]).split('/')[0]) if key in k else 0.0
                if c['name'] == 'defensive':
                    out[n]['tackles_assists'] += g('totalTackles'); out[n]['tackles'] += g('soloTackles'); out[n]['sacks'] += g('sacks'); out[n]['_def'] = 1
                elif c['name'] == 'interceptions': out[n]['def_int'] += g('interceptions')
                elif c['name'] == 'passing': out[n]['pass_int'] += g('interceptions'); out[n]['_pass'] = 1
    for v in out.values(): v['assists'] = v['tackles_assists'] - v['tackles']
    return out

log = json.load(open(os.path.join(ROOT, f'data/defensive-props/defensive-game-log-{SEASON}.json')))['rows']
hist = collections.defaultdict(list)
for r in log:
    if r['completed']: hist[nk(r['player'])].append(r)
def model_prob(o):
    prior = [r for r in hist.get(nk(o['player']), []) if r['week'] < int(o['week'])]
    if len(prior) < 2: return None
    m = o['market']
    if m in ('tackles_assists', 'tackles', 'assists'):
        key = {'tackles_assists': 'tackles_assists', 'tackles': 'solo', 'assists': 'assists'}[m]
        raw = sum(r[key] >= o['threshold'] for r in prior) / len(prior)
        return 0.10 + 0.67 * raw
    if m == 'sacks' and o['threshold'] == 1:
        rate = sum(r['sacks'] >= 0.5 for r in prior) / len(prior)
        return 0.08 if rate == 0 else 0.10 if rate <= 0.25 else 0.18 if rate <= 0.5 else 0.38
    return None

offers = [json.loads(l) for l in open(os.path.join(B, f'defensive-board-history-{SEASON}.jsonl')) if l.strip()]
latest = {}
for o in offers:  # grade the last price captured before kickoff per book/game/player/market/threshold
    k = (o['book'], o['game'], o['player'], o['market'], o['threshold'])
    if k not in latest or str(o['capturedAt']) > str(latest[k]['capturedAt']): latest[k] = o
graded = []; boxes = {}
for o in latest.values():
    eid = event_for(o['week'], o['game']) if o.get('week') else None
    if not eid: continue
    if eid not in boxes: boxes[eid] = summary(eid)
    d = boxes[eid]
    if not d: continue
    st = stats_of(d).get(nk(o['player']))
    if not st: o['result'] = 'void'; graded.append(o); continue  # not in box score: likely inactive, books void
    v = st[o['market']]
    o['actual'] = v; o['result'] = 'win' if v >= o['threshold'] else 'loss'
    o['model_prob'] = model_prob(o)
    graded.append(o)

def payout(a): return a / 100 if a > 0 else 100 / -a
def summ(xs):
    xs = [x for x in xs if x['result'] in ('win', 'loss')]
    if not xs: return None
    u = sum(payout(x['american']) if x['result'] == 'win' else -1 for x in xs)
    return {'n': len(xs), 'hit': round(sum(x['result'] == 'win' for x in xs) / len(xs), 3), 'avg_implied': round(statistics.mean(x['implied'] for x in xs), 3), 'roi_over': round(u / len(xs), 3)}
res = {'graded': len([g for g in graded if g['result'] in ('win', 'loss')]), 'void': len([g for g in graded if g['result'] == 'void']),
       'by_book_market': {f"{b}:{m}": summ([g for g in graded if g['book'] == b and g['market'] == m]) for b, m in sorted({(g['book'], g['market']) for g in graded})},
       'by_implied': {lab: summ([g for g in graded if lo <= g['implied'] < hi]) for lab, lo, hi in [('<25%', 0, .25), ('25-50%', .25, .5), ('50-70%', .5, .7), ('70%+', .7, 1.01)]},
       'model_vs_price': {
           'model_higher_by_5pts': summ([g for g in graded if g.get('model_prob') is not None and g['model_prob'] - g['implied'] >= 0.05]),
           'within_5pts': summ([g for g in graded if g.get('model_prob') is not None and abs(g['model_prob'] - g['implied']) < 0.05]),
           'model_lower_by_5pts': summ([g for g in graded if g.get('model_prob') is not None and g['implied'] - g['model_prob'] >= 0.05])}}
json.dump({**res, 'offers': graded}, open(os.path.join(B, f'defensive-board-grades-{SEASON}.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
