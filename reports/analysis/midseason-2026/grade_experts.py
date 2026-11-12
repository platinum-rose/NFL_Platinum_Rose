"""Grade every VERIFIED article/expert/Grok pick (data/generated/master-intel/wNN-expert-verified.json, W4-W9) against cached ESPN box scores.
Reuses scripts/master-intel/grade_podcast_picks.py (load_game, grade, units). Read-only on inputs.
Output: reports/analysis/midseason-2026/expert_grades.jsonl"""
import json, os, re, sys
sys.path.insert(0, 'scripts/master-intel'); import grade_podcast_picks as G
OUT = 'reports/analysis/midseason-2026/expert_grades.jsonl'
STATMAP = [('receiving y', 'receiving_yards'), ('rec y', 'receiving_yards'), ('rushing y', 'rushing_yards'), ('rush y', 'rushing_yards'),
           ('receptions', 'receptions'), ('passing y', 'passing_yards'), ('pass y', 'passing_yards'), ('passing t', 'passing_touchdowns'),
           ('pass t', 'passing_touchdowns'), ('interception', 'interceptions'), ('completion', 'completions'), ('rushing att', 'rushing_attempts'),
           ('carries', 'rushing_attempts'), ('longest rec', 'player_longest_reception'), ('anytime', 'anytime_td'), ('touchdown', 'anytime_td')]
def price_of(s):
    m = re.search(r'\(([+-]\d{3,4})\)', s or ''); return int(m.group(1)) if m else None
import csv, math
SPREAD = {}
for t in csv.DictReader(open('data/archive/2026/season/team-weeks.csv')):
    try: SPREAD[(int(t['week']), G.T({'WSH': 'WAS'}.get(t['team'], t['team'])))] = float(t['line'])
    except (ValueError, TypeError): pass
def ml_from_spread(week, team):
    # closing spread -> win probability (normal, sd 13.5) -> American price with ~4.5% vig; used only when the pick states no price
    L = SPREAD.get((week, G.T(team)))
    if L is None: return None
    p = 0.5 * (1 + math.erf((-L / 13.5) / math.sqrt(2))); p = min(0.97, p * 1.045)
    return round(-100 * p / (1 - p)) if p >= 0.5 else round(100 * (1 - p) / p)
rows = []
for w in range(4, 10):
    d = json.load(open(f'data/generated/master-intel/w{w:02d}-expert-verified.json'))
    gs = json.load(open(f'data/archive/2026/week-{w:02d}/betting/w{w}gamesum.json'))
    games = {(G.T(g['away']), G.T(g['home'])): G.load_game(g['event']) for g in gs}
    for r in d['rows']:
        if r.get('verdict') != 'verified': continue
        m = r.get('market'); game = r.get('game') or ''
        aw, hm = [G.T(x) for x in game.split('@')] if '@' in game else (None, None)
        g = games.get((aw, hm)); raw = {}; pr = r.get('price')
        if m == 'spread' and re.search(r'\b(over|under)\b', (r.get('selection') or '') + ' ' + str(r.get('side')), re.I): raw = {}  # total mis-tagged as a spread
        elif m == 'spread' and r.get('side'): raw = dict(market='spread', side=r['side'], team=r['side'], line=r.get('line'))
        elif m == 'moneyline' and r.get('side'):
            raw = dict(market='moneyline', side=r['side'], team=r['side'])
            if pr is None: pr = ml_from_spread(w, r['side']); raw['price_source'] = 'spread-implied'
        elif m in ('total', 'totals') and r.get('side') and r.get('line') is not None: raw = dict(market='total', side=str(r['side']).split()[0], line=r['line'])
        elif m == 'prop' and r.get('players'):
            sel = (r.get('selection') or '').lower(); side_txt = (r.get('side') or '') + ' ' + sel
            stat = next((v for k, v in STATMAP if k in sel), None)
            dm = re.search(r'\b(over|under)\s+(\d+(?:\.\d+)?)', side_txt, re.I)
            if 'unknown' in side_txt.lower(): raw = {}  # direction not stated (independent re-grade 11/11, s083)
            elif stat == 'anytime_td': raw = dict(market='anytime_td', side='YES', player=r['players'][0], line=0.5)
            elif stat and dm: raw = dict(market=stat, side=dm.group(1).upper(), player=r['players'][0], line=float(dm.group(2)))
            pr = pr if pr is not None else price_of(r.get('side'))
        if not raw: res, why = 'U', f'market {m} not graded (teaser/contest/futures/unparsed)'
        else:
            res, why, _ = G.grade(dict(raw=raw), g)
            res = {'ungradable': 'U'}.get(res, res)
            if str(why).startswith('not in final box score'): res, why = 'V', 'player inactive/absent: void for expert grading (house rule applies to tickets only)'
        rows.append(dict(week=w, kind=r.get('kind'), outlet=r.get('outlet'), persons=r.get('persons') or [], game=game, market=m,
                         graded_market=raw.get('market'), selection=r.get('selection'), line=raw.get('line'), price=pr, best_bet=r.get('best_bet'), price_source=raw.get('price_source', 'stated' if pr is not None else 'assumed -110'),
                         contest=r.get('contest'), result=res, detail=why, units=G.units(pr, res) if res in ('W', 'L', 'P') else None))
with open(OUT, 'w') as f:
    for r in rows: f.write(json.dumps(r, ensure_ascii=False) + '\n')
import collections
c = collections.Counter((r['week'], r['result']) for r in rows); print(len(rows), 'rows'); print(sorted(c.items()))
