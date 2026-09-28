"""T2-D: basket redesign. Monte Carlo of weekly baskets with leg-class edges estimated from W1-3 (placed + AI-only unique
priced positions, shrunk toward a no-edge prior), same-game correlation via a Gaussian copula, three edge scenarios.
Replaces nothing of Codex's C4; swap in C4's per-class edges when it lands. Output ../t2d_basket.json."""
import json, os, collections, math
import numpy as np
from core import *

R0 = 0.95   # prior: a typical -110-ish leg returns ~0.95 per $1 (vig)
N0 = 30     # prior strength (pseudo-legs)
RNG = np.random.default_rng(20260928)
NSIM = 40000
CLASS_OF = {'Moneyline (dog)': 'dog ML', 'Moneyline (fav)': 'fav ML', 'Spread (dog)': 'dog spread', 'Spread (fav)': 'fav spread',
            'Total Under': 'total under', 'Total Over': 'total over', 'Passing TDs': 'pass TD over', 'QB INT thrown': 'QB INT yes',
            'Anytime TD': 'anytime TD', '2+ TD': '2+ TD', 'First TD': 'first TD', 'Receptions': 'receptions', 'Receiving yds': 'rec yds',
            'Rushing yds': 'rush yds', 'Tackles+Ast': 'tackles', 'Sacks': 'sacks', 'QB rushing yds': 'QB rush yds', 'QB volume': 'QB volume', 'Carries': 'carries'}

def class_edges(P):
    E = {}
    for c in sorted({CLASS_OF.get(p['cat']) for p in P if CLASS_OF.get(p['cat'])}):
        rows = [p for p in P if CLASS_OF.get(p['cat']) == c and p.get('dec')]
        if not rows: continue
        n = len(rows); ret = sum(p['dec'] for p in rows if p['result'] == 'W') / n
        r = R0 + (ret - R0) * n / (n + N0)
        # sampling SE of the per-$ return (for the scenario band)
        se = math.sqrt(sum(((p['dec'] if p['result'] == 'W' else 0) - ret) ** 2 for p in rows) / max(n - 1, 1) / n)
        E[c] = dict(n=n, raw=ret, shrunk=r, se=se, med_dec=float(np.median([p['dec'] for p in rows])), z=(ret - R0) / se if se else 0)
    return E

