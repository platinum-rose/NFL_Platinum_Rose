"""Super Bowl payout matrix for the futures portfolio vs BetOnline 11/10 futures (de-vigged). Read-only. Claude Team 2, 2026-11-10.
Matchup tickets pay when both teams reach the Super Bowl, whoever wins (per the ledger notes)."""
import json, collections, sys
d = json.load(open('data/futures-imports/andy-portfolio-ledger-2026.json'))
rows = json.load(open('data/futures-imports/betonline-2026-11-10.json')); rows = rows if isinstance(rows, list) else next(v for v in rows.values() if isinstance(v, list))
imp = lambda o: 100 / (o + 100) if o > 0 else -o / (-o + 100)
M = {}
for r in rows: M.setdefault(r['market_type'], {})[r['team']] = r['odds']
dv = lambda m: {t: imp(o) / sum(imp(x) for x in M[m].values()) for t, o in M[m].items()}
A, N, S = dv('conference_afc'), dv('conference_nfc'), dv('superbowl')
s = {t: S[t] / C[t] for C in (A, N) for t in C if t in S}
def book(extra=()):
    stake = 0; win = collections.Counter(); mu = collections.Counter()   # win/mu hold stake + profit (return)
    for p in d['positions']:
        if p.get('status') != 'open': continue
        if p['market'] == 'superbowl':
            for t in p['tickets']: stake += t['stake_usd']; win[p['selection']] += t['stake_usd'] + t['to_win_usd']
        elif p['market'] == 'superbowl_matchup':
            stake += p['stake_usd']; mu[frozenset(x.strip() for x in p['selection'].split(' vs '))] += p['stake_usd'] + p['to_win_usd']
    for kind, sel, amt, odds in extra:
        stake += amt; ret = amt * (1 + odds / 100)
        if kind == 'sb': win[sel] += ret
        else: mu[frozenset(sel)] += ret
    return stake, win, mu
def evaluate(extra=()):
    stake, win, mu = book(extra); EV = 0; lose = 0; cells = []
    for a, pa in A.items():
        for n, pn in N.items():
            h = s[a] * (1 - s[n]) / (s[a] * (1 - s[n]) + s[n] * (1 - s[a])); pm = pa * pn
            for w, pw in ((a, h), (n, 1 - h)):
                net = win.get(w, 0) + mu.get(frozenset((a, n)), 0) - stake; P = pm * pw
                EV += P * net; lose += P * (net < 0); cells.append((P, a, n, w, round(net, 2)))
    return dict(stake=round(stake, 2), ev=round(EV, 2), p_loss=round(lose, 3), p_break_even_or_better=round(1 - lose, 3)), cells
if __name__ == '__main__':
    base, cells = evaluate()
    print('BASE', base)
    J, F, CIN, BUF = 'Jacksonville Jaguars', 'San Francisco 49ers', 'Cincinnati Bengals', 'Buffalo Bills'
    fair = lambda a, b: round((1 / (A.get(a, N.get(a)) * N.get(b, A.get(b))) - 1) * 100)
    print('fair SF/JAX matchup', fair(J, F), '| fair SF/CIN', fair(CIN, F))
    C = {'SF/JAX matchup $26.40 @ +1500': [('mu', (J, F), 26.40, 1500)],
         'JAX SB $20 @ +750': [('sb', J, 20, 750)],
         'SF SB $20 @ +585': [('sb', F, 20, 585)],
         'BUF SB $17.39 @ +590': [('sb', BUF, 17.39, 590)],
         'SF/CIN matchup $10 @ +2400': [('mu', (CIN, F), 10, 2400)],
         'package: SF/JAX $26.40 @+1500 + BUF SB $17.39 @+590 + JAX SB $20 @+750': [('mu', (J, F), 26.40, 1500), ('sb', BUF, 17.39, 590), ('sb', J, 20, 750)]}
    for k, v in C.items(): print(f'{k:80}', evaluate(v)[0])
    json.dump(dict(base=base, cells=[dict(p=round(c[0], 5), afc=c[1], nfc=c[2], winner=c[3], net=c[4]) for c in sorted(cells, reverse=True)[:120]]),
              open('reports/bets/futures-matrix-w10-2026-11-10.json', 'w'), indent=1)
