"""Defender tackles+assists model split by opponent run vs pass volume (Claude, 2026-11-15).
Builds per-player run-tackle and pass-tackle rates from nflverse PBP, predicts T+A from the opponent's
expected rush plays and completions+sacks, and walk-forward backtests against a plain prior-average baseline.
Usage: python scripts/analysis/def_tackle_split_model.py [--backtest] [--predict-week 10] > out
Writes /tmp/def_split_pbp.json cache. Local files only."""
import csv, gzip, json, math, sys, collections, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PBP = os.path.join(ROOT, 'data/nflverse/2026/play_by_play_2026.csv.gz')
CACHE = '/tmp/def_split_pbp.json'

def load():
    if os.path.exists(CACHE) and os.path.getmtime(CACHE) > os.path.getmtime(PBP):
        return json.load(open(CACHE))
    P = {}  # (game, pid) -> dict
    T = {}  # (game, offense team) -> rush, comp_sack, opp
    G = {}
    cols_s = ['solo_tackle_1', 'solo_tackle_2', 'assist_tackle_1', 'assist_tackle_2', 'assist_tackle_3', 'assist_tackle_4', 'tackle_with_assist_1', 'tackle_with_assist_2']
    for r in csv.DictReader(gzip.open(PBP, 'rt')):
        if r.get('season_type') != 'REG' or r.get('play_type') not in ('run', 'pass'): continue
        g = r['game_id']; off = r['posteam']; de = r['defteam']; w = int(float(r['week']))
        G[g] = w
        t = T.setdefault(f'{g}|{off}', dict(g=g, w=w, off=off, de=de, rush=0, cs=0, plays=0))
        t['plays'] += 1
        kind = 'run' if r['play_type'] == 'run' else 'pass'
        if kind == 'run': t['rush'] += 1
        elif r.get('complete_pass') in ('1', '1.0') or r.get('sack') in ('1', '1.0'): t['cs'] += 1
        for c in cols_s:
            pid = r.get(c + '_player_id'); tm = r.get(c + '_team')
            if not pid or tm != de: continue
            p = P.setdefault(f'{g}|{pid}', dict(g=g, w=w, pid=pid, name=r.get(c + '_player_name'), team=de, opp=off, run=0, pas=0))
            p[kind if kind == 'run' else 'pas'] += 1
    out = dict(P=list(P.values()), T=list(T.values()))
    json.dump(out, open(CACHE, 'w'))
    return out

def build(D, before_week):
    """Rates from games with w < before_week."""
    off = collections.defaultdict(lambda: [0, 0, 0]); de = collections.defaultdict(lambda: [0, 0, 0])
    for t in D['T']:
        if t['w'] >= before_week: continue
        off[t['off']][0] += t['rush']; off[t['off']][1] += t['cs']; off[t['off']][2] += 1
        de[t['de']][0] += t['rush']; de[t['de']][1] += t['cs']; de[t['de']][2] += 1
    faced = {(t['g'], t['de']): t for t in D['T']}
    pl = collections.defaultdict(lambda: dict(run=0, pas=0, ta=[], rush_f=0, cs_f=0, team=None, name=None))
    for p in D['P']:
        if p['w'] >= before_week: continue
        q = pl[p['pid']]; f = faced[(p['g'], p['team'])]
        q['run'] += p['run']; q['pas'] += p['pas']; q['ta'].append(p['run'] + p['pas'])
        q['rush_f'] += f['rush']; q['cs_f'] += f['cs']; q['team'] = p['team']; q['name'] = p['name']
    return off, de, pl

def predict(q, opp, team, off, de):
    o = off[opp]; d = de[team]
    exp_rush = (o[0] / o[2] + d[0] / d[2]) / 2
    exp_cs = (o[1] / o[2] + d[1] / d[2]) / 2
    rr = q['run'] / q['rush_f'] if q['rush_f'] else 0
    pr = q['pas'] / q['cs_f'] if q['cs_f'] else 0
    return rr * exp_rush + pr * exp_cs, exp_rush, exp_cs, rr, pr

def pois_ge(l, k):
    return 1 - sum(math.exp(-l) * l ** i / math.factorial(i) for i in range(k))

def backtest(D):
    res = []
    for wk in range(4, 10):
        off, de, pl = build(D, wk)
        for p in D['P']:
            if p['w'] != wk: continue
            q = pl.get(p['pid'])
            if not q or len(q['ta']) < 3: continue
            base = sum(q['ta']) / len(q['ta'])
            if base < 3: continue
            m2, er, ec, rr, pr = predict(q, p['opp'], p['team'], off, de)
            # volume-only baseline: prior avg scaled by expected opponent plays vs plays faced
            n = len(q['ta']); faced = (q['rush_f'] + q['cs_f']) / n
            m1 = base * (er + ec) / faced if faced else base
            res.append(dict(w=wk, y=p['run'] + p['pas'], base=base, m1=m1, m2=m2, line=math.floor(base) + 0.5))
    def mae(k): return sum(abs(r[k] - r['y']) for r in res) / len(res)
    def ll(k):
        s = 0
        for r in res:
            pr = min(max(pois_ge(r[k], int(r['line'] + 0.5)), 0.02), 0.98); y = r['y'] > r['line']
            s += -math.log(pr if y else 1 - pr)
        return s / len(res)
    print(f'n={len(res)} player-games (weeks 4-9, prior avg >=3, >=3 prior games)')
    for k in ('base', 'm1', 'm2'): print(f'  {k:4}  MAE {mae(k):.3f}   logloss over(floor(avg)+0.5) {ll(k):.4f}')
    # betting-relevant: when split model disagrees with baseline by >=1 tackle, which way does the result go?
    for thr in (0.75, 1.0, 1.5):
        up = [r for r in res if r['m2'] - r['base'] >= thr]; dn = [r for r in res if r['base'] - r['m2'] >= thr]
        hu = sum(r['y'] > r['line'] for r in up) / max(1, len(up)); hd = sum(r['y'] > r['line'] for r in dn) / max(1, len(dn))
        allr = sum(r['y'] > r['line'] for r in res) / len(res)
        print(f'  split model vs baseline >= {thr}: model HIGHER n={len(up)} over-hit {hu:.3f} | model LOWER n={len(dn)} over-hit {hd:.3f} | all {allr:.3f}')
    return res

if __name__ == '__main__':
    D = load()
    if '--backtest' in sys.argv: backtest(D)