# ---- ticket templates: (name, stake, structure, legs=[(class, game_id)], extra)
def T(name, stake, kind, legs, **kw): return dict(name=name, stake=stake, kind=kind, legs=legs, **kw)
def parlay(cls_list, game=None): return [(c, game if game is not None else i) for i, c in enumerate(cls_list)]
def baskets():
    B = {}
    # W1-3 actual average weekly mix (Team 1 structures, representative leg mixes from the placed tickets)
    B['A. W1-3 actual mix (~$410/wk)'] = [
        T('1-2 leg side tickets', 81, 'parlay', parlay(['fav spread', 'dog spread'])),
        T('2-team RR (5 dog MLs)', 29, 'rr2', parlay(['dog ML'] * 5)),
        T('3-4 leg parlays', 23, 'parlay', parlay(['fav ML', 'dog spread', 'total under', 'fav spread'])),
        T('5-6 leg prop stacks', 127, 'parlay', parlay(['receptions', 'rec yds', 'anytime TD', 'rush yds', 'pass TD over', 'tackles'], game=None), split=5),
        T('7+ leg longshots', 48, 'parlay', parlay(['anytime TD', 'receptions', 'rec yds', 'rush yds', 'sacks', 'fav ML', 'total under', 'rec yds']), split=6),
        T('4-team master RR (8 sides, 70 combos)', 105, 'rr4', parlay(['fav spread', 'fav spread', 'dog spread', 'dog spread', 'dog spread', 'total under', 'total over', 'fav spread'])),
    ]
    B['B. Team 1 playbook (~$240/wk)'] = [
        T('2-team RRs (dog MLs)', 35, 'rr2', parlay(['dog ML'] * 5)),
        T('1-2 leg tickets', 45, 'parlay', parlay(['pass TD over', 'anytime TD']), split=3),
        T('SuperContest 5-team', 15, 'parlay', parlay(['fav spread', 'dog spread', 'fav spread', 'dog spread', 'fav spread'])),
        T('master RR (70 x $0.50)', 35, 'rr4', parlay(['fav spread', 'fav spread', 'dog spread', 'dog spread', 'dog spread', 'total under', 'total over', 'fav spread'])),
        T('5+ leg parlays (4 x $5)', 20, 'parlay', parlay(['anytime TD', 'receptions', 'rec yds', 'rush yds', 'pass TD over']), split=4),
        T('island ladders (3 games x $30, 4 legs, one game)', 90, 'parlay', [('rec yds', 0), ('rush yds', 0), ('receptions', 0), ('anytime TD', 0)], split=3, sgp=True),
    ]
    B['C. Team 2 core (~$165/wk)'] = [
        T('2-team RR, 4-5 dog MLs', 25, 'rr2', parlay(['dog ML'] * 5)),
        T('SuperContest 5-team', 15, 'parlay', parlay(['fav spread', 'dog spread', 'fav spread', 'dog spread', 'fav spread'])),
        T('SuperContest 2-team RR', 10, 'rr2', parlay(['fav spread', 'dog spread', 'fav spread', 'dog spread', 'fav spread'])),
        T('QB-market singles (pass TD over / INT yes)', 40, 'single', parlay(['pass TD over', 'QB INT yes', 'pass TD over', 'QB INT yes']), split=4),
        T('hand-built 2-leg prop tickets (ATD + QB)', 30, 'parlay', parlay(['anytime TD', 'pass TD over']), split=3),
        T('islands: 1 ticket/game, <=3 legs, one game', 30, 'parlay', [('pass TD over', 0), ('anytime TD', 0), ('QB INT yes', 0)], split=3, sgp=True),
        T('lotto: one 5-leg ATD/QB parlay', 10, 'parlay', parlay(['anytime TD', 'anytime TD', 'pass TD over', '2+ TD', 'QB INT yes']), split=2),
        T('fun money: first TD singles', 5, 'single', parlay(['first TD']), split=1),
    ]
    B['D. Team 2 lean (~$105/wk)'] = [
        T('2-team RR, 4-5 dog MLs', 20, 'rr2', parlay(['dog ML'] * 5)),
        T('SuperContest 5-team', 15, 'parlay', parlay(['fav spread', 'dog spread', 'fav spread', 'dog spread', 'fav spread'])),
        T('QB-market singles', 30, 'single', parlay(['pass TD over', 'QB INT yes', 'pass TD over']), split=3),
        T('hand-built 2-leg prop tickets', 20, 'parlay', parlay(['anytime TD', 'pass TD over']), split=2),
        T('islands: 1 ticket/game, <=3 legs', 15, 'parlay', [('pass TD over', 0), ('anytime TD', 0), ('QB INT yes', 0)], split=3, sgp=True),
        T('lotto 5-leg', 5, 'parlay', parlay(['anytime TD', 'anytime TD', 'pass TD over', '2+ TD', 'QB INT yes']), split=1),
    ]
    B['E. Same classes as C, all singles (benchmark)'] = [
        T('singles across the same classes', 175, 'single', parlay(['dog ML', 'dog ML', 'pass TD over', 'QB INT yes', 'anytime TD', 'fav spread', 'dog spread', 'anytime TD']), split=8),
    ]
    return B

def sim_ticket(t, E, scen, rho):
    legs = t['legs']; k = len(legs)
    d = np.array([E[c]['med_dec'] for c, _ in legs])
    r = np.array([scen(c) for c, _ in legs]); p = np.clip(r / d, 0.001, 0.999)
    games = [g for _, g in legs]
    # Gaussian copula with same-game correlation rho
    z = RNG.standard_normal((NSIM, k))
    ug = {g: RNG.standard_normal(NSIM) for g in set(games)}
    for i, g in enumerate(games):
        if games.count(g) > 1: z[:, i] = math.sqrt(rho) * ug[g] + math.sqrt(1 - rho) * z[:, i]
    from math import erf
    thr = np.array([np.sqrt(2) * erfinv(2 * pi - 1) for pi in p])
    hit = z < thr
    split = t.get('split', 1); stake = t['stake']
    if t['kind'] == 'single':
        ret = (hit * d).sum(axis=1) * (stake / k)
    elif t['kind'] == 'parlay':
        pay = np.prod(d)
        if t.get('sgp'):
            # books price same-game parlays off the correlated joint probability of their own (vig-inclusive) leg prices
            pb = np.clip(1 / d, 0.001, 0.999); thb = np.array([np.sqrt(2) * erfinv(2 * q - 1) for q in pb])
            pay = 1 / max((z < thb).all(axis=1).mean(), 1e-6)
        ret = hit.all(axis=1) * pay * stake
        if split > 1:   # split = number of different tickets of this template in the week (independent draws)
            tot = np.zeros(NSIM)
            for _ in range(split):
                z2 = RNG.standard_normal((NSIM, k)); ug2 = {g: RNG.standard_normal(NSIM) for g in set(games)}
                for i, g in enumerate(games):
                    if games.count(g) > 1: z2[:, i] = math.sqrt(rho) * ug2[g] + math.sqrt(1 - rho) * z2[:, i]
                tot += (z2 < thr).all(axis=1) * pay * stake / split
            ret = tot
    elif t['kind'] in ('rr2', 'rr4'):
        size = 2 if t['kind'] == 'rr2' else 4
        import itertools
        combos = list(itertools.combinations(range(k), size)); s = stake / len(combos)
        ret = np.zeros(NSIM)
        for cmb in combos:
            ret += hit[:, list(cmb)].all(axis=1) * np.prod(d[list(cmb)]) * s
    return ret

