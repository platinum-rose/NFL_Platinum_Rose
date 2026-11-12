"""Grade the W9 analytic prop hit-rate screen (reports/intel/w09-model/card-w09-screen.json pool) against box scores. Output prop_screen_scores.json"""
import json, sys, collections
sys.path.insert(0, 'scripts/master-intel'); import grade_podcast_picks as G
d = json.load(open('reports/intel/w09-model/card-w09-screen.json'))
gs = json.load(open('data/archive/2026/week-09/betting/w9gamesum.json'))
games = {(G.T(g['away']), G.T(g['home'])): G.load_game(g['event']) for g in gs}
MK = {'pass_yds': 'passing_yards', 'pass_cmp': 'completions', 'pass_td': 'pass_tds', 'rush_yds': 'rush_yds', 'carries': 'rushing_attempts', 'rec': 'receptions', 'rec_yds': 'rec_yds'}
rows = []
for c in d['pool']:
    a, h = c['gid'].split('@'); g = games.get((G.T(a), G.T(h)))
    raw = dict(market=MK[c['mk']], side=c['side'].upper(), player=c['player'], line=c['line'])
    res, why, _ = G.grade(dict(raw=raw), g)
    if str(why).startswith('not in final box score'): res = 'V'
    rows.append(dict(game=c['gid'], player=c['player'], mk=c['mk'], side=c['side'], line=c['line'], odds=c['odds'], edge=round(c['edge'], 3),
                     grade=c['grade'], far=c['far'], result=res, units=G.units(c['odds'], res) if res in ('W', 'L', 'P') else None))
agg = collections.defaultdict(lambda: [0, 0, 0.0])
for r in rows:
    if r['result'] not in ('W', 'L'): continue
    for k in (f"grade {r['grade']}", 'edge >= 10 pts' if r['edge'] >= 0.10 else 'edge 0-10 pts' if r['edge'] > 0 else 'edge <= 0', f"side {r['side']}", f"mk {r['mk']}", 'far-off (role news)' if r['far'] else 'normal'):
        x = agg[k]; x[0] += r['result'] == 'W'; x[1] += 1; x[2] += r['units'] or 0
out = {k: dict(w=v[0], n=v[1], pct=round(v[0] / v[1] * 100, 1), units=round(v[2], 2)) for k, v in sorted(agg.items())}
json.dump(dict(summary=out, rows=rows), open('reports/analysis/midseason-2026/prop_screen_scores.json', 'w'), indent=1)
for k, v in out.items(): print(f'{k:24} {v}')