def erfinv(y):
    # Giles (2010) single-precision approximation, good to ~1e-7 for our use
    w = -math.log((1.0 - y) * (1.0 + y))
    if w < 5:
        w -= 2.5; c = [2.81022636e-08, 3.43273939e-07, -3.5233877e-06, -4.39150654e-06, 0.00021858087, -0.00125372503, -0.00417768164, 0.246640727, 1.50140941]
    else:
        w = math.sqrt(w) - 3; c = [-0.000200214257, 0.000100950558, 0.00134934322, -0.00367342844, 0.00573950773, -0.0076224613, 0.00943887047, 1.00167406, 2.83297682]
    p = c[0]
    for ci in c[1:]: p = ci + p * w
    return p * y

def main():
    D = load_all()
    P = [u for u in unique_positions(D['legs']) + unique_positions(D['ai_only']) if u['result'] in ('W', 'L')]
    E = class_edges(P)
    for c in list(E):
        E[c]['cons'] = min(E[c]['shrunk'], R0)   # conservative: no positive edge anywhere
    scen = {'observed (shrunk)': lambda c: E[c]['shrunk'], 'no edge (0.95/leg)': lambda c: R0,
            'conservative (negatives kept, positives -> 0.95)': lambda c: E[c]['cons']}
    out = dict(edges=E, prior=dict(r0=R0, n0=N0), baskets={})
    for bname, tickets in baskets().items():
        out['baskets'][bname] = {}
        stake = sum(t['stake'] for t in tickets)
        for sname, sf in scen.items():
            for rho in ((0.15,) if sname != 'observed (shrunk)' else (0.0, 0.15, 0.35)):
                tot = np.zeros(NSIM); parts = {}
                for t in tickets:
                    r = sim_ticket(t, E, sf, rho); tot += r; parts[t['name']] = dict(stake=t['stake'], ev=float(r.mean() - t['stake']), p_cash=float((r > 0).mean()))
                net = tot - stake
                # 14 remaining weeks (bootstrap weekly nets)
                season = net[RNG.integers(0, NSIM, (20000, 14))].sum(axis=1)
                out['baskets'][bname][f'{sname} | rho={rho}'] = dict(stake=stake, ev=float(net.mean()), ev_pct=float(net.mean() / stake), sd=float(net.std()),
                    p_week_profit=float((net > 0).mean()), p_lose_90=float((tot < 0.1 * stake).mean()), q05=float(np.percentile(net, 5)), q95=float(np.percentile(net, 95)),
                    season_med=float(np.median(season)), season_q05=float(np.percentile(season, 5)), season_q95=float(np.percentile(season, 95)), p_season_profit=float((season > 0).mean()),
                    parts=parts)
    json.dump(out, open(os.path.join(OUT, 't2d_basket.json'), 'w'), indent=1, default=float)
    return out
if __name__ == '__main__':
    o = main()
    for c, e in sorted(o['edges'].items(), key=lambda kv: -kv[1]['shrunk']):
        print(f"{c:14s} n={e['n']:3d} raw {e['raw']:.2f} shrunk {e['shrunk']:.2f} se {e['se']:.2f} z {e['z']:.2f} med_dec {e['med_dec']:.2f}")
    for b, d in o['baskets'].items():
        print('==', b)
        for s, v in d.items():
            print(f"   {s:60s} stake {v['stake']:.0f} EV {v['ev']:+.1f} ({v['ev_pct']*100:+.0f}%) sd {v['sd']:.0f} Pwk+ {v['p_week_profit']:.2f} P(lose>=90%) {v['p_lose_90']:.2f} | 14wk med {v['season_med']:+.0f} [{v['season_q05']:+.0f},{v['season_q95']:+.0f}] P+ {v['p_season_profit']:.2f}")
        v = d['observed (shrunk) | rho=0.15']
        for n, p in v['parts'].items(): print(f"        {n:48s} ${p['stake']:>4} EV {p['ev']:+.1f} P(cash) {p['p_cash']:.2f}")
